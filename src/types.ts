export interface PanelStats {
  minOuter: number;
  maxOuter: number;
  outerPen: number;
  minPz: number;
  maxPz: number;
  pzPen: number;
  pzDmg: number;
  prec: number;
  crit: number;
  aff: number;
  dcrit: number;
  daff: number;
  critDmg: number;
  affDmg: number;
  outerDmg: number;
  bossDmg: number;
  umbAll: number;
  umbMartial: number;
  umbSpecial: number;
  umbCharged: number;
  ropeAll: number;
  ropeMartial: number;
  ropeSpecial: number;
  ropeCharged: number;
  swordAll: number;
  swordMartial: number;
  swordSpecial: number;
  swordCharged: number;
  spearAll: number;
  spearMartial: number;
  spearSpecial: number;
  spearCharged: number;
  fanAll: number;
  fanMartial: number;
  fanSpecial: number;
  fanCharged: number;
  twinbladesAll: number;
  twinbladesMartial: number;
  twinbladesSpecial: number;
  twinbladesCharged: number;
  modaoAll: number;
  modaoMartial: number;
  modaoSpecial: number;
  modaoCharged: number;
  hengdaoAll: number;
  hengdaoMartial: number;
  hengdaoSpecial: number;
  hengdaoCharged: number;
  gauntletsAll: number;
  gauntletsMartial: number;
  gauntletsSpecial: number;
  gauntletsCharged: number;
  allArts: number;
  attunedBonus: number; // Attuned Damage Bonus % (定音增伤)
  wuxiangMin: number;
  wuxiangMax: number;
  set: string;
  iwGeneralDmg?: number;
  iwOuterPen?: number;
  iwPzPen?: number;
  iwPzDmg?: number;
  constitution: number;
  power: number;
  defense: number;
  agility: number;
  momentum: number;
  physResGear: number;
  physDmgReduction: number;
  groupDmg: number;
  singleTargetDmg: number;
  strength: number;
}

export interface TierConstants {
  def: number;
  judgeRes: number;
  foodMin: number;
  foodMax: number;
  baseMinOuter: number;
  baseMaxOuter: number;
  baseCrit: number;
  baseAff: number;
  basePrec: number;
  armoryMin: number;
  armoryMax: number;
  hiddenAttr: number;
  pzPenBase: number;
  pzDmgBase: number;
  physRes: number;
  attrRes: number;
  name: string;
}

export interface SkillDefinition {
  outerRatio: number;
  fixed: number;
  eleRatio: number;
  exCritDmg: number;
  exDmg: number;
  exPen: number;
  isCharge: number;
  type: string;
  wType: string;
  force: string;
  special: string;
  csBonus: number;
}

export interface RotationItem {
  name: string;
  count: number;
  isDingyin: boolean;
  generalBonus: number;
  yishui: number;
  tiaozhan: number;
}

export interface RelayedGear {
  slotName: string;
  baseStats: { [key: string]: number };
  substats: { name: string; value: number }[];
  relayedSubstat?: { name: string; value: number };
}

export interface InnerWayTier {
  tier: number;
  effect: string;
  stat: { [key: string]: number };
}

export interface InnerWay {
  id: string;
  name: string;
  cat: string;
  desc: string;
  icon?: string;
  tiers: InnerWayTier[];
  recommended?: boolean;
  note?: string;
}

export interface ArsenalWeapon {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  statsPerLevel: { [key: string]: number };
}
