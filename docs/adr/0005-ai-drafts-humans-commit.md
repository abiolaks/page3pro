---
status: accepted
date: 2026-09-28
---

# AI drafts, humans commit, rules decide

Claude is used in this system only to write prose from structured data, to read unstructured input into structure, and to answer questions in natural language.
Every AI output lands in a field a human reviews and owns before it becomes a fact, and nothing a model produces is written directly into an `Employment Event`, `Payroll Run`, `Document` or `Payment`.
The full feature list, sequencing and cost model is in [`../ai-roadmap.md`](../ai-roadmap.md).

## Considered options

Using AI to generate the twelve employment documents is the obvious idea and was rejected outright.
A `Document` is a deterministic merge of a versioned `Template` with known data, and [ADR 0004](./0004-employment-events-are-primary.md) requires a letter issued today to reproduce exactly years later.
A model cannot make that guarantee, and an offer letter or NDA is the worst place in the system to introduce non-determinism.

Using AI for anomaly detection over Tasks and Payments was also rejected.
The patterns worth catching are arithmetic - spend cap exceeded, a Person paid twice in one day, a Task amount far outside the history for that work type, logged output exceeding the quantity ordered.
Rules catch those reliably, cheaply and explainably.
Claude writes the digest that reports them; it does not find them.

## Consequences

AI never holds authority.
Approval of Leave, Loans, Tasks, Payroll Runs and Payments belongs to a Manager or an Approving Role, and a model may surface and recommend but never decide.
`Output Bonus` in particular stays formula-driven, because its whole value is being arguable against the record.

No AI feature may be built before the data it reads exists, which is what places each one in the build sequence rather than preference.
That is why phase 1 carries a single AI feature (reading signed-document scans, the one thing rules cannot do) and why performance review drafting comes last.

Every AI-written field is stored with a flag recording that it was AI-drafted and whether a human edited it before committing.
Without that flag there is no way to later measure whether the drafts are any good, or to find everything a model touched if one turns out to have been systematically wrong.

At Talabon's scale the entire staff policy corpus fits in a prompt, so no vector database or retrieval pipeline is built.
Anyone proposing one should first check whether the corpus has actually outgrown the context window.
