# Current backlog audit and repairs

Date: 2026-09-30. Scope: WWM Calc local audit/repair against current origin/main.

## Starting state

- Canonical repository: https://github.com/PNHD/wwm-calc.
- Original checkout: D:/WWM Calc, main at 3362d79c8852ed2a1acee8ba0ee4f048aaa6517a; 312 commits behind fetched origin/main. Untracked AGENTS.md and reset_sunshine.bat preserved.
- Repair worktree: D:/WWM Calc-backlog-20260930, branch fix/current-backlog-20260930, HEAD/base 647e19f2d5bf6baf150d20e7c419c13018333415. Changes remain uncommitted.
- Current canonical context: Global 2.1, accepted T96 fixture; Cultivate counts remain historical T91 / 95下 references. Old handoff names, main-push instructions, isolated-vite-build instructions and several TODOs are stale.
- GitHub read-only preflight: no open issues or PRs returned. Validate run 33749908159 succeeded for the exact base SHA. This is baseline evidence, not CI approval of this patch.

## Confirmed repairs

| Defect | Evidence before repair | Result |
| --- | --- | --- |
| Silkbind-Jade selection crashes the app | Chromium pageerror: Cannot access 'pr' before initialization; empty body | Move existing scenario/event-pricing helpers before render-time use; derive equipped gear before the memo; selection and saved-path refresh pass |
| Stat Priority uses inconsistent roll amounts | Critical 11 vs canonical 9; Formless Pen 11 vs 13; Martial 5 vs 6.2; All Arts 5 vs 3.2; Boss 2 vs 3.2 | Reuse GLOBAL_T96_ROLL_CAPS, label unsupported increments hypothetical, show graduation percentage points, use the same evaluator for the marginal baseline and Jade objective duration/Attunements |
| Legacy theorycrafting text claims universal priority/thresholds | T91-era thresholds and unconditional rankings shown under a current T96 heading | Replace obsolete claims with the selected-scenario contract; generic stat pricing now honors Skill Editor overrides |
| Cultivate count units drifted | Historical target counts divided by T96 77.8 for physical attack, while other count rows used historical units | Read count denominators from retained 95下 subCaps; count equipped gear only; retain all three Cultivate sections and historical warning |
| Existing analysis tools lose navigation entries | Best Build hides Optimize navigation; new shell omitted Priority, Cultivate, Transmute and reference routes | Restore these existing tools under More & Advanced, with typed route mappings and inspector destinations |
| Hash navigation changes shell but leaves old tool open | Changing #pve/priority to #pve/cultivate still rendered Stat Priority | Route events also select the owning existing product tab |
| Invalid route and null shell state brick the app | Chromium pageerrors reading undefined.label and null.gvgView; empty body | Allowlist shell fields and route names; fallback to overview without changing build storage |
| Model/About disclosure and issue context are brittle | Release browser test intermittently found disclosure hidden; issue body used literal escaped newlines | Use native details/summary; preserve real Markdown newlines; normalize Windows line endings in the existing disclosure test migration |
| Calibration guidance conflicts with its persistence/model | Claims character-wide storage and requires recalibration after ordinary gear changes | Explain scheme-scoped residual calibration, static Attribute Buff subtraction, automatic gear/Inner Way recomputation, and progression/mismatch recalibration |

## Historical proposals reconciled

- Stat Priority, Attunement semantics/diagnostics, transmute advice, automatic panel/attribute conversion, all-Path selection and Rotations editor already exist. Reuse their current implementations; do not restore removed Swap/Rotation Sim tabs.
- Graduation is a historical reference, not an authoritative current T96 completion badge. Do not introduce old C/B/A/S thresholds as current verified targets.
- Extra standalone converters, alerts and proposed feature ideas from the old handoff are not release blockers unless current product requirements establish them.

## Validation

- Runtime: Node 22.23.2 (within the repository's Node 22 range), Playwright 1.55.0, existing cached Chromium.
- npm run build and npm run lint: exit 0.
- Validators: V1 storage/security, T96 product/menu/diagnostics, production OCR, Pages dist, Guild War, Library, Arena, Silkbind-Jade/evidence and Competitive V2: exit 0.
- npm audit --omit=dev --audit-level=high: zero vulnerabilities.
- Full local Chromium acceptance: 25/25 pass, including new Path selection/refresh, restored-tool navigation/roll units/historical equipped-count and invalid-shell/deep-link regressions.
- Existing responsive release gates cover 1440, 1024 and 390; restored advanced tools separately measured document/body width 390 at viewport 390. Priority screenshot inspected.
- Repeated apply:global-v2 runs: same source digest before and after both runs, 5283ceaa1c03c59614503ed95299d7e4efb6b5cf8955029a9f9201103cb5ec57.
- Browser tests used local copies with only the preview origin changed from occupied port 4173 to 4187. Canonical tests retain their normal CI port. No CI workflow or package manifest/lockfile was changed.
- Existing Vite chunk-size warning remains; no new dependency or speculative refactor was added to suppress it.
- Raw local logs, reports and screenshots: .local-evidence/backlog-20260930/. Read backlog-validation-extra.json for actual exit codes of the four npm validators: an earlier PowerShell log filename contained a colon and prevented those commands from executing; they were rerun successfully with valid filenames. The earlier backlog-checks.json alone is insufficient evidence for those four gates.

## Remaining conditions / UNKNOWN

- Full current Global Relaid Modulating caps remain unverified. Keep N/A; do not invent a cap table.
- Non-calibrated Paths, unresolved Jade/Blossom coefficients, Arena empirical win probabilities and unknown Guild War mechanics retain their existing modeled/UNKNOWN boundaries.
- Current-client evidence after the documented model cutoff (2026-08-24) has not been established by this local code audit. News-watch metadata remains 2026-09-02; this task does not claim fresh live-game recalibration.
- Cultivate tuned-line/next-eight advice remains reference/model-scoped, not independently calibrated current-T96 gear advice.
- Remote CI for this patch, independent review, Product Owner acceptance, push/merge and exact-SHA production deployment have not occurred.

Preview: http://127.0.0.1:4187/. Local technical status: PASS WITH CONDITIONS; production acceptance remains open.

## Resume verification

- Verified at 2026-09-30T08:00:38.826Z; repair HEAD/base and remote main remain 647e19f2d5bf6baf150d20e7c419c13018333415.
- Current binary diff SHA-256 matches the saved patch: a7e7671d362a98aea81a8154a3ec6dd3b8aecdad83f7c16cdb8e2df17f181061. No source changes were needed; prior full validation is retained.
- Historical follow-up turns ended with usage_limit_exceeded before any tool calls. No interrupted mutation was found.
- Completed local source/preview review. Jade selection, Stat Priority route, issue-template Markdown newlines and 390px widths for Priority/Cultivate/Transmute pass without page errors. Desktop/mobile screenshots inspected; raw results: .local-evidence/backlog-20260930/resume-review.json and resume-preview-review.json.
- Preview restored at http://127.0.0.1:4187/. Original checkout and transcript preserved.
- Local technical gate remains PASS WITH CONDITIONS. This review is not independent acceptance; independent review, PO approval, remote CI and production gates remain open. Push/PR requires explicit authorization under AGENTS.md.
