export const MODEL_EVIDENCE_LEVELS = [
  "VERIFIED_PANEL",
  "VERIFIED_CLIENT",
  "OFFICIAL",
  "OBSERVED_PARSE",
  "COMMUNITY_MEASURED",
  "MODELED",
  "UNKNOWN",
] as const;

export type ModelEvidenceLevel = typeof MODEL_EVIDENCE_LEVELS[number];
export type RecommendationConfidence = "HIGH" | "MEDIUM" | "CLOSE CALL" | "EXPERIMENTAL";
export type BuildOwnership = "MY BUILD" | "REFERENCE BUILD" | "COMMUNITY BUILD";
export type ModelMaturity = "CALIBRATED" | "MODELED" | "EXPERIMENTAL";

export interface PathModelMaturity {
  pathKey: string;
  label: string;
  ownership: BuildOwnership;
  maturity: ModelMaturity;
  evidence: ModelEvidenceLevel[];
  summary: string;
}

export const PATH_MODEL_MATURITY: Record<string, PathModelMaturity> = {
  "bamboocut-dust": {
    pathKey: "bamboocut-dust",
    label: "Bamboocut-Dust",
    ownership: "MY BUILD",
    maturity: "CALIBRATED",
    evidence: ["VERIFIED_PANEL", "VERIFIED_CLIENT", "OBSERVED_PARSE", "MODELED"],
    summary: "1106/1129 menu panels are client-verified. The rotation is event-modeled from verified mechanics, with unresolved settlement/outcome rules kept explicit.",
  },
  "silkbind-jade": {
    pathKey: "silkbind-jade",
    label: "Silkbind-Jade",
    ownership: "REFERENCE BUILD",
    maturity: "MODELED",
    evidence: ["OFFICIAL", "COMMUNITY_MEASURED", "MODELED"],
    summary: "Reference/community model built from official and community evidence. It is not silently treated as the owner's inventory/build.",
  },
};

export const BAMBOOCUT_MODEL_UNKNOWNS = [
  "Soulbreak uses special/settlement resolution; exact Critical/Affinity/Precision eligibility is not verified.",
  "Divinecraft-Fire and Fire-Solid Foundation use special-resolution rules that are not fully verified.",
  "Morale Chant T6 extra attack outcome eligibility is not stated by current client evidence.",
  "Observed auxiliary sources (Dreamwrought Bubbles, Flute Chanting a Thousand Waves, Soaring Spin, Soul Sweep, Piercing Dart) are not independently calibrated as complete source formulas.",
] as const;

export const BAMBOOCUT_AB_FIXTURES = {
  "1106": {
    observedDps: 45_825,
    modeledDpsBaseline: 61_266,
    panel: { minOuter: 1614, maxOuter: 2777, minPz: 327, maxPz: 835, prec: 122.1, crit: 132.5, aff: 17.8, finalOutcome: 95.1, umbMartial: 5.8, attunedBonus: 20.0 },
    evidence: ["VERIFIED_PANEL", "VERIFIED_CLIENT", "OBSERVED_PARSE", "MODELED"] as ModelEvidenceLevel[],
  },
  "1129": {
    observedDps: 47_224,
    modeledDpsBaseline: 60_674,
    panel: { minOuter: 1719, maxOuter: 2784, minPz: 363, maxPz: 800, prec: 115.5, crit: 131.1, aff: 17.8, finalOutcome: 91.2, umbMartial: 5.8, attunedBonus: 20.2 },
    evidence: ["VERIFIED_PANEL", "VERIFIED_CLIENT", "OBSERVED_PARSE", "MODELED"] as ModelEvidenceLevel[],
  },
} as const;

export interface ConfidenceInput {
  pathKey: string;
  deltaPct: number;
  panelCalibrated: boolean;
  materialUnknowns?: readonly string[];
}

/**
 * Product/governance confidence, not a statistical confidence interval.
 * The close-call guard band intentionally avoids fake probability precision.
 */
export function recommendationConfidence(input: ConfidenceInput): {
  label: RecommendationConfidence;
  reason: string;
  unknowns: readonly string[];
} {
  const unknowns = input.materialUnknowns ?? [];
  const margin = Math.abs(input.deltaPct);

  if (!input.panelCalibrated) {
    return { label: "EXPERIMENTAL", reason: "The menu-panel transform is not calibrated for this comparison.", unknowns };
  }
  if (margin < 2) {
    return {
      label: "CLOSE CALL",
      reason: `Modeled DPS differs by only ${margin.toFixed(2)}%; that is smaller than the product's deterministic close-call guard band.`,
      unknowns,
    };
  }
  if (unknowns.length > 0) {
    return {
      label: margin >= 5 ? "MEDIUM" : "EXPERIMENTAL",
      reason: margin >= 5
        ? "The modeled margin is meaningful, but unresolved mechanics remain in the rotation."
        : "Unresolved mechanics are large enough relative to the modeled margin to affect ranking.",
      unknowns,
    };
  }
  if (margin >= 5) {
    return { label: "HIGH", reason: "Panel is calibrated, modeled mechanics are verified enough for ranking, and the DPS margin is large.", unknowns };
  }
  return { label: "MEDIUM", reason: "Panel is calibrated and the DPS margin is meaningful, with some model dependence remaining.", unknowns };
}

export const BAMBOOCUT_SKILL_EVIDENCE = [
  { source: "Scarlet Spin", outcome: "standard-roll", martialArt: true, starweave: true, everspring: true, evidence: "VERIFIED_CLIENT" as ModelEvidenceLevel },
  { source: "Resonance", outcome: "standard-roll", martialArt: true, starweave: true, everspring: true, evidence: "OFFICIAL" as ModelEvidenceLevel },
  { source: "Soulbreak", outcome: "special-resolution", martialArt: null, starweave: null, everspring: null, evidence: "UNKNOWN" as ModelEvidenceLevel },
  { source: "Dreamwrought Bubbles", outcome: "modeled auxiliary source", martialArt: false, starweave: false, everspring: false, evidence: "MODELED" as ModelEvidenceLevel },
  { source: "Flute Chanting a Thousand Waves", outcome: "modeled auxiliary source", martialArt: false, starweave: false, everspring: false, evidence: "MODELED" as ModelEvidenceLevel },
  { source: "Burn and Bury", outcome: "guaranteed-critical", martialArt: false, starweave: false, everspring: false, evidence: "OFFICIAL" as ModelEvidenceLevel },
  { source: "Soaring Spin", outcome: "modeled auxiliary source", martialArt: null, starweave: null, everspring: null, evidence: "UNKNOWN" as ModelEvidenceLevel },
  { source: "Divinecraft Fire", outcome: "special-resolution", martialArt: null, starweave: null, everspring: null, evidence: "UNKNOWN" as ModelEvidenceLevel },
  { source: "Morale Chant", outcome: "extra-attack outcome unverified", martialArt: false, starweave: false, everspring: false, evidence: "UNKNOWN" as ModelEvidenceLevel },
  { source: "Soul Sweep", outcome: "modeled auxiliary source", martialArt: null, starweave: null, everspring: null, evidence: "UNKNOWN" as ModelEvidenceLevel },
  { source: "Fire Solid Foundation", outcome: "special-resolution", martialArt: null, starweave: null, everspring: null, evidence: "UNKNOWN" as ModelEvidenceLevel },
  { source: "Piercing Dart", outcome: "modeled auxiliary source", martialArt: false, starweave: false, everspring: false, evidence: "MODELED" as ModelEvidenceLevel },
] as const;
