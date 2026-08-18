# WWM Calc V1 Product Surface Audit

Release-hardening baseline: `92c2f3184538553b1ba58c03fc57fd1a5dd5137e`  
Product: WWM Calc 1.0.0 · Global 2.0  
Audit date: 2026-08-18

## Scope and release rule

V1 hardening covers the existing PvE, Arena, Guild War and Community Library product. It does not introduce a new Path, Arena mode, Guild War objective, account system, backend, social surface or recommendation service. Existing combat/model formulas remain untouched unless a wiring defect is proven.

Severity policy used here:

- **P0** — data loss, cross-workspace contamination, wrong recommendation from stale/wrong inputs, security defect, production crash.
- **P1** — major workflow blocked, share/import failure, mobile unusable, materially misleading result.
- **P2** — bounded UX/state/layout/recovery defect.
- **P3** — cosmetic/copy polish.

## Product inventory

| Surface | Route | State source | Primary user action | V1 risk | Acceptance coverage |
|---|---|---|---|---|---|
| Workspace switcher | global masthead | `wwm_product_shell_v2` + hash | move among PvE / Arena / Guild War | wrong workspace restored; hash drift | `runtime-workspace-ux`, `runtime-arena-acceptance`, `runtime-v1-release-acceptance` |
| Player ID access gate | startup modal | `wwm_uid` | verify/store Player ID access record | malformed gate record should not affect gameplay state | storage registry audit; existing gate validation |
| Character/profile selector | PvE shell | `wwm_chars_v3` | choose/create/duplicate character | corrupt legacy object; wrong active IDs | T96 runtime + V1 corrupt-storage smoke |
| Global version/tier context | masthead/context bar | product constants + active PvE context | understand patch/tier | stale context hidden | visual QA + Model & About |
| Library entry | `#library` | curated `library-v1.json` + local favorites/recent | discover/filter/open references | stale reference presented as current | Library acceptance + V1 visuals |
| Shared Library landing | `#shared-build=<payload>` | versioned public envelope | inspect read-only, clone deliberately | malformed/oversized/prototype/XSS input | Library acceptance + V1 malicious-share smoke |
| Model & About / report issue | masthead + Arena header | safe route/product context only | understand maturity; report bad data | missing disclosure; privacy leakage | V1 responsive/runtime acceptance |
| PvE Overview | `#pve/overview` | active character/scheme + modeled context | choose next PvE action | stale shell context | workspace UX + V1 screenshots |
| PvE Build | `#pve/build` | active scheme/build | configure build | stale derived result | T96 product validations |
| PvE Gear | `#pve/gear` | `wwm_chars_v3` | add/import/equip/scan gear | corrupt inventory; stale calculations | T96 runtime/OCR + V1 50/100/250 browser scale |
| PvE Compare | `#pve/compare` | active scheme + candidate | compare complete builds | stale candidate/result | T96 acceptance + workspace UX + V1 390 |
| PvE Best Build | `#pve/best-build` | inventory/scenario/objective/cache | run explicit optimizer | incomplete cache key; stale recommendation | T96 best-build validators + runtime |
| PvE Combat | `#pve/combat` | active modeled build/scenario | inspect Menu/Combat Panel result | label/model confusion | T96 menu-panel contract/runtime |
| PvE Simulation | `#pve/simulation` | build + rotation + scenario | simulate rotation | stale scenario/cache | existing simulation/T96 coverage |
| PvE Rotations | `#pve/rotations` | local rotation presets | edit/select rotation | malformed preset | product runtime + storage registry |
| PvE Skill Editor | `#pve/skill-editor` | skill/timing overrides | inspect/edit advanced mechanics | malformed override | existing model/runtime validation |
| PvE Team | `#pve/team` | team modifiers | adjust team context | unintended model reuse | existing model validations |
| PvE Import/Export/Profile | `#pve/profile` | `wwm_chars_v3` + validated imports | share/import/export | malformed JSON; silent overwrite | T96/OCR + V1 cross-workspace smoke |
| Arena Overview | `#arena/overview` | `wwm_arena_state_v1` | choose mode/profile/opponent workflow | PvE objective leaking into Arena | Arena acceptance + V1 visuals |
| Arena Build | `#arena/build` | Arena profile + optional read-only PvE gear snapshot | edit Arena profile | unsafe nested snapshot; profile ID collision | Arena acceptance + V1 storage security |
| Arena Best Build | `#arena/build` | bounded Arena profiles/objective/opponent | run Top 3 | PvE DPS becoming winner; stale opponent input | Arena model validator + V1 12-candidate runtime |
| Arena Attunement | `#arena/attunement` | Arena profile | select Arena Attunement | Normal + Arena stacking | Arena acceptance |
| Arena Matchups | `#arena/matchups` | my Path/mode + opponent | compare matchup dimensions | stale WHY/verdict | Arena acceptance + V1 390/1024/1440 |
| Arena Compare | `#arena/compare` | active Arena profiles + optional one-shot Library descriptor | compare Arena builds/reference | selected Library reference previously was written but never consumed; accidental PvE ranking | Arena acceptance + `runtime-v1-arena-library-compare` |
| Arena Simulation | `#arena/simulation` | Arena state-transition model | inspect combat-state timeline | unverified probability claim | Arena acceptance |
| Arena History | `#arena/history` | `wwm_arena_history_v1` | record local match | private history leaking into share | Arena acceptance + V1 privacy checks |
| Arena Reference/Library | `#arena/reference`, `#library/arena` | Arena reference presets/library | inspect/clone/compare | active profile overwrite; comparison descriptor leakage | Arena acceptance + cross-workspace + Arena Library Compare regression |
| Arena Share/Import | `#arena/transfer`, `#arena/shared/<token>` | Arena schema v1 envelope | generate/read-only inspect/clone | malformed/future/prototype/oversize payload | Arena validator + V1 malicious-share smoke |
| Guild War Overview | `#gvg/overview` | `wwm_gvg_workspace_v1` summary | assess readiness / next action | corrupt workspace breaking overview | GvG acceptance + V1 visuals |
| Guild War Roster | `#gvg/roster` | Guild War workspace roster | manage up to 30 members/roles | duplicate IDs; wrong types; orphan references | GvG + V1 30-player/runtime/recovery |
| Guild War Builds | `#gvg/builds` | role model + selected build | compare role suitability | PvE DPS used as universal winner | GvG acceptance |
| Guild War Strategy | `#gvg/strategy` | strategy positions/arrows/rallies | place roster and plan movement | orphan position; malformed coordinates | GvG + V1 30-member strategy visual/runtime |
| Guild War Timeline | `#gvg/timeline` | timeline/objective params | plan event windows/simulate | unstable IDs; invalid numbers | GvG + V1 migration sanitizer |
| Guild War Objectives | `#gvg/objectives` | objective params + official/model constants | inspect objective scenario | fabricated unknown timing | GvG model tests |
| Commander / Fun Coin | `#gvg/commander` | commander events | plan resource curve | malformed event arrays/numbers | GvG migration sanitizer/runtime |
| Duelist / Healer | `#gvg/support` | roster refs + healer calibration | choose duelists/calibration | deleted-member refs | V1 delete-reference cleanup |
| Guild War Match Log | `#gvg/matches` | structured local match logs | record observed match | history/private data in share | GvG acceptance + redaction policy |
| Guild War Share Plan | `#gvg/share`, `#gvg-share=<payload>` | GvG share schema v1 | redact/share/read-only inspect/clone | editable JSON path had shallow validation | GvG + Library + V1 share security |
| Library Featured/PvE/Arena/Guild War | `#library/*` | curated document + Arena injected references | discover/filter | stale/experimental trust ambiguity | Library acceptance + patch freshness |
| Library Detail | `#library/build/<id>` | validated Library entry | inspect provenance/clone/share/report | unsafe source URL; stale claim | Library model/runtime |
| Library Compare | `#library/compare/<a>/<b>` | two validated entries/current build | compare complete intent/result | universal-winner wording | Library acceptance + terminology cleanup |
| Library Saved/Recent | `#library/saved`, `#library/recent` | local string-ID lists | revisit references | corrupt minor key | bounded empty fallback + registry audit |

## Storage registry

The canonical registry is `src/product/storage-registry.js`. Release validation scans literal `localStorage` / `sessionStorage` accesses in `src/` and fails CI when an app-owned literal key is absent from the registry. `h72na_data_token` is the only explicit exemption because it belongs to the external game-dashboard origin inside a generated bookmarklet, not WWM Calc persistence.

| Key | Owner | Schema | Migration/fallback | Corruption behavior |
|---|---|---:|---|---|
| `wwm_product_shell_v2` | Global | 2 | tolerant shell defaults | shell-only fallback |
| `wwm_uid` | Global | 1 | verified `{uid,name,server}` gate record | re-prompt gate only; gameplay data untouched |
| `wwm_selected_build` | PvE | 1 | allowlisted/factory build | selected-build-only fallback |
| `wwm_chars_v3` | PvE | 3 | `sanitizeChars` | bounded PvE fallback; other workspaces untouched |
| `wwm_t91_custom_config` | PvE | 1 | legacy tolerant | config-only fallback |
| `wwm_t91_profiles` | PvE | 1 | legacy tolerant | profiles-only fallback |
| `wwm_skill_overrides` | PvE | 1 | legacy tolerant | overrides-only fallback |
| `wwm_timing_overrides` | PvE | 1 | legacy tolerant | overrides-only fallback |
| `wwm_rotation_presets` | PvE | 1 | legacy tolerant | presets-only fallback |
| `wwm_relay_cooldowns` | PvE | 1 | legacy tolerant | cooldowns-only fallback |
| `wwm_arena_state_v1` | Arena | 1 | unversioned/v0 sanitize → v1 | future/corrupt/normalized input backed up per-domain; visible recovery |
| `wwm_arena_history_v1` | Arena | 1 | entry sanitizer | history-only empty fallback |
| `wwm_arena_library_compare_v1` | Arena | 1 | legacy local one-shot descriptor → validated session descriptor | descriptor-only drop; does not clone/activate a profile |
| `wwm_gvg_workspace_v1` | Guild War | 1 | v0 → v1; v1 bounded sanitizer | backup + visible recovery; no cross-domain wipe |
| `wwm_library_favorites_v1` | Library | 1 | string-ID list sanitizer | favorites-only empty fallback |
| `wwm_library_recent_v1` | Library | 1 | string-ID list sanitizer | recent-only empty fallback |
| `wwm_library_clone_descriptor_v1` | Library | 1 | descriptor replacement | descriptor-only fallback |
| `wwm_library_gvg_clones_v1` | Library | 1 | validated clone envelopes | clone-store-only fallback |

Recovery backups use `<domain-key>__recovery_backup_v1` and are bounded to 128 KiB. A bad key never triggers a global clear. For recovered Guild War data, the initial fallback render does not immediately overwrite the original; the recovered value is persisted only after a deliberate subsequent edit.

## Confirmed defects found during V1 bug-bash

| Severity | Defect | Root cause | Resolution |
|---|---|---|---|
| P0 | Corrupt/current-shape Guild War storage could crash assumptions such as `.map/.filter` or be rewritten after fallback | v1 migration shallow-spread arbitrary stored values into `defaultWorkspace`; component immediately persisted state | bounded type/schema sanitizer; unique IDs; bounded collections/numbers; per-domain backup/recovery; first recovered persist guard |
| P0/P1 | Guild War editable JSON import had weaker security than public shared landing | `validateShareEnvelope` checked only schema/version/kind; `ROSTER`/`STRATEGY` branches patched payload directly | deep size/depth/prototype/roster-ID validation plus all clone branches pass through bounded workspace migration |
| P1 | Arena future schema could be silently reinterpreted as current | `loadArenaState` sanitized any parsed object without schema gate | explicit future-schema rejection, v0 migration path, per-domain backup and user-visible recovery |
| P1 | Library → Arena Compare did not compare the selected Community Reference | Library wrote `wwm_arena_library_compare_v1` and navigated, but Arena Compare had no consumer for that descriptor | validated one-shot bridge to session state; selected reference becomes a read-only pseudo-profile in BUILD B; active Arena state remains untouched; malformed descriptor fails closed |
| P2 | Arena profile duplicate IDs and arbitrary nested gear snapshot were accepted | sanitizer bounded list length but not ID uniqueness/snapshot object graph | deterministic ID dedupe + bounded snapshot clone/prototype/depth/size checks |
| P2 | Deleting a Guild War roster member left live duelist/position references | delete cleaned strategy position only | clear selected strategy member, strategy position and active duelist references in one state update; historical match snapshots remain historical |
| P2 | Product lacked one compact model/maturity/report surface across workspaces | disclosures were fragmented between advanced pages | shared Model & About surface + privacy-minimized structured GitHub issue context |
| P2 | Release CI lacked one integrated cross-workspace/recovery/security/responsive/performance acceptance gate | feature-specific suites existed independently | `runtime-v1-release-acceptance.spec.mjs` + static registry/security validators |
| P3 | User-facing Guild War copy mixed `GvG` and `Guild War` | earlier internal terminology leaked into labels/copy | primary user-facing copy normalized to `Guild War`; internal route/key identifiers remain `gvg` |

## Cross-workspace integrity invariants

1. PvE owns `wwm_chars_v3`, selected build, PvE overrides and presets.
2. Arena owns `wwm_arena_state_v1` and local Arena history; PvE gear enters Arena only as a bounded read-only snapshot. Library Compare enters Arena only as a validated comparison descriptor/read-only pseudo-profile and does not clone or activate a profile.
3. Guild War owns `wwm_gvg_workspace_v1`; Library Guild War clones are stored separately until deliberate apply/import.
4. Library favorites/recent/clones do not activate another workspace build automatically.
5. Arena Match History is excluded from Arena public share payloads.
6. Guild War share redaction pseudonymizes player names before serialization; the read-only landing never mutates the live plan.
7. Hash/deep-link routing may select a workspace/page, but does not reinterpret another workspace's stored model state.

## Release acceptance matrix

| Gate | Coverage |
|---|---|
| GLOBAL | all 3 workspaces, Library, hash/deep links, refresh, back/forward, state isolation, corrupt storage |
| PvE | fresh/default state, T96 observed gear, Compare, Best Build, Combat/Menu Panel, Simulation, Share/Import regression |
| Arena | 1v1, 3v3, Attunement isolation, opponent/matchup, Compare, Library-selected Compare bridge, Best Build, Simulation, History, share/clone |
| Guild War | 30-member roster, role/ref cleanup, Strategy, Timeline/Objectives, Commander, Match Log, redacted share |
| Library | discovery, filters, freshness/outdated presentation, favorite, detail, compare, Arena handoff, clone, shared landing |
| Security | malformed base64/JSON, size/depth bounds, prototype keys, duplicate IDs, invalid future schemas, HTML/script strings |
| Responsive | 390, 1024, 1440 real routes with no horizontal overflow plus required visual artifacts |
| Runtime | `pageErrors = []`, unexpected `consoleErrors = []` in representative Chromium acceptance |
| Legacy | T96, OCR, Library v1 share migration, Arena unversioned migration, Arena Library one-shot descriptor migration, Guild War v0 migration |
| Performance | browser render/interaction timings recorded for PvE gear 50/100/250, Arena 12 candidates, Guild War 30 roster + populated strategy/timeline, Library 80 synthetic references |

The authoritative gate remains `.github/workflows/validate.yml`; the V1 matrix augments, rather than replaces, the existing deterministic formula/model/OCR/T96/Arena/Guild War/Library suites.
