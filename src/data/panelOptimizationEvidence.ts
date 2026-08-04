export const PANEL_MODEL_VERSION = 2 as const;

/**
 * Community-measured attribute conversions used to project a calibrated menu
 * panel after gear swaps. These are not roll caps and never grade an item.
 * The one-time in-game panel calibration absorbs character-level, breakthrough,
 * talent, armory, and other static contributions that are not represented here.
 */
export const GLOBAL_ATTRIBUTE_CONVERSIONS = {
  power: {
    minOuterPerPoint: 0.225,
    maxOuterPerPoint: 1.36,
  },
  momentum: {
    maxOuterPerPoint: 0.9,
    affinityRatePerPoint: 0.038,
  },
  agility: {
    minOuterPerPoint: 0.9,
    critRatePerPoint: 0.076,
  },
} as const;

export type OptimizationObjective = "average-dps" | "high-ceiling";

/**
 * Source-derived Bellstrike-Splendor constraints. These are optimizer context,
 * not universal stat weights. The combat engine still evaluates every complete
 * gear combination from its resulting panel and selected rotation.
 */
export const BELLSTRIKE_SPLENDOR_OPTIMIZATION = {
  targetAffinityEffective: 40,
  chargeDamageShareApprox: 0.9,
  objectives: {
    "high-ceiling": {
      label: "High ceiling",
      distribution: "0 Precision / 0 Crit; maximize Max Physical Attack",
      varianceApprox: 30,
    },
    "average-dps": {
      label: "Balanced average DPS",
      distribution: "2 Precision + 1 Crit or 1 Precision + 2 Crit",
      varianceApprox: 25,
    },
  },
  constraints: [
    "Meet the Momentum requirement for weapon talents.",
    "When choosing the balanced distribution, trade Precision or Crit for Max Physical Attack rather than Power or Momentum.",
    "Evaluate All Martial Arts, weapon-art damage, and Boss Damage through the full rotation instead of a fixed item weight.",
    "Rotation conditions include Qi Imbalance, Endless Gale, Jadeware uptime, endurance, and phase duration.",
  ],
  source: "The Ultimate WWM Speedrun Guide · Bellstrike - Splendor tab",
  evidenceLevel: "community-guide",
} as const;
