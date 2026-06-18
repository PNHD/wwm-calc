# WWM Calc — project guide for AI agents

**This repo is ONLY the "Where Winds Meet" gear graduation calculator.**
- GitHub: `https://github.com/PNHD/wwm-calc` (branch `main`)
- Live: https://wonton-wwm.pages.dev/ — deploys on push to `main` (Cloudflare Pages, build `npm run build`, output `dist`).
- Stack: Vite + React + TS. Author shown in-app: **Wonton**.

## Project boundary — do NOT mix projects
A separate project, **Thiên Kim**, lives in `D:\Thiên Kim` with its OWN GitHub repo and its own Cloudflare site (thienkim.pages.dev). The `tk-pipeline/` Worker (hono + D1, wrangler name `thienkim`) belongs to Thiên Kim and was moved OUT of this repo. **Never add Thiên Kim / tk-pipeline / n8n / content-pipeline code here**, and never bring WWM code into Thiên Kim.

## LOCKED DECISIONS — do not "fix"/revert these (they are intentional & verified)
Other agents have repeatedly reverted these thinking they were bugs. They are correct.

1. **Tier = 95下 (T91 Global).** `WWM_DATA.tiers["95下"]` + the damage formula in `src/utils/calc.ts` are verified against the official Excel (`燕云调律计算器`, sheets `各等级模板`, `伤害公式`, `各流派历史等级毕业配置`). Do not alter tier constants or the pen/precision formulas.
2. **Inner ways are IN-COMBAT buffs**, not character-menu stats. `adjustedPanel` adds the full `iwStats` (pen/crit/critDmg/aff/affDmg/outerDmg/pzPen/pzDmg) on top of `basePanel`; `generalDmg` stays in its own multiplier bucket. Do NOT go back to ignoring inner-way stats.
3. **`computeGearPanel` IS used** via the `basePanel` memo. When "Auto Panel From Gear" is ON, the panel readout recomputes from equipped gear. Do not delete this call or call it "dead code".
4. **"Auto Panel From Gear" defaults OFF** (manual panel). Keep it default-off.
5. **Cultivate tab uses 条 (substat-count) units.** Targets = verified 95下 graduated substat counts (`GRAD95_COUNTS`); current = gear sum ÷ 95下 max roll. NOT value caps, NOT "count×roll value", NOT "CN Lv105 × 0.604". The Cultivate tab has 3 sections: 培养总结 / 定音词条总结 (tuned-substat upgrade ranking) / 培养建议 (greedy next-8 advice). Keep all three.
6. **There is NO "Fire-Fist-Healer" path** (it was fake — removed). Only the 8 verified 95下 paths exist in `GRAD95_*`.
7. **Swap Sim & Rotation Sim tabs were intentionally removed**, replaced by **Transmute Advice**. Do not re-add Swap/Rotation Sim.
8. In-app labels: **Author = Wonton**, **"Edition: Global (T91 / Lv95)"**, NO version numbers.
9. **UI text is English.** The Vietnamese/Chinese strings remaining in `ocrParser.ts` and the OCR slot/stat detection are FUNCTIONAL keyword matching for VN/CN game clients — do not "translate"/remove them.
10. **`src/utils/englishCalc.ts` is dead code** (not imported). Don't trust it as a reference.
11. Gear-slot click in the Panel Simulator is **non-destructive** (opens the slot inventory). Unequip is the small **✕** button on the slot. Don't make a plain click unequip.

## Build / verify / deploy
- `npm run build` = `vite build` only (esbuild strips types — TS errors don't block the build). `npx tsc --noEmit` is the lint check and should stay clean.
- Verify behaviour in the dev server before pushing; deploy = commit + push `main`.
- If the live site shows old UI, the Cloudflare Pages build is stale — check the project is connected to `PNHD/wwm-calc` @ `main` and the last deployment succeeded.

## Before changing calc/data, re-read the source
The numbers come from the Excel sheet, not guesses. If a value "looks wrong", check it against the Excel 95下 columns first.
