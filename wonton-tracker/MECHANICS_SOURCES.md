# Wonton Reforge Lab — Mechanics Evidence Matrix

Last researched: 2026-09-20

This document exists to prevent future code changes from silently promoting community observations into official mechanics.

## Confidence classes

### Official / published

NetEase probability disclosure:
https://www.yysls.cn/news/update/20250106/40412_1204508.html

Supported:
- five reforge lattices: 1 Color, 3 Structure, 1 Bright Light
- Blue 82%
- Purple 15%
- Gold 3%
- Gold hard pity 90

Game8 corroborates the user-facing system:
https://game8.co/games/Where-Winds-Meet/archives/580464

Documented there:
- about 120 Taiyi Stones to fully open all five notches
- approximately 30 Stones per next notch
- 1 Taiyi Stone costs 200 Echo Beads
- top five Saved Optimal Plans are auto-saved by Elegance Points
- one manual saved plan
- switching plans does not reset meter progress

## Verified project data / Shadovex

Workbook:
https://docs.google.com/spreadsheets/d/18ridWD3WfpJdw95_EgwCQJPZExJfOvY-N25YClTsedM

Dataset update through 2026-08-02.

Used for:
- weapon names/types
- weapon-specific Blue/Purple/Gold set names
- non-set Color names
- regional Echo Bead package prices
- tracker convention that a locked part does not increment its visible pity counter

The workbook explicitly notes that non-set colors can have randomly generated metallic/accent tones from a curated pool. The Lab does not invent probabilities for these internal color variants.

## Strong community consensus modeled with a label

Sources:
- https://www.reddit.com/r/WhereWindsMeet/comments/1pnrxut/weapon_reforging_importance_of_nodes_and_the/
- https://www.reddit.com/r/wherewindsmeet_/comments/1sh616o/expansive_reforging_guide/
- https://www.reddit.com/r/WhereWindsMeet/comments/1r957u9/weapon_reforge_cost_and_guide/
- https://www.reddit.com/r/WhereWindsMeet/comments/1qqo5r7/affordable_method_for_reforge_relatively_speaking/

Supported community strategy:
- do not lock while opening the weapon if cost efficiency is the priority
- open through Bright Light first
- then restore a useful saved appearance and lock only parts worth protecting
- lock costs scale 1 / 2 / 5 / 10 Stones for 0 / 1 / 2 / 3 locks

Bright Light rule reported consistently:
- ordinary unmatched result: Sunlight
- full matching Purple or Gold set across Slots 1–4: Bright Light takes the matching set effect/name
- matching Blue set is not treated as a Bright Light set trigger in the Lab

## Pity-counter workflow

The Live Tracker follows the Shadovex workflow rather than asking the user to re-enter every Blue/Purple appearance after every click.

Shadovex Instructions tab:
- click REFORGE once for every actual reforge
- reset the corresponding part counter when that part unlocks or when a Legendary appears there
- locked parts do not advance their visible counter
- the workbook describes average community "softcaps" around 35–40, while the current shared Legendary Roll Count sample averages about 43.1

Additional community evidence:
- Bahamut guides describe each of Slots 1–4 as having an independent 90 hard-pity counter and commonly report Gold around 35–65
- Reddit veterans commonly track each node separately and often start paying attention around 25–35
- post-Hexi reports conflict on whether saved-plan switching preserves the hidden/extra Gold-rate state

Lab policy:
- official hard pity remains 90
- no fixed soft-pity threshold is modeled as fact
- every active + unlocked Slot 1–4 gains +1 per logged real reforge
- locked and inactive slots gain nothing
- a Gold observation resets only the selected slot counter
- newly opened slots start a fresh visible counter in this tracker
- exact quality/appearance entry is optional and is not required for pity tracking

## Legacy WWMReforge model — explicitly unverified

Reference implementation:
https://github.com/chowiemon/WWMReforge

The following exact rates are retained only as an optional legacy/community simulation model:
- Gold 3% through pity 30
- Gold 4% through pity 60
- Gold 5% after pity 60
- early unlock 2% / 3.5% / 5% by attempt tier

These exact rates are NOT present in NetEase's published probability disclosure.

## Conflicting / unknown — do not simulate as fact

Restoring an old plan after opening later nodes:
- one first-hand guide says previously absent nodes open for free and reroll randomly
- another detailed community guide says absent nodes fill with defaults
- both agree the unlock meter itself is not rolled back

Lab policy:
- preserve unlock progression
- do not claim either random-fill or default-fill behavior as verified
- Lab Snapshots remain a convenience abstraction, distinct from the game's five Optimal Plans + one manual save

Pity across saved-plan restores:
- community reports and patch-era behavior are not sufficiently consistent to assert hidden-server pity carry/reset rules
- Live Tracker treats visible pity as a user-maintained ledger
- restoring a Lab Snapshot does not mutate visible pity

## Product implications

1. Real Tracker never fabricates RNG.
2. Simulator defaults to published 82/15/3 + hard pity 90.
3. Legacy WWMReforge rates stay visibly labeled unverified.
4. Weapon-specific appearance data comes from the Shadovex dataset.
5. Bright Light is dynamic for verified full matching Purple/Gold sets.
6. Non-set color sub-variance is disclosed but not probabilistically simulated.
7. Lab Snapshots are not presented as an exact clone of the in-game Saved Optimal Plan system.
