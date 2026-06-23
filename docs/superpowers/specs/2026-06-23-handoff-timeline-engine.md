# Handoff — Timeline Engine line (for Claude A)

> Date: 2026-06-23 · Author: timeline-engine agent
> Branch: `main` (Cloudflare Pages auto-deploys on push)

## TL;DR
Phase 1 of the rotation/DPS-timeline systems is **done and pushed**. The reusable
engine + skill-timing data exist as standalone modules. **Phase 2 = Rotations
editor** is next and is yours. The verified damage formula (`calcSkill`),
graduation %, and the Damage-Stats / Monte-Carlo work are untouched.

## What's DONE (this line)
| Commit | File | What |
|---|---|---|
| `6452f7b` | `src/utils/timelineEngine.ts` | Reusable `simulateRotation()` / `simulateBuild()` — wraps `calcSkill` so ANY rotation → total/dps/per-skill/hit-type breakdown. Reproduces `rotationStats` for the built-in rotation. |
| `d6a85f9` | `src/data/skillTiming.ts` | Per-skill cast-time/cooldown (CN, from competitor) + `lookupTiming(name)` (strips `(...)` condition tokens before keyword-match). 28 timings. For cast-DENSITY only — damage stays on `calcSkill`. |

Already on `main` (verified present, NOT lost in any merge): the **Realistic-DPS
UI** — `dpsEff` state + custom_config persist + "Rotation efficiency" slider
(App.tsx ~3922) + "Realistic DPS ≈ …" banner line (~3974). Default eff 1.0.

## Engine API (use this in Phase 2)
```ts
import { simulateRotation, simulateBuild, RotationSim } from "./utils/timelineEngine";
import { lookupTiming } from "./data/skillTiming";

// rotation: RotationItem[]; panel: PanelStats; tier: TIERS[k]; opts: {set,datang,yishui,buildKey}
const sim = simulateRotation(rotation, panel, tier, opts, rotationTimeSeconds);
// → { totalDmg, dps, breakdown{crit,aff,normal,abrasion}, perSkill[{name,total,perHit,dps,share}] }
const t = lookupTiming("Scarlet Spin (5 Echo)"); // → { castTime: 0.55, ... }
```
- `RotationItem` = `{ name, count, isDingyin, generalBonus, yishui, tiaozhan }` (src/types.ts).
- The built-in rotation per build: `getRotationForBuild(buildKey)` (returns CN-named skills for bamboocut-dust), window: `getRotationTimeForBuild(buildKey)` (60s for 破竹尘).

## Phase 2 — Rotations editor (your task)
Goal: let the user view/edit the current build's rotation and recompute DPS live.
- New tab in the `grad-tabs` group (App.tsx) — mirror how the existing tabs render.
- Show `getRotationForBuild(selectedBuild)` rows; let user edit each `count`
  (and add/remove/reorder rows). Keep edits in component state (persist later).
- Recompute with `simulateRotation(editedRotation, adjustedPanel, activeTier, opts, getRotationTimeForBuild(selectedBuild))`.
- Show the resulting DPS + per-skill table; compare to the built-in `rotationStats`.
- Use `lookupTiming(item.name).castTime` to optionally show "casts that fit the
  window" / flag over-stuffed rotations. (lookupTiming is best-effort — for
  bamboocut-dust refine the name→timing map if needed; it's CN-keyword based.)
- ⚠️ This is the **Rotation Sim that LOCKED #7 removed** — it's being re-added on
  PURPOSE (user-approved). Note it in CLAUDE.md so it isn't reverted.

Then Phase 3 = Skill editor (edit coeffs/timing as a CUSTOM-OVERLAY, never
overwrite the verified `SKILL_DB`/Excel defaults), Phase 4 = Team builder
(sum per-member `simulateRotation`). Order agreed with user: Engine→Rotations→Skill→Team.

## Constraints / don't-touch
- **Verified formula** `calcSkill` (LOCKED #1) — CN timings are for cast-density, NOT damage.
- **Graduation %** stays on the theoretical `rotationStats` number.
- **`.gitignore`** and **CLAUDE.md** — coordinate before editing.
- The app is **validated vs in-game** (theoretical 40,107 vs real dummy 39,191; comp matches). Don't chase the gap by changing the locked formula.

## AutoClaw Excel-vs-app findings (PENDING user decision — do NOT apply yet)
3 docs in user's Downloads compare the official Excel vs app. Most flags are
already-handled or non-issues, so they are NOT actioned:
- 会意 uses max attack → app ALREADY does (`dA_*` use `maxO_e`/`maxPz_e`). ✓
- 判定抗性 → app ALREADY applies it (`jR = 1+judgeRes`, effective crit/prec). ✓
- 减伤 multiply → enemy damage-reduction = 1 on a dummy → no DPS effect. n/a
- 穿透 /100-rule (Excel text: positive→/100; app: positive→/200) → LOCKED #1 + app
  matches in-game; changing it would break the calibrated rotation. Needs user sign-off + re-validation, NOT a blind change.
- JJ快3蓄 uses 骑龙 numbers → different class (Mo Blade), doesn't affect bamboocut; low-pri data fix if confirmed.

## Verify / deploy
- `npx tsx <tmp>.ts` for engine/data unit checks (no framework); `npx tsc --noEmit` must stay clean; `npm run build` (vite).
- Deploy = commit + push `main` → Cloudflare Pages.
- Multi-agent: commit only YOUR files; re-`git fetch`/rebase before push; PowerShell shows git stderr in red even on success — check the `a..b main -> main` line.
