import type { InnerWay } from "../types";

type InnerWayOverride = Omit<Partial<InnerWay>, "id" | "tiers"> & {
  tiers: InnerWay["tiers"];
};

/**
 * Current Global 2.0 overrides for the four Inner Ways used by the observed
 * Tier 96 Bamboocut-Dust build.
 *
 * Evidence priority:
 * 1. User-provided English Global client screenshots captured 2026-08-04.
 * 2. Official Global Path Balance notes (2026-05-28 and 2026-08-02).
 * 3. Community tier tables only where they agree with the current client.
 *
 * `tiers[].stat` contains cumulative, always-on Attribute Buff values at that
 * tier. Conditional/ramping effects stay in text and are not silently added to
 * the panel.
 */
export const GLOBAL_V2_INNER_WAY_OVERRIDES: Record<string, InnerWayOverride> = {
  phantom_rally: {
    name: "Phantom Rally",
    cat: "BAMBOOCUT-DUST",
    desc:
      "The first umbrella thrown by Scarlet Spin summons a Phantom Umbrella, and every 3rd throw afterward summons another. Perfect Catches and Phantom Umbrella summons trigger Resonance from all existing Phantom Umbrellas. In Global 2.0, Phantom Umbrellas created by Dreamwrought Bubbles can also trigger Resonance.",
    recommended: true,
    note:
      "Current Global T6. Resonance is treated as Scarlet Spin damage, benefits from Starweave and Everspring Umbrella Martial Art Skill DMG Boost, and must not be double-buffed by All Martial Arts plus Art of Umbrella.",
    tiers: [
      {
        tier: 1,
        effect:
          "Perfect Catch restores 10 Fading Crimson. Continuous Perfect Catches that grant Fragrant Song also grant 1 stack of Fragrant Song - Delicate; the next Dreamwrought Bubbles requires no charging time. This can stack up to 4 times.",
        stat: {},
      },
      {
        tier: 2,
        effect: "Increases Critical Rate based on Solo Mode Level (observed at Level 96: +8.6%).",
        stat: { crit: 8.6 },
      },
      {
        tier: 3,
        effect:
          "Enemies damaged by Resonance receive Phantom Chime for 5 seconds, reducing Physical Resistance by 2 per stack, up to 5 stacks.",
        stat: { crit: 8.6 },
      },
      {
        tier: 4,
        effect:
          "Resonance deals 20% more damage and pulls nearby enemies. The pull is ineffective against bosses and can only affect the same target once every 20 seconds; the damage increase and Phantom Chime are not marked boss-ineffective.",
        stat: { crit: 8.6 },
      },
      {
        tier: 5,
        effect: "Physical DMG Bonus +2.8%.",
        stat: { crit: 8.6, outerDmg: 2.8 },
      },
      {
        tier: 6,
        effect:
          "Each returning umbrella thrown by Scarlet Spin summons a Phantom Umbrella and triggers Resonance immediately. Current flat Attribute Buffs: Critical Rate +8.6%, Physical DMG Bonus +2.8%.",
        stat: { crit: 8.6, outerDmg: 2.8 },
      },
    ],
  },

  morale_chant: {
    name: "Morale Chant",
    cat: "GENERAL",
    desc:
      "100% chance to gain one stack of Yi River when attacking or healing, checked once every 2 seconds. Each stack grants +2 Physical Penetration and +1% damage and healing for 12 seconds, stacking up to 5 times.",
    recommended: true,
    note:
      "Current Global T6. Yi River is a ramping combat buff; only the level-scaled Physical Attack and Direct Critical Rate are stored as flat Attribute Buffs.",
    tiers: [
      {
        tier: 1,
        effect: "Each Yi River stack increases Physical Penetration by 2.",
        stat: {},
      },
      {
        tier: 2,
        effect: "Increases Physical Attack based on Solo Mode Level (observed at Level 96: +24.8 Min / +49.6 Max).",
        stat: { minOuter: 24.8, maxOuter: 49.6 },
      },
      {
        tier: 3,
        effect:
          "When the target is controlled, Yi River grants +2% damage and healing per stack and grants two stacks per trigger.",
        stat: { minOuter: 24.8, maxOuter: 49.6 },
      },
      {
        tier: 4,
        effect: "Yi River application chance becomes 100% and its duration becomes 12 seconds.",
        stat: { minOuter: 24.8, maxOuter: 49.6 },
      },
      {
        tier: 5,
        effect: "Direct Critical Rate +4.6%.",
        stat: { minOuter: 24.8, maxOuter: 49.6, dcrit: 4.6 },
      },
      {
        tier: 6,
        effect:
          "At max stacks, Yi River additionally attacks or heals the target once, or twice when the target is controlled. This can trigger once every 10 seconds. Current flat Attribute Buffs: Physical Attack +24.8 to +49.6, Direct Critical Rate +4.6%.",
        stat: { minOuter: 24.8, maxOuter: 49.6, dcrit: 4.6 },
      },
    ],
  },

  towline_sweep: {
    name: "Towline Sweep",
    cat: "BAMBOOCUT-DUST",
    desc:
      "Gain 50 Tokens of Gratitude after casting Soul Sweep. Each hit of Piercing Dart's sweeping combo applies 1 stack of Soul Loss, plus 1 additional stack while Soulbound; the first sweeping hit pulls the enemy in.",
    recommended: true,
    note:
      "Current Global T6 after the May 28 balance adjustment. Its level-scaled line is Min Physical Attack, not Min Bamboocut Attack; its penetration line is Physical Penetration, not Bamboocut Penetration.",
    tiers: [
      {
        tier: 1,
        effect: "The durations of Soulbreak and Soul Return are increased to 21 seconds.",
        stat: {},
      },
      {
        tier: 2,
        effect: "Increases Min Physical Attack based on Solo Mode Level (observed at Level 96: +66.9).",
        stat: { minOuter: 66.9 },
      },
      {
        tier: 3,
        effect:
          "Piercing Dart's sweeping combo deals +5% damage on hits 1-3, +10% on hits 4-5, and +15% on hits 6-7.",
        stat: { minOuter: 66.9 },
      },
      {
        tier: 4,
        effect:
          "When Soulbreak ends, deal additional damage equal to 5% of the damage the applier dealt during the state, excluding damage from non-class skills obtained inside the mode.",
        stat: { minOuter: 66.9 },
      },
      {
        tier: 5,
        effect: "Physical Penetration +5.1.",
        stat: { minOuter: 66.9, outerPen: 5.1 },
      },
      {
        tier: 6,
        effect:
          "Burn and Bury deals 15% increased damage and is guaranteed Critical. The finger snap refreshes Soul Return and immediately calculates and refreshes Soulbreak on enemies within 15m; Soulbreak's settlement multiplier is increased to 10%. Current flat Attribute Buffs: Min Physical Attack +66.9, Physical Penetration +5.1.",
        stat: { minOuter: 66.9, outerPen: 5.1 },
      },
    ],
  },

  song_of_tang: {
    name: "Song of Tang",
    cat: "BAMBOOCUT-DUST",
    desc:
      "Dealing damage with a Martial Art Skill grants Tang Melody for 7 seconds, stacking up to 5 times and limited to 2 stacks per second. Each stack grants Martial Art Skills +3% Critical Damage and +3% HP Drain, with HP Drain capped at 2.5% Max HP per second.",
    recommended: true,
    note:
      "Current Global T6. 'Martial Art Skill' refers to the weapon Martial Art Skill/Q category, not every weapon attack. The +15% at five Tang Melody stacks is conditional and is not added as a permanent panel stat.",
    tiers: [
      {
        tier: 1,
        effect: "Tang Melody duration is increased to 7 seconds.",
        stat: {},
      },
      {
        tier: 2,
        effect: "Increases Precision Rate based on Solo Mode Level (observed at Level 96: +6.9%).",
        stat: { prec: 6.9 },
      },
      {
        tier: 3,
        effect:
          "Each Tang Melody stack grants Martial Art Skills +3% Critical Damage and +3% HP Drain; up to 2 stacks can be gained per second.",
        stat: { prec: 6.9 },
      },
      {
        tier: 4,
        effect:
          "Hitting at least 2 enemies simultaneously with a Martial Art Skill grants 1 extra Tang Melody stack, up to 2 triggers per second.",
        stat: { prec: 6.9 },
      },
      {
        tier: 5,
        effect: "Critical DMG Bonus +4.0%.",
        stat: { prec: 6.9, critDmg: 4.0 },
      },
      {
        tier: 6,
        effect:
          "Tang Melody is no longer restricted by current HP: both the Martial Art Skill Critical Damage and HP Drain effects are active. Current flat Attribute Buffs: Precision +6.9%, Critical DMG Bonus +4.0%.",
        stat: { prec: 6.9, critDmg: 4.0 },
      },
    ],
  },
};

export type GlobalV2OutcomeRule =
  | "standard-roll"
  | "guaranteed-critical"
  | "cannot-abrasion"
  | "special-resolution"
  | "unverified";

/**
 * Outcome eligibility is intentionally conservative. Only rules supported by a
 * current Global tooltip or official patch note are promoted out of `unverified`.
 */
export const GLOBAL_V2_SKILL_OUTCOME_RULES: Record<
  string,
  { rule: GlobalV2OutcomeRule; evidence: string }
> = {
  "Burn and Bury": {
    rule: "guaranteed-critical",
    evidence: "Towline Sweep Tier 6 Global client tooltip.",
  },
  "Rope Dart Special (Dart Song Max + Soul Loss)": {
    rule: "guaranteed-critical",
    evidence: "Calculator alias for Burn and Bury; Towline Sweep Tier 6 tooltip.",
  },
  "Scarlet Spin": {
    rule: "standard-roll",
    evidence: "Global dummy parse shows a damage range; no forced-outcome text in the current tooltip.",
  },
  Resonance: {
    rule: "standard-roll",
    evidence: "Official Global notes classify Resonance as Scarlet Spin damage; no forced-outcome exception is stated.",
  },
  "Soulbreak": {
    rule: "special-resolution",
    evidence: "Towline Sweep describes settlement damage based on damage dealt during Soulbreak; exact Crit/Affinity eligibility remains unverified.",
  },
  "Divinecraft - Fire": {
    rule: "special-resolution",
    evidence: "DoT/Divinecraft damage source; Global 2.0 standardized Qi damage but did not publish Crit/Affinity eligibility.",
  },
  "Fire - Solid Foundation": {
    rule: "special-resolution",
    evidence: "Divinecraft-derived source; exact Crit/Affinity eligibility remains unverified.",
  },
  "Morale Chant": {
    rule: "unverified",
    evidence: "Tier 6 adds an extra attack/heal; the current tooltip does not state its Crit/Affinity eligibility.",
  },
};

export interface GlobalT96DummySkillRow {
  name: string;
  attempts: number;
  dps: number;
  totalDamage: number;
  contributionPct: number;
  min: number;
  average: number;
  max: number;
}

/** User-provided 60-second Global T96 Sword Trial Boss parse. */
export const GLOBAL_T96_DUMMY_PARSE = {
  capturedAt: "2026-08-04",
  build: "Bamboocut-Dust",
  target: {
    name: "Sword Trial Boss",
    level: 96,
    durationSeconds: 60,
    bossAttack: false,
    infiniteVitality: true,
  },
  activeBuffs: {
    attackFood: {
      minPhysicalAttack: 120,
      maxPhysicalAttack: 240,
      durationMinutes: 30,
    },
    divinecraft: {
      name: "Fire Oil: Cinder Ash",
      qiDamageBonusPct: 4,
    },
  },
  panelDuringTest: {
    minPhysicalAttack: 1734,
    maxPhysicalAttack: 3017,
    minAttributeAttack: 327,
    maxAttributeAttack: 835,
  },
  result: {
    totalDamage: 2_820_055,
    displayedTotalDamage: "2820K",
    dps: 47_001,
    displayedDps: "47,000/s",
    totalAttempts: 266,
    damageCompositionPct: {
      critical: 80,
      affinity: 9,
      normal: 10,
      abrasion: 0,
    },
  },
  skills: [
    { name: "Scarlet Spin", attempts: 76, dps: 21_967, totalDamage: 1_318_075, contributionPct: 46.7, min: 6_036, average: 17_343, max: 29_849 },
    { name: "Resonance", attempts: 82, dps: 12_525, totalDamage: 751_543, contributionPct: 26.6, min: 4_110, average: 9_165, max: 14_599 },
    { name: "Soulbreak", attempts: 3, dps: 3_227, totalDamage: 193_670, contributionPct: 6.9, min: 2_156, average: 64_556, max: 97_266 },
    { name: "Dreamwrought Bubbles", attempts: 16, dps: 2_836, totalDamage: 170_210, contributionPct: 6.0, min: 6_411, average: 10_638, max: 16_266 },
    { name: "Flute Chanting a Thousand Waves", attempts: 10, dps: 2_500, totalDamage: 150_029, contributionPct: 5.3, min: 10_812, average: 15_002, max: 17_200 },
    { name: "Burn and Bury", attempts: 3, dps: 1_068, totalDamage: 64_126, contributionPct: 2.3, min: 19_971, average: 21_375, max: 23_977 },
    { name: "Soaring Spin", attempts: 2, dps: 925, totalDamage: 55_524, contributionPct: 2.0, min: 23_051, average: 27_762, max: 32_473 },
    { name: "Divinecraft - Fire", attempts: 58, dps: 810, totalDamage: 48_640, contributionPct: 1.7, min: 708, average: 838, max: 1_004 },
    { name: "Morale Chant", attempts: 5, dps: 557, totalDamage: 33_418, contributionPct: 1.2, min: 4_474, average: 6_683, max: 8_120 },
    { name: "Soul Sweep", attempts: 3, dps: 380, totalDamage: 22_853, contributionPct: 0.8, min: 6_376, average: 7_617, max: 9_870 },
    { name: "Fire - Solid Foundation", attempts: 6, dps: 127, totalDamage: 7_622, contributionPct: 0.3, min: 1_191, average: 1_270, max: 1_545 },
    { name: "Piercing Dart", attempts: 2, dps: 72, totalDamage: 4_345, contributionPct: 0.2, min: 1_890, average: 2_172, max: 2_455 },
  ] satisfies GlobalT96DummySkillRow[],
  interpretation: {
    damageCompositionIsDamageShareNotHitRate: true,
    directCriticalMayExceedBaseCriticalCap: true,
    finalCriticalStillDependsOnPrecisionAffinityAndSkillEligibility: true,
    foodPanelDeltaMatchesTooltipExactly: true,
  },
} as const;

export function validateGlobalT96DummyParse(): {
  summedDamage: number;
  summedAttempts: number;
  calculatedDps: number;
  damageDelta: number;
} {
  const summedDamage = GLOBAL_T96_DUMMY_PARSE.skills.reduce((sum, row) => sum + row.totalDamage, 0);
  const summedAttempts = GLOBAL_T96_DUMMY_PARSE.skills.reduce((sum, row) => sum + row.attempts, 0);
  const calculatedDps = summedDamage / GLOBAL_T96_DUMMY_PARSE.target.durationSeconds;
  return {
    summedDamage,
    summedAttempts,
    calculatedDps,
    damageDelta: summedDamage - GLOBAL_T96_DUMMY_PARSE.result.totalDamage,
  };
}
