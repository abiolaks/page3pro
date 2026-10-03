# Tech Stack and Coding Standards

The contract every implementation in this repo must follow.
It layers coding standards on top of decisions already recorded in [`architecture.md`](./architecture.md), [`requirements.md`](./requirements.md), and the [ADRs](./adr/).
Where this doc and an ADR disagree, the ADR wins.

Read [`CONTEXT.md`](../CONTEXT.md) before writing any code.
Its vocabulary is the target model, not a style suggestion.

## 1. The stack

Decided by [ADR 0006](./adr/0006-typescript-on-cloudflare.md) and [`architecture.md`](./architecture.md).
Do not substitute these without reopening the ADR.

| Concern | Choice |
|---|---|
| Language | TypeScript, strict |
| Runtime | Cloudflare Workers, single Worker serving API + static assets |
| Front end | React Router v8, SPA mode (`ssr: false`) |
| API | Hono, with the RPC client sharing types into React |
| UI | Tailwind + shadcn/ui |
| Database | D1 (SQLite) |
| Files | R2, with the key stored in the row |
| PDF generation | Browser Rendering (HTML Template to PDF) |
| Payroll Runs | Workflows (phase 2) |
| Scheduled work | Cron Triggers |
| AI | Anthropic SDK through AI Gateway |
| Plan | Workers Paid (PBKDF2 does not fit free, measured in ADR 0008) |
| Tests | Vitest against a real D1 |

## 2. Domain language

Use the `CONTEXT.md` term for every domain concept, in code, routes, tests and messages.
Never drift to a synonym the glossary marks `_Avoid_`.

Examples:

| Say | Never |
|---|---|
| `Person` | Employee, Staff, Worker, User |
| `Engagement` | Employment, Contract, Job, Position |
| `Employment Event` | Action, Change, Update, Transaction |
| `Document` | Letter, File, Paperwork, Attachment |
| `Missed Day` | Absence, Absenteeism, Sick day, No-show |
| `Net Pay` | Take-home, Salary, Gross |
| `Approving Role` | Permission, Admin, Authoriser |

If the concept you need is not in `CONTEXT.md`, stop and reconsider before inventing language.
A genuine gap is a signal for `/domain-modeling`, not a licence to improvise.

## 3. Storage conventions

Fixed by [ADR 0006](./adr/0006-typescript-on-cloudflare.md) and [ADR 0007](./adr/0007-money-is-whole-naira-net-pay-rounds-up-to-100.md).
These are set in the first migration, never discovered later.

| Kind | Representation |
|---|---|
| Money | Integer, whole naira. Never float, `REAL`, kobo or decimal |
| Date and time | TEXT, ISO 8601 |
| Boolean | INTEGER 0 or 1 |
| Enumeration | TEXT with a CHECK constraint |
| Files | R2 key in the row, bytes never in the database |

## 4. Module boundaries

Fixed by [`requirements.md`](./requirements.md) section 4.4.

- Six modules own their own tables and expose intent, not rows: Identity, People, Documents, Time, Work, Pay.
- Self-service is a read-only composition over the others, scoped to one Person, owning no tables.
- Phase 1 builds only Identity, People, Documents and Self-service.
- Every read goes through one scoped data-access layer that cannot express an unscoped read.
- A missing `WHERE person_id = ?` in a route handler would leak the whole record, so scoping is structural, not each route's job to remember.

## 5. The draft and committed seam

Fixed by [`requirements.md`](./requirements.md) section 4.3 and [ADR 0009](./adr/0009-a-person-sees-their-own-committed-record.md).

- Any entity that can exist uncommitted carries a lifecycle state, and self-service reads filter on committed.
- A model's proposal lives in a separate column from the human-owned field, never shown to the subject.
- Every AI-written field records provenance: which model produced it and whether a human edited it.

## 6. Money

- Every monetary value is an integer number of whole naira.
- Components stay exact; only the final `Net Pay` rounds, and only upward to the next N100 (phase 2, [ADR 0007](./adr/0007-money-is-whole-naira-net-pay-rounds-up-to-100.md)).
- Money formatting and parsing live in one module; no code path formats naira inline.
- Money constants (the N100 rounding, a Grade figure) are named, never magic numbers.
- No float may ever appear in a money expression, even as an intermediate.

## 7. TypeScript

- Strict mode on. No `any`, no `as unknown as T`, no `as` used to silence a real type error.
- Exported functions declare their return type.
- Lifecycle states are discriminated unions, not strings plus ad hoc checks.
- The `Env` type is generated with `wrangler types`; never hand-written.
- Never use `any` on `Env`, handler parameters, or binding access.

## 8. Module design: deep modules

Use the deep-module discipline from the `codebase-design` skill.

- A module is deep when a lot of behaviour sits behind a small interface.
- The interface is everything a caller must know: signature, invariants, ordering, error modes, configuration, performance.
- Accept dependencies, do not construct them internally.
- Return results, do not produce side effects.
- Apply the deletion test: if deleting a module moves complexity into its callers, it was earning its keep; if the complexity vanishes, it was a pass-through.
- One adapter means a hypothetical seam. Do not introduce a seam unless something actually varies across it.

## 9. Workers-specific rules

From the `workers-best-practices` skill. These are hard rules, not preferences.

- Never store request-scoped state in module-level variables.
- No floating promises: every Promise is `await`ed, `return`ed, `void`ed, or passed to `ctx.waitUntil()`.
- Use in-process bindings (D1, R2), never the Cloudflare REST API from inside a Worker.
- Do not destructure `ctx`; call `ctx.waitUntil()` on the context object.
- Use Web Crypto for randomness and tokens; never `Math.random()` for anything security-related.
- Compare secrets with `crypto.subtle.timingSafeEqual`, never a plain string comparison.
- Stream large or unknown payloads; never buffer unbounded data with `response.text()`.
- Secrets come from `wrangler secret put`, never hardcoded in config or source.
- Emit structured JSON logs and enable `observability` in config.
- No `ctx.passThroughOnException()`; write explicit error handling instead.

## 10. Latency and data discipline

The Lagos-to-Europe round trip is 100-150 ms, so round trips are the budget.

- One batched query per route loader, not a dozen component-level fetches.
- Use D1 `batch()` for multiple statements in one trip.
- Use a D1 session (`withSession()`) where read-after-write consistency matters.
- Index every foreign key and every column used in a `WHERE`, from the first migration.
- Check `EXPLAIN QUERY PLAN` on anything touching high-volume tables.
- Use optimistic UI updates for high-frequency marks (Attendance, Task confirmation) in phase 2 and 3.

## 11. Security

The `/codeguard` ruleset is the authoritative checklist.
Read it before writing security-sensitive code and run `/codeguard-review` afterwards.

At minimum:

- Never hardcode a secret, token or key.
- SQL is parameterised only (D1 prepared statements); never string concatenation.
- Validate and normalise input at the boundary.
- Authorisation is structural, through the scoped data-access layer, not a per-route check.
- A credential (phone number, password, TOTP) is never treated as ordinary contact data.

## 12. Error handling

- Handle errors explicitly; do not use exceptions for control flow.
- Return typed results for expected domain failures (for example, salary outside the Grade's band).
- Never swallow an error silently; log with context and return a structured response.
- No `ctx.passThroughOnException()`; it hides bugs.

## 13. Testing

From the spec's testing decisions.

- The single seam is the Hono API, exercised against a real D1.
- Test external behaviour, never implementation internals; refactoring a module must not break its tests.
- Write red-green: a failing test first, then only enough code to pass.
- Test the invariants from [`requirements.md`](./requirements.md) section 4.6 directly.
- The scoped-access guarantee is tested through the API: cross-person reads must be impossible.

## 14. Code smells that must not ship

- `any`, `as` used to silence errors, `as unknown as T`.
- Long functions, god modules, deeply nested conditionals.
- Duplicated money, date or scoping logic.
- Magic numbers, especially money constants.
- Shallow pass-through modules with a big interface and no behaviour.
- Commented-out code and dead code.
- Synonym drift away from the `CONTEXT.md` vocabulary.
- Premature abstraction, or a seam with only one adapter.

## 15. Definition of done

A change is not done until all of these hold:

- `tsc --noEmit` is clean.
- Lint is clean, including `no-floating-promises`.
- Tests are green.
- The invariants it touches still hold.
- No new synonym drift from the glossary.
- Security-sensitive changes have passed `/codeguard-review`.

## 16. Build order: correct first, polish later

Get the app running and correct before making it beautiful.
Look and feel is a skin added later, not a tax paid upfront.

- Cosmetic decisions are deferred freely: colours, typography, spacing, icons, animation, empty-state art, dashboard layout. Changing them later is restyling, not a rewrite.
- Structural decisions are the product, not the paint, and are decided now, not later: the forms-first SPA model, the self-service view, and the honest-states principle (an unsigned Document looks outstanding, a draft looks different from a committed fact).
- shadcn/ui and Tailwind are modular and themeable by design, so the later polish pass is focused and does not touch the logic underneath.

