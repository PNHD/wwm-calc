# Global 2.0 Inner Ways and Tier 96 Dummy Calibration

Updated: 2026-08-04

## Evidence order

1. English Global client screenshots supplied by the player on 2026-08-04.
2. Official Global Version 1.7 Path Balance Adjustment (May 28, 2026).
3. Official Global Version 2.0 patch notes, including the August 2, 2026 additions.
4. Game8/community tier tables only where they agree with the current Global client.

The client screenshot wins when an older guide conflicts with the current game.

## Equipped Inner Ways — current Global Tier 6

### Phantom Rally

Flat Attribute Buffs at Level 96:

- Critical Rate: **+8.6%**
- Physical DMG Bonus: **+2.8%**

Current mechanics:

- The first Scarlet Spin umbrella and every 3rd throw afterward summon a Phantom Umbrella.
- Perfect Catch and Phantom Umbrella summons trigger Resonance from all existing Phantom Umbrellas.
- Perfect Catch restores 10 Fading Crimson.
- Continuous Perfect Catches also grant Fragrant Song - Delicate, allowing the next Dreamwrought Bubbles to cast without charging, up to 4 stacks.
- Resonance applies Phantom Chime for 5 seconds: **-2 Physical Resistance per stack, up to 5 stacks**.
- Resonance deals **20% more damage**. Its pull is ineffective against bosses; the damage and resistance reduction are not described as boss-ineffective.
- At Tier 6, each returning Scarlet Spin umbrella summons a Phantom Umbrella and immediately triggers Resonance.
- Version 2.0 additionally allows Phantom Umbrellas created by Dreamwrought Bubbles to trigger Resonance.
- Official notes classify Resonance as Scarlet Spin damage so it can benefit from Starweave and Everspring Umbrella Martial Art Skill DMG Boost. The old double-buff bug with All Martial Arts / Art of Umbrella was fixed.

### Morale Chant

Flat Attribute Buffs at Level 96:

- Physical Attack: **+24.8 Min / +49.6 Max**
- Direct Critical Rate: **+4.6%**

Ramping combat effect:

- Yi River is checked once every 2 seconds.
- At the current tier it applies at 100% chance and lasts 12 seconds.
- Each stack grants **+2 Physical Penetration and +1% damage/healing**, up to 5 stacks.
- Against a controlled target, each trigger grants two stacks and the damage/healing bonus becomes 2% per stack.
- At max stacks, Tier 6 adds one extra attack/heal, or two against a controlled target, once every 10 seconds.

The +10 Pen / +5% damage max-stack effect is not a permanent menu-panel stat and must be modeled as combat uptime.

### Towline Sweep

Flat Attribute Buffs at Level 96:

- Min Physical Attack: **+66.9**
- Physical Penetration: **+5.1**

Current mechanics after the May 28 adjustment:

- Soul Sweep grants 50 Tokens of Gratitude.
- Every Piercing Dart sweeping hit applies 1 Soul Loss, plus 1 additional stack while Soulbound.
- Soulbreak and Soul Return last **21 seconds**.
- Piercing Dart sweeping hits gain +5% / +10% / +15% damage by hit group.
- When Soulbreak ends, it settles additional damage equal to 5% of damage dealt during the state, excluding non-class skills obtained within the mode.
- `Burn and Bury` deals **15% more damage and is guaranteed Critical**.
- The finger snap refreshes Soul Return, recalculates and refreshes Soulbreak within 15m, and increases the Soulbreak calculation multiplier to 10%.

The old Bamboocut Attack/Bamboocut Pen tier data is obsolete for this Inner Way. Those lines moved to Light Anew; Towline Sweep now grants Physical Attack/Physical Penetration.

### Song of Tang

Flat Attribute Buffs at Level 96:

- Precision: **+6.9%**
- Critical DMG Bonus: **+4.0%**

Ramping combat effect:

- Martial Art Skill damage grants Tang Melody for 7 seconds.
- Max 5 stacks, up to 2 stacks gained per second.
- Each stack grants Martial Art Skills **+3% Critical Damage and +3% HP Drain**.
- HP Drain is capped at 2.5% Max HP per second.
- Hitting at least 2 enemies simultaneously grants one extra stack, up to twice per second.
- Tier 6 removes the HP-condition restriction, so both effects remain active.

`Martial Art Skill` means the weapon Martial Art Skill/Q category, not every weapon, Special, Charged, Inner Way, Mystic, or DoT damage source.

## Critical outcome model

The calculator keeps these stages separate:

1. Effective base Critical Rate is reduced by Judgment Resistance and capped at 80%.
2. Direct Critical Rate is added after that base cap and can exceed 80%.
3. Precision gates eligible Critical outcomes.
4. Affinity competes for the final outcome probability.
5. Individual skills can override the normal outcome rules, for example guaranteed Critical or special settlement damage.

Therefore the in-game Damage Composition chart cannot be interpreted as hit frequency. It reports **share of total damage** by outcome, and each source can have different multipliers and eligibility.

## Tier 96 Sword Trial Boss parse

Test conditions:

- Target: Sword Trial Boss, Level 96
- Duration: 60 seconds
- Boss Attack: Off
- Infinite Vitality: On
- Attack Food: +120 to +240 Physical Attack
- Divinecraft: Fire Oil — Cinder Ash (+4% Qi damage)
- Test panel: Physical Attack 1,734–3,017; Attribute Attack 327–835

Result:

- Total Damage: **2,820,055** (UI: 2820K)
- DPS: **47,001** (UI: 47,000/s)
- Total attempts/hits listed: **266**
- Damage composition: **80% Critical / 9% Affinity / 10% Normal / 0% Abrasion**

| Source | Attempts | Total Damage | DPS | Contribution | Min | Average | Max |
|---|---:|---:|---:|---:|---:|---:|---:|
| Scarlet Spin | 76 | 1,318,075 | 21,967 | 46.7% | 6,036 | 17,343 | 29,849 |
| Resonance | 82 | 751,543 | 12,525 | 26.6% | 4,110 | 9,165 | 14,599 |
| Soulbreak | 3 | 193,670 | 3,227 | 6.9% | 2,156 | 64,556 | 97,266 |
| Dreamwrought Bubbles | 16 | 170,210 | 2,836 | 6.0% | 6,411 | 10,638 | 16,266 |
| Flute Chanting a Thousand Waves | 10 | 150,029 | 2,500 | 5.3% | 10,812 | 15,002 | 17,200 |
| Burn and Bury | 3 | 64,126 | 1,068 | 2.3% | 19,971 | 21,375 | 23,977 |
| Soaring Spin | 2 | 55,524 | 925 | 2.0% | 23,051 | 27,762 | 32,473 |
| Divinecraft - Fire | 58 | 48,640 | 810 | 1.7% | 708 | 838 | 1,004 |
| Morale Chant | 5 | 33,418 | 557 | 1.2% | 4,474 | 6,683 | 8,120 |
| Soul Sweep | 3 | 22,853 | 380 | 0.8% | 6,376 | 7,617 | 9,870 |
| Fire - Solid Foundation | 6 | 7,622 | 127 | 0.3% | 1,191 | 1,270 | 1,545 |
| Piercing Dart | 2 | 4,345 | 72 | 0.2% | 1,890 | 2,172 | 2,455 |

The row totals reproduce the parse exactly: 2,820,055 damage and 266 attempts.

## What is applied now

- Current Level 96 flat Attribute Buffs for the four equipped Inner Ways.
- Current Global descriptions and tier progression.
- Burn and Bury guaranteed-Critical outcome rule.
- Direct Critical remains above the base 80% cap, then passes through Precision/Affinity/skill eligibility.
- The full 60-second parse is stored as a machine-readable fixture in `src/data/globalV2CombatEvidence.ts`.

## What remains conservative

- Morale Chant stack uptime is not treated as a permanent +10 Pen/+5% damage panel bonus.
- Song of Tang's +15% max-stack Critical Damage applies only to Martial Art Skill/Q damage and is not globally added to all damage.
- Soulbreak, Divinecraft, Fire - Solid Foundation, and the Morale Chant extra hit keep explicit `special-resolution` or `unverified` outcome status until a client tooltip or controlled parse proves their Crit/Affinity rules.
- The 80/9/10/0 Damage Composition split is not used as a direct hit-rate target.
