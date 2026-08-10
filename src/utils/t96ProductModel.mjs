export const T96_PRODUCT_MODEL_VERSION = 3;

// Keep the earlier community measurements as provenance. They are useful priors,
// but they do not reproduce the supplied Global Lv96 1106 -> 1129 client swap.
export const COMMUNITY_ATTRIBUTE_CONVERSIONS = Object.freeze({
  power: Object.freeze({ minOuterPerPoint: 0.225, maxOuterPerPoint: 1.36 }),
  momentum: Object.freeze({ maxOuterPerPoint: 0.9, affinityRatePerPoint: 0.038 }),
  agility: Object.freeze({ minOuterPerPoint: 0.9, critRatePerPoint: 0.076 }),
});

// Client-calibrated Lv96 projection. One coefficient is kept from the community
// measurement where the A/B fixture cannot independently identify it (Power ->
// Min Physical Attack). The other identifiable coefficients are solved from the
// supplied chest-only 1106 -> 1129 swap after accounting for the DIRECT gear rows.
// This is a conversion model, not a per-field correction table.
export const GLOBAL_T96_ATTRIBUTE_CONVERSIONS = Object.freeze({
  power: Object.freeze({
    minOuterPerPoint: 0.225,
    maxOuterPerPoint: 1.3459821428571428,
  }),
  momentum: Object.freeze({
    maxOuterPerPoint: 0.9,
    affinityRatePerPoint: 0.038,
  }),
  agility: Object.freeze({
    minOuterPerPoint: 1.156896551724138,
    critRatePerPoint: 0.10560344827586207,
  }),
});

export const ATTRIBUTE_CONVERSION_CONFIDENCE = Object.freeze({
  powerMin: "community-measured-prior",
  powerMax: "client-calibrated-single-swap",
  momentumMax: "community-measured-prior",
  momentumAffinity: "community-measured-prior",
  agilityMin: "client-calibrated-single-swap",
  agilityCrit: "client-calibrated-single-swap",
});

export const OBSERVED_PANEL_1106 = Object.freeze({
  power: 417,
  agility: 198,
  minOuter: 1614,
  maxOuter: 2777,
  minPz: 327,
  maxPz: 835,
  prec: 122.1,
  effectivePrec: 99.6,
  crit: 132.5,
  effectiveCrit: 80.0,
  aff: 17.8,
  effectiveAff: 10.8,
  dcrit: 4.6,
  finalCritAffinity: 95.1,
  outerPen: 43.5,
  outerDmg: 2.8,
  critDmg: 54.0,
  allArts: 5.6,
  specifiedWeaponMartial: 5.8,
  bossDmg: 5.3,
});

export const OBSERVED_PANEL_1129 = Object.freeze({
  power: 373,
  agility: 244,
  minOuter: 1719,
  maxOuter: 2784,
  minPz: 363,
  maxPz: 800,
  prec: 115.5,
  effectivePrec: 95.6,
  crit: 131.1,
  effectiveCrit: 79.5,
  aff: 17.8,
  effectiveAff: 10.8,
  dcrit: 4.6,
  finalCritAffinity: 91.2,
  outerPen: 43.5,
  outerDmg: 2.8,
  critDmg: 54.0,
  allArts: 5.6,
  specifiedWeaponMartial: 5.8,
  bossDmg: 5.3,
});

export const CHEST_SWAP_1129_MINUS_1106 = Object.freeze({
  // Direct primary/substat row changes from the two supplied chest tooltips.
  power: -44.8,
  agility: 46.4,
  minOuterDirect: 61.4,
  maxOuterDirect: 67.3,
  minPzDirect: 35.6,
  maxPzDirect: -35.4,
  precDirect: -6.6,
  critDirect: 7.3 - 6.6 - 7.0,
  // Chest Attunement is not summed into the menu-panel 5.8 line; supplied panels
  // show 5.8 for both configurations, so it is deliberately not added here.
});

export function projectChestSwap1129From1106(base = OBSERVED_PANEL_1106) {
  const c = GLOBAL_T96_ATTRIBUTE_CONVERSIONS;
  const d = CHEST_SWAP_1129_MINUS_1106;
  const predicted = {
    ...base,
    power: base.power + d.power,
    agility: base.agility + d.agility,
    minOuter: base.minOuter + d.minOuterDirect
      + d.power * c.power.minOuterPerPoint
      + d.agility * c.agility.minOuterPerPoint,
    maxOuter: base.maxOuter + d.maxOuterDirect
      + d.power * c.power.maxOuterPerPoint,
    minPz: base.minPz + d.minPzDirect,
    maxPz: base.maxPz + d.maxPzDirect,
    prec: base.prec + d.precDirect,
    crit: base.crit + d.critDirect + d.agility * c.agility.critRatePerPoint,
  };
  return { ...predicted, ...deriveEffectivePanel(predicted) };
}

export function deriveEffectivePanel(panel, judgmentResistancePct = 65) {
  const jr = 1 + judgmentResistancePct / 100;
  const effectivePrec = Math.min(100, 65 + Math.max(0, (panel.prec ?? 0) - 65) / jr);
  const effectiveCrit = Math.min(80, (panel.crit ?? 0) / jr);
  const effectiveAff = Math.min(40, (panel.aff ?? 0) / jr);
  const directCrit = panel.dcrit ?? 0;
  const directAff = panel.daff ?? 0;
  const finalCritAffinity = Math.min(
    100,
    effectiveAff + directAff + (effectivePrec / 100) * (effectiveCrit + directCrit),
  );
  return { effectivePrec, effectiveCrit, effectiveAff, finalCritAffinity };
}

export function buildPanelMismatchReport(predicted, observed, tolerances = {}) {
  const defaults = { integer: 1, decimal: 0.15, effective: 0.15 };
  const keys = [
    "minOuter", "maxOuter", "minPz", "maxPz", "prec", "effectivePrec",
    "crit", "effectiveCrit", "aff", "effectiveAff", "dcrit",
    "finalCritAffinity", "outerPen", "critDmg", "allArts",
    "specifiedWeaponMartial", "bossDmg",
  ];
  const rows = keys.map((key) => {
    const p = Number(predicted[key]);
    const o = Number(observed[key]);
    const tol = tolerances[key] ?? (["minOuter", "maxOuter", "minPz", "maxPz"].includes(key)
      ? defaults.integer
      : key.startsWith("effective") || key === "finalCritAffinity"
        ? defaults.effective
        : defaults.decimal);
    const delta = p - o;
    return { key, predicted: p, observed: o, delta, tolerance: tol, pass: Math.abs(delta) <= tol };
  });
  return { pass: rows.every((row) => row.pass), rows };
}

export const DEFAULT_BAMBOOCUT_T96_SCENARIO = Object.freeze({
  durationSeconds: 60,
  boss: true,
  singleTarget: true,
  bossAttacksPlayer: false,
  controlledTarget: false,
  food: true,
  cinderAsh: true,
  infiniteVitality: true,
  partyBuffs: false,
  starweaveDistance: "near",
  starweaveDistanceBonusPct: 0,
});

export const BAMBOOCUT_T96_EFFECTS = Object.freeze({
  morale: Object.freeze({ maxStacks: 5, durationSeconds: 12, minTriggerIntervalSeconds: 2, penPerStack: 2, damagePctPerStack: 1 }),
  songOfTang: Object.freeze({ maxStacks: 5, durationSeconds: 7, minTriggerIntervalSeconds: 0.5, martialCritDamagePctPerStack: 3 }),
  phantomChime: Object.freeze({ maxStacks: 5, durationSeconds: 5, minTriggerIntervalSeconds: 0, physicalResistanceReductionPerStack: 2 }),
  starweave: Object.freeze({ maxStacks: 5, durationSeconds: 5, minTriggerIntervalSeconds: 0.5, martialDamagePctPerStack: 3 }),
});

export const DAMAGE_SOURCE_OUTCOME_RULES = Object.freeze({
  "Burn and Bury": "guaranteed-critical",
  Soulbreak: "special-resolution",
  "Divinecraft - Fire": "special-resolution",
  "Fire - Solid Foundation": "special-resolution",
  "Morale Chant": "unverified",
  "Scarlet Spin": "standard-roll",
  Resonance: "standard-roll",
});

export function simulateStackTimeline(eventTimes, effect, durationSeconds = 60) {
  const times = [...eventTimes].filter((t) => t >= 0 && t <= durationSeconds).sort((a, b) => a - b);
  let stacks = 0;
  let lastAccepted = -Infinity;
  let expiresAt = -Infinity;
  let previous = 0;
  let weightedStacks = 0;
  let maxObserved = 0;
  for (const time of times) {
    if (time > expiresAt) stacks = 0;
    weightedStacks += stacks * Math.max(0, time - previous);
    previous = time;
    if (time - lastAccepted + 1e-9 < effect.minTriggerIntervalSeconds) continue;
    stacks = Math.min(effect.maxStacks, stacks + 1);
    maxObserved = Math.max(maxObserved, stacks);
    lastAccepted = time;
    expiresAt = time + effect.durationSeconds;
  }
  weightedStacks += stacks * Math.max(0, durationSeconds - previous);
  return {
    maxObserved,
    averageStacks: durationSeconds > 0 ? weightedStacks / durationSeconds : 0,
    averageFraction: durationSeconds > 0 && effect.maxStacks > 0
      ? weightedStacks / durationSeconds / effect.maxStacks
      : 0,
  };
}
