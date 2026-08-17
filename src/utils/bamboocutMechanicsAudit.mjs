export const CROSS_AUDIT_EVIDENCE = Object.freeze({
  CONFIRMED_CLIENT: "CONFIRMED_CLIENT",
  CONFIRMED_OFFICIAL: "CONFIRMED_OFFICIAL",
  COMMUNITY_CORROBORATED: "COMMUNITY_CORROBORATED",
  COMMUNITY_ONLY: "COMMUNITY_ONLY",
  MODELED: "MODELED",
  UNKNOWN: "UNKNOWN",
});

/**
 * Eligibility metadata for bounded Bamboocut-Dust mechanics research.
 * These tags describe which formula questions are meaningful for an event.
 * They are deliberately not a second production skill database.
 */
export const BAMBOOCUT_EVENT_TAGS = Object.freeze({
  "Scarlet Spin": Object.freeze([
    "bamboocut",
    "martial-art",
    "everspring-eligible",
    "boss-bonus-eligible",
    "standard-outcome",
  ]),
  Resonance: Object.freeze([
    "bamboocut",
    "martial-art",
    "everspring-eligible",
    "boss-bonus-eligible",
    "standard-outcome",
  ]),
  "Rope Dart": Object.freeze([
    "bamboocut",
    "martial-art",
    "boss-bonus-eligible",
    "standard-outcome",
  ]),
  "Burn and Bury": Object.freeze([
    "bamboocut",
    "guaranteed-crit",
  ]),
  Soulbreak: Object.freeze([
    "bamboocut",
    "special-resolution",
    "settlement",
  ]),
  "Divinecraft Fire": Object.freeze([
    "special-resolution",
    "divinecraft",
  ]),
  "Fire Solid Foundation": Object.freeze([
    "special-resolution",
    "divinecraft",
  ]),
});

export function hasBamboocutEventTag(source, tag) {
  return (BAMBOOCUT_EVENT_TAGS[source] || []).includes(tag);
}

/** Current production interpretation for eligible Martial Art events. */
export function applyIndependentAttunement(damage, attunementPct, eligible = true) {
  return eligible ? damage * (1 + attunementPct / 100) : damage;
}

/**
 * Mirrors the existing Global-T91-calibrated residual penetration branch.
 * The cross-audit does NOT promote these denominators to confirmed Global-T96 truth.
 */
export function modeledResidualPenZone(penetration, resistance) {
  const residual = penetration - resistance;
  return residual >= 0 ? residual / 200 : residual / 100;
}

/** Runtime-derived 60 s fixture from PR #21's exact 1106/1129 observed-panel setup. */
export const BAMBOOCUT_SETTLEMENT_RUNTIME_FIXTURE = Object.freeze({
  "1106": Object.freeze({
    modeledDps: 61266.44125288431,
    pools: Object.freeze({
      allModeledFinalDps: 61266.44125288432,
      martialWeaponAndResonanceFinalDps: 50576.00726964667,
      ropeOnlyFinalDps: 4979.583195472643,
    }),
  }),
  "1129": Object.freeze({
    modeledDps: 60673.87643198421,
    pools: Object.freeze({
      allModeledFinalDps: 60673.87643198422,
      martialWeaponAndResonanceFinalDps: 50087.21922978665,
      ropeOnlyFinalDps: 4926.911500215098,
    }),
  }),
});

export const SETTLEMENT_SENSITIVITY_HYPOTHESES = Object.freeze([
  Object.freeze({
    id: "current-special-resolution",
    label: "CURRENT — settlement unresolved / no added settlement event",
    poolKey: null,
    settlementPct: 0,
    evidence: Object.freeze([CROSS_AUDIT_EVIDENCE.MODELED, CROSS_AUDIT_EVIDENCE.UNKNOWN]),
  }),
  Object.freeze({
    id: "derived-final-all-modeled",
    label: "Derived final damage — broad qualifying pool, no second outcome roll",
    poolKey: "allModeledFinalDps",
    settlementPct: 10,
    evidence: Object.freeze([
      CROSS_AUDIT_EVIDENCE.CONFIRMED_CLIENT,
      CROSS_AUDIT_EVIDENCE.CONFIRMED_OFFICIAL,
      CROSS_AUDIT_EVIDENCE.COMMUNITY_CORROBORATED,
      CROSS_AUDIT_EVIDENCE.MODELED,
    ]),
  }),
  Object.freeze({
    id: "derived-final-martial-weapon",
    label: "Derived final damage — Martial/weapon + Resonance pool only",
    poolKey: "martialWeaponAndResonanceFinalDps",
    settlementPct: 10,
    evidence: Object.freeze([
      CROSS_AUDIT_EVIDENCE.CONFIRMED_CLIENT,
      CROSS_AUDIT_EVIDENCE.COMMUNITY_CORROBORATED,
      CROSS_AUDIT_EVIDENCE.MODELED,
    ]),
  }),
  Object.freeze({
    id: "derived-final-rope-only",
    label: "Derived final damage — Rope Dart applier pool only",
    poolKey: "ropeOnlyFinalDps",
    settlementPct: 10,
    evidence: Object.freeze([
      CROSS_AUDIT_EVIDENCE.COMMUNITY_ONLY,
      CROSS_AUDIT_EVIDENCE.MODELED,
    ]),
  }),
]);

export function settlementSensitivityRows() {
  const a = BAMBOOCUT_SETTLEMENT_RUNTIME_FIXTURE["1106"];
  const b = BAMBOOCUT_SETTLEMENT_RUNTIME_FIXTURE["1129"];
  return SETTLEMENT_SENSITIVITY_HYPOTHESES.map((hypothesis) => {
    const extraA = hypothesis.poolKey ? a.pools[hypothesis.poolKey] * hypothesis.settlementPct / 100 : 0;
    const extraB = hypothesis.poolKey ? b.pools[hypothesis.poolKey] * hypothesis.settlementPct / 100 : 0;
    const dps1106 = a.modeledDps + extraA;
    const dps1129 = b.modeledDps + extraB;
    const deltaDps = dps1106 - dps1129;
    const deltaPct = dps1129 === 0 ? 0 : (dps1106 / dps1129 - 1) * 100;
    return Object.freeze({
      ...hypothesis,
      dps1106,
      dps1129,
      deltaDps,
      deltaPct,
      winner: deltaDps >= 0 ? "1106" : "1129",
    });
  });
}
