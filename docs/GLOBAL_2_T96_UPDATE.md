# Global 2.0 / Tier 96 Update

Updated: 2026-08-04

## Source of truth

Primary source: official Where Winds Meet Version 2.0 optimization and fixes notes published July 23–24, 2026.

Official notes confirm:

- Tier 96 gear is live on Global.
- Food attribute boosts are added to character-progression base attributes before percentage-based buffs scale Effective Attributes.
- DoT Qi damage was standardized; Strategic Sword Bleeding/High Bleeding gained baseline Qi damage, while several other DoTs had Qi damage reduced.
- Exhaustion universal vulnerability and Qi Imbalance bonus vulnerability moved into the boss Mechanism-Based DMG Boost multiplier zone.
- Seasonal Edge, Wolfchaser's Art, Sword Horizon, Blossom Barrage, Exquisite Scenery, Frost-Clad Night, Steadfast Devotion, Echoes of Oblivion, and Phantom Rally received documented changes.
- Multiple path talents and skills changed, including Nameless Sword, Bellstrike-Umbra, Silkbind-Jade, Stonesplit-Might, Stonesplit-Strength, Bamboocut-Wind, and Bamboocut-Dust.

## Implemented in this branch

- T96 (`95上`) becomes the default current Global tier.
- T91 remains available as a legacy comparison and is explicitly marked preview/legacy.
- Product title and metadata identify Global 2.0 / T96.
- Official Inner Way descriptions and notes are updated without inventing unpublished coefficients.
- The old T91 graduation table is retained only as a legacy normalized estimate; the UI/code no longer calls it authoritative for T96.
- Build and development commands run an idempotent migration before Vite.
- CI validates TypeScript, production build, and migration idempotence.

## Known data gap

The official patch notes do not publish a complete numeric T96 table for every gear slot, attunement range, breakthrough level, class graduation panel, or real 60-second rotation benchmark. Therefore:

- No fabricated T96 graduation DPS values are introduced.
- The existing T96 dataset in the repository is activated, but legacy/CN-derived graduation references remain labeled as estimates.
- A verified user-side T96 character panel, representative T96 gear screenshots, and boss dummy parse are still required to calibrate default profiles and authoritative graduation targets.

## Required validation evidence

For each supported build, ideally collect:

1. Naked/base Combat Attributes at the current character cap.
2. Full equipped T96 Combat Attributes with no temporary food or party buffs.
3. Screenshots of representative T96 weapon and armor attunement ranges.
4. Inner Way realm/tier screenshots for changed effects.
5. 60-second Boss Dummy parse with skill breakdown and active buffs.

These measurements should be stored separately from the official patch-note mechanics so future patches remain auditable.
