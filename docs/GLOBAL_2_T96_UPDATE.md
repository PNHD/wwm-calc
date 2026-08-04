# Global 2.0 / Tier 96 calibration

Updated: 2026-08-04

## Current Global model

Current Global Tier 96 uses the workbook `各等级模板` column `100上`, confirmed by the user-provided in-game panel:

- Judgment Resistance: 65%
- base Affinity panel: 17.8%
- Attribute Penetration: 22
- Attribute Attack DMG Bonus: 11%
- food Physical Attack: +120 / +240 before percentage scaling
- reference Physical / Attribute Resistance: 26 / 28

The old `95上` mapping remains available only as a legacy reference and must not be presented as current Global T96.

## Verified Global T96 roll caps

Source: workbook `各等级模板`, `100上` roll table, cross-checked against the user's T96 gear screenshots.

| Stat | T96 max roll |
| --- | ---: |
| Strength / Agility / Power | 49.4 |
| Min / Max Physical Attack | 77.8 |
| Precision Rate | 8.0% |
| Critical Rate | 9.0% |
| Affinity Rate | 4.4% |
| Min / Max path Attribute Attack | 44.2 |
| All Martial Arts Boost | 3.2% |
| Weapon Martial Art Boost | 6.2% |
| Physical Penetration | 11.0 |
| Attribute / Formless Penetration | 13.0 |
| Specified / attuned skill bonus | 6.0% |
| Boss DMG Boost | 3.2% |
| Mystic Skill DMG Boost | 9.8% |

These values replace the old T91 `95下` roll units in stat priority, Cultivate, transmute simulation, and gear-quality scoring.

## Explainable gear score

The Arsenal T96 score is deliberately separate from class graduation:

- 50% verified roll quality against `100上` caps
- 35% fit for the selected build
- 15% normalized modeled contribution from the existing damage engine

The inspector shows roll quality, build fit, useful/recognized lines, excluded lines, and warnings for off-element or unverified stats. Legacy T91 graduation panels remain labeled references until current Global class targets are verified.

## Observed Bamboocut-Dust preset

`Observed T96 — Bamboocut Dust` is available from the product header. It contains the user-provided panel and eight current gear pieces.

- no food, medicine, party, guild, or temporary buff
- not a maximum or graduation build
- static Inner Way attributes are included in the raw panel
- leave the four Inner Way slots empty until their exact tooltips are imported
- Starweave is mapped provisionally to the internal `stars` key
- unverified armor set effects are disabled in the preset

Observed panel checks:

- Physical Pen gear: `8.9 + 10.0 + 9.9 + 9.6 = 38.4`; panel difference is 5.1, provisionally attributed to a static Inner Way line.
- All Martial Arts: `3.0 + 2.6 = 5.6%`.
- Boss Boost: `2.3 + 3.0 = 5.3%`.
- Power rolls total 264.3; plus base 153 is approximately the displayed 417.
- Agility 44.8 plus base 153 is approximately the displayed 198.
- Four armor attunement lines total 20.0% and are kept separate from the 5.8% ordinary Umbrella Martial Art line.

## Official Global 2.0 mechanics already incorporated

- food Attack/Vitality coexistence and ordering
- DoT Qi-damage standardization
- Exhaustion/Qi-Imbalance vulnerability bucket note
- Seasonal Edge T4/T6 update
- Wolfchaser's Art T6 update
- Sword Horizon T3 DoT extension
- Blossom Barrage T4/T5 update
- Exquisite Scenery cadence/stack update
- Frost-Clad Night T6 update
- Steadfast Devotion T3/T6 update
- Echoes of Oblivion defense-ignore update
- Phantom Rally T1 interaction

## Validation

The branch currently passes:

- `npm ci`
- TypeScript (`npm run lint`)
- production build
- deterministic migration output check

## Remaining calibration inputs

These improve the combat model but do not block the verified T96 gear update:

1. Four equipped Inner Way screenshots with tier/realm and full tooltip.
2. Expanded Starweave 2-piece and 4-piece tooltip.
3. A representative 60-second boss-dummy parse without food or temporary buffs, including skill breakdown.
4. Additional T96 builds before legacy class graduation targets can be replaced.

Until these are supplied, T96 class graduation DPS and some set/Inner-Way uptime effects remain explicitly estimated rather than authoritative.
