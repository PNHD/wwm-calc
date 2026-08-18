# Competitive Mode Evidence Matrix

Reviewed: 2026-08-18. Machine-readable source of truth: `src/competitive/competitive-v2.mjs` → `EVIDENCE_MATRIX`.

This document records the evidence hierarchy and the current Global claims used by Arena/Guild War V2. Earlier docs remain historical provenance; a conflicting earlier claim is superseded by this matrix rather than silently deleted.

## Evidence states

- `CONFIRMED_CLIENT` — current Global in-game evidence
- `CONFIRMED_OFFICIAL` — current applicable Global publisher/official source
- `OFFICIAL_BUT_SCOPE_UNRESOLVED` — official fact exists, but its exact mode/stat scope is not established
- `COMMUNITY_CORROBORATED` — multiple current Global community sources align
- `COMMUNITY_CONFLICTING` — current/historical community claims conflict
- `MODELED` — transparent product model, not an empirical game coefficient
- `UNKNOWN` — unresolved; dependent optimization is disabled
- `OUTDATED` — useful history, not current Global truth
- `REJECTED_FOR_CURRENT_GLOBAL` — explicit scope mismatch

## Current high-impact matrix

| ID | Mode | Current claim | State | Implementation |
|---|---|---|---|---|
| arena-battlegroups | Arena/GW | Yougu/Yunya/Canglang/Linhe/Jiangzhu mapping | CONFIRMED_OFFICIAL | encoded metadata |
| arena-1v1-247 | 1v1 | 24/7 | CONFIRMED_OFFICIAL | encoded |
| arena-cross-server | Arena | toggle, timeout expansion, host-server behavior | CONFIRMED_OFFICIAL | encoded metadata |
| arena-level-adjustment | 3v3/Group Strategy | Level Adjustment context exists; exact stat normalization unpublished | OFFICIAL_BUT_SCOPE_UNRESOLVED | UNKNOWN guard |
| arena-3v3-revive | 3v3 | healer/no-healer branches, 10m/15s no-healer revive | CONFIRMED_OFFICIAL | encoded |
| arena-same-ma-max2 | 3v3 | same Martial Art max 2 | CONFIRMED_OFFICIAL | encoded |
| arena-endurance-cap | Arena | Endurance consumption reduction cap 40% | CONFIRMED_OFFICIAL | encoded |
| arena-gqc | Arena | HP/Qi restore + 0.5s Invincibility + hit-state-dependent clear | CONFIRMED_OFFICIAL | state engine |
| arena-execute-getup | Arena | Execute Qi immunity; Tenacity/Control Immunity/Super Armor distinct | CONFIRMED_OFFICIAL | state engine |
| arena-reverse-hit-validation | Arena | defender dodge invulnerability validated; no latency damage scalar | CONFIRMED_OFFICIAL | reliability/state rule |
| arena-bamboocut-v2 | Arena | current Bamboocut stagger/Tenacity/unblockable interactions | CONFIRMED_OFFICIAL | encoded |
| pf-rodent-hunt | Perception Forest | 10s, -50% healing, 30% settlement, one active/target | CONFIRMED_OFFICIAL | isolated ruleset |
| training-preliminary | Training Terrace | test/calibration environment | CONFIRMED_OFFICIAL | display/calibration only |
| gvg-outposts | Guild War | t=3:00, top/bottom, revive, 60s lock | CONFIRMED_OFFICIAL | phase/objective engine |
| gvg-proximity-qi | Guild War | Bulwark cap15, Goose cap30, Qi damage ×0.5; DR/stack unknown | CONFIRMED_OFFICIAL + UNKNOWN subfield | guarded objective sim |
| gvg-halftime | Guild War | at entry 0%; +30% each30s; trigger unknown | CONFIRMED_OFFICIAL + COMMUNITY_CONFLICTING trigger | guarded phase engine |
| gvg-league-scaling | Guild War | Divinarche/Jesting Hero/Stealth Jester reductions | CONFIRMED_OFFICIAL | encoded data |
| gvg-ex | Guild War | current EX catalog + 120→80 / 90→60 family rule | CONFIRMED_OFFICIAL | encoded; family assignment guarded |
| gvg-command-costs | Guild War | cost/CD changed, exact current values unavailable | UNKNOWN | manual Advanced only |
| gvg-bamboocut-death-fix | Guild War | no continuous post-death Immobilize | CONFIRMED_OFFICIAL | regression |
| gvg-attunement | Guild War | active Normal/Arena profile not established | UNKNOWN | build optimizer blocked |
| gvg-victory-order | Guild War | current exact ordering/tiebreak not established | UNKNOWN | manual/current-unknown |
| old-green-points | Guild War | “Green Points” historical terminology | OUTDATED | historical only; current term Fun Coins |

## Scope isolation

Machine tags:

`PVE_ONLY`, `NON_PLAYER_ONLY`, `ARENA_ONLY`, `PERCEPTION_FOREST_ONLY`, `GVG_ONLY`, `PLAYER_TARGET`, `ALL_MODES`.

Validator examples:

- Dreamwrought +20% non-player damage: `NON_PLAYER_ONLY`; rejected in Arena/Guild War.
- Guild War EX effects: `GVG_ONLY`; rejected in standard Arena/PvE.
- Rodent Hunt: `PERCEPTION_FOREST_ONLY`; rejected outside Perception Forest.
- Player-target effects can only enter a mode after that mode's applicability is established.

## Claims explicitly superseded/rejected

1. **One Arena mode object for 1v1/3v3/Group/5v5/PF/Training** — rejected; rulesets split.
2. **5v5 = Group Strategy** — rejected; tracked separately.
3. **Guild War selected Attunement profile** — superseded by `UNKNOWN` until client evidence.
4. **Normal + Arena Attunement stack** — rejected by default.
5. **PvE DPS ranks Arena builds** — rejected.
6. **One weighted PvP score / fake win probability** — rejected.
7. **Universal GvG score** — rejected; phase capabilities replace role-weight total.
8. **Fixed healer/tank counts from a community guide** — rejected as official/current rule.
9. **Green Points as current terminology** — outdated; current official term is Fun Coins.
10. **Community January victory/tiebreak order as current official truth** — rejected.
11. **35-minute total / 5-minute prep as confirmed official** — rejected; community-only until current client verification.
12. **Hard-coded current Halftime trigger** — rejected.
13. **Hard-coded Bulwark/Goose DR-per-stack** — rejected.
14. **Hard-coded current Commander cost/CD from old guides** — rejected.
15. **Latency → DPS coefficient** — rejected; reverse validation is a state/reliability mechanic.
16. **Dreamwrought non-player damage in PvP** — rejected by scope.
17. **Bamboocut continuous Immobilize after death** — rejected by Aug 2 official fix.
18. **Serene Breeze = Tenacity + Control Immunity** — superseded; current V2 interaction is brief Super Armor.

## Community evidence retained but constrained

- MetaForge Top-100 EU: historical doctrine and commander practice; no current hard-coded composition/timing.
- VCross: strategy-board/assignment workflow reference; not a source of official combat coefficients.
- Current Steam/Reddit/player communities: matchup hypotheses, common compositions, opener/role vocabulary; exact coefficients and applicability remain client/official-gated.
- CN/KR/older Global: comparative/historical only with explicit version labels.

## Highest-impact unresolved P0 facts

`NEEDS CURRENT CLIENT DATA`:

1. exact Level Adjustment stat applicability for 3v3 and Group Strategy
2. Arena Attunement applicability outside the explicitly supported 3v3 evidence
3. Guild War Attunement applicability
4. current Commander Fun Coin cost/cooldown catalog
5. Bulwark/Goose DR-per-stack
6. current Halftime trigger and duel flow
7. current Guild War victory/tiebreak ordering
8. exact Guild War match/prep duration
9. out-of-combat Guild War build swapping
10. Player Target Boost applicability in Arena/Guild War/Perception Forest

The product can ship while these remain unresolved because every dependent numeric recommendation is blocked or converted into transparent manual sensitivity analysis.
