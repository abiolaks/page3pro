# AI in Talabon People Operations

Where Claude earns its place in this system, where it does not, and when each piece lands in the build.

Read [`CONTEXT.md`](../CONTEXT.md) first.
This document assumes the domain model and the four ADRs in [`adr/`](./adr/).

## The governing principle

**AI drafts. Humans commit. Rules decide.**

Every AI output in this system lands in a field a human reviews and owns before it becomes a fact.
Nothing Claude produces is ever written straight into an Employment Event, a Payroll Run, a Document or a Payment.
This is not caution for its own sake: [ADR 0004](./adr/0004-employment-events-are-primary.md) makes Employment Events the source of truth, and a generated artifact that writes itself back into the source of truth inverts that.

## What AI is actually for here

Strip away the hype and Claude does exactly three things this system cannot otherwise do.

**1. Prose from structured data.**
The system will know a person's attendance, tasks and output for a period.
Turning that into a readable weekly report or a fair performance review draft is writing, and writing is what a language model is for.

**2. Unstructured input into structure.**
A wet-signed scan comes back and someone has to check it is the right document and actually signed.
A print job arrives as a WhatsApp message and someone has to turn it into a job number, quantity, size and due date.
No rule can read a photograph or a sentence.

**3. Natural language over the data.**
The owner wants to ask "who was absent most in September" without learning a reports screen.
A staff member wants to ask "how many leave days do I have left" without emailing HR.

Anything that does not fall into one of those three is almost certainly a rule wearing a costume.

## What AI deliberately does not do

These are refusals, not backlog items.
Each one will be proposed by someone at some point, and the answer is already no.

| Not AI | Why |
|---|---|
| Generating offer letters, NDAs, contracts | A Document is a deterministic merge of a versioned Template and known data. [ADR 0004](./adr/0004-employment-events-are-primary.md) requires a 2026 letter to reproduce exactly in 2029. A model cannot promise that, and hallucination in legally binding text is the worst possible place for it. |
| Calculating any pay figure | Net Pay is arithmetic over salary, Missed Days, Premiums, Output Bonus and Deductions. Arithmetic belongs in code that can be unit tested. |
| Approving anything | Leave, Loans, Tasks, Payroll Runs and Payments are approved by a Manager or an Approving Role. AI may surface and recommend; it never holds authority. |
| Deciding a Bonus | Output Bonus comes from a published formula precisely so it can be argued against the record. A model's judgement cannot be argued against. |
| Detecting fraud | The patterns worth catching are arithmetic: spend cap exceeded, same Person paid twice in a day, Task amount far outside the history for that work type, logged output exceeding quantity ordered. Rules catch these reliably and for free. Claude's job is writing the digest, not finding the anomaly. |
| A general chat assistant as the front door | Forms that work beat a chat box that guesses. The assistant earns its place only once the underlying screens are already good. |
| Retrieval infrastructure (vector DB, RAG pipeline) | Talabon's entire staff policy set fits comfortably in a prompt. Cache it as a stable prefix and skip the pipeline entirely. Revisit only if the corpus outgrows the context window, which at this size it will not. |

## The features, placed in the timeline

The rule that orders everything: **an AI feature cannot exist before the data it reads exists.**
That single constraint, not preference, determines the sequence below.

### Phase 1 (people and documents) - one feature

**Signed-document scan verification.**
When the wet-signed scan of an offer letter, NDA or guarantor form is attached, Claude reads the image and answers three questions: is this the document it claims to be, does it carry a signature, and what date is on it.
It proposes the signed date; a human confirms the Document's transition from Issued to Signed.

Worth doing first because it is the one thing in phase 1 that rules genuinely cannot do, it is self-contained, and its failure mode is a human being asked to look twice.

Everything else in phase 1 stays deliberately AI-free.
Phase 1 exists to build trustworthy employee data, and nothing here needs a model.

### Phase 2 (attendance, leave, loans, payroll) - one feature

**Payroll pre-flight check.**
Before a Payroll Run can be approved, rules assemble the exception list: unmarked Attendance days, Engagements with no Grade, Loans that should have closed, unverified Output Logs, unsigned Documents, figures that moved sharply since last period.
Claude turns that list into a short readable brief explaining what is unusual and what approving anyway would mean.

This is the single highest-value item on this page.
Final pay and month-end payroll are where errors are expensive and least recoverable.

**Daily exceptions digest - deferred with casual work.**
Same shape, daily, sent to the owner: Tasks created, priced, confirmed and paid, grouped by supervisor, with the rule-flagged outliers called out in prose.

This was the detective control that makes [ADR 0003](./adr/0003-permanent-pay-computed-casual-pay-recorded.md)'s spend cap meaningful in practice.
The cap bounds the worst case; the digest is how anyone notices a pattern underneath it.

Both the cap and the priced-Task flow it watches are deferred past the MVP by [ADR 0010](./adr/0010-the-mvp-covers-permanent-engagements-only.md), so the digest has almost nothing left to report and arrives when casual work does.
Permanent-side exceptions are already covered by the pre-flight check above, and a daily email about twenty people's attendance is not worth a model.

### Phase 3 (print jobs, tasks, output, reports) - two features

**Weekly and monthly Report drafting.**
The Report is already defined as pre-filled with Attendance, Tasks and Output Logs, with the person supplying only the narrative.
Claude drafts that narrative from the same data, and the person edits it.
This turns the weekly report from a chore people skip into a two-minute review.

**Print Job intake from unstructured text.**
*Conditional on how jobs actually arrive.*
If job details come in as WhatsApp messages or phone notes, Claude parses "need 5000 A5 flyers full colour by Friday" into job number, description, quantity, size and due date for a human to confirm.
If jobs already arrive on a structured form, skip this entirely.

### Phase 4 (after phase 3 has run for a period) - two features

**Performance Review drafting.**
Pre-filled with six months of Attendance, Output Logs and Tasks, plus the previous review, Claude drafts the assessment against Talabon's rubric.
The Manager rewrites it; the review still only ever produces a recommendation.

Deliberately last: a review draft is only as good as the half-year of data behind it, so the first genuinely useful one cannot happen until phase 3 has been running for a review period.

**Natural-language query assistant.**
The owner asks questions in plain language and gets answers grounded in the data.
Read-only, with narrow query tools rather than free SQL, and every answer shows the query it ran and cites the rows it used.

**Staff policy assistant.**
Grounded in the staff policy documents plus the asking person's own record: leave balance, loan balance, grade.
Deflects the routine questions that otherwise land on HR.

## Why only one agent

Applying the agent test - is the task multi-step, hard to specify in advance, and worth the cost and latency - to each feature:

| Feature | Shape |
|---|---|
| Scan verification | Single call, vision |
| Payroll pre-flight | Rules compute, single call writes |
| Daily digest | Rules compute, single call writes |
| Report drafting | Single call over structured input |
| Print Job intake | Single call, structured output |
| Review drafting | Single call over a large structured input |
| **Query assistant** | **Genuinely agentic: tool-calling loop, unpredictable path, multi-step** |

**Six single calls and one agent.**
That is the whole architecture.
Most teams building this would reach for an agent framework, a vector database and an orchestration layer, and would need none of the three.

The query assistant is the only place where Claude needs to decide what to look at next, which is the only thing that justifies a loop.

## What it costs

Assumes Talabon's current headcount of fewer than twenty, all requests on Claude Opus 5 (`claude-opus-5`) at $5/MTok input and $25/MTok output.

| Feature | Calls/month | Cost/month | Scales with |
|---|---|---|---|
| Weekly report drafts (batched) | 80 | $0.55 | Headcount |
| Performance review drafts (batched) | ~3 | $0.07 | Headcount |
| Daily exceptions digest | 30 | $0.60 | Deferred with casual (ADR 0010) |
| Payroll pre-flight check | 5 | $0.25 | Runs, not people |
| Signed-doc scan verification | 80 | $1.00 | Hiring rate |
| Staff policy Q&A | 40 | $1.00 | Headcount |
| **Everything except the agent** | | **~$3.50** | |
| NL query assistant | 600 questions | ~$45 (≈$25 with caching) | Owner's curiosity |
| **Total** | | **~$29-49** | |

Three things about those numbers.

**Six of the seven features together cost under four dollars a month at the most capable model available.**
There is no cost argument for using a weaker model on any of them.
Cheaper models are a quality decision, not a savings decision, at this volume.

**The agent is effectively the entire bill,** at roughly nine tenths of it, and it is the one line that does not scale with headcount at all.
It scales with how much the owner asks it, so twenty questions a day is a generous estimate and doubling the workforce would barely move the total.
Any cost optimisation effort belongs here and nowhere else.

**Two levers cut the bill without touching quality.**
Prompt caching on the query assistant's stable prefix (system prompt, schema, tool definitions are byte-identical every request) roughly halves its input cost.
The Batch API is 50% off and report drafting and review drafting are not latency-sensitive at all, since nobody is waiting on a Sunday-night job.

## Open models on Workers AI: deferred to phase 2

Workers AI runs open models on Cloudflare's GPUs, billed in Neurons, with [10,000 Neurons per day free on both the Free and Paid plans](https://developers.cloudflare.com/workers-ai/platform/pricing/) and $0.011 per 1,000 Neurons above that.

**Volume is not the obstacle.**
The whole workload above comes to roughly 250,000 Neurons a month against a free allowance of about 300,000, and the six non-agent features together are only about 6% of it.
Everything here could in principle run inside the free allocation.

**Two things are the obstacle.**

The strong current models - Kimi K2.6/K2.7, GLM-5.2/5.3, DeepSeek V4 - [require the Workers Paid plan or prepaid AI Gateway credits](https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/).
Free plan plus best open models is not an available combination.

And the capability split is awkward, because open models are weakest at exactly the features that matter most.
The digest, the payroll pre-flight brief and weekly report drafting are prose over a pre-computed list, which a small model handles fine - and they are also the cheap ones, together $2.36 a month on Claude.
Scan verification, review drafting and the query assistant are where open models fall short, and they are the three where being wrong has a cost: a mis-read scan marks an unsigned NDA as signed, and a tool-calling slip puts a wrong payroll number in front of the owner.

**There is a real argument for Workers AI that has nothing to do with money.**
Salaries, disciplinary records and attendance would never leave Cloudflare.
Given Talabon already declines to hold NINs on privacy grounds and the NDPA applies, fewer parties touching employee data is worth something on its own.

**Against it: two model paths mean two prompt styles, two sets of failure modes, and two things to evaluate.**
Built solo, that maintenance cost plausibly exceeds the roughly $3 a month at stake.

### Why defer rather than decide

Phase 1's only AI feature is scan verification, which stays on Claude under every option, so nothing is gained by choosing now.
Revisit at the start of phase 2, when there is evidence from the scan-verification feature about how the hard cases actually behave rather than estimates.

Routing every call through AI Gateway from the first request is what keeps this cheap to change: switching a feature's model becomes configuration rather than a rewrite.
Note also that model identifiers in this ecosystem turn over fast - check the live Workers AI catalogue rather than any cached list.

## Technical defaults

- **Model:** `claude-opus-5` with adaptive thinking (`thinking: {type: "adaptive"}`). Do not pass `budget_tokens`, which this model rejects.
- **Prompt caching** on the stable prefix for the query assistant and the policy assistant.
- **Batch API** for report and review drafting.
- **Structured outputs** (`output_config.format`) for anything feeding a form field: scan verification, print job intake.
- **Read-only credentials** for the query assistant, enforced at the database role, not in the prompt.
- **Narrow query tools** rather than free-form SQL, so the surface is bounded by design.
- Every AI-written field is stored alongside a flag recording that it was AI-drafted, and whether a human edited it before committing.

## Resolved

**Print Jobs arrive by WhatsApp and phone call.**
The intake feature is confirmed for phase 3, and it is no longer conditional.
This also means the Print Job record has no upstream source to import from: every job is created by a human reading a message, which is exactly the case where parsing into structured fields earns its keep.

**Staff policy documents exist on paper only.**
The policy assistant is blocked until they are digitised, which pushes it behind everything else in phase 4.
Digitising them is required anyway, and earlier than phase 4: a `Policy` and a `Job Description` both appear in a Person's own self-service view in phase 1 ([ADR 0009](./adr/0009-a-person-sees-their-own-committed-record.md)), so the text has to exist for that view to have anything to show.
So the work is not wasted, it is just sequenced earlier for a different reason, and the assistant becomes possible as a side effect.

Note that a `Policy` is not a `Template`.
A Template has placeholders and produces a Document issued to one Person; a Policy is published to a group and signed by nobody.
Where proof of reading is needed, a Document is issued from the Policy and signed in the ordinary way.

## Open questions

1. What does Talabon's performance review rubric look like? Review drafting needs something to assess against, and no rubric exists in the README.
2. ~~Where do AI-drafted fields live in the schema?~~ **Answered,** pending review: section 4.3 of [`requirements.md`](./requirements.md) proposes the seam as a lifecycle state, a separate column for the model's proposal, and retained provenance.
   It is load-bearing rather than tidy-minded: [ADR 0009](./adr/0009-a-person-sees-their-own-committed-record.md) shows a Person their own Employment Events and Performance Reviews, so a draft that is not cleanly separable from a committed fact is a draft the subject can read before a human has committed to it.
