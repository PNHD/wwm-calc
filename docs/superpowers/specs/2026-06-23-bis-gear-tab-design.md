# Design: BiS Gear tab

## Goal
New read-only sub-tab in the `grad-tabs` group showing, for the currently-selected build,
a 6-slot table of the ideal gear config: recommended Set, main-stat, and top-4 priority substats.
Pure aggregation of data the app already has — no new dynamic systems, no Equip-Items crawl.

## Data sources (all existing)
1. **Set (dynamic):** reuse the `armorSetCompare` memo (already sorted by DPS on the current panel).
   `armorSetCompare[0]` = top set + its `delta` vs current. One value for the build's weapon set
   (shown on the Weapon row). User chose dynamic-from-panel so it always matches real DPS.
2. **Main-stat per slot (static):** new const `SLOT_MAIN_STAT`, keyed by the app's REAL 8 slot
   names (`SLOTS` at App.tsx:304), from the community guide:
   - Umbrella / Rope Dart / Disc / Pendant (weapon + accessories) → **Max Physical Atk**
   - Helmet / Chest → **Crit** (Affinity for aff-builds — keep Crit; note in tooltip)
   - Greaves / Bracers → **Power**
3. **Top-4 substat priority (static-per-build):** from `GRAD95_COUNTS[build]` (verified graduated
   条 counts). Sort the build's stats by count desc, drop zero-count + the main-stat duplication,
   take top 4. e.g. Bamboocut-Dust → maxOuter 12, strength 10, crit 7, prec 3 → "Max Phys, Strength,
   Crit, Precision".

## Components
- `SLOT_MAIN_STAT: Record<string, string>` — 6-8 lines, the slot→main-stat map.
- `bisGear` memo: `{ slot, mainStat, subPriority: string[] }[]` from SLOT_MAIN_STAT + GRAD95_COUNTS
  (keyed by `cultivateClass`/`selectedBuild` mapping already used by the Cultivate tab).
  Set column reads `armorSetCompare[0]` directly in JSX (already a memo).
- JSX pane under `gradModalActiveTab === "bis"` + tab entry `{ key:"bis", label:"BiS Gear" }` in the
  grad-tabs bar, placed next to Cultivate / Transmute Advice.
- One usage line in the existing in-app help list.

## Slots (8 — the app's real SLOTS, App.tsx:304)
Umbrella, Rope Dart, Disc, Pendant, Helmet, Chest, Greaves, Bracers.
(Weapon-side use weapon sets; Helmet/Chest/Greaves/Bracers use armour sets.)

## Stat label mapping
Reuse the app's existing stat→label formatter (the one Cultivate/Transmute use, e.g. maxOuter→
"Max Phys Atk", strength→"Strength"). Do NOT hardcode a second label map.

## Out of scope (YAGNI)
- No Equip-Items database / gear catalog crawl (the dynamic set rec covers "which set").
- No gear picker, no persistence, no per-substat roll values (Cultivate already does counts).
- No second armour-set column (weapon set rec is the DPS-relevant one; armour sets are defensive).

## Data flow
build changes → GRAD95_COUNTS[build] + armorSetCompare recompute → table updates.
panel changes → armorSetCompare recomputes → Set column updates. All via existing memos.

## Test
Add a tiny assert-style check (or manual dev-server verify) that `bisGear` for Bamboocut-Dust yields
4 non-empty subPriority entries led by "Max Phys Atk", and that the Set column shows the same top set
as the live Weapon-Set comparison panel. tsc clean + build green before commit.
