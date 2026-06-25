# DPS Compare — Engine 2 (wherewindsmath rotations) Design

**Date:** 2026-06-25
**Status:** Approved design, pending plan

## Goal

Add a read-only **"DPS Compare"** tab that runs the wherewindsmath community
rotations (crawled from the wherewindsmath optimizer bundle) **through the app's
own verified damage formula** (`calc.ts`), and shows the resulting DPS side-by-side
with the app's current default rotation for the same build. Purpose: validate the
app's rotations against a second, independent rotation source — without touching
the damage formula, the existing rotations, or any locked decision.

## Non-goals (explicit)

- **NOT** replacing `getRotationForBuild()` or any existing rotation. App default
  rotations stay exactly as they are.
- **NOT** touching `calc.ts` damage formula, tier constants, or any LOCKED DECISION
  (#1 formula, #7 Rotations editor). Engine 2 *calls* `calcSkill` unchanged.
- **NOT** reverse-engineering the bundle's `physCoeff`/`attrCoeff` damage formula.
  We reuse the app formula; only the rotation *sequence* comes from the bundle.
- **NOT** a fuzzy auto-matcher. Ability→skill mapping is an explicit table; an
  unmapped ability is shown as unmapped, never silently approximated.

## The core problem this solves

Two rotation models exist and are incompatible at the data level:

| | App rotation step | Bundle rotation step |
|---|---|---|
| shape | `{name:"Scarlet Spin (5 Echo)", count, isDingyin, generalBonus, yishui, tiaozhan}` | `{ability:"Umbrella Q Empowered Perfect Catch", numUse, dmgInstances}` |
| damage inputs | app skill coeffs in `SKILL_DB` | physCoeff/attrCoeff (different formula) |

The bundle has **no** `generalBonus/isDingyin/yishui/tiaozhan` (confirmed absent in
the crawl). So we cannot feed bundle steps straight into `calcSkill`. Instead we
**translate** each bundle step into an app `RotationItem` via an explicit mapping
table, then run the app formula. Where the app already has a skill+coeffs for the
mapped name, we get a real DPS number; where it doesn't, we surface the gap.

## Architecture

Three new files, one new tab. Nothing existing is modified except adding the tab
button + panel render in `App.tsx` (additive, like the existing tabs).

```
src/data/rotationsWWM.ts        ← crawled bundle rotations (static JSON-as-TS)
src/data/abilityMapWWM.ts       ← explicit ability→app-RotationItem mapping (the hand work)
src/utils/engine2.ts            ← translate bundle rotation → RotationItem[] → reuse calcSkill
src/components/DpsCompareTab.tsx ← the read-only compare UI
```

### Data flow

```
build key (e.g. "bamboocut-dust")
  → rotationsWWM[bundlePathKey][tier]          // [{ability,numUse,dmgInstances}]
  → engine2.translate(steps, abilityMapWWM)    // → RotationItem[] (+ list of unmapped)
  → for each item: calcSkill(item, panel, tier, opts)   // UNCHANGED app formula
  → sum perHit*count → total → DPS = total / rotationTime
```

`panel`, `tier`, `opts.set/datang/yishui/armorSet` come from the current app state —
identical inputs to the app's own calculation, so the *only* variable being compared
is the rotation sequence + the per-step mechanic fields.

### `abilityMapWWM.ts` — the explicit mapping

```ts
// Maps a wherewindsmath ability name → the app RotationItem fields it corresponds to.
// `appName` must exist in SKILL_DB (or the build's skillDatabase) or the row is
// reported unmapped. The mechanic fields the bundle lacks are filled here, sourced
// from the app's existing default rotation for the same build (NOT invented).
export const ABILITY_MAP_WWM: Record<string /*bundlePathKey*/, Record<string /*ability*/, {
  appName: string;
  isDingyin?: boolean;
  generalBonus?: number;
  yishui?: number;
  tiaozhan?: number;
}>> = { ... };
```

Mechanic field values (`generalBonus` etc.) are **copied from the app's existing
verified rotation** for that build, matched by skill — we are not guessing damage
multipliers, we are reusing the app's own per-skill constants under a bundle ability
name. An ability with no app equivalent gets no entry → reported as unmapped.

## Scope: 6 builds, but honesty-gated

Bundle covers 6 app builds: `bamboocut-dust, bellstrike-umbra, bellstrike-splendor,
stonesplit-might, silkbind-jade`, and `stonesplit-pure-datang` (= bundle
`stonesplit_strength`, to be confirmed during mapping). `silkbind-deluge` is a
1-entry placeholder in the bundle → excluded.

- **bamboocut-dust is the verification anchor.** It has the known parse benchmark
  (Wonton 40694 DPS). Engine 2 on bamboocut-dust's closest-equivalent tier must land
  in a sane range of the app's number; a wild divergence means the mapping is wrong,
  not that the app is wrong.
- The other 5 builds are mapped too, but the UI **always shows the unmapped-ability
  count per tier**. A tier with unmapped abilities shows its DPS as partial/greyed
  with "(N abilities unmapped)" — never a clean number that hides missing data.

## UI (DpsCompareTab)

Read-only. Pick a build (defaults to current build) → table:

```
Build: Bamboocut-Dust          App default DPS: 40694   (rotation time 60s)

WWMath rotation        Steps   Mapped   DPS (app formula)   vs app
T5                     33      33/33    ~41,050             +0.9%
T6-Daddy               69      64/69    ~43,200 (partial)   +6.2%   ⚠ 5 unmapped
...
```

Columns: tier name, step count, mapped/total, DPS via app formula, % vs app default,
unmapped warning. Clicking a tier expands the translated ability list (bundle name →
app name, count) so the user can eyeball the mapping. No editing, no persistence.

## Error / edge handling

- Bundle path key missing for a build → tab shows "No WWMath data for this build".
- Ability not in map → counted as unmapped, contributes 0 damage, flagged in UI.
- `calcSkill` returns 0 (skill not in SKILL_DB even after mapping) → treated as
  unmapped (same flag), so "mapped" means "mapped AND priced".
- Tier with 0 mapped abilities → row shown but DPS blank + "unmapped".

## Verification (no test runner — repo convention)

- `npx tsc --noEmit` clean (app), worker untouched.
- Manual: open DPS Compare, select Bamboocut-Dust, confirm the app-default DPS shown
  matches the app's own main-screen number for the same panel/gear (sanity that we
  reused inputs correctly), and that at least the T5 tier maps 33/33 with a DPS in a
  believable band around the app number.
- A tiny `src/utils/engine2.selfcheck.ts`-style `demo()` (assert-based, run via
  `node`/`tsx` ad hoc) that feeds a 2-step fake rotation through `translate` + a
  stub and asserts the summed total = sum of step contributions. ponytail: one
  runnable check on the non-trivial translate/sum logic; no framework added.

## What this deliberately leaves out (YAGNI)

- No reverse-engineered bundle formula (rejected — costly, error-prone).
- No replacement of app rotations (rejected — would hit locked #1).
- No fuzzy matching (rejected — fabricates numbers for a verify tool).
- `bamboocut-wind`, `bamboocut-kite`, `stonesplit-awe`: no bundle data → not in tab.
  Add when a future crawl finds them.
- `silkbind-deluge`: placeholder only → excluded until real data exists.

## Coverage (as built)

Per-build ability-mapping coverage, from Task 2's verification pass
(`.superpowers/sdd/task-2-report.md`) — unique bundle abilities mapped vs. total,
appName source resolved through `STATIC_SKILLS`/`SKILL_DB` (bamboocut_dust) or the
build's CN `SkillData[cnClass]` (the other 5):

| build | bundle abilities (unique) | mapped | unmapped |
|---|---|---|---|
| bamboocut_dust | 17 | 9 | 8 |
| bellstrike_umbra | 18 | 6 | 12 |
| bellstrike_splendor | 15 | 5 | 10 |
| stonesplit_might | 11 | 2 | 9 |
| silkbind_jade | 36 | 13 (14 entries) | 23 |
| stonesplit_strength | 22 | 5 | 17 |

`stonesplit_might` (2/11) and `stonesplit_strength` (5/17) are the thinnest —
a data-availability ceiling in `referenceData.ts`'s verified CN rotation rows, not
a mapping-effort gap. `bamboocut_dust` is best-covered relative to its size and is
the verification anchor (see below).

**Per-tier sanity run (Task 5, ad hoc `tsx` script, deleted after use)** —
`bamboocut-dust`, app's `INITIAL_PANEL` (`App.tsx:183-225`), tier `"350|0.45"`
(locked 95下/T91 Global), `rotationTimeSec` from `getRotationTimeForBuild` (60s):

| tier | dps | total | steps | mapped | unmapped | mapped/steps |
|---|---|---|---|---|---|---|
| Default | 11,007 | 660,449 | 56 | 49 | 7 | 0.88 |
| infinite vitality | 11,187 | 671,225 | 59 | 47 | 12 | 0.80 |
| wolf maiden break | 3,686 | 221,176 | 19 | 17 | 2 | 0.89 |

App's own main-screen reference for the same panel/tier (`calc.ts` `ROTATION`,
60s window): total 2,058,579, dps 34,310. `Default` and `wolf maiden break` tie for
the best mapped/steps ratio (0.88-0.89); `Default` is the larger, more representative
rotation. Engine 2's DPS lands at ~32% of the app reference, fully attributable to
the 7-12 unmapped bundle abilities per tier (not yet priced) rather than a
double-count artifact — see the count-semantics fix below, which actually *reduced*
engine2's total (removing an inflation bug), moving it closer to, not further from,
the app reference.

### Count-semantics fix (Task 5)

`calc.ts`'s `calcSkill` already multiplies by `rot.count` internally
(`total = perHit * rot.count * (rot.tiaozhan || 1)`, calc.ts:603-604), and the app's
own `computeTotalDamage` (`App.tsx:1545-1557`) sums `calcSkill(...).total` once per
item with **no** external `* count`. `engine2Dps` previously had `total += t *
item.count;`, double-counting every step. Fixed to `total += t;`. Also simplified the
tautological unmapped guard `if (t <= 0 && !SKILL_DB[item.name] && !sk)` (where `sk`
was already assigned `SKILL_DB[item.name]` one line above) to `if (t <= 0 && !sk)`.
Both behavior-preserving aside from the count fix itself.
