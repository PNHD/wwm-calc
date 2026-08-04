# Global 2.0 / Tier 96 Update

Updated: 2026-08-04

## Source of truth

Primary public source: official Where Winds Meet Version 2.0 optimization and fixes notes published July 23–24, 2026.

Primary numeric calibration source: user-provided Global in-game screenshots captured on 2026-08-04. The structured transcription is stored in `src/data/globalT96Observed.ts`.

## Critical tier correction

The screenshots prove that current Global Tier 96 does **not** use the old `95上` preview constants.

Current Global T96 matches the repository's `100上` / Lv100 Upper sheet:

- Judgment Resistance: **65.0%**
- Panel Affinity: **17.8%** with no visible Affinity gear rolls
- Attribute Attack Penetration: **22.0**
- Attribute Attack DMG Bonus: **11.0%**
- Effective-rate checks:
  - `132.5 / 1.65 = 80.3%`, capped to the displayed **80.0% Critical Rate**
  - `17.8 / 1.65 = 10.8% Affinity Rate`
  - `65 + (122.1 - 65) / 1.65 = 99.6% Precision Rate`

Therefore:

- `405|0.65b` / `100上` is the current Global T96 default.
- `350|0.45-t96` / `95上` is retained only as a legacy reference and must not be presented as current Global T96.
- Approximate current panel thresholds are 132% Crit for the 80% cap, 66% Affinity for the 40% cap, and 122.8% Precision for the 100% cap.

## Observed Bamboocut-Dust panel

Full equipped panel from the supplied screenshots:

- Martial Mastery: 34,710
- Five Attributes: Constitution 153, Power 417, Defense 153, Agility 198, Momentum 153
- Physical Attack: 1,614–2,777
- Attribute Attack: 327–835
- Precision: 122.1% → 99.6% effective
- Critical: 132.5% → 80.0% effective
- Affinity: 17.8% → 10.8% effective
- Direct Critical: 4.6%
- Critical DMG Bonus: 54.0%
- Physical Penetration: 43.5
- Physical DMG Bonus: 2.8%
- Attribute Penetration: 22.0
- Attribute DMG Bonus: 11.0%
- All Martial Art Skill DMG Boost: 5.6%
- Specified Weapon Martial Art Boost: 5.8%
- Combat Boost Against Boss Units: 5.3%

Cross-checks from the visible gear rolls:

- Physical Pen gear: `8.9 + 10.0 + 9.9 + 9.6 = 38.4`; panel difference is **5.1**, likely a static Inner Way contribution pending tooltip verification.
- All Martial Arts: `3.0 + 2.6 = 5.6%` exactly.
- Boss Boost: `2.3 + 3.0 = 5.3%` exactly.
- Visible Power rolls total `264.3`; plus base 153 gives approximately the displayed 417.
- Visible Agility roll 44.8 plus base 153 gives approximately the displayed 198.
- Four visible Everspring Umbrella attunements total **20.0%**.

## Representative T96 gear captured

- Vanguard Nightstar, Rope Dart, 65–151 base Physical Attack
- Vanguard Cloudshade, Umbrella, 59–136 base Physical Attack
- Vanguard Charm, Disc, 86 Min Physical Attack
- Mirage Ward, Pendant, 129 Max Physical Attack
- Nightfarer Helm
- Nightfarer Armor
- Mistridge Greaves
- Nightfarer Bracers
- Dragonshadow Bow + Dragonshadow Ring: Fletchlodge 2/2, Precision +4.0%
- Weapon/accessory set name shown in Global: **Starweave**. The calculator's older `stars` key is retained internally until the expanded current tooltip confirms whether only the localized name changed or the set effect also changed.

## Official Global 2.0 mechanics already covered

- Food attribute boosts are added to progression base attributes before percentage scaling.
- DoT Qi damage was standardized.
- Exhaustion and Qi Imbalance vulnerability moved into the boss Mechanism-Based DMG Boost multiplier zone.
- Seasonal Edge, Wolfchaser's Art, Sword Horizon, Blossom Barrage, Exquisite Scenery, Frost-Clad Night, Steadfast Devotion, Echoes of Oblivion, and Phantom Rally received documented changes.
- Multiple path talents and skills changed, including Nameless Sword, Bellstrike-Umbra, Silkbind-Jade, Stonesplit-Might, Stonesplit-Strength, Bamboocut-Wind, and Bamboocut-Dust.

## Implemented in this branch

- `100上` becomes the current Global T96 default.
- `95上` is explicitly marked as a non-current legacy reference.
- Product metadata identifies Global 2.0 / T96.
- Current Crit/Affinity/Precision threshold guidance uses the verified 65% resistance model.
- Legacy T91 presets and graduation tables are labeled as legacy rather than silently renamed to T96.
- The observed panel and gear are stored as an auditable fixture.
- Build and development commands run both idempotent migrations before Vite.
- CI validates TypeScript, production build, and migration idempotence.

## Remaining data gap

Still required before the PR is ready to merge:

1. Explicit confirmation whether the captured panel had food, party, medicine, guild, or other temporary buffs active. Until confirmed, the screenshot is evidence for tier constants and item rolls, but is not promoted to the factory default panel.
2. Screenshots of the equipped Inner Ways at their exact Realm/Tier, so static attributes can be separated from the gear/base panel without double-counting.
3. Expanded Starweave and armor-set tooltips to replace legacy T91 2pc/4pc values.
4. A 60-second Boss Dummy parse with skill breakdown and active conditions.
5. Additional T96 builds before replacing every legacy class graduation target.

No unpublished T96 graduation DPS or encounter resistance value should be presented as authoritative until those measurements are available.
