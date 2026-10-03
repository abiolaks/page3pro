---
status: accepted
date: 2026-10-03
---

# Model routing lives in code, not in the gateway

Every AI feature in this system runs on one of two models, chosen by a single routing table in one module.
Claude Opus 5.5 carries the high-stakes vision and prose.
GLM-5.3 Flash on Workers AI carries the agent and the extraction.
AI Gateway is the transport and observability layer, not the router.

## The split

The governing rule: a model only ever handles a feature where its failure mode is cheap.

| Feature | Model | Why |
| --- | --- | --- |
| Signed-doc scan verification | Claude Opus 5.5 | Vision on wet-signed legal scans; a silent "signed" miss is unrecoverable |
| Weekly report drafting | Claude Opus 5.5 | Prose quality is the whole task |
| Performance review drafting | Claude Opus 5.5 | Prose plus long context |
| Payroll pre-flight brief | Claude Opus 5.5 | Final pay, the least recoverable error |
| Staff policy Q&A | Claude Opus 5.5 | Grounded factual answers to staff |
| Print Job intake | GLM-5.3 Flash | Structured extraction, a human confirms anyway |
| Daily exceptions digest | GLM-5.3 Flash | Prose over a list the rules already computed |
| NL query assistant | GLM-5.3 Flash | The only agent, and ~90% of the cost |

The model identifiers as passed through AI Gateway are `anthropic/claude-opus-5.5` and `workers-ai/@cf/zai-org/glm-5.3-flash`.

## Routing in one module, not scattered

A single `ai` module owns every model call behind intent functions, and a config map is the only place a model name may appear.

```ts
// ai/models.ts - the only place model names exist
export const models = {
  "document.verify": "anthropic/claude-opus-5.5",
  "report.draft":    "anthropic/claude-opus-5.5",
  "review.draft":    "anthropic/claude-opus-5.5",
  "payroll.brief":   "anthropic/claude-opus-5.5",
  "policy.qa":       "anthropic/claude-opus-5.5",
  "print-job.parse": "workers-ai/@cf/zai-org/glm-5.3-flash",
  "digest.daily":    "workers-ai/@cf/zai-org/glm-5.3-flash",
  "query.assistant": "workers-ai/@cf/zai-org/glm-5.3-flash",
} as const;
```

Callers use intent functions (`verifyDocumentScan`, `draftReport`, `askQuery`) and never see a model name or a raw prompt.
This is the deep-module discipline of the tech stack: a lot of behaviour behind a small interface.
Model choice becomes a one-line change, which is the configurability the AI roadmap already promised.

## Why not AI Gateway Dynamic Routes

AI Gateway's Dynamic Routes offer dashboard-configured conditionals, fallbacks, percentage rollouts and rate or budget limits.
They are rejected for this system for three reasons.

First, Dynamic Routes accept the OpenAI chat completions request shape only; an Anthropic Messages request returns a 400.
This system's calls are Anthropic-shaped, so adopting Dynamic Routes would fork the request format for no benefit.

Second, routing in the dashboard is a second source of truth, versioned separately from code and invisible to Vitest.
The whole routing rule here is eight entries; that belongs in a reviewed, unit-testable file, not in a versioned dashboard flow.

Third, a dashboard fallback introduces non-determinism: a request answered by a fallback model is a provenance gap.
Every AI-written field must record which model produced it, and that is trivial when the model is known at the call site and impossible to guarantee when the gateway silently substitutes one.

AI Gateway still carries the cross-cutting concerns it is good at: logging, caching, rate and spend limits, DLP and guardrails ([ADR 0013](./0013-ai-guardrails-defense-in-depth.md)).
It routes on the provider prefix in the model name, not on its own rules.

## Consequences

Model selection is a config map keyed by feature intent, held in one module.
Switching a feature's model is a one-line change and nothing else.

Provenance is captured automatically: because the `ai` module knows the model at call time, it writes the model identifier and timestamp into every draft it produces, satisfying the seam in the requirements document without any extra code at the call sites.

`tech-stack.md` changes: the AI row no longer names the Anthropic SDK; it names AI Gateway with the model chosen per feature in the `ai` module.
The SDK remains for Claude-shaped calls and the AI binding for Workers AI calls, both through the same gateway.

Fallback and A/B routing are deliberately not built.
They are a seam with one adapter, and the tech stack forbids such seams until something actually varies across them.
If a model ever proves unreliable in production, a fallback is a later addition, not a reservation made now.
