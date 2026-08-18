# Global Arena Model

Status: **implementation baseline for WWM Calc Arena**  
Region: **Global**  
Reviewed: **2026-08-18**  
Current applicable ruleset: **Version 2.0 rolling patch notes through the August 7, 2026 update**

This document is the human-readable companion to `src/arena/arena-evidence.json`. It separates current Arena mechanics from PvE and Guild War mechanics and records uncertainty instead of filling gaps with fabricated frame data, coefficients, or win rates.

## Evidence policy

The product uses this priority order:

1. current Global client evidence
2. current official Global patch notes
3. committed current fixtures
4. multiple current community sources
5. older Global/CN material only as explicit historical reference

Evidence labels are:

- `CONFIRMED_CLIENT`
- `CONFIRMED_OFFICIAL`
- `COMMUNITY_CORROBORATED`
- `COMMUNITY_CONFLICTING`
- `MODELED`
- `UNKNOWN`

Community tier lists, guide opinions and player matchup claims are never promoted to official facts. The Arena product does not publish a universal PvP Score or an uncalibrated win probability.

## Official source timeline

### April 30 — Arena & Guild War Optimization

Source: https://www.wherewindsmeetgame.com/m/news/official/PVP427.html

Current product use:

- Arena Battlegroup metadata.
- Battlegroup is queue/history/sharing context only, never a damage modifier.
- Known battlegroups represented by the app: Yougu, Linhe, Yunya, Canglang and Jiangzhu.

### May 22 — Cross-Server Matchmaking

Source: https://www.wherewindsmeetgame.com/news/official/522update.html

Current product use:

- Cross-server matchmaking can expand to servers inside the same Arena Battlegroup after the relevant timeout/toggle behavior.
- This is queue context, not combat math.

### May 27/28 — 3v3 rules

Source: https://www.wherewindsmeetgame.com/news/official/527update.html

Current product use:

- In a 3v3 team, the same Martial Art can be represented by at most two players.
- In no-healer matches, the team has one revive opportunity; a fallen teammate can be revived within 10m during the 15s fallen window.
- Healer compositions use the current Resurrection restrictions instead of receiving the no-healer rule as a second independent revive system.
- The calculator treats revive as availability/team utility, not HP DPS equivalence.

### Version 1.7 — Path Balance / Arena Rework

Source: https://www.wherewindsmeetgame.com/news/official/Adjustment528.html

Current product use:

- Endurance-consumption-reduction cap is 40%.
- Continuous Sprint consumes more Endurance after continuously Sprinting for over one second.
- The Defense Endurance-recovery penalty was reduced, but the official note does not publish a coefficient; the exact coefficient remains `UNKNOWN`.
- Bow charging begins consuming Endurance after the specified threshold; if Endurance reaches zero, charge stage stops increasing.
- Getting up after Execute briefly grants Tenacity, Control Immunity and Super Armor. The exact duration is not invented.
- A target knocked down by Execute does not receive Qi Damage during the specified knockdown state.
- Escape timing from hit states was normalized across differing network latency conditions.
- Projectile hit detection and high-speed collision behavior were adjusted. These are represented as reliability/state notes, not fake damage multipliers.
- Guarding Qi Core restores HP and Qi and grants 0.5s Invincibility. Its control-removal behavior is contextual: triggering outside the qualifying hit/control state does not grant a fabricated universal cleanse.
- Passive Break Control progress exists as a state/resource. The app does not invent its fill rate when no verified value is available.
- Defense Counter and Arena Attunement effects are modeled as trigger/state/resource effects.

### Version 2.0 — rolling notes through August 7

Source: https://www.wherewindsmeetgame.com/news/official/723update.html

Current product use:

- Reverse hit validation can negate damage server-side when the defender was in Dodge invulnerability at strike time. This is a hit-validity rule, not direct damage scaling.
- Entering Sprint without dodging first introduces a slight delay before Dash Skills are available.
- Melee Dash speed was normalized upward to reduce disparity.
- Continuous Deflection against rapid multi-hit attacks was improved.
- Current stagger/knockback/Tenacity changes are represented per mechanic rather than collapsed into DPS.
- Chestpiece Arena Attuning now covers both Hit Stagger and control effects where applicable.
- Current Path-specific Arena fixes, including Bamboocut-Dust Scarlet Spin Arena Attunement trigger behavior, supersede older trigger descriptions.

A search of current official Global news on 2026-08-18 did not surface a newer applicable Arena mechanics revision after the August 7 Version 2.0 rolling notes. If later official evidence is found, it must supersede this matrix explicitly instead of silently changing historical entries.

## Arena Attunement

Arena Attunement is a first-class profile and is not automatically stacked with Normal Attunement.

| Slot | Current represented effect | Evidence |
| --- | --- | --- |
| Chestpiece | Martial-Art-sourced damage reduction while in Hit Stagger / controlled state under the current rule | `CONFIRMED_OFFICIAL` |
| Bracer | Gold consecutive-Deflect Qi Damage progression 25/30/35/40% | `CONFIRMED_OFFICIAL` |
| Weapon | After Execution: 20 Vitality; 8s healing-trigger Vitality behavior; Gold Mystic Skill damage interaction | `CONFIRMED_OFFICIAL` |
| Weapon | Defense Counter creates a bounded 6s Qi-pressure trigger window, up to the current trigger cap | `CONFIRMED_OFFICIAL` |
| Disc | Bellstrike-Splendor Qiankun's Lock Break-Control cooldown interaction | `CONFIRMED_OFFICIAL` |
| Disc | Stonesplit-Might Predator's Shield interaction and current Version 2.0 chaining behavior | `CONFIRMED_OFFICIAL` |
| Pendant | Bamboocut-Wind Vulnerability stack behavior under the current rule | `CONFIRMED_OFFICIAL` |
| Everspring-specific | Scarlet Spin trigger requires successful Hit Stagger/control semantics under the current revision | `CONFIRMED_OFFICIAL` |

Every effect in code carries a patch applicability field, trigger, category and provenance. Old values are not treated as current merely because they appeared in a historical guide.

## Arena mode differences

### 1v1

Primary product modeling mode. The state model covers:

- opening / neutral
- pressure
- control chain
- Qi break
- Execute
- get-up protection
- recovery / reset

It does **not** reuse a PvE rotation as an Arena rotation.

### 3v3

Team-event abstraction rather than six-player frame simulation. The product evaluates:

- burst coordination
- focus target
- peel
- sustain
- control coverage
- anti-heal utility
- revive utility
- same-Martial-Art legality

### 5v5 / Group Strategy

Lighter Arena context. It focuses on:

- team role
- AoE control
- focus pressure
- peel
- mobility
- support

It intentionally does not recreate the Guild War workspace.

## Combat state and resources

Explicit state vocabulary includes `NEUTRAL`, `ATTACKING`, `DEFENDING`, `DEFLECT`, `PERFECT_DODGE`, `DODGE_IFRAME`, `SPRINT`, `DASH`, `HIT_STAGGER`, `CONTROLLED`, `IMMOBILIZED`, `AIRBORNE`, `KNOCKDOWN`, `TENACITY`, `SUPER_ARMOR`, `CONTROL_IMMUNITY`, `INVINCIBLE`, `QI_IMBALANCE`, `EXHAUSTED`, `EXECUTED`, `GET_UP_PROTECTION` and `BREAK_CONTROL_READY`.

Tracked resources include HP, Qi, Endurance, Vitality, path resources, skill cooldowns and Break Control progress where data exists.

The simulator separates:

- HP Damage
- Qi Damage
- control value
- resource pressure

A skill can therefore be useful without maximizing HP damage.

## Network / reaction policy

Latency is optional scenario metadata: Low, Moderate or High. It can flag mechanics whose reliability is network-sensitive, but it is not converted into direct damage.

Reaction presets are scenario assumptions only:

- Conservative
- Average
- Perfect-response laboratory

They are not player ratings and do not claim verified animation-frame precision.

## Bamboocut-Dust Arena profile

Weapons: **Everspring Umbrella + Unfettered Rope Dart**.

Current evidence supports a mechanic profile of **CONTROL / PRESSURE**. The app does not label this Path “meta,” and it does not import the Guild War anti-heal role as Arena truth.

Current Arena-relevant mechanics:

- **Scarlet Spin:** Version 2.0 slightly increased non-Perfect-Catch stagger; current Arena Attunement trigger behavior uses successful Hit Stagger/control semantics. The associated trigger bug was fixed in the Version 2.0 notes.
- **Burn and Bury:** currently unblockable and accompanied by the documented golden-flash warning. “Unblockable” is represented as a defensive-answer rule, not a damage multiplier.
- **Piercing Dart:** Tenacity starts only after **0.5s** in Charging Stance under the current Version 2.0 rule. This creates a modeled early charge punish window without inventing a human reaction frame count.
- **Phantom Rally / Resonance:** the current historical fix prevents Resonance from interrupting some Tenacity effects; this informs control reliability.
- **Soul Loss / Soulbreak / Soul Return:** represented as path pressure/resource mechanics where current official values are available.
- **Perfect Catch / Phantom interactions:** represented as control/timing behavior where current evidence supports it.

Explicit PvE isolation:

- PvE-only non-player damage effects are not applied to Arena opponents.
- Existing PvE result `1106 > 1129` by modeled Expected PvE DPS is **not** an Arena winner claim.
- An Arena comparison of 1106/1129 must use Arena dimensions, Arena Attunement, survivability, resource economy and matchup context. If those inputs do not create a material margin, the product returns `CLOSE CALL` / `EXPERIMENTAL` rather than importing the PvE result.

## Matchup archetypes

The modeled archetype vocabulary is:

- `BURST_DIVE`
- `SUSTAIN_DOT`
- `RANGED_KITE`
- `TANK_CONTROL`
- `ASSASSIN`
- `HEALER_SUPPORT`
- `BRUISER`
- `ANTI_CONTROL`

Actual Paths can map to more than one archetype. These mappings are hypotheses used to organize tools, not tier letters.

## Community hypotheses

Current Global community material was reviewed only for qualitative hypotheses such as:

- Bamboocut-Wind frequently being discussed as high-mobility burst/pursuit.
- Stonesplit-Might being discussed as durable control/frontline.
- Silkbind-Jade being discussed as ranged/control-oriented.
- 3v3 teams valuing focus coordination, peel and role coverage rather than three independent 1v1 ratings.

These are represented as `MODELED` or `COMMUNITY_CORROBORATED` only when corroborated sufficiently. Exact formulas, animation frames, “T0/S tier,” rank claims and universal “best build” assertions from community sources are rejected as application truth.

## Rejected or superseded claims

The following must not be used as current Arena truth:

- Guarding Qi Core's older removed damage-reduction behavior.
- Burn and Bury being blockable under the pre-Version-2.0 behavior.
- Piercing Dart receiving Tenacity immediately upon entering Charging Stance.
- Chestpiece Arena Attunement applying only to Hit Stagger when the current revision also covers control effects.
- Scarlet Spin Arena Attunement triggering merely from a generic hit under the older description.
- PvE DPS rankings deciding Arena winners.
- Guild War role scores deciding Arena rankings.
- Community tier letters as product truth.

## Arena Library / sharing policy

Arena references are mechanic/reference presets unless exact current gear is independently sourced. The product must not invent equipment to make a preset look complete.

Each Arena reference carries:

- Path
- weapons
- mode
- role/archetype
- patch
- source
- evidence maturity
- last reviewed date

Arena share payloads are untrusted. Validation covers schema, mode, Path, weapon identity, Arena Attunement IDs, numeric/array bounds, notes length, URLs where applicable, payload size and prototype keys. Shared pages are read-only first; cloning creates a new Arena profile and does not overwrite the active profile.

## Match History / empirical calibration

Local history fields are designed for future calibration, but formulas do not self-modify from match records.

Descriptive output is allowed with sample disclosure, for example:

`VS Bamboocut-Wind — 3–2, n=5`

The product must not transform that into “60% true win probability.” Causality is not inferred from tiny samples.

## Remaining UNKNOWNs

The current product deliberately leaves these uncertain rather than fabricating values:

- true matchup win probabilities
- population-calibrated player-skill adjustments
- exact human reaction frames
- unpublished Defense Endurance-recovery coefficient
- exact duration behind some official wording such as “brief” get-up protection
- complete current frame/startup data for every Martial Art
- exact reliability changes by latency band
- exact item-level equipment for Arena references where current authoritative sources do not provide it

These unknowns are eligible for future empirical calibration hooks, but they do not block the current decision-support product.
