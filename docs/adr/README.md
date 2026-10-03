# ADR index

Decisions for this repo, in the order they were made.
Before writing code, find the decisions that touch the module you are working on here, then read those ADRs in full - not this summary.

The rule from `../AGENTS.md`: where `tech-stack.md` and an ADR disagree, the ADR wins.

## By module

| Touching | Read |
| --- | --- |
| Identity (login, sessions, credentials, TOTP) | 0006, 0008 |
| People (Person, Engagement, Grade, Employment Event) | 0001, 0004, 0010 |
| Documents (Template, Document, Policy, Job Description) | 0004 |
| Time (calendars, Attendance, Leave) | 0009 |
| Work (Print Job, Output Log, Task, Report) | 0001, 0010 |
| Pay (Payroll Run, Loan, Payment Schedule, Payment) | 0002, 0003, 0007, 0011 |
| Self-service | 0009 |
| The `ai` module and any model call | 0005, 0012, 0013 |
| Any money field, anywhere | 0007 |
| Any schema or platform decision | 0006 |

## The decisions

| ADR | Decision | Read before writing code that ... |
| --- | --- | --- |
| [0001](./0001-people-operations-scope.md) | People operations only, Print Job reduced to a verification record | adds scope, a table, or anything commercial |
| [0002](./0002-payroll-withholds-nothing-and-moves-no-money.md) | Payroll withholds nothing statutory and never moves money | touches Pay, a Payment, or any disbursement |
| [0003](./0003-permanent-pay-computed-casual-pay-recorded.md) | Permanent pay is computed, casual pay is recorded | computes pay or links a Task to money |
| [0004](./0004-employment-events-are-primary.md) | Employment Events are primary, Documents rendered from them | touches an Employment Event, Template, or letter |
| [0005](./0005-ai-drafts-humans-commit.md) | AI drafts, humans commit, rules decide | builds any AI feature |
| [0006](./0006-typescript-on-cloudflare.md) | TypeScript on Cloudflare, D1 as the database | makes a stack, schema, or dependency decision |
| [0007](./0007-money-is-whole-naira-net-pay-rounds-up-to-100.md) | Money is whole naira, Net Pay rounds up to the nearest ₦100 | adds a money field, computation, or display |
| [0008](./0008-login-depends-on-no-external-provider.md) | Login depends on no external provider | touches login, sessions, credentials, TOTP, or PBKDF2 |
| [0009](./0009-a-person-sees-their-own-committed-record.md) | A Person sees their own committed record | touches self-service, read scoping, or draft visibility |
| [0010](./0010-the-mvp-covers-permanent-engagements-only.md) | The MVP covers Permanent Engagements only | touches Casual Engagement, Task, a spend cap, or the digest |
| [0011](./0011-a-payment-schedule-line-records-its-own-execution.md) | A Payment Schedule line records its own execution | touches Payment Schedule execution or bank hand-off |
| [0012](./0012-model-routing-in-code-not-in-the-gateway.md) | Model routing lives in code, not in the gateway | touches the `ai` module or names a model |
| [0013](./0013-ai-guardrails-defense-in-depth.md) | AI guardrails are defense in depth | touches the `ai` module, D1 roles, or gateway config |

## Using this index

The lookup is meant to be mechanical, not a memory test.
If the module table says "Pay", read 0002, 0003, 0007 and 0011 - all four - before writing the first line of the Pay module.
If you are touching money in any module, read 0007 as well, because the ₦100 rule is cross-cutting.

When a new ADR is added, add it here in the same session that writes the ADR.
An ADR absent from this index is an ADR an agent will not reliably find.
