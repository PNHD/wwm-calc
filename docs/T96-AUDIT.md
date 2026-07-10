# T96 / Global Tier Audit

Date: 2026-07-09

## Current Global State

- Official April 30 gear-development post says Season 3 second half keeps Lv95 and Tier 91 as the standard.
- The app still defaults to `Tier 91 / Lv95 Global`.
- `Tier 96 / Lv95 Global Preview` is available for early comparison, sourced from workbook sheet `各等级模板`, column `95上`.

## Workbook Source

- `95下`: current Global T91 constants used by the app.
- `95上`: provisional Global T96 preview constants.
- `95上` keeps the same substat roll caps as `95下` in the workbook.
- CN `100下` / `100上` remain reference-only and are not the Global default.

## QC Notes

- Fixed a tier-selector bug: UI options for T86/T96/CN 105 existed, but missing `TIERS` entries made them silently fall back to T91.
- Fixed Transmute Advice display for Physical Pen max roll from `7.0%` to the workbook's `9.0%`.
- Fixed the rare Crit/Affinity overflow branch so Affinity squeezes Crit before Precision is applied, matching the public formula guide and the workbook probability model.
- Kept the Global T91-calibrated penetration branch: positive net penetration uses `/200`, while negative net penetration uses `/100`. The newer CN/public `/100` positive branch overstates current Global parses.
- Kept the Global T91-calibrated attribute branch: attribute damage remains defense-subtracted. The newer CN worker hidden-attribute/no-defense branch overstates current Global parses.
- Fixed graduation baseline handling: exact T91 workbook DPS remains the source of truth for current Global, while T96/CN preview tiers now normalize that baseline with active tier attack, elemental damage, and penetration constants instead of silently reusing the T91 denominator.
- T96 is marked preview until Global patch notes or live game data confirm final numbers.
- Verified with self-check, TypeScript, production build, and a fresh browser console. Vite still reports the existing large JS chunk warning; leave code-splitting as a separate performance task.
