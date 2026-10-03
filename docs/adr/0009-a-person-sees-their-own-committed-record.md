---
status: accepted
date: 2026-10-03
---

# A Person sees their own committed record

Every Person has a login ([ADR 0008](./0008-login-depends-on-no-external-provider.md)) and a self-service view of themselves: who Talabon holds them to be, what they work under, what they have done, and what they have been paid.

The rule governing it has three clauses, and all three matter.

A Person sees **committed facts**, never drafts.
A Person sees **only themselves**, never another Person.
A Person sees **the terms things happened under**, not only the terms in force today.

## What is on it

Profile is Person-level, because name, phone, photo, bank account, next of kin, guarantor and outstanding Loan survive every change in how someone works for Talabon.

Activity is Engagement-scoped, because job title, pay basis, reporting line and issued Documents belong to the Engagement.
A Person accumulates many Engagements, so the view shows the active one prominently with earlier ones as history.
Collapsing this to the Person would show someone their output from four years ago as though it happened under today's Grade.

On a Permanent Engagement:

- Attendance for the period, with Missed Days named as such
- Leave entitlement, taken and remaining
- Tasks assigned and confirmed
- Output Logs, separated into verified and awaiting their Manager
- Documents, separated into Issued and Signed, so their own outstanding paperwork is visible to them rather than only to HR
- Loan balance outstanding
- Net Pay per period, itemised down to the rounding line ([ADR 0007](./0007-money-is-whole-naira-net-pay-rounds-up-to-100.md))
- Reports submitted, and which are due
- Their own Employment Events, and finalised Performance Reviews
- The Job Description for their job title, and the Policies that apply to them

On a Casual Engagement, Leave and Performance Review are absent by definition, and Tasks carry more weight: completed Tasks are the sole input to casual pay, so the Task list separated into assigned, confirmed and paid *is* the person's pay record.
This part of the view arrives with casual work itself, which [ADR 0010](./0010-the-mvp-covers-permanent-engagements-only.md) defers past the MVP.
In the MVP a Task appears on this view as assigned work a Manager confirmed, with no amount and no pay effect.

## Why this is worth building early

It is the cheapest verification mechanism available.

The domain language already commits to two things that only work if someone checks them.
An unmarked Attendance day is "a gap to chase rather than an assumed day of presence."
An Output Log is a claim that is deliberately "falsifiable" against the Print Job quantity.
Both sentences describe work that has to be done by somebody, and HR auditing twenty records is strictly worse than twenty people each auditing one.
The ratio is what matters rather than the headcount, so this argument does not weaken as Talabon grows - it strengthens.

The person whose money depends on a figure is the most motivated auditor of it, and the only one who knows whether they were actually at work on a Tuesday in March.

It also moves disputes to before the money moves.
A Payroll Run is immutable once approved and a correction is a later Run, so an error caught after approval is carried for a month.
Letting people see their Attendance, Output Logs and Loan balance ahead of the Run converts an expensive correction into a cheap conversation.

## Consequences

**Attendance has to actually be marked, daily.**
Today a gap is an internal untidiness; once this view exists it is every one of Talabon's people seeing a blank where their presence should be, and asking about it.
This is the intended effect, and it is also a real operational obligation the business is taking on.

**Every query is scoped to the authenticated Person, enforced in one place.**
A single missing `WHERE person_id = ?` in a route handler leaks the whole payroll.
Access goes through one data-access layer that cannot express an unscoped read, rather than being each route's responsibility to remember.

**Drafts must be genuinely separable from committed facts in the schema.**
This was already required by [ADR 0005](./0005-ai-drafts-humans-commit.md), which holds that AI drafts and humans commit, and by the open roadmap question about where AI-drafted fields live.
This view is what makes it load-bearing: an AI-drafted Performance Review assessment, or a sanction being considered, becoming visible to its subject before a human commits it would be a serious failure.

**Issuing a sanction becomes distinguishable from contemplating one.**
A Person sees their own Employment Events, so an Event is the moment the fact becomes real and known.
HR needs to understand that recording one is serving it.

**Policies and Job Descriptions have to be digitised.**
The roadmap already requires the staff policy as a `Template` in phase 1, so this is sequencing work that exists rather than adding it.
It also unblocks the phase 4 policy assistant as a side effect.
