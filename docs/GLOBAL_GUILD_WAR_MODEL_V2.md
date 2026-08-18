# Global Guild War Model V2

Reviewed: 2026-08-18  
Target: current Global client / Global 2.0  
Status: supersedes generic role-score and assumed-Attunement Guild War conclusions where they conflict.

## Sources and provenance

Primary official sources:

- Apr 30 Arena/Guild War Optimization — https://www.wherewindsmeetgame.com/m/news/official/PVP427.html
- May 22 Cross-Server Matchmaking — https://www.wherewindsmeetgame.com/news/official/522update.html
- May 27 Patch — https://www.wherewindsmeetgame.com/news/official/527update.html
- May 28 Version 1.7 — https://www.wherewindsmeetgame.com/news/official/Adjustment528.html
- Global 2.0 rolling patch through Aug 7 — https://www.wherewindsmeetgame.com/news/official/723update.html

Community cross-checks include MetaForge Top-100 EU and VCross strategy tooling. They are used for doctrine/strategy vocabulary only unless corroborated by current official/client evidence. MetaForge's old `Green Points` wording is explicitly historical; current official wording is **Fun Coins**.

## State model: War Room, not a planner score

Guild War V2 is phase-aware:

`PREPARATION` → `OPENING` → `LANE_RESOURCE_CONTROL` → `OUTPOST_PHASE` → `HALFTIME` → `BULWARK_PRESSURE` → `GOOSE_PRESSURE` → `FORTUNE_TREE_ESCORT` → `ENDGAME`.

Only timings proven current are fixed. Outposts have an official fixed start at 3:00. Halftime trigger, other phase timestamps and endgame boundaries remain configurable/UNKNOWN unless current client evidence establishes them.

The product keeps player build state, Guild Technique state and Commander/Fun Coin state separate.

## Current official mechanics

- roster capacity: 30 players where established
- Guild War schedule: Sat/Sun 20:30 in the current published battlegroup schedule; current in-game schedule remains authoritative
- top + bottom Outposts at t=3:00
- Outpost revive option
- Outpost ownership lock: 60s
- Panacea Resurrection: same target cannot be revived again for 60s
- Bulwark proximity DR stacks: cap 15
- Breaking Bulwark strengthens the attribute reduction applied to the enemy Goose
- Goose proximity DR stacks: cap 30
- Guild War Qi Damage received: ×0.5
- Fortune Tree interception slowdown current behavior; Ignore Interception can breach the wind wall
- Jungle: one neutral mob per camp, higher attributes, Fun Coin reward
- neutral bosses Zhang Bao and Zhuxie Gule spawn randomly ±1 minute around their base time; current base timestamps are not fabricated
- Command Skill cost/cooldown changed; exact current values are `UNKNOWN` unless captured from the current client

## League scaling

Official league scaling is represented as data, not rank-order assumptions:

- Divinarche: relevant objective/neutral HP and objective attack multiplier 0.75 where the source specifies the reduction
- Jesting Hero: 0.50
- Stealth Jester: 0.25

Neutral/objective dimensions not covered by the source wording remain separate instead of inheriting a blanket rank semantic.

## Halftime

Official fact after **entering Halftime**:

- initial DMG Bonus = 0%
- +30% DMG Bonus every 30 seconds

The current Global Halftime trigger timestamp is not hard-coded. Older community guides conflict; therefore `HALFTIME_TRIGGER = UNKNOWN/configurable`.

The V2 model also refuses to invent participants, selection flow, performer count, duel structure, winner modifier or current duration. These require client evidence.

## Commander / Fun Coins

Current term: **Fun Coins**.

Commander state separates:

- balance
- income
- spend
- cooldown
- planned cast
- actual cast
- availability

Quick Operation is represented as a current official command/operation mechanic that can be used without interrupting combat under the published optimization. Exact cost/cooldown values are manual Advanced parameters while unknown. January community values are not copied.

## Guild Techniques

Current model separates Guild Techniques from personal builds. Current supported evidence categories include:

- Breaking Army
- Trial
- Guarding Qi Core-related Guild Technique interactions/trigger interval UI
- Attribute Attack Bonus Guild Techniques
- official Formless Attack applicability where stated

Owned-guild numeric technique values remain `NEEDS CURRENT CLIENT DATA` unless directly captured.

## Guild War EX / Martial Art Techniques

Current official family cooldown rule:

- old/base 120s family → 80s
- old/base 90s family → 60s

V2 never assigns an EX to a family unless its old/base cooldown is independently verified.

Current catalog includes:

- Nameless Sword EX — Lv3 allied Qi restore 60
- Strategic Sword EX — Sword Horizon/5-Bleeding detonation/High Bleeding and unblockable dash interaction
- Heavenquaker Spear EX — stores 2 uses, Airborne utility
- Stormbreaker Spear EX — self damage reduction 75%
- Vernal Umbrella EX — Build Momentum +10% Ballistic DMG/stack, max 5
- Mortal Rope Dart EX — next 8s Rodents briefly Immobilize
- Soulshade Umbrella EX — allied Endurance 20/s
- Everspring Umbrella EX — Healing Reduction 45%, Lv3 65%
- Unfettered Rope Dart EX — 12m hit radius
- Snowparting Blade EX — shields up to 5 nearby allies; break counter
- Phalanxbane Blade EX — Airborne; 1.2s trigger interval; Lv1 10 triggers; Lv3 Endurance drain 30

## Bamboocut-Dust Guild War V2

Bamboocut-Dust is modeled as an evidence-backed capability profile, **not “meta”**.

Confirmed mechanics:

- Everspring EX Healing Reduction area: 45%; Lv3 65%
- Unfettered EX hit radius: 12m
- Guild War Qi pressure resolves under the global ×0.5 Guild War Qi Damage received rule
- Aug 2 regression: Bamboocut-Dust must not produce continuous Immobilize after death

Decision dimensions are phase capabilities: anti-heal, zone pressure, control/stagger, survival context, objective participation, main-ball/flex/escort/anti-escort utility. Personal DPS is not promoted into a fake universal GvG score.

## Role model V2

Supported role labels:

`MAIN_BALL`, `FRONTLINE`, `BACKLINE_DPS`, `HEALER`, `PEEL`, `FLEX`, `JUNGLER`, `OBJECTIVE_BURN`, `OUTPOST_CONTROL`, `ESCORT`, `ANTI_ESCORT`, `ANTI_HEAL`, `DUELIST`, `COMMANDER`.

These are capability/assignment labels; community-practice roles are provenance-labeled. A build can be strong anti-heal, average personal damage and poor objective burn without collapsing into “78/100.”

## Composition

No fixed 6/8/10 healer or 4-tank rule is hard-coded.

Doctrine templates:

- `TOP100_EU_OLD_REFERENCE` — historical/outdated reference
- `GLOBAL_COMMUNITY` — community-corroborated framework
- `CN_REFERENCE` — region/version-labeled historical comparison only
- `CUSTOM` — owner-defined

Diagnostics are mechanic-based: healing, anti-heal, frontline, peel, AoE control, Qi pressure, EX coverage, objective burn, mobility, duelist availability, resurrection and commander coverage.

## Victory / duration / prep / swapping

Current exact victory/tiebreak ordering remains `UNKNOWN`. Community combinations involving Fortune Tree delivery/distance, Goose and Bulwark are not promoted to current official truth.

Older claims of 35 minutes total / 5 minutes preparation are community evidence only. Build swapping outside combat is likewise community-reported and stays experimental/manual until current Global client verification.

## Buff items

Official settings confirm separate Auto-use Buff Food/Scroll settings for Arena, Guild War and other contexts. Specific usable/current buff catalogs are not inferred from old bathhouse/food guides.

## Objective simulator V2

Inputs are transparent:

- known/manual base HP
- league scaling
- calibrated/manual player objective DPS
- proximity stack count
- Bulwark-break → Goose debuff relation
- unknown/manual DR-per-stack

If base HP, team objective DPS or DR-per-stack is unknown, exact kill time is `null`. The UI shows sensitivity at 5/10/15/20/25/30 nearby players instead of fake precision.

## Strategy board contract

Map/timeline items share stable objective/phase IDs. An objective selection should expose phase, assigned squad, EX coverage, next Commander action and unresolved mechanics. Existing map/planner data remains useful but cannot be used to synthesize unsupported combat coefficients.

## Attunement P0 conclusion

Current official evidence distinguishes Normal Attunement from Arena Attunement, but the reviewed current Global sources do **not** establish which profile applies in Guild War or whether either stacks.

**Guild War Attunement applicability = UNKNOWN / NEEDS CURRENT CLIENT DATA.**

Therefore Guild War build ranking must not use an assumed `GVG selected profile`, must not auto-use Arena Attunement, and must not rank gear on Attunement-dependent stats until client evidence closes this gate.

## Minimum current-client evidence still needed

1. Guild War gear/detail screen showing active Attunement state/profile.
2. Current Commander skill tooltips with Fun Coin costs, cooldowns and targets.
3. Bulwark and Goose status tooltips for DR-per-stack, if exposed.
4. Halftime entry timer, performer selection and duel/outcome UI.
5. Current victory/settlement screen.
6. Player Target Boost before/inside Guild War.
7. Current total match/preparation timer.
8. Out-of-combat build-switch attempt/video if phase loadouts are to be enabled.
