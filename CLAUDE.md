# WWM Calc — project guide for AI agents

WWM Calc / WWM Build Lab is the fan-made Where Winds Meet Global calculator.

- Product version: `1.0.0`
- Current context: Global 2.0, active calibrated profile Tier 96
- Canonical production: https://wonton-wwm.pages.dev/ (Cloudflare Pages)
- Repository: https://github.com/PNHD/wwm-calc

## Source of truth and project boundary

Current Git and artifact metadata, followed by current README/V1 release documentation and manifests, outrank historical agent instructions when they conflict. Do not encode a mutable current HEAD SHA in guidance.

Keep WWM Calc separate from Thiên Kim, `tk-pipeline`, n8n, and content-pipeline code. Those systems have their own repositories and deployment surfaces; do not mix their code or configuration into this project.

Unsupported or unverified mechanics remain explicitly modeled, reference-only, or UNKNOWN until current Global evidence supports a stronger claim. Do not guess or silently convert historical T91/Lv95 values into current Tier 96 facts.

## Calculator and UI invariants

- Inner Ways are in-combat buffs and remain separate from character-menu stats and their multiplier buckets.
- `computeGearPanel` remains the source of the automatically computed equipped-gear panel; do not reintroduce a manual/auto toggle.
- Cultivation retains a historical Global T91 / 95下 reference model: `GRAD95_COUNTS` contains verified historical graduation substat counts; current count = summed gear substat value / historical 95下 max roll, and target = the historical verified graduation count. Preserve Cultivation Summary, Tuned Substat Summary, and Cultivation Advice with these semantics. They are not the active Global 2.0 / Tier 96 calibration; do not migrate them to value caps, T96 caps, or another model without a separate evidence-backed task.
- The removed Swap Sim and Rotation Sim tabs must not be restored. The user-approved Rotations editor is a separate current sub-tab and may remain.
- OCR Vietnamese/Chinese strings are functional keyword matching for supported clients; do not remove them as translation cleanup.
- `src/utils/englishCalc.ts` is not an authoritative reference unless current imports make it one.
- Panel Simulator gear-slot clicks open inventory; the small `✕` control performs unequip.

## Build, integration, and production

`package.json` is authoritative for npm lifecycle behavior. `npm run build` runs the applicable `prebuild` processing before the `vite build`; do not describe it as an isolated Vite command.

Main is operationally protected. Normal changes use a task branch and pull request, required CI must pass before integration, and push, merge, and deployment require explicit authorization. V1 production verification must use exact-SHA evidence. Do not treat the stray Worker or old Cloudflare bot configuration as canonical deployment truth.

Before changing formulas or game data, re-read the current evidence and owning documentation. Preserve explicit maturity, provenance, and UNKNOWN boundaries.
