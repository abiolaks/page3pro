# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root: the domain vocabulary for Talabon People Operations. It defines every domain term and lists the synonyms to avoid, so treat it as the glossary.
- **`docs/adr/`**: read the ADRs that touch the area you are about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill creates or extends them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo:

```
/
├── CONTEXT.md          # the domain vocabulary (the glossary)
├── docs/
│   ├── adr/            # system-wide decisions
│   ├── requirements.md # the functional spec, phased P1/P2/P3
│   ├── architecture.md # the technology stack and platform mapping
│   └── ai-roadmap.md   # which AI features land in which phase
└── ...
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids: say `Person` not Employee, `Engagement` not Contract, `Missed Day` not Absence.

If the concept you need isn't in `CONTEXT.md` yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (money is whole naira, Net Pay rounds up to the nearest N100), but worth reopening because..._
