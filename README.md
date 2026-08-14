# WWM Build Lab

WWM Build Lab is a fan-made **Where Winds Meet Global** gear and combat calculator focused on reproducible calculations, explicit data provenance, and visible confidence boundaries rather than opaque build recommendations.

The project is under active development. Some systems are already modeled and regression-tested; others remain deliberately marked incomplete when the current Global client has not provided enough evidence.

## What it does

- Compares gear and full-build outcomes using the active Global data profile.
- Models combat factors separately instead of collapsing unrelated mechanics into one score.
- Surfaces model maturity/confidence where a recommendation depends on incomplete evidence.
- Keeps scenario-specific calculations and runtime diagnostics testable.
- Uses structured validation scripts to catch data/model regressions before deployment.

## Current data profile

The active Tier 96 profile is calibrated for **Global 2.0 · Tier 96** and uses the workbook's Lv100 Upper (`100上`) constants only where they have been cross-checked against current Global evidence.

Examples currently represented include:

- Judgment Resistance: 65%
- Attribute Penetration: 22
- Attribute DMG Bonus: 11%
- Food: +120 to +240 Physical Attack
- Native Tier 96 weapon attribute lines: Void Attack
- Relaid weapons retaining their historical Path-specific attribute types

The current Bamboocut-Dust calibration also includes Tier 6 Inner Ways, a 60-second Level 96 Sword Trial Boss fixture, explicit Critical/Direct Critical handling, and separate Precision/Affinity/per-skill eligibility.

## Evidence policy

Game data is applied in this order:

1. Current English Global client screenshots
2. Official Global patch notes
3. Workbook `100上` constants
4. Observed player/dummy fixtures
5. Community or CN references, never applied automatically when they conflict with Global

A complete current Global T96 **Relaid Modulating cap table** has not been verified. Relaid items therefore show roll quality as **N/A** instead of being compared against an invented or stale cap.

Relevant evidence and migration notes live under `docs/`, including:

- `docs/GLOBAL_2_T96_UPDATE.md`
- `docs/GLOBAL_V2_INNERWAYS_DUMMY.md`
- `docs/DEPLOY_CLOUDFLARE.md`

## Validation

```bash
npm ci
npm run lint
npm run audit:global-v2
npm run build
```

Production builds emit `/build-info.json` with the commit, branch, build time, and data version so a deployed build can be traced back to source.

## Deployment

```bash
npm run deploy:pages   # Cloudflare Pages
npm run deploy:worker  # Cloudflare Worker
```

## Status and scope

This repository is still being refined. A passing build does not mean every game mechanic has been proven, and unsupported data is intentionally left unavailable rather than filled with guesses.

Fan-made project. Not affiliated with NetEase Games or the Where Winds Meet development team.
