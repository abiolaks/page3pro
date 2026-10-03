---
status: accepted
date: 2026-09-28
---

# People operations only, with Print Job reduced to a verification record

Talabon is a printing and logistics business, and the obvious reading of "custom ERP" would cover customers, quotes, print jobs, production scheduling, deliveries and invoices.
We deliberately scoped this system to the people side only: who works here, the terms they work under, what happens to them, and what they get paid.
The commercial side of the business is not modelled and is not a later phase of this system.

## Considered options

Building the full ERP with people operations as one module was considered and rejected.
The pain Talabon actually feels is internal: inconsistent employment documents, informal casual payment, and no reliable record of who worked when.
Committing to ERP scaffolding would have delayed all of that behind months of infrastructure for a commercial layer nobody asked for.

## Consequences

A `Print Job` does exist in the model, but only as a job number, description, quantity ordered, size and due date.
It carries no customer, no price, no quote and no invoice, and exists for exactly one reason: an operator's claimed output is meaningless unless it can be checked against a quantity that was actually ordered.
Anyone encountering that oddly stunted entity should read it as a deliberate limit rather than an unfinished feature.

Because a `Task` carries no reference to the Print Job it served, labour cost per print job is permanently unanswerable.
That was accepted knowingly.
Output volume per Print Job is answerable, since Output Logs do reference the job.
