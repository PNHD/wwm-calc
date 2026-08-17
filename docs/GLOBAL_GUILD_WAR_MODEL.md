# Global Guild War / GvG Evidence Model

Last researched: 2026-08-17
Target: current **Global** Where Winds Meet client, with CN/KR material used only as explicitly labelled comparison.

## Evidence classes

- `CONFIRMED_OFFICIAL` — stated in current Global official patch notes or official schedule material.
- `CONFIRMED_CLIENT` — observable in the current `wwm-calc` client/data model or a captured current-client fixture.
- `COMMUNITY_CORROBORATED` — independently repeated by multiple Global community sources and not contradicted by current official material.
- `COMMUNITY_CONFLICTING` — credible community sources disagree or describe different patches/regions.
- `MODELED` — calculator/planner assumption, weighting, derived metric, or user-entered scenario parameter.
- `UNKNOWN` — current Global exact value could not be verified.

No CN/KR-only mechanic is promoted to Global truth.

## Primary official sources

1. **April 30 Update: Arena & Guild War Optimization Overview** (published 2026-04-27; effective 2026-04-30)  
   https://www.wherewindsmeetgame.com/m/news/official/PVP427.html
2. **May 27 Patch Notes** (published/effective 2026-05-28)  
   https://www.wherewindsmeetgame.com/news/official/527update.html
3. **Version 1.7 Path Balance Adjustment Announcement (May 28)**  
   https://www.wherewindsmeetgame.com/news/official/Adjustment528.html
4. **Version 2.0 Patch Notes: Optimizations and Bug Fixes** (official rolling page, through 2026-08-07)  
   https://www.wherewindsmeetgame.com/news/official/723update.html
5. Official news index, reviewed for post-May Guild War changes through 2026-08-17  
   https://www.wherewindsmeetgame.com/news/index.html

## Post-May current-version audit

The official Global news/patch stream was searched through Version 1.7, Version 1.8 and Version 2.0 up to 2026-08-17 for Guild War, Guild War objectives, outposts, Bulwark, Goose, Command Skills, EX techniques, and Bamboocut-Dust changes.

**Result:** no later official patch was found that supersedes the May 28 Guild War core rules below. Post-May official changes that are relevant to this product are:

- 2026-07-23 Version 2.0 contains substantial general Path and Arena changes, including current Bamboocut-Dust behavior (Everspring/Unfettered changes) and current Arena behavior. These are not evidence that Guild War core objective rules changed.
- 2026-08-02 fixes a Guild War-specific Bamboocut-Dust bug where continuous Immobilize could persist on enemies after the Bamboocut-Dust player died.
- 2026-08-07 contains network/matchmaking work but no replacement Guild War objective/EX rule table.

Accordingly, May 28 is the latest verified official source for the listed Guild War core mechanics, while July/August notes are also consulted for current Path/Arena behavior.

## Current Global mechanic matrix

| Mechanic | Current model | Evidence | Source / note |
|---|---|---|---|
| Guild War scheduling | Battlegroup scheduled; use in-game schedule as final authority | `CONFIRMED_OFFICIAL` | Apr 30. Official battlegroups/schedules are regional and may vary slightly. |
| SEA battlegroup example | Jiangzhu, Sat/Sun 20:30 UTC+8 as of Apr 30 schedule | `CONFIRMED_OFFICIAL` | Apr 30; do not turn one region into a universal schedule. |
| Xuanyuan Cult outposts | Top and bottom outposts spawn at **t=3:00** | `CONFIRMED_OFFICIAL` | May 28. |
| Outpost ownership lock | **60 seconds** after capture | `CONFIRMED_OFFICIAL` | May 28. |
| Panacea Resurrection same-target lock | A revived target cannot be revived again by Resurrection for **60 seconds** | `CONFIRMED_OFFICIAL` | May 28. |
| Bulwark proximity DR | Stacks by total nearby allies + enemies; **max 15 stacks** | `CONFIRMED_OFFICIAL` | May 28. Exact DR per stack not stated. |
| Bulwark DR per stack | User/scenario parameter only | `UNKNOWN` | Must not fabricate. |
| Goose proximity DR | Stacks by total nearby allies + enemies; **max 30 stacks** | `CONFIRMED_OFFICIAL` | May 28. Exact DR per stack not stated. |
| Goose DR per stack | User/scenario parameter only | `UNKNOWN` | Must not fabricate. |
| Guild War Qi damage taken | **50% reduction**; calculator multiplier = `0.5` | `CONFIRMED_OFFICIAL` | May 28. |
| Jungle camp density | **1 neutral monster per camp**, with increased attributes and Fun Coin drop | `CONFIRMED_OFFICIAL` | May 28. |
| Zhang Bao / Zhuxie Gule spawn window | Random within **±1 minute** of each boss's original time | `CONFIRMED_OFFICIAL` | May 28. Original/base timers are not supplied in that patch. |
| Neutral boss base timers | Configurable | `UNKNOWN` | Do not import old community/January values as current Global truth. |
| Command Skill cooldowns/costs | Changed on May 28 | `CONFIRMED_OFFICIAL` | May 28 confirms a change but does not publish exact current table. |
| Exact Command Skill costs/CDs | Manual/configurable | `UNKNOWN` | Must be filled only from current verified client evidence later. |
| Ignore Interception | Can breach wind-wall blockade | `CONFIRMED_OFFICIAL` | May 28. |
| League objective scaling | League rank changes objective/neutral HP and, for specified units, attack | `CONFIRMED_OFFICIAL` | May 28 exact modifiers below. |
| Divinarche | Bulwark + Zhang Bao + Zhuxie Gule HP -25%; neutral monster + Goose HP/attack -25% | `CONFIRMED_OFFICIAL` | May 28. |
| Jesting Hero | Same categories -50% | `CONFIRMED_OFFICIAL` | May 28. |
| Stealth Jester | Same categories -75% | `CONFIRMED_OFFICIAL` | May 28. |
| Halftime initial damage bonus | **0%** on entering Halftime Show | `CONFIRMED_OFFICIAL` | May 28 changed from 60% to 0%. |
| Halftime ramp | additional **30% DMG Bonus every 30s** remains | `CONFIRMED_OFFICIAL` | May 28. |
| Halftime match timestamp | Configurable | `COMMUNITY_CONFLICTING` | Global community sources cite roughly 10m vs roughly 20m / later-match descriptions; current official notes do not establish the trigger time. |
| Halftime reward table | Configurable / descriptive only | `COMMUNITY_CONFLICTING` | Community descriptions differ; official current notes do not establish a current reward table. |
| Guild War Healing Dummy environment | GvG healer calibration target | `CONFIRMED_CLIENT` once entered/captured; otherwise planner hook | The product must retain screenshot/data calibration rather than invent coefficients. |

### Guild War EX technique adjustments — May 28 current official evidence

All Martial Art Techniques received the official Guild War cooldown reduction rule: techniques with 120s cooldown become **80s**; techniques with 90s cooldown become **60s**. Do not assign a technique to one of those original cooldown buckets unless its current client/source value is verified.

| EX technique | Current official Guild War effect | Evidence |
|---|---|---|
| Nameless Sword: EX | Lv3 allied Qi restore **60** | `CONFIRMED_OFFICIAL` |
| Strategic Sword: EX | Expanded Sword Horizon; Sword Energy in area can detonate targets at **5 Bleeding stacks** for High Bleeding damage | `CONFIRMED_OFFICIAL` |
| Heavenquaker Spear: EX | Can accumulate **2 uses** | `CONFIRMED_OFFICIAL` |
| Stormbreaker Spear: EX | Post-cast self DMG Reduction **75%** | `CONFIRMED_OFFICIAL` |
| Vernal Umbrella: EX | Build Momentum also grants Ballistic Skill DMG **+10% per stack, max 5** | `CONFIRMED_OFFICIAL` |
| Mortal Rope Dart: EX | For **8s** after cast, Rodent attacks briefly Immobilize targets hit | `CONFIRMED_OFFICIAL` |
| Soulshade Umbrella: EX | Allied Endurance restore **20/s** | `CONFIRMED_OFFICIAL` |
| Everspring Umbrella: EX | Healing Reduction zone **45%**, **65% at Lv3** | `CONFIRMED_OFFICIAL` |
| Unfettered Rope Dart: EX | Hit radius **12m** | `CONFIRMED_OFFICIAL` |
| Snowparting Blade: EX | Grants HP Shield to up to **5 nearby allies**; ally shield break triggers Heng Blade Anxi Soldier counterattack around that ally | `CONFIRMED_OFFICIAL` |
| Phalanxbane Blade: EX | Downward strike adds Airborne; interval **0.8s → 1.2s**; Lv1 triggers **16 → 10**; Lv3 Endurance drain **20 → 30** | `CONFIRMED_OFFICIAL` |

## Normal vs Arena Attunement

May 28 officially describes switching an equipped gear set from **Normal Attunement to Arena Attunement** as an attunement-type switch, and separately publishes Arena Attunement effects. The product therefore models them as separate profiles and **never stacks them**.

A build plan can store:

- `pveAttunementProfile`
- `arenaAttunementProfile`
- `gvgSelectedProfile: NORMAL | ARENA`

The GvG selection is a scenario choice. Existing/legacy PvE build data remains untouched.

## Bamboocut-Dust — current evidence-backed GvG experiment

Owner build: **Everspring Umbrella + Unfettered Rope Dart**.

Classification: `MODELED`, role label **ANTI-HEAL / ZONE PRESSURE**. This is not asserted as current GvG meta.

Evidence feeding the role model:

- Everspring EX creates a **45% Healing Reduction zone, 65% at Lv3** — `CONFIRMED_OFFICIAL` (May 28).
- Unfettered EX reaches a **12m radius** — `CONFIRMED_OFFICIAL` (May 28).
- May 28 increased Everspring stagger reliability/tracking/cancel behavior and adjusted Unfettered player-interaction behavior — `CONFIRMED_OFFICIAL`.
- July 23 current Version 2.0 improves Bamboocut-Dust ranged filler and Arena/PvP handling; `Burn and Bury` is unblockable in Arena and Everspring/Unfettered timings were adjusted — `CONFIRMED_OFFICIAL`, but Arena-only clauses must not be silently applied outside Arena.
- August 2 fixes the Guild War-specific post-death continuous-Immobilize bug — `CONFIRMED_OFFICIAL`; no post-death control is modeled.

Role strengths to score separately: anti-heal, range/zone control, AoE pressure, mobility and teamfight control. Tradeoff: survivability/frontline value is not inferred from PvE DPS and is exposed as an independent dimension.

The existing 60s PvE rotation remains the PvE source of truth and must not be replaced by this GvG role model.

## Community evidence and conflicts

Global community material is advisory, not authoritative mechanics:

1. MetaForge — “GVG Guide: Strategy Tips from a Top 100 Guild” (2026-01-26)  
   https://metaforge.app/where-winds-meet/where-winds-meet-gvg-guide-strategy  
   Supports main-ball + two flex-group doctrine, jungle/resource priority, healer/tank importance, and a **6–8 healer / 4 tank** example. It also calls the duel a **10-minute** event. These counts/timing are not hardcoded as truth.
2. VCross GvG Strategy Map (current public tool)  
   https://gvgmapwwm.vcross.gg/  
   Confirms strong community demand for a 30-player draggable roster/map workflow with teams, roles and objective planning. This is UX/product evidence, not mechanical authority.
3. Vortex Gaming / PointsNPixels-derived Guild War guide  
   https://vortexgaming.io/en/postdetail/642085  
   Supports 30v30, commander, duelist/halftime, jungle/objective and resource-planning concepts; date/patch context is older than May's official rework.
4. PointsNPixels-derived explanatory guide  
   https://allthings.how/gvg-mode-explained-objectives-commander-skills-in-where-winds-meet/  
   Independently describes the MOBA-like lane/jungle/resource/commander structure. Treat old command values as stale unless current-client verified.
5. Game8 Guild Wars Guide  
   https://game8.co/games/Where-Winds-Meet/archives/575127  
   Useful for league/onboarding context but its February material predates the May pacing/EX update.
6. Steam Global community Guild Wars guide/discussion  
   https://steamcommunity.com/app/3564740/discussions/0/816973559978027362/  
   Independently corroborates 30-player planning, commander + halftime duelist roles, 3 lanes + jungle, healer/tank emphasis, and build-swapping discussion. Exact old timings/rewards/command values are not promoted.
7. GvG Strategy Maker (public community tool)  
   https://gvgstratmaker.com/  
   Product reference for 30-player management, map markers, drawing, undo/redo and import/export.

### Halftime conflict policy

Community writeups are patch-sensitive. At least one Top-100 Global guide explicitly calls the duel a **10-minute** event, while other community descriptions place it later / around a different phase and reward descriptions differ. Current official Global notes verify Halftime buff behavior but do **not** provide the current trigger timestamp or a complete reward table.

Therefore:

```text
HALFTIME_TIME   = configurable
HALFTIME_REWARD = configurable
provenance      = COMMUNITY_CONFLICTING / UNKNOWN
```

## CN/KR comparative composition evidence — never Global authority

A Korean community post explicitly relaying a CN-alliance 30-player recommendation reports approximately:

- Mo Blade / tank-like slots: **2–4**
- healers: **8–10**
- Twin Blades: **2**
- support/control slots: **2–4**
- remaining slots largely Nameless Sword

Source (2026-01-19):  
https://gall.dcinside.com/mgallery/board/view/?id=wherewindsmeets&no=64718

A current CN guild battle planner/roster page also demonstrates attack/defense/jungle/healer subgrouping, but is organization-specific rather than a balance authority:  
https://www.yingtian-yysls.com/

This evidence is used only for the optional preset `CN_REFERENCE_HIGH_SUSTAIN`, with provenance/date shown in UI. It is never auto-selected as best.

## Community composition presets

Presets are planning aids with transparent provenance and editable target ranges:

- `BALANCED_GLOBAL_COMMUNITY`: broad, non-authoritative ranges derived from multiple Global guides; favors coverage rather than a single exact healer/tank count.
- `TOP_100_STYLE`: preserves the MetaForge Top-100 example as an explicitly dated community preset.
- `CN_REFERENCE_HIGH_SUSTAIN`: preserves the CN-alliance-derived high-sustain example as CN comparative evidence only.
- `CUSTOM`: no target assumptions.

No preset can change combat formulas and no preset is automatically selected as best.

## Current repository/client audit at baseline 771f35e882070387eff1d61397869e70cb5758bb

Evidence class: `CONFIRMED_CLIENT` for code/data observations.

- Existing app is the **WWM Build Lab** and has verified Global T91/T96 PvE damage/model assumptions that must remain unchanged.
- Product navigation contains Build/Gear/Compare/Best Build/Combat/Simulation/Rotations/Skill Editor/Team/Profile but no dedicated Guild War workspace.
- Existing Team Builder is a small PvE-oriented team calculation, not a 30-player GvG roster/strategy system.
- Current main product has export/import-oriented utilities but no versioned GvG share schema with redaction/clone semantics.
- Current Bamboocut-Dust owner build already uses **Everspring Umbrella + Unfettered Rope Dart**; its verified PvE winner logic is preserved.
- Existing OCR/runtime/T96/Pages validators are production acceptance gates and remain part of CI.

## Product modeling rules

### Scenario isolation

`PVE_BOSS`, `ARENA`, and `GUILD_WAR` are distinct scenarios. GvG never reuses the PvE DPS ranking as a universal ranking.

### Role model

Supported role suitability outputs:

- `MAIN_BALL`
- `FRONTLINE_TANK`
- `HEALER`
- `FLEX_ASSASSIN`
- `JUNGLER_OBJECTIVE`
- `DUELIST`
- `ESCORT`
- `ANTI_ESCORT`

Each build exposes independent dimensions:

- player damage
- objective damage
- AoE pressure
- healing
- effective health / survivability
- CC
- anti-heal
- mobility
- Qi pressure
- team shields
- revive utility
- EX technique utility
- range / zone control

Role scores are weighted views over these visible dimensions and must return an explanation. There is no unexplained universal GvG score.

### Objective simulator

The simulator is deterministic and discrete-event/scenario based. It may estimate break time, objective DPS, resource curves, cooldown availability, death/revive downtime and escort state. It does **not** simulate 30-player combat frame-by-frame and does **not** output statistically precise win probability without calibrated match logs.

Unknown objective DR per stack and unknown base boss timers remain nullable/manual parameters. Sensitivity views at 5/10/20/30 nearby players are supported without inventing DR.

### Match log calibration policy

Match logs are structured evidence for future calibration. One match never silently changes formulas or weights. Any future calibration must be explicit, versioned, reproducible and based on a defensible sample.

## Remaining UNKNOWN values at 2026-08-17

- exact Bulwark DR per proximity stack
- exact Goose DR per proximity stack
- current Global neutral boss base spawn timers (May patch only gives ±1 minute window)
- exact current Global Command Skill Fun Coin costs where not independently verified in current client
- exact current Global Command Skill cooldowns where not independently verified in current client
- exact current Global Halftime trigger timestamp
- exact current Global Halftime reward table
- objective base HP/attack values required for absolute break-time simulation by league/patch
- empirical role-weight calibration from a sufficiently large current Global match-log sample

All remain configurable or explicitly unavailable in UI rather than fabricated.
