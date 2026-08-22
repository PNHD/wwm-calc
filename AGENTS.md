# WWM Build Lab Agent Rules

## Collaboration

- Subagents, Agent Teams, nested agents, and autonomous orchestration are OFF by default.
- Use them only when explicitly authorized by PM or the task instructions; do not begin parallel mutable work by assumption.
- Keep work scoped to the requested task and report files changed, checks run, unresolved risks, and UNKNOWNs.

## Product and evidence scope

- Current product context is WWM Build Lab / WWM Calc, Global 2.0, active calibrated profile Tier 96, product version 1.0.0.
- Preserve verified formulas and calculator invariants. Do not invent conditional mechanics; keep unsupported or unverified effects modeled, reference-only, or UNKNOWN.
- Current Git/artifact metadata and current canonical repository docs outrank historical agent guidance when they conflict.
- Do not mix this project with Thiên Kim, `tk-pipeline`, n8n, or content-pipeline systems.

## Git and release safety

- Work on a task branch and use the pull-request / required-CI flow; do not instruct direct pushes to protected `main`.
- Push, merge, deployment, and other external mutations require explicit authorization.
- Canonical production is Cloudflare Pages at `wonton-wwm.pages.dev`; V1 release verification is exact-SHA production evidence.
