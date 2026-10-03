---
status: accepted
date: 2026-10-03
---

# AI guardrails are defense in depth

AI is a drafting aid here, never an authority ([ADR 0005](./0005-ai-drafts-humans-commit.md)), but a draft still carries employee data toward a model and a model's output still reaches a human.
Guardrails make both directions safe, in layers, so that no single failure exposes a person's record or a wrong number.

## The two directions

A guardrail protects two things.
Outbound, it stops data that must never leave from appearing in a prompt.
Inbound, it stops a model output that must never be trusted from reaching a human unchallenged.
The strongest guardrails are the ones that are structural rather than prompt-based, because a rule in code cannot be talked around.

## What may never transit a model

This list is short, absolute, and independent of model or feature.

| Data | Why it is excluded |
| --- | --- |
| Bank account numbers | The system computes Net Pay and writes the Payment Schedule itself; a human executes it at the bank. No AI feature ever reads an account number. |
| Credentials: password hashes, TOTP secrets, session tokens | Nothing to do with drafting; a credential in a prompt is a leak. |
| The full Person or Engagement record | A feature receives only the slice its contract names, never the whole row. |
| NIN | Not held at all, by [ADR 0001](./0001-people-operations-scope.md). |

Names, attendance, tasks, output and pay figures legitimately reach Claude when a feature needs them to draft a report or brief.
The guardrail is minimization, not a ban on the data the feature is for.

## Layer 1: structural guardrails in code

These are the primary layer and they are language-independent, which matters because they must work for a Nigerian workforce in any language.

**Read-only database role for the query assistant.**
The assistant's credential can run the narrow query tools and nothing else, enforced at the D1 role, not in a prompt.
A prompt-injected instruction cannot write because the role cannot write.

**Narrow query tools, never free SQL.**
The assistant calls a fixed set of typed query functions.
The surface is bounded by design, so the worst a prompt injection can do is run an already-permitted query.

**Every answer shows the query it ran and cites the rows it used.**
A wrong answer is then visibly wrong: the cited rows will not match the claim.
This downgrades a hallucinated number from a silent error to a discrepancy the owner can see and re-ask.

**Structured outputs for anything feeding a form field.**
Scan verification and Print Job intake return typed proposals, never free text, so a model cannot smuggle in extra fields.

**The draft and committed seam plus provenance.**
Already fixed by the requirements document and ADR 0005: a model's proposal sits in its own column, is never shown to the subject, and records which model wrote it.
This is itself a guardrail, because it makes every AI output auditable and revertible.

**No secrets in prompts, ever.**
A secret is injected by configuration, not by concatenation into a prompt.

## Layer 2: AI Gateway DLP

AI Gateway's Data Loss Prevention scans prompt and response text against detection profiles and flags or blocks matches ([Cloudflare docs](https://developers.cloudflare.com/ai-gateway/features/dlp/)).

The policy is:

| Profile | Direction | Action | Why |
| --- | --- | --- | --- |
| Financial information (bank accounts) | Request and response | **Block** | Bank accounts must never transit; a block is a tripwire, not a filter |
| Credentials and secrets (custom) | Request and response | **Block** | Same reasoning as the code rule |
| PII (names, phones, addresses) | Response only | Flag | The assistant legitimately answers "who was absent" with names, so block would break it; flagging leaves an audit trail |

A custom DLP profile carries the Nigerian patterns the predefined ones may miss, in particular NUBAN account numbers and `+234` phone formats.
That profile is shared with Cloudflare One DLP, so it is maintained once.

## Layer 3: AI Gateway Guardrails

Guardrails evaluate prompts and responses against Llama Guard hazard categories plus a dedicated prompt-injection model, each settable to flag, ignore or block ([Cloudflare docs](https://developers.cloudflare.com/ai-gateway/features/guardrails/)).

The policy is deliberately minimal, because this is an internal HR tool, not a public chatbot:

| Category | Direction | Action |
| --- | --- | --- |
| P1 prompt injection | Prompts | **Block** |
| S7 privacy | Prompts and responses | Flag |
| All other categories | Prompts and responses | Flag |

Prompt injection is blocked because the assistant is the one surface where an instruction competes with the system.
Everything else is flagged rather than blocked, because the harmful-content risk of a twenty-person internal tool is low and over-blocking would break legitimate drafting.

Two honest limits shape this layer.
Guardrails add roughly 500 ms per request and do not support streaming, so they are applied to prompts, and response safety is left to DLP and the cite-the-rows rule rather than buffering the assistant's stream.
And Llama Guard's supported languages do not include Yoruba, Hausa, Igbo or Nigerian Pidgin, so this layer is best-effort for local languages while the structural layer carries the weight.

## Layer 4: provider choice

The model split in [ADR 0012](./0012-model-routing-in-code-not-in-the-gateway.md) is itself a guardrail.
The assistant, digest and Print Job intake run on GLM-5.3 Flash through Workers AI, so that employee data stays on Cloudflare's network and never leaves to a third party.
The high-stakes features on Claude send a minimized slice to Anthropic, whose API is not trained on customer content.
Fewer parties touching employee data is a privacy win on its own, and the routing rule already put the data-lean features on the data-resident model.

## Consequences

No single layer is trusted to work alone.
A failure of the code rules is caught by DLP.
A failure of DLP is caught by the read-only role and the bounded query surface.
A failure of the model is caught by the draft seam and provenance.

The guardrail configuration lives in two places and neither is scattered: the code rules live in the `ai` module and the identity module, and the gateway rules live in the AI Gateway dashboard, in one place each.

Every guardrail is testable.
The evaluation checklist exercises them directly, which is what makes this a standard rather than a list of good intentions.
