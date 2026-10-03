# Talabon People Operations

The system of record for everyone who works for Talabon: who they are, the terms they work under, what happens to them during their working life, and what they get paid.

Talabon is a printing and logistics business, but this repository covers only the people side of it.
Customers, enquiries, quotes, pricing, deliveries and invoices are out of scope by [ADR 0001](./docs/adr/0001-people-operations-scope.md).

## Status

Design is complete for the MVP, which covers Permanent Engagements only ([ADR 0010](./docs/adr/0010-the-mvp-covers-permanent-engagements-only.md)).
Implementation has started with the Workers, Hono, D1, R2, React Router SPA and real-D1 test scaffold.

The MVP builds four modules - Identity, People, Documents and Self-service - on Cloudflare Workers, Hono, D1, R2 and React Router v8.

## Run the scaffold

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

The Worker serves the React Router SPA and Hono API from one entry point. The API smoke route is `GET /api/health`.

Apply the D1 migrations locally with `npm run db:migrate:local`. Run `npm test` for a production SPA build and integration tests against the local Workers runtime and D1. Run `npm run typecheck` to regenerate Cloudflare and React Router types and check the TypeScript project.

Before deploying, create the `talabon` D1 database in `WEUR` and the `page3pro-files` R2 bucket, then replace the local placeholder `database_id` in `wrangler.jsonc` with the created D1 ID.

## Read before writing code

Start here, in order:

1. [`CONTEXT.md`](./CONTEXT.md) - the domain vocabulary.
   Every term in code, routes and tests must come from here.
2. [`docs/adr/README.md`](./docs/adr/README.md) - the decision index.
   Find which decisions apply to the module you are touching, then read those ADRs in full.
3. [`docs/system-design.md`](./docs/system-design.md) - the modules, data model and API surface.
4. [`docs/tech-stack.md`](./docs/tech-stack.md) - the stack and coding standards.
   Where this doc and an ADR disagree, the ADR wins.

Supporting detail lives in [`docs/architecture.md`](./docs/architecture.md) and [`docs/requirements.md`](./docs/requirements.md).

## The AI features

AI is a drafting aid here, never an authority: it drafts, a human commits, and rules decide ([ADR 0005](./docs/adr/0005-ai-drafts-humans-commit.md)).

- [`docs/ai-roadmap.md`](./docs/ai-roadmap.md) - what AI does, what it refuses, and the build order.
- [`docs/ai-model-alternatives.md`](./docs/ai-model-alternatives.md) - why the models were chosen and what they cost.
- [`docs/ai-model-evaluation.md`](./docs/ai-model-evaluation.md) - the gate before the open models are trusted in production.
- Model routing and guardrails are fixed by [ADR 0012](./docs/adr/0012-model-routing-in-code-not-in-the-gateway.md) and [ADR 0013](./docs/adr/0013-ai-guardrails-defense-in-depth.md).
