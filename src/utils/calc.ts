import { PanelStats, TierConstants, SkillDefinition, RotationItem } from "../types";
import { WWM_DATA } from "../data/wwmData";
import { ClassConfig, SkillData } from "../data/referenceData";

const t95 = WWM_DATA.tiers["95下"];

export const TIERS: { [key: string]: TierConstants } = {
  "350|0.45": {
    def: 350,
    judgeRes: t95.base.judgeRes,
    foodMin: 90,
    foodMax: 180,
    baseMinOuter: t95.base.minOuter,
    baseMaxOuter: t95.base.maxOuter,
    baseCrit: t95.base.crit * 100, // 30.41%
    baseAff: t95.base.aff * 100,   // 15.205%
    basePrec: t95.base.precision * 100, // 94.0%
    armoryMin: 114,
    armoryMax: 229,
    hiddenAttr: 129.2,
    pzPenBase: t95.base.elemPen, // 10.8
    pzDmgBase: t95.base.elemDmgUp * 100, // 5.4%
    physRes: 20,
    attrRes: 24,
    name: "Tier 91 / Lv95 ★ Global (Season 3)",
  }
};

export const BUILD_MAP_TO_CHINESE: Record<string, string> = {
  "bamboocut-dust": "破竹尘",
  "bellstrike-umbra": "鸣金影",
  "bellstrike-splendor": "鸣金虹",
  "bamboocut-wind": "破竹风",
  "stonesplit-might": "裂石钧",
  "silkbind-jade": "牵丝玉",
  "silkbind-deluge": "牵丝霖",
  "bamboocut-kite": "破竹鸢",
  "stonesplit-awe": "裂石威",
  "stonesplit-pure-datang": "裂石钧（纯唐）",
};

function getWeaponTypeKey(weaponName: string): string {
  const name = weaponName.toLowerCase();
  if (name.includes("umbrella")) return "umb";
  if (name.includes("rope")) return "rope";
  if (name.includes("sword")) return "sword";
  if (name.includes("spear")) return "spear";
  if (name.includes("fan")) return "fan";
  if (name.includes("twinblades")) return "twinblades";
  if (name.includes("gauntlets")) return "gauntlets";
  if (name.includes("thundercry")) return "modao";
  if (name.includes("phalanxbane")) return "modao";
  if (name.includes("snowparting")) return "hengdao";
  return "single";
}

function getWeaponTypeKeyFromChinese(chType: string): string {
  if (chType === "伞") return "umb";
  if (chType === "绳标") return "rope";
  if (chType === "剑") return "sword";
  if (chType === "枪") return "spear";
  if (chType === "扇") return "fan";
  if (chType === "双刀") return "twinblades";
  if (chType === "陌刀") return "modao";
  if (chType === "横刀") return "hengdao";
  if (chType === "拳甲") return "gauntlets";
  return "single";
}

export const SKILL_DB: { [key: string]: SkillDefinition } = {};

const STATIC_SKILLS: { [key: string]: SkillDefinition } = {
  "Rope Dart Special (Dart Song Max + Soul Loss)": {
    outerRatio: 2.29866,
    fixed: 637,
    eleRatio: 3.44799,
    exCritDmg: 0.27,
    exDmg: 0.2,
    exPen: 0,
    isCharge: 0,
    type: "weapon",
    wType: "rope",
    force: "crit",
    special: "",
    csBonus: 0,
  },
  "Scarlet Spin (0 Echo)": {
    outerRatio: 1.8084,
    fixed: 500,
    eleRatio: 2.7126,
    exCritDmg: 0.27,
    exDmg: 0.05,
    exPen: 0,
    isCharge: 0,
    type: "weapon",
    wType: "umb",
    force: "",
    special: "spin",
    csBonus: 0.2,
  },
  "Scarlet Spin (2 Echo)": {
    outerRatio: 1.8084,
    fixed: 500,
    eleRatio: 2.7126,
    exCritDmg: 0.27,
    exDmg: 0.05,
    exPen: 4,
    isCharge: 0,
    type: "weapon",
    wType: "umb",
    force: "",
    special: "spin",
    csBonus: 0.2,
  },
  "Scarlet Spin (4 Echo)": {
    outerRatio: 1.8084,
    fixed: 500,
    eleRatio: 2.7126,
    exCritDmg: 0.27,
    exDmg: 0.05,
    exPen: 8,
    isCharge: 0,
    type: "weapon",
    wType: "umb",
    force: "",
    special: "spin",
    csBonus: 0.2,
  },
  "Scarlet Spin (5 Echo + Blossom Song)": {
    outerRatio: 1.8084,
    fixed: 500,
    eleRatio: 2.7126,
    exCritDmg: 0.27,
    exDmg: 0.25,
    exPen: 10,
    isCharge: 0,
    type: "weapon",
    wType: "umb",
    force: "crit",
    special: "spin",
    csBonus: 0.2,
  },
  "Scarlet Spin (5 Echo)": {
    outerRatio: 1.8084,
    fixed: 500,
    eleRatio: 2.7126,
    exCritDmg: 0.27,
    exDmg: 0.05,
    exPen: 10,
    isCharge: 0,
    type: "weapon",
    wType: "umb",
    force: "",
    special: "spin",
    csBonus: 0.2,
  },
  "Umbrella Resonance (0 Echo)": {
    outerRatio: 0.54,
    fixed: 0,
    eleRatio: 0.81,
    exCritDmg: 0.27,
    exDmg: 0.25,
    exPen: 0,
    isCharge: 0,
    type: "xinfa",
    wType: "umb",
    force: "",
    special: "spin",
    csBonus: 0.2,
  },
  "Umbrella Resonance (2 Echo)": {
    outerRatio: 0.54,
    fixed: 0,
    eleRatio: 0.81,
    exCritDmg: 0.27,
    exDmg: 0.25,
    exPen: 4,
    isCharge: 0,
    type: "xinfa",
    wType: "umb",
    force: "",
    special: "spin",
    csBonus: 0.2,
  },
  "Umbrella Resonance (4 Echo)": {
    outerRatio: 0.54,
    fixed: 0,
    eleRatio: 0.81,
    exCritDmg: 0.27,
    exDmg: 0.25,
    exPen: 8,
    isCharge: 0,
    type: "xinfa",
    wType: "umb",
    force: "",
    special: "spin",
    csBonus: 0.2,
  },
  "Umbrella Resonance (5 Echo + Blossom Song)": {
    outerRatio: 0.54,
    fixed: 0,
    eleRatio: 0.81,
    exCritDmg: 0.27,
    exDmg: 0.45,
    exPen: 10,
    isCharge: 0,
    type: "xinfa",
    wType: "umb",
    force: "crit",
    special: "spin",
    csBonus: 0.2,
  },
  "Umbrella Resonance (5 Echo)": {
    outerRatio: 0.54,
    fixed: 0,
    eleRatio: 0.81,
    exCritDmg: 0.27,
    exDmg: 0.25,
    exPen: 10,
    isCharge: 0,
    type: "xinfa",
    wType: "umb",
    force: "",
    special: "spin",
    csBonus: 0.2,
  },
  "Dragon's Breath Full Strike (5 Echo)": {
    outerRatio: 7.1054,
    fixed: 1220,
    eleRatio: 10.6581,
    exCritDmg: 0.27,
    exDmg: 0.05,
    exPen: 10,
    isCharge: 0,
    type: "mystic",
    wType: "single",
    force: "",
    special: "",
    csBonus: 0,
  },
  "Soul Sweep (5 Echo)": {
    outerRatio: 3.1428,
    fixed: 869,
    eleRatio: 4.7143,
    exCritDmg: 0.27,
    exDmg: 0.05,
    exPen: 10,
    isCharge: 0,
    type: "weapon",
    wType: "rope",
    force: "",
    special: "",
    csBonus: 0.15,
  },
  "Rope Dart R1-3 (Dart Song 3tk + Soul Loss)": {
    outerRatio: 1.1137,
    fixed: 309,
    eleRatio: 1.6706,
    exCritDmg: 0.27,
    exDmg: 0.1,
    exPen: 0,
    isCharge: 1,
    type: "weapon",
    wType: "rope",
    force: "",
    special: "",
    csBonus: 0,
  },
  "Rope Dart R4-5 (Dart Song 3tk + Soul Loss)": {
    outerRatio: 0.7839,
    fixed: 218,
    eleRatio: 1.1759,
    exCritDmg: 0.27,
    exDmg: 0.1,
    exPen: 0,
    isCharge: 1,
    type: "weapon",
    wType: "rope",
    force: "",
    special: "",
    csBonus: 0,
  },
  "Rope Dart R6-7 (Dart Song 3tk + Soul Loss)": {
    outerRatio: 1.7242,
    fixed: 478,
    eleRatio: 2.5862,
    exCritDmg: 0.27,
    exDmg: 0.15,
    exPen: 0,
    isCharge: 1,
    type: "weapon",
    wType: "rope",
    force: "",
    special: "",
    csBonus: 0,
  },
  "Flute of the Tides (AoE + Soul Loss)": {
    outerRatio: 3.974,
    fixed: 930,
    eleRatio: 5.961,
    exCritDmg: 0.27,
    exDmg: 0.1,
    exPen: 0,
    isCharge: 0,
    type: "mystic",
    wType: "group",
    force: "",
    special: "",
    csBonus: 0,
  },
  "Thousand Camps Lv6 (Soul Loss)": {
    outerRatio: 0.72,
    fixed: 200,
    eleRatio: 1.08,
    exCritDmg: 0,
    exDmg: 0,
    exPen: 0,
    isCharge: 0,
    type: "xinfa",
    wType: "N/A",
    force: "",
    special: "",
    csBonus: 0,
  },
};

// Initialize static skills
Object.assign(SKILL_DB, STATIC_SKILLS);

// Dynamically augment SKILL_DB with WWM_DATA.skills
WWM_DATA.skills.forEach(s => {
  const wKey = getWeaponTypeKey(s.weapon);
  const isXinfa = s.name.toLowerCase().includes("resonance") || s.name.toLowerCase().includes("camps") || s.name.toLowerCase().includes("xinfa");

  SKILL_DB[s.name] = {
    outerRatio: s.outerRatio,
    fixed: s.fixed,
    eleRatio: s.elemRatio,
    exCritDmg: 0.27,
    exDmg: 0.05,
    exPen: 0,
    isCharge: 0,
    type: isXinfa ? "xinfa" : "weapon",
    wType: wKey,
    force: "",
    special: "",
    csBonus: 0,
  };
});

SKILL_DB["九枪重2蓄"] = { outerRatio: 2.5683, fixed: 711, eleRatio: 3.85245, exCritDmg: 0.27, exDmg: 0.05, exPen: 0, isCharge: 1, type: "weapon", wType: "single", force: "", special: "", csBonus: 0 };
SKILL_DB["九剑Q"] = { outerRatio: 2.7205, fixed: 749, eleRatio: 4.08075, exCritDmg: 0.27, exDmg: 0.05, exPen: 10, isCharge: 0, type: "weapon", wType: "single", force: "", special: "", csBonus: 0.15 };
SKILL_DB["九剑~"] = { outerRatio: 1.5, fixed: 300, eleRatio: 2.2, exCritDmg: 0.27, exDmg: 0.05, exPen: 0, isCharge: 0, type: "weapon", wType: "single", force: "", special: "", csBonus: 0 };
SKILL_DB["九枪Q满"] = { outerRatio: 3.5, fixed: 800, eleRatio: 5.0, exCritDmg: 0.27, exDmg: 0.05, exPen: 10, isCharge: 0, type: "weapon", wType: "single", force: "", special: "", csBonus: 0.15 };
SKILL_DB["九剑~流血"] = { outerRatio: 0.8, fixed: 150, eleRatio: 1.2, exCritDmg: 0.27, exDmg: 0.05, exPen: 0, isCharge: 0, type: "weapon", wType: "single", force: "", special: "", csBonus: 0 };

// Calibrated against real 60s parse vs Sword Trial Boss Lv91 (38,176 DPS / 2.29M total).
export const ROTATION: RotationItem[] = [
  { name: "Rope Dart Special (Dart Song Max + Soul Loss)", count: 6, isDingyin: false, generalBonus: 0.465, yishui: 10, tiaozhan: 1 },
  { name: "Scarlet Spin (0 Echo)", count: 1, isDingyin: true, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Scarlet Spin (2 Echo)", count: 1, isDingyin: true, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Scarlet Spin (4 Echo)", count: 1, isDingyin: true, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Scarlet Spin (5 Echo + Blossom Song)", count: 6, isDingyin: true, generalBonus: 0.515, yishui: 10, tiaozhan: 1 },
  { name: "Scarlet Spin (5 Echo)", count: 69, isDingyin: true, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Umbrella Resonance (0 Echo)", count: 2, isDingyin: true, generalBonus: 0.515, yishui: 10, tiaozhan: 1 },
  { name: "Umbrella Resonance (2 Echo)", count: 2, isDingyin: true, generalBonus: 0.515, yishui: 10, tiaozhan: 1 },
  { name: "Umbrella Resonance (4 Echo)", count: 2, isDingyin: true, generalBonus: 0.515, yishui: 10, tiaozhan: 1 },
  { name: "Umbrella Resonance (5 Echo + Blossom Song)", count: 8, isDingyin: true, generalBonus: 0.715, yishui: 10, tiaozhan: 1 },
  { name: "Umbrella Resonance (5 Echo)", count: 61, isDingyin: true, generalBonus: 0.515, yishui: 10, tiaozhan: 1 },
  { name: "Dragon's Breath Full Strike (5 Echo)", count: 4, isDingyin: false, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Soul Sweep (5 Echo)", count: 4, isDingyin: false, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
  { name: "Flute of the Tides (AoE + Soul Loss)", count: 11, isDingyin: false, generalBonus: 0.265, yishui: 10, tiaozhan: 1 },
  { name: "Thousand Camps Lv6 (Soul Loss)", count: 5, isDingyin: false, generalBonus: 0, yishui: 10, tiaozhan: 1 },
];

export const ROTATION_TIME = 60.0;

export function getRotationForBuild(buildKey?: string): RotationItem[] {
  const cnClass = BUILD_MAP_TO_CHINESE[buildKey || "bamboocut-dust"] || "破竹尘";
  const cfg = ClassConfig.ROTATIONS[cnClass];
  if (cfg && cfg.rotation) {
    return cfg.rotation;
  }
  return ROTATION;
}

export function getRotationTimeForBuild(buildKey?: string): number {
  const cnClass = BUILD_MAP_TO_CHINESE[buildKey || "bamboocut-dust"] || "破竹尘";
  // T91 Global parses run 60s on training dummy. Override CN's 78.5s default
  // so DPS expectation matches user-side parses.
  const T91_OVERRIDE_TIME: Record<string, number> = { "破竹尘": 60.0 };
  if (T91_OVERRIDE_TIME[cnClass]) return T91_OVERRIDE_TIME[cnClass];
  const cfg = ClassConfig.ROTATIONS[cnClass];
  if (cfg && cfg.useTime !== undefined) {
    return cfg.useTime;
  }
  return ROTATION_TIME;
}

export function calcSkill(
  rot: RotationItem,
  panel: PanelStats,
  tier: TierConstants,
  opts: { set: string; datang: boolean; yishui: boolean; buildKey?: string }
) {
  let sk = SKILL_DB[rot.name];
  if (!sk) {
    const cnClass = BUILD_MAP_TO_CHINESE[opts.buildKey || "bamboocut-dust"] || "破竹尘";
    const cfg = ClassConfig.ROTATIONS[cnClass];
    const classSkills = cfg && cfg.skillDatabase ? cfg.skillDatabase : SkillData[cnClass];
    const dynSk = classSkills ? classSkills[rot.name] : null;
    if (dynSk) {
      const wKey = getWeaponTypeKeyFromChinese(dynSk.weaponType || "");
      const isXinfa = dynSk.type === "心法" || rot.name.includes("Resonance") || rot.name.includes("Camps") || rot.name.includes("xinfa") || rot.name.includes("歌") || rot.name.includes("章") || rot.name.includes("法") || rot.name.includes("心经");
      
      sk = {
        outerRatio: dynSk.outerRatio || 0,
        fixed: dynSk.fixed || 0,
        eleRatio: dynSk.eleRatio || 0,
        exCritDmg: dynSk.exCritDmg !== undefined ? dynSk.exCritDmg : 0.27,
        exDmg: dynSk.exDmg !== undefined ? dynSk.exDmg : 0.05,
        exPen: dynSk.exPen || 0,
        isCharge: dynSk.isCharge || 0,
        type: isXinfa ? "xinfa" : "weapon",
        wType: wKey !== "single" ? wKey : (dynSk.weaponType === "伞" ? "umb" : dynSk.weaponType === "绳标" ? "rope" : "single"),
        force: dynSk.force || "",
        special: dynSk.special || "",
        csBonus: dynSk.csBonus || 0,
      };
      SKILL_DB[rot.name] = sk;
    }
  }

  if (!sk) return { perHit: 0, total: 0, breakdown: { crit: 0, aff: 0, normal: 0, abrasion: 0 }, sim: { pCrit: 0, pAff: 0, pWhite: 0, pGraze: 0, critHit: 0, affHit: 0, normHit: 0, grazeHit: 0, casts: 0 } };

  const set = opts.set;
  const judgeRes = tier.judgeRes;
  const physRes = tier.physRes;
  const attrRes = tier.attrRes;

  const jR = 1 + judgeRes;
  let critRateInput = panel.crit || 0;
  if (set === "ivorybloom") {
    critRateInput += 5.0;
  }
  let critEff = Math.min(0.8, critRateInput / 100 / jR);
  let affEff = Math.min(0.4, (panel.aff || 0) / 100 / jR);
  let precEff = Math.min(1.0, 0.65 + Math.max(0, (panel.prec || 0) - 65) / 100 / jR);
  let dirCrit = (panel.dcrit || 0) / 100;
  let dirAff = (panel.daff || 0) / 100;
  // Jadeware 4pc: +7.5% Direct Affinity Rate vs qi-imbalanced targets (assume boss).
  if (set === "jadeware") dirAff += 0.075;

  if (set === "stormrain") precEff = Math.min(1.0, precEff + 10.8 / 100 / jR);
  // Eaglerise 4pc is defensive only (damage reduction, no atk/aff bonus).

  let pCrit: number, pAff: number, pPrec: number, pGraze: number;
  if (sk.force === "crit") {
    pCrit = 1;
    pAff = 0;
    pPrec = 1;
    pGraze = 0;
  } else {
    pPrec = precEff;
    pCrit = Math.min(critEff + dirCrit, 0.8 + dirCrit) * pPrec;
    pAff = affEff + dirAff;
    if (pCrit + pAff > 1) {
      pCrit = 1 - pAff;
    }
    pGraze = Math.max(0, (1 - pPrec) * (1 - pAff));
  }
  const pWhite = Math.max(0, 1 - pCrit - pAff - pGraze);

  let critMult = 1 + (panel.critDmg || 0) / 100 + (sk.exCritDmg || 0);
  let affMult = 1 + (panel.affDmg || 0) / 100;
  if (set === "stormrain") critMult += 0.1;
  if (set === "ivorybloom") critMult += 0.15; // Ivorybloom 4pc: +15% Crit DMG at max HP
  if (set === "rainwhisper") critMult += 0.10; // Rainwhisper 4pc: +10% Crit DMG (+15% w/ shield)
  if (set === "jadeware") affMult += 0.10;     // Jadeware 4pc: +10% Affinity DMG vs qi-imbalance (boss)
  if (opts.datang && sk.wType === "umb" && sk.type === "weapon") critMult += 0.15;

  let weapBonus = (panel.allArts || 0) / 100;
  if (sk.wType !== "N/A" && sk.wType !== "single" && sk.wType !== "group") {
    const allKey = `${sk.wType}All` as keyof PanelStats;
    weapBonus += ((panel[allKey] as number) || 0) / 100;
    const suffix = sk.isCharge === 1 ? "Charged" : sk.type === "xinfa" ? "Special" : "Martial";
    const key = `${sk.wType}${suffix}` as keyof PanelStats;
    weapBonus += ((panel[key] as number) || 0) / 100;
  }

  // Stars Align is a WEAPON set (2pc on weapons) — independent of armor 4pc.
  // Apply if user-selected armor set is "stars" OR if opts.weaponStars=true (auto-detected from equipped weapons).
  const csBonus = (set === "stars" || (opts as any).weaponStars) ? 0.15 : 0;
  const spinBonus = sk.special === "spin" ? 0.12 : 0;

  // Verified 4pc general-damage weapon sets (game tooltips, boss/standard condition).
  let setDmgBonus = 0;
  if (set === "swallowreturn") setDmgBonus += 0.05; // Swaying Heights: +5% vs HP>50% (up to +10% at full HP; conservative)
  if (set === "shakenhill") setDmgBonus += 0.05;    // Shattered Ridge: +5% HP dmg on deflect / boss

  // Mystic skill DMG boost: single-target mystic skills eat singleTargetDmg,
  // area/group mystic skills eat groupDmg (matches in-game "Single-Target / Area
  // Mystic Skill DMG Boost"). Only mystic-type skills benefit.
  let mysticBonus = 0;
  if (sk.type === "mystic") {
    mysticBonus = sk.wType === "group"
      ? (panel.groupDmg || 0) / 100
      : (panel.singleTargetDmg || 0) / 100;
  }

  const T =
    1 +
    rot.generalBonus +
    (panel.bossDmg || 0) / 100 +
    weapBonus +
    (panel.outerDmg || 0) / 100 +
    (sk.exDmg || 0) +
    csBonus +
    spinBonus +
    ((panel.iwGeneralDmg || 0) / 100) +
    mysticBonus +
    setDmgBonus;

  const totalOuterPen =
    (panel.outerPen || 0) +
    (sk.exPen || 0) +
    (opts.yishui && rot.yishui ? rot.yishui : 0) -
    physRes;
  const F = totalOuterPen >= 0 ? totalOuterPen / 200 : totalOuterPen / 100;

  // Panel min/maxOuter already include five-attribute contributions from the game.
  // Hawkwing (key "eaglerise") 4pc: +2% PHYSICAL ATK/stack ×5 = +10% (game-verified tooltip:
  // "gain Hawkwing when damage triggers Affinity"). It's an ATK% buff on physical attack only
  // (NOT element/pz), so it correctly multiplies minO/maxO. Assumes full 5-stack uptime like
  // every other ramp buff in the app. ponytail: ATK% multiplies before def — that's the game's
  // order; it lands ≈ Stars Align here, matching the community note that 九剑/Hawkwing scales
  // well with physical. Don't move this into the damage (T) bucket.
  let atkMult = set === "eaglerise" ? 1.10 : set === "ironweave" ? 1.05 : 1.0;
  let minO = (panel.minOuter || 0) * atkMult;
  let maxO = (panel.maxOuter || 0) * atkMult;
  if (maxO < minO) maxO = minO;
  const minO_e = Math.max(0, minO - tier.def);
  const maxO_e = Math.max(0, maxO - tier.def);
  const avgO_e = (minO_e + maxO_e) / 2;

  const dGl_O = minO_e * sk.outerRatio * (1 + F) * T;
  const dN_O = avgO_e * sk.outerRatio * (1 + F) * T;
  const dC_O = avgO_e * sk.outerRatio * (1 + F) * T * critMult;
  const dA_O = maxO_e * sk.outerRatio * (1 + F) * T * affMult;
  const dmgOuter = pGraze * dGl_O + pWhite * dN_O + pCrit * dC_O + pAff * dA_O;

  const fixedDmgBonus = 0.225;
  const fixed = sk.fixed * (1 + fixedDmgBonus);
  const dN_F = fixed * (1 + F) * T;
  const dC_F = fixed * (1 + F) * T * critMult;
  const dA_F = fixed * (1 + F) * T * affMult;
  const dmgFixed = (pGraze + pWhite) * dN_F + pCrit * dC_F + pAff * dA_F;

  const totalPzPen = (panel.pzPen || 0) - attrRes;
  const Fpz = totalPzPen >= 0 ? totalPzPen / 200 : totalPzPen / 100;

  const pzMult = set === "formbend" ? 1.05 : 1.0;
  const minPzTot = (panel.minPz || 0) + (panel.wuxiangMin || 0);
  const maxPzTot = (panel.maxPz || 0) + (panel.wuxiangMax || 0);
  const minPz_e = Math.max(0, minPzTot * pzMult - tier.def);
  const maxPz_e = Math.max(0, maxPzTot * pzMult - tier.def);

  // Off-element (外系) attribute attack uses the PHYSICAL ratio (Excel 伤害公式
  // B6: 外系元素倍率 = 外攻倍率), NOT the own-element ×1.5 ratio. panel.offPz*
  // is the off-element share of minPz/maxPz; blend the ratio by that fraction.
  const offMinFrac = minPzTot > 0 ? Math.min(1, (panel.offPzMin || 0) / minPzTot) : 0;
  const offMaxFrac = maxPzTot > 0 ? Math.min(1, (panel.offPzMax || 0) / maxPzTot) : 0;
  const eleRatioMin = sk.eleRatio * (1 - offMinFrac) + sk.outerRatio * offMinFrac;
  const eleRatioMax = sk.eleRatio * (1 - offMaxFrac) + sk.outerRatio * offMaxFrac;

  const pzDmgBonus = (panel.pzDmg || 0) / 100;
  const pzAvgTerm = (minPz_e * eleRatioMin + maxPz_e * eleRatioMax) / 2;
  const dN_PZ = pzAvgTerm * (1 + Fpz) * T * (1 + pzDmgBonus);
  const dC_PZ = pzAvgTerm * (1 + Fpz) * T * (1 + pzDmgBonus) * critMult;
  const dA_PZ = maxPz_e * eleRatioMax * (1 + Fpz) * T * (1 + pzDmgBonus) * affMult;
  const dmgPz = (pGraze + pWhite) * dN_PZ + pCrit * dC_PZ + pAff * dA_PZ;

  let perHit = dmgOuter + dmgFixed + dmgPz;

  // Per-hit-outcome split (matches in-game "Damage Composition"): each hit is
  // crit / affinity(会心) / normal / abrasion(擦伤=graze). The four sum to perHit.
  let critPart = pCrit * (dC_O + dC_F + dC_PZ);
  let affPart = pAff * (dA_O + dA_F + dA_PZ);
  let normPart = pWhite * (dN_O + dN_F + dN_PZ);
  let abrPart = pGraze * (dGl_O + dN_F + dN_PZ);

  let attMul = 1;
  if (rot.isDingyin && (panel.attunedBonus || 0) > 0) {
    attMul = 1 + panel.attunedBonus / 100;
    perHit *= attMul;
  }

  const scale = rot.count * (rot.tiaozhan || 1) * attMul;
  const total = perHit * rot.count * (rot.tiaozhan || 1);
  const breakdown = {
    crit: critPart * scale,
    aff: affPart * scale,
    normal: normPart * scale,
    abrasion: abrPart * scale,
  };
  // Per-cast outcome probabilities + the damage of one cast IF it lands as that
  // outcome (incl. attuned multiplier). Lets a Monte Carlo roll each cast.
  const sim = {
    pCrit, pAff, pWhite, pGraze,
    critHit: (dC_O + dC_F + dC_PZ) * attMul,
    affHit: (dA_O + dA_F + dA_PZ) * attMul,
    normHit: (dN_O + dN_F + dN_PZ) * attMul,
    grazeHit: (dGl_O + dN_F + dN_PZ) * attMul,
    casts: rot.count * (rot.tiaozhan || 1),
  };
  return { perHit, total, breakdown, sim };
}

// T91 Global graduated DPS per build, extracted DIRECTLY from the source spreadsheet
// (sheet "95级常见流派非竞速养成计算 2025.9.1") that spongem.com is based on.
// These are the AUTHORITATIVE "fully graduated T91" DPS numbers for each class.
const T91_GRAD_DPS: Record<string, number> = {
  "bamboocut-dust":   39117,
  "bellstrike-splendor": 34053,
  "silkbind-jade":    35321,
  "stonesplit-might": 36498,
  "stonesplit-awe":   35182,
  "bellstrike-umbra": 40953,
  "bamboocut-wind":   38881,
  "silkbind-deluge":  32951,
  // No direct T91 entry for these — estimated from T100上 ratios:
  "bamboocut-kite":   39117,  // similar Bamboocut family
  "stonesplit-pure-datang": 36498,  // Might variant
};

export function calcBaseline(tier: TierConstants, buildKey?: string, _refPanel?: PanelStats): number {
  const key = buildKey || "bamboocut-dust";
  const dps = T91_GRAD_DPS[key] || T91_GRAD_DPS["bamboocut-dust"];
  // Convert DPS to total rotation damage using current rotation time.
  return dps * getRotationTimeForBuild(key);
}
