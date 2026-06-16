import { PanelStats, TierConstants } from "../types";

// ──────────────────────────────────────────────
//  Tier Constants (Boss DEF / Judge Resistance)
// ──────────────────────────────────────────────
export const TIERS: Record<string, TierConstants> = {
  "350|0.45": {
    def: 350, judgeRes: 0.45,
    foodMin: 90, foodMax: 180,
    baseMinOuter: 894.89, baseMaxOuter: 1648.08,
    baseCrit: 30.41, baseAff: 15.205, basePrec: 94.0,
    armoryMin: 114, armoryMax: 229,
    hiddenAttr: 129.2,
    pzPenBase: 10.8, pzDmgBase: 5.4,
    physRes: 20, attrRes: 24,
    name: "T91 Standard (Def 350)",
  },
  "350|0.50": {
    def: 350, judgeRes: 0.50,
    foodMin: 90, foodMax: 180,
    baseMinOuter: 894.89, baseMaxOuter: 1648.08,
    baseCrit: 30.41, baseAff: 15.205, basePrec: 94.0,
    armoryMin: 114, armoryMax: 229,
    hiddenAttr: 129.2,
    pzPenBase: 10.8, pzDmgBase: 5.4,
    physRes: 20, attrRes: 24,
    name: "T91 High Judge Res (Def 350, JR 50%)",
  },
  "450|0.45": {
    def: 450, judgeRes: 0.45,
    foodMin: 90, foodMax: 180,
    baseMinOuter: 894.89, baseMaxOuter: 1648.08,
    baseCrit: 30.41, baseAff: 15.205, basePrec: 94.0,
    armoryMin: 114, armoryMax: 229,
    hiddenAttr: 129.2,
    pzPenBase: 10.8, pzDmgBase: 5.4,
    physRes: 30, attrRes: 30,
    name: "T91 Hard Mode (Def 450)",
  },
};

// ──────────────────────────────────────────────
//  Bamboocut-Dust Default Rotation
// ──────────────────────────────────────────────
export const ROTATION_TIME = 60; // seconds per rotation window

export interface RotationEntry {
  name: string;
  count: number;
  isDingyin: boolean;
  generalBonus: number;
  yishui: number;
  tiaozhan: number;
}

export const ROTATION: RotationEntry[] = [
  { name: "Scarlet Spin (Umbrella)",    count: 6,  isDingyin: false, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Perfect Catch (Resonance)",  count: 6,  isDingyin: true,  generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Piercing Dart (Rope Dart)",  count: 4,  isDingyin: false, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Dragon Rider (Rope Dart)",   count: 2,  isDingyin: false, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Soul Sweep (Resonance)",     count: 3,  isDingyin: true,  generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
];

// ──────────────────────────────────────────────
//  Damage Calculation
// ──────────────────────────────────────────────

/** Effective crit rate capped at 80%, factoring in Judge Resistance */
function effectiveCrit(panelCrit: number, judgeRes: number): number {
  const eff = panelCrit / (1 + judgeRes);
  return Math.min(eff, 80);
}

/** Effective affinity rate capped at 40%, factoring in Judge Resistance */
function effectiveAff(panelAff: number, judgeRes: number): number {
  const eff = panelAff / (1 + judgeRes);
  return Math.min(eff, 40);
}

/** Effective precision rate capped at 100% */
function effectivePrec(panelPrec: number, judgeRes: number): number {
  // Precision base = 65%, not reduced by resistance
  const base = 65;
  const extra = Math.max(0, panelPrec - base);
  const eff = base + extra / (1 + judgeRes);
  return Math.min(eff, 100);
}

/** Defense mitigation factor */
function defMitigation(def: number, pen: number): number {
  const netDef = Math.max(0, def - pen);
  return 1 - netDef / (netDef + 1000);
}

/**
 * Calculate expected damage for a single skill instance.
 * Returns { perHit: number, total: number }
 */
export function calcSkill(
  item: RotationEntry,
  p: PanelStats,
  tier: TierConstants,
  opts: { set?: string; datang?: boolean; yishui?: boolean; buildKey?: string }
): { perHit: number; total: number } {
  const { judgeRes, def, physRes } = tier;

  // Base ATK pool (average of min and max)
  const avgAtk = (p.minOuter + p.maxOuter) / 2;

  // Physical penetration
  const netPen = Math.max(0, p.outerPen - physRes);
  const defFactor = defMitigation(def, netPen);

  // Hit probability breakdown
  const critRate   = effectiveCrit(p.crit + (p.dcrit || 0), judgeRes) / 100;
  const affRate    = effectiveAff(p.aff, judgeRes) / 100;
  const precRate   = effectivePrec(p.prec, judgeRes) / 100;

  // Effective crit DMG
  const critDmgBonus = (50 + p.critDmg) / 100; // base 50% + bonus
  const affDmgBonus  = (35 + p.affDmg) / 100;  // base 35% + bonus

  // Skill ratio (simplified: umbrella/rope dart build)
  // Ratio: 1.0 per hit × generalBonus multiplier
  const outerRatio = 1.0 * item.generalBonus;
  const baseHit = avgAtk * outerRatio;

  // Damage bonuses
  let dmgBonus = 1.0;
  // Outer DMG bonus
  dmgBonus += (p.outerDmg || 0) / 100;
  // Boss DMG bonus
  dmgBonus += (p.bossDmg || 0) / 100;
  // IW General DMG bonus
  if (p.iwGeneralDmg) dmgBonus += p.iwGeneralDmg / 100;
  // Umbrella weapon bonus
  if (item.name.toLowerCase().includes("umbrella") || item.name.toLowerCase().includes("scarlet")) {
    dmgBonus += (p.umbBonus || 0) / 100;
  }
  // Rope dart bonus
  if (item.name.toLowerCase().includes("rope") || item.name.toLowerCase().includes("dart") || item.name.toLowerCase().includes("piercing")) {
    dmgBonus += (p.ropeBonus || 0) / 100;
  }
  // All weapon bonus
  dmgBonus += (p.allArts || 0) / 100;
  // Attuned bonus for resonance/dingyin skills
  if (item.isDingyin) {
    dmgBonus += (p.attunedBonus || 0) / 100;
  }
  // Great Tang Song bonus
  if (opts.datang) {
    dmgBonus += 0.15; // +15% Crit DMG on Q umbrella
  }

  // Yishui (water spirit buff) +10% general DMG
  if (opts.yishui) {
    dmgBonus += 0.10;
  }

  // Stars Align set bonus (simplified: +5% skill DMG at max stacks)
  if (opts.set === "stars") {
    dmgBonus += 0.05 * 5 * 0.03; // max 5 stacks × 3% = 15% * portion
  }

  // Expected damage formula:
  // E[dmg] = baseHit × defFactor × dmgBonus × (
  //    graze_prob × 0.75 +
  //    normal_prob × 1.0 +
  //    crit_prob × (1 + critDmgBonus) +
  //    aff_prob × (1 + affDmgBonus)
  // )
  // Simplified probability model:
  const grazeProb  = Math.max(0, 1 - precRate);
  const hitProb    = precRate * (1 - critRate) * (1 - affRate);
  const critProb   = precRate * critRate * (1 - affRate);
  const affProb    = precRate * affRate;

  const expectedMult = grazeProb * 0.75 + hitProb * 1.0 + critProb * (1 + critDmgBonus) + affProb * (1 + affDmgBonus);

  const perHit = baseHit * defFactor * dmgBonus * expectedMult;
  const total  = perHit * item.count;

  return { perHit, total };
}

/**
 * Compute the baseline graduation-100% damage score for the active tier.
 * (Reference value: what a "100% graduated" character would deal in one rotation)
 */
export function calcBaseline(tier: TierConstants): number {
  // Reference panel for 100% graduation at T91
  const refPanel: PanelStats = {
    minOuter:     1657,
    maxOuter:     4046,
    outerPen:     51.2,
    minPz:        400,
    maxPz:        800,
    pzPen:        25.0,
    pzDmg:        12.0,
    prec:         116.9,
    crit:         116.9,
    aff:          14.7,
    dcrit:        4.6,
    daff:         0,
    critDmg:      54,
    affDmg:       35,
    outerDmg:     2.8,
    bossDmg:      7.6,
    umbBonus:     7.4,
    ropeBonus:    0,
    swordBonus:   0,
    spearBonus:   0,
    fanBonus:     0,
    twinbladesBonus: 0,
    modaoBonus:   0,
    hengdaoBonus: 0,
    gauntletsBonus: 0,
    allArts:      7.2,
    attunedBonus: 15,
    wuxiangMin:   0,
    wuxiangMax:   0,
    set:          "stars",
    iwGeneralDmg: 10,
    iwOuterPen:   15,
    iwPzPen:      10,
    iwPzDmg:      5,
  };

  let total = 0;
  ROTATION.forEach(item => {
    const { total: dmg } = calcSkill(item, refPanel, tier, {
      set: "stars",
      datang: true,
      yishui: true,
      buildKey: "bamboocut-dust"
    });
    total += dmg;
  });

  return total;
}
