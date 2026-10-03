---
status: accepted
date: 2026-09-28
---

# TypeScript on Cloudflare, with D1 as the database

The system is built in TypeScript and runs entirely on Cloudflare: Workers for compute, D1 for relational data, R2 for files, Browser Rendering for document generation, Workflows for Payroll Runs, Cron Triggers for scheduled work, and AI Gateway in front of the Anthropic API.
The application is React Router v8 with Hono for the API, Tailwind and shadcn/ui for the interface, and staff authenticate by one-time code sent to the phone number on their Person record.
The full mapping and its consequences are in [`../architecture.md`](../architecture.md).

## Considered options

Postgres behind Hyperdrive was the main alternative to D1, offering real `NUMERIC` and `DATE` types and a more conventional handover story.
It was rejected because the data is tiny - under 10,000 rows a year at Talabon's current headcount of fewer than twenty, with every file in R2 - and because both of its advantages evaporate on inspection.
The `NUMERIC` advantage disappears once money is stored as integers ([ADR 0007](./0007-money-is-whole-naira-net-pay-rounds-up-to-100.md)), and the latency advantage does not exist at all: D1 has no African region, and neither does any managed Postgres, so a write from Lagos crosses to Europe either way.
What remained was one fewer vendor, no connection pooling, and 30-day point-in-time recovery included.

## Consequences

**Every write from Lagos costs roughly 100-150 ms.**
No serverless database runs in Africa, so this is a property of the geography rather than of Cloudflare, and switching providers does not fix it.
The application must be written for few round trips per page: batched statements, and optimistic UI updates on Attendance marking and Task confirmation so the press floor does not feel it.
Code that issues ten sequential queries per page render will be unusable.

**A Payroll Run is a Workflow instance, not a request handler.**
`waitForEvent()` provides the human approval gate natively, and completed steps do not re-run after a failure, so a crash mid-payroll does not recompute everyone.
The immutability [ADR 0003](./0003-permanent-pay-computed-casual-pay-recorded.md) requires falls out of the workflow's own state.

**Documents are HTML Templates rendered to PDF by Browser Rendering.**
This suits the versioned `Template` requirement in [ADR 0004](./0004-employment-events-are-primary.md) well, since an HTML template is diffable and lives in version control.
Browser time is capped daily on the free plan, so bulk payslip generation must be sequential steps within the Payroll Run workflow rather than a single burst.

**The system starts on the Workers Free plan** and upgrades only when a limit actually bites.
Phase 1 and most of phase 2 fit, but only because of three choices that would otherwise look arbitrary: SPA mode rather than server rendering, Payroll Runs as Workflows rather than one handler, and files in R2 rather than the database.

The free plan allows 10 ms of CPU per request, and Cloudflare documents server rendering at 10-20 ms, so **React Router runs in SPA mode (`ssr: false`)**.
This also keeps the React bundle out of the 3 MB Worker size limit by shipping it as static assets.
Nothing is lost: server rendering buys first paint and SEO, and every page here is behind a login.
It is treated as the destination rather than a stepping stone, because moving loaders and actions between client and server later is not a free switch.

The one free-tier limit with real teeth is D1's 5 million rows read per day, [enforced since 1 September 2026](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/) by failing queries rather than warning.
D1 counts rows scanned rather than returned, so this is an indexing discipline, not a data volume question, and a Payroll Run is the worst possible moment to discover a full table scan.

**Next.js was rejected.**
Workers run V8 isolates rather than Node, so a Node framework needs an adapter between the code and the runtime.
Everything Next.js exists to solve - server rendering, static generation, SEO - is irrelevant to an internal tool behind a login, and the adapter charges a slower dev loop and a bundle ceiling for that irrelevance.

React Router v8 was chosen over a bare React SPA because this application is almost entirely forms, which is what its `action` model is for, and because per-route `loader`s naturally batch queries per page.
That last point is not cosmetic: given the Lagos-to-Europe round trip, a page built from a dozen component-level fetches is unusable, and a framework that makes batching the default path is doing real work.

**Login depends on an SMS or WhatsApp provider.**
One-time codes mean the phone number on a Person record is a security credential rather than contact data, so changing it must require verification.
It also means that when the sending provider is down, nobody can log in at all.
