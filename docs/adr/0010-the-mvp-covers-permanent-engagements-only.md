---
status: accepted
date: 2026-10-03
---

# The MVP covers Permanent Engagements only

The MVP models `Permanent Engagement` and nothing else.
`Casual Engagement`, and the cash-on-the-floor payment flow it implies, is deferred to a later stage.

This is a scope decision about what gets built first.
It is not a change to the domain model, and `Casual Engagement` stays defined in `CONTEXT.md` for a reason given below.

## What this removes from the MVP

The casual half of [ADR 0003](./0003-permanent-pay-computed-casual-pay-recorded.md) is deferred whole: priced work, cash handed over on the floor, a `Payment` written afterwards with settled `Task`s attached, and the per-supervisor spend cap that gates it.

`Task` stays, because the domain already needs it for people on a salary.
A `Report` is pre-filled with Attendance, Tasks and Output Logs, and so is a `Performance Review`, so Tasks are not casual-only machinery.
What Tasks lose in the MVP is their money dimension: no agreed amount, no pay effect, no settlement.
A Task in the MVP is a unit of assigned work that a Manager confirms, and nothing about pay depends on it.

`Print Job` and `Output Log` are untouched, because `Output Bonus` is a `Pay Addition` on a permanent payslip and verified output volume is what earns it.

`Loan` is untouched, because it was already restricted to a `Permanent Engagement`.
ADR 0003's reasoning holds either way: lending against a pay stream the system does not control would make the balance uncollectable.

## What must not be simplified away

Deferring casual work is nearly free, but only if the shape of the model survives it.
Three things will look like dead weight to someone building the MVP and must stay anyway.

**`Engagement` remains its own entity with a kind, even though only one kind is used.**
The temptation is to put salary, job title and Grade directly on `Person` and delete a join that currently buys nothing.
That is the one change that would make casual expensive to add later, and it breaks more than casual: [ADR 0004](./0004-employment-events-are-primary.md) hangs Employment Events off the terms in force, and [ADR 0009](./0009-a-person-sees-their-own-committed-record.md) shows a person their history under the terms it happened under.

**A `Person` may still have several `Engagement`s over time.**
This is true of permanent staff on their own: someone leaves and is rehired, and the second Engagement is a new set of terms rather than an edit to the first.
Nothing may assume one Engagement per Person, and nothing may assume the active one is the only one.

**`Payment` and `Payment Schedule` stay distinct types.**
ADR 0003 already warns that code must not treat them as variants of one thing, and with the casual flow gone the warning gets easier to ignore rather than less true.

## An open question this exposes

With the casual flow deferred, `Payment` has almost nothing left to do, since its definition centres on the `Task`s it settles.

That leaves a real gap.
[ADR 0002](./0002-payroll-withholds-nothing-and-moves-no-money.md) means the system hands a `Payment Schedule` to a human and never moves money itself, so without some record of execution the system knows only what it *instructed*, never what happened.
A failed or skipped bank transfer would be invisible to it, and a person asking "was I paid?" could not be answered from the record.

**Recommendation: keep a per-Engagement execution mark against the approved `Payment Schedule`.**
It is small, it keeps the system honest about the difference between an instruction and an outcome, and it gives [ADR 0009](./0009-a-person-sees-their-own-committed-record.md)'s self-service view something truthful to show next to a payslip.
Whether that mark is a reduced `Payment` or a field on the Schedule is a modelling detail to settle when payroll is built.

## Consequences

Phase 1 of the AI roadmap is entirely unaffected, since signed-document scan verification has nothing to do with pay basis.

The daily exceptions digest in phase 2 is deferred along with casual work.
Its stated purpose was to be the detective control that gives ADR 0003's spend cap teeth, and its content was Tasks created, priced, confirmed and paid by supervisor.
Permanent-side exception reporting is already covered by the payroll pre-flight check, which makes that the single phase 2 AI feature rather than one of two.

`Casual Engagement` stays in `CONTEXT.md`.
Casual workers exist at Talabon whether or not the MVP models them, and deleting the term would make the vocabulary describe the software instead of the business.
The vocabulary is the target model; this ADR is the build order.
Keeping them separate is what lets scope be cut without the language drifting.

The MVP's user count is the permanent subset of a workforce already under twenty, so every free-tier and cost figure elsewhere in these docs is now conservative rather than tight.
