import { InnerWayTier, InnerWay, InnerWayTrigger } from "../types";

export type { InnerWayTier, InnerWay, InnerWayTrigger };

export const INNER_WAYS: InnerWay[] = [
  // ── BAMBOOCUT-DUST (v1.4 new) ──
  {
    id:"phantom_rally", name:"Phantom Rally", cat:"BAMBOOCUT-DUST",
    desc:"Scarlet Spin's first umbrella throw summons a Phantom Umbrella. Every 3rd throw summons another Phantom. Perfect Catch or summoning a Phantom triggers Resonance on ALL Phantom Umbrellas, dealing AoE damage.",
    recommended:true, note:"Core Bamboocut-Dust AoE inner way. Synergizes with Perfect Catch mechanic.",
    tiers:[
      {tier:1,effect:"Phantom Umbrella Resonance DMG: 30% weapon ATK",stat:{generalDmg:2}},
      {tier:2,effect:"Phantom Resonance DMG: 50% weapon ATK",stat:{generalDmg:3}},
      {tier:3,effect:"Phantom Resonance DMG: 70% weapon ATK, range +10%",stat:{generalDmg:5}},
      {tier:4,effect:"Phantom Resonance DMG: 90% weapon ATK, range +15%",stat:{generalDmg:6}},
      {tier:5,effect:"Phantom Resonance DMG: 110% weapon ATK, range +20%",stat:{generalDmg:7}},
      {tier:6,effect:"Phantom Resonance DMG: 130% weapon ATK + Phys DMG Bonus +2.8% (T5 breakthrough)",stat:{generalDmg:8,outerDmg:2.8}},
    ]
  },
  {
    id:"song_of_tang", name:"Song of Tang", cat:"BAMBOOCUT-DUST",
    desc:"Hitting with Martial Art Skills applies Tang Song for 4s (max 5 stacks, 1/s). Above 50% HP: each stack grants +2% Critical Damage. Below 50% HP: each stack grants Life Drain capped at 2.5% Max HP/s.",
    recommended:true, note:"Strong sustained Crit DMG above 50% HP. Stacks via Martial Art Skills.",
    tiers:[
      {tier:1,effect:"Each stack: +0.8% Crit DMG above 50% HP (max 5 stacks = +4%)",stat:{critDmg:4}},
      {tier:2,effect:"Each stack: +1.2% Crit DMG (max +6%)",stat:{critDmg:6}},
      {tier:3,effect:"Each stack: +1.5% Crit DMG (max +7.5%)",stat:{critDmg:7.5}},
      {tier:4,effect:"Each stack: +1.8% Crit DMG (max +9%)",stat:{critDmg:9}},
      {tier:5,effect:"Each stack: +2.0% Crit DMG above 50% HP (max +10%), Life Drain below 50%",stat:{critDmg:10}},
      {tier:6,effect:"Each stack: +2.0% Crit DMG (max +10%) + Crit DMG Bonus +4.0% (T5 breakthrough)",stat:{critDmg:14}},
    ]
  },
  {
    id:"light_anew", name:"Light Anew", cat:"BAMBOOCUT-DUST",
    desc:"When hitting 3 or more enemies at once, apply Candle Flicker for 3s (max 5 stacks). Each stack: -4% enemy Movement Speed, +2% damage taken from caster. Triggers once per 0.5s, 1 stack per 0.5s per source.",
    recommended:true, note:"AoE debuff — each stack makes enemies take 2% more damage from you (max +10% at 5 stacks).",
    tiers:[
      {tier:1,effect:"Each stack: +0.8% damage taken by enemies (max 5 stacks = +4%)",stat:{generalDmg:4}},
      {tier:2,effect:"Each stack: +1.2% damage taken (max +6%)",stat:{generalDmg:6}},
      {tier:3,effect:"Each stack: +1.5% damage taken (max +7.5%)",stat:{generalDmg:7.5}},
      {tier:4,effect:"Each stack: +1.8% damage taken (max +9%)",stat:{generalDmg:9}},
      {tier:5,effect:"Each stack: +2% damage-taken (max +10%) + Bamboocut Penetration +6.0 (v1.7 breakthrough, swapped from Towline Sweep)",stat:{generalDmg:10,pzPen:6}},
      {tier:6,effect:"Each stack: +2% damage-taken (max +10%) + Bamboocut Pen +6.0; 5-stack Candlelight immobilizes 2s (non-boss)",stat:{generalDmg:10,pzPen:6}},
    ]
  },
  {
    id:"towline_sweep", name:"Towline Sweep", cat:"BAMBOOCUT-DUST",
    desc:"Gain 50 Tokens of Gratitude after casting Soul Sweep. In Soulbound state, each hit of Piercing Dart's sweeping combo applies 2 stacks of Soulbreak, and the first hit pulls enemies forward.",
    recommended:false, note:"Utility/setup inner way — no direct DPS stat. Helps maintain combo resources.",
    tiers:[
      {tier:1,effect:"Gain 10 Tokens of Gratitude after Soul Sweep",stat:{}},
      {tier:2,effect:"Gain 20 Tokens of Gratitude after Soul Sweep",stat:{}},
      {tier:3,effect:"Gain 30 Tokens, Piercing Dart sweeping combo applies 1 Soulbreak per hit",stat:{}},
      {tier:4,effect:"Gain 40 Tokens, Piercing Dart applies 2 Soulbreak per hit",stat:{}},
      {tier:5,effect:"Physical Penetration +5.1 (v1.7 breakthrough, swapped from Light Anew)",stat:{outerPen:5.1}},
      {tier:6,effect:"Phys Pen +5.1; Piercing Dart applies Soul Loss, Soulbreak/Soul Return last 21s",stat:{outerPen:5.1}},
    ]
  },

  // ── BAMBOOCUT-WIND ──
  {
    id:"echoes_of_oblivion", name:"Echoes of Oblivion", cat:"BAMBOOCUT-WIND",
    desc:"Infernal Twinblades normal Light Attacks apply Sin to enemies; Light Attacks under Flamelash apply Karma. When attacking targets with Sin and Karma using Light Attacks, ignore their 10% Physical Defense and 10% Bamboocut Resistance respectively.",
    recommended:false, note:"Bamboocut-Wind core (Infernal Twinblades). Not applicable to Bamboocut-Dust.",
    tiers:[
      {tier:1,effect:"Ignore 2% Phys Def (Sin) and 2% BC Res (Karma)",stat:{outerPen:2,pzPen:2}},
      {tier:2,effect:"Ignore 4% Phys Def and 4% BC Res",stat:{outerPen:4,pzPen:4}},
      {tier:3,effect:"Ignore 6% Phys Def and 6% BC Res",stat:{outerPen:6,pzPen:6}},
      {tier:4,effect:"Ignore 8% Phys Def and 8% BC Res",stat:{outerPen:8,pzPen:8}},
      {tier:5,effect:"Ignore 10% Phys Def and 10% BC Res",stat:{outerPen:10,pzPen:10}},
      {tier:6,effect:"Ignore 10% Phys Def & 10% BC Res + Crit DMG Bonus +4.4% (T5 breakthrough)",stat:{outerPen:10,pzPen:10,critDmg:4.4}},
    ]
  },
  {
    id:"riptide_reflex", name:"Riptide Reflex", cat:"BAMBOOCUT-WIND",
    desc:"Hitting an enemy with a Control Skill reduces the Cooldown of the current Martial Art Skill by 1s. Triggers once every 10s. Control Skills: Bladebound Thread, Coiled Dragon, Qiankun's Lock, Spring Sorrow, Moon Shatter Spring, Wayfarer's Drift, Peak's Springless Silence.",
    recommended:false, note:"Rotation CD reduction, no direct damage stat.",
    tiers:[
      {tier:1,effect:"MA Skill CD -0.4s on Control Skill hit (15s trigger CD)",stat:{}},
      {tier:2,effect:"MA Skill CD -0.6s (12s trigger CD)",stat:{}},
      {tier:3,effect:"MA Skill CD -0.8s (10s trigger CD)",stat:{}},
      {tier:4,effect:"MA Skill CD -1.0s (10s trigger CD)",stat:{}},
      {tier:5,effect:"MA Skill CD -1.0s (10s trigger CD), affects more Control Skill types",stat:{}},
      {tier:6,effect:"MA Skill CD -1.0s (10s CD). Exhausted: -0.5s + Bamboocut Pen +6 (T5 breakthrough)",stat:{pzPen:6}},
    ]
  },
  {
    id:"breaking_point", name:"Breaking Point", cat:"BAMBOOCUT-WIND",
    desc:"Dealing Critical Damage to an enemy under Spirit Depletion (Exhaustion) grants 1 stack of Collapse. Each stack: +5 Physical Penetration and +5% Critical Damage. Stacks up to 3 times, lasting 3 seconds.",
    recommended:true, note:"Best T91 inner way for Bamboocut-Dust. Activate on boss Exhausted/Spirit Depletion state for max stacks.",
    tiers:[
      {tier:1,effect:"Each Collapse stack: +2 Phys Pen, +2% Crit DMG (max 3 stacks = +6 Pen, +6% CDmg)",stat:{outerPen:6,critDmg:6}},
      {tier:2,effect:"Each stack: +3 Phys Pen, +3% Crit DMG (max +9 Pen, +9% CDmg)",stat:{outerPen:9,critDmg:9}},
      {tier:3,effect:"Each stack: +4 Phys Pen, +4% Crit DMG (max +12 Pen, +12% CDmg)",stat:{outerPen:12,critDmg:12}},
      {tier:4,effect:"Each stack: +4.5 Phys Pen, +4.5% Crit DMG (max +13.5 each)",stat:{outerPen:13.5,critDmg:13.5}},
      {tier:5,effect:"Each stack: +5 Phys Pen, +5% Crit DMG (max 3 stacks = +15 Pen, +15% CDmg)",stat:{outerPen:15,critDmg:15}},
      {tier:6,effect:"Each stack: +5 Phys Pen, +5% Crit DMG (max +15 each) + Direct Crit +4.1% (T5)",stat:{outerPen:15,critDmg:15,dcrit:4.1}},
    ]
  },
  {
    id:"vendetta", name:"Vendetta", cat:"BAMBOOCUT-WIND",
    desc:"Bladebound Thread's Vendetta Token lasts 5 seconds longer and restores 20 Tokens of Gratitude.",
    recommended:false, note:"Bladebound Thread (Guided Blade) specific. Not useful for Bamboocut-Dust.",
    tiers:[
      {tier:1,effect:"Vendetta Token +1s duration, +4 Tokens of Gratitude",stat:{}},
      {tier:2,effect:"Token +2s, +8 Gratitude",stat:{}},
      {tier:3,effect:"Token +3s, +12 Gratitude",stat:{}},
      {tier:4,effect:"Token +4s, +16 Gratitude",stat:{}},
      {tier:5,effect:"Physical Penetration +5.1 (breakthrough)",stat:{outerPen:5.1}},
      {tier:6,effect:"Phys Pen +5.1; rodents on Vendetta-Mark target +30% DMG, -50% target healing",stat:{outerPen:5.1}},
    ]
  },

  // ── BELLSTRIKE-SPLENDOR ──
  {
    id:"sword_morph", name:"Sword Morph", cat:"BELLSTRIKE-SPLENDOR",
    desc:"When Nameless Sword's Charged Skill (Vagrant Sword) is charged while Qi shield is present, it unleashes multiple additional sword energy attacks at 2nd stage. Each Endurance consumed increases sword energy damage by 1.5%, up to 30% (v1.7).",
    recommended:false, note:"Bellstrike-Splendor core. Requires Qi shield active.",
    tiers:[
      {tier:1,effect:"Extra sword energies enabled at T2 charge stage. Max +8% DMG",stat:{generalDmg:8}},
      {tier:2,effect:"Max +10% DMG from Endurance spending",stat:{generalDmg:10}},
      {tier:3,effect:"Max +12% DMG, extra energy hits harder",stat:{generalDmg:12}},
      {tier:4,effect:"Max +15% DMG",stat:{generalDmg:15}},
      {tier:5,effect:"Max +30% DMG from Endurance. Each Endurance = +1.5% up to 30% (v1.7)",stat:{generalDmg:30}},
      {tier:6,effect:"Max +30% DMG + Direct Affinity Rate +2.3% (T5 breakthrough)",stat:{generalDmg:30,daff:2.3}},
    ]
  },
  {
    id:"battle_anthem", name:"Battle Anthem", cat:"BELLSTRIKE-SPLENDOR",
    desc:"Increases Charged Skills' damage against all bosses by 10%.",
    recommended:false, note:"Pure boss DPS for charge-heavy Bellstrike rotations.",
    tiers:[
      {tier:1,effect:"Charged Skills +10% DMG vs all enemies (base: +10% vs bosses)",stat:{generalDmg:10}},
      {tier:2,effect:"Increases Affinity Rate based on Solo Mode Level",stat:{generalDmg:10}},
      {tier:3,effect:"Charged Crit/Affinity: drain 10 Endurance (player) / restore 10 (boss), 12s CD",stat:{generalDmg:10}},
      {tier:4,effect:"Charged Skills +15% DMG vs all enemies, +10% their Endurance cost",stat:{generalDmg:15}},
      {tier:5,effect:"Affinity DMG Bonus +5.2% (breakthrough)",stat:{generalDmg:15,affDmg:5.2}},
      {tier:6,effect:"Charged Skill: +2% DMG per 10 Endurance diff/consumed up to +10% (on top of +15%) + Affinity DMG +5.2%",stat:{generalDmg:15,affDmg:5.2}},
    ]
  },
  {
    id:"wildfire_spark", name:"Wildfire Spark", cat:"BELLSTRIKE-SPLENDOR",
    desc:"Refunds 3.5% of the Endurance consumed.",
    recommended:false, note:"Passive Endurance refund for sustaining charged rotations.",
    tiers:[
      {tier:1,effect:"Refund 1.0% of Endurance consumed",stat:{}},
      {tier:2,effect:"Refund 1.5% of Endurance consumed",stat:{}},
      {tier:3,effect:"Refund 2.0% of Endurance consumed",stat:{}},
      {tier:4,effect:"Refund 2.5% of Endurance consumed",stat:{}},
      {tier:5,effect:"Refund 3.0% of Endurance consumed",stat:{}},
      {tier:6,effect:"Refund 3.5% of Endurance consumed + Phys DMG Bonus +2.5% (T5 breakthrough)",stat:{outerDmg:2.5}},
    ]
  },
  {
    id:"mountains_might", name:"Mountain's Might", cat:"BELLSTRIKE-SPLENDOR",
    desc:"Nameless Spear Martial Art Skill Mountain Sweep grants Endless Gale: increases Endurance cost reduction to 20% for 5 seconds.",
    recommended:false, note:"Endurance cost reduction for spear-heavy rotations.",
    tiers:[
      {tier:1,effect:"Endless Gale: -5% Endurance cost for 3s",stat:{}},
      {tier:2,effect:"Endless Gale: -8% Endurance cost for 3.5s",stat:{}},
      {tier:3,effect:"Endless Gale: -11% Endurance cost for 4s",stat:{}},
      {tier:4,effect:"Endless Gale: -15% Endurance cost for 4.5s",stat:{}},
      {tier:5,effect:"Endless Gale: -18% Endurance cost for 5s",stat:{}},
      {tier:6,effect:"Endless Gale: -20% Endurance cost 5s + Bellstrike Pen +6 (T5 breakthrough)",stat:{pzPen:6}},
    ]
  },
  {
    id:"sandswirl_tail", name:"Sandswirl Tail", cat:"BELLSTRIKE-SPLENDOR",
    desc:"When transformed into a brocade carp via Moonleap Morph, sprinting and jumping consume less endurance.",
    recommended:false, note:"Mobility utility only — no combat DPS stat.",
    tiers:[
      {tier:1,effect:"Carp form sprint/jump cost -10%",stat:{}},
      {tier:2,effect:"Carp form sprint/jump cost -15%",stat:{}},
      {tier:3,effect:"Carp form sprint/jump cost -20%",stat:{}},
      {tier:4,effect:"Carp form sprint/jump cost -25%",stat:{}},
      {tier:5,effect:"Carp form sprint/jump cost -30%",stat:{}},
      {tier:6,effect:"Carp form sprint/jump cost -40% + jump height +15%",stat:{}},
    ]
  },

  // ── BELLSTRIKE-UMBRA ──
  {
    id:"sword_horizon", name:"Sword Horizon", cat:"BELLSTRIKE-UMBRA",
    desc:"After Strategic Sword's Martial Art / Special / Charged Skill, press skill at perfect timing to cast Crisscrossing Swords (follow-up). If target has 5 Bleed stacks, remove all and deal high Bleed damage once.",
    recommended:false, note:"Core Bellstrike-Umbra. Requires precise timing input.",
    tiers:[
      {tier:1,effect:"Crisscrossing Swords follow-up enabled. Timing window: strict. Bleed burst: 80% ATK",stat:{generalDmg:3}},
      {tier:2,effect:"Timing window slightly wider. Bleed burst: 120% ATK",stat:{generalDmg:4}},
      {tier:3,effect:"Bleed burst: 160% ATK",stat:{generalDmg:5}},
      {tier:4,effect:"Bleed burst: 200% ATK, AoE splash at 5-stack burst",stat:{generalDmg:6}},
      {tier:5,effect:"Follow-up DMG +20%. Bleed burst 200% ATK + AoE splash on 5-stack",stat:{generalDmg:7}},
      {tier:6,effect:"Follow-up +20%, Bleed burst AoE splash + Direct Affinity Rate +2.3% (T5)",stat:{generalDmg:8,daff:2.3}},
    ]
  },
  {
    id:"adaptive_steel", name:"Adaptive Steel", cat:"BELLSTRIKE-UMBRA",
    desc:"Gain a Weapon Mastery effect based on current Blade Weapon. Sword: 6s CD. Dual Blades: 10s CD. Heng Blade: 20s CD.",
    recommended:false, note:"Passive bonus based on blade weapon type equipped.",
    tiers:[
      {tier:1,effect:"Sword: +4% ATK 3s | Dual Blades: +3% ATK 3s | Heng: +6% ATK 5s",stat:{generalDmg:3}},
      {tier:2,effect:"Sword: +6% | Dual Blades: +5% | Heng: +8%",stat:{generalDmg:4}},
      {tier:3,effect:"Sword: +8% | Dual Blades: +7% | Heng: +10%",stat:{generalDmg:5}},
      {tier:4,effect:"Sword: +11% ATK 4s | Dual Blades: +9% | Heng: +14% 6s",stat:{generalDmg:6}},
      {tier:5,effect:"Sword: +13% ATK 5s | Dual Blades: +11% | Heng: +16% 7s",stat:{generalDmg:7}},
      {tier:6,effect:"Sword: +15% ATK | Dual: +13% | Heng: +18% + Bellstrike DMG Bonus +3% (T5)",stat:{generalDmg:8,pzDmg:3}},
    ]
  },
  {
    id:"insightful_strike", name:"Insightful Strike", cat:"BELLSTRIKE-UMBRA",
    desc:"Dealing Affinity DMG generates Focus. When Focus is full, enter Concentration: +1.5% Direct Affinity Rate, faster Focus, and +10% DoT/empowered-DoT (T6). Breakthrough grants Physical Penetration.",
    recommended:false, note:"Phys-Pen + Direct-Affinity breakthrough for DoT/bleed Bellstrike-Umbra. Verified vs official v1.7 (5.28) patch notes.",
    tiers:[
      {tier:1,effect:"Concentration: low HP heals from DMG; high HP grants +1.5% DMG Boost",stat:{}},
      {tier:2,effect:"Increases Physical Attack based on Solo Mode Level",stat:{}},
      {tier:3,effect:"Concentration: +1.5% Direct Affinity Rate (+1.5% more if your HP% > target)",stat:{daff:1.5}},
      {tier:4,effect:"Focus builds 50% faster",stat:{daff:1.5}},
      {tier:5,effect:"Physical Penetration +5.1 (v1.7 breakthrough)",stat:{daff:1.5,outerPen:5.1}},
      {tier:6,effect:"Concentration: DoT & empowered-DoT +10%; +1.5% Direct Affinity, Phys Pen +5.1",stat:{daff:1.5,outerPen:5.1}},
    ]
  },
  {
    id:"wolfchasers_art", name:"Wolfchaser's Art", cat:"BELLSTRIKE-UMBRA",
    desc:"For Nine-Bend Spirit-Stealing Spear's Sorrow Without Wine: Combo count required for buff reduced from 5/10 to 4/8. Each time Sorrow Without Wine hits target with your Bleed, 60/70/80/90/100% chance (based on Bleed stacks) to add 1 extra Combo count.",
    recommended:false, note:"Heavenquaker Spear specific. Greatly optimizes Bleed-stack rotations.",
    tiers:[
      {tier:1,effect:"Combo req: 4/8. 60% chance +1 combo on Bleed hit (any stack count)",stat:{}},
      {tier:2,effect:"Combo req: 4/8. 70% chance +1 combo on Bleed hit",stat:{}},
      {tier:3,effect:"Combo req: 4/8. 80% chance +1 combo on Bleed hit",stat:{}},
      {tier:4,effect:"Combo req: 4/8. 90% chance +1 combo on Bleed hit",stat:{}},
      {tier:5,effect:"Combo req: 4/8. 60-100% chance based on Bleed stack count",stat:{}},
      {tier:6,effect:"Combo req: 4/8. 60-100% chance by stacks + Bleed burst DMG +10%",stat:{}},
    ]
  },

  // ── GENERAL ──
  {
    id:"seasonal_edge", name:"Seasonal Edge", cat:"GENERAL",
    desc:"After casting a Dual-Weapon Skill, gain one of four effects: Crit Rate +10%, Phys Pen +10, Phys DMG +10%, or Min Phys ATK +200. Lasts 10s.",
    recommended:true, note:"Highly reliable for any dual-weapon build including Bamboocut-Dust.",
    tiers:[
      {tier:1,effect:"One random buff after Dual-Weapon Skill (weaker values): ~+1% avg DMG",stat:{generalDmg:1}},
      {tier:2,effect:"Buff values slightly higher: ~+2% avg DMG",stat:{generalDmg:2}},
      {tier:3,effect:"~+2.5% avg DMG",stat:{generalDmg:2.5}},
      {tier:4,effect:"~+3% avg DMG",stat:{generalDmg:3}},
      {tier:5,effect:"One of four buffs: Crit +10%, Pen +10, Phys DMG +10%, or Min ATK +200 (~+4% avg)",stat:{generalDmg:4}},
      {tier:6,effect:"Two simultaneous buffs (~+5% avg DMG) + Phys DMG Bonus +2.8% (T5 breakthrough)",stat:{generalDmg:5,outerDmg:2.8}},
    ]
  },
  {
    id:"morale_chant", name:"Morale Chant", cat:"GENERAL",
    desc:"100% chance to gain 1 stack of Yi River when attacking or healing (once per 2s): +2 Physical Penetration and +1% damage and healing for 12s, stacking up to 5 times.",
    recommended:true, note:"Best sustained inner way. At T5 max stacks: +10 Phys Pen and +5% DMG.",
    tiers:[
      {tier:1,effect:"Max 2 stacks: +0.8 Phys Pen, +0.4% DMG per stack (max: +1.6 Pen, +0.8% DMG)",stat:{outerPen:1.6,outerDmg:0.8}},
      {tier:2,effect:"Max 3 stacks: +1.2 Phys Pen, +0.6% DMG per stack (max: +3.6 Pen, +1.8% DMG)",stat:{outerPen:3.6,outerDmg:1.8}},
      {tier:3,effect:"Max 4 stacks: +1.6 Phys Pen, +0.8% DMG per stack (max: +6.4 Pen, +3.2% DMG)",stat:{outerPen:6.4,outerDmg:3.2}},
      {tier:4,effect:"Max 5 stacks: +1.8 Phys Pen, +0.9% DMG per stack (max: +9 Pen, +4.5% DMG)",stat:{outerPen:9,outerDmg:4.5}},
      {tier:5,effect:"Breakthrough: Direct Critical Rate +4.6%. (Base max 5 stacks: +10 Pen, +5% DMG)",stat:{outerPen:10,outerDmg:5,dcrit:4.6}},
      {tier:6,effect:"Max 5 stacks: +2 Phys Pen, +1% DMG per stack + Direct Crit +4.6%. Stack duration → 15s",stat:{outerPen:10,outerDmg:5,dcrit:4.6}},
    ]
  },
  {
    id:"vital_leech", name:"Vital Leech", cat:"GENERAL",
    desc:"Casting Exhaustion Execution Skill restores HP equal to 8% of the damage dealt.",
    recommended:false, note:"Survival/sustain. No offensive stat.",
    tiers:[
      {tier:1,effect:"Exhaustion Execution: restore HP = 2% of damage dealt",stat:{}},
      {tier:2,effect:"Restore HP = 3% of damage dealt",stat:{}},
      {tier:3,effect:"Restore HP = 4% of damage dealt",stat:{}},
      {tier:4,effect:"Restore HP = 5% of damage dealt",stat:{}},
      {tier:5,effect:"Restore HP = 6% of damage dealt",stat:{}},
      {tier:6,effect:"Restore HP = 8% of damage dealt",stat:{}},
    ]
  },
  {
    id:"invigorated_warrior", name:"Invigorated Warrior", cat:"GENERAL",
    desc:"Increases all damage and healing done by 5%. Disabled for 5s after being hit. Taking a hit also grants Cage: +5% all damage taken.",
    recommended:true, note:"Strong in burst windows. Risk: getting hit disables buff AND adds Cage (you take more damage).",
    tiers:[
      {tier:1,effect:"+2% all DMG & healing. Disabled 8s after hit. Cage: +3% DMG taken",stat:{generalDmg:2}},
      {tier:2,effect:"+3% all DMG. Disabled 7s after hit. Cage: +4% DMG taken",stat:{generalDmg:3}},
      {tier:3,effect:"+3.5% all DMG. Disabled 6s after hit. Cage: +5% DMG taken",stat:{generalDmg:3.5}},
      {tier:4,effect:"+4% all DMG. Disabled 6s after hit. Cage: +5% DMG taken",stat:{generalDmg:4}},
      {tier:5,effect:"+5% all DMG & healing. Disabled 5s after hit. Cage: +5% DMG taken",stat:{generalDmg:5}},
      {tier:6,effect:"+5% all DMG & healing, disabled 4s after hit + Phys Pen +5.1 (T5 breakthrough)",stat:{generalDmg:5,outerPen:5.1}},
    ]
  },
  {
    id:"bitter_seasons", name:"Bitter Seasons", cat:"GENERAL",
    desc:"When dealing damage, 10% chance to apply Poison for 5s (1 tick/s). Poison: reduces target's Physical Defense by 0.6% for 10s, stacking up to 5 times.",
    recommended:false, note:"At max 5 stacks: enemy -3% Phys Def ≈ +3 effective pen. Inconsistent proc.",
    tiers:[
      {tier:1,effect:"Poison: -0.2% Phys Def per stack (max 5 = -1% ≈ +1 pen equiv)",stat:{outerPen:1}},
      {tier:2,effect:"Poison: -0.3% per stack (max -1.5%)",stat:{outerPen:1.5}},
      {tier:3,effect:"Poison: -0.4% per stack (max -2%)",stat:{outerPen:2}},
      {tier:4,effect:"Poison: -0.5% per stack (max -2.5%)",stat:{outerPen:2.5}},
      {tier:5,effect:"Poison: -0.6% per stack (max 5 stacks = -3%), 10% proc chance",stat:{outerPen:3}},
      {tier:6,effect:"Poison: -0.6%/stack, proc on Crit + Phys DMG Bonus +2.5% (T5 breakthrough)",stat:{outerPen:3,outerDmg:2.5}},
    ]
  },
  {
    id:"evasive_charge", name:"Evasive Charge", cat:"GENERAL",
    desc:"After a Perfect Dodge, 50% chance to refund 100% of the Endurance consumed.",
    recommended:false, note:"Endurance sustain from Perfect Dodge. No offensive stat.",
    tiers:[
      {tier:1,effect:"20% chance to refund 100% Endurance after Perfect Dodge",stat:{}},
      {tier:2,effect:"30% chance to refund 100% Endurance",stat:{}},
      {tier:3,effect:"35% chance to refund 100% Endurance",stat:{}},
      {tier:4,effect:"40% chance to refund 100% Endurance",stat:{}},
      {tier:5,effect:"50% chance to refund 100% Endurance after Perfect Dodge",stat:{}},
      {tier:6,effect:"50% chance refund + next skill after dodge has -0.5s CD",stat:{}},
    ]
  },
  {
    id:"fury_harvest", name:"Fury Harvest", cat:"GENERAL",
    desc:"Vitality is required to cast Mystic Skills. Certain recovery actions have 50% chance to grant 1 bonus Vitality. Not triggered by attacking, taking hits, or deflecting.",
    recommended:false, note:"Mystic Skill resource sustain. No direct damage stat.",
    tiers:[
      {tier:1,effect:"30% chance to grant 1 bonus Vitality on qualifying recovery action",stat:{}},
      {tier:2,effect:"35% chance",stat:{}},
      {tier:3,effect:"40% chance",stat:{}},
      {tier:4,effect:"45% chance",stat:{}},
      {tier:5,effect:"50% chance to grant 1 bonus Vitality",stat:{}},
      {tier:6,effect:"50% chance + qualifying action types expanded",stat:{}},
    ]
  },
  {
    id:"divine_roulette", name:"Divine Roulette", cat:"GENERAL",
    desc:"Upon a successful deflection, gain one of three effects for 10s (once per 30s): applies to Martial Arts, Perception, Special, Charged Skills, and Varied Combos.",
    recommended:false, note:"Requires perfect deflect timing — less consistent in PvE boss fights.",
    tiers:[
      {tier:1,effect:"One random buff (35s CD): ~+1.5% avg DMG",stat:{generalDmg:1.5}},
      {tier:2,effect:"One random buff (32s CD): ~+2% avg DMG",stat:{generalDmg:2}},
      {tier:3,effect:"One random buff (30s CD): ~+2.5% avg DMG",stat:{generalDmg:2.5}},
      {tier:4,effect:"One random buff (30s CD): ~+3% avg DMG (better buff pool)",stat:{generalDmg:3}},
      {tier:5,effect:"One random buff (30s CD), 10s duration: ~+3.5% avg DMG",stat:{generalDmg:3.5}},
      {tier:6,effect:"One random buff (25s CD, 10s): ~+4% avg DMG + Phys Pen +5.1 (T5 breakthrough)",stat:{generalDmg:4,outerPen:5.1}},
    ]
  },
  {
    id:"evening_snow", name:"Evening Snow", cat:"GENERAL",
    desc:"Within 12s of entering combat, if HP falls below 60%, gain Snow Vision for 4s: restore 3% HP +600 HP/s. Triggers once per 300s.",
    recommended:false, note:"Survival only. No offensive stat.",
    tiers:[
      {tier:1,effect:"Triggers at 70% HP: restore 0.5% HP +100 HP/s for 2s (300s CD)",stat:{}},
      {tier:2,effect:"Triggers at 65%: restore 1% HP +200 HP/s for 3s",stat:{}},
      {tier:3,effect:"Triggers at 60%: restore 1.5% HP +350 HP/s for 3s",stat:{}},
      {tier:4,effect:"Triggers at 60%: restore 2% HP +500 HP/s for 4s",stat:{}},
      {tier:5,effect:"Triggers at 60%: restore 3% HP +600 HP/s for 4s (300s CD)",stat:{}},
      {tier:6,effect:"Snow Vision 4s: restore 3% HP +600 HP/s + cleanses 1 debuff on trigger",stat:{}},
    ]
  },
  {
    id:"fivefold_bleed", name:"Fivefold Bleed", cat:"GENERAL",
    desc:"Dealing damage: 10% chance to apply 1 stack of Weeping Blood for 5s (max 5, duration refreshed). At 5 stacks: remove all and deal piercing damage once.",
    recommended:false, note:"Low priority for most builds. Small proc-based damage.",
    tiers:[
      {tier:1,effect:"Piercing burst at 5 stacks: 50% weapon ATK. 8% proc chance",stat:{generalDmg:1}},
      {tier:2,effect:"Piercing burst: 80% weapon ATK. 8% proc",stat:{generalDmg:1.5}},
      {tier:3,effect:"Piercing burst: 100% ATK. 10% proc",stat:{generalDmg:2}},
      {tier:4,effect:"Piercing burst: 120% ATK. 10% proc",stat:{generalDmg:2}},
      {tier:5,effect:"Piercing burst: 150% ATK. 10% proc. AoE hits count toward stacking",stat:{generalDmg:2}},
      {tier:6,effect:"Piercing burst 150% ATK + AoE splash + Crit DMG Bonus +3.5% (T5 breakthrough)",stat:{generalDmg:2,critDmg:3.5}},
    ]
  },
  {
    id:"shadow_assault", name:"Shadow Assault", cat:"GENERAL",
    desc:"Enhances Touch of Death: range +1.5m, damage +10%. Restores HP equal to 10% of damage dealt on hit.",
    recommended:false, note:"Open world / PvP utility. Lifesteal on Touch of Death.",
    tiers:[
      {tier:1,effect:"Touch of Death range +0.3m, +2% DMG, restore 2% HP on hit",stat:{generalDmg:2}},
      {tier:2,effect:"Range +0.6m, +4% DMG, restore 4% HP",stat:{generalDmg:4}},
      {tier:3,effect:"Range +0.9m, +6% DMG, restore 6% HP",stat:{generalDmg:6}},
      {tier:4,effect:"Range +1.2m, +8% DMG, restore 8% HP",stat:{generalDmg:8}},
      {tier:5,effect:"Range +1.5m, +10% DMG, restore 8% HP on hit",stat:{generalDmg:10}},
      {tier:6,effect:"Range +1.5m, +10% DMG, restore 10% HP + Phys DMG Bonus +2.2% (T5 breakthrough)",stat:{generalDmg:10,outerDmg:2.2}},
    ]
  },
  {
    id:"steadfast_stance", name:"Steadfast Stance", cat:"GENERAL",
    desc:"Less likely to suffer stagger when attacked. Higher resistance with more nearby enemies. Invalid vs boss or player attacks.",
    recommended:false, note:"Mob content utility only. Useless in boss fights.",
    tiers:[
      {tier:1,effect:"Stagger chance -15% from mob attacks",stat:{}},
      {tier:2,effect:"Stagger chance -25% from mobs",stat:{}},
      {tier:3,effect:"Stagger chance -35% from mobs",stat:{}},
      {tier:4,effect:"Stagger chance -45% from mobs, scales with nearby enemy count",stat:{}},
      {tier:5,effect:"Stagger chance -55%, higher resistance with 3+ enemies nearby",stat:{}},
      {tier:6,effect:"Near-immune to mob stagger + brief i-frames when stagger would trigger",stat:{}},
    ]
  },
  {
    id:"wind_beneath_wings", name:"Wind Beneath Wings", cat:"GENERAL",
    desc:"Reduces Endurance cost of Skywalk Dash's jump-dash by 40%. After landing: +30% Movement Speed for 3s. Restore 1% Max HP +1,000 HP after defeating any enemy.",
    recommended:false, note:"Mobility and sustain. No combat DPS stat.",
    tiers:[
      {tier:1,effect:"Jump-dash cost -10%, +10% Move Speed 2s after land, +0.3% Max HP on kill",stat:{}},
      {tier:2,effect:"Jump-dash cost -20%, +15% Move Speed, +0.5% Max HP on kill",stat:{}},
      {tier:3,effect:"Jump-dash cost -30%, +20% Move Speed 3s, +0.7% Max HP on kill",stat:{}},
      {tier:4,effect:"Jump-dash cost -35%, +25% Move Speed 3s, +0.8% Max HP on kill",stat:{}},
      {tier:5,effect:"Jump-dash cost -40%, +30% Move Speed 3s, +1% Max HP +1000 HP on kill",stat:{}},
      {tier:6,effect:"Jump-dash cost -40%, +30% Move Speed 3s, +1% Max HP +1000 HP on kill. Additional mid-air dash charge",stat:{}},
    ]
  },

  // ── SILKBIND-DELUGE ──
  {
    id:"royal_remedy", name:"Royal Remedy", cat:"SILKBIND-DELUGE",
    desc:"Mingchuan Medical Codex's Sitting Watch Clouds Rise Water Clone healing +10%. While in HoT area: additionally restore 3 Dew and 2 Essence points each time.",
    recommended:false, note:"Healer path only.",
    tiers:[
      {tier:1,effect:"Water Clone healing +2%, +1 Dew per tick",stat:{}},
      {tier:2,effect:"Healing +4%, +1.5 Dew per tick",stat:{}},
      {tier:3,effect:"Healing +6%, +2 Dew per tick",stat:{}},
      {tier:4,effect:"Healing +8%, +2.5 Dew per tick, +1 Essence per tick",stat:{}},
      {tier:5,effect:"Healing +10%, +3 Dew/+2 Essence per tick + Direct Crit +4.6% (breakthrough)",stat:{dcrit:4.6}},
      {tier:6,effect:"Healing +10%, +3 Dew/+2 Essence + Water Clone area +15%; Direct Crit +4.6%",stat:{dcrit:4.6}},
    ]
  },
  {
    id:"restoring_blossom", name:"Restoring Blossom", cat:"SILKBIND-DELUGE",
    desc:"Dealing Critical healing applies 1 stack of Nurturing for 3s (max 3 stacks): +2% healing received per stack.",
    recommended:false, note:"Healer path only.",
    tiers:[
      {tier:1,effect:"Nurturing: +0.5% healing received/stack (max 3 = +1.5%)",stat:{}},
      {tier:2,effect:"+0.8% healing received/stack (max +2.4%)",stat:{}},
      {tier:3,effect:"+1.2% healing received/stack (max +3.6%)",stat:{}},
      {tier:4,effect:"+1.6% healing received/stack (max +4.8%)",stat:{}},
      {tier:5,effect:"+2% healing received per stack (max 3 stacks = +6%)",stat:{}},
      {tier:6,effect:"+2% per stack (max +6%). Nurturing stacks spread to nearby allies",stat:{}},
    ]
  },
  {
    id:"esoteric_revival", name:"Esoteric Revival", cat:"SILKBIND-DELUGE",
    desc:"Increases healing of Panacea Fan's Resurrection Perception Skill by 50% on the revived target.",
    recommended:false, note:"Healer path only. Revive healing multiplier.",
    tiers:[
      {tier:1,effect:"Resurrection healing on revived target +10%",stat:{}},
      {tier:2,effect:"Resurrection healing +20%",stat:{}},
      {tier:3,effect:"Resurrection healing +30%",stat:{}},
      {tier:4,effect:"Resurrection healing +40%",stat:{}},
      {tier:5,effect:"Resurrection healing +50% on revived target",stat:{}},
      {tier:6,effect:"Resurrection healing +50% + 2s invincibility on revived target",stat:{}},
    ]
  },
  {
    id:"mending_loom", name:"Mending Loom", cat:"SILKBIND-DELUGE",
    desc:"Casting Soulshade Umbrella's Special Skill (Echoing Grow) restores 5 Dew and heals 10% Max HP per 100 Dew consumed.",
    recommended:false, note:"Healer path only.",
    tiers:[
      {tier:1,effect:"Echoing Grow: restore 1 Dew, heal 2% Max HP per 100 Dew",stat:{}},
      {tier:2,effect:"Restore 2 Dew, heal 4% Max HP per 100 Dew",stat:{}},
      {tier:3,effect:"Restore 3 Dew, heal 6% Max HP per 100 Dew",stat:{}},
      {tier:4,effect:"Restore 4 Dew, heal 8% Max HP per 100 Dew",stat:{}},
      {tier:5,effect:"Restore 5 Dew, heal 10% Max HP per 100 Dew consumed",stat:{}},
      {tier:6,effect:"Restore 5 Dew, heal 10% Max HP per 100 Dew + team shield 5% Max HP for 4s",stat:{}},
    ]
  },

  // ── SILKBIND-JADE ──
  {
    id:"blossom_barrage", name:"Blossom Barrage", cat:"SILKBIND-JADE",
    desc:"Vernal Umbrella's Spring Sorrow Martial Art Skill can hold up to 2 stacks. Hitting a target applies Combo effect: target takes +10% damage from your Ballistic Skills for 10s. Affected Skills: Let Spring Go, Everbloom, Umbrella Light Attack, Spring Away.",
    recommended:false, note:"Requires 6-tier upgrade for Silkbind-Jade core mechanic.",
    tiers:[
      {tier:1,effect:"Spring Sorrow max stacks: 2. Combo: Ballistic Skills +2% DMG for 6s",stat:{generalDmg:2}},
      {tier:2,effect:"Combo: Ballistic Skills +4% DMG for 7s",stat:{generalDmg:4}},
      {tier:3,effect:"Combo: +6% DMG for 8s",stat:{generalDmg:6}},
      {tier:4,effect:"Combo: +8% DMG for 9s",stat:{generalDmg:8}},
      {tier:5,effect:"Combo: Ballistic Skills +10% DMG for 10s",stat:{generalDmg:10}},
      {tier:6,effect:"Combo +10% DMG 10s + Crit DMG Bonus +4.4% (T5 breakthrough)",stat:{generalDmg:10,critDmg:4.4}},
    ]
  },
  {
    id:"star_reacher", name:"Star Reacher", cat:"SILKBIND-JADE",
    desc:"Gain 5% Physical Attack Bonus for up to 8s after applying Lingering Bone Mark. Knocking a target Airborne increases the bonus to 10%. Gaining the bonus again refreshes duration.",
    recommended:false, note:"Airborne-combo focused Silkbind-Jade.",
    tiers:[
      {tier:1,effect:"Lingering Bone Mark: +2% Phys ATK Bonus 4s. Airborne: +4%",stat:{outerDmg:2}},
      {tier:2,effect:"Bone Mark: +3%, Airborne: +6% for 5s",stat:{outerDmg:3}},
      {tier:3,effect:"Bone Mark: +3.5%, Airborne: +7% for 6s",stat:{outerDmg:3.5}},
      {tier:4,effect:"Bone Mark: +4%, Airborne: +8% for 7s",stat:{outerDmg:4}},
      {tier:5,effect:"Bone Mark: +5% Phys ATK Bonus 8s. Airborne: +10% Phys ATK Bonus",stat:{outerDmg:5}},
      {tier:6,effect:"Bone Mark +5%, Airborne +10% ATK + Phys Pen +5.1 (T5 breakthrough)",stat:{outerDmg:5,outerPen:5.1}},
    ]
  },
  {
    id:"thunderous_bloom", name:"Thunderous Bloom", cat:"SILKBIND-JADE",
    desc:"Moving >15m in 3s grants 3 stacks of Spring Thunder (12s): each Heavy Attack, Aerial Heavy, Light, or Light Charged Skill hit consumes 1 stack for +15% HP damage (next 1s of that skill type). Cannot stack. Once per 15s.",
    recommended:false, note:"Mobility-triggered buff. Less consistent on stationary boss fights.",
    tiers:[
      {tier:1,effect:"Movement trigger grants 1 stack. Spring Thunder: +5% HP DMG",stat:{generalDmg:5}},
      {tier:2,effect:"Grants 2 stacks. +8% HP DMG per stack",stat:{generalDmg:8}},
      {tier:3,effect:"Grants 2 stacks. +10% HP DMG per stack",stat:{generalDmg:10}},
      {tier:4,effect:"Grants 3 stacks. +12% HP DMG per stack",stat:{generalDmg:12}},
      {tier:5,effect:"Grants 3 stacks. +15% HP DMG per stack (12s). Once per 15s",stat:{generalDmg:15}},
      {tier:6,effect:"3 stacks, +15% HP DMG/stack + Phys DMG Bonus +2.5% (T5 breakthrough)",stat:{generalDmg:15,outerDmg:2.5}},
    ]
  },
  {
    id:"flying_gourds", name:"Flying Gourds", cat:"SILKBIND-JADE",
    desc:"Grants 2 charges to Inkwell Fan Peak's Springless Silence, but increases its cooldown by 3 seconds.",
    recommended:false, note:"Inkwell Fan specific. Extra charges at cost of CD.",
    tiers:[
      {tier:1,effect:"+1 charge to Springless Silence. CD +1.5s",stat:{}},
      {tier:2,effect:"+1 charge. CD +2s",stat:{}},
      {tier:3,effect:"+2 charges. CD +2.5s",stat:{}},
      {tier:4,effect:"+2 charges. CD +2.8s",stat:{}},
      {tier:5,effect:"+2 charges, CD +3s + Silkbind Penetration +6 (breakthrough)",stat:{pzPen:6}},
      {tier:6,effect:"+2 charges, CD +3s; each charge hit -0.5s next CD; Silkbind Pen +6",stat:{pzPen:6}},
    ]
  },

  // ── STONESPLIT-MIGHT ──
  {
    id:"exquisite_scenery", name:"Exquisite Scenery", cat:"STONESPLIT-MIGHT",
    desc:"After a successful parry with Alas Blade Art, activate Parry Counter: free charge-less Tier 3 Heavy Attack Charged Skill (chains into Heavy Attack Follow-up). Once per 10s.",
    recommended:false, note:"Thundercry Blade parry counter. Core Stonesplit-Might mechanic.",
    tiers:[
      {tier:1,effect:"Parry Counter: free Tier 1 Charged Heavy Attack (15s CD)",stat:{}},
      {tier:2,effect:"Free Tier 2 Charged Heavy Attack (13s CD)",stat:{}},
      {tier:3,effect:"Free Tier 2, chains into follow-up (11s CD)",stat:{}},
      {tier:4,effect:"Free Tier 3, chains into follow-up (10s CD)",stat:{}},
      {tier:5,effect:"Free T3 Charged Heavy Attack, chains into follow-up (10s CD) + Crit DMG +4.4% (breakthrough)",stat:{critDmg:4.4}},
      {tier:6,effect:"Free T3, chains, counter DMG +15% (10s CD); Crit DMG +4.4%",stat:{critDmg:4.4}},
    ]
  },
  {
    id:"rock_solid", name:"Rock Solid", cat:"STONESPLIT-MIGHT",
    desc:"Stormbreaker Spear's Storm Roar DMG Reduction: +20% after taunting a boss, +5% non-boss (max 20%). While DMG Reduction active, reduces all damage dealt by 10%.",
    recommended:false, note:"Tank utility — reduces your own DPS while active.",
    tiers:[
      {tier:1,effect:"After boss taunt: -4% DMG taken. -10% own DMG dealt",stat:{}},
      {tier:2,effect:"After boss taunt: -8% DMG taken. -10% own DMG",stat:{}},
      {tier:3,effect:"After boss taunt: -12% DMG taken (+3% non-boss). -10% own DMG",stat:{}},
      {tier:4,effect:"After boss taunt: -16% DMG taken (+4% non-boss, max 16%). -10% own DMG",stat:{}},
      {tier:5,effect:"After boss taunt: -18% DMG taken (+5% non-boss, max 18%). -10% own DMG",stat:{}},
      {tier:6,effect:"After boss taunt: -20% DMG taken (+5% non-boss, max 20%). -10% own DMG",stat:{}},
    ]
  },
  {
    id:"art_of_resistance", name:"Art of Resistance", cat:"STONESPLIT-MIGHT",
    desc:"Increases duration of your own HP shield and bonus effects of its source skill by 4 seconds.",
    recommended:false, note:"Shield duration + DMG/Healing boost while a shield is up (Stonesplit-Might). v1.7: T3 +5%, T6 +10% DMG.",
    tiers:[
      {tier:1,effect:"HP shield duration +1s",stat:{}},
      {tier:2,effect:"HP shield duration +2s",stat:{}},
      {tier:3,effect:"HP shield duration +3s; DMG/Healing boost +5% (v1.7)",stat:{generalDmg:5}},
      {tier:4,effect:"HP shield duration +3.5s; DMG/Healing boost +6%",stat:{generalDmg:6}},
      {tier:5,effect:"HP shield duration +4s; DMG/Healing boost +8%",stat:{generalDmg:8}},
      {tier:6,effect:"HP shield duration +4s; DMG/Healing boost +10%, broken shield grants +10% more (v1.7)",stat:{generalDmg:10}},
    ]
  },
  {
    id:"trapped_beast", name:"Trapped Beast", cat:"STONESPLIT-MIGHT",
    desc:"Taking damage while HP below 30% triggers Cornered Beast: shield absorbs 30% Max HP for 4s. Once per 300s.",
    recommended:false, note:"Emergency survival shield. No offensive stat.",
    tiers:[
      {tier:1,effect:"Below 40% HP: shield absorbs 10% Max HP for 2s (300s CD)",stat:{}},
      {tier:2,effect:"Below 35% HP: shield absorbs 15% Max HP for 3s",stat:{}},
      {tier:3,effect:"Below 30% HP: shield absorbs 20% Max HP for 3s",stat:{}},
      {tier:4,effect:"Below 30% HP: shield absorbs 25% Max HP for 4s",stat:{}},
      {tier:5,effect:"Below 30% HP: shield absorbs 30% Max HP for 4s (300s CD)",stat:{}},
      {tier:6,effect:"Shield absorbs 30% Max HP 4s + reflect 15% absorbed DMG to attacker",stat:{}},
    ]
  },

  // ── STONESPLIT-STRENGTH ──
  {
    id:"frost_clad_night", name:"Frost-Clad Night", cat:"STONESPLIT-STRENGTH",
    desc:"In Iron Guards stance, hitting with Snowbreak Spring summons a Heng Blade Anxi Soldier for extra attacks. Snowbreak Spring spends Inner Passion stacks to boost HP damage vs non-players.",
    recommended:true, note:"Core Stonesplit-Strength DPS inner way. T5 grants Direct Crit.",
    tiers:[
      {tier:1,effect:"Iron Guards: Snowbreak Spring summons a Heng Blade Anxi Soldier",stat:{}},
      {tier:2,effect:"Increases Min Physical Attack based on Solo Mode Level",stat:{}},
      {tier:3,effect:"Full Grave Frost + Dual-Weapon Skill triggers Finding Spring; hitting it restores 0.5 Blade Momentum",stat:{}},
      {tier:4,effect:"Inner Passion max stacks → 4; Snowbreak Spring spends 1 stack for +40% HP damage vs non-players",stat:{}},
      {tier:5,effect:"Breakthrough: Direct Critical Rate +4.6%",stat:{dcrit:4.6}},
      {tier:6,effect:"Snowbreak Spring +10% DMG + Forgetfulness (charge-less Grave Frost 3s) + Direct Crit +4.6%",stat:{dcrit:4.6}},
    ]
  },
  {
    id:"steadfast_devotion", name:"Steadfast Devotion", cat:"STONESPLIT-STRENGTH",
    desc:"In Inner Passion, the Mo Blade Anxi Soldier applies Mountain Splitter on hit: +10% Crit DMG to Burning Heart and Anxi Army Assist, guaranteed Crit if Crit Rate ≥70%.",
    recommended:true, note:"Stonesplit-Strength Crit DMG breakthrough at T5.",
    tiers:[
      {tier:1,effect:"Legion Summoner cooldown → 1s",stat:{}},
      {tier:2,effect:"Increases Critical Rate based on Solo Mode Level",stat:{}},
      {tier:3,effect:"Inner Passion: Mo Blade Anxi Soldier applies Mountain Splitter 10s (+10% Crit DMG; guaranteed Crit at ≥70% Crit Rate)",stat:{critDmg:10}},
      {tier:4,effect:"Inner Passion: Phalanxbane Charged Skill free of Blade Momentum; Burning Heart +32% DMG vs non-players",stat:{critDmg:10}},
      {tier:5,effect:"Breakthrough: Critical DMG Bonus +4.0%. (Base Mountain Splitter +10% Crit DMG)",stat:{critDmg:14}},
      {tier:6,effect:"Burning Heart on Exhausted: Mountain Splitter + Charge Enhancement (full Inner Passion bonus, ≤3/30s)",stat:{critDmg:14}},
    ]
  },
  {
    id:"throat_piercing_art", name:"Throat-Piercing Art", cat:"STONESPLIT-STRENGTH",
    desc:"Throat-Pierced enhances Varied Combos: ignores Physical Resistance and adds Crit DMG. Stacks build via combos; a successful parry grants a full set of stacks.",
    recommended:false, note:"Stonesplit-Strength penetration breakthrough at T5.",
    tiers:[
      {tier:1,effect:"Throat-Pierced duration → 15s",stat:{}},
      {tier:2,effect:"Increases Stonesplit Attack based on Solo Mode Level",stat:{}},
      {tier:3,effect:"Throat-Pierced: Light/Heavy Varied Combo ignores 3 Physical Resistance and +3% Crit DMG",stat:{critDmg:3}},
      {tier:4,effect:"Throat-Pierced max stacks → 5",stat:{critDmg:3}},
      {tier:5,effect:"Breakthrough: Stonesplit Penetration +6",stat:{critDmg:3,pzPen:6}},
      {tier:6,effect:"Successful parry grants 5 Throat-Pierced stacks (20s CD); Assist skills also apply it",stat:{critDmg:3,pzPen:6}},
    ]
  },
  {
    id:"wildfire_surge", name:"Wildfire Surge", cat:"STONESPLIT-STRENGTH",
    desc:"Tenacity grants bonus damage and damage reduction scaling with nearby enemies, plus HP Drain. Range and scaling improve with tier.",
    recommended:false, note:"Stonesplit-Strength AoE sustain; Phys DMG breakthrough at T5.",
    tiers:[
      {tier:1,effect:"Bonus-damage range 3m → 5m",stat:{}},
      {tier:2,effect:"Increases Physical Attack based on Solo Mode Level",stat:{}},
      {tier:3,effect:"Tenacity: +4% DMG Reduction, +1% per nearby enemy in 5m (max +3%)",stat:{}},
      {tier:4,effect:"Tenacity: +3% HP Drain (capped 2% Max HP/s)",stat:{}},
      {tier:5,effect:"Breakthrough: Physical Damage Bonus +2.5%",stat:{outerDmg:2.5}},
      {tier:6,effect:"Bonus damage/reduction per nearby enemy 1% → 1.5% (max +4.5%) + Phys DMG +2.5%",stat:{outerDmg:2.5}},
    ]
  },
];

// Trigger classification for each inner way (verified against game8.co/564726).
//  passive     = flat always-on, would show in the character-menu panel
//  ramp        = stacks from 0 after combat starts (gained by attacking/healing)
//  conditional = only while a condition holds (enemy exhausted, >50% HP, random
//                proc, 3+ enemies, airborne, perfect-timing follow-up, etc.)
//  utility     = no combat stat (endurance / mobility / resource / shield / heal)
// The calculator applies each stat's MAX value as an in-combat buff; for ramp /
// conditional this assumes full uptime (max stacks / condition met).
const INNER_WAY_TRIGGERS: Record<string, InnerWayTrigger> = {
  // BAMBOOCUT-DUST
  phantom_rally: "conditional", song_of_tang: "ramp", light_anew: "conditional", towline_sweep: "passive",
  // BAMBOOCUT-WIND
  echoes_of_oblivion: "conditional", riptide_reflex: "passive", breaking_point: "conditional", vendetta: "passive",
  // BELLSTRIKE-SPLENDOR
  sword_morph: "conditional", battle_anthem: "conditional", wildfire_spark: "passive", mountains_might: "passive", sandswirl_tail: "utility",
  // BELLSTRIKE-UMBRA
  sword_horizon: "conditional", adaptive_steel: "conditional", insightful_strike: "conditional", wolfchasers_art: "utility",
  // GENERAL
  seasonal_edge: "conditional", morale_chant: "ramp", vital_leech: "utility", invigorated_warrior: "passive",
  bitter_seasons: "conditional", evasive_charge: "utility", fury_harvest: "utility", divine_roulette: "conditional",
  evening_snow: "utility", fivefold_bleed: "conditional", shadow_assault: "conditional", steadfast_stance: "utility", wind_beneath_wings: "utility",
  // SILKBIND-DELUGE (healer utility)
  royal_remedy: "passive", restoring_blossom: "utility", esoteric_revival: "utility", mending_loom: "utility",
  // SILKBIND-JADE
  blossom_barrage: "conditional", star_reacher: "conditional", thunderous_bloom: "conditional", flying_gourds: "passive",
  // STONESPLIT-MIGHT (tank utility)
  exquisite_scenery: "passive", rock_solid: "utility", art_of_resistance: "conditional", trapped_beast: "utility",
  frost_clad_night: "conditional", steadfast_devotion: "conditional", throat_piercing_art: "conditional", wildfire_surge: "conditional",
};

INNER_WAYS.forEach(iw => {
  const hasStat = iw.tiers.some(t => Object.keys(t.stat || {}).length > 0);
  iw.trigger = INNER_WAY_TRIGGERS[iw.id] ?? (hasStat ? "conditional" : "utility");
});
