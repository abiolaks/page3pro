---
status: accepted
date: 2026-09-28
---

# Employment Events are primary, Documents are rendered from them

This project began as a list of twelve employment documents, which invites an obvious design: build a template gallery, fill in a letter, file it, and update the pay record separately.
We rejected that.
The `Employment Event` is the source of truth, and a `Document` is a rendering of it.

A promotion is a Grade and salary change with an effective date, approved by an Approving Role.
Next month's `Payroll Run` reads that event, and the promotion letter is generated from the same event.
The letter and the payslip therefore cannot disagree, because there is only one fact underneath both.

## Consequences

An Employment Event takes effect whether or not any letter is ever printed.
Issuing a document is optional for minor events; recording the event is not.

Every `Template` is versioned and every `Document` records the version it was generated from, so a letter issued in 2026 still reproduces exactly after the wording changes in 2029.

A `Document` is `Issued` when generated and only `Signed` once the wet-signed scan is attached.
These are distinct states rather than a boolean, because the commonest failure in HR record keeping is an unsigned agreement that nobody noticed was never returned.
