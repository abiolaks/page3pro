# Architecture: TypeScript on Cloudflare

How Talabon People Operations maps onto the Cloudflare platform, what needs deciding, and what will bite.

Read [`CONTEXT.md`](../CONTEXT.md) and the [ADRs](./adr/) first.

## The mapping

Every part of this system has a Cloudflare primitive. Nothing here needs a workaround.

| What the system needs | Cloudflare product | Notes |
|---|---|---|
| Web app, phone and desktop | Workers + Static Assets | One Worker serves the API and the built front end |
| Relational data | D1 | SQLite. Data volume here is tiny, see below |
| Signed scans, generated PDFs | R2 | D1 stores only the R2 key, never the file |
| Document generation | Browser Rendering | HTML Template rendered to PDF via Puppeteer |
| Payroll Runs | Workflows | Durable multi-step execution with a human approval gate |
| Daily digest, nightly checks, weekly drafting | Cron Triggers | Scheduled handlers on the same Worker |
| Sessions | KV or D1 | Open decision, see below |
| Claude calls | Anthropic TypeScript SDK through AI Gateway | Gateway gives caching, retries and per-feature cost tracking |

## The one place the fit is unusually good

**Cloudflare Workflows maps almost exactly onto a Payroll Run.**

[ADR 0003](./adr/0003-permanent-pay-computed-casual-pay-recorded.md) says a Payroll Run computes, produces a Payment Schedule, and becomes immutable once approved by a human.
That is a durable multi-step process with a pause in the middle, which is precisely what Workflows is for.

```
Workflow: PayrollRun
  step.do   gather active Engagements for the period
  step.do   compute each: salary, Premiums, Output Bonus, Missed Days, Loan repayment
  step.do   run the AI pre-flight check, write the brief
  step.do   assemble the Payment Schedule
  waitForEvent  <- a human with an Approving Role approves or rejects
  step.do   mark the Run approved and immutable, generate payslips
```

`waitForEvent()` is the approval gate, natively. Steps that already succeeded do not re-run if a later step fails, so a crash halfway through payroll does not recompute everyone already done. The immutability requirement falls out of the workflow's own state rather than needing to be enforced separately.

## Four things that need a decision or will bite

### 1. Money must be integers. This is not optional.

Two gaps compound here: SQLite has no `DECIMAL` type, and JavaScript has no decimal type either.
Nothing in this stack will stop `0.1 + 0.2` from being wrong in a payroll calculation.

**Store every monetary value as an integer number of whole naira.**
A salary of ₦180,000 is `180000`. A Missed Day deduction of ₦2,500 is `2500`.
Kobo do not exist in this system, so there is no fractional part for floating-point arithmetic to corrupt, and no money column is ever `REAL`.

This closes the gap completely rather than merely managing it, because the business genuinely does not transact in kobo.
See [ADR 0007](./adr/0007-money-is-whole-naira-net-pay-rounds-up-to-100.md), which also fixes the one rounding rule that applies on top: the final Net Pay of a Payroll Run rounds up to the next ₦100, as an explicit payslip line, with every component left exact.

While we are in SQLite's type system: dates are TEXT in ISO 8601, booleans are INTEGER 0/1, and enumerations are TEXT with a CHECK constraint.
None of these are problems, but all three must be conventions from the first migration rather than discovered later.

### 2. Next.js was rejected in favour of React Router

Cloudflare Workers do not run Node.js.
They run V8 isolates with web-standard APIs only, so a framework written for Node needs an adapter that polyfills Node built-ins and restructures the build output.
Next.js is such a framework: Cloudflare's recommended path is now the [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) Vite plugin, with the older [OpenNext adapter](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) requiring manual Wrangler configuration.
Both work, and both put a translation layer between the code and the runtime that lags whatever it adapts.

Next.js was rejected on two grounds.
Everything it exists to solve - server rendering, static generation, incremental revalidation, image optimization, SEO - is irrelevant to an internal tool behind a login used by under twenty people.
And what it charges for that irrelevance is a slower dev loop, a bundle-size ceiling, and a dependency on adapter fidelity.

**The stack is [React Router v8](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/) with Hono for the API, Tailwind and shadcn/ui for the interface.**

React Router has first-party Cloudflare support through `@cloudflare/vite-plugin` and no adapter layer.
It was chosen over a bare React SPA because this application is almost entirely forms - leave requests, Task confirmation, Attendance marking, Loan applications, Document issuance, Output Logs, Reports - and every one of those screens is show a form, validate, submit, redirect or show errors, which is precisely what an `action` is.

The `loader` model also does real work against the latency problem in section 3.
Per-route loaders naturally produce one batched query per page instead of a dozen component-level fetches.
In a bare SPA the same discipline has to be imposed by hand, and will not survive contact with a deadline.

Hono carries the API in both cases.
Its RPC client shares types directly from the API definitions into the React code, so changing a payroll field breaks the build rather than production.

Note that **v8 is the current baseline, not v7**: v8 removed the React Router Cloudflare dev proxy in favour of `@cloudflare/vite-plugin`, and requires Wrangler 4 and Vite 7 or later.
Most tutorials in circulation are written against v7.

**React Router runs in SPA mode (`ssr: false`), not server rendering.**
This is forced by the free tier and kept by choice.
The Workers Free plan allows 10 ms of CPU per request, and Cloudflare's own documentation puts server rendering at 10-20 ms, so SSR would sit permanently at or over the limit.
Server rendering also pulls the React server bundle into the Worker, which is capped at 3 MB on free.

In SPA mode the Worker serves static assets, which are free and unlimited, plus small JSON responses from Hono, which cost almost no CPU.
Route `loader`s become client loaders calling the Hono API, so the one-batched-query-per-page discipline survives intact - the browser makes one call per route and the API makes one batched D1 query behind it.

Nothing is lost that this application wanted.
Server rendering buys first-paint speed and SEO for public pages; every page here is behind a login.
Turning SSR on later is possible but is not a free switch, since loaders and actions move between client and server, so treat SPA mode as the destination rather than a stepping stone.

### 3. No serverless database runs in Africa

D1 location hints cover Western Europe, Eastern Europe, Asia Pacific, Oceania, Western North America and Eastern North America.
[Africa, South America and the Middle East are explicitly not available](https://developers.cloudflare.com/d1/configuration/data-location/), and read replicas only appear in regions where D1 runs.

So a write from Lagos travels to Western Europe and back, roughly 100 to 150 ms per round trip.

**This is a geography problem, not a Cloudflare problem.**
Neon, Supabase and managed Postgres have the same gap, so switching database vendors does not fix it.
It is a wash between D1 and Hyperdrive-plus-Postgres, which removes the main argument against D1.

What it does change is how the app should be written.
Design pages to need few database round trips rather than many small ones, use D1's `batch()` to bundle statements into one trip, and use optimistic UI updates for attendance marking and task confirmation so the floor does not feel the latency.
Ten sequential queries per page render is fine in Lagos on a local server and unusable from Lagos to Frankfurt.

Set the primary explicitly with `wrangler d1 create talabon --location=weur` rather than letting it be inferred from wherever the database happened to be created.

### 4. Browser Rendering has a daily budget on the free tier

[10 minutes of browser time per day on free, unlimited on paid](https://developers.cloudflare.com/browser-rendering/) subject to fair use, with 3 concurrent sessions free and 30 paid.

For ordinary use, roughly 200 documents a month or about seven a day, this is comfortable: a letter renders in a couple of seconds, so the daily budget covers well over a hundred.

The pinch is bulk work.
Twenty payslips at the end of a Payroll Run is fine on browser minutes but hits the free plan's 6 requests per minute, so the run takes three or four minutes of wall time.
That is acceptable for a monthly job and unacceptable for anything a human is waiting on, and it grows linearly with headcount.

Two mitigations, both worth doing regardless of plan: launch one browser and open multiple pages rather than one browser per document, and generate payslips as sequential Workflow steps rather than in a burst.

## Why D1 rather than Postgres

The data here is small enough that the usual argument does not apply.
Talabon has fewer than twenty people today, who generate roughly 500 Attendance rows a month, a hundred or so Tasks and Output Logs, and twenty payslips.
Call it under 10,000 rows a year, so well under 100,000 after a decade, with every file living in R2 rather than the database.
Every figure in this document is stated at current headcount, and none of the limits below come into view until somewhere past a hundred people, so hiring does not invalidate any of it.
Even the free plan's 5 GB account-wide storage is several orders of magnitude more than this system will ever need, and the 10 GB per-database ceiling never comes into view.

Against that, Postgres would give real `NUMERIC` and `DATE` types and a more familiar handover story.
The `NUMERIC` argument is weakened by storing money as whole-naira integers anyway, and the latency argument is neutralised by the Africa gap.
What remains is one fewer vendor, no connection pooling to manage, Time Travel point-in-time recovery for 30 days included, and no separate database bill.

Revisit only if a genuine reporting workload appears that SQLite cannot serve.

## Claude integration

The Anthropic TypeScript SDK is fetch-based and runs in Workers without Node compatibility shims.

Route all calls through [AI Gateway](https://developers.cloudflare.com/ai-gateway/) rather than calling the API directly.
It costs nothing and gives caching, automatic retries, rate limiting, and per-request logging.
The last of those matters most here: [`ai-roadmap.md`](./ai-roadmap.md) projects roughly $33-53 a month across seven features, and the Gateway is what turns that projection into a measured number per feature.

Model default is `claude-opus-5` with adaptive thinking. Batch API for report and review drafting, which are not latency-sensitive.

## Authentication

Everyone gets a login, and nothing external has to be reachable for it to work.

Staff sign in with the phone number already held on their Person record plus a password, on a personal smartphone or a shared company desktop.
Holders of an Approving Role add a TOTP authenticator app.
Passwords are set and reset in person by HR, which is trivially reasonable at under twenty people on one site and avoids needing a delivery channel.
See [ADR 0008](./adr/0008-login-depends-on-no-external-provider.md).

Four consequences.

The phone number stops being contact data and becomes a security credential, so changing it is an HR action against a verified identity rather than an ordinary profile edit.

Hashing is PBKDF2 through Web Crypto, and the free plan's 10 ms CPU ceiling may not accommodate a sound iteration count.
Verify with a spike early; if it does not fit, move to Workers Paid rather than weakening the hash.

Sessions are revocable rows in D1 with a short idle expiry and no persistent sign-in, because the shared desktop means the person who walks away is not always the person who sits down next.

An SMS or WhatsApp provider is now a phase 2 notification choice rather than a dependency of logging in, so its outage costs someone an update instead of stopping the business.

## Another D1 behaviour worth knowing

D1 is eventually consistent, so a read immediately after a write may not see it.
For anything where that matters - and a Payroll Run is exactly that - use a D1 session, which guarantees read-after-write consistency within the session.

```typescript
const session = env.DB.withSession();
// writes and subsequent reads in this session see each other
```

## Running on the free plan

The system needs the Workers Paid plan from phase 1, at five dollars a month, because password hashing does not fit the free plan's 10 ms CPU ceiling and weakening the hash is not an option ([ADR 0008](./adr/0008-login-depends-on-no-external-provider.md)).
Login is the only thing forcing it.
Everything else below fits the free plan with room to spare, so the table is still worth reading as a map of what would eventually bite.
Three design choices above are what make that true, and none of them are compromises: SPA mode rather than server rendering, Payroll Runs as Workflows rather than one large handler, and files in R2 rather than the database.

| Limit | Free plan | Talabon's expected load | Headroom |
|---|---|---|---|
| Worker requests | 100,000 / day | ~4,000 / day at under 20 staff | Comfortable. Static asset requests are free and uncounted |
| Worker CPU | 10 ms / request | JSON responses, a few ms. Password hashing, far more | Fine in SPA mode for ordinary requests. **Login is the exception** - see ADR 0008 |
| Subrequests | 50 / request | A batched page query is a handful | Comfortable, because payroll is split across Workflow steps |
| Worker size | 3 MB | Hono plus handlers | Comfortable. The React bundle ships as static assets, not Worker code |
| D1 rows written | 100,000 / day | ~500 / month | Enormous headroom |
| D1 rows read | 5,000,000 / day | Depends entirely on indexing | **The one to watch** |
| D1 storage | 5 GB account-wide | Megabytes | Never a factor |
| Browser Rendering | 10 min / day, 6 req/min | ~7 documents / day | Fine daily. The rate limit stretches bulk payslip runs |
| Workflows | Available, 3-day state retention | Monthly and weekly runs | Fine, though failed-run forensics expire quickly |

**Rows read is the only real risk, and it is a discipline problem rather than a volume problem.**
D1 counts rows *scanned*, not rows returned, so one unindexed query inside a loop can read more rows in an afternoon than the whole business generates in a decade.
Since 1 September 2026 these limits are [enforced rather than advisory](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/): queries simply fail once the cap is hit, which during a Payroll Run would be a bad day.
Index every foreign key and every column used in a `WHERE` from the first migration, and check `EXPLAIN QUERY PLAN` on anything that touches Attendance or Output Logs.

### What will actually force the upgrade

In rough order of likelihood: Browser Rendering minutes during a heavy document month, D1 rows read if indexing slips, then everything else a long way behind.
None of these arrive in phase 1.

Worth keeping in proportion: **Workers Paid is $5 a month.** That is smaller than the monthly SMS bill for login codes. Start free to prove the thing works, but do not contort the design to stay there.

**The AI features are not covered by any of this.** Anthropic is billed separately with no free tier, at roughly $1 a month for the single phase 1 feature and $29-49 once everything in [`ai-roadmap.md`](./ai-roadmap.md) is live, nearly all of which is the query agent rather than headcount.

## Still open

- **SMS or WhatsApp provider**, deferred to phase 2 and now a notification channel only, between Termii and Africa's Talking. Nothing blocks on it, since [ADR 0008](./adr/0008-login-depends-on-no-external-provider.md) took it out of the login path.
- **Rounding rules wherever division occurs**, such as a Loan repayment split across months or a salary pro-rated for a partial period. These are exact-naira decisions, separate from the ₦100 rule in [ADR 0007](./adr/0007-money-is-whole-naira-net-pay-rounds-up-to-100.md), and each needs settling before payroll is built.

Resolved since first draft: PBKDF2 does not fit the free plan's 10 ms CPU ceiling at any sound iteration count, so login requires Workers Paid. Measured in [ADR 0008](./adr/0008-login-depends-on-no-external-provider.md).

## Sources

- [Next.js on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext adapter](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/)
- [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)
- [Browser Rendering](https://developers.cloudflare.com/browser-rendering/)
