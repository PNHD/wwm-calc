# WWM Build Lab Agent Rules

## Collaboration

- Subagents, Agent Teams, nested agents, and autonomous orchestration are OFF by default.
- Use them only when explicitly authorized by PM or the task instructions; do not begin parallel mutable work by assumption.
- Keep work scoped to the requested task and report files changed, checks run, unresolved risks, and UNKNOWNs.

## Product and evidence scope

- Current product context is WWM Build Lab / WWM Calc, Global 2.1, active calibrated profile Tier 96, product version 1.1.0.
- Preserve verified formulas and calculator invariants. Do not invent conditional mechanics; keep unsupported or unverified effects modeled, reference-only, or UNKNOWN.
- Current Git/artifact metadata and current canonical repository docs outrank historical agent guidance when they conflict.
- Do not mix this project with Thiên Kim, `tk-pipeline`, n8n, or content-pipeline systems.

## Git and release safety

- Work on a task branch and use the pull-request / required-CI flow; do not instruct direct pushes to protected `main`.
- Push, merge, deployment, and other external mutations require explicit authorization.
- Canonical production is Cloudflare Pages at `wonton-wwm.pages.dev`; V1 release verification is exact-SHA production evidence.
- Standing Product Owner authorization (renewed 2026-10-01): after each coherent change passes review and validation, publish it immediately to `https://wonton-wwm.pages.dev/` through task branch → PR → required CI pass → merge → Cloudflare Pages, without routine reconfirmation. This supersedes earlier expanded-milestone publication HOLD and does not require all source research or separate PO acceptance before shipping independent fixes. Keep unverified numerical features UNKNOWN/reference/disabled. Read production `build-info.json` to verify the exact merged SHA, then test the repaired desktop/mobile flows on production before reporting publication. This authorizes the ordinary push/PR/merge/Pages actions needed for the update; it does not authorize protection bypass, destructive Git, paid actions or credential changes. Update PROJECT_STATE.md and Airtable with the verified result and remaining conditions.
