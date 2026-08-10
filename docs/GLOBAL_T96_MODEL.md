# Global T96 Bamboocut-Dust model

Updated: 2026-08-10

This document defines the evidence contract for the active Global T96 Bamboocut-Dust product model. Current English Global client evidence takes precedence over older community/CN/T91 data.

## Evidence levels

- **CONFIRMED CLIENT** — supplied current English Global screenshots/video or deterministic panel observations.
- **CONFIRMED OFFICIAL** — current Global official patch/balance notes.
- **COMMUNITY MEASURED** — reproducible community measurements used as priors or modeling references.
- **MODELED ASSUMPTION** — explicit scenario choice or interpolation that is not asserted as a game fact.
- **UNKNOWN** — insufficient evidence; not silently credited to optimizer DPS.

## Character panel contract

The product separates:

1. **MENU PANEL** — character residual/base + equipped gear direct stats + primary-attribute conversions + static Inner Way Attribute Buffs + static set bonuses.
2. **COMBAT PANEL** — the menu panel plus time-varying scenario effects.

Conditional maximum stacks are never baked into the menu panel.

### 1106 observed snapshot — CONFIRMED CLIENT

Without food:

| Field | Observed |
|---|---:|
| Min Physical Attack | 1614 |
| Max Physical Attack | 2777 |
| Min Attribute Attack | 327 |
| Max Attribute Attack | 835 |
| Precision | 122.1 |
| Effective Precision | 99.6 |
| Critical | 132.5 |
| Effective Critical | 80.0 |
| Affinity | 17.8 |
| Effective Affinity | 10.8 |
| Direct Critical | 4.6 |
| Final Critical & Affinity | 95.1 |
| Physical Penetration | 43.5 |
| Physical DMG Bonus | 2.8 |
| Critical DMG Bonus | 54.0 |
| All Martial Arts | 5.6 |
| Everspring Umbrella Martial Art Skill DMG Boost | 5.8 |
| Boss DMG | 5.3 |

With Global T96 attack food the Physical Attack range is exactly 1734–3017 (+120/+240).

### 1129 observed snapshot — CONFIRMED CLIENT

Without food:

| Field | Observed |
|---|---:|
| Min Physical Attack | 1719 |
| Max Physical Attack | 2784 |
| Min Attribute Attack | 363 |
| Max Attribute Attack | 800 |
| Precision | 115.5 |
| Effective Precision | 95.6 |
| Critical | 131.1 |
| Effective Critical | 79.5 |
| Affinity | 17.8 |
| Effective Affinity | 10.8 |
| Direct Critical | 4.6 |
| Final Critical & Affinity | 91.2 |
| Physical Penetration | 43.5 |
| Physical DMG Bonus | 2.8 |
| Critical DMG Bonus | 54.0 |
| All Martial Arts | 5.6 |
| Everspring Umbrella Martial Art Skill DMG Boost | 5.8 |
| Boss DMG | 5.3 |

With food the Physical Attack range is 1839–3024.

### Critical / Affinity resolution — CONFIRMED CLIENT

Base Critical is reduced by Judgment Resistance and capped at 80%. Direct Critical is added after that base cap. Precision then gates the Critical contribution, while effective Affinity remains a separate outcome contribution.

For 1106:

`10.8 + 99.6% × (80.0 + 4.6) = ~95.1%`

For 1129:

`10.8 + 95.6% × (79.5 + 4.6) = ~91.2%`

The in-game Damage Composition 80/9/10/0 fixture is **damage share**, not raw outcome frequency, and is never used to fit hit probabilities.

## Attribute conversion calibration

### COMMUNITY MEASURED prior

The previous project model used:

- Power → Min Physical Attack: 0.225 / point
- Power → Max Physical Attack: 1.36 / point
- Agility → Min Physical Attack: 0.9 / point
- Agility → Critical: 0.076 / point
- Momentum → Max Physical Attack: 0.9 / point
- Momentum → Affinity: 0.038 / point

These are retained as provenance but do not reproduce the supplied current Global Lv96 1106→1129 chest swap.

### MODELED ASSUMPTION / client-calibrated Lv96 conversion

The active model keeps Power→Min from the community prior because this one swap cannot independently identify both Power→Min and Agility→Min. The identifiable coefficients are solved from the supplied direct gear rows and observed panel delta:

- Power → Min Physical Attack: **0.225** / point (prior retained)
- Power → Max Physical Attack: **1.3459821428571428** / point
- Agility → Min Physical Attack: **1.156896551724138** / point
- Agility → Critical: **0.10560344827586207** / point
- Momentum coefficients remain the community priors until an independent current-client Momentum swap exists.

This is one coherent conversion model. It does not contain a different correction constant for every output field. Confidence on the newly solved coefficients is **single-swap client calibration**; an independent current-client primary-stat swap would improve confidence.

## Inner Ways

### Phantom Rally T6 — CONFIRMED CLIENT + CONFIRMED OFFICIAL

Static Attribute Buffs:

- Critical Rate +8.6%
- Physical DMG Bonus +2.8%

Combat:

- Resonance applies Phantom Chime for 5s.
- Each Phantom Chime stack reduces Physical Resistance by 2; max 5.
- T6 returning Scarlet Spin umbrellas trigger Resonance immediately.
- Current Global official balance notes classify Resonance as Scarlet Spin Martial Art Skill damage for Starweave and Everspring Umbrella Attunement effects.

The timeline therefore gains/refreshes Phantom Chime from **Resonance events**, rather than assuming permanent -10 Physical Resistance from t=0.

### Morale Chant T6 — CONFIRMED CLIENT

Static Attribute Buffs:

- Min Physical Attack +24.8
- Max Physical Attack +49.6
- Direct Critical +4.6%

Combat default boss scenario:

- Yi River proc chance 100%.
- Check once per 2s.
- Duration 12s.
- Max 5 stacks.
- Each normal stack: +2 Physical Penetration and +1% damage/healing.
- Controlled-target doubled behavior is disabled in the default boss scenario.

The timeline ramps instead of applying +10 Pen/+5% damage from t=0.

### Towline Sweep T6 — CONFIRMED CLIENT + CONFIRMED OFFICIAL

Static Attribute Buffs:

- Min Physical Attack +66.9
- Physical Penetration +5.1

Combat:

- Soulbreak / Soul Return duration 21s.
- Piercing Dart sweeping hits have staged bonuses.
- T6 settlement multiplier 10%.
- Burn and Bury +15% damage and guaranteed Critical.
- Burn and Bury/finger snap refreshes/recalculates the Soulbreak state as described by the current tooltip.

**UNKNOWN:** exact Critical/Affinity resolution of Soulbreak settlement. The source remains `special-resolution` instead of being forced through the ordinary roll model.

### Song of Tang T6 — CONFIRMED CLIENT

Static Attribute Buffs:

- Precision +6.9%
- Critical DMG Bonus +4.0%

Combat:

- Martial Art Skill damage grants Tang Melody.
- Duration 7s.
- Max 5 stacks.
- Max gain 2 stacks/s.
- Each stack gives +3% **Martial Art Skill** Critical Damage.
- Single-target default does not use the multi-target extra-stack trigger.

Tang Melody is skill-scoped. It is not a permanent global +15% Critical Damage bonus.

## Sets

### Starweave — CONFIRMED CLIENT

Player-facing Global name: **Starweave**. Legacy `Stars Align` is not used as the active display name.

2pc at Lv96:

- Min Physical Attack +78.

This static bonus is rebuilt from candidate set ownership; it is not hidden in calibration residual.

4pc:

- On boss/player or hitting at least two targets: gain stack.
- +3% Martial Art Skill Damage per stack.
- Max 5 stacks.
- Duration 5s.
- Max gain 2 stacks/s.
- Taking damage removes one stack.

Default Sword Trial fixture has Boss Attack OFF, so no hit-driven stack loss is applied.

The timeline models the stack-based +15% maximum component. The distance component is separate.

### Starweave distance — MODELED ASSUMPTION / explicit scenario

Default is `near` with **0% extra distance bonus credited**. The current repository fixture records tooltip distance thresholds, but optimizer ranking does not silently force a distance amount. A future scenario control can explicitly select a verified distance component.

### Calmwaters — CONFIRMED CLIENT

The supplied 4pc is defensive/healing utility. It receives no unconditional offensive DPS multiplier.

## Default combat scenario

The active sustained-boss model represents the supplied 60s fixture:

- Boss: true
- Single target: true
- Boss attacks player: false
- Duration: 60s
- Controlled target: false
- Attack food: on
- Cinder Ash: on
- Infinite Vitality: on
- Party buffs: off
- Starweave distance: near / zero extra distance credit

## Cinder Ash

### CONFIRMED CLIENT / COMMUNITY GUIDE consistency

Fire Oil: Cinder Ash has a +4% Qi Damage effect and produces its own observed `Divinecraft - Fire` source. The +4% Qi line is not applied as a blanket +4% multiplier to all ordinary Physical damage.

## Damage-source outcome matrix

| Source | Rule | Evidence level |
|---|---|---|
| Burn and Bury | guaranteed Critical | CONFIRMED CLIENT |
| Scarlet Spin | standard roll | CONFIRMED CLIENT parse / no forced outcome text |
| Resonance | standard roll | CONFIRMED OFFICIAL classification; no forced outcome exception |
| Soulbreak settlement | special-resolution | UNKNOWN exact outcome resolution |
| Divinecraft - Fire | special-resolution | UNKNOWN exact outcome resolution |
| Fire - Solid Foundation | special-resolution | UNKNOWN exact outcome resolution |
| Morale Chant extra attack | unverified | UNKNOWN exact outcome resolution |

## Rotation calibration fixture

CONFIRMED CLIENT, 60 seconds, Sword Trial Boss Lv96, Boss Attack OFF, Infinite Vitality ON, attack food ON, Cinder Ash ON:

- Total damage: 2,820,055
- Calculated DPS: 47,000.9
- Attempts: 266
- Scarlet Spin: 76 / 1,318,075 / 46.7%
- Resonance: 82 / 751,543 / 26.6%
- Soulbreak: 3 / 193,670 / 6.9%
- Dreamwrought Bubbles: 16 / 170,210 / 6.0%
- Flute Chanting a Thousand Waves: 10 / 150,029 / 5.3%
- Burn and Bury: 3 / 64,126 / 2.3%
- Soaring Spin: 2 / 55,524 / 2.0%
- Divinecraft - Fire: 58 / 48,640 / 1.7%
- Morale Chant: 5 / 33,418 / 1.2%
- Soul Sweep: 3 / 22,853 / 0.8%
- Fire - Solid Foundation: 6 / 7,622 / 0.3%
- Piercing Dart: 2 / 4,345 / 0.2%

The fixture validates event frequency and contribution shape. The product does not multiply each modeled source by a hidden factor merely to hit 47k exactly.

## 1106 vs 1129 parse sanity check

Single observed 60s samples:

- 1106: 45,825 DPS
- 1129: 47,224 DPS
- Observed direction: 1129 +1,399 DPS / ~+3.05%

These samples contain RNG and are not optimizer targets. The deterministic panel delta is stronger evidence. The optimizer may predict a different magnitude; if it predicts the opposite winner, that is a model investigation signal rather than a reason to force-flip the result.

## Optimizer contract

Gear Compare and Best Build use the same complete-build pipeline:

`candidate inventory → valid slot combination → static panel rebuild → set ownership rebuild → combat timeline → selected rotation → modeled DPS`

The winner is not selected by:

- roll cap proximity
- roll quality
- Mastery
- Graduation Rate
- recorded parse projection

Best Build keeps exact enumeration for smaller inventories and bounded beam search for larger inventories. Every inventory item participates in its slot expansion before pruning.

## Community guide usage

The supplied WSR community guide (last updated 2026-08-03 when retrieved) is used for rotation/modeling concepts and community measurement provenance. Bellstrike-Splendor distributions such as 0P0C / 2P1C are **not** imported into the Bamboocut-Dust optimizer.

## Official Global cross-check

The official Version 1.7 Path Balance Adjustment announcement (May 28, 2026) supports the current model's use of:

- Resonance being treated as Scarlet Spin Martial Art Skill damage for Starweave / Everspring Attunement.
- Towline Sweep Soulbreak/Soul Return 21s.
- Towline Sweep Tier 2/Tier 5 changing to Min Physical Attack and Physical Penetration.

Where older public guides disagree with current supplied Global client tooltips, current client evidence wins.

## Remaining explicit uncertainties

1. Soulbreak settlement Critical/Affinity resolution.
2. Divinecraft/Fire Solid Foundation Critical/Affinity resolution.
3. Morale Chant T6 extra-attack outcome resolution.
4. Independent current-client validation of the client-calibrated Power/Agility conversion coefficients.
5. Starweave distance component in practical movement/spacing scenarios; default ranking credits zero extra distance damage.
6. Exact real cast ordering beyond the supplied aggregate 60s attempt counts. The timeline distributes each source frequency across the window deterministically rather than pretending the grouped parse rows are chronological.
