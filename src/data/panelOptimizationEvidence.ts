import {
  ATTRIBUTE_CONVERSION_CONFIDENCE,
  COMMUNITY_ATTRIBUTE_CONVERSIONS,
  GLOBAL_T96_ATTRIBUTE_CONVERSIONS as CLIENT_T96_ATTRIBUTE_CONVERSIONS,
  T96_PRODUCT_MODEL_VERSION,
} from "../utils/t96ProductModel.mjs";

export const PANEL_MODEL_VERSION = T96_PRODUCT_MODEL_VERSION;

/**
 * Active Global T96 panel projection.
 *
 * The prior community coefficients remain exported below for provenance, but
 * the supplied 1106 -> 1129 Global Lv96 client swap shows that the old Agility
 * and Power conversions do not reproduce the current menu panel. The active
 * coefficients therefore use the identifiable client-calibrated conversion
 * model from t96ProductModel.mjs. This is a conversion model, not a roll-cap
 * grade and not a set of arbitrary per-field corrections.
 */
export const GLOBAL_ATTRIBUTE_CONVERSIONS = CLIENT_T96_ATTRIBUTE_CONVERSIONS;
export const GLOBAL_ATTRIBUTE_CONVERSIONS_COMMUNITY_PRIOR = COMMUNITY_ATTRIBUTE_CONVERSIONS;
export const GLOBAL_ATTRIBUTE_CONVERSION_CONFIDENCE = ATTRIBUTE_CONVERSION_CONFIDENCE;

export type OptimizationObjective = "sustained-dps" | "burst-dps";

/**
 * Bamboocut-Dust is the active product model. Bellstrike-specific distributions
 * such as 0P0C / 2P1C are intentionally not exported into this optimizer path.
 * Stat priority is evaluated from the current complete build by modeled DPS.
 */
export const BAMBOOCUT_DUST_OPTIMIZATION = {
  defaultObjective: "sustained-dps" as OptimizationObjective,
  objectiveLabel: "Sustained boss DPS",
  rankingMetric: "modeled-rotation-dps",
  constraints: [
    "Evaluate the complete equipped build after every replacement.",
    "Rebuild set ownership and Attunement semantics before rotation scoring.",
    "Treat roll cap and roll quality as diagnostics only.",
    "Keep conditional Inner Way and Starweave effects out of the menu panel.",
    "Use current Global client evidence ahead of legacy CN/T91 references.",
  ],
  evidenceLevel: "confirmed-client-plus-modeled-calibration",
} as const;
