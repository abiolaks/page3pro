# Cheaper models than Claude for Talabon People Operations

Research note.
Read [`ai-roadmap.md`](./ai-roadmap.md) first; this document re-prices that plan against the current model market.

Baseline: `ai-roadmap.md` assumes `claude-opus-5` at $5 / MTok input, $25 / MTok output, for a monthly bill of roughly $29-49, of which the query assistant is ~$45 and the six other features together ~$3.50.

## What the workload actually needs, feature by feature

| Feature | Vision | Structured output | Tool-calling loop | Prose quality | Long context | Latency-sensitive |
| --- | --- | --- | --- | --- | --- | --- |
| Signed-doc scan verification | **Yes** | **Yes** | No | Medium | No | No |
| Payroll pre-flight brief | No | No | No | **High** | No | No |
| Daily exceptions digest | No | No | No | Medium | No | No |
| Weekly/monthly report drafting | No | No | No | **High** | Medium | No |
| Print Job intake | No | **Yes** | No | Low | No | No |
| Performance review drafting | No | No | No | **High** | **High** | No |
| NL query assistant | No | No | **Yes** | Medium | Medium | Yes |
| Staff policy assistant | No | No | No | Medium | Low | Yes |

The two hard capability requirements are **vision** (scan verification is phase 1's only AI feature) and **prose quality** (reports, reviews and digests are writing tasks).
The one place cost actually matters is the **agent**, because it is ~90% of the bill and does not scale with headcount.

## Candidates, priced against Claude Opus 5

All prices are USD per 1M tokens (input / output), from each provider's own pricing page.

| Model | Input / Output | Vision | Tool calling | Structured output | Notes |
| --- | --- | --- | --- | --- | --- |
| Claude Opus 5 (baseline) | $5 / $25 | Yes | Yes | Yes | Legacy per [Anthropic](https://platform.claude.com/docs/en/models/opus-5/overview); superseded by Opus 5.5 |
| Claude Opus 5.5 | $4 / $20 | Yes | Yes | Yes | Same family, strictly newer and 20% cheaper ([Anthropic pricing](https://docs.anthropic.com/en/about-claude/pricing)) |
| Claude Sonnet 5 / 5.5 | $2 / $10 | Yes | Yes | Yes | Same platform and SDK, 60% cheaper ([Anthropic pricing](https://docs.anthropic.com/en/about-claude/pricing)) |
| Gemini 3.1 Pro | $2 / $12 (≤200K); $4 / $18 (>200K) | Yes (native multimodal) | Yes | Yes | 1M context, 64K output, preview status ([Google pricing](https://ai.google.dev/gemini-api/docs/pricing)) |
| Gemini 3.8 Flash | $0.75 / $3.75 until Dec 31 2026, then $1.50 / $7.50 | Yes | Yes | Yes | Marketed for "autonomous agents" ([Google pricing](https://ai.google.dev/gemini-api/docs/pricing)) |
| Workers AI GLM-5.3 | $1.40 / $4.40 | Text only | Yes | Yes | 1M context, frontier open model on Cloudflare ([Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)) |
| Workers AI GLM-5.3 Flash | $0.15 / $0.50 | Yes (first multimodal GLM-5) | Yes | Yes | "Approaching Claude Opus 4.8 on agentic" ([Workers AI changelog](https://developers.cloudflare.com/changelog/product/workers-ai/)) |
| Workers AI Kimi K2.6 | $0.95 / $4.00 | Yes | Yes | Yes | 1T-param, 262K context ([Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)) |
| Workers AI DeepSeek V4 Flash | $0.44 / $1.32 | Yes | Yes | Yes | 1M context ([Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)) |
| DeepSeek V4.1-Flash (direct API) | $0.15 / $0.60 off-peak, 2x peak | Yes | Yes | Yes | Peak hours only weekdays; China-hosted ([DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing)) |
| DeepSeek V4-Pro (direct API) | $0.66 / $1.98 off-peak, 2x peak | **No** | Yes | Yes | China-hosted; no vision rules it out for scan verification ([DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing)) |

Two candidates are non-starters regardless of price:

- **DeepSeek V4-Pro has no vision**, and scan verification is the one phase-1 AI feature, so it cannot cover the full workload ([DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing)).
- **DeepSeek's direct API is China-hosted**, which is a red flag for Nigerian employee data under the NDPA; the roadmap already treats fewer parties touching employee data as a privacy win, and Talabon declines to hold NINs on the same grounds ([`ai-roadmap.md`](./ai-roadmap.md)). The Workers AI-hosted DeepSeek does not have this problem because inference runs on Cloudflare's network.

## What this means for this project

The answer splits into three moves, in order of value.

### Move 1 (free, do it now): swap the default model, not the vendor

The roadmap pins `claude-opus-5`, which Anthropic itself marks legacy.
Two strictly-better moves exist inside the same platform, zero migration risk, because `tech-stack.md` already routes everything through AI Gateway and the Anthropic SDK:

- **Opus 5 → Opus 5.5** is a pure 20% price cut at no capability cost ([Anthropic pricing](https://docs.anthropic.com/en/about-claude/pricing)).
- **Opus 5 → Sonnet 5** is a 60% price cut on the same SDK ([Anthropic pricing](https://docs.anthropic.com/en/about-claude/pricing)).

The six prose features together cost ~$3.50 a month on Opus, so there was never a cost argument to touch them.
But the query assistant is ~$45 of that bill, and running it on Sonnet 5 instead of Opus 5 cuts that line to roughly $18 with no vendor change and no new failure modes.
The roadmap's own "capability split" reasoning still holds: scan verification and the assistant are exactly where a weaker model is riskier, which is why Sonnet 5 (a Claude-class model) beats any open model here.

### Move 2 (the real savings): route the agent to Gemini 3.8 Flash

The agent is the entire bill, and Gemini 3.8 Flash is explicitly engineered for "long-horizon software engineering, autonomous agents" at $0.75 / $3.75 (introductory, through Dec 31 2026, then $1.50 / $7.50) ([Google pricing](https://ai.google.dev/gemini-api/docs/pricing)).
At output pricing roughly 6-7x cheaper than Opus 5, the query assistant drops from ~$45 to roughly **$6-9 a month**, with caching pushing it lower.

This is configuration through AI Gateway, not a rewrite, which is the exact seam the roadmap says to keep.
The honest cost is two prompt styles and two sets of failure modes for the agent versus the rest, which is a smaller burden than running a second vendor across the whole workload.

### Move 3 (still deferred, but a better answer than before): Workers AI for privacy

The roadmap defers the Workers AI open-model decision to phase 2, and that still stands.
What has changed since the roadmap was written is that **GLM-5.3 Flash** is now a genuinely multimodal model at $0.15 / $0.50 that "outperforms GLM-5.2 across benchmarks ... while approaching Claude Opus 4.8 on coding and agentic benchmarks" ([Workers AI changelog](https://developers.cloudflare.com/changelog/product/workers-ai/)).
The privacy argument in the roadmap (salaries, disciplinary records and attendance never leaving Cloudflare) is unchanged and is the strongest reason to revisit this at phase 2.

The counter-argument is also unchanged: two model paths mean two prompt styles and two evaluation sets, and at this volume that maintenance cost plausibly exceeds the dollars at stake.
Nothing here overturns the deferral.

## Recommended funding number

If moves 1 and 2 are taken, the plan re-prices to roughly:

| Line | Model | $/month |
| --- | --- | --- |
| Six prose + scan features | Claude Sonnet 5 (batch + caching) | ~$2 |
| Query assistant | Gemini 3.8 Flash | ~$6-9 |
| **Total** | | **~$8-11** |

Fund **$15 a month** for comfortable headroom, down from the $50 the Opus-5-only plan implied.

The conservative path, if keeping a single vendor is worth more than the last few dollars, is: keep everything on Claude, move the default from Opus 5 to Sonnet 5, and fund **$25 a month** (assistant ~$18 plus the ~$3.50 six-feature line plus slack).

## Sources

- [Claude Opus 5 overview (Anthropic)](https://platform.claude.com/docs/en/models/opus-5/overview) - legacy status, lineage table, $5/$25
- [Anthropic pricing](https://docs.anthropic.com/en/about-claude/pricing) - Opus 5.5 $4/$20, Sonnet 5 $2/$10, batch 50% off, cache read 10% of input
- [Gemini API pricing (Google)](https://ai.google.dev/gemini-api/docs/pricing) - 3.1 Pro $2/$12, 3.8 Flash $0.75/$3.75 intro, batch 50% off, context caching 90% off
- [Workers AI pricing (Cloudflare)](https://developers.cloudflare.com/workers-ai/platform/pricing/) - neurons, GLM-5.3 $1.40/$4.40, GLM-5.3 Flash $0.15/$0.50, Kimi K2.6 $0.95/$4.00, DeepSeek V4 Flash $0.44/$1.32
- [Workers AI changelog (Cloudflare)](https://developers.cloudflare.com/changelog/product/workers-ai/) - GLM-5.3 Flash multimodal announcement, frontier models requiring Workers Paid
- [Workers AI model catalog (Cloudflare)](https://developers.cloudflare.com/workers-ai/models/) - capability descriptions per model
- [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing) - V4.1-Flash $0.15/$0.60 off-peak, V4-Pro $0.66/$1.98 off-peak, vision on Flash only, peak/off-peak tiers
