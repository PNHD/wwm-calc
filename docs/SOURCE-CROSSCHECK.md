# Source Cross-Check

Date: 2026-07-09

## Sources Checked

- Workbook `WWM 燕云调律计算器.xlsx`: authoritative local source for current T91/T96-preview constants and Violetta formula sheets.
- `app.min.js` / `optimizerWorker.js`: source data extracted from the CN yysls-style calculator.
- `https://wherewindsmeetcalculator.com/wiki/damage-formula`: matches the workbook zone model and probability notes closely enough to use for formula sanity checks.
- `https://wherewindsmeetcalculator.com/build/*`: useful for build/path coverage and public target examples, but not authoritative for Global constants because many pages show higher CN-style target values.
- `https://wwm-stats-calculator.com/mechanics`: useful UI/UX inspiration for DPA-style gear comparison and boss dummy calibration, but its simplified probability ladder conflicts with the workbook/public formula in places, so do not copy formulas from it without numeric validation.
- `https://wherewindsmath.pages.dev/`: credits the same sheet lineage, but exposes little static formula detail from HTML alone.
- Official dashboard `https://www.wherewindsmeetgame.com/m/2025h5sjgj/en/`: useful for live character import and stat labels; locked behind login for player data.

## Applied Now

- Kept the workbook zone formula as the app's main engine.
- Kept current Global default on T91 and added T96 Global preview from workbook `95上`.
- Fixed Crit/Affinity overflow: when `crit + affinity > 100%`, Affinity squeezes Crit first, then Precision gates Crit.
- Added direct UI labels and `name` attributes so the main calculator and modal fields are clean in browser accessibility checks.

## Deferred Until Verified

- Do not switch to `wwm-stats-calculator`'s DPA ladder as the main formula yet; it says Affinity checks first, while the Violetta/public formula describes Precision-first with Affinity still available on graze.
- Do not import CN Lv100/Lv105 target constants as Global defaults.
- Do not auto-update every build/path target from public build pages until a per-build numeric diff against workbook rows is generated.
