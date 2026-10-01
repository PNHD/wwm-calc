> Historical phase evidence below. Earlier publication HOLD and source-first next actions are superseded by the owner incremental-release policy in AGENTS.md and PROJECT_STATE.md (2026-10-01). See RELEASE_UI_20261001.md for the current release gate.

> Historical upstream phase evidence (code8631b88). Superseded for the current UI gate by [UI_ACCEPTANCE_20261001.md](UI_ACCEPTANCE_20261001.md), tested code `989457ced42939ebc1046b377287a71b6dcc32af`. Publication HOLD.

# Upstream candidate local evidence

Work item: WWM-BUILD-UPSTREAM-20261001. Date: 2026-10-01.
Base: 4debf129fe9353c058020129dae0712b6befe29e. Branch: feat/upstream-20261001.
Workspace: D:/WWM Calc-upstream-20261001. Immutable tested/built code ref: 8631b88a814bb2d935c684f797cf6c0b33bf5a89. Subsequent checkpoint commit changes documentation only.

Milestone acceptance: PARTIAL; SOURCE_BLOCKED. No push, PR, merge or deploy. Existing live main is preserved. Local validation is separate from Product Owner acceptance.

## Numerical evidence

`scripts/validate-upstream-delta.mjs` bundles actual candidate modules and loads immutable baseline modules using git show. It checks valid formula inputs against baseline, reproduces invalid direct-affinity and cross-Path/prototype lookup defects, exercises skill overrides and priced samples, seed repeatability, preset boundaries and the independent ordered authoring contract.

- Normalized 60-second frequency case: before = after = 2,153,276.866022699 total damage. This is a kernel comparison with normalized inputs, not a live-site DPS claim.
- Invalid imported direct-affinity: old pAff 2.107878787878788; candidate pAff 1. Valid calibrated rates/formula outputs unchanged.
- Override case total: 2,095,336.3260586495; 190 priced samples preserve fractional aggregate weights.
- Seed17 / 2,000 runs: expected DPS 35,887.947767044985; mean 35,887.54215429283 (-0.00113022%). Same seed repeats exactly. This models weighted priced outcomes, not measured action-replay variance.
- Observed inventory / override browser case: current 47,122.39023526175; predicted candidate 46,547.3883353196; actual after equip 46,547.3883353196. Display rounding has separate tolerance. Raw hooks use eight decimal places.
- Synthetic ordered contract: 30-second total348; excludes boundary/pre-pull damage, retains legal pre-pull state, truncates hits and retains tail ticks, expires buffs, supports two Qi windows and resource changes. The 60-second case keeps eight DoT ticks. Unknown IDs and invalid cadence fail closed. These are scheduler contract checks only.

Raw evidence: `.local-evidence/upstream-20261001/kernel-contract-report.json`, `kernel-contract.log`, `equip-parity.json`. Failed reproduction logs are retained, not counted as passing gates.

## Verification and limits

- Candidate build: npm run build (full prebuild migrations plus Vite); exit0 in candidate-build.log. dist/build-info.json identifies code ref8631b88. SHA-256 artifact and changed-file manifest: candidate-manifest.json. Existing >500kB bundle warning remains.
- Static gate: 30 checks, zero failures in final-checks.log/checks-summary.json; includes lint/typecheck, compiled OCR suite, formula/model, panel/Global/path, storage security/registry, library, Arena/GVG and source validators.
- Migration determinism: two successive full migrations; changed-file arrays both empty in migration-determinism.json. Compatibility guards preserve new call graph while retaining existing legality checks.
- Candidate browser result: 33/33 PASS, exit0, candidate-browser.log (1.8 minutes). Suites cover existing release/library/Arena/GVG/Attunement/training/workspace and upstream equip/override, reference/preset roundtrip, unsupported preview, seed/late-worker/cancel and Best Build navigation cancellation. Earlier full run had 32 PASS and an invalid cancellation fixture; fixed the fixture to use legal positive physical-only lines, preserving production legality guards and failed logs.
- Layout evidence: rotation-390.png (390x844), rotation-1024.png, rotation-1440.png; explicit no horizontal overflow and desktop fixed-rail bounds checks. Existing mobile count editing, refresh and back/forward exercised.
- Performance: Chromium 6x CPU slowdown measured the old immutable synchronous 2,000-run loop blocking for 218-314ms (browser-profile.json). New Monte Carlo runs in a worker. Scale gate covers 50/100/250 inventory items; bounded per-render cache removes duplicate panel repricing. Fixture includes repeated items; this does not prove arbitrary distinct inventory search complexity. Best Build retains exact<=120k / beam1500 limits.
- Focused self-review: bounded JSON cloning/shape validation; finite counts/Qi/stacks; own-key skill lookup; worker generation plus complete input fingerprint; termination/reset on input, path/tab changes, cancel and unmount; historical records preserved. No independent reviewer or Product Owner acceptance is claimed.
- Node24.15.0 is installed; project declares Node22 >=22.16 <23. No existing Node22 found; no install performed. Required Node22 validation remains a condition. Account/provider model/effort/quota/session ID not exposed: UNKNOWN.

## Source and license inventory

greydust/where-builds-meet pin4b14226287fcdb0335f8a35181cc746d161b5ba2: GPL-3.0-or-later, ideas/patterns only, no copied GPL source/CSS/assets. Inspected corrections include 9691fca8268e987cbdb3ae54585389a378c17d16 (Piercing Dart), f0128f4007803700c0c32b08a34ed8a84964c4ad (multiple Qi cycles), 2c50caa5075ec3be081e8d1eec4057bf67b8d328 (ownership) and 69c02eda009e0bf4c14f42e26059b2ae1b192be3 (path cache).

M1zuke/where-winds-meet-dps pin7239b2981357d279a67806568a88753208087b20: adapted only five authored Umbra reference data records; complete MIT notice in THIRD_PARTY_NOTICES.md; each record retains repository, SHA, source path, class/build, window, Qi and maturity. No third-party image assets added.

Official [September16 notes](https://www.wherewindsmeetgame.com/news/official/PerilousEminencePatchNotes.html) confirm Sword Energy's non-player condition is independent of Exhausted and a description correction. [September23](https://www.wherewindsmeetgame.com/news/official/921update.html) and [September30](https://www.wherewindsmeetgame.com/news/official/929update.html) image bodies were inspected; no new combat coefficients were established. Current news is separated from numerical calibration cutoff (August24); no blanket Global2.2 validation claim.

## Genuine source gate / next task

Qualify attributable Global client/spreadsheet evidence for ordered Umbra skill IDs, per-hit/cancel/DoT application/refresh/reach and buff/resource effects; Sword Energy/Splendor condition coverage; disputed penetration/target reductions/Piercing Dart calibration; and weighted legal retune pools by slot, Path, gear level and line. Match exact supported version before integration. Upstream measured anchors and disputed/extrapolated tiers cannot close this gate.

Until those mappings/pools exist, ordered reference numerical apply and probabilistic retune remain unavailable, Cinder Ash is disabled when current aggregate rows cannot map it, accepted calibration and historical graduation remain unchanged. Independent local work is checkpointed; expanded publication remains HOLD.
