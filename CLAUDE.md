## Coding standards and tech stack

Always follow `docs/tech-stack.md` - the tech stack and coding-standards contract for this repo.
Read `CONTEXT.md`, `docs/system-design.md`, and the relevant `docs/adr/` before writing any code.
Start from the ADR index at `docs/adr/README.md` to find which decisions apply to the module you are touching, then read those ADRs in full.
Where the standards doc and an ADR disagree, the ADR wins.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues for this repo, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map to labels of the same name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: the domain vocabulary lives in `CONTEXT.md` and decisions live in `docs/adr/`. See `docs/agents/domain.md`.
