---
status: accepted
date: 2026-09-28
---

# Payroll withholds nothing statutory and never moves money

Talabon does not currently withhold PAYE, pension, NHF or any other statutory contribution from salaries, and no external accountant or bureau does so either.
The system therefore calculates no statutory deductions at all, which means `Net Pay` is the exact figure that reaches a person's bank account rather than a pre-tax indication.
Separately, the system stops at producing an approved `Payment Schedule`: a human executes it at the bank, and the system holds no payment credentials and initiates no transfers.

## Consequences

A future reader will look at a Nigerian payroll implementation with no tax tables and reasonably assume something is missing.
It is not.
This reflects how Talabon operates today, and the business is aware that the Pension Reform Act and PAYE remittance obligations apply regardless.
Whether to become compliant is a business decision outside this system's design.

To keep that door open at low cost, `Deduction` is modelled as one general concept rather than as hardcoded loan and absence cases.
Adding statutory deductions later means adding deduction kinds and a versioned rule table, not restructuring payroll.
Any such rule table must be versioned and recorded against each `Payroll Run`, because Nigerian PAYE changed in January 2026 and will change again, and historical payslips must still reproduce.

Refusing to move money is the more load-bearing half of this decision.
Casual payment is authorised by a supervisor who sets the amount, confirms the work and hands over the cash, with only a spend cap standing in the way.
That flow is deferred past the MVP by [ADR 0010](./0010-the-mvp-covers-permanent-engagements-only.md), so until it lands, casual payment stays outside the system entirely rather than being partly modelled.
Keeping a human between that authorisation and the bank is the last control on a path that is otherwise held by one person.
