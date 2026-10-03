---
status: accepted
date: 2026-10-03
supersedes: money is stored as an integer number of kobo
---

# Money is whole naira, and Net Pay rounds up to the nearest ₦100

Every monetary value in the system - salary, Grade daily figures, Task amounts, Premiums, Output Bonus, Deductions, Loan balances, Net Pay - is stored and computed as an integer number of naira.
A salary of ₦180,000 is `180000`. A Missed Day deduction of ₦2,500 is `2500`.
Kobo do not exist anywhere in the system: not in storage, not in calculation, not on a payslip.

Separately, the final Net Pay of a Payroll Run is rounded **up** to the next multiple of ₦100.
Nothing else is rounded to ₦100.

## Why kobo are gone

Kobo are not in circulation in Nigeria.
No salary is negotiated in them, no bank transfer is executed in them, and no one at Talabon has ever been paid an amount that was not a whole number of naira.
Storing a unit the business does not use means every figure in the database is multiplied by a hundred to represent a precision that can never be meaningful, and every reader of those columns has to remember why.

The original reason for kobo was the stack rather than the business.
SQLite, and therefore D1, has no `DECIMAL` type, and JavaScript has no decimal type either, so a naira-and-kobo value held as a float would eventually be wrong.
Whole naira integers solve that gap completely: there is no fractional part to lose, so there is nothing for floating-point arithmetic to corrupt.

The integer discipline is unchanged and still mandatory.
No floating-point monetary value exists anywhere in the codebase, and no money column is ever `REAL`.
What changed is the unit, not the rule.

## Where the ₦100 rounding applies

It applies once, at the end of a Payroll Run, to Net Pay.

Every component is computed and stored in exact whole naira.
The components are then summed to a subtotal, and the subtotal is rounded up to the next multiple of ₦100.
The difference appears on the payslip as its own line.

```
Base salary        180,000
Premium (1 day)      2,500
Output Bonus         4,350
Missed Day (1)      -2,500
Loan repayment     -15,000
                  --------
Subtotal           169,350
Rounding up             50
                  --------
Net Pay            169,400
```

Three properties follow, and each one is the reason for this placement rather than any other.

The rounding always favours the person.
Rounding a Deduction up would take money off someone to make a figure tidy, which is the one outcome a payroll system must never produce as a side effect of formatting.

The payslip still adds up.
Because the adjustment is an explicit line rather than a silent change to a component, a person can check every figure against the record and arrive at exactly the Net Pay they were paid.

A component figure means the same thing everywhere.
A Missed Day deduction of ₦2,500 is ₦2,500 in the Payroll Run, in the Employment Event, and in any report, because no context rounds it differently.

A subtotal that is already a multiple of ₦100 is left alone, and the rounding line reads zero rather than being omitted, so its absence never has to be interpreted.

## Consequences

Every Payment Schedule amount is a multiple of ₦100, which is what the bank is handed and what the business actually pays.

Talabon absorbs up to ₦99 per Engagement per Payroll Run.
At Talabon's current headcount of fewer than twenty, the worst case is under ₦2,000 a month and the realistic case is a fraction of that, since most subtotals land on a multiple of ₦100 already.
That is the price of the three properties above and is not worth optimising, and it stays not worth optimising at several times this headcount.

Salary figures, Grade daily figures and Loan ceilings are constrained to multiples of ₦100 at entry.
They already are in practice, and enforcing it at the boundary keeps the rounding line at zero for most people in most periods, which makes a non-zero line a signal that something computed is involved.

Rounding rules must still be explicit wherever division occurs, such as a Loan repayment split across months or a salary pro-rated for a partial period.
Those are separate decisions about exact naira, they are not the ₦100 rule, and they must not be collapsed into it.
Decide each one once, apply it everywhere, and record the rounded result rather than recomputing it.

Loan accounting is unaffected.
Repayment Deductions are exact whole naira, so an outstanding balance still reaches exactly zero.
The ₦100 rounding happens after the Deduction is applied and never touches the balance.
