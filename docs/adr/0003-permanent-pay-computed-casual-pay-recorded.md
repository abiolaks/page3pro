---
status: accepted
date: 2026-09-28
note: the casual half is deferred past the MVP by ADR 0010
---

# Permanent pay is computed, casual pay is recorded

> **Scope note.** [ADR 0010](./0010-the-mvp-covers-permanent-engagements-only.md) defers `Casual Engagement` past the MVP.
> The decision below stands as the target model, and the permanent half of it is what gets built first.
> Nothing here is reversed; the casual half is simply not yet implemented.

The two kinds of `Engagement` run their pay in opposite directions, and this is deliberate rather than an inconsistency waiting to be tidied up.
For a `Permanent Engagement` the system decides: it holds the salary band, the attendance record, the loan balance and the bonus formula, so it computes `Net Pay` and produces an authoritative `Payment Schedule` before payday.
For a `Casual Engagement` the system observes: work is agreed and priced up front, cash changes hands on the floor, and a `Payment` is written afterwards with the settled `Task`s attached.

## Considered options

Bringing casuals into the computed model was considered.
It would give real control, since nobody could be paid outside the system, but it would require changing how the press floor operates today and would leave casual workers waiting on a payroll cycle for work they finished that morning.

## Consequences

A `Payment` is evidence that money moved, not an instruction to move it.
Code must not treat `Payment` and `Payment Schedule` as variants of one thing.

The per-supervisor spend cap only has teeth because `Task` confirmation happens in the system *before* the cash is handed over.
If that sequencing is ever relaxed, the cap silently degrades from a gate into an after-the-fact alert.

Because casual pay is never computed, there is no deduction mechanism for casuals.
This is why a `Loan` is available only to a `Permanent Engagement`: lending against a pay stream the system does not control would make the balance uncollectable through the system's own blind spot.
