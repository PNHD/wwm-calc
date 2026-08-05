export const GLOBAL_T96_VIDEO_EVIDENCE_META = {
  capturedAt: "2026-08-05",
  source: "User-provided Global client recording",
  durationSeconds: 260.351979,
  build: "Bamboocut-Dust",
  target: "Sword Trial Boss · Level 96",
  testDurationSeconds: 60,
  temporaryBuffs: [
    "Attack food: +120 Min / +240 Max Physical Attack",
    "Fire Oil: Cinder Ash (+4% Qi damage)",
  ],
} as const;

export const GLOBAL_T96_CHEST_1106 = {
  id: "video-nightfarer-armor-1106",
  name: "Nightfarer Armor",
  slot: "Chest",
  mastery: 1106,
  gearTier: "Relaying · Tier 96",
  set: "calmwaters",
  lines: [
    { type: "Crit Rate", value: 6.6 },
    { type: "Crit Rate", value: 7.0 },
    { type: "Precision", value: 6.6 },
    { type: "Power", value: 44.8, tuned: true },
    { type: "Max Bamboocut Atk", value: 35.4 },
    { type: "Everspring Umbrella Martial Art Skill DMG Boost", value: 5.0 },
  ],
} as const;

export const GLOBAL_T96_CHEST_1129 = {
  id: "video-nightfarer-armor-1129",
  name: "Nightfarer Armor",
  slot: "Chest",
  mastery: 1129,
  gearTier: "Relaying · Tier 96",
  set: "calmwaters",
  lines: [
    { type: "Crit Rate", value: 7.3 },
    { type: "Agility", value: 46.4 },
    { type: "Min Phys Atk", value: 61.4 },
    { type: "Max Phys Atk", value: 67.3, tuned: true },
    { type: "Min Bamboocut Atk", value: 35.6 },
    { type: "Everspring Umbrella Martial Art Skill DMG Boost", value: 5.2 },
  ],
} as const;

/**
 * Panels shown after each chest was equipped. Physical Attack values below are
 * the menu values visible while the +120/+240 attack food was active.
 */
export const GLOBAL_T96_VIDEO_PANELS = {
  chest1106: {
    martialMastery: 34710,
    constitution: 153,
    power: 417,
    defense: 153,
    agility: 198,
    momentum: 153,
    maxHp: 154560,
    effectiveMaxHp: 185472,
    minPhysicalAttackWithFood: 1734,
    maxPhysicalAttackWithFood: 3017,
    minPhysicalAttackWithoutFood: 1614,
    maxPhysicalAttackWithoutFood: 2777,
    minAttributeAttack: 327,
    maxAttributeAttack: 835,
    physicalDefense: 58.3,
    precisionPanel: 122.1,
    precisionEffective: 99.6,
    criticalPanel: 132.5,
    criticalEffective: 80.0,
    affinityPanel: 17.8,
    affinityEffective: 10.8,
    directCritical: 4.6,
    directAffinity: 0,
    abrasionConversion: 0,
    finalCriticalAndAffinity: 95.1,
    judgmentResistance: 65,
    criticalDamageBonus: 54,
    affinityDamageBonus: 35,
    physicalPenetration: 43.5,
    physicalDamageBonus: 2.8,
    attributePenetration: 22,
    attributeDamageBonus: 11,
    allMartialArtSkillDamageBoost: 5.6,
    specifiedWeaponMartialArtBoost: 5.8,
    bossDamageBoost: 5.3,
  },
  chest1129: {
    martialMastery: 34711,
    constitution: 153,
    power: 373,
    defense: 153,
    agility: 244,
    momentum: 153,
    maxHp: 154560,
    effectiveMaxHp: 185472,
    minPhysicalAttackWithFood: 1839,
    maxPhysicalAttackWithFood: 3024,
    minPhysicalAttackWithoutFood: 1719,
    maxPhysicalAttackWithoutFood: 2784,
    minAttributeAttack: 363,
    maxAttributeAttack: 800,
    physicalDefense: 58.3,
    precisionPanel: 115.5,
    precisionEffective: 95.6,
    criticalPanel: 131.1,
    criticalEffective: 79.5,
    affinityPanel: 17.8,
    affinityEffective: 10.8,
    directCritical: 4.6,
    directAffinity: 0,
    abrasionConversion: 0,
    finalCriticalAndAffinity: 91.2,
    judgmentResistance: 65,
    criticalDamageBonus: 54,
    affinityDamageBonus: 35,
    physicalPenetration: 43.5,
    physicalDamageBonus: 2.8,
    attributePenetration: 22,
    attributeDamageBonus: 11,
    allMartialArtSkillDamageBoost: 5.6,
    specifiedWeaponMartialArtBoost: 5.8,
    bossDamageBoost: 5.3,
  },
} as const;

export const GLOBAL_T96_VIDEO_PANEL_DELTA_1129_MINUS_1106 = {
  power: -44,
  agility: 46,
  minPhysicalAttack: 105,
  maxPhysicalAttack: 7,
  minAttributeAttack: 36,
  maxAttributeAttack: -35,
  precisionPanel: -6.6,
  criticalPanel: -1.4,
  finalCriticalAndAffinity: -3.9,
  specifiedWeaponMartialArtBoost: 0.2,
} as const;

export const GLOBAL_T96_VIDEO_DUMMY_RESULTS = {
  chest1129: {
    displayedTotalDamage: "2833K",
    displayedDps: 47224,
  },
  chest1106: {
    displayedTotalDamage: "2749K",
    displayedDps: 45825,
  },
  observedDpsDelta1129Minus1106: 1399,
  observedDpsDeltaPct1129Vs1106: 3.052918712493181,
  caveat:
    "One 60-second run per chest is calibration evidence, not a statistically stable expected-DPS estimate. Panel deltas are deterministic and should drive the optimizer; dummy runs validate direction and scale.",
} as const;

export const GLOBAL_V2_SET_TOOLTIPS = {
  starweave: {
    currentEnglishName: "Starweave",
    legacyEnglishName: "Stars Align",
    piecesEquipped: 4,
    twoPiece: {
      effectiveFromLevel: 96,
      minPhysicalAttack: 78,
    },
    fourPiece: {
      trigger:
        "Hitting at least 2 enemies simultaneously, or hitting a boss or player, grants 1 Starweave stack.",
      durationSeconds: 5,
      martialArtSkillDamagePerStackPct: 3,
      distanceBonusStartsAboveMeters: 4,
      distanceBonusMaxPctPerTooltip: 1,
      distanceBonusMaxAtMeters: 8,
      maxStacks: 5,
      stacksRemovedWhenTakingDamage: 1,
      maxStacksGainedPerSecond: 2,
    },
    modelingNote:
      "The current engine's fixed +15% represents five stacks of the explicit +3% component only. The distance component must be modeled separately rather than silently assumed.",
  },
  calmwaters: {
    currentEnglishName: "Calmwaters",
    piecesEquipped: 4,
    twoPiece: {
      effectiveFromLevel: 96,
      physicalDefense: 39,
    },
    fourPiece: {
      trigger: "Perfect Dodge",
      procChancePct: 50,
      enduranceRestored: 10,
      baseHpRestoredPct: 1,
      additionalHpRestoredPctAtBelow50: 2,
      additionalHpRestoredPctAtBelow20: 2,
      maxHpRestoredPct: 5,
    },
    modelingNote:
      "Calmwaters is defensive/utility in the supplied tooltip. It should not receive an unconditional offensive DPS multiplier. Endurance value requires an explicit Perfect-Dodge scenario.",
  },
} as const;
