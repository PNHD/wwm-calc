# WWM Formula and Numerical Feature Parity Audit — 2026-09-16

## Scope and immutable inputs

- WWM baseline: `f4a0be48881f4b16f419a857ef890c6f8a5269e1` (`fix: contain missing timing within calculator shell`).
- Where Builds Meet (WBM): `greydust/where-builds-meet@74cf368193eb4b15cf0e1e637f569093a153f2e7`, inspected only as GPL-3.0-or-later comparison material. No implementation was copied.
- Where Winds Meet DPS (WWMDPS): `M1zuke/where-winds-meet-dps@8009ba11cc882ce5310727dc0ba79ad4c6fd2efc`, inspected as an MIT comparison implementation, not a code donor.
- Current Global evidence: repository-owned accepted T96 calibration, Product Owner client fixtures, official Global 2.1 path availability, and reproducible validators. Mutable claims not covered by these are not promoted.
- Runtime: `C:\Users\phamn\.cache\wwm-runtimes\node-v22.23.2-win-x64\node.exe` (`v22.23.2`). No installs, source-mutating lifecycle scripts, dev server, or deployment.

`CONFIRMED` means current behavior is retained with sufficient evidence. `CORRECTED` means this lane changes behavior or authoritative model data and adds a directional regression. `PROVISIONAL` remains executable only inside its existing bounded capability/scenario. `UNKNOWN` stays unavailable/reference-only or explicitly uncredited. `OUT_OF_SCOPE` means the evidence may exist, but implementing it would require presentation ownership or a separately bounded model.

## Source and provenance matrix

| Source | Pin / date | Authority in this audit | Independence limits | Material used |
|---|---|---|---|---|
| WWM accepted repository | `f4a0be…`, 2026-09-16 | Primary current product truth | Some data descends from legacy CN workbook and remains labeled | Active formulas, capability registry, fixtures, assumptions, validators |
| Global T96 observed fixture | `src/data/globalT96Observed.ts`, observed 2026-08-04 | Primary reproducible client fixture | One owner build; not universal encounter proof | Panel stages, Starweave display rounding, 1106/1129 comparison |
| Global T96 rules | `src/data/globalT96Rules.ts` | Primary repository contract | Some enemy constants are calibrated, not official tables | T96 roll caps, food, tier identity, row semantics |
| Official Global 2.1 notice | [Path Balance Adjustments](https://www.wherewindsmeetgame.com/news/official/Adjustment528.html) | Primary for published path availability/change scope | Does not publish the full damage formula | Current path identity only |
| WBM | [`74cf368…`](https://github.com/greydust/where-builds-meet/tree/74cf368193eb4b15cf0e1e637f569093a153f2e7) | Cross-check | GPL implementation; several rules cite the same community sources as WWMDPS | Staged stats, event loop, set conditions, expected/sampled separation |
| WWMDPS | [`8009ba1…`](https://github.com/M1zuke/where-winds-meet-dps/tree/8009ba11cc882ce5310727dc0ba79ad4c6fd2efc) | Cross-check | Shares CN PDF/community provenance with WBM for core math | One-kernel formula, T96 set ladders, timeline/resources, feature inventory |
| Shared community PDF/guides cited by refs | Traced through both pinned repos | Secondary only | Not independent merely because both repos cite it | Penetration branch, rate concepts; never sole confirmation |

## Formula and mechanic audit

### Stat sources and stages

| ID | WWM current implementation | WBM behavior | WWMDPS behavior | Current Global / official / fixture evidence | Source independence | Worked example | Verdict | Code/test location | Impact on DPS / ranking | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| ST-01 Innate/base stats | Tier sheet seeds base attack/rates; user base override is separate | Zero-to-staged character assembly | Defaults plus class/breakthrough assembly | Accepted tier sheets and T96 fixture | Repo primary; refs structural | T96 base fields enter once before gear | PROVISIONAL | `calc.ts`; `validate-t96-product.mjs` | Load-bearing absolute DPS | Exact Global character-level decomposition is incomplete |
| ST-02 Breakthrough/level bonuses | Active tier <code>405&#124;0.65b</code>; no general breakthrough selector | Selected breakthrough supplies level stats/target | Selected breakthrough owns target and character bonuses | Accepted Global 2.1 calibration; official notice has no constants | Repo primary | T96 selects 405 defense, 0.65 judgment input | PROVISIONAL | `calc.ts`; tier self-check | High | Constants retained; provenance remains explicit |
| ST-03 Enhancement | Folded into panel/base override, not an independently editable stage | Explicit stage | Explicit stage | No isolated Global fixture in WWM | Refs agree but share data shape | Cannot subtract enhancement from owner panel deterministically | UNKNOWN | Audit only | Potentially high | Do not invent stage values |
| ST-04 Oddities | Not separately modeled | Explicit regional Oddity stage | Explicit data stage | No WWM Global fixture | Reference-only | No worked Global delta | UNKNOWN | Audit only | Medium | Candidate feature depends on current client capture |
| ST-05 Talents | Some path-specific effects embedded in reference skill rows/Jade scenario | Rank-specific talent stage | Martial-art talent data and formulas | Current WWM has no complete Global talent fixture | Refs are comparison, not authority | Embedded coefficients cannot prove all talent deltas | PROVISIONAL | `referenceData.ts`; Jade validators | High and path-specific | Do not generalize across paths |
| ST-06 Base attribute conversion | Five-attribute conversions feed computed panel | Raw-stage conversions | Authored once and shared | Accepted repo rules/workbook lineage | Repo primary; refs corroborate structure | Agility contributes Min ATK and Critical through existing mapping | CONFIRMED | `App.tsx` read-only trace; T96 product validator | Medium | Presentation-owned wiring not changed |
| ST-07 Gear normal rows | Six normal rows preserved and summed | Structured gear rows | Structured gear word pool | Six-row Product Owner OCR fixture | Independent client fixture | Six rows remain six; no truncation to four | CONFIRMED | `gearAttunement.ts`; OCR/set validator | High for panel totals | Separate from Attunement |
| ST-08 Retuned lines | Retuned flag retained; numerical line uses same stat mapping | Retunement is modeled | Retunement/reattunement analyzers | Product Owner six-row fixture proves identity, not reroll distribution | Repo fixture primary | `[Turn] Momentum 49.4` stays a normal retuned row | CONFIRMED | OCR/set validator | Medium | Optimization distributions remain unavailable |
| ST-09 Attunement source | Seventh semantic row, aggregated to `attunedBonus` | Per-action/tag attunements | Per-action/tag attunements | Accepted 1106/1129 owner fixture | Repo fixture primary | 20% on eligible hit multiplies that hit by 1.20 once | CONFIRMED | `calc.ts`; attunement runtime validator | High on eligible skills | Family/tag coverage is path-bounded |
| ST-10 Inner Ways | Static stats plus Dust timeline buffs; Jade scenario model | Static and tracked conditional effects | Static and tracked effects | Current repo evidence varies by Inner Way | Mostly shared community provenance | Morale/Song/Phantom are timeline-owned for Dust | PROVISIONAL | `rotationTimeline.ts`; trust validators | High | No universal Inner Way parity claim |
| ST-11 Arsenal | Some inputs folded into panel; no full independent stage | Explicit stage | Explicit stage | No isolated current Global fixture | Reference-only | No deterministic subtraction fixture | UNKNOWN | Audit only | Medium | Keep folded values, do not expose optimizer claims |
| ST-12 Bow/ring | Selected stat added once outside menu panel | Explicit gear/set contribution | Explicit set contribution | Existing accepted product contract | Repo primary | Crit option adds 3.7 percentage points once | PROVISIONAL | `App.tsx` read-only trace; closure validators | Medium | Values lack a fresh isolated client fixture in this lane |
| ST-13 Weapon set 2pc | Canonical catalog used in comparisons; several entries were stale T91 | T96 values in set data | T96 per-level ladders | Repo T96 roll caps plus two current pinned refs | Three-way; refs likely partly shared, repo cap independent | Hawkwing 3.7→4.5; Jadeware 64→77.8 | CORRECTED | `setCatalog.ts`; formula-parity validator | Medium; can reorder close comparisons | UI-owned duplicate descriptions remain integration dependency |
| ST-14 Weapon set 4pc | Only bounded models may execute; conditional sets now fail at kernel | Event-state set mechanics | Buff/mechanic engine | Repo-specific Starweave fixture; other conditions unresolved | Ref implementations are not proof of Global timing | Jadeware now returns unavailable without Qi/uptime state | CORRECTED | `calc.ts`; `setCatalog.ts`; formula-parity validator | High; prevents false winners | No GPL code copied |
| ST-15 Armor set | Identities catalogued; offensive effects unavailable/reference-only | Multiple modeled sets | Limited current set support | Accepted repo recorded conflicting legacy hooks | Repo conflict is decisive | Equipped unknown armor 4pc cannot produce a ranking | CONFIRMED | `setCatalog.ts`; OCR/set validator | High safety, unknown magnitude | All represented armor sets remain fail closed |
| ST-16 Food | Adds effective Physical min/max 120/240 at T96 | Effective-only stage | Effective input stage | Accepted T96 rules/fixture | Repo primary; refs corroborate | 2000/1900 + food gives 2120/2140 before normalization | CONFIRMED | `calc.ts`; `globalT96Rules.ts` | Medium | No duplicate panel application |
| ST-17 Script | No separately evidenced script stage in shared WWM kernel | Explicit selectable source | Explicit selectable data | No current WWM fixture | Reference-only | No numeric fixture | UNKNOWN | Audit only | Potentially high | Remains unimplemented |
| ST-18 Divinecraft | Not modeled in shared WWM kernel | Explicit stage | Explicit data surface | No current WWM fixture | Reference-only | No numeric fixture | UNKNOWN | Audit only | Potentially high | Remains unimplemented |
| ST-19 Global buffs/debuffs | Limited named scenario/timeline effects | General tracked system | General tracked system | Only bounded WWM effects have evidence | Per-effect provenance required | Dust named effects resolve on timeline, not as global average | PROVISIONAL | `rotationTimeline.ts` | High | No generic editor parity |
| ST-20 Conditional action buffs | Dust/Jade-specific condition paths only | Per-action snapshot | Per-hit context | WWM evidence is effect-specific | No blanket independence | Starweave distance portion stays uncredited without distance | PROVISIONAL | `calc.ts`; path validators | High | Each new condition needs a fixture |

### Attack ranges

| ID | WWM current implementation | WBM behavior | WWMDPS behavior | Current Global / official / fixture evidence | Source independence | Worked example | Verdict | Code/test location | Impact on DPS / ranking | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| AT-01 Min Physical | Panel min, then effective subtraction | Staged effective minimum | Staged effective minimum | T96 observed panel | Repo fixture primary | Owner panel min enters once | CONFIRMED | `calc.ts`; T96 validator | High | — |
| AT-02 Max Physical | `max=max(min,max)` | Same normalization | Same normalization | Accepted steel-ceiling behavior | Corroborated | 2000/1900 normalizes to 2000/2000 | CONFIRMED | `calc.ts`; attribute self-check | High near inversion | — |
| AT-03 Min path attribute | Path plus Formless, then defense | Primary path plus Formless after normalization | Path attribute plus Formless/Void | Formless identity fixture, no exact damage parse | Identity independent; damage stage disputed | 100 path + 20 Formless = 120 before current defense | PROVISIONAL | `calc.ts`; OCR/set validator | High | Defense application remains disputed |
| AT-04 Max path attribute | Path plus Formless; affinity uses max endpoint | Normalized primary plus Formless | Normalized max attribute | Repo type/fixture identity | Structural corroboration | Affinity selects effective max | PROVISIONAL | `calc.ts`; probability self-check | High | Exact Global roll distribution unresolved |
| AT-05 Effective min/max | Subtracts target defense from both Physical and attribute | Defense applies to Physical; attribute treatment differs | Docs state attribute does not subtract defense | Accepted WWM calibration fits current owner fixture but no isolating parse | Conflict unresolved; no majority vote | Current `max(0, attack-405)` retained | PROVISIONAL | `calc.ts`; mechanics audit | Very high | Largest unresolved formula family |
| AT-06 Raw vs effective stages | Panel aggregation then temporary/timeline effects | Explicit immutable raw/stats/buffed/action snapshots | Shared stat/context pipeline | WWM has partial separation | Refs independently implement staged designs, not same exact values | Food is temporary and not written back to raw panel | PROVISIONAL | `App.tsx` read-only trace; timeline code | High; duplicate risk | Full stage parity not implemented |
| AT-07 Max normalization timing | Physical before defense; attribute only after Formless sum | Primary normalized before Void/Formless folding | Normalizes staged ranges | No isolated Global fixture for ordering | Reference agreement not enough | Different if base 200/100 and Formless 0/50 | UNKNOWN | Audit only | Medium-high edge case | Needs an in-game inverted-range fixture |
| AT-08 Formless/Void folding | Adds once to primary attribute min/max | Adds once after primary normalization | Adds to equipped primary | Current OCR identity and repo contract | Repo evidence primary for identity | 100 path + 20 Formless is 120, never 140 | CONFIRMED | `calc.ts`; formula self-check family | High | Active panel wiring remains in App |
| AT-09 Off-element attack | Tracks off-element fraction and uses Physical coefficient | Typed primary/other channels | Typed attribute rows | Current calc labels provisional; no Global worked fixture | Shared secondary sources not sufficient | 50% off-element interpolates coefficient halfway | PROVISIONAL | `calc.ts`; assumptions validator | High for mixed-element gear | Do not promote |
| AT-10 No duplicate application | Attunement and Formless have single owned stages | Snapshot pipeline prevents repeats | One kernel/context | Owner 1106/1129 and semantic validators | Repo fixture primary | Attunement 20.2 changes only eligible aggregate once | CONFIRMED | attunement runtime; closure validators | High | Cross-layer invariant retained |

### Outcome rates

| ID | WWM current implementation | WBM behavior | WWMDPS behavior | Current Global / official / fixture evidence | Source independence | Worked example | Verdict | Code/test location | Impact on DPS / ranking | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| OR-01 Precision | Base 65% plus excess divided by `1+judgeRes`, capped 100% | White/yellow conversion | Same white/yellow convention | Accepted workbook lineage and existing regression | Refs share community provenance | At 100 panel, T96: 65% + 35%/1.65 = 86.212% | PROVISIONAL | `calc.ts`; probability self-check | High | Current Global isolating fixture absent |
| OR-02 Critical | Panel divided by judgment, base effective cap 80% | Effective cap before direct | Same | Existing accepted mechanics | Shared provenance | 100 panel at T96 gives 60.606% before direct | PROVISIONAL | `calc.ts`; probability self-check | High | — |
| OR-03 Affinity | Panel divided by judgment, base effective cap 40% | Independent outcome | Same | Existing accepted mechanics | Shared provenance | 40 panel at T96 gives 24.242% | PROVISIONAL | `calc.ts`; probability self-check | High | — |
| OR-04 Direct Critical | Added after resistance/cap, then Precision-gated | Direct bypasses resistance | Same | Existing Global evidence contract | Repo evidence plus refs | 10% direct adds ten points before Precision gate | PROVISIONAL | `calc.ts` | Medium-high | Malformed over-cap now bounded |
| OR-05 Direct Affinity | Added after resistance; Affinity not Precision-gated | Same | Same | Existing Global evidence contract | Repo evidence plus refs | 10% direct adds ten outcome points | PROVISIONAL | `calc.ts` | Medium-high | — |
| OR-06 White/yellow conversions | Panel rate is white; formula produces effective yellow | Explicit | Explicit | UI/product semantics established | Corroborated | Reported effective rates differ at nonzero judgment | CONFIRMED | `calc.ts`; Jade rate diagnostics | Medium | Naming retained |
| OR-07 Resistance and caps | `jR=1+judgeRes`; caps 1.0/0.8/0.4 | Target profile | Target profile | Active tier contract | Exact constants provisional | T96 uses divisor 1.65 | PROVISIONAL | tier and probability checks | High | Target constants not official formula publication |
| OR-08 Abrasion/graze | `(1-P)*(1-A)` | Same | Same and cites source correction | Existing WWM regression | Both refs share cited provenance; repo regression retained | P=.8, A=.2 gives .16 | CONFIRMED | probability self-check; formula-parity validator | Medium below precision cap | Already present before sprint |
| OR-09 Probability mass | Four outcomes now centrally bounded and normalized | Bounded four-way outcomes | Bounded one-kernel outcomes | Mathematical invariant; no game evidence needed | Independent invariant | P=.9, C=1.8, A=.3 → .63/.3/~0/.07 = 1 | CORRECTED | `resolveOutcomeProbabilities`; formula-parity validator | Prevents up to unbounded false DPS on corrupt imports | Normal inputs remain unchanged |
| OR-10 Forced outcomes | Guaranteed Critical consumes all mass | Per-action forced outcomes | `neverCrits`/forced behavior | Current Global skill outcome evidence for named Dust action | Repo evidence primary | Forced crit = 1/0/0/0 | CONFIRMED | `globalV2CombatEvidence.ts`; outcome validator | High for affected skills | No unverified forced Affinity rule added |
| OR-11 Stateful outcome feedback | No general stochastic proc feedback; Hawkwing excluded | Exact expected-state branching | Expected schedule plus sampled state | No WWM fixture | Reference-only | Expected Affinity cannot be fed back as a concrete proc | UNKNOWN | capability registry | High for proc sets | Simulation remains disabled |

### Damage chain

| ID | WWM current implementation | WBM behavior | WWMDPS behavior | Current Global / official / fixture evidence | Source independence | Worked example | Verdict | Code/test location | Impact on DPS / ranking | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| DM-01 Defense | Subtract 405 from both channels, floor zero | Target defense; docs use 408 and Physical-focused chain | Docs describe Physical defense and no attribute defense | Accepted WWM 405 calibration, no isolating Global parse | Direct conflict | 1000 Physical becomes 595 before coefficients | PROVISIONAL | `calc.ts`; T96 validator | Very high | No change without a worked in-game fixture |
| DM-02 Physical penetration | Net against 26 at T96 | Net branch | Net branch | Accepted calibration and regression | Shared secondary source; WWM regression | Pen36 → net10 → multiplier1.05 | PROVISIONAL | `netPenZone`; penetration self-check | High | Branch provenance explicit |
| DM-03 Attribute penetration | Net against 28 at T96 | Per attribute | Per attribute | Accepted calibration and regression | Same limitation | Pen18 → net-10 → multiplier0.90 | PROVISIONAL | `calc.ts`; penetration self-check | High | — |
| DM-04 Target resistance | Encoded as tier phys/attr resistance | Selected target values, often zero | Below breakthrough20 zero in reference | Current WWM calibrated 26/28 conflicts | No independent Global fixture | Current T96 retains 26/28 | PROVISIONAL | `calc.ts`; unsafe-assumptions validator | Very high | Do not borrow reference target |
| DM-05 Path resistance | Single active attribute resistance | Per-path target resistance | Per-attribute target resistance | No WWM per-path Global fixture | Reference-only | No numeric path-specific example | UNKNOWN | Audit only | High | Per-path values stay unavailable |
| DM-06 Net-penetration deficit | Delta below zero divided by100 | Same | Same | Existing regression | Corroboration shares source; math retained provisional | -10 → -0.10 | PROVISIONAL | penetration self-check | High | Boundary delta0 is neutral |
| DM-07 Net-penetration overflow | Positive delta divided by200 | Same | Same | Existing regression | Same source caveat | +10 → +0.05 | PROVISIONAL | penetration self-check | High | Already correct before sprint |
| DM-08 Skill fixed term | Per-row `fixed` term | Per-row physical/attribute flats | Per-row flat terms | Legacy reference data, not current Global fixture | Reference implementations derive from their own tables | Fixed 100 is separately multiplied | PROVISIONAL | `referenceData.ts`; `calc.ts` | High per skill | Coefficients path-bounded |
| DM-09 Fixed-damage bonus | Universal +22.5% to fixed term | No universal constant | No universal constant; row/effect based | Current code explicitly labels provisional | Ref agreement may share absence, not proof | Fixed100 becomes122.5 | PROVISIONAL | `calc.ts`; assumptions validator | Potentially very high | Must not be removed without Global fixture |
| DM-10 Physical coefficient | `outerRatio` per row | Per damage row | Per damage row | Legacy rows plus bounded outcome evidence | Reference tables are not independent truth | Effective avg595 × ratio1.0 | PROVISIONAL | `referenceData.ts`; path validators | Very high | Current paths only |
| DM-11 Attribute coefficient | `eleRatio`; off-element interpolation | Per row | Per row with martial multiplier | Legacy rows; no broad Global fixture | Reference-only | Own-element ratio1.5 vs off-element physical ratio | PROVISIONAL | `calc.ts`; attribute self-check | Very high | — |
| DM-12 Path multiplier | Embedded in coefficient/data | Explicit primary path multiplier | Elevated attribute multiplier | No isolating WWM fixture | Shared source likely | Cannot independently decompose current row | PROVISIONAL | reference data | High | No rewrite |
| DM-13 Attribute multiplier | `pzDmg` separate multiplicative bucket | Attribute bonus channel | Attribute bonus channel | Accepted panel semantics | Corroborated structure | 10% pzDmg multiplies attribute component by1.10 | PROVISIONAL | `calc.ts` | High | — |
| DM-14 General damage boost | Additive inside `T` with other listed bonuses | Typed additive/multiplicative effects | Bracketed formula context | Effect-specific repo evidence | No generic proof | Two +5% entries make `T` +0.10 | PROVISIONAL | `calc.ts`; timeline validators | High | Channel grouping remains audit-sensitive |
| DM-15 Independent multiplier | Attunement is independent on eligible rows | Per-action multiplier | Attunement/action context | Owner fixture | Repo primary | 20% eligible attunement gives ×1.20 | CONFIRMED | `calc.ts`; attunement validator | High | Exactly once |
| DM-16 Target-side reduction | Not generally modeled | Requirement/effect pipeline | Subtracts inside opposing bracket | No WWM Global fixture | Reference-only | No current numeric result | UNKNOWN | Audit only | High | Disabled rather than guessed |
| DM-17 Boss damage | Additive in `T` | Target/type bonus | Formula context bonus | Accepted panel field, no isolated parse | Repo-only | +3.2 points adds .032 to `T` | PROVISIONAL | `calc.ts` | Medium | — |
| DM-18 Martial-art bonuses | AllArts plus weapon family/suffix, additive once | Skill-tag resolution | Skill-tag resolution | Current repo mappings and 1106/1129 fixture | Repo primary for owner path | Umbrella Martial applies only matching row | CONFIRMED | `calc.ts`; Bamboocut trust validator | High | Mapping gaps remain path-specific |
| DM-19 Mystic bonuses | Single/area fields apply only `type=mystic` | Tag-scoped | Tag-scoped | No complete current Global Mystic fixture | Reference-only | Weapon row gets zero Mystic bonus | PROVISIONAL | `calc.ts` | Medium | Values may be incomplete |
| DM-20 Critical damage | `1 + critDmg + row extra`, conditional set additions | Outcome multiplier | Outcome multiplier | Existing mechanics contract | Shared provenance | 54% plus27% row extra →1.81 before sets | PROVISIONAL | `calc.ts`; probability checks | High | — |
| DM-21 Affinity damage | `1 + affDmg`, conditional set addition | Outcome multiplier | Outcome multiplier | Existing mechanics contract | Shared provenance | 35% →1.35 | PROVISIONAL | `calc.ts` | High | Jadeware addition now inaccessible without state |
| DM-22 Attuned multiplier | Applied only when `isDingyin` | Tag/entry scoped | Attunement scope | Product Owner fixture | Repo primary | Ineligible row ratio stays1.0 | CONFIRMED | attunement runtime validator | High | — |
| DM-23 Per-hit vs per-cast | `tiaozhan`, count, attunement scale once | Event/hit distinction | Hit rows inside casts | Existing WWM regression surface | Structural corroboration | Per-hit×count×challenge multiplier | PROVISIONAL | `calc.ts`; timeline engine | Medium-high | Some legacy count rows encode multiple hits |
| DM-24 Breakdown conservation | Four weighted components sum to total | Breakdown from same kernel | Breakdown from same kernel | Mathematical invariant | Independent invariant | Sum parts equals `perHit×count×tiaozhan` | CONFIRMED | probability/baseline checks | Diagnostic integrity | Floating tolerance applies |

### Sets and systems

| ID | WWM current implementation | WBM behavior | WWMDPS behavior | Current Global / official / fixture evidence | Source independence | Worked example | Verdict | Code/test location | Impact on DPS / ranking | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| SET-01 Hawkwing | 2pc 4.5; 4pc reference-only | Exact expected/sampled stacks | Timeline expected/sampled stacks | T96 cap plus pinned current ladders; no WWM proc fixture | 2pc sufficiently corroborated; 4pc not | 3.7→4.5; 4pc yields unavailable | CORRECTED | set catalog; formula-parity validator | Medium 2pc, high 4pc | Hawkwing probability remains disabled |
| SET-02 Starweave | 2pc 77.8; bounded five-stack +15% Martial component | 2pc only; full 4pc deferred | Older/current support differs | Current Global tooltip/owner fixture | Repo primary for bounded component | +3%×5=+15%; distance uncredited | CORRECTED | set catalog; Dust mechanics validators | High | UI may display rounded +78 |
| SET-03 Jadeware | 2pc 77.8; 4pc now reference-only/kernel unavailable | Explicitly deferred due Qi ambiguity | Timed buff with Qi gating | No WWM player/target Qi fixture | Both refs disagree on safe implementation scope | Old permanent +7.5/+10 cannot execute | CORRECTED | set catalog; calc; validator | Very high; prevents false winner | Tooltip behavior remains UNKNOWN |
| SET-04 Rainwhisper | 2pc Precision8; base +10 Crit DMG modeled, shield extra absent | 10 plus shield15 | Timed shield bonus | Current ladders; no WWM shield lifecycle fixture | 2pc sufficient; 4pc partial | 6.6→8.0 | CORRECTED | set catalog; calc | Medium | Modeled result excludes shield uplift |
| SET-05 Ivorybloom | 2pc Crit9; assumes full-HP 4pc | Full-HP condition | Current implementation has changed over time | 2pc ladder; no damage-taking fixture | 4pc not independent | 7.4→9.0 | CORRECTED | set catalog; calc | Medium-high | Executable only in no-damage/full-HP scenario |
| SET-06 Swallowcall | 2pc77.8; 4pc reference-only | Light/Rodent and Qi/status conditions | Removed when incomplete | 2pc ladder only | Strong evidence that current unconditional +6 was incomplete | 64→77.8; 4pc unavailable | CORRECTED | set catalog; calc boundary | High | Needs action tags and target Qi |
| SET-07 Swaying Heights | 2pc77.8; 4pc reference-only | Per-hit target-HP ladder 5–10% | Unimplemented/removed | 2pc ladder only | 4pc lacks WWM target HP state | 64→77.8; 4pc unavailable | CORRECTED | set catalog; calc boundary | High | No conservative permanent +5 |
| SET-08 Cleftpeak | 2pc77.8 catalogued; 4pc unavailable | Stateful stacks | Modeled for supported class | T96 ladder only | 4pc no WWM fixture | Identity/stat retained, ranking disabled | UNKNOWN | set catalog; validator | High | No path unlock |
| SET-09 Mistwillow | 2pc Precision8; 4pc reference-only | Partial/deferred | Buff system | T96 ladder only | 4pc no WWM fixture | 6.6→8.0 | PROVISIONAL | set catalog | Medium | Stat known; effect not |
| SET-10 Etherwrath | 2pc77.8; 4pc unavailable | Stateful DirectDamage stacks | Reference behavior | T96 ladder only | 4pc no WWM fixture | Stat retained, ranking disabled | UNKNOWN | set catalog | High | — |
| SET-11 Swift Gale | 2pc Max77.8; 4pc reference-only | Catalogued | Removed/unimplemented | T96 ladder corroboration | 4pc absent | 64→77.8 | PROVISIONAL | set catalog | Medium | — |
| SET-12 Tiltrim | 2pc77.8; 4pc unavailable | Catalogued without proven full effect | 2pc ladder | Official path availability plus ladder, no 4pc values | 2pc sufficient | Stat retained, effect disabled | UNKNOWN | set catalog | High | Does not unlock Draught |
| SET-13 Eaglerise armor | Identity only, unavailable | Modeled behavior in ref | No sufficient matching model | Repo records conflicting legacy hook | Conflict decisive | No numerical winner | UNKNOWN | set catalog; OCR validator | High | — |
| SET-14 Formbend armor | Identity only, unavailable | Shield/Breakthrough timing | Reference support varies | Repo description/hook conflict | Conflict decisive | No numerical winner | UNKNOWN | set catalog | High | — |
| SET-15 Moonflare armor | Reference-only | Modeled armor set | Reference support varies | Identity fixture, no current effect fixture | Insufficient | No numerical winner | UNKNOWN | set catalog | High | Not confused with Starweave |
| SET-16 Ebonward armor | Unavailable | Reference data | Reference data | Identity only | Insufficient | No numerical winner | UNKNOWN | set catalog | Unknown | — |
| SET-17 Beyond the Chill armor | Reference-only | Reference data | Reference data | Identity only | Insufficient | No numerical winner | UNKNOWN | set catalog | Unknown | — |
| SET-18 Whirlsnow armor | Reference-only | Reference data | Reference data | Identity only | Insufficient | No numerical winner | UNKNOWN | set catalog | Unknown | — |
| SET-19 Calmwaters armor | Reference-only | Reference data | Reference data | Identity only | Insufficient | No numerical winner | UNKNOWN | set catalog | Unknown | — |
| SET-20 Jadeclasp armor | Unavailable | Reference data | Reference data | Identity only | Insufficient | No numerical winner | UNKNOWN | set catalog | Unknown | — |
| SET-21 Honorbound armor | Unavailable | Reference data | Reference data | Identity only | Insufficient | No numerical winner | UNKNOWN | set catalog | Unknown | — |
| SET-22 Ripple Step armor | Unavailable | Reference data | Reference data | Identity only | Insufficient | No numerical winner | UNKNOWN | set catalog | Unknown | — |
| SET-23 Flawless Guardian armor | Unavailable | Reference data | Reference data | Identity only | Insufficient | No numerical winner | UNKNOWN | set catalog | Unknown | — |
| SET-24 Brimflow armor | Unavailable | Reference data | Reference data | Official path availability only | Insufficient | No numerical winner | UNKNOWN | set catalog | Unknown | No borrowed legacy bonus |

### Timeline

| ID | WWM current implementation | WBM behavior | WWMDPS behavior | Current Global / official / fixture evidence | Source independence | Worked example | Verdict | Code/test location | Impact on DPS / ranking | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| TL-01 Cast duration | Dust timing registry; Jade authored durations; missing values fail closed | Authored event durations | 60fps frame durations | WWM timing provenance is partial | Reference timings not transferable | Missing positive cast time returns unavailable | CONFIRMED | `skillTiming.ts`; missing-timing validator | High | No guessed defaults |
| TL-02 Hit timing | Dust count distribution; Jade event times | Explicit hits | Explicit hits | No complete WWM Global hit fixture | Reference-only | Same cast count can differ by buff window | PROVISIONAL | `rotationTimeline.ts`; Jade model | High | — |
| TL-03 Ping | Not modeled | Current WBM integrates ping | Reference has gap/timing controls | No WWM latency fixture | Reference-only | No numeric delta | UNKNOWN | Audit only | Medium-high | Disabled |
| TL-04 Final action boundary | Fixed scenario window; basic inclusion | Explicit endpoint rule | Fixed rotation window tests | WWM lacks boundary capture | Reference-only | Hit after 60s currently excluded by window path | PROVISIONAL | timeline validators | Medium | Exact same-time ordering not globally proven |
| TL-05 Battle end | Scenario duration, no general Battle End event | Explicit Battle End excludes same-time damage | Fixed window semantics | No WWM fixture | Reference-only | No general event fixture | UNKNOWN | Audit only | Medium | — |
| TL-06 DoT cadence | Only path-specific represented rows/ticks | Shared-clock DoTs | Authored debuff tick cadence | No comprehensive WWM fixture | Reference-only | Jade drone tick is not proof for generic DoTs | PROVISIONAL | Jade model | High | Generic cadence unavailable |
| TL-07 Refresh | Limited named buff expiry refresh | Full lifecycle | Buff/debuff lifecycle | Effect-specific WWM tests only | Per-effect | Morale stack expiry path covered | PROVISIONAL | `rotationTimeline.ts` | High | — |
| TL-08 Expiration | Named Dust/Jade expiries | Absolute expiration | Frame expiration | Effect-specific evidence | Per-effect | Buff active only while start ≤ expiry | PROVISIONAL | timeline code | High | — |
| TL-09 Trigger-enqueued actions | Jade drone emits ticks; no generic engine | Generic queue | Trigger system | No general WWM fixture | Reference-only | Drone events stop at scenario end | PROVISIONAL | Jade validator | High | No cross-path generalization |
| TL-10 Skill cooldown logic | Jade Q/drone limited model; absent generically | Generic cooldowns | Authored cooldowns | Jade scenario evidence provisional | Reference-only beyond Jade | Q charges/recharge in Jade model | PROVISIONAL | Jade scenario validators | High | — |
| TL-11 Resource state | Jade petals/vitality only | Multiple resources | Class resources | Only Jade bounded model | Repo-specific | Petals gate drone start | PROVISIONAL | `silkbindJade.mjs` | High | Other paths disabled |
| TL-12 Vitality | Jade heuristic reserve; no shared deficit correction | Branch-aware deficit scale | Resource ledger | No WWM Global fixture | Reference-only | Vitality cannot authorize a missing action | PROVISIONAL | Jade model | Medium-high | Not parity with refs |
| TL-13 HP/Qi/boss conditions | Jade scenario booleans/times; other set conditions unavailable | Per-action target/player state | Timeline state | No general WWM encounter fixture | Reference-only | Jadeware/Swaying/Swallowcall fail closed | CORRECTED | calc/set catalog validator | Very high safety | — |

### Stochastic and simulation

| ID | WWM current implementation | WBM behavior | WWMDPS behavior | Current Global / official / fixture evidence | Source independence | Worked example | Verdict | Code/test location | Impact on DPS / ranking | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| MC-01 Expected-value path | Shared four-outcome expectation; Jade deterministic event pricing | Full expected-state engine | Deterministic kernel | Mathematical outcome invariant plus bounded path data | Independent invariant | Weighted four outcomes sum to per-hit | CONFIRMED | calc; probability validator | High | Stateful expected procs excluded |
| MC-02 Monte Carlo path | UI code exists but every product simulation capability is disabled | Seeded sampled path | Worker simulation | No current WWM RNG/proc validation | References not authority | No user-facing sampled result permitted | UNKNOWN | path capability registry | High | Deliberately disabled |
| MC-03 RNG schedule | Uses `Math.random` in dormant UI, no seed contract | Deterministic seeded schedule | Worker run schedule | No WWM contract | Reference-only | Runs cannot be reproduced by seed | UNKNOWN | Audit only | High for percentiles | Must be redesigned before enablement |
| MC-04 Proc state | Not generally modeled | Exact/sample states | Concrete sampled states | No WWM fixture | Reference-only | Hawkwing remains unavailable | UNKNOWN | set catalog | High | — |
| MC-05 Stacking/expiry | Deterministic named timelines only | Branch/state lifecycle | Frame state | Effect-specific WWM evidence | Limited | Dust named stacks only | PROVISIONAL | rotation timeline | High | — |
| MC-06 Deterministic vs sampled parity | No enabled sampled path | Cross-mode tests | Deterministic/sampled tests | No WWM sampled implementation | Reference-only | Cannot assert convergence | UNKNOWN | capability registry | High | Required before simulation enablement |
| MC-07 Expectation feedback | No stateful expected proc enabled | Distribution propagation | Expected schedule distinct from sample | Safety rule, no implementation needed while disabled | Independent modeling invariant | Mean Affinity must not become a concrete proc | CONFIRMED | fail-closed registry; audit | High | Negative gate is the correct current behavior |

### Optimization

| ID | WWM current implementation | WBM behavior | WWMDPS behavior | Current Global / official / fixture evidence | Source independence | Worked example | Verdict | Code/test location | Impact on DPS / ranking | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| OP-01 Stat priority delta | Jade only, same scenario/objective | Worker marginal comparison | Worker marginal comparison | Jade capability contract | Repo primary | No-change stat delta = 0 | PROVISIONAL | Jade model/capability validators | High | Other paths disabled |
| OP-02 Attunement priority | Bounded semantics in gear comparison; no full standalone optimizer | Explicit comparison | Attunement analysis | Owner fixture proves Dust family only | Repo primary | 20.0 vs20.2 changes eligible rows | PROVISIONAL | attunement runtime; compare closure | Medium-high | — |
| OP-03 Inner Way priority | No generally authorized priority surface | Comparison worker | Analysis support | No WWM comprehensive fixtures | Reference-only | No winner allowed | UNKNOWN | capability registry | High | Disabled |
| OP-04 Gear Compare | Splendor/Umbra/Jade provisional; unsupported sets/paths fail closed | Full gear comparisons | Full gear swap/ranking | Existing capability registry and scenario guards | Repo primary | Unsupported path cannot produce a winner | CONFIRMED | capability matrix/closure | High | Dust comparison intentionally disabled |
| OP-05 Best Build objective | Jade-only provisional objectives | Build optimization | Graduation build/ranking | Jade contract | Repo primary | Result path/scenario must match request | PROVISIONAL | Jade cache/scenario validators | High | Not universal truth |
| OP-06 Ranking identity/cache | Jade cache includes model version, panel, objective, scenario and salt | Worker request identity | Worker/input isolation | Existing regression | Repo primary | Changed objective changes key | CONFIRMED | Jade model; scenario contract | High | — |
| OP-07 Stale-result suppression | Request id plus calculation identity | Worker cancellation/versioning | Worker result guards | Existing regression | Repo primary | Old request id cannot publish | CONFIRMED | calc helpers; capability validators | High | — |
| OP-08 Unsupported path comparison | Capability registry denies numerical surfaces | Broader reference path list | Broader reference class list | Current Global identity does not imply model completeness | Repo primary | Draught identity exists, numerical winner does not | CONFIRMED | path catalog; Draught validator | High safety | No path unlocked |
| OP-09 Legacy baseline | T91 anchors reference-only; current validated baseline null | Current baseline models | Graduation build models | Repo explicitly has no current validated baseline | Repo primary | Legacy anchor cannot authorize Wind | CONFIRMED | baseline self-check | High | Graduation percentage is not current truth |
| OP-10 Set ranking | Only modeled set effects can enter; T96 stats corrected | Set-aware comparison | Set-aware comparison | T96 caps plus fail-closed state | Repo primary for gate | Conditional current set returns unavailable | CORRECTED | calc/set catalog validator | High | UI duplicate metadata still needs Account A integration |

### Target and tier

| ID | WWM current implementation | WBM behavior | WWMDPS behavior | Current Global / official / fixture evidence | Source independence | Worked example | Verdict | Code/test location | Impact on DPS / ranking | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| TG-01 Breakthrough enemy profile | Named tier table, not breakthrough UI | Breakthrough data | Breakthrough targets | Accepted WWM T96 contract | Repo primary | <code>405&#124;0.65b</code> selected | PROVISIONAL | tier checks | Very high | — |
| TG-02 Defense | 405 | 408 at breakthrough16/17 | Target-specific; docs differ | Accepted WWM calibration; no official exact table | Direct conflict | 3-point delta propagates through every attack term | PROVISIONAL | T96 validator | High | Do not majority-vote |
| TG-03 Judgment resistance | 0.65 stored, divisor1.65 | 65% | Target profile 65% | Accepted WWM contract | Corroborated but shared provenance | 100 crit →60.606 effective | PROVISIONAL | probability/tier checks | High | — |
| TG-04 Physical/path resistance | 26/28 | Zero in current WBM target | WWMDPS says zero below breakthrough20 | WWM calibration only | Direct conflict | Pen36 physical becomes net10 | PROVISIONAL | penetration checks | Very high | Priority evidence gap |
| TG-05 Global T96 values | Food120/240, roll caps, tier key current | Level96 profile | Level96 ladders | Repo rules and Product Owner fixtures | Set ladders independently corroborated | Physical set cap77.8 | CONFIRMED | T96 product and formula parity validators | High | Display may round |
| TG-06 Legacy T91/CN separation | Separate preview/reference tiers and baseline labels | Own selectable levels | Own selectable levels | Repo contract | Repo primary | T91 anchors never authorize T96 path model | CONFIRMED | baseline/tier self-check | High safety | Harness labels updated to current truth |

## Numerical feature parity matrix

`IMPLEMENT` means this sprint supplied the missing evidenced numerical foundation. `PARTIAL` means an existing bounded capability remains. `DEPENDENCY_UNKNOWN` stays disabled pending evidence/model state. `REJECT` means the reference feature would be misleading on the current foundation.

| Numerical feature | WWM status after audit | WBM | WWMDPS | Decision | Evidence / gate |
|---|---|---|---|---|---|
| DPS / total damage / duration | Provisional per authorized path | Full | Full | PARTIAL | Path capability registry and timing gates |
| DPS breakdown | Four-outcome and some per-skill breakdown | Full | Full | PARTIAL | Same-kernel conservation; path scope |
| Skill contribution | Dust/Jade bounded | Full | Full | PARTIAL | Missing timing/coefficient gates |
| Gear-stat lift | Bounded comparison consumers | Full | Full | PARTIAL | Unsupported paths remain disabled |
| Stat priority | Jade only | Full | Full | PARTIAL | Jade scenario identity required |
| Attunement priority | Family-aware bounded comparison | Full | Full | PARTIAL | Owner fixtures do not cover all paths |
| Inner-way priority | Not authorized generally | Full | Full | DEPENDENCY_UNKNOWN | Missing current Global effect fixtures |
| Graduation/progression metric | Legacy reference only | Full | Full | REJECT | No current validated Global baseline |
| Retunement analysis | Row identity only | Full | Full | DEPENDENCY_UNKNOWN | Missing current distributions and objective validation |
| Word-max analysis | No authoritative current surface | Full | Full | DEPENDENCY_UNKNOWN | Missing word pools/current roll semantics by path |
| Gear ranking | Jade/provisional subset; unsafe sets closed | Full | Full | PARTIAL | Capability and set gates |
| Build variants | Jade objectives/scenarios | Full | Full | PARTIAL | Scenario contract must match |
| Rotation variants | Editor exists; missing timing closes result | Full | Full | PARTIAL | No guessed cast duration |
| Resource-aware simulation | Jade deterministic resource slice | Full | Full | PARTIAL | No cross-path resource fixtures |
| Custom rotation numerical support | Authorized paths only | Full | Full | PARTIAL | Coefficients and timing both required |
| Skill Editor live preview | Existing coefficient preview, path gated | Full | Full | PARTIAL | Presentation integration unchanged |
| Target/encounter modeling | Fixed/provisional tier plus Jade scenario | Full | Full | DEPENDENCY_UNKNOWN | Defense/resistance and HP/Qi conflicts unresolved |
| Monte Carlo percentile/distribution | Product-disabled | Full | Full | REJECT | No seeded RNG, proc-state, or convergence contract |
| Bounded outcome-probability kernel | Over-cap-safe shared kernel | Bounded | Bounded | IMPLEMENT | Directional regression fails baseline and passes candidate |
| Current T96 weapon-set 2pc constants | Twelve canonical values corrected | Current T96 | Current T96 ladders | IMPLEMENT | Repo roll caps plus pinned independent implementations |
| Conditional set numerical safety | Shared kernel returns unavailable | State-aware | State-aware/selected sets | IMPLEMENT | Missing HP/Qi/tags cannot produce ranking |

## Before/after worked fixtures

| Fixture | Baseline `f4a0be…` | Candidate | Directional discriminator |
|---|---:|---:|---|
| Outcome inputs P=.9, C=.2, A=1.2 | Probability mass 1.2; Affinity expected weight 1.2 | Mass 1.0; Affinity1.0; all others0 | Candidate cannot price more than one outcome per hit |
| Outcome inputs P=.9, C=.2, A=-.3 | Affinity-.3, Critical.18, Graze.13, White.99 | Affinity0, Critical.18, Graze.10, White.72 | Imported negative rates cannot create negative probability |
| Hawkwing T96 2pc | Affinity3.7 | Affinity4.5 | Distinguishes T91 from T96 ladder |
| Jadeware T96 2pc | Max Physical64 | Max Physical77.8 | Distinguishes T91 rounded value from T96 |
| Rainwhisper/Mistwillow T96 2pc | Precision6.6 | Precision8.0 | Distinguishes T91 from T96 |
| Ivorybloom T96 2pc | Critical7.4 | Critical9.0 | Distinguishes T91 from T96 |
| Physical set T96 2pc | Mostly64 or absent | 77.8 | Distinguishes T91 from T96 |
| Jadeware/Swallowcall/Swaying 4pc without encounter state | Permanent simplified bonus could enter formula | `SET_EFFECT_MODEL_UNAVAILABLE` | Missing state cannot produce a winner |
| Accepted 1106 vs1129 owner fixture | 61266.44 vs60673.88, 1106 wins by0.977% | Same outputs | Ordinary supported calculation is unchanged |

## Integration dependencies and remaining unknowns

1. `src/App.tsx` contains Account A-owned duplicate set descriptions and a panel-construction shortcut. This lane did not edit it. Account A should replace those duplicates with `CURRENT_GLOBAL_SET_CATALOG` and apply evidenced 2pc stats through one owned panel stage. Until then, canonical comparison data is corrected but some displayed copy/menu-panel construction can remain stale.
2. Exact current Global T96 enemy defense and Physical/path resistance need an isolating in-game fixture. WWM (405, 26/28), WBM (408, zero), and WWMDPS (target-dependent, zero below breakthrough20) conflict; no majority vote was used.
3. The universal fixed-term +22.5%, attribute-defense subtraction, and off-element Physical coefficient remain explicitly provisional.
4. General HP/Qi, ping, DoT, resource, and proc-state models remain incomplete. Conditional sets and Monte Carlo therefore remain unavailable where those states are load-bearing.
5. No current validated Global graduation baseline exists. Legacy T91/CN anchors remain reference-only and cannot authorize rankings or paths.

## Acceptance mapping

- Directional formula/data regression: `scripts/validate-formula-parity.mjs`.
- Existing controversial-formula checks: `src/utils/probability.selfcheck.mjs`, `src/utils/penetration.selfcheck.mjs`, `src/utils/attributeFormula.selfcheck.mjs`.
- Target/product/fail-closed gates: `scripts/validate-t96-product.mjs`, `scripts/validate-v13-unsafe-assumptions.mjs`, `scripts/validate-v13-fail-closed.mjs`, `scripts/validate-v13-capability-matrix.mjs`, `scripts/validate-v13-capability-consumer-closure.mjs`.
- Path mechanics: Bamboocut trust/attunement/factor/mechanics validators and Silkbind Jade evidence/scenario/isolation validators.
- Gear semantics: `scripts/validate-usertest-ocr-set-audit.mjs`, row-semantics and OCR regressions.
- Harness repairs: tier self-check now asserts the accepted Global 2.1 label/source; Draught validator now asserts the actual authorized Jade Best Build identity.
