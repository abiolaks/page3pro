---
status: accepted
date: 2026-10-03
---

# A Payment Schedule line records its own execution

Each line of an approved `Payment Schedule` carries an execution state: awaiting payment, paid, or failed.
Marking a line paid records the date and who marked it.
Marking it failed records a reason.

This closes the gap [ADR 0010](./0010-the-mvp-covers-permanent-engagements-only.md) identified when it deferred casual work.

## Why it is needed

[ADR 0002](./0002-payroll-withholds-nothing-and-moves-no-money.md) means the system hands a `Payment Schedule` to a human and never moves money itself.
Without a record of execution, the system knows only what it *instructed*.

Three things follow from that gap, and all three are unacceptable in a system of record for pay.

A failed or skipped bank transfer is invisible.
The Schedule says ₦169,400 was owed and approved, and nothing anywhere says whether it arrived.

"Was I paid?" cannot be answered from the record, which makes [ADR 0009](./0009-a-person-sees-their-own-committed-record.md)'s self-service view quietly dishonest: it would show a payslip that looks like a receipt while being only an instruction.

And the one control that matters most at month end, reconciling what was approved against what left the bank, has nothing to reconcile against.

## The execution mark is not a Payment

`Payment` stays reserved for the casual cash flow it was defined for: money handed over on the floor, with the settled `Task`s attached.

Overloading it to also mean "the salary transfer cleared" would give one term two meanings and walk straight into the warning [ADR 0003](./0003-permanent-pay-computed-casual-pay-recorded.md) already issues, that code must not treat `Payment` and `Payment Schedule` as variants of one thing.
The execution mark therefore belongs to the Schedule line, which is the thing being executed.

## This does not break Run immutability

A `Payroll Run` is immutable once approved, and a correction is a later Run rather than an edit to an earlier one.
The execution mark does not touch that.

The amount on a line never changes after approval.
What changes is a separate, append-only record of what happened to that amount in the outside world.
Computation is immutable; execution is observed afterwards and can only move forward.

A failed transfer is therefore retried and the same line later marked paid.
It is never fixed by re-running payroll, because nothing about the calculation was wrong.
This is the one case where something changes after approval without being a correction, and the distinction is worth stating plainly: a wrong figure needs a new Run, a figure that did not arrive needs a new attempt.

## Consequences

The self-service view can distinguish "owed to you" from "paid to you", with a date.

Month-end reconciliation becomes possible: every approved line is either paid, failed with a reason, or visibly still outstanding.
A line sitting at awaiting payment for a week is an exception worth surfacing, and the payroll pre-flight check in the AI roadmap has an obvious additional input.

Someone has to actually mark the lines.
This is real operational work handed to whoever executes at the bank, and the system should make it a short pass over a list rather than a per-person chore.
If nobody marks them, the gap this ADR closes reopens silently, which makes an unmarked Schedule days after approval a thing worth nagging about.
