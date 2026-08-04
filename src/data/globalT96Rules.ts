export const GLOBAL_T96_ROLL_CAPS = {
  strength: 49.4,
  agility: 49.4,
  power: 49.4,
  minOuter: 77.8,
  maxOuter: 77.8,
  precision: 8.0,
  crit: 9.0,
  affinity: 4.4,
  minElement: 44.2,
  maxElement: 44.2,
  allArts: 3.2,
  weaponMartial: 6.2,
  physicalPen: 11.0,
  elementPen: 13.0,
  specifiedSkill: 6.0,
  bossDmg: 3.2,
  mysticDmg: 9.8,
} as const;

export const GLOBAL_T96_SYSTEM = {
  tierKey: "405|0.65b",
  sheetColumn: "100上",
  judgmentResistance: 0.65,
  physicalResistanceReference: 26,
  attributeResistanceReference: 28,
  foodSmallPhysicalAttack: 120,
  foodLargePhysicalAttack: 240,
  armoryMin: 131,
  armoryMax: 263,
  hiddenElementAttack: 150,
  basePrecision: 65,
  critEffectiveCap: 80,
  affinityEffectiveCap: 40,
  precisionPanelForCap: 122.75,
  critPanelForCap: 132,
  affinityPanelForCap: 66,
} as const;

export type GlobalT96EvidenceLevel = "verified" | "observed" | "estimated" | "cn-reference";

export const GLOBAL_T96_DATA_POLICY = {
  verified: "Global screenshots, official Global patch notes, or workbook 各等级模板 column 100上.",
  observed: "Measured on a real Global T96 character; useful as a fixture, not a maximum.",
  estimated: "Model-derived target awaiting a Global parse or tooltip confirmation.",
  cnReference: "CN data kept for comparison only and never applied automatically to Global T96.",
} as const;
