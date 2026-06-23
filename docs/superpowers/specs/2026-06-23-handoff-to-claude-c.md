# Handoff → Claude C (from Claude A, near limit. Claude B on another project.)

Read CLAUDE.md first (LOCKED DECISIONS). Shared working tree + .git with other agents —
`git pull --rebase` before push; commit only files you touched; don't commit `.gitignore`.
**You (C) now own `App.tsx` and may touch calc/data for the IW overhaul below.**

## Current state (all deployed on `main`)
Session shipped: in-game Damage Statistics donut + Monte Carlo sim + Skill Preview;
gear analysis (DPS-by-gear, Inner-Way contribution, Ring/Weapon-Set comparison);
gear import (`gameImport.ts` + `affixMap.ts`); Phase 1-4 (timeline engine, Rotations
editor, Skill editor, Team builder); GLM redesign (3 phases, gold/dark wuxia);
**weapon set 4pc modeled** (see below); English skill-name labels (`skillNameEn.ts`).
Last commits ~`d05f6b7`. Build green, `tsc` clean.

## ✅ Weapon set 4pc — DONE (game-verified, in calc.ts)
Stars Align +15% MA, Ivorybloom +15% critDMG (+crit5), Jadeware +10% affDmg +7.5%
daff, Rainwhisper +10% critDMG (2pc fixed to +6.6% prec), Hawkwing(key `eaglerise`,
WEAPON) +10% Phys ATK (atkMult 1.10), Swaying Heights +5%, Shattered Ridge +5%.
**All sets are WEAPON sets except "Eaglerise" (key `stormrain`, defensive armour).**
Mistwillow 4pc not credited (boosts Light/Heavy attacks, not Martial-Art-Skill rotation).
See [[set-4pc-data]] memory.

## 🚧 PENDING: Inner-Way data overhaul (the main task)

**Paths in `innerways.ts` are CORRECT** (user confirmed: Breaking Point=Bamboocut-Wind,
Battle Anthem=Bellstrike-Splendor, Adaptive Steel=Bellstrike-Umbra, Throat-Piercing=
Stonesplit-Strength). Competitor grouped them differently — ignore competitor paths.

**Problem:** each IW has an "Attribute Buff" = base substat that `innerways.ts` is MISSING.
Our IW model only captured the mechanic (as `generalDmg`) + the T5 breakthrough.

**Structural blocker:** the iwStats stat object (InnerWayTier `stat`, the `iwStats` memo
in App.tsx, the `adjustedPanel` apply, and Calibrate) has fields pen/crit/critDmg/aff/
affDmg/outerDmg/pzDmg/generalDmg/dcrit/daff — but **NO `prec`, `minOuter`, `maxOuter`**.
Most missing substats are Precision / Min-Max Phys → you must **extend iwStats** to hold
`prec`, `minOuter`, `maxOuter` and wire them through: (1) the stat type, (2) `iwStats`
memo sum, (3) `adjustedPanel` (`p.prec/minOuter/maxOuter += iwStats.*`), (4) Calibrate
(subtract them, like the others), (5) `computeGearPanel` if needed.

**⚠️ Recalibration (LOCKED #1/#2):** bamboocut-dust rotation is calibrated to a real
60s parse = **38,176 DPS / 2.29M** (calc.ts ROTATION). Adding substats raises the panel
→ DPS overshoots. After adding, **measure the new DPS Expectation and bump
`ROTATION_TIME` (calc.ts) so bamboocut-dust DPS ≈ 38,176 again** (ROTATION_TIME_new =
new_total_dmg / 38176). Don't touch tier constants / pen / precision formulas.

### Verified IW data (game screenshots, 2026-06-23) — Attribute Buff + breakthroughs
Format: AttrBuff (base substat, ADD these) · mechanic · T5 breakthrough.

**Bamboocut-Dust:**
- Phantom Rally: **crit 8.2%**, physDmgBonus 2.8% (T5). Mechanic: resonance +20% (non-boss),
  Phantom Chime −2 PhysRes/stack ×5 = −10 PhysRes (works on boss). Ours has generalDmg+outerDmg2.8 → add `crit:8.2`.
- Song of Tang: **precision 6.5%**, critDmg 4.0% (T5). Mechanic: Tang Melody **+3%/stack ×5 = +15% critDmg** (Martial Art Skills). Ours critDmg=10 is WRONG → 15; add `prec:6.5`.
- Towline Sweep: **minPhys 63.8**, physPen 5.1 (T5). Ours outerPen5.1 ✓; add `minOuter:63.8`.
- Light Anew: **minBamboocut 36.2** (`minPz`), bamboocutPen 6 (T5). Ours pzPen6 ✓ + generalDmg; add `minPz:36.2`.

**General (shared):**
- Morale Chant: **minPhys 23.6 / maxPhys 47.2**, dcrit 4.6 (T5). Mechanic Yi River +2 pen/+1% dmg per stack ×5 = +10 pen +5% dmg. Ours outerPen10/outerDmg5/dcrit4.6 ✓; add `minOuter:23.6, maxOuter:47.2`.
- Seasonal Edge: **minPhys 23.6 / maxPhys 47.2**, physDmgBonus 2.8 (T5). Ours generalDmg5/outerDmg2.8; add `minOuter:23.6, maxOuter:47.2`.
- Invigorated Warrior: **minPhys 63.8**, all-dmg **8%** (T4, ours has 5 = WRONG → 8), physPen 5.1 (T5). Add `minOuter:63.8`, fix generalDmg 5→8.
- Bitter Seasons: **precision 6.5%**, physDmgBonus 2.5 (T5). Mechanic poison −1.2%/stack ×5 phys def + T6 −10 PhysRes. Add `prec:6.5`.
- Fivefold Bleed: maxPhys 56.7, critDmg 3.5 (from competitor decode, not re-screenshotted).

**Other builds (Bellstrike/Silkbind/Stonesplit):** NOT yet screenshotted by user. Competitor
decode (27 IWs) is in the conversation as a cross-ref but is INCOMPLETE (game has 40+) and
its paths were wrong — verify against game before trusting. Ask user to screenshot per build
as needed.

## Other open items
- Armor-set DPS / weapon+armor 4pc stacking: app models only ONE `p.set`. To stack weapon
  4pc + armour 4pc simultaneously needs a 2nd set param (big). Deferred.
- GLM redesign: structural shell + panes themed. Minor secondary modals already close.
- all-owned gear import: dead end (dashboard + wwmmap expose equipped only). Closed.

## Coordination
Shared tree. You own App.tsx + may touch calc.ts/innerways.ts/types.ts for the IW overhaul
(user-authorized override of locked #1/#2 — keep the parse-match via recalibration; update
CLAUDE.md if you change locked behavior). `tsc` clean + `build` OK + verify live before commit.
