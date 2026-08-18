# Global Arena Model V2

Reviewed: 2026-08-18  
Target: current Global client / Global 2.0  
Status: supersedes shallow Arena assumptions in `GLOBAL_ARENA_MODEL.md` where this document conflicts.

## Evidence policy

V2 uses: `CONFIRMED_CLIENT`, `CONFIRMED_OFFICIAL`, `OFFICIAL_BUT_SCOPE_UNRESOLVED`, `COMMUNITY_CORROBORATED`, `COMMUNITY_CONFLICTING`, `MODELED`, `UNKNOWN`, `OUTDATED`, `REJECTED_FOR_CURRENT_GLOBAL`.

Official/current sources reviewed completely for the mechanics encoded here:

- Apr 30 Arena/Guild War Optimization — https://www.wherewindsmeetgame.com/m/news/official/PVP427.html
- May 22 Cross-Server Matchmaking — https://www.wherewindsmeetgame.com/news/official/522update.html
- May 27 Patch — https://www.wherewindsmeetgame.com/news/official/527update.html
- May 28 Version 1.7 Path/Arena Balance — https://www.wherewindsmeetgame.com/news/official/Adjustment528.html
- Global 2.0 rolling patch notes through Aug 7 — https://www.wherewindsmeetgame.com/news/official/723update.html
- Current official news index and publisher Steam mirror were cross-checked for post-Aug-7 competitive changes before model freeze.

Community/older references are strategy or historical evidence only and never promote an unpublished coefficient to official truth.

## Mode taxonomy

V2 does **not** use one ArenaScenario for incompatible modes.

| ID | Context | Level Adjustment | Schedule truth | Attunement truth |
|---|---|---|---|---|
| `1V1_ARENA` | standard 1v1 | UNKNOWN | 24/7, official | Arena applicability scope unresolved |
| `3V3_ARENA` | team Arena | confirmed Level Adjustment context | Mon/Wed/Fri/Sun 15:00–02:00 battlegroup local; client schedule authoritative | Arena Attunement confirmed; Normal interaction unknown; never auto-stack |
| `GROUP_STRATEGY` | separate team mode | confirmed Level Adjustment context | daily 12:00–02:00 battlegroup local; client schedule authoritative | scope unresolved |
| `5V5_ARENA` | separate 5v5 ruleset | UNKNOWN | NEEDS CURRENT CLIENT DATA | UNKNOWN |
| `PERCEPTION_FOREST` | special competitive ruleset | UNKNOWN | NEEDS CURRENT CLIENT DATA | UNKNOWN |
| `TRAINING_TERRACE` | test/calibration environment | scope unresolved | training surface | not ranked truth by default |

A 2v2/5v5 Arena environment is exposed by the official Healing Dummy. This is a calibration contract; it is not enough by itself to invent queue/schedule rules.

## Battlegroups and cross-server

Current official battlegroups encoded as data:

- Yougu — US East
- Linhe — US West
- Yunya — Europe
- Canglang — Asia + HK/MO/TW
- Jiangzhu — Southeast Asia

Cross-server matchmaking is a toggle. A timed-out search may expand to other servers in the same battlegroup. The host-server rule follows the player who has cross-server matchmaking disabled where the official rule applies. Battlegroup switching has rank reset / leaderboard separation effects. Battlegroup is metadata and **never a damage coefficient**.

## Level Adjustment: P0 conclusion

Official text proves that 3v3 Arena and Group Strategy are Level Adjustment modes for the custom Mystic branch trial. It does **not** publish a complete normalization table for:

character level, Martial Art breakthrough, gear tier, gear base attributes, gear additional attributes, Retuned attributes, sets, Normal Attunement, Arena Attunement, Inner Ways, Inner Way tiers, Mystic Skills, Mystic branches beyond the explicit trial rule, food, buff scripts, HP, Physical Attack, Precision, Crit, Affinity, Penetration, or Player Target Boost.

Those fields are `UNKNOWN` unless current client evidence closes them. Therefore numeric gear/stat optimization is hard-disabled for Level Adjustment modes while any decision-critical field remains unknown.

**NEEDS CURRENT CLIENT DATA:** before/after detailed stat panels for 3v3 and Group Strategy Level Adjustment.

## 3v3 exact branching

### No healer

- one revive opportunity
- 10m revive range
- 15s window after the teammate falls
- successful revive grants a temporary Physical Attack buff; unpublished magnitude/duration remain unknown

### With healer

Panacea Fan Resurrection follows the healer-specific restriction. Royal Remedy T6 is represented as an explicit exception only when the client/current evidence confirms the branch. The model never flattens this into “3v3 has one revive.”

Same Martial Art: max 2 per team.

## Combat state engine

Distinct states/tags include:

`HIT_STAGGER`, `CONTROLLED`, `IMMOBILIZED`, `AIRBORNE`, `KNOCKBACK`, `KNOCKDOWN`, `TENACITY`, `SUPER_ARMOR`, `CONTROL_IMMUNITY`, `INVINCIBILITY`, `DEFENSE`, `DEFLECT`, `CONTINUOUS_DEFLECT`, `PERFECT_DODGE`, `DODGE_IFRAME`, `SPRINT`, `DASH`, `BREAK_DEFENSE`, `EXECUTION`, `EXECUTED_KNOCKDOWN`, `GET_UP_PROTECTION`, `PASSIVE_BREAK_CONTROL`, `GUARDING_QI_CORE`.

Resources stay separate: HP, Qi, Endurance, Vitality, Path resource, Mystic cooldowns, Break Control progress.

### Guarding Qi Core

Current rule is not a generic DR button. The state engine supports HP restore, Qi restore, 0.5s Invincibility, qualifying control clear only from the applicable hit-state branch, and Invincibility extension through an inescapable Hit Stagger when supplied by the event state.

### Execute / get-up

Execute hit and Execute knockdown are distinct. Applicable Execute knockdown gives Qi Damage immunity. Getting up exposes distinct Tenacity, Control Immunity and Super Armor flags; they are never collapsed into one CC-immune boolean.

### Passive Break Control

Progress changes only by observed/event deltas. Progress can freeze briefly after Execute/exiting Hit Stagger and later resume. Exact fill duration remains `UNKNOWN`. Serene Breeze V2 grants brief Super Armor; it is not modeled as the old Tenacity + Control Immunity pair.

## Network / hit validation

Global 2.0 reverse hit validation is encoded as a state-resolution/reliability rule: server-side defender dodge-invulnerability validation can negate a hit. Attacker latency, defender latency and host-server context are metadata only. There is no `80 ms = -x% DPS` coefficient.

## Endurance

- Endurance consumption reduction cap: 40%.
- Continuous Sprint beyond 1s has increased consumption; unpublished coefficient remains unknown.
- Defense recovery rule was adjusted; unpublished coefficient remains unknown.
- Bow charge beyond 1.2s consumes Endurance and charge progress stops at zero Endurance.
- Skill-specific charge costs remain evidence-driven; no invented recovery/cost coefficients.

## Arena Attunement catalog

The versioned V2 catalog contains current supported general/path effects including:

- Chestpiece Martial-Art-origin damage reduction in current Hit Stagger/control scope.
- Bracer Deflect Qi Damage and Gold consecutive progression 25/30/35/40.
- Weapon Execution → 20 Vitality; 8s healing-to-Vitality chain; Gold +20% Mystic DMG window.
- Weapon Defense Counter → extra Qi Damage chain against Hit Stagger/Controlled targets.
- Bellstrike-Splendor Disc Break Control refund/cap.
- Stonesplit-Might Disc/current Aug 2 trigger fix.
- Bamboocut-Wind Pendant Vulnerability max 3.
- Bamboocut-Dust Scarlet Spin trigger requiring actual Hit Stagger/Control.
- Peak Springless Silence current Hit Stagger/Control trigger behavior.

Unverified effects are not fabricated to make the catalog look complete.

## Bamboocut-Dust Arena V2

Current encoded corrections:

- Cyclone Waltz current recast behavior.
- Scarlet Spin stagger/tracking and Perfect Catch distinction; Attunement requires actual Hit Stagger/Control.
- Phantom Rally/Resonance must not incorrectly interrupt Tenacity.
- Fading Crimson initial resource behavior only where current mode rule applies.
- Piercing Dart Charging Stance; Tenacity begins after 0.5s and may remain briefly post-cast under the current-compatible rule.
- Soul Sweep earlier cancel behavior.
- Burn and Bury is `UNBLOCKABLE` with golden warning flash.
- Soul Loss/Soulbreak/Soul Return current window data where officially supported.
- Dreamwrought +20% non-player damage is tagged `NON_PLAYER_ONLY` and rejected for Arena/Guild War.

## Perception Forest isolation

Perception Forest is a separate ruleset: poison zone, event bosses, Duel Arena, return Invincibility, special skills/items and Blazing Bow rules. Mortal Rope Dart Rodent Hunt is encoded as 10s, received Healing -50%, settlement = 30% of damage taken, one active application per target.

Every Perception Forest effect is tagged `PERCEPTION_FOREST_ONLY`; validation rejects use in 1v1, 3v3, Group Strategy, 5v5, Guild War or PvE.

## Matchup Lab V2

The V2 decision surface reports:

- ADVANTAGES
- RISKS
- KEY INTERACTIONS
- PUNISH WINDOWS
- DEFENSIVE ANSWERS
- UNKNOWN / PLAYER-SKILL-SENSITIVE AREAS

It does not return fake win probability. Where current path evidence is incomplete, the result is explicitly downgraded instead of filled with invented 1–5 ratings.

## Best Build V2

There is no universal weighted PvP score. Numeric equipment optimization is permitted only when stat applicability is established for the selected mode. Otherwise the UI returns `NEEDS CURRENT CLIENT DATA` and can still compare evidence-backed mechanic tradeoffs qualitatively/Pareto-style.

## Minimum current-client evidence still needed

1. 3v3 detailed stats before/after Level Adjustment.
2. Group Strategy detailed stats before/after Level Adjustment.
3. Active Attunement indicators in 1v1/Group Strategy/5v5/Perception Forest.
4. Player Target Boost before/inside Arena modes.
5. Current 5v5 queue/schedule/rules screen.
6. Training Terrace current Attunement/stat behavior if it is used for calibration.
