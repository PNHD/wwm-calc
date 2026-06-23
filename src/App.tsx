import React, { useState, useEffect, useMemo, useRef } from "react";
import { createWorker } from "tesseract.js";
import {
  Shield,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  RotateCw,
  Trophy,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle,
  Database,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  Clock,
  Info,
  Camera,
  Umbrella,
  Gem,
  HardHat,
  Shirt,
  Hand,
  Target,
  Crosshair,
} from "lucide-react";
import { PanelStats, TierConstants, RotationItem, SkillDefinition } from "./types";
import { TIERS, calcSkill, calcBaseline, getRotationForBuild, getRotationTimeForBuild, SKILL_DB } from "./utils/calc";
import { simulateRotation } from "./utils/timelineEngine";
import { previewSkill } from "./utils/skillPreview";
import { INNER_WAYS } from "./data/innerways";
import { INNER_WAY_IMAGES, WEAPON_IMAGES_G8, MYSTIC_SKILL_IMAGES, ARMOR_SET_IMAGES } from "./data/game8Images";
import { WWM_DATA } from "./data/wwmData";
import OcrScanner from "./components/OcrScanner";
import { parseGameData, ImportResult } from "./utils/gameImport";
import { translateSkillName } from "./utils/skillNameEn";
import { runDualPassOcr } from "./utils/ocrParser";
import StatSwapSimulator from "./components/StatSwapSimulator";
import SearchableSelect from "./components/SearchableSelect";

// Constants
const PATH_ICONS: Record<string, string> = {
  "bellstrike-splendor": "https://static0.fextralifeimages.com/file/wherewindsmeet/8/8a/Bellstrike-splendor.png",
  "bellstrike-umbra":    "https://static0.fextralifeimages.com/file/wherewindsmeet/b/b6/Bellstrike-umbra.png",
  "silkbind-deluge":     "https://static0.fextralifeimages.com/file/wherewindsmeet/6/6b/Silkbind-deluge.png",
  "silkbind-jade":       "https://static0.fextralifeimages.com/file/wherewindsmeet/e/ec/Silkbind-jade.png",
  "bamboocut-wind":      "https://static0.fextralifeimages.com/file/wherewindsmeet/9/9f/Bamboocut-wind.png",
  "stonesplit-might":    "https://static0.fextralifeimages.com/file/wherewindsmeet/d/d1/Stonesplit-might.png",
  "bamboocut-dust":      "https://static0.fextralifeimages.com/file/wherewindsmeet/0/05/Bamboocut-dust-where-winds-meet-wiki-guide.webp",
  "stonesplit-scale":    "https://static0.fextralifeimages.com/file/wherewindsmeet/9/96/Stonesplit-strength-path-where-winds-meet-wiki-guide.webp",
  "bamboocut-kite":      "https://static0.fextralifeimages.com/file/wherewindsmeet/9/9f/Bamboocut-wind.png",
  "stonesplit-awe":      "https://static0.fextralifeimages.com/file/wherewindsmeet/d/d1/Stonesplit-might.png",
  "stonesplit-pure-datang": "https://static0.fextralifeimages.com/file/wherewindsmeet/9/96/Stonesplit-strength-path-where-winds-meet-wiki-guide.webp",
};

const WEAPON_ICONS: Record<string, string> = {
  "everspring-umbrella":  "https://img.game8.co/4430818/297cc2ff59c95b609826c3f16417a977.png/show",
  "unfettered-rope-dart": "https://img.game8.co/4430816/34be69ae243ab24cfd2ef4208913976d.png/show",
  "nameless-sword":       "https://img.game8.co/4331129/77b21e0bf5e89a2b56ec428ad539790e.png/show",
  "nameless-spear":       "https://img.game8.co/4331136/6b761bc6828f99151a4aa642a8a62189.png/show",
  "strategic-sword":      "https://img.game8.co/4331134/8a36324f07a767dfdf96d0a4a44d53e0.png/show",
  "heavenquaker-spear":   "https://img.game8.co/4331140/cb8ca4a2628cfa314f57093b439ddbe8.png/show",
  "infernal-twinblades":  "https://img.game8.co/4331138/86eafaaa238d530270e4e83a468fec0d.png/show",
  "mortal-rope-dart":     "https://img.game8.co/4331135/d8110f837c4c6cc0ec60ad7308af2914.png/show",
  "inkwell-fan":          "https://img.game8.co/4331137/a0072135916f15e728532b63809870fe.png/show",
  "vernal-umbrella":      "https://img.game8.co/4331139/93c90a21eb6db4dc78ab626eeaa897d5.png/show",
  "panacea-fan":          "https://img.game8.co/4331130/238c76e9c24a5e8cdd0696ce15d8bddb.png/show",
  "soulshade-umbrella":   "https://img.game8.co/4331131/18d8da0221d8b6097c9b9b769f210b2b.png/show",
  "stormbreaker-spear":   "https://img.game8.co/4331133/75c9ac76d2976e4f975f6a3ae2168558.png/show",
  "thundercry-blade":     "https://img.game8.co/4331132/6ed777b5efce723ef006466cd0af82b4.png/show",
  "snowparting-blade":    "https://img.game8.co/4379371/9e29ccb3c7098715eb1fcdd70c92b7a1.png/show",
  "phalanxbane-blade":    "https://img.game8.co/4331132/6ed777b5efce723ef006466cd0af82b4.png/show",
};

const BUILD_WEAPONS: Record<string, [string, string]> = {
  "bamboocut-dust":     ["everspring-umbrella", "unfettered-rope-dart"],
  "bamboocut-wind":     ["infernal-twinblades", "mortal-rope-dart"],
  "bellstrike-splendor":["nameless-sword", "nameless-spear"],
  "bellstrike-umbra":   ["strategic-sword", "heavenquaker-spear"],
  "silkbind-jade":      ["inkwell-fan", "vernal-umbrella"],
  "silkbind-deluge":    ["panacea-fan", "soulshade-umbrella"],
  "stonesplit-might":   ["snowparting-blade", "phalanxbane-blade"],
  "stonesplit-scale":   ["snowparting-blade", "phalanxbane-blade"],
  "bamboocut-kite":     ["heavenstrike-gauntlets", "unfettered-rope-dart"],
  "stonesplit-awe":     ["thundercry-blade", "stormbreaker-spear"],
  "stonesplit-pure-datang": ["thundercry-blade", "snowparting-blade"],
};

const CLASS_WEAPONS: Record<string, string[]> = {
  "Bamboocut-Dust": ["Everspring Umbrella", "Unfettered Rope Dart"],
  "Bamboocut-Wind": ["Mortal Rope Dart", "Infernal Twinblades"],
  "Nameless": ["Nameless Sword", "Nameless Spear"],
  "Jade": ["Inkwell Fan", "Vernal Umbrella"],
  "Rocksplit-Might": ["Thundercry Blade", "Stormbreaker Spear"],
  "Nine-Nine": ["Strategic Sword", "Heavenquaker Spear"],
  "Rocksplit-Jun": ["Snowparting Blade", "Phalanxbane Blade"],
  "Pure-Healer": ["Panacea Fan", "Soulshade Umbrella"],
  "Bamboocut-Bird": ["Heavenstrike Gauntlets", "Unfettered Rope Dart"],
};

const PREDEFINED_WEAPONS = [
  { id: "custom", name: "Custom Base Stats (Manual Editing)", min: 1800, max: 3000 },
  { id: "umb-standard-t91", name: "Everspring Umbrella (Tier 91 Basic)", min: 1450, max: 2200 },
  { id: "umb-upgraded-t91", name: "Everspring Umbrella (Tier 91 Grad +10)", min: 1929, max: 4614 },
  { id: "sword-upgraded-t91", name: "Nameless Sword (Tier 91 Grad +10)", min: 2120, max: 4769 },
  { id: "twinblades-upgraded-t91", name: "Infernal Twinblades (Graduation)", min: 1882, max: 5068 },
  { id: "fan-upgraded-t91", name: "Inkwell Fan (Graduation)", min: 1740, max: 4580 },
];

const BUILD_TIPS: Record<string, string[]> = {
  "bamboocut-dust": [
    "🎯 Max Phys ATK → 4046 is the graduation target",
    "🔩 Phys Pen → 51.2% net (panel value - 20 boss resist)",
    "⚡ Crit Rate → need 116%+ panel to cap at 80% eff (÷1.45)",
    "⚠️ Bamboocut ATK contributes ~15-20% of rotation damage",
    "✦ Attuned Bonus: Drunken Spring Skill DMG (Weapon Attuned DMG) — crucial!",
    "🍖 Food buff adds +90/+180 Phys ATK — always use before raids",
  ],
  "bellstrike-umbra": [
    "🎯 Affinity Rate → aim for 58%+ panel to cap 40% eff at T91",
    "⚡ Crit Rate and Affinity Rate both matter for Umbra",
    "✦ Attuned Bonus: Strategic Sword Skill DMG — stack on all gear",
    "⚠️ DO NOT use Eaglerise set if Affinity procs are rare",
  ],
  "stonesplit-might": [
    "🎯 Max Phys ATK → 3500+ target",
    "⚠️ Avoid Attr ATK (Bamboocut/Bellstrike/Silkbind) — useless",
    "⚠️ Max 2 Agility substats — diminishing returns after",
    "🛡 Prioritize survivability over pure DPS for this path",
  ],
};

const STAT_TOOLTIPS: Record<string, string> = {
  minOuter: "Min Physical Attack — affects graze hits and Min ATK floor. When Min > Max, all hits use Min ATK value.",
  maxOuter: "Max Physical Attack — primary DPS stat. Target: 4046 for graduation (Bamboocut-Dust).",
  outerPen: "Physical Penetration. Net pen = panel - boss phys resist (20 at T91). Target net: 31.2%+",
  crit: "Critical Rate. Effective crit = panel ÷ (1 + Judge Resist). At T91: need 116%+ panel for 80% eff cap.",
  aff: "Affinity Rate. Cap: 40% effective. At T91 need ~58% panel.",
  prec: "Precision Rate. Base 65% not reduced by resist. Panel 116% → ~100% effective. Cap = 100%.",
  critDmg: "Critical DMG Bonus. Default base is 50%. Stack after crit rate is capped.",
  affDmg: "Affinity DMG Bonus. Default base is 35%.",
  dcrit: "Direct Critical Rate — bypasses Judgment Resistance entirely. Very efficient stat.",
};

const GRAD_MARKERS = [
  { pct: 80, label: "C", color: "bg-slate-500" },
  { pct: 85, label: "B", color: "bg-lime-600" },
  { pct: 88, label: "A", color: "bg-yellow-500" },
  { pct: 90, label: "S", color: "bg-[#f0b400]" },
  { pct: 100, label: "🎓", color: "bg-emerald-500" },
];


const ATTUNED_BONUS_LABEL: Record<string, string> = {
  "bamboocut-dust": "Drunken Spring: Skill DMG Bonus (Attuned Weapon Bonus)",
  "bamboocut-wind": "Chestnut Wanderer: Rat DMG Bonus (Attuned Weapon Bonus)",
  "bamboocut-kite": "Heavenstrike: Charge Skill DMG Bonus (Attuned Weapon Bonus)",
  "bellstrike-umbra": "Ji Ju Nine Swords: Bleed DMG Bonus (Attuned Weapon Bonus)",
  "bellstrike-splendor": "Nameless Swordplay: Charge Skill DMG Bonus (Attuned Weapon Bonus)",
  "silkbind-jade": "Ninefold Spring: Special Skill DMG Bonus (Attuned Weapon Bonus)",
  "silkbind-deluge": "River Pharmacopoeia: Healing Bonus (Attuned Weapon Bonus)",
  "stonesplit-might": "Ten Directions Array: Charge Skill DMG Bonus (Attuned Weapon Bonus)",
  "stonesplit-awe": "Alas Swordplay: Charge Skill DMG Bonus (Attuned Weapon Bonus)",
  "stonesplit-pure-datang": "Snowparting Blade: Derivation DMG Bonus (Attuned Weapon Bonus)",
};

// Naked character-menu panel ("base trần") for a T91/Lv95 Bamboocut-Dust example,
// taken directly from the in-game Combat Attributes screen. Inner ways are NOT
// included here — they are in-combat buffs added on top in `adjustedPanel`.
const INITIAL_PANEL: PanelStats = {
  minOuter: 1418,
  maxOuter: 2311,
  outerPen: 28.7,
  minPz: 377,
  maxPz: 725,
  pzPen: 18.0,
  pzDmg: 9.0,
  prec: 119.1,
  crit: 115.6,
  aff: 17.0,
  dcrit: 0,
  daff: 0,
  critDmg: 54,
  affDmg: 35,
  outerDmg: 2.8,
  bossDmg: 2.6,
  playerDmg: 0,
  umbAll: 0, umbMartial: 5.1, umbSpecial: 0, umbCharged: 0,
  ropeAll: 0, ropeMartial: 0, ropeSpecial: 0, ropeCharged: 0,
  swordAll: 0, swordMartial: 0, swordSpecial: 0, swordCharged: 0,
  spearAll: 0, spearMartial: 0, spearSpecial: 0, spearCharged: 0,
  fanAll: 0, fanMartial: 0, fanSpecial: 0, fanCharged: 0,
  twinbladesAll: 0, twinbladesMartial: 0, twinbladesSpecial: 0, twinbladesCharged: 0,
  modaoAll: 0, modaoMartial: 0, modaoSpecial: 0, modaoCharged: 0,
  hengdaoAll: 0, hengdaoMartial: 0, hengdaoSpecial: 0, hengdaoCharged: 0,
  gauntletsAll: 0, gauntletsMartial: 0, gauntletsSpecial: 0, gauntletsCharged: 0,
  allArts: 2.4,
  attunedBonus: 0,
  wuxiangMin: 0,
  wuxiangMax: 0,
  set: "stars",
  constitution: 137,
  power: 176,
  defense: 137,
  agility: 295,
  momentum: 137,
  physResGear: 0,
  physDmgReduction: 0,
  groupDmg: 0,
  singleTargetDmg: 0,
  strength: 0,
};

// Base-calibration: the stats a player reads off the in-game Combat Attributes
// screen. applyCalibration stores (these − equipped-gear sub-stats) as the
// per-character gearless base, so the panel matches their real in-game numbers.
// Prefill = the owner's current Bamboocut-Dust in-game panel.
const CALIB_FIELDS: { key: keyof PanelStats; label: string; prefill: number }[] = [
  { key: "minOuter", label: "Min Physical Atk", prefill: 1549 },
  { key: "maxOuter", label: "Max Physical Atk", prefill: 2264 },
  { key: "minPz",    label: "Min Attribute Atk (total, all elements)", prefill: 343 },
  { key: "maxPz",    label: "Max Attribute Atk (total, all elements)", prefill: 725 },
  { key: "outerPen", label: "Physical Pen", prefill: 37.0 },
  { key: "pzPen",    label: "Attr / Formless Pen", prefill: 18.0 },
  { key: "crit",     label: "Critical Rate %", prefill: 122.6 },
  { key: "aff",      label: "Affinity Rate %", prefill: 20.4 },
  { key: "prec",     label: "Precision Rate %", prefill: 112.9 },
  { key: "critDmg",  label: "Crit DMG Bonus %", prefill: 54 },
  { key: "affDmg",   label: "Affinity DMG Bonus %", prefill: 35 },
  { key: "outerDmg", label: "Physical DMG Bonus %", prefill: 2.8 },
  { key: "pzDmg",    label: "Attr Attack DMG Bonus %", prefill: 9.0 },
];

export interface SavedProfile {
  id: string;
  name: string;
  timestamp: string;
  panel: PanelStats;
  gradRate: number;
  dps: number;
}

export interface GearSub {
  type: string;
  val: string;
  isTuned?: boolean;
}

export interface GearItem {
  id: string;
  slot: string;
  name: string;
  quality: "gold" | "purple" | "blue";
  main?: string;  // legacy field, no longer used in new items
  set: string;
  subs: GearSub[];
  mastery?: number;
  isEquipped?: boolean;
  weaponType?: string;
}

export interface Scheme {
  id: string;
  name: string;
  panel: PanelStats;
  gear: GearItem[];
  // Optional per-character calibrated gearless base (= in-game panel − equipped
  // gear sub-stats). When present, computeGearPanel uses it instead of the fixed
  // reference BASE_PANEL_NO_GEAR, so the panel matches the player's real in-game
  // Combat Attributes (their level/breakthrough/talent base differs from the ref).
  baseOverride?: Partial<PanelStats>;
}

export interface Character {
  id: string;
  name: string;
  schemes: Scheme[];
}

export interface CharsData {
  chars: Character[];
  activeCharId: string | null;
  activeSchemeId: string | null;
}

export interface TuneCooldown {
  id: string;
  slot: string;
  itemName: string;
  createdAt: number;
  durationMs: number;
}

const SLOTS = [
  { name: "Umbrella",  icon: <Umbrella  className="w-4 h-4" />, label: "☂" },
  { name: "Rope Dart", icon: <Crosshair className="w-4 h-4" />, label: "✦" },
  { name: "Disc",      icon: <Database  className="w-4 h-4" />, label: "◉" },
  { name: "Pendant",   icon: <Gem       className="w-4 h-4" />, label: "◇" },
  { name: "Helmet",    icon: <HardHat   className="w-4 h-4" />, label: "▲" },
  { name: "Chest",     icon: <Shirt     className="w-4 h-4" />, label: "▣" },
  { name: "Greaves",   icon: <Target    className="w-4 h-4" />, label: "◎" },
  { name: "Bracers",   icon: <Hand      className="w-4 h-4" />, label: "✋" },
];

const SLOT_IMAGES: Record<string, string> = {
  "Umbrella":  "icon/icon1_3.jpg",
  "Rope Dart": "icon/icon1_5.jpg",
  "Disc":      "icon/icon3.jpg",
  "Helmet":    "icon/icon5.jpg",
  "Chest":     "icon/icon6.jpg",
  "Bracers":   "icon/icon8.jpg",
  "Greaves":   "icon/icon7.jpg",
  "Pendant":   "icon/icon4.jpg"
};

const BUILD_WEAPON_TYPES: Record<string, [string, string]> = {
  "bamboocut-dust": ["Umbrella", "Rope Dart"],
  "bellstrike-umbra": ["Sword", "Spear"],
  "bellstrike-splendor": ["Sword", "Spear"],
  "bamboocut-wind": ["Dual Blades", "Rope Dart"],
  "stonesplit-might": ["Hengdao", "Modao"],
  "silkbind-jade": ["Umbrella", "Fan"],
  "silkbind-deluge": ["Umbrella", "Fan"],
  "bamboocut-kite": ["Gauntlets", "Rope Dart"],
  "stonesplit-awe": ["Modao", "Spear"],
  "stonesplit-pure-datang": ["Hengdao", "Modao"],
};

// Weapon display name -> panel-stat key prefix (umbAll/umbMartial/...).
const WEAPON_NAME_TO_PREFIX: Record<string, string> = {
  "Umbrella": "umb", "Rope Dart": "rope", "Sword": "sword", "Spear": "spear",
  "Fan": "fan", "Dual Blades": "twinblades", "Modao": "modao", "Mo Blade": "modao",
  "Hengdao": "hengdao", "Heng Blade": "hengdao", "Gauntlets": "gauntlets",
};

// Panel-stat key prefixes for the two weapons of the given build.
function getBuildWeaponPrefixes(buildKey: string): string[] {
  const names = BUILD_WEAPON_TYPES[buildKey] || [];
  return names.map((n) => WEAPON_NAME_TO_PREFIX[n]).filter(Boolean);
}

// True if a panel-stat key is a weapon-specific boost (umbAll, ropeMartial, ...).
const WEAPON_STAT_KEY_RE = /^(umb|rope|sword|spear|fan|twinblades|modao|hengdao|gauntlets)(All|Martial|Special|Charged)$/;

// Inner-attribute (本系) display name per build family. Bamboocut-Dust uses
// "Bamboocut"; Silkbind / Bellstrike / Stonesplit families use their own.
const INNER_ATTR_BY_BUILD: Record<string, string> = {
  "bamboocut-dust": "Bamboocut", "bamboocut-wind": "Bamboocut", "bamboocut-kite": "Bamboocut",
  "bellstrike-umbra": "Bellstrike", "bellstrike-splendor": "Bellstrike",
  "silkbind-jade": "Silkbind", "silkbind-deluge": "Silkbind",
  "stonesplit-might": "Stonesplit", "stonesplit-awe": "Stonesplit", "stonesplit-pure-datang": "Stonesplit",
};
const innerAttrName = (buildKey: string): string => INNER_ATTR_BY_BUILD[buildKey] || "Bamboocut";

// Short label for an inner-way tier's main stat (shown on the slot). Picks the
// most DPS-relevant field; flat stats (pen/atk) get no %, rates/bonuses do.
const IW_STAT_LABEL: Record<string, [string, boolean]> = {
  dcrit: ["D.Crit", true], daff: ["D.Aff", true], critDmg: ["Crit DMG", true],
  affDmg: ["Aff DMG", true], outerPen: ["Phys Pen", false], pzPen: ["Formless Pen", false],
  outerDmg: ["Phys DMG", true], pzDmg: ["Attr DMG", true], crit: ["Crit", true],
  aff: ["Aff", true], generalDmg: ["DMG", true],
};
const formatIwStat = (stat: Record<string, number>): string => {
  const order = ["dcrit", "daff", "critDmg", "affDmg", "outerPen", "pzPen", "pzDmg", "outerDmg", "crit", "aff", "generalDmg"];
  const key = order.find(k => stat[k]);
  if (!key) return "";
  const [label, isPct] = IW_STAT_LABEL[key];
  return `+${stat[key]}${isPct ? "%" : ""} ${label}`;
};

// Builds whose T91 graduation DPS is estimated (no dedicated Lv95 source row yet).
const ESTIMATED_BUILDS = new Set(["bamboocut-kite", "stonesplit-pure-datang"]);

// WWM_DATA.classes uses an older naming scheme. Map each key to the canonical
// build name (same labels as the main path dropdown) for consistent display.
// Mappings derived from each class's attuned weapon pair (not guessed).
const CLASS_DISPLAY_NAME: Record<string, string> = {
  "Bamboocut-Dust": "Bamboocut-Dust",
  "Bamboocut-Wind": "Bamboocut-Wind",
  "Nameless": "Bellstrike-Splendor",        // Nameless Sword + Nameless Spear
  "Nine-Nine": "Bellstrike-Umbra",          // Strategic Sword + Heavenquaker Spear
  "Jade": "Silkbind-Jade",                  // Inkwell Fan + Vernal Umbrella
  "Pure-Healer": "Silkbind-Deluge (Healer)",// Panacea Fan + Soulshade Umbrella
  "Rocksplit-Jun": "Stonesplit-Might",      // Snowparting + Phalanxbane Blade
  "Rocksplit-Might": "Stonesplit-Awe",      // Thundercry Blade + Stormbreaker Spear
  "Bamboocut-Bird": "Bamboocut-Kite (est.)",// Heavenstrike Gauntlets + Rope Dart
};
const classDisplayName = (key: string): string => CLASS_DISPLAY_NAME[key] || key;

// Verified T91/Lv95 (95下) graduated substat ALLOCATION per path, taken directly
// from the official spreadsheet sheet "各流派历史等级毕业配置" (95级 block,
// 2025.9.1). Each value = number of substats of that type a fully-graduated
// character runs. Keyed by WWM_DATA.classes key.
const GRAD95_COUNTS: Record<string, Record<string, number>> = {
  "Bamboocut-Dust": { agility: 5, power: 0, strength: 10, crit: 7, prec: 3, maxOuter: 12, minOuter: 0, aff: 0, boss: 2, ownWeapon: 1 },
  "Nameless":       { agility: 0, power: 6, strength: 10, crit: 2, prec: 0, maxOuter: 12, minOuter: 0, aff: 7, boss: 2, ownWeapon: 1 },
  "Jade":           { agility: 3, power: 9, strength: 5,  crit: 2, prec: 4, maxOuter: 12, minOuter: 0, aff: 0, boss: 2, ownWeapon: 1 },
  "Rocksplit-Jun":  { agility: 6, power: 0, strength: 8,  crit: 6, prec: 3, maxOuter: 12, minOuter: 0, aff: 0, boss: 2, ownWeapon: 1 },
  "Rocksplit-Might":{ agility: 0, power: 1, strength: 10, crit: 6, prec: 2, maxOuter: 12, minOuter: 4, aff: 1, boss: 2, ownWeapon: 1 },
  "Nine-Nine":      { agility: 0, power: 8, strength: 10, crit: 2, prec: 1, maxOuter: 12, minOuter: 0, aff: 4, boss: 2, ownWeapon: 1 },
  "Bamboocut-Wind": { agility: 3, power: 2, strength: 10, crit: 6, prec: 3, maxOuter: 12, minOuter: 0, aff: 1, boss: 2, ownWeapon: 1 },
  "Pure-Healer":    { agility: 6, power: 0, strength: 8,  crit: 5, prec: 0, maxOuter: 12, minOuter: 8, aff: 0, boss: 0, ownWeapon: 1 },
};

// Max single-substat roll at 95下 (from sheet "各等级模板", 95下 column). Used
// only for the five-attribute (Strength/Power/Agility) gear-progress tiles.
const ROLL_95: Record<string, number> = { strength: 40.4, agility: 40.4, power: 40.4 };

// Max single-substat roll at 95下 keyed by PanelStats field. From sheet
// 各等级模板 (95下 column). Tuned (定音) lines reach the same per-line cap.
// Used by the Cultivate tab's 定音 summary and optimal-allocation analysis.
const MAX_ROLL_95: Partial<Record<keyof PanelStats, number>> = {
  maxOuter: 63.8, minOuter: 63.8,
  crit: 7.4, aff: 3.6, prec: 6.6,
  outerPen: 9.0, pzPen: 10.8,
  maxPz: 36.2, minPz: 36.2,
  strength: 40.4, agility: 40.4, power: 40.4,
  bossDmg: 2.6, allArts: 2.6,
  umbMartial: 5.0, ropeMartial: 5.0, swordMartial: 5.0, spearMartial: 5.0,
  fanMartial: 5.0, twinbladesMartial: 5.0, modaoMartial: 5.0, hengdaoMartial: 5.0,
  gauntletsMartial: 5.0,
};

// VERIFIED full graduated PANEL per path at 95下 (T91 Global), from sheet
// 各流派历史等级毕业配置 (95级 block). These are the real "caps" — the total
// panel a fully-graduated character reaches (e.g. Max Phys ≈ 3010, not a
// substat sum). Decimal fields (crit/aff/prec/ownWeapon/boss/allWeapon) are
// fractions → ×100 for %. Keyed by WWM_DATA.classes key.
const GRAD95_PANEL: Record<string, Record<string, number>> = {
  "Bamboocut-Dust": { minOuter: 1372.1, maxOuter: 3010.3, prec: 1.138, crit: 1.1546, aff: 0.15205, minPz: 306.6, maxPz: 549, outerPen: 41.1, pzPen: 16.8, ownWeapon: 0.052, boss: 0.052, allWeapon: 0 },
  "Nameless":       { minOuter: 985.8,  maxOuter: 3332.4, prec: 1.006, crit: 0.4851, aff: 0.574218, minPz: 284.9, maxPz: 570.7, outerPen: 36, pzPen: 16.8, ownWeapon: 0.052, boss: 0.052, allWeapon: 0 },
  "Jade":           { minOuter: 1218.1, maxOuter: 3119.7, prec: 1.138, crit: 0.797212, aff: 0.311866, minPz: 283.3, maxPz: 567.7, outerPen: 46.2, pzPen: 10.8, ownWeapon: 0.052, boss: 0.052, allWeapon: 0.16 },
  "Rocksplit-Jun":  { minOuter: 1334.2, maxOuter: 2945.7, prec: 1.138, crit: 1.106324, aff: 0.15205, minPz: 284.9, maxPz: 570.7, outerPen: 36, pzPen: 16.8, ownWeapon: 0.052, boss: 0.052, allWeapon: 0 },
  "Rocksplit-Might":{ minOuter: 1344.2, maxOuter: 3072.3, prec: 1.171, crit: 0.817804, aff: 0.215754, minPz: 286.1, maxPz: 573.1, outerPen: 36, pzPen: 16.8, ownWeapon: 0.052, boss: 0.052, allWeapon: 0.026 },
  "Nine-Nine":      { minOuter: 993.2,  maxOuter: 3420.7, prec: 1.006, crit: 0.4521, aff: 0.544866, minPz: 286.1, maxPz: 573.1, outerPen: 36, pzPen: 16.8, ownWeapon: 0.052, boss: 0.052, allWeapon: 0 },
  "Bamboocut-Wind": { minOuter: 1275.7, maxOuter: 3358.0, prec: 1.138, crit: 0.990212, aff: 0.273754, minPz: 196, maxPz: 320, outerPen: 36, pzPen: 16.8, ownWeapon: 0.052, boss: 0.052, allWeapon: 0 },
  "Pure-Healer":    { minOuter: 1830.0, maxOuter: 2891.8, prec: 0.94, crit: 1.115324, aff: 0.15205, minPz: 196.2, maxPz: 320, outerPen: 41.1, pzPen: 10.8, ownWeapon: 0.052, boss: 0, allWeapon: 0 },
};

const WEAPON_ICON_MAP: Record<string, string> = {
  "Sword": "icon/icon1_1.jpg",
  "Spear": "icon/icon1_2.jpg",
  "Umbrella": "icon/icon1_3.jpg",
  "Fan": "icon/icon1_4.jpg",
  "Rope Dart": "icon/icon1_5.jpg",
  "Dual Blades": "icon/icon1_6.jpg",
  "Modao": "icon/icon1_7.jpg",
  "Hengdao": "icon/icon1_8.jpg",
  "Gauntlets": "icon/icon1_9.jpg",
};

function getWeaponIconUrlByType(weaponType: string | undefined, fallbackSlot: string, buildKey: string): string {
  if (weaponType && WEAPON_ICON_MAP[weaponType]) {
    return WEAPON_ICON_MAP[weaponType];
  }
  const defaultTypes = BUILD_WEAPON_TYPES[buildKey] || ["Umbrella", "Rope Dart"];
  const defaultType = fallbackSlot === "Umbrella" ? defaultTypes[0] : defaultTypes[1];
  return WEAPON_ICON_MAP[defaultType] || SLOT_IMAGES[fallbackSlot];
}

// Gradient colors per armor set (used for Equipped Slots icon badges since no
// verified per-piece CDN images exist for armor — keeps each set visually
// distinct without fabricating image URLs)
const SET_BADGE_COLORS: Record<string, string> = {
  // Weapon / accessory sets
  "stars":         "from-[#f0b400] to-yellow-700",
  "eaglerise":     "from-sky-500 to-blue-700",
  "jadeware":      "from-emerald-400 to-green-700",
  "ivorybloom":    "from-pink-400 to-rose-700",
  "shakenhill":    "from-stone-400 to-stone-700",
  "swallowreturn": "from-orange-400 to-orange-700",
  "swiftgale":     "from-cyan-300 to-sky-600",
  "swallowcall":   "from-teal-400 to-teal-700",
  "mistwillow":    "from-lime-400 to-green-700",
  "rainwhisper":   "from-indigo-400 to-blue-800",
  // Armor sets
  "stormrain":     "from-teal-400 to-cyan-700",
  "formbend":      "from-[#e6c200] to-yellow-900",
  "moonflare":     "from-purple-400 to-violet-700",
  "obsidian":      "from-slate-800 to-slate-950",
  "beyondchill":   "from-blue-300 to-cyan-600",
  "whirlsnow":     "from-white to-slate-400",
  "calmwaters":    "from-blue-500 to-blue-800",
  "jadeembrace":   "from-emerald-700 to-teal-900",
  "agilesteps":    "from-yellow-500 to-orange-700",
  "flawlessdef":   "from-yellow-200 to-[#f0b400]",
  "ironweave":     "from-slate-400 to-slate-700",
  // Bow/Ring sets
  "pursuing":      "from-purple-400 to-violet-700",
  "plume":         "from-cyan-400 to-blue-600",
  "string":        "from-indigo-500 to-purple-800",
  "none":          "from-slate-600 to-slate-800",
};

const DEFAULT_GEAR: GearItem[] = [
  { id:"g1", slot:"Umbrella", name:"Swiftwing Cloud Umbrella", quality:"gold", set:"stars",
    subs:[{type:"Max Phys Atk",val:"59.2"},{type:"Max Phys Atk",val:"63.8"},{type:"Umbrella Bonus",val:"5.1%"},{type:"Min Phys Atk",val:"62.9"},{type:"Crit Rate",val:"7.4%"},{type:"Phys Pen",val:"7.4"}]},
  { id:"g2", slot:"Rope Dart", name:"Swiftwing Charm", quality:"gold", set:"stars",
    subs:[{type:"Min Phys Atk",val:"56.2"},{type:"Max Phys Atk",val:"59.9"},{type:"Min Phys Atk",val:"61.7"},{type:"Max Bamboocut Atk",val:"35.0"},{type:"Crit Rate",val:"7.4%"},{type:"Phys Pen",val:"6.4"}]},
  { id:"g3", slot:"Pendant", name:"Swiftwing Pendant", quality:"gold", set:"stars",
    subs:[{type:"Max Phys Atk",val:"49.9"},{type:"Max Phys Atk",val:"58.3"},{type:"Min Phys Atk",val:"63.8",isTuned:true},{type:"Crit Rate",val:"6.8%"},{type:"Phys Pen",val:"8.6"}]},
  { id:"g4", slot:"Helmet", name:"Nightfarer Crown", quality:"gold", set:"stormrain",
    subs:[{type:"Crit Rate",val:"7.0%"},{type:"Crit Rate",val:"7.1%"},{type:"Min Phys Atk",val:"63.8",isTuned:true},{type:"Max Bamboocut Atk",val:"33.4"},{type:"Max Phys Atk",val:"62.7"},{type:"Umbrella Bonus",val:"4.8%"}]},
  { id:"g5", slot:"Chest", name:"Nightfarer Armor", quality:"gold", set:"stormrain",
    subs:[{type:"Precision",val:"6.3%"},{type:"Max Bamboocut Atk",val:"34.8"},{type:"Min Bamboocut Atk",val:"35.4"},{type:"Crit Rate",val:"7.4%",isTuned:true},{type:"Max Phys Atk",val:"59.7"},{type:"Umbrella Bonus",val:"4.8%"}]},
  { id:"g6", slot:"Greaves", name:"Nightfarer Night Leg Armor", quality:"purple", set:"stormrain",
    subs:[{type:"Crit Rate",val:"6.8%"},{type:"Max Phys Atk",val:"63.8",isTuned:true},{type:"Precision",val:"6.6%"},{type:"Crit Rate",val:"6.9%"},{type:"Min Bamboocut Atk",val:"33.7"},{type:"Umbrella Bonus",val:"4.5%"}]},
  { id:"g7", slot:"Bracers", name:"Nightfarer Bracers", quality:"purple", set:"stormrain",
    subs:[{type:"Crit Rate",val:"7.2%"},{type:"Max Bamboocut Atk",val:"36.2"},{type:"Min Phys Atk",val:"63.8",isTuned:true},{type:"Crit Rate",val:"7.3%"},{type:"Max Phys Atk",val:"59.8"},{type:"Umbrella Bonus",val:"5.0%"}]},
  { id:"g8", slot:"Disc", name:"Swiftwing Disc", quality:"gold", set:"stars",
    subs:[{type:"Min Phys Atk",val:"56.2"},{type:"Max Phys Atk",val:"59.9"},{type:"Min Phys Atk",val:"61.7",isTuned:true},{type:"Crit Rate",val:"6.8%"},{type:"Phys Pen",val:"8.6"}]},
];

const SUB_MAP: Record<string, keyof PanelStats> = {
  "Max Phys Atk": "maxOuter",
  "Min Phys Atk": "minOuter", 
  "Phys Pen": "outerPen",
  "Crit Rate": "crit",
  "Crit DMG": "critDmg",
  "Affinity Rate": "aff",
  "Affinity DMG": "affDmg",
  "Precision": "prec",
  "Max Bamboocut Atk": "maxPz",
  "Min Bamboocut Atk": "minPz",
  "Formless Penetration": "pzPen",
  "Formless Pen": "pzPen",
  "Attr Pen": "pzPen",
  "Bamboocut DMG%": "pzDmg",
  "Art of Umbrella Boost": "umbAll",
  "Umb Martial Art Skill DMG Boost": "umbMartial",
  "Umb Special Skill DMG Boost": "umbSpecial",
  "Umb Charged Skill DMG Boost": "umbCharged",
  "Umbrella Bonus": "umbMartial",
  "Umb Martial": "umbMartial",
  "Umb Special": "umbSpecial",
  "Umb Charged": "umbCharged",
  "Art of Rope Dart Boost": "ropeAll",
  "Rope Dart Martial Art Skill DMG Boost": "ropeMartial",
  "Rope Dart Special Skill DMG Boost": "ropeSpecial",
  "Rope Dart Charged Skill DMG Boost": "ropeCharged",
  "Rope Dart Bonus": "ropeMartial",
  "Rope Martial": "ropeMartial",
  "Rope Special": "ropeSpecial",
  "Rope Charged": "ropeCharged",
  "Art of Sword Boost": "swordAll",
  "Sword Martial Art Skill DMG Boost": "swordMartial",
  "Sword Special Skill DMG Boost": "swordSpecial",
  "Sword Charged Skill DMG Boost": "swordCharged",
  "Sword Bonus": "swordMartial",
  "Sword Martial": "swordMartial",
  "Sword Special": "swordSpecial",
  "Sword Charged": "swordCharged",
  "Art of Spear Boost": "spearAll",
  "Spear Martial Art Skill DMG Boost": "spearMartial",
  "Spear Special Skill DMG Boost": "spearSpecial",
  "Spear Charged Skill DMG Boost": "spearCharged",
  "Spear Bonus": "spearMartial",
  "Spear Martial": "spearMartial",
  "Spear Special": "spearSpecial",
  "Spear Charged": "spearCharged",
  "Art of Fan Boost": "fanAll",
  "Fan Martial Art Skill DMG Boost": "fanMartial",
  "Fan Special Skill DMG Boost": "fanSpecial",
  "Fan Charged Skill DMG Boost": "fanCharged",
  "Fan Bonus": "fanMartial",
  "Fan Martial": "fanMartial",
  "Fan Special": "fanSpecial",
  "Fan Charged": "fanCharged",
  "Art of Dual Blades Boost": "twinbladesAll",
  "Dual Blades Martial Art Skill DMG Boost": "twinbladesMartial",
  "Dual Blades Special Skill DMG Boost": "twinbladesSpecial",
  "Dual Blades Charged Skill DMG Boost": "twinbladesCharged",
  "Twinblades Bonus": "twinbladesMartial",
  "Twinblades Martial": "twinbladesMartial",
  "Twinblades Special": "twinbladesSpecial",
  "Twinblades Charged": "twinbladesCharged",
  "Art of Mo Blade Boost": "modaoAll",
  "Mo Blade Martial Art Skill DMG Boost": "modaoMartial",
  "Mo Blade Special Skill DMG Boost": "modaoSpecial",
  "Mo Blade Charged Skill DMG Boost": "modaoCharged",
  "Modao Bonus": "modaoMartial",
  "Modao Martial": "modaoMartial",
  "Modao Special": "modaoSpecial",
  "Modao Charged": "modaoCharged",
  "Art of Heng Blade Boost": "hengdaoAll",
  "Heng Blade Martial Art Skill DMG Boost": "hengdaoMartial",
  "Heng Blade Special Skill DMG Boost": "hengdaoSpecial",
  "Heng Blade Charged Skill DMG Boost": "hengdaoCharged",
  "Hengdao Bonus": "hengdaoMartial",
  "Hengdao Martial": "hengdaoMartial",
  "Hengdao Special": "hengdaoSpecial",
  "Hengdao Charged": "hengdaoCharged",
  "Art of Gauntlets Boost": "gauntletsAll",
  "Gauntlets Martial Art Skill DMG Boost": "gauntletsMartial",
  "Gauntlets Special Skill DMG Boost": "gauntletsSpecial",
  "Gauntlets Charged Skill DMG Boost": "gauntletsCharged",
  "Gauntlets Bonus": "gauntletsMartial",
  "Gauntlets Martial": "gauntletsMartial",
  "Gauntlets Special": "gauntletsSpecial",
  "Gauntlets Charged": "gauntletsCharged",
  "All Martial Arts": "allArts",
  "Phys DMG%": "outerDmg",
  "Boss DMG%": "bossDmg",
  "Player DMG%": "playerDmg",
  "HP": "constitution",
  "Power": "power",
  "Strength": "strength",
  "Defense": "defense",
  "Agility": "agility",
  "Momentum": "momentum",
  "Max Silkbind Atk": "maxPz",
  "Min Silkbind Atk": "minPz",
  "Silkbind DMG%": "pzDmg",
  "Max Bellstrike Atk": "maxPz",
  "Min Bellstrike Atk": "minPz",
  "Bellstrike DMG%": "pzDmg",
  "Max Stonesplit Atk": "maxPz",
  "Min Stonesplit Atk": "minPz",
  "Stonesplit DMG%": "pzDmg",
  "Bamboocut Pen": "pzPen",
  "Silkbind Pen": "pzPen",
  "Bellstrike Pen": "pzPen",
  "Stonesplit Pen": "pzPen",
  "Phys Resist": "physResGear",
  "Phys DMG Reduction": "physDmgReduction",
  "Direct Crit": "dcrit",
  "Area Mystic Skill DMG": "groupDmg",
  "Single-Target Mystic DMG": "singleTargetDmg",
  "Group Anomaly DMG": "groupDmg",       // compat alias (old name)
  "Single Target DMG": "singleTargetDmg", // compat alias (old name)
};

const COMPAT_ALIASES = [
  "Umbrella Bonus","Rope Dart Bonus","Sword Bonus","Spear Bonus","Fan Bonus",
  "Twinblades Bonus","Modao Bonus","Hengdao Bonus","Gauntlets Bonus",
  "Umb Martial","Rope Martial","Sword Martial","Spear Martial","Fan Martial",
  "Twinblades Martial","Modao Martial","Hengdao Martial","Gauntlets Martial",
  "Umb Special","Umb Charged","Rope Special","Rope Charged",
  "Sword Special","Sword Charged","Spear Special","Spear Charged",
  "Fan Special","Fan Charged","Twinblades Special","Twinblades Charged",
  "Modao Special","Modao Charged","Hengdao Special","Hengdao Charged",
  "Gauntlets Special","Gauntlets Charged",
  "Group Anomaly DMG","Single Target DMG",
  // Formless Penetration is the single canonical pen substat (patch 4.30).
  // Old element-pen names + "Attr Pen"/"Formless Pen" stay as hidden aliases
  // so saved gear still maps, but only "Formless Penetration" shows in the picker.
  "Formless Pen","Attr Pen",
  "Bamboocut Pen","Silkbind Pen","Bellstrike Pen","Stonesplit Pen",
];

// Inner-Way-only combat stats: they exist on the panel (fed by Inner Way
// Breakthrough) but are NOT rollable gear substats, so they must not appear in
// the gear sub-stat picker. Per in-game Combat Attributes: Crit DMG Bonus,
// Affinity DMG Bonus, Direct Crit Rate, Direct Affinity Rate all read
// "How to Obtain: Inner Way Breakthrough".
const INNER_WAY_ONLY_SUBS = ["Crit DMG", "Affinity DMG", "Direct Crit", "Direct Affinity"];

function buildSubStatOptions(): { value: string; label: string; group?: string }[] {
  const weaponGroups: Record<string, string> = {
    "Art of Umbrella": "Umbrella", "Art of Rope Dart": "Rope Dart",
    "Art of Sword": "Sword", "Art of Spear": "Spear", "Art of Fan": "Fan",
    "Art of Dual Blades": "Dual Blades", "Art of Mo Blade": "Mo Blade",
    "Art of Heng Blade": "Heng Blade", "Art of Gauntlets": "Gauntlets",
  };
  const opts: { value: string; label: string; group?: string }[] = [
    { value: "Other", label: "Select stat / Empty" },
  ];
  for (const k of Object.keys(SUB_MAP)) {
    if (COMPAT_ALIASES.includes(k)) continue;
    if (INNER_WAY_ONLY_SUBS.includes(k)) continue;
    let group: string | undefined;
    for (const [prefix, gName] of Object.entries(weaponGroups)) {
      if (k.startsWith(prefix)) { group = gName; break; }
    }
    if (!group && (k.endsWith("Martial Art Skill DMG Boost") || k.endsWith("Special Skill DMG Boost") || k.endsWith("Charged Skill DMG Boost"))) {
      const wName = k.replace(/ (Martial Art|Special|Charged) Skill DMG Boost$/, "");
      for (const [, gName] of Object.entries(weaponGroups)) {
        if (gName === wName || (wName === "Umb" && gName === "Umbrella")) { group = gName; break; }
      }
      if (!group) group = "Weapon";
    }
    if (k === "All Martial Arts") group = "Weapon";
    if (!group) {
      if (["Min Outer ATK","Max Outer ATK","Outer Pen","Outer DMG Bonus"].includes(k)) group = "Outer";
      else if (k.startsWith("Min Pz") || k.startsWith("Max Pz") || k.startsWith("Pz")) group = "Attribute";
      else if (["Crit","Direct Crit","Crit DMG","Affinity","Affinity DMG","Precision"].includes(k)) group = "Crit/Aff";
      else group = "Other";
    }
    opts.push({ value: k, label: k, group });
  }
  return opts;
}

const SUB_STAT_OPTIONS = buildSubStatOptions();

// --- Gear-driven panel engine -------------------------------------------------
// Parses a gear sub-stat display value like "59.2", "5.1%", "1.8% (set)" into a number.
const parseSubValue = (val: string): number => {
  const m = val.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

// Sums all sub-stat values from a gear list into PanelStats keys via SUB_MAP.
const sumGearSubs = (gear: GearItem[]): Partial<Record<keyof PanelStats, number>> => {
  const sums: Partial<Record<keyof PanelStats, number>> = {};
  gear.forEach(item => {
    item.subs.forEach(sub => {
      const key = SUB_MAP[sub.type];
      if (!key) return;
      const v = parseSubValue(sub.val);
      sums[key] = (sums[key] || 0) + v;
    });
  });
  return sums;
};

// Back-calculated "no-gear" base panel: INITIAL_PANEL minus the contribution of
// DEFAULT_GEAR's sub-stats, for every stat that SUB_MAP can derive from gear.
// By construction, computeGearPanel(DEFAULT_GEAR) === INITIAL_PANEL exactly.
const BASE_PANEL_NO_GEAR: PanelStats = (() => {
  const defaultSum = sumGearSubs(DEFAULT_GEAR);
  const base = { ...INITIAL_PANEL };
  (Object.keys(defaultSum) as (keyof PanelStats)[]).forEach(k => {
    (base[k] as number) = (base[k] as number) - (defaultSum[k] || 0);
  });
  return base;
})();

// Computes the full panel for an equipped gear list: base (no-gear) stats + sum
// of all sub-stats across the 8 equipped items, mapped via SUB_MAP. Fields not
// covered by SUB_MAP (set, attunedBonus, dcrit, daff, wuxiang*, bossDmg, etc.)
// are carried over from `current` unchanged.
const computeGearPanel = (current: PanelStats, gear: GearItem[], baseOverride?: Partial<PanelStats> | null, ownElement?: string): PanelStats => {
  const gearSum = sumGearSubs(gear);
  const next = { ...current };
  (Object.values(SUB_MAP) as (keyof PanelStats)[]).forEach(key => {
    // Use the player's calibrated gearless base when available, else the fixed ref.
    const base = (baseOverride && baseOverride[key] !== undefined)
      ? (baseOverride[key] as number)
      : (BASE_PANEL_NO_GEAR[key] as number);
    (next[key] as number) = base + (gearSum[key] || 0);
  });
  // Weapon-skill and situational DMG boosts come ONLY from gear sub-stats — they
  // have no character/level base — so their gearless base MUST be 0. Otherwise a
  // build with fewer of those sub-stats than the reference build gets a wrong,
  // often NEGATIVE value (Best Build picking gear with less "Umb Martial Art
  // Boost" produced umbMartial = -9.3%, tanking DPS). Recompute as the pure gear
  // sum so they're always correct for any gear combo.
  const isGearOnlyBoost = (k: string) =>
    /(?:All|Martial|Special|Charged)$/.test(k) ||
    ["allArts", "bossDmg", "playerDmg", "singleTargetDmg", "groupDmg", "physResGear", "physDmgReduction"].includes(k);
  (Object.keys(next) as (keyof PanelStats)[]).forEach(key => {
    if (isGearOnlyBoost(key as string)) (next[key] as number) = (gearSum[key] || 0);
  });
  // (Five-attribute 五维 → crit/aff/atk conversion was removed: it ran on the
  // gear-summed attribute totals, which double-count vs the in-game panel because
  // INITIAL_PANEL is an in-game TOTAL used as the gearless base. Proper handling
  // comes with the base-calibration feature.)
  // Direct Crit/Affinity are NOT character-menu/gear stats — they come only from
  // Inner Ways (added later via iwStats) or the <50% HP script buff. Force them
  // to 0 in the gear base so any stale value baked into a saved panel can't leak
  // a phantom "+4.6%" when no inner way is equipped.
  next.dcrit = 0;
  next.daff = 0;
  // Off-element (外系) attribute-attack sub-stats: those whose element differs
  // from the build's own element. Tracked so the calc can apply the physical
  // ratio to them (Excel 伤害公式 B6: 外系元素倍率 = 外攻倍率) instead of the
  // own-element ×1.5 ratio. Pure gear sum — no character base.
  const ownEl = ownElement || "Bamboocut";
  let offMin = 0, offMax = 0;
  gear.forEach(it => it.subs.forEach(s => {
    const m = s.type.match(/^(Min|Max) (Bamboocut|Silkbind|Bellstrike|Stonesplit) Atk$/);
    if (m && m[2] !== ownEl) {
      const v = parseSubValue(s.val);
      if (m[1] === "Min") offMin += v; else offMax += v;
    }
  }));
  next.offPzMin = offMin;
  next.offPzMax = offMax;
  return next;
};

// Load/import guard: a calibration baseOverride poisoned by an extra-digit typo
// (e.g. 1362 entered as 13622) silently inflates DPS/graduation to absurd values.
// Drop the bad override so the panel auto-recomputes from gear. A small Min > Max
// is a legit (rare) in-game state, so only treat Min > 2×Max as corruption.
const sanitizeChars = <T,>(data: T): T => {
  (data as { chars?: { schemes?: { baseOverride?: Partial<PanelStats> }[] }[] })?.chars?.forEach(c =>
    c?.schemes?.forEach(s => {
      const b = s?.baseOverride;
      if (b && ((b.minOuter ?? 0) > (b.maxOuter ?? 0) * 2 || (b.minPz ?? 0) > (b.maxPz ?? 0) * 2)) delete s.baseOverride;
    }),
  );
  return data;
};
// ---------------------------------------------------------------------------

const BUILD_PROFILES = {
  "bamboocut-dust": {
    label: "Bamboocut-Dust", weapons: "Everspring Umbrella + Unfettered Rope Dart",
    tier: "T0 AoE", color: "text-[#f0b400]",
    gradTargets: { maxOuter: 3050, minOuter: 1340, outerPen: 42.0, crit: 116.9, aff: 14.7, critDmg: 54 },
    notes: "T91 Global graduation target. Priority: Max Phys ATK → Phys Pen → Bamboocut ATK. Crit ~116%+ panel to cap at 80% eff.",
    priorityStats: ["maxOuter","outerPen","crit","critDmg","maxPz","umbMartial"],
  },
  "bellstrike-umbra": {
    label: "Bellstrike-Umbra", weapons: "Strategic Sword + Heavenquaker Spear",
    tier: "T0 Single", color: "text-indigo-400",
    gradTargets: { maxOuter: 3160, minOuter: 1425, outerPen: 37.0, crit: 95.4, aff: 71.6, critDmg: 60 },
    notes: "Priority: Affinity Rate → Max Phys ATK → Crit DMG. Aff cap = 40% eff (need ~58% panel at T91).",
    priorityStats: ["aff","affDmg","maxOuter","crit","outerPen"],
  },
  "bellstrike-splendor": {
    label: "Bellstrike-Splendor", weapons: "Nameless Sword + Nameless Spear",
    tier: "T1 Easy", color: "text-blue-400",
    gradTargets: { maxOuter: 2830, minOuter: 1185, outerPen: 32.5, crit: 54.4, aff: 43.5, critDmg: 45 },
    notes: "T91 Global. Priority: Max Phys ATK → Crit Rate → Affinity Rate. Forgiving build for beginners.",
    priorityStats: ["maxOuter","crit","aff","outerPen","critDmg"],
  },
  "bamboocut-wind": {
    label: "Bamboocut-Wind", weapons: "Infernal Twinblades + Mortal Rope Dart",
    tier: "T0 AoE", color: "text-orange-400",
    gradTargets: { maxOuter: 1800, minOuter: 800, outerPen: 40.0, crit: 108.8, aff: 14.5, critDmg: 50 },
    notes: "Priority: Bamboocut ATK → Phys Pen → Crit Rate. Different scaling from Bamboocut-Dust.",
    priorityStats: ["maxPz","pzPen","maxOuter","crit","outerPen"],
  },
  "stonesplit-might": {
    label: "Stonesplit-Might", weapons: "Snowparting Blade + Phalanxbane Blade",
    tier: "T1 Tank", color: "text-stone-400",
    gradTargets: { maxOuter: 2610, minOuter: 1105, outerPen: 30.5, crit: 81.2, aff: 21.75, critDmg: 45 },
    notes: "Priority: Max Phys ATK → Crit Rate → Phys Pen. Avoid Attr ATK stats (useless for this path).",
    priorityStats: ["maxOuter","crit","outerPen","critDmg","allArts"],
  },
  "silkbind-jade": {
    label: "Silkbind-Jade", weapons: "Vernal Umbrella + Inkwell Fan",
    tier: "T1 Ranged", color: "text-teal-400",
    gradTargets: { maxOuter: 2990, minOuter: 1345, outerPen: 35.5, crit: 107.6, aff: 43.5, critDmg: 50 },
    notes: "Priority: Max Phys ATK → Bamboocut ATK → Crit Rate → Affinity Rate.",
    priorityStats: ["maxOuter","crit","aff","affDmg","outerPen","umbMartial"],
  },
  "silkbind-deluge": {
    label: "Silkbind-Deluge (Healer)", weapons: "Panacea Fan + Soulshade Umbrella",
    tier: "T1 Healer", color: "text-emerald-400",
    gradTargets: { maxOuter: 2090, minOuter: 950, outerPen: 24.5, crit: 43.5, aff: 29.0, critDmg: 40 },
    notes: "Focus on healing power > personal DPS. Do NOT chase Bamboocut ATK or high pen.",
    priorityStats: ["maxOuter","crit","aff","outerPen","allArts"],
  },
  "bamboocut-kite": {
    label: "Bamboocut-Kite (beta · not in Global yet)", weapons: "Heavenstrike Gauntlets + Unfettered Rope Dart",
    tier: "T0 AoE", color: "text-[#f0b400]",
    gradTargets: { maxOuter: 2830, minOuter: 1185, outerPen: 36.5, crit: 116.9, aff: 14.7, critDmg: 54 },
    notes: "Priority: Max Phys ATK → Bamboocut ATK → Phys Pen. Gauntlets + Rope Dart.",
    priorityStats: ["maxOuter","outerPen","crit","critDmg","maxPz","ropeMartial"],
  },
  "stonesplit-awe": {
    label: "Stonesplit-Awe", weapons: "Thundercry Blade + Stormbreaker Spear",
    tier: "T0 Tank", color: "text-red-500",
    gradTargets: { maxOuter: 2910, minOuter: 1270, outerPen: 34.0, crit: 90.0, aff: 30.0, critDmg: 50 },
    notes: "Priority: Max Phys ATK → Crit Rate → Phys Pen. Modao + Spear.",
    priorityStats: ["maxOuter","crit","outerPen","critDmg","allArts"],
  },
  "stonesplit-pure-datang": {
    label: "Stonesplit-Pure Datang", weapons: "Thundercry Blade + Snowparting Blade",
    tier: "T0 Single", color: "text-rose-600",
    gradTargets: { maxOuter: 3135, minOuter: 1425, outerPen: 40.5, crit: 100.0, aff: 20.0, critDmg: 55 },
    notes: "Priority: Max Phys ATK → Crit Rate → Phys Pen. Hengdao + Modao.",
    priorityStats: ["maxOuter","crit","outerPen","critDmg","allArts"],
  },
};

const SET_EMOJI: Record<string, string> = {
  // Offensive sets
  "stars":         "⭐",  // Stars Align
  "eaglerise":     "🦅",  // Hawkwing
  "jadeware":      "💚",  // Jadeware
  "ivorybloom":    "🌸",  // Ivorybloom
  "shakenhill":    "🗡️",  // Shattered Ridge
  "swallowreturn": "🕊️",  // Swaying Heights
  "swiftgale":     "💨",  // Swift Gale
  "swallowcall":   "🐦",  // Swallowcall
  "mistwillow":    "🌿",  // Mistwillow
  "stormrain":     "🌧️",  // Eaglerise
  "obsidian":      "🖤",  // Obsidian Armor
  // Defensive sets
  "moonflare":     "🌙",  // Moonflare
  "rainwhisper":   "💧",  // Rainwhisper
  "formbend":      "🛡️",  // Formbend
  "calmwaters":    "🌊",  // Calmwaters
  "beyondchill":   "❄️",  // Beyond the Chill
  "whirlsnow":     "⛄",  // Whirlsnow
  "jadeembrace":   "🐉",  // Jade Embrace
  "agilesteps":    "👟",  // Agile Steps
  "flawlessdef":   "⚜️",  // Flawless Defense
  "ironweave":     "🔗",  // Ironweave
  // Bow/Ring sets
  "pursuing":      "👥",  // Pursuing Shadow
  "plume":         "🪶",  // Plume
  "string":        "🪕",  // Startling String
  "none":          "🔹",
};

const getSetName = (setKey: string): string => {
  if (setKey === "pursuing") return "Pursuing Shadow";
  if (setKey === "plume") return "Plume";
  if (setKey === "string") return "Startling String";
  if (setKey === "none") return "No Set / Mixed";
  return ARMOR_SETS[setKey as keyof typeof ARMOR_SETS]?.name || setKey;
};

const getSlotLabel = (slotName: string): string => {
  if (slotName === "Umbrella") return "Weapon 1";
  if (slotName === "Rope Dart") return "Weapon 2";
  return slotName;
};

// Sets available per slot category (from in-game Switch Set screens)
const WEAPON_SET_KEYS = [
  "stars","jadeware","ivorybloom","shakenhill",
  "swallowreturn","swiftgale","swallowcall","mistwillow","stormrain","none"
];
const ARMOR_SET_KEYS = [
  "stormrain","eaglerise","formbend","moonflare","obsidian","beyondchill",
  "whirlsnow","calmwaters","jadeembrace","agilesteps","flawlessdef","ironweave","none"
];

const getSetOptionsForSlot = (slot: string) => {
  if (slot === "Umbrella" || slot === "Rope Dart" || slot === "Pendant" || slot === "Disc") {
    // Weapon / accessory sets
    return WEAPON_SET_KEYS.map(k => ({ key: k, name: ARMOR_SETS[k as keyof typeof ARMOR_SETS]?.name || k }));
  }
  if (slot === "Bow/Ring") {
    return [
      { key: "pursuing", name: "Pursuing Shadow" },
      { key: "plume", name: "Plume" },
      { key: "string", name: "Startling String" },
      { key: "none", name: "No Set / Mixed" }
    ];
  }
  // Armor slots (Helmet/Chest/Greaves/Bracers) → armor sets
  return ARMOR_SET_KEYS.map(k => ({ key: k, name: ARMOR_SETS[k as keyof typeof ARMOR_SETS]?.name || k }));
};

// ⚠️ stat2pc values marked with (~) are estimates pending T91 verification.
// Stars Align +64 minOuter confirmed by user. All others approximate.
const ARMOR_SETS = {
  // ── Offensive (DPS-relevant 2pc stats) ──────────────────────────────────
  "stars": {
    name: "Stars Align",
    stat2pc: { minOuter: 64 },           // ✅ confirmed T91
    desc2pc: "2/4: Min Physical ATK +64",
    desc4pc: "4/4: Hit boss or 2+ enemies → Stars Align stack (+3% Martial Art Skill DMG / stack, 5s, max 5 stacks = +15%). Stack lost on hit.",
    recommended: ["bamboocut-dust", "bamboocut-kite"],
  },
  "eaglerise": {
    name: "Hawkwing",
    stat2pc: { aff: 3.7 },               // ✅ confirmed T91
    desc2pc: "2/4: +3.7% Affinity Rate",
    desc4pc: "4/4: Affinity DMG triggers give a stack: +2% Phys ATK/stack (5s, max 5 = +10% Phys ATK)",
    recommended: ["bamboocut-wind", "stonesplit-might", "bellstrike-umbra"],
  },
  "jadeware": {
    name: "Jadeware",
    stat2pc: { maxOuter: 64 },           // ✅ confirmed T91
    desc2pc: "2/4: Max Physical ATK +64",
    desc4pc: "4/4: Martial Art Skill → Jadeware buff: each Affinity hit further increases Affinity DMG.",
    recommended: ["bellstrike-umbra", "bellstrike-splendor"],
  },
  "ivorybloom": {
    name: "Ivorybloom",
    stat2pc: { crit: 7.4 },              // ✅ confirmed T91
    desc2pc: "2/4: +7.4% Critical Rate",
    desc4pc: "4/4: At Max HP: +5% Crit Chance and +15% Critical DMG/Heal.",
    recommended: ["silkbind-deluge", "silkbind-jade"],
  },
  "shakenhill": {
    name: "Shattered Ridge",
    stat2pc: { minOuter: 64 },           // ✅ confirmed T91
    desc2pc: "2/4: Min Physical ATK +64",
    desc4pc: "4/4: Perfect Deflect boosts next skill/heavy attack DMG significantly.",
    recommended: ["stonesplit-pure-datang"],
  },
  "swallowreturn": {
    name: "Swaying Heights",
    stat2pc: { minOuter: 64 },           // ✅ confirmed T91
    desc2pc: "2/4: Min Physical ATK +64",
    desc4pc: "4/4: DMG +10% vs targets above 50% HP.",
    recommended: ["bamboocut-wind", "bamboocut-dust"],
  },
  "swiftgale": {
    name: "Swift Gale",
    stat2pc: { maxOuter: 64 },           // ✅ confirmed T91
    desc2pc: "2/4: Max Physical ATK +64",
    desc4pc: "4/4: Airborne Heavy Attacks gain +DMG and knock targets back.",
    recommended: [],
  },
  "swallowcall": {
    name: "Swallowcall",
    stat2pc: { minOuter: 64 },           // ✅ confirmed T91
    desc2pc: "2/4: Min Physical ATK +64",
    desc4pc: "4/4: Various effect — verify in-game.",
    recommended: [],
  },
  "mistwillow": {
    name: "Mistwillow",
    stat2pc: { prec: 6.6 },              // ✅ confirmed T91
    desc2pc: "2/4: +6.6% Precision Rate",
    desc4pc: "4/4: After Light/Heavy Attack, following attacks deal bonus DMG for 10s.",
    recommended: [],
  },
  "stormrain": {
    name: "Eaglerise",
    stat2pc: {},
    desc2pc: "2/4: +Physical Defense",
    desc4pc: "4/4: DMG/healing grants Eaglerise stacks (DMG taken −1.2%/stack, max 5). At max stacks, Eagle Guard reduces next hit by 90% (30s CD).",
    recommended: [],
  },
  "obsidian": {
    name: "Obsidian Armor",
    stat2pc: {},
    desc2pc: "2/4: (stat pending verification)",
    desc4pc: "4/4: (effect pending verification)",
    recommended: [],
  },
  // ── Defensive (no DPS stat — listed for completeness) ───────────────────
  "moonflare": {
    name: "Moonflare",
    stat2pc: {},
    desc2pc: "2/4: +Max HP",
    desc4pc: "4/4: 30% chance on attack to create a shield (10% Max HP, 20s). If shield active, restore 2% HP.",
    recommended: [],
  },
  "rainwhisper": {
    name: "Rainwhisper",
    stat2pc: {},
    desc2pc: "2/4: +Max HP",
    desc4pc: "4/4: +10% Crit DMG & Heal. Bonus rises to +15% if HP shield is active.",
    recommended: [],
  },
  "formbend": {
    name: "Formbend",
    stat2pc: {},
    desc2pc: "2/4: +Physical Defense",
    desc4pc: "4/4: Shield duration +2s. If Qi >85% or Qi immunity shield active, reduce HP DMG taken by 20%.",
    recommended: [],
  },
  "calmwaters": {
    name: "Calmwaters",
    stat2pc: {},
    desc2pc: "2/4: +Physical Defense",
    desc4pc: "4/4: Perfect Dodge has 50% chance to restore 3% Max HP and 10 Endurance.",
    recommended: [],
  },
  "beyondchill": {
    name: "Beyond the Chill",
    stat2pc: {},
    desc2pc: "2/4: +Max HP",
    desc4pc: "4/4: After 10s in combat with no DMG taken, gain Beyond the Chill: reduces next hit and all DMG within 2s by 40%.",
    recommended: [],
  },
  "whirlsnow": {
    name: "Whirlsnow",
    stat2pc: {},
    desc2pc: "2/4: +Physical Defense",
    desc4pc: "4/4: Heavy hit or drop below 20% HP → next heal within 5s restores +25% Max HP (60s CD).",
    recommended: [],
  },
  "jadeembrace": {
    name: "Jade Embrace",
    stat2pc: {},
    desc2pc: "2/4: (stat pending verification)",
    desc4pc: "4/4: (effect pending verification)",
    recommended: [],
  },
  "agilesteps": {
    name: "Agile Steps",
    stat2pc: {},
    desc2pc: "2/4: (stat pending verification)",
    desc4pc: "4/4: (effect pending verification)",
    recommended: [],
  },
  "flawlessdef": {
    name: "Flawless Defense",
    stat2pc: {},
    desc2pc: "2/4: (stat pending verification)",
    desc4pc: "4/4: (effect pending verification)",
    recommended: [],
  },
  "ironweave": {
    name: "Ironweave",
    stat2pc: {},
    desc2pc: "2/4: +Physical Defense",
    desc4pc: "4/4: Shield duration +2s. If shield broken, gain additional DMG reduction.",
    recommended: [],
  },
  // ── Bow/Ring Sets (stat bonus from bow attribute, not gear substats) ─────
  "pursuing": {
    name: "Pursuing Shadow",
    stat2pc: {},
    desc2pc: "Bow/Ring set — stat selected via Bow attribute dropdown",
    desc4pc: "—",
    recommended: [],
  },
  "plume": {
    name: "Plume",
    stat2pc: {},
    desc2pc: "Bow/Ring set — stat selected via Bow attribute dropdown",
    desc4pc: "—",
    recommended: [],
  },
  "string": {
    name: "Startling String",
    stat2pc: {},
    desc2pc: "Bow/Ring set — stat selected via Bow attribute dropdown",
    desc4pc: "—",
    recommended: [],
  },
  "none": { name: "No Set / Mixed", stat2pc: {}, desc2pc: "—", desc4pc: "—", recommended: [] },
};

const getCustomConfig = () => {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem("wwm_t91_custom_config");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error(e);
    }
  }
  return null;
};

export default function App() {
  const [tierKey, setTierKey] = useState<string>(() => {
    const config = getCustomConfig();
    return config?.tierKey ?? "350|0.45";
  });
  const [panel, setPanel] = useState<PanelStats>(() => {
    const config = getCustomConfig();
    return config?.panel ?? INITIAL_PANEL;
  });

  // Panel stats are ALWAYS computed from equipped gear (like spongem).
  // No manual toggle — equip/unequip gear → panel updates automatically.
  const autoGearPanel = true;

  const [activeTab, setActiveTab ] = useState<"calculator" | "priority" | "gear" | "compare" | "simulators" | "ocr" | "profiles" | "rot-sim" | "cultivate">("calculator");

  // ── NEW STATES & HELPERS FOR REDESIGNED LAYOUT ──
  const [isGradModalOpen, setIsGradModalOpen] = useState<boolean>(false);
  const [gradModalActiveTab, setGradModalActiveTab] = useState<string>("manual");
  const [isDmgStatsOpen, setIsDmgStatsOpen] = useState<boolean>(false);
  const [isSimOpen, setIsSimOpen] = useState<boolean>(false);
  const [simRuns, setSimRuns] = useState<number>(100);
  const [simResult, setSimResult] = useState<any>(null);
  const [isGameImportOpen, setIsGameImportOpen] = useState<boolean>(false);
  const [gameImportRaw, setGameImportRaw] = useState<string>("");
  const [gameImportResult, setGameImportResult] = useState<ImportResult | null>(null);
  const [gameImportError, setGameImportError] = useState<string>("");
  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState<boolean>(false);
  const [isBatchOcrModalOpen, setIsBatchOcrModalOpen] = useState<boolean>(false);
  const [isXinfaModalOpen, setIsXinfaModalOpen] = useState<boolean>(false);
  const [xinfaModalIndex, setXinfaModalIndex] = useState<number | null>(null);

  const isItemEquipped = (item: GearItem, allGear: GearItem[]): boolean => {
    if (item.isEquipped !== undefined) {
      return item.isEquipped;
    }
    const slotItems = allGear.filter(g => g.slot === item.slot);
    const explicitlyEquipped = slotItems.find(g => g.isEquipped === true);
    if (explicitlyEquipped) {
      return false;
    }
    return slotItems[0]?.id === item.id;
  };

  const unequipItem = (slotName: string) => {
    const gear = getActiveGear();
    const updated = gear.map(g => {
      if (g.slot === slotName) {
        return { ...g, isEquipped: false };
      }
      return g;
    });
    saveActiveGear(updated);
  };

  const toggleEquip = (item: GearItem) => {
    const gear = getActiveGear();
    const isCurrentlyEquipped = isItemEquipped(item, gear);
    const updated = gear.map(g => {
      if (g.slot === item.slot) {
        if (g.id === item.id) {
          return { ...g, isEquipped: true };
        } else {
          return { ...g, isEquipped: false };
        }
      }
      return g;
    });
    saveActiveGear(updated);
  };
  const [analysisMenuOpen, setAnalysisMenuOpen] = useState(false);
  const [slotPopover, setSlotPopover] = useState<string | null>(null); // slot name whose quick-swap popover is open
  const [rotationTab, setRotationTab] = useState<"list" | "top">("list");

  const [rotSimClass, setRotSimClass] = useState<string>("Bamboocut-Dust");
  const [cultivateClass, setCultivateClass] = useState<string>("Bamboocut-Dust");

  const [tuneCooldowns, setTuneCooldowns] = useState<TuneCooldown[]>(() => {
    try {
      const stored = localStorage.getItem("wwm_relay_cooldowns");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showAddCooldownModal, setShowAddCooldownModal] = useState(false);
  const [cooldownSelectedGearId, setCooldownSelectedGearId] = useState("");
  const [cooldownRelayDate, setCooldownRelayDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("wwm_relay_cooldowns", JSON.stringify(tuneCooldowns));
  }, [tuneCooldowns]);

  // Close the slot quick-swap popover when clicking outside any sim-slot.
  useEffect(() => {
    if (!slotPopover) return;
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".sim-slot")) setSlotPopover(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [slotPopover]);

  const [hitsState, setHitsState] = useState<Record<string, number>>(() => {
    const initialHits: Record<string, number> = {};
    WWM_DATA.skills.forEach(s => {
      const lower = s.name.toLowerCase();
      if (lower.includes("spin") || lower.includes("wheel")) {
        initialHits[s.name] = 78;
      } else if (lower.includes("resonance") || lower.includes("echo")) {
        initialHits[s.name] = 75;
      } else if (lower.includes("umbrella") || lower.includes("rope")) {
        initialHits[s.name] = 30;
      } else {
        initialHits[s.name] = 0;
      }
    });
    return initialHits;
  });

  const [swapWeaponId, setSwapWeaponId] = useState<string>("custom");
  const [swapMinAtk, setSwapMinAtk] = useState<number>(1800);
  const [swapMaxAtk, setSwapMaxAtk] = useState<number>(3000);

  // Multi-build, Inner Ways, and Custom Rotation States
  const [selectedBuild, setSelectedBuild] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("wwm_selected_build");
      if (stored) return stored;
    }
    return "bamboocut-dust";
  });

  useEffect(() => {
    localStorage.setItem("wwm_selected_build", selectedBuild);
  }, [selectedBuild]);

  const [innerWaysFilter, setInnerWaysFilter] = useState<"recommended" | "all">("recommended");
  const [innerWaySearch, setInnerWaySearch] = useState("");
  const [formlessOpen, setFormlessOpen] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["attack", "judgment", "damage", "weapon-bonus", "inner-ways"])
  );

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    const isOpen = expandedSections.has(id);
    return (
      <div className="border-b border-[#23262c]/50 pb-2 mb-2">
        <button
          onClick={() => setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          })}
          className="w-full flex items-center justify-between text-[11px] font-mono tracking-wider text-[#f0b400]/80 uppercase mb-1"
        >
          <span>{title}</span>
          <span className="text-slate-300">{isOpen ? "▼" : "▶"}</span>
        </button>
        {isOpen && children}
      </div>
    );
  };


  // Multi-Character & Scheme states
  const [charsData, setCharsData] = useState<CharsData>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("wwm_chars_v3");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.chars && Array.isArray(parsed.chars)) {
            return sanitizeChars(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    const charId = "char-" + Date.now();
    const schemeId = "scheme-" + Date.now();
    return {
      chars: [
        {
          id: charId,
          name: "Main Hero",
          schemes: [
            {
              id: schemeId,
              name: "Scheme 1",
              panel: INITIAL_PANEL,
              gear: DEFAULT_GEAR
            }
          ]
        }
      ],
      activeCharId: charId,
      activeSchemeId: schemeId
    };
  });

  const activeChar = useMemo(() => {
    return charsData.chars.find(c => c.id === charsData.activeCharId) ?? null;
  }, [charsData.chars, charsData.activeCharId]);

  const activeScheme = useMemo(() => {
    if (!activeChar) return null;
    return activeChar.schemes.find(s => s.id === charsData.activeSchemeId) ?? null;
  }, [activeChar, charsData.activeSchemeId]);

  useEffect(() => {
    if (activeScheme) {
      if (activeScheme.panel) {
        setPanel(activeScheme.panel);
      }
    }
  }, [charsData.activeCharId, charsData.activeSchemeId]);

  // Persist manual panel edits back into the active scheme so they survive reloads
  // (critical for shared/public use — each browser keeps its own profiles).
  // Skip the very first run so the initial-mount panel never clobbers a saved scheme
  // before the load effect above has applied it.
  const panelSaveSkip = useRef(true);
  useEffect(() => {
    if (panelSaveSkip.current) { panelSaveSkip.current = false; return; }
    setCharsData(prev => {
      const updated = {
        ...prev,
        chars: prev.chars.map(c => c.id === prev.activeCharId ? {
          ...c,
          schemes: c.schemes.map(s => s.id === prev.activeSchemeId ? { ...s, panel } : s),
        } : c),
      };
      try { localStorage.setItem("wwm_chars_v3", JSON.stringify(updated)); } catch (e) { /* quota */ }
      return updated;
    });
  }, [panel]);

  const getActiveGear = (): GearItem[] => {
    // Bow/Ring is no longer an addable gear slot (handled via the Bow attribute
    // dropdown). Drop any legacy Bow/Ring items saved in older data.
    return (activeScheme?.gear ?? DEFAULT_GEAR).filter(it => it.slot !== "Bow/Ring");
  };

  const saveActiveGear = (newGear: GearItem[]) => {
    const updatedChars = charsData.chars.map(c => {
      if (c.id === charsData.activeCharId) {
        return {
          ...c,
          schemes: c.schemes.map(s => {
            if (s.id === charsData.activeSchemeId) {
              return { ...s, gear: newGear };
            }
            return s;
          })
        };
      }
      return c;
    });
    const newData = { ...charsData, chars: updatedChars };
    setCharsData(newData);
    localStorage.setItem("wwm_chars_v3", JSON.stringify(newData));
  };

  // When "Auto from Gear" is on, derive Min/Max Phys Atk, Pen, Crit, Aff, Bamboocut
  // Atk, etc. from the 8 equipped gear pieces (Gear tab) and overwrite those fields
  // in `panel`. Other fields (set, attunedBonus, dcrit/daff, wuxiang, boss dmg %)
  // stay manually-controlled.
  // NOTE: autoGearPanel no longer overwrites panel stats because the user enters
  // TOTAL game values (already includes gear substats). autoGearPanel is now only
  // used for: (1) auto-detecting the active 4pc set, (2) disabling manual set picker.

  const STEPS: Record<string, number> = {
    "Max Phys Atk": 10,
    "Min Phys Atk": 10,
    "Phys Pen": 1,
    "Crit Rate": 1,
    "Crit DMG": 1,
    "Affinity Rate": 1,
    "Affinity DMG": 1,
    "Precision": 1,
    "Max Bamboocut Atk": 10,
    "Min Bamboocut Atk": 10,
    "Attr Pen": 1,
    "Bamboocut DMG%": 1,
    "Art of Umbrella Boost": 1, "Umb Martial Art Skill DMG Boost": 1, "Umb Special Skill DMG Boost": 1, "Umb Charged Skill DMG Boost": 1, "Umbrella Bonus": 1, "Umb Martial": 1, "Umb Special": 1, "Umb Charged": 1,
    "Art of Rope Dart Boost": 1, "Rope Dart Martial Art Skill DMG Boost": 1, "Rope Dart Special Skill DMG Boost": 1, "Rope Dart Charged Skill DMG Boost": 1, "Rope Dart Bonus": 1, "Rope Martial": 1, "Rope Special": 1, "Rope Charged": 1,
    "Art of Sword Boost": 1, "Sword Martial Art Skill DMG Boost": 1, "Sword Special Skill DMG Boost": 1, "Sword Charged Skill DMG Boost": 1, "Sword Bonus": 1, "Sword Martial": 1, "Sword Special": 1, "Sword Charged": 1,
    "Art of Spear Boost": 1, "Spear Martial Art Skill DMG Boost": 1, "Spear Special Skill DMG Boost": 1, "Spear Charged Skill DMG Boost": 1, "Spear Bonus": 1, "Spear Martial": 1, "Spear Special": 1, "Spear Charged": 1,
    "Art of Fan Boost": 1, "Fan Martial Art Skill DMG Boost": 1, "Fan Special Skill DMG Boost": 1, "Fan Charged Skill DMG Boost": 1, "Fan Bonus": 1, "Fan Martial": 1, "Fan Special": 1, "Fan Charged": 1,
    "Art of Dual Blades Boost": 1, "Dual Blades Martial Art Skill DMG Boost": 1, "Dual Blades Special Skill DMG Boost": 1, "Dual Blades Charged Skill DMG Boost": 1, "Twinblades Bonus": 1, "Twinblades Martial": 1, "Twinblades Special": 1, "Twinblades Charged": 1,
    "Art of Mo Blade Boost": 1, "Mo Blade Martial Art Skill DMG Boost": 1, "Mo Blade Special Skill DMG Boost": 1, "Mo Blade Charged Skill DMG Boost": 1, "Modao Bonus": 1, "Modao Martial": 1, "Modao Special": 1, "Modao Charged": 1,
    "Art of Heng Blade Boost": 1, "Heng Blade Martial Art Skill DMG Boost": 1, "Heng Blade Special Skill DMG Boost": 1, "Heng Blade Charged Skill DMG Boost": 1, "Hengdao Bonus": 1, "Hengdao Martial": 1, "Hengdao Special": 1, "Hengdao Charged": 1,
    "Art of Gauntlets Boost": 1, "Gauntlets Martial Art Skill DMG Boost": 1, "Gauntlets Special Skill DMG Boost": 1, "Gauntlets Charged Skill DMG Boost": 1, "Gauntlets Bonus": 1, "Gauntlets Martial": 1, "Gauntlets Special": 1, "Gauntlets Charged": 1,
    "All Martial Arts": 1,
    "Phys DMG%": 1,
    "Boss DMG%": 1,
    "HP": 1,
    "Power": 1,
    "Strength": 1,
    "Defense": 1,
    "Agility": 1,
    "Momentum": 1,
    "Max Silkbind Atk": 10,
    "Min Silkbind Atk": 10,
    "Silkbind DMG%": 1,
    "Max Bellstrike Atk": 10,
    "Min Bellstrike Atk": 10,
    "Bellstrike DMG%": 1,
    "Max Stonesplit Atk": 10,
    "Min Stonesplit Atk": 10,
    "Stonesplit DMG%": 1,
    "Bamboocut Pen": 1,
    "Silkbind Pen": 1,
    "Bellstrike Pen": 1,
    "Stonesplit Pen": 1,
  };

  const computeTotalDamage = (p: PanelStats) => {
    let totalDmg = 0;
    getRotationForBuild(selectedBuild).forEach((item) => {
      const { total } = calcSkill(item, p, activeTier, {
        set: p.set || "gold",
        datang,
        yishui,
        buildKey: selectedBuild,
      });
      totalDmg += total;
    });
    return totalDmg;
  };

  const marginalGain = (statKey: keyof PanelStats, step: number) => {
    const baseDmg = computeTotalDamage(adjustedPanel);
    if (baseDmg <= 0) return 0;
    const p = { ...adjustedPanel };
    (p[statKey] as number) += step;
    const newDmg = computeTotalDamage(p);
    return ((newDmg - baseDmg) / baseDmg) * 100;
  };

  const getGearItemCompareStats = (item: GearItem) => {
    let totalGradDelta = 0;
    const subsWithDeltas = item.subs.map(sub => {
      const statKey = SUB_MAP[sub.type];
      if (!statKey) return { type: sub.type, val: sub.val, isTuned: !!sub.isTuned, delta: 0 };
      
      const cleanVal = parseFloat(sub.val.replace(/[^\d.]/g, "")) || 0;
      const step = STEPS[sub.type] || 1;
      const gainPerStep = marginalGain(statKey as keyof PanelStats, step);
      const isTuned = !!sub.isTuned;
      const factor = isTuned ? 1.15 : 1.0;
      const delta = (cleanVal / step) * gainPerStep * factor;
      totalGradDelta += delta;
      
      return {
        type: sub.type,
        val: sub.val,
        isTuned,
        delta
      };
    });
    return {
      totalGradDelta,
      subsWithDeltas
    };
  };

  // Gear state fields
  const [selectedSlot, setSelectedSlot] = useState<string>("Umbrella");
  const [transmuteSubIndex, setTransmuteSubIndex] = useState<number | null>(null);
  const [transmuteSlot, setTransmuteSlot] = useState<string>("Umbrella");
  const [gearFilterSlot, setGearFilterSlot] = useState<string>("ALL");
  const [gearSortBy, setGearSortBy] = useState<"name" | "mastery">("name");
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formQuality, setFormQuality] = useState<"gold" | "purple" | "blue">("gold");
  // formMain removed — items no longer store a separate main stat text
  const [formSet, setFormSet] = useState("stars");
  // ── Base-calibration modal ──
  const [calibOpen, setCalibOpen] = useState(false);
  const [calibInputs, setCalibInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(CALIB_FIELDS.map(f => [f.key as string, String(f.prefill)]))
  );
  const [setAllWeapon, setSetAllWeapon] = useState("stars");
  const [setAllArmor, setSetAllArmor] = useState("stormrain");
  const [formMastery, setFormMastery] = useState<string>("");
  const [formWeaponType, setFormWeaponType] = useState<string>("Sword");
  const [formSubs, setFormSubs] = useState<{type: string; val: string; isTuned?: boolean}[]>(
    Array(6).fill(null).map(() => ({ type: "Max Phys Atk", val: "", isTuned: false }))
  );

  const [isModalOcrProcessing, setIsModalOcrProcessing] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Global paste event when add/edit gear item modal is open
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (!isItemModalOpen || isModalOcrProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleModalOcr(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [isItemModalOpen, isModalOcrProcessing]);

  const handleModalOcr = async (file: File) => {
    setIsModalOcrProcessing(true);
    try {
      const objectUrl = URL.createObjectURL(file);

      const worker: any = await createWorker();
      if (typeof worker.loadLanguage === "function") await worker.loadLanguage("chi_sim+eng");
      if (typeof worker.initialize === "function") await worker.initialize("chi_sim+eng");

      const { subs, mastery } = await runDualPassOcr(worker, objectUrl);
      await worker.terminate();
      URL.revokeObjectURL(objectUrl);

      setFormSubs(subs.map(s => ({ type: s.type, val: s.val, isTuned: !!s.isTuned })));
      if (mastery) setFormMastery(mastery);
      alert(`🎉 OCR complete! Auto-filled ${subs.filter(s => s.type !== "Other").length} substats.`);
    } catch (e) {
      console.error(e);
      alert("❌ An error occurred during OCR scanning.");
    } finally {
      setIsModalOcrProcessing(false);
    }
  };

  const parseTextToGearItem = (text: string, fileName: string): GearItem => {
    const lines = text.split("\n");
    const parsedSubs: GearSub[] = [];
    let masteryVal = 832;
    let detectedSlot = "Umbrella"; // Default
    let detectedWeaponType = "Sword"; // Default
    let detectedName = fileName.replace(/\.[^/.]+$/, "").replace(/screenshot_\d+/gi, "Scanned Gear"); // default name

    const lcText = text.toLowerCase();
    
    // 1. Detect Slot — check armor/accessories FIRST (explicit slot names), then weapons
    if (lcText.includes("pendant") || lcText.includes("necklace") || lcText.includes("dây chuyền") || lcText.includes("项链")) {
      detectedSlot = "Pendant";
    } else if (lcText.includes("disc") || lcText.includes("đĩa") || lcText.includes("唱片")) {
      detectedSlot = "Disc";
    } else if (lcText.includes("helmet") || lcText.includes("head") || lcText.includes("mũ") || lcText.includes("头盔")) {
      detectedSlot = "Helmet";
    } else if (lcText.includes("chest") || lcText.includes("armor") || lcText.includes("áo") || lcText.includes("胸甲")) {
      detectedSlot = "Chest";
    } else if (lcText.includes("bracers") || lcText.includes("hands") || lcText.includes("tay") || lcText.includes("护腕")) {
      detectedSlot = "Bracers";
    } else if (lcText.includes("boots") || lcText.includes("shoes") || lcText.includes("legs") || lcText.includes("giày") || lcText.includes("greaves") || lcText.includes("腿甲")) {
      detectedSlot = "Greaves";
    } else if (lcText.includes("rope dart") || lcText.includes("rope_dart")) {
      detectedSlot = "Rope Dart";
      detectedWeaponType = "Rope Dart";
    } else if (lcText.includes("umbrella")) {
      detectedSlot = "Umbrella";
      detectedWeaponType = "Umbrella";
    } else if (lcText.includes("sword")) {
      detectedSlot = "Umbrella";
      detectedWeaponType = "Sword";
    } else if (lcText.includes("spear")) {
      detectedSlot = "Rope Dart";
      detectedWeaponType = "Spear";
    } else if (lcText.includes("dual blades") || lcText.includes("twinblades")) {
      detectedSlot = "Rope Dart";
      detectedWeaponType = "Dual Blades";
    } else if (lcText.includes("modao")) {
      detectedSlot = "Rope Dart";
      detectedWeaponType = "Modao";
    } else if (lcText.includes("hengdao")) {
      detectedSlot = "Umbrella";
      detectedWeaponType = "Hengdao";
    } else if (lcText.includes("gauntlets") || lcText.includes("fist")) {
      detectedSlot = "Umbrella";
      detectedWeaponType = "Gauntlets";
    } else if (lcText.includes("fan")) {
      detectedSlot = "Umbrella";
      detectedWeaponType = "Fan";
    }

    // Detect Name
    const linesNonEmpty = lines.map(l => l.trim()).filter(l => l.length > 0);
    if (linesNonEmpty.length > 0) {
      const firstLine = linesNonEmpty[0];
      if (firstLine.length > 3 && !firstLine.toLowerCase().includes("equipped") && !firstLine.toLowerCase().includes("weapon")) {
        detectedName = firstLine;
      }
    }

    const cleanNum = (str: string) => {
      const match = str.match(/\d+(?:\.\d+)?/);
      return match ? match[0] : "";
    };

    lines.forEach((line) => {
      const lcLine = line.toLowerCase();
      
      // Mastery match
      if (lcLine.includes("mastery") || lcLine.includes("chế bực") || lcLine.includes("chế ngự")) {
        const match = line.match(/\b\d{3,4}\b/);
        if (match) masteryVal = parseInt(match[0], 10);
      }

      // Match value
      const valueMatch = line.match(/\d+(?:\.\d+)?%?/);
      if (valueMatch) {
        const valStr = cleanNum(valueMatch[0]);
        if (!valStr || parseFloat(valStr) === 0) return;

        let matchedType = "";
        
        if (
          (lcLine.includes("破防") || lcLine.includes("破甲") || lcLine.includes("xuyên") || lcLine.includes("phá giáp") || lcLine.includes("pen") || lcLine.includes("vật lý") || lcLine.includes("penetration")) &&
          !(lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc"))
        ) {
          matchedType = "Physical Penetration";
        }
        else if (
          (lcLine.includes("tối đa") || lcLine.includes("max") || lcLine.includes("最大") || lcLine.includes("[turn]max")) &&
          (lcLine.includes("ngoại") || lcLine.includes("tấn công") || lcLine.includes("atk") || lcLine.includes("phys") || lcLine.includes("công") || lcLine.includes("attack") || lcLine.includes("physical")) &&
          !(lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc"))
        ) {
          matchedType = "Max Physical Attack";
        }
        else if (
          (lcLine.includes("tối thiểu") || lcLine.includes("min") || lcLine.includes("最小")) &&
          (lcLine.includes("ngoại") || lcLine.includes("tấn công") || lcLine.includes("atk") || lcLine.includes("phys") || lcLine.includes("công") || lcLine.includes("attack") || lcLine.includes("physical")) &&
          !(lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc"))
        ) {
          matchedType = "Min Physical Attack";
        }
        else if (
          (lcLine.includes("hội tâm") || lcLine.includes("crit") || lcLine.includes("会心")) &&
          !(lcLine.includes("伤害") || lcLine.includes("sát thương") || lcLine.includes("dmg") || lcLine.includes("damage") || lcLine.includes("hội thương") || lcLine.includes("加成"))
        ) {
          matchedType = "Crit Rate";
        }
        else if (
          lcLine.includes("hội thương") ||
          (lcLine.includes("hội tâm") && (lcLine.includes("sát thương") || lcLine.includes("伤害") || lcLine.includes("加成"))) ||
          lcLine.includes("crit dmg") ||
          lcLine.includes("crit_dmg") ||
          lcLine.includes("会心伤害")
        ) {
          matchedType = "Crit Damage";
        }
        else if (
          (lcLine.includes("thức phá") || lcLine.includes("affinity") || lcLine.includes("aff") || lcLine.includes("识破")) &&
          !(lcLine.includes("sát thương") || lcLine.includes("dmg") || lcLine.includes("damage") || lcLine.includes("伤害") || lcLine.includes("加成"))
        ) {
          matchedType = "Affinity Rate";
        }
        else if (
          (lcLine.includes("thức phá") && (lcLine.includes("sát thương") || lcLine.includes("伤害") || lcLine.includes("加成"))) ||
          lcLine.includes("affinity dmg") ||
          lcLine.includes("aff_dmg") ||
          lcLine.includes("识破伤害")
        ) {
          matchedType = "Affinity Damage";
        }
        else if (
          (lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc")) &&
          (lcLine.includes("破防") || lcLine.includes("xuyên") || lcLine.includes("pen"))
        ) {
          matchedType = "Bamboocut Penetration";
        }
        else if (
          (lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc")) &&
          (lcLine.includes("伤害") || lcLine.includes("sát thương") || lcLine.includes("dmg") || lcLine.includes("damage"))
        ) {
          matchedType = "Bamboocut DMG";
        }
        else if (
          lcLine.includes("precision") || lcLine.includes("chính xác") || lcLine.includes("精准") || lcLine.includes("prec")
        ) {
          matchedType = "Precision Rate";
        }
        else if (
          lcLine.includes("agility") || lcLine.includes("thân pháp") || lcLine.includes("身法")
        ) {
          matchedType = "Agility";
        }
        else if (
          lcLine.includes("power") || lcLine.includes("lực lượng") || lcLine.includes("力量")
        ) {
          matchedType = "Power";
        }
        else if (
          lcLine.includes("momentum") || lcLine.includes("thế năng") || lcLine.includes("势能")
        ) {
          matchedType = "Momentum";
        }
        else if (
          lcLine.includes("constitution") || lcLine.includes("body") || lcLine.includes("thể chất") || lcLine.includes("体质")
        ) {
          matchedType = "HP";
        }
        else if (
          lcLine.includes("defense") || lcLine.includes("phòng ngự") || lcLine.includes("防御")
        ) {
          matchedType = "Defense";
        }

        if (matchedType && parsedSubs.length < 6) {
          const isTuned = lcLine.includes("[turn]") || lcLine.includes("turn") || lcLine.includes("tuned") || lcLine.includes("attuned") || lcLine.includes("👍") || lcLine.includes("✦") || lcLine.includes("định âm") || lcLine.includes("dingyin") || lcLine.includes("定音");
          parsedSubs.push({ type: matchedType, val: valStr, isTuned });
        }
      }
    });

    // Enforce max 1 attuned
    let foundTuned = false;
    parsedSubs.forEach(sub => {
      if (sub.isTuned) {
        if (foundTuned) sub.isTuned = false;
        else foundTuned = true;
      }
    });

    while (parsedSubs.length < 6) {
      parsedSubs.push({ type: "Other", val: "", isTuned: false });
    }

    // Default set based on slot
    let defaultSet = "none";
    if (detectedSlot !== "Umbrella" && detectedSlot !== "Rope Dart" && detectedSlot !== "Pendant") {
      defaultSet = detectedSlot === "Bow/Ring" ? "pursuing" : "stars";
    }

    return {
      id: Math.random().toString(),
      slot: detectedSlot,
      name: detectedName,
      quality: "gold",
      set: defaultSet,
      subs: parsedSubs,
      mastery: masteryVal,
      isEquipped: false,
      weaponType: (detectedSlot === "Umbrella" || detectedSlot === "Rope Dart") ? detectedWeaponType : undefined
    };
  };

  const openAddModal = () => {
    setEditingItem(null);
    const slotLabel = getSlotLabel(selectedSlot);
    const existingCount = getActiveGear().filter(it => it.slot === selectedSlot).length;
    // First piece in a slot = bare label ("Weapon 1"); extras get "#2/#3" so the
    // counter doesn't fuse with the slot's own number ("Weapon 1 2" → "Weapon 1 #2").
    setFormName(existingCount === 0 ? slotLabel : `${slotLabel} #${existingCount + 1}`);
    setFormQuality("gold");
    if (selectedSlot === "Umbrella" || selectedSlot === "Rope Dart" || selectedSlot === "Pendant" || selectedSlot === "Disc") {
      setFormSet("stars"); // default weapon set
    } else if (selectedSlot === "Bow/Ring") {
      setFormSet("pursuing");
    } else {
      setFormSet("stormrain"); // default armor set
    }
    setFormMastery("");
    const defaultTypes = BUILD_WEAPON_TYPES[selectedBuild] || ["Umbrella", "Rope Dart"];
    setFormWeaponType(selectedSlot === "Umbrella" ? defaultTypes[0] : selectedSlot === "Rope Dart" ? defaultTypes[1] : "Sword");
    setFormSubs(Array(6).fill(null).map(() => ({ type: "Max Phys Atk", val: "", isTuned: false })));
    setIsItemModalOpen(true);
  };

  const openEditModal = (item: GearItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormQuality(item.quality);
    setFormSet(item.set);
    setFormMastery(item.mastery !== undefined ? item.mastery.toString() : "");
    setSelectedSlot(item.slot);
    const defaultTypes = BUILD_WEAPON_TYPES[selectedBuild] || ["Umbrella", "Rope Dart"];
    setFormWeaponType(item.weaponType || (item.slot === "Umbrella" ? defaultTypes[0] : item.slot === "Rope Dart" ? defaultTypes[1] : "Sword"));
    const subs = [...item.subs];
    while (subs.length < 6) {
      subs.push({ type: "Other", val: "", isTuned: false });
    }
    setFormSubs(subs);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!formName.trim()) {
      alert("Please enter an item name!");
      return;
    }
    const savedSubs = formSubs
      .filter(s => s.type !== "Other" && s.val.trim() !== "")
      .map(s => ({
        type: s.type,
        val: s.val,
        isTuned: !!s.isTuned
      }));
    const masteryVal = formMastery.trim() !== "" ? parseInt(formMastery, 10) : undefined;
    const activeGear = getActiveGear();
    let updatedGear: GearItem[];
    if (editingItem) {
      updatedGear = activeGear.map(it => {
        if (it.id === editingItem.id) {
          const isWeapon = selectedSlot === "Umbrella" || selectedSlot === "Rope Dart";
          return {
            ...it,
            slot: selectedSlot,
            name: formName,
            quality: formQuality,
            set: formSet,
            mastery: masteryVal,
            subs: savedSubs,
            weaponType: isWeapon ? formWeaponType : undefined,
          };
        }
        return it;
      });
    } else {
      const isWeapon = selectedSlot === "Umbrella" || selectedSlot === "Rope Dart";
      const newItem: GearItem = {
        id: "gear-" + Date.now(),
        slot: selectedSlot,
        name: formName,
        quality: formQuality,
        set: formSet,
        mastery: masteryVal,
        subs: savedSubs,
        weaponType: isWeapon ? formWeaponType : undefined,
      };
      updatedGear = [...activeGear, newItem];
    }
    saveActiveGear(updatedGear);
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this gear item?")) {
      const activeGear = getActiveGear();
      const updatedGear = activeGear.filter(it => it.id !== id);
      saveActiveGear(updatedGear);
      setIsItemModalOpen(false);
    }
  };

  const parseGameImport = () => {
    setGameImportError("");
    try {
      setGameImportResult(parseGameData(gameImportRaw));
    } catch (e: any) {
      setGameImportResult(null);
      setGameImportError(e?.message || "Could not parse the data.");
    }
  };

  const applyGameImport = () => {
    if (!gameImportResult) return;
    const cur = getActiveGear();
    const importedSlots = new Set(gameImportResult.pieces.map(p => p.slot));
    // Unequip whatever is currently equipped in the slots we're importing (kept in
    // the pool, just isEquipped:false), then add+equip the imported pieces.
    const updated = cur.map(g => importedSlots.has(g.slot) ? { ...g, isEquipped: false } : g);
    const defaultTypes = BUILD_WEAPON_TYPES[selectedBuild] || ["Umbrella", "Rope Dart"];
    const newItems: GearItem[] = gameImportResult.pieces.map((p, i) => ({
      id: "import-" + Date.now() + "-" + i,
      slot: p.slot,
      name: `${gameImportResult.roleName} ${p.slot}`,
      quality: "gold",
      set: "none",
      subs: p.subs.map(s => ({ type: s.type, val: s.val })),
      isEquipped: true,
      weaponType: p.slot === "Umbrella" ? defaultTypes[0] : p.slot === "Rope Dart" ? defaultTypes[1] : undefined,
    }));
    saveActiveGear([...updated, ...newItems]);
    setIsGameImportOpen(false);
    setGameImportResult(null);
    setGameImportRaw("");
    setGameImportError("");
  };

  const openCooldownModal = () => {
    const gear = getActiveGear();
    if (gear.length > 0) {
      setCooldownSelectedGearId(gear[0].id);
    } else {
      setCooldownSelectedGearId("");
    }
    const today = new Date();
    setCooldownRelayDate(today.toISOString().split("T")[0]);
    setShowAddCooldownModal(true);
  };

  const handleAddCooldown = () => {
    const gear = getActiveGear().find(g => g.id === cooldownSelectedGearId);
    if (!gear) return;
    const relayDateObj = new Date(cooldownRelayDate);
    const timestamp = relayDateObj.getTime();

    const newCd: TuneCooldown = {
      id: "cd-" + Date.now(),
      slot: gear.slot,
      itemName: gear.name,
      createdAt: timestamp,
      durationMs: 7 * 24 * 60 * 60 * 1000
    };

    setTuneCooldowns(prev => [...prev, newCd]);
    setShowAddCooldownModal(false);
  };

  const handleRemoveCooldown = (id: string) => {
    setTuneCooldowns(prev => prev.filter(c => c.id !== id));
  };

  const [selectedInnerWays, setSelectedInnerWays] = useState<string[]>(() => {
    const config = getCustomConfig();
    return config?.selectedInnerWays ?? [];
  });
  const [innerWayTiers, setInnerWayTiers] = useState<Record<string, number>>(() => {
    const config = getCustomConfig();
    return config?.innerWayTiers ?? {};
  });
  // Realistic-DPS efficiency: the rotation/DPS calc is a THEORETICAL ceiling
  // (perfect rotation + full buff uptime). A real parse loses ~10-20% to rotation
  // downtime / buff ramp / execution. realistic DPS = theoretical × dpsEff. The
  // user tunes it to match their in-game parse. Graduation % stays on theoretical.
  const [dpsEff, setDpsEff] = useState<number>(() => getCustomConfig()?.dpsEff ?? 1.0);
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [compareProfileIds, setCompareProfileIds] = useState<string[]>([]);

  // Custom tier variables
  const [customDef, setCustomDef] = useState<number>(() => {
    const config = getCustomConfig();
    return config?.customDef ?? 350;
  });
  const [customRes, setCustomRes] = useState<number>(() => {
    const config = getCustomConfig();
    return config?.customRes ?? 0.45;
  });

  // Buffet / check option variables
  const [datang, setDatang] = useState<boolean>(() => {
    const config = getCustomConfig();
    return config?.datang ?? false;
  });
  const [yishui, setYishui] = useState<boolean>(() => {
    const config = getCustomConfig();
    return config?.yishui ?? true;
  });
  const [food, setFood] = useState<boolean>(() => {
    const config = getCustomConfig();
    return config?.food ?? true;
  });
  const [yishuiPen, setYishuiPen] = useState<boolean>(() => {
    const config = getCustomConfig();
    return config?.yishuiPen ?? true;
  });
  const [qianying, setQianying] = useState<boolean>(() => {
    const config = getCustomConfig();
    return config?.qianying ?? true;
  });
  const [script50, setScript50] = useState<boolean>(() => {
    const config = getCustomConfig();
    return config?.script50 ?? false;
  });
  const [bowSelect, setBowSelect] = useState<string>(() => {
    const config = getCustomConfig();
    return config?.bowSelect ?? "crit";
  });

  const [hasCustomConfig, setHasCustomConfig] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("wwm_t91_custom_config");
    }
    return false;
  });

  const handleSaveAsDefault = () => {
    const config = {
      panel,
      selectedInnerWays,
      innerWayTiers,
      tierKey,
      bowSelect,
      food,
      datang,
      yishui,
      yishuiPen,
      qianying,
      script50,
      customDef,
      customRes,
      dpsEff
    };
    try {
      localStorage.setItem("wwm_t91_custom_config", JSON.stringify(config));
      setHasCustomConfig(true);
      alert("Current panel stats has been successfully configured as your local default startup preset!");
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while saving configuration.");
    }
  };

  const handleResetAll = () => {
    if (confirm("Are you sure you want to restore overall parameters and buffs to your saved default or factory settings?")) {
      const cachedConfig = localStorage.getItem("wwm_t91_custom_config");
      if (cachedConfig) {
        try {
          const config = JSON.parse(cachedConfig);
          if (config.panel) setPanel(config.panel);
          if (config.selectedInnerWays) setSelectedInnerWays(config.selectedInnerWays);
          if (config.innerWayTiers) setInnerWayTiers(config.innerWayTiers);
          if (config.tierKey) setTierKey(config.tierKey);
          if (config.bowSelect) setBowSelect(config.bowSelect);
          if (config.food !== undefined) setFood(config.food);
          if (config.datang !== undefined) setDatang(config.datang);
          if (config.yishui !== undefined) setYishui(config.yishui);
          if (config.yishuiPen !== undefined) setYishuiPen(config.yishuiPen);
          if (config.qianying !== undefined) setQianying(config.qianying);
          if (config.script50 !== undefined) setScript50(config.script50);
          if (config.customDef !== undefined) setCustomDef(config.customDef);
          if (config.customRes !== undefined) setCustomRes(config.customRes);
          if (config.dpsEff !== undefined) setDpsEff(config.dpsEff);
          return;
        } catch (e) {
          console.error(e);
        }
      }
      // System factory defaults
      setPanel(INITIAL_PANEL);
      setSelectedInnerWays([]);
      setTierKey("350|0.45");
      setBowSelect("crit");
      setFood(true);
      setDatang(false);
      setYishui(true);
      setYishuiPen(true);
      setQianying(true);
      setScript50(false);
      setCustomDef(350);
      setCustomRes(0.45);
    }
  };

  const handleClearCustomDefault = () => {
    if (confirm("Are you sure you want to permanently delete your custom default configuration and restore original factory settings?")) {
      localStorage.removeItem("wwm_t91_custom_config");
      setHasCustomConfig(false);
      setPanel(INITIAL_PANEL);
      setSelectedInnerWays([]);
      setTierKey("350|0.45");
      setBowSelect("crit");
      setFood(true);
      setDatang(false);
      setYishui(true);
      setYishuiPen(true);
      setQianying(true);
      setScript50(false);
      setCustomDef(350);
      setCustomRes(0.45);
      alert("Custom defaults successfully wiped. Baseline factory settings restored.");
    }
  };

  // Compute dynamically matching weapon categories for selected build
  const recommendedWeaponCategories = useMemo(() => {
    const build = BUILD_PROFILES[selectedBuild as keyof typeof BUILD_PROFILES];
    if (!build) return ["General"];
    const weaponsLower = build.weapons.toLowerCase();
    const cats = ["General"];
    if (weaponsLower.includes("umbrella")) cats.push("Umbrella");
    if (weaponsLower.includes("rope dart")) cats.push("Rope Dart");
    if (weaponsLower.includes("spear")) cats.push("Spear");
    if (weaponsLower.includes("sword")) cats.push("Sword");
    if (weaponsLower.includes("twinblades") || weaponsLower.includes("twinblade")) cats.push("Twinblades");
    if (weaponsLower.includes("blade")) cats.push("Blade");
    if (weaponsLower.includes("fist")) cats.push("Fist");
    if (weaponsLower.includes("fan") || weaponsLower.includes("flute")) cats.push("Flute");
    return cats;
  }, [selectedBuild]);

  // 1. Resolve Active Tier Constants
  const activeTier = useMemo((): TierConstants => {
    if (tierKey === "custom") {
      return {
        def: customDef,
        judgeRes: customRes,
        foodMin: 90,
        foodMax: 180,
        baseMinOuter: 894.89,
        baseMaxOuter: 1648.08,
        baseCrit: 30.41,
        baseAff: 15.205,
        basePrec: 94.0,
        armoryMin: 114,
        armoryMax: 229,
        hiddenAttr: 129.2,
        pzPenBase: 10.8,
        pzDmgBase: 5.4,
        physRes: 20,
        attrRes: 24,
        name: "Custom Dungeon Target",
      };
    }
    return TIERS[tierKey] || TIERS["350|0.45"];
  }, [tierKey, customDef, customRes]);

  // Load profiles from storage or populate default sets
  useEffect(() => {
    const cached = localStorage.getItem("wwm_t91_profiles");
    if (cached) {
      try {
        setProfiles(JSON.parse(cached));
      } catch (err) {
        console.error(err);
      }
    } else {
      // Preload high-quality reference Gear Sets for immediate comparison
      const defaults: SavedProfile[] = [
        {
          id: "pre_set_1",
          name: "Gear Set 1: Basic T91 (Newbie)",
          timestamp: "System Pre-set",
          panel: {
            minOuter: 1100,
            maxOuter: 1850,
            outerPen: 25.0,
            minPz: 220,
            maxPz: 420,
            pzPen: 12.0,
            pzDmg: 4.5,
            prec: 98,
            crit: 60.0,
            aff: 4.0,
            dcrit: 0,
            daff: 0,
            critDmg: 40,
            affDmg: 20,
            outerDmg: 1.0,
            bossDmg: 0,
            playerDmg: 0,
            umbAll: 0, umbMartial: 2.0, umbSpecial: 0, umbCharged: 0,
            ropeAll: 0, ropeMartial: 0, ropeSpecial: 0, ropeCharged: 0,
            swordAll: 0, swordMartial: 0, swordSpecial: 0, swordCharged: 0,
            spearAll: 0, spearMartial: 0, spearSpecial: 0, spearCharged: 0,
            fanAll: 0, fanMartial: 0, fanSpecial: 0, fanCharged: 0,
            twinbladesAll: 0, twinbladesMartial: 0, twinbladesSpecial: 0, twinbladesCharged: 0,
            modaoAll: 0, modaoMartial: 0, modaoSpecial: 0, modaoCharged: 0,
            hengdaoAll: 0, hengdaoMartial: 0, hengdaoSpecial: 0, hengdaoCharged: 0,
            gauntletsAll: 0, gauntletsMartial: 0, gauntletsSpecial: 0, gauntletsCharged: 0,
            allArts: 0,
            attunedBonus: 0,
            wuxiangMin: 0,
            wuxiangMax: 0,
            set: "none",
            constitution: 0, power: 0, defense: 0, agility: 0, momentum: 0, physResGear: 0, physDmgReduction: 0, groupDmg: 0, singleTargetDmg: 0, strength: 0
          },
          gradRate: 42.5,
          dps: 15400
        },
        {
          id: "pre_set_2",
          name: "Gear Set 2: Mid-tier Optimized T91",
          timestamp: "System Pre-set",
          panel: {
            minOuter: 1350,
            maxOuter: 2280,
            outerPen: 35.5,
            minPz: 295,
            maxPz: 512,
            pzPen: 18.5,
            pzDmg: 8.0,
            prec: 100,
            crit: 74.0,
            aff: 8.5,
            dcrit: 0,
            daff: 0,
            critDmg: 50,
            affDmg: 30,
            outerDmg: 2.3,
            bossDmg: 4.0,
            playerDmg: 0,
            umbAll: 0, umbMartial: 4.5, umbSpecial: 0, umbCharged: 0,
            ropeAll: 0, ropeMartial: 0, ropeSpecial: 0, ropeCharged: 0,
            swordAll: 0, swordMartial: 0, swordSpecial: 0, swordCharged: 0,
            spearAll: 0, spearMartial: 0, spearSpecial: 0, spearCharged: 0,
            fanAll: 0, fanMartial: 0, fanSpecial: 0, fanCharged: 0,
            twinbladesAll: 0, twinbladesMartial: 0, twinbladesSpecial: 0, twinbladesCharged: 0,
            modaoAll: 0, modaoMartial: 0, modaoSpecial: 0, modaoCharged: 0,
            hengdaoAll: 0, hengdaoMartial: 0, hengdaoSpecial: 0, hengdaoCharged: 0,
            gauntletsAll: 0, gauntletsMartial: 0, gauntletsSpecial: 0, gauntletsCharged: 0,
            allArts: 3.5,
            attunedBonus: 0,
            wuxiangMin: 0,
            wuxiangMax: 0,
            set: "stars",
            constitution: 0, power: 0, defense: 0, agility: 0, momentum: 0, physResGear: 0, physDmgReduction: 0, groupDmg: 0, singleTargetDmg: 0, strength: 0
          },
          gradRate: 70.8,
          dps: 31200
        },
        {
          id: "pre_set_3",
          name: "Gear Set 3: Absolute Graduation T91",
          timestamp: "System Pre-set",
          panel: {
            minOuter: 1515,
            maxOuter: 2650,
            outerPen: 41.5,
            minPz: 385,
            maxPz: 685,
            pzPen: 25.5,
            pzDmg: 11.2,
            prec: 102,
            crit: 79.5,
            aff: 12.5,
            dcrit: 0,
            daff: 0,
            critDmg: 54,
            affDmg: 35,
            outerDmg: 2.8,
            bossDmg: 7.6,
            playerDmg: 0,
            umbAll: 0, umbMartial: 7.4, umbSpecial: 0, umbCharged: 0,
            ropeAll: 0, ropeMartial: 0, ropeSpecial: 0, ropeCharged: 0,
            swordAll: 0, swordMartial: 0, swordSpecial: 0, swordCharged: 0,
            spearAll: 0, spearMartial: 0, spearSpecial: 0, spearCharged: 0,
            fanAll: 0, fanMartial: 0, fanSpecial: 0, fanCharged: 0,
            twinbladesAll: 0, twinbladesMartial: 0, twinbladesSpecial: 0, twinbladesCharged: 0,
            modaoAll: 0, modaoMartial: 0, modaoSpecial: 0, modaoCharged: 0,
            hengdaoAll: 0, hengdaoMartial: 0, hengdaoSpecial: 0, hengdaoCharged: 0,
            gauntletsAll: 0, gauntletsMartial: 0, gauntletsSpecial: 0, gauntletsCharged: 0,
            allArts: 7.2,
            attunedBonus: 0,
            wuxiangMin: 0,
            wuxiangMax: 0,
            set: "stars",
            constitution: 0, power: 0, defense: 0, agility: 0, momentum: 0, physResGear: 0, physDmgReduction: 0, groupDmg: 0, singleTargetDmg: 0, strength: 0
          },
          gradRate: 98.4,
          dps: 45600
        }
      ];
      setProfiles(defaults);
      localStorage.setItem("wwm_t91_profiles", JSON.stringify(defaults));
    }
  }, []);

  const saveProfilesList = (list: SavedProfile[]) => {
    setProfiles(list);
    localStorage.setItem("wwm_t91_profiles", JSON.stringify(list));
  };

  // Compute Inner Ways bonuses
  const iwStats = useMemo(() => {
    const bonus = {
      outerPen: 0,
      pzPen: 0,
      critDmg: 0,
      affDmg: 0,
      outerDmg: 0,
      generalDmg: 0,
      pzDmg: 0,
      crit: 0,
      aff: 0,
      dcrit: 0,
      daff: 0,
    };
    selectedInnerWays.forEach((id) => {
      const iw = INNER_WAYS.find((item) => item.id === id);
      if (iw) {
        const tierNum = innerWayTiers[id] ?? 6;
        const activeTierObj = iw.tiers.find(t => t.tier === tierNum);
        if (activeTierObj && activeTierObj.stat) {
          const s = activeTierObj.stat;
          if (s.outerPen) bonus.outerPen += s.outerPen;
          if (s.pzPen) bonus.pzPen += s.pzPen;
          if (s.critDmg) bonus.critDmg += s.critDmg;
          if (s.affDmg) bonus.affDmg += s.affDmg;
          if (s.outerDmg) bonus.outerDmg += s.outerDmg;
          if (s.generalDmg) bonus.generalDmg += s.generalDmg;
          if (s.pzDmg) bonus.pzDmg += s.pzDmg;
          if (s.crit) bonus.crit += s.crit;
          if (s.aff) bonus.aff += s.aff;
          if (s.dcrit) bonus.dcrit += s.dcrit;
          if (s.daff) bonus.daff += s.daff;
        }
      }
    });
    return bonus;
  }, [selectedInnerWays, innerWayTiers]);

  // Base ("menu") panel — what the in-game Combat Attributes screen shows:
  //  - autoGearPanel ON  → DERIVED from equipped gear (naked base + summed
  //    sub-stats). Equipping / unequipping / editing gear updates every stat,
  //    not just the set bonus. (Previously gear changes never moved the readout.)
  //  - autoGearPanel OFF → the manually-entered panel as-is.
  const basePanel = useMemo((): PanelStats => {
    if (autoGearPanel) {
      const allGear = getActiveGear();
      const equippedGear = allGear.filter((it) => isItemEquipped(it, allGear));
      return computeGearPanel(panel, equippedGear, activeScheme?.baseOverride, innerAttrName(selectedBuild));
    }
    return { ...panel };
  }, [panel, autoGearPanel, activeScheme?.gear, activeScheme?.baseOverride, selectedBuild]);

  // Keep the persisted scheme `panel` in sync with the live gear-derived
  // basePanel (auto mode). Without this, equipping gear updated the readout
  // (which reads basePanel) but left scheme.panel stale — so saves/exports
  // showed old numbers that didn't match the in-game panel. Skip if unchanged.
  useEffect(() => {
    if (!autoGearPanel || !activeScheme) return;
    const cur = activeScheme.panel;
    let same = true;
    for (const k of Object.keys(basePanel) as (keyof PanelStats)[]) {
      if (cur[k] !== basePanel[k]) { same = false; break; }
    }
    if (same) return;
    setCharsData(prev => {
      const updated = {
        ...prev,
        chars: prev.chars.map(c => c.id === prev.activeCharId ? {
          ...c,
          schemes: c.schemes.map(s => s.id === prev.activeSchemeId ? { ...s, panel: basePanel } : s),
        } : c),
      };
      localStorage.setItem("wwm_chars_v3", JSON.stringify(updated));
      return updated;
    });
  }, [basePanel, autoGearPanel, activeScheme?.id]);

  // Base-calibration: gearlessBase[stat] = in-game panel − equipped-gear sub-stats.
  // Stored per-scheme; computeGearPanel then reproduces the in-game panel exactly
  // for the current gear (and adjusts for gear changes via the sub-stat deltas).
  const applyCalibration = () => {
    // Typo guard: Min slightly above Max is a real (rare) in-game state — the game
    // then deals fixed damage at Min, and the calc handles it. Only block the
    // clearly-impossible case where Min is more than DOUBLE Max, which only happens
    // from a stray extra digit (e.g. 1362 -> 13622) that poisons the base and
    // inflates DPS hugely.
    const minO = parseFloat(calibInputs["minOuter"]), maxO = parseFloat(calibInputs["maxOuter"]);
    const minP = parseFloat(calibInputs["minPz"]), maxP = parseFloat(calibInputs["maxPz"]);
    if ((!isNaN(minO) && !isNaN(maxO) && minO > maxO * 2) || (!isNaN(minP) && !isNaN(maxP) && minP > maxP * 2)) {
      alert("Min Atk is more than double Max Atk — almost certainly a typo (an extra digit). Calibration not saved. (A small Min > Max is fine and is allowed.)");
      return;
    }
    const allGear = getActiveGear();
    const equipped = allGear.filter(it => isItemEquipped(it, allGear));
    const gearSum = sumGearSubs(equipped);
    // The in-game Combat Attributes screen ALREADY includes inner-way (心法)
    // bonuses, but adjustedPanel adds iwStats on top of the base (LOCKED #2). So
    // the calibrated base must subtract BOTH gear sub-stats AND inner-way stats —
    // otherwise inner-way pen/crit-dmg/etc. get counted twice and DPS inflates
    // (~+30%). After this, adjustedPanel = base + gear + iwStats reproduces the
    // exact in-game combat panel. Requires the same inner ways selected as in-game.
    const iw = iwStats as Record<string, number>;
    const override: Partial<PanelStats> = {};
    CALIB_FIELDS.forEach(f => {
      const v = parseFloat(calibInputs[f.key as string]);
      if (!isNaN(v)) (override[f.key] as number) = v - (gearSum[f.key] || 0) - (iw[f.key as string] || 0);
    });
    setCharsData(prev => {
      const updated = { ...prev, chars: prev.chars.map(c => c.id === prev.activeCharId ? {
        ...c, schemes: c.schemes.map(s => s.id === prev.activeSchemeId ? { ...s, baseOverride: override } : s),
      } : c) };
      localStorage.setItem("wwm_chars_v3", JSON.stringify(updated));
      return updated;
    });
    setCalibOpen(false);
  };
  // Bulk-set gear sets: weapon/accessory set → Weapon 1·2 / Disc / Pendant;
  // armor 4pc set → Helmet / Chest / Bracers / Greaves. (Weapons and armor use
  // different set pools, so they're applied separately.)
  const applySetToAll = () => {
    const ARMOR_SLOTS = ["Helmet", "Chest", "Bracers", "Greaves"];
    setCharsData(prev => {
      const updated = { ...prev, chars: prev.chars.map(c => c.id === prev.activeCharId ? {
        ...c, schemes: c.schemes.map(s => s.id === prev.activeSchemeId ? {
          ...s, gear: s.gear.map(g => ({ ...g, set: ARMOR_SLOTS.includes(g.slot) ? setAllArmor : setAllWeapon })),
        } : s),
      } : c) };
      localStorage.setItem("wwm_chars_v3", JSON.stringify(updated));
      return updated;
    });
  };
  const clearCalibration = () => {
    setCharsData(prev => {
      const updated = { ...prev, chars: prev.chars.map(c => c.id === prev.activeCharId ? {
        ...c, schemes: c.schemes.map(s => {
          if (s.id !== prev.activeSchemeId) return s;
          const { baseOverride, ...rest } = s; return rest as Scheme;
        }),
      } : c) };
      localStorage.setItem("wwm_chars_v3", JSON.stringify(updated));
      return updated;
    });
    setCalibOpen(false);
  };

  // 2. Compute Adjusted Panel Stats (base panel + toggleable in-combat buffs)
  const adjustedPanel = useMemo((): PanelStats => {
    let p: PanelStats = { ...basePanel };

    // On top of the base panel we only add TOGGLEABLE TEMPORARY BUFFS below.

    // Apply food buff (temporary, not in base game panel)
    if (food) {
      p.minOuter += activeTier.foodMin;
      p.maxOuter += activeTier.foodMax;
    }

    // Apply Bow/Ring set bonus (player picks one stat via dropdown).
    // The bow bonus is NOT part of the in-game look panel — it's selectable here
    // because the in-game system lets you swap bow attribute without re-equipping.
    if (bowSelect === "crit") p.crit += 3.7;
    else if (bowSelect === "prec") p.prec += 3.3;
    else if (bowSelect === "aff") p.aff += 1.8;

    // Apply Sub-50% HP passive buff (conditional combat buff)
    if (script50) {
      p.dcrit += 15.0;
    }

    // Determine active set from equipped gear for the DPS formula
    const gear = getActiveGear();
    const setCounts: Record<string, number> = {};
    gear.forEach(item => {
      if (item.set && item.set !== "none") {
        setCounts[item.set] = (setCounts[item.set] || 0) + 1;
      }
    });
    let active4pcSet = "none";
    Object.entries(setCounts).forEach(([setKey, count]) => {
      if (count >= 4) {
        active4pcSet = setKey;
      }
    });
    if (autoGearPanel) {
      p.set = active4pcSet;
    }
    // Stars Align 4pc gives the Martial Art Skill stack effect. Tracked separately
    // so it applies alongside any armor 4pc (e.g. Eaglerise). The 2pc +64 Min Atk
    // bonus is already baked into the user's panel input (game shows post-2pc).
    const starsCount = setCounts["stars"] || 0;
    (p as any).weaponStars = starsCount >= 4 || p.set === "stars";

    // Inner ways are IN-COMBAT buffs (proc/stack effects) — they do NOT appear in
    // the game's character-menu panel. The manual `panel` fields therefore represent
    // the naked character-menu panel ("base trần"); here we add the selected inner
    // ways' stats on top to produce the effective in-combat panel used by the DPS
    // formula and the stat readout. (Previously only generalDmg was applied, so
    // pen / crit / crit-dmg / etc. from inner ways were silently ignored.)
    p.outerPen += iwStats.outerPen;
    p.pzPen += iwStats.pzPen;
    p.crit += iwStats.crit;
    p.aff += iwStats.aff;
    p.dcrit += iwStats.dcrit;
    p.daff += iwStats.daff;
    p.critDmg += iwStats.critDmg;
    p.affDmg += iwStats.affDmg;
    p.outerDmg += iwStats.outerDmg;
    p.pzDmg += iwStats.pzDmg;
    // generalDmg stays in its own "general DMG%" multiplier bucket in the formula.
    p.iwGeneralDmg = iwStats.generalDmg;
    p.iwOuterPen = iwStats.outerPen;
    p.iwPzPen = iwStats.pzPen;
    p.iwPzDmg = iwStats.pzDmg;

    return p;
    // basePanel MUST be a dep: it carries the calibrated base (baseOverride) and
    // the gear-derived stats. Without it, calibrating (which changes basePanel but
    // not panel/gear) left adjustedPanel — and thus the COMBAT column + graduation
    // + DPS — stale, so COMBAT could read lower than MENU and Calibrate appeared
    // to do nothing.
  }, [basePanel, bowSelect, food, script50, activeTier, iwStats, autoGearPanel, activeScheme?.gear]);

  // 3. Baseline = authoritative "fully graduated" T91/Lv95 DPS per build (from the
  //    源 spreadsheet, converted to rotation-window total). See calcBaseline / T91_GRAD_DPS.
  const baselineScore = useMemo(() => {
    return calcBaseline(activeTier, selectedBuild);
  }, [activeTier, selectedBuild]);

  // 4. Compute Rotation list damage
  const rotationStats = useMemo(() => {
    let totalDmg = 0;
    const comp = { crit: 0, aff: 0, normal: 0, abrasion: 0 };
    const items = getRotationForBuild(selectedBuild).map((item) => {
      const { perHit, total, breakdown } = calcSkill(item, adjustedPanel, activeTier, {
        set: adjustedPanel.set,
        datang,
        yishui,
        buildKey: selectedBuild,
        weaponStars: (adjustedPanel as any).weaponStars,
      } as any);
      totalDmg += total;
      comp.crit += breakdown.crit;
      comp.aff += breakdown.aff;
      comp.normal += breakdown.normal;
      comp.abrasion += breakdown.abrasion;
      return {
        ...item,
        perHit,
        total,
      };
    });

    const dps = totalDmg / getRotationTimeForBuild(selectedBuild);
    const gradRate = (totalDmg / baselineScore) * 100;

    // % of total per hit-outcome for the in-game "Damage Composition" donut.
    const cTot = comp.crit + comp.aff + comp.normal + comp.abrasion || 1;
    const compPct = {
      crit: (comp.crit / cTot) * 100,
      aff: (comp.aff / cTot) * 100,
      normal: (comp.normal / cTot) * 100,
      abrasion: (comp.abrasion / cTot) * 100,
    };

    return {
      items,
      totalDmg,
      dps,
      gradRate,
      composition: comp,
      compositionPct: compPct,
    };
  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore]);

  // ── Skill Damage Preview (read-only): per-cast damage by outcome ────────────
  const skillPreview = useMemo(() => {
    return getRotationForBuild(selectedBuild).map(item => {
      const { sim } = calcSkill(item, adjustedPanel, activeTier, {
        set: adjustedPanel.set, datang, yishui, buildKey: selectedBuild,
        weaponStars: (adjustedPanel as any).weaponStars,
      } as any);
      return { name: item.name, count: item.count, crit: sim.critHit, aff: sim.affHit, normal: sim.normHit, abrasion: sim.grazeHit };
    });
  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild]);

  // ── Phase 2: Rotations editor ───────────────────────────────────────────────
  // View/edit the current build's rotation and recompute DPS through the timeline
  // engine (simulateRotation wraps the verified calcSkill — the per-hit formula is
  // untouched). Re-added as an EDITOR per user request; see CLAUDE.md #7 (distinct
  // from the old Swap/Rotation Sim that was removed).
  const [editedRotation, setEditedRotation] = useState<RotationItem[] | null>(null);
  // Edits are build-specific — discard them when the build changes.
  useEffect(() => { setEditedRotation(null); }, [selectedBuild]);

  const effectiveRotation = editedRotation ?? getRotationForBuild(selectedBuild);

  const rotationSim = useMemo(() => {
    const rotation = editedRotation ?? getRotationForBuild(selectedBuild);
    const opts = {
      set: adjustedPanel.set, datang, yishui,
      buildKey: selectedBuild,
      weaponStars: (adjustedPanel as any).weaponStars,
    } as any;
    return simulateRotation(rotation, adjustedPanel, activeTier, opts, getRotationTimeForBuild(selectedBuild));
  }, [editedRotation, adjustedPanel, activeTier, datang, yishui, selectedBuild]);

  // Seed from the build default on first edit, then mutate a copy.
  const editRotation = (mutate: (r: RotationItem[]) => RotationItem[]) =>
    setEditedRotation(prev => mutate((prev ?? getRotationForBuild(selectedBuild)).map(it => ({ ...it }))));
  const setSkillCount = (i: number, count: number) =>
    editRotation(r => { r[i] = { ...r[i], count: Math.max(0, count) }; return r; });
  const removeSkill = (i: number) =>
    editRotation(r => r.filter((_, j) => j !== i));

  // ── Phase 3: Skill editor ───────────────────────────────────────────────────
  // Pick a skill, tweak its coefficients, and see the per-hit damage recompute
  // live through previewSkill (reuses the verified calcSkill via a temp SKILL_DB
  // inject — calc.ts and the real skills are never modified). Calculator/preview
  // ONLY: edits do NOT feed the rotation DPS (that would need an explicit override,
  // a later phase).
  const buildSkillNames = useMemo(() => {
    const seen = new Set<string>(); const out: string[] = [];
    for (const it of getRotationForBuild(selectedBuild)) if (!seen.has(it.name)) { seen.add(it.name); out.push(it.name); }
    return out;
  }, [selectedBuild]);

  const [editorSkillName, setEditorSkillName] = useState<string>("");
  const [editorOverrides, setEditorOverrides] = useState<Partial<SkillDefinition> | null>(null);
  // Default to the build's first skill; drop edits when skill or build changes.
  useEffect(() => { setEditorSkillName(buildSkillNames[0] || ""); }, [buildSkillNames]);
  useEffect(() => { setEditorOverrides(null); }, [editorSkillName, selectedBuild]);

  const setSkillField = (field: keyof SkillDefinition, val: number) =>
    setEditorOverrides(prev => ({ ...(prev || {}), [field]: val }));

  const skillEditorPreview = useMemo(() => {
    const orig = editorSkillName ? SKILL_DB[editorSkillName] : undefined;
    if (!orig) return null;
    const edited: SkillDefinition = { ...orig, ...(editorOverrides || {}) };
    const opts = {
      set: adjustedPanel.set, datang, yishui,
      buildKey: selectedBuild,
      weaponStars: (adjustedPanel as any).weaponStars,
    } as any;
    return {
      orig, edited,
      base: previewSkill(orig, adjustedPanel, activeTier, opts),
      sim: previewSkill(edited, adjustedPanel, activeTier, opts),
    };
  }, [editorSkillName, editorOverrides, adjustedPanel, activeTier, datang, yishui, selectedBuild]);

  // Bonus (Phase 2↔3): add a skill to the edited rotation, cloning the build's
  // default metadata for that skill when present (else a neutral one-cast item).
  const [addSkillName, setAddSkillName] = useState<string>("");
  const addSkillToRotation = (name: string) => {
    if (!name) return;
    const tmpl = getRotationForBuild(selectedBuild).find(it => it.name === name);
    const item: RotationItem = tmpl ? { ...tmpl } : { name, count: 1, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1 };
    editRotation(r => { r.push(item); return r; });
  };

  // ── Inner Ways: DPS loss if removed ─────────────────────────────────────────
  // Per equipped inner way, recompute the rotation with that way's stats removed
  // from the in-combat panel. The drop = how much DPS that way is contributing.
  const innerWayContrib = useMemo(() => {
    if (selectedInnerWays.length === 0) return [];
    const rotate = (panel: PanelStats) => {
      let t = 0;
      getRotationForBuild(selectedBuild).forEach(item => {
        t += calcSkill(item, panel, activeTier, {
          set: (panel as any).set, datang, yishui, buildKey: selectedBuild,
          weaponStars: (panel as any).weaponStars,
        } as any).total;
      });
      return t;
    };
    const baseTotal = rotationStats.totalDmg;
    const rotTime = getRotationTimeForBuild(selectedBuild);
    const list = selectedInnerWays.map(id => {
      const iw = INNER_WAYS.find(it => it.id === id);
      const tierNum = innerWayTiers[id] ?? 6;
      const s = iw?.tiers.find(t => t.tier === tierNum)?.stat;
      if (!iw || !s) return null;
      const p: any = { ...adjustedPanel };
      p.outerPen -= s.outerPen || 0;
      p.pzPen -= s.pzPen || 0;
      p.crit -= s.crit || 0;
      p.aff -= s.aff || 0;
      p.dcrit -= s.dcrit || 0;
      p.daff -= s.daff || 0;
      p.critDmg -= s.critDmg || 0;
      p.affDmg -= s.affDmg || 0;
      p.outerDmg -= s.outerDmg || 0;
      p.pzDmg -= s.pzDmg || 0;
      p.iwGeneralDmg = (p.iwGeneralDmg || 0) - (s.generalDmg || 0);
      const reduced = rotate(p);
      const lossDps = (baseTotal - reduced) / rotTime;
      const lossPct = baseTotal > 0 ? ((baseTotal - reduced) / baseTotal) * 100 : 0;
      return { id, name: iw.name, tier: tierNum, lossDps, lossPct };
    }).filter(Boolean) as { id: string; name: string; tier: number; lossDps: number; lossPct: number }[];
    list.sort((a, b) => b.lossDps - a.lossDps);
    return list;
  }, [selectedInnerWays, innerWayTiers, adjustedPanel, activeTier, datang, yishui, selectedBuild, rotationStats.totalDmg]);

  // ── Best Build search ──────────────────────────────────────────────────────
  // Scans the whole gear pool (all items, equipped or not) for this scheme,
  // groups by slot, and finds the gear combination with the highest graduation
  // rate. Mirrors the live grad-rate pipeline so its numbers match the panel.
  // ponytail: single source for "gear combo → in-combat panel → rotation total".
  // Mirrors adjustedPanel's buff pipeline; reused by Best Build, gear contribution,
  // and the set/bow comparison tables.
  const comboInCombat = (combo: GearItem[]): { total: number; crit: number } => {
    let p = computeGearPanel(panel, combo, activeScheme?.baseOverride, innerAttrName(selectedBuild));
    if (food) { p.minOuter += activeTier.foodMin; p.maxOuter += activeTier.foodMax; }
    if (bowSelect === "crit") p.crit += 3.7; else if (bowSelect === "prec") p.prec += 3.3; else if (bowSelect === "aff") p.aff += 1.8;
    if (script50) p.dcrit += 15.0;
    const setCounts: Record<string, number> = {};
    combo.forEach(it => { if (it.set && it.set !== "none") setCounts[it.set] = (setCounts[it.set] || 0) + 1; });
    let active4pc = "none";
    Object.entries(setCounts).forEach(([k, c]) => { if (c >= 4) active4pc = k; });
    p.set = active4pc;
    (p as any).weaponStars = (setCounts["stars"] || 0) >= 4 || active4pc === "stars";
    p.outerPen += iwStats.outerPen; p.pzPen += iwStats.pzPen; p.crit += iwStats.crit; p.aff += iwStats.aff;
    p.dcrit += iwStats.dcrit; p.critDmg += iwStats.critDmg; p.affDmg += iwStats.affDmg;
    p.outerDmg += iwStats.outerDmg; p.pzDmg += iwStats.pzDmg; p.iwGeneralDmg = iwStats.generalDmg;
    let totalDmg = 0;
    getRotationForBuild(selectedBuild).forEach(item => {
      const { total } = calcSkill(item, p, activeTier, { set: p.set, datang, yishui, buildKey: selectedBuild, weaponStars: (p as any).weaponStars } as any);
      totalDmg += total;
    });
    return { total: totalDmg, crit: p.crit };
  };

  const gradRateForGearCombo = (combo: GearItem[]): number => {
    const { total: totalDmg, crit } = comboInCombat(combo);
    let rate = (totalDmg / baselineScore) * 100;
    // ponytail: crit above the effective cap (80% × judgmentFactor) adds zero
    // DPS, so calcSkill scores two combos identically whether one wastes 10%
    // crit or not. Subtract a tiny penalty per overcap point so the search
    // breaks those ties toward the combo that wastes less — letting you re-roll
    // the dead crit into pen/crit-DMG. Penalty is ~0.001%/pt: it only ever
    // decides between otherwise-equal builds, never overrides a real DPS gain.
    const critCap = 80 * judgmentFactor;
    const overCrit = Math.max(0, crit - critCap);
    rate -= overCrit * 0.001;
    return rate;
  };

  // ── Per-slot DPS contribution ("DPS Breakdown by Gear") ─────────────────────
  // For each equipped piece, recompute the rotation with that slot removed; the
  // drop = the DPS that piece's stats (+ any set bonus it enables) are adding.
  const gearContrib = useMemo(() => {
    const all = getActiveGear();
    const equipped = all.filter(it => isItemEquipped(it, all));
    if (equipped.length === 0) return [] as { slot: string; name: string; lossDps: number; lossPct: number }[];
    const baseTotal = comboInCombat(equipped).total;
    const rotTime = getRotationTimeForBuild(selectedBuild);
    const rows = equipped.map(it => {
      const without = equipped.filter(x => x !== it);
      const reduced = comboInCombat(without).total;
      const lossDps = (baseTotal - reduced) / rotTime;
      const lossPct = baseTotal > 0 ? ((baseTotal - reduced) / baseTotal) * 100 : 0;
      return { slot: it.slot, name: it.name, lossDps, lossPct };
    });
    rows.sort((a, b) => b.lossDps - a.lossDps);
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScheme?.gear, panel, food, bowSelect, script50, iwStats, activeTier, datang, yishui, selectedBuild, baselineScore]);

  // ── Bow set comparison (crit / precision / affinity / none) ─────────────────
  const bowCompare = useMemo(() => {
    const all = getActiveGear();
    const equipped = all.filter(it => isItemEquipped(it, all));
    const rotTime = getRotationTimeForBuild(selectedBuild);
    const opts: { key: string; label: string }[] = [
      { key: "crit", label: "Crit +3.7%" },
      { key: "aff", label: "Affinity +1.8%" },
      { key: "prec", label: "Precision +3.3%" },
      { key: "none", label: "None" },
    ];
    // Recompute each option by temporarily overriding the bow stat on the panel.
    const dpsFor = (bow: string) => {
      let p = computeGearPanel(panel, equipped, activeScheme?.baseOverride, innerAttrName(selectedBuild));
      if (food) { p.minOuter += activeTier.foodMin; p.maxOuter += activeTier.foodMax; }
      if (bow === "crit") p.crit += 3.7; else if (bow === "prec") p.prec += 3.3; else if (bow === "aff") p.aff += 1.8;
      if (script50) p.dcrit += 15.0;
      const setCounts: Record<string, number> = {};
      equipped.forEach(it => { if (it.set && it.set !== "none") setCounts[it.set] = (setCounts[it.set] || 0) + 1; });
      let active4pc = "none"; Object.entries(setCounts).forEach(([k, c]) => { if (c >= 4) active4pc = k; });
      p.set = active4pc; (p as any).weaponStars = (setCounts["stars"] || 0) >= 4 || active4pc === "stars";
      p.outerPen += iwStats.outerPen; p.pzPen += iwStats.pzPen; p.crit += iwStats.crit; p.aff += iwStats.aff;
      p.dcrit += iwStats.dcrit; p.critDmg += iwStats.critDmg; p.affDmg += iwStats.affDmg;
      p.outerDmg += iwStats.outerDmg; p.pzDmg += iwStats.pzDmg; p.iwGeneralDmg = iwStats.generalDmg;
      let t = 0;
      getRotationForBuild(selectedBuild).forEach(item => { t += calcSkill(item, p, activeTier, { set: p.set, datang, yishui, buildKey: selectedBuild, weaponStars: (p as any).weaponStars } as any).total; });
      return t / rotTime;
    };
    const curDps = dpsFor(bowSelect);
    return opts.map(o => {
      const dps = dpsFor(o.key);
      return { ...o, dps, delta: dps - curDps, active: o.key === bowSelect };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScheme?.gear, panel, food, bowSelect, script50, iwStats, activeTier, datang, yishui, selectedBuild]);

  // ── Armor set comparison (swap 2pc stat + 4pc that the calc models) ─────────
  // 2pc stats are T91-verified; 4pc is only modeled in calc for stars/ivorybloom
  // (others compare 2pc only — flagged with `modeled`). Needs the Excel for full 4pc.
  const armorSetCompare = useMemo(() => {
    const cur = (adjustedPanel.set as string) || "none";
    const rotTime = getRotationTimeForBuild(selectedBuild);
    const SETS = ["stars", "ivorybloom", "eaglerise", "jadeware", "swallowreturn", "mistwillow", "none"];
    const modeled4pc = new Set(["stars", "ivorybloom"]);
    const dpsFor = (key: string) => {
      const p: any = { ...adjustedPanel };
      const rm = (ARMOR_SETS as any)[cur]?.stat2pc as Record<string, number> | undefined;
      const ad = (ARMOR_SETS as any)[key]?.stat2pc as Record<string, number> | undefined;
      if (rm) for (const k in rm) p[k] = (p[k] || 0) - rm[k];
      if (ad) for (const k in ad) p[k] = (p[k] || 0) + ad[k];
      p.set = key;
      (p as any).weaponStars = key === "stars" || (adjustedPanel as any).weaponStars;
      let t = 0;
      getRotationForBuild(selectedBuild).forEach(item => { t += calcSkill(item, p, activeTier, { set: key, datang, yishui, buildKey: selectedBuild, weaponStars: (p as any).weaponStars } as any).total; });
      return t / rotTime;
    };
    const curDps = dpsFor(cur);
    return SETS.map(key => {
      const dps = dpsFor(key);
      return {
        key,
        name: (ARMOR_SETS as any)[key]?.name || key,
        dps,
        delta: dps - curDps,
        active: key === cur,
        modeled: key === "none" ? true : modeled4pc.has(key),
      };
    }).sort((a, b) => b.dps - a.dps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild]);

  // ── Monte Carlo Damage Simulation ───────────────────────────────────────────
  // Rolls each cast's outcome (crit/aff/normal/abrasion) instead of using the
  // probability-weighted average. Verifies the main calc + shows parse variance.
  const runSimulation = () => {
    const runs = Math.max(1, Math.min(2000, Math.round(simRuns) || 100));
    const rotTime = getRotationTimeForBuild(selectedBuild);
    const skills = getRotationForBuild(selectedBuild).map(item =>
      calcSkill(item, adjustedPanel, activeTier, {
        set: adjustedPanel.set, datang, yishui, buildKey: selectedBuild,
        weaponStars: (adjustedPanel as any).weaponStars,
      } as any).sim
    );
    const totals: number[] = [];
    let hCrit = 0, hAff = 0, hNorm = 0, hAbr = 0;
    let dCrit = 0, dAff = 0, dNorm = 0, dAbr = 0;
    let totalHits = 0, totalDmgAll = 0;
    for (let r = 0; r < runs; r++) {
      let runTotal = 0;
      for (const s of skills) {
        for (let c = 0; c < s.casts; c++) {
          const x = Math.random();
          let v: number;
          if (x < s.pCrit) { v = s.critHit; hCrit++; dCrit += v; }
          else if (x < s.pCrit + s.pAff) { v = s.affHit; hAff++; dAff += v; }
          else if (x < s.pCrit + s.pAff + s.pGraze) { v = s.grazeHit; hAbr++; dAbr += v; }
          else { v = s.normHit; hNorm++; dNorm += v; }
          runTotal += v; totalHits++; totalDmgAll += v;
        }
      }
      totals.push(runTotal);
    }
    totals.sort((a, b) => a - b);
    const pick = (p: number) => totals[Math.min(totals.length - 1, Math.floor(p * totals.length))];
    const mean = totals.reduce((a, b) => a + b, 0) / runs;
    const expected = rotationStats.totalDmg || 1;
    const pctOf = (n: number, d: number) => d > 0 ? (n / d) * 100 : 0;
    setSimResult({
      runs, hitsPerRun: Math.round(totalHits / runs), duration: rotTime,
      expectedDps: expected / rotTime,
      avgDps: mean / rotTime,
      bestDps: totals[totals.length - 1] / rotTime,
      worstDps: totals[0] / rotTime,
      p25: pick(0.25) / rotTime, p50: pick(0.5) / rotTime, p75: pick(0.75) / rotTime,
      diffPct: ((mean - expected) / expected) * 100,
      rangePct: pctOf((totals[totals.length - 1] - totals[0]) / 2, mean),
      dist: {
        crit: { hit: pctOf(hCrit, totalHits), dmg: pctOf(dCrit, totalDmgAll) },
        aff: { hit: pctOf(hAff, totalHits), dmg: pctOf(dAff, totalDmgAll) },
        normal: { hit: pctOf(hNorm, totalHits), dmg: pctOf(dNorm, totalDmgAll) },
        abrasion: { hit: pctOf(hAbr, totalHits), dmg: pctOf(dAbr, totalDmgAll) },
      },
    });
  };

  const [bestBuildResult, setBestBuildResult] = useState<{ rate: number; gear: GearItem[] }[] | null>(null);
  const [bestBuildRunning, setBestBuildRunning] = useState(false);
  const [bestBuildProgress, setBestBuildProgress] = useState(0);

  const runBestBuild = async () => {
    setBestBuildRunning(true);
    setBestBuildResult(null);
    setBestBuildProgress(0);
    await new Promise(r => setTimeout(r, 30)); // let UI paint the spinner

    const pool = getActiveGear();
    const SLOT_ORDER = ["Umbrella", "Rope Dart", "Disc", "Pendant", "Helmet", "Chest", "Bracers", "Greaves"];
    const bySlot: Record<string, GearItem[]> = {};
    SLOT_ORDER.forEach(s => { bySlot[s] = pool.filter(it => it.slot === s); });

    // Cap combinations to keep it responsive: if a slot has many items, keep the
    // top ~6 by individual grad delta. ponytail: linear pre-prune, exhaustive
    // search within the pruned set; raise the cap if users need deeper search.
    const MAX_PER_SLOT = 6;
    SLOT_ORDER.forEach(s => {
      if (bySlot[s].length > MAX_PER_SLOT) {
        bySlot[s] = [...bySlot[s]]
          .map(it => ({ it, d: getGearItemCompareStats(it).totalGradDelta }))
          .sort((a, b) => b.d - a.d)
          .slice(0, MAX_PER_SLOT)
          .map(x => x.it);
      }
    });

    const totalCombos = SLOT_ORDER.reduce((n, s) => n * Math.max(1, bySlot[s].length), 1);
    let checked = 0;
    const top: { rate: number; gear: GearItem[] }[] = [];

    const recurse = async (idx: number, acc: GearItem[]) => {
      if (idx === SLOT_ORDER.length) {
        const rate = gradRateForGearCombo(acc);
        top.push({ rate, gear: [...acc] });
        top.sort((a, b) => b.rate - a.rate);
        if (top.length > 10) top.length = 10;
        checked++;
        if (checked % 200 === 0) {
          setBestBuildProgress(Math.round((checked / Math.max(1, totalCombos)) * 100));
          await new Promise(r => setTimeout(r, 0)); // yield to keep UI alive
        }
        return;
      }
      const opts = bySlot[SLOT_ORDER[idx]];
      if (opts.length === 0) { await recurse(idx + 1, acc); return; }
      for (const it of opts) { acc.push(it); await recurse(idx + 1, acc); acc.pop(); }
    };

    await recurse(0, []);
    setBestBuildProgress(100);
    setBestBuildResult(top);
    setBestBuildRunning(false);
  };

  // 5. Live Stat Priority: % graduation gain/loss per substat roll, computed against the CURRENT panel
  const statPriorityList = useMemo(() => {
    const ALL_STAT_ROLLS: { key: keyof PanelStats; label: string; roll: number; unit: string }[] = [
      { key: "maxOuter", label: "Max Phys ATK", roll: 63.8, unit: "" },
      { key: "minOuter", label: "Min Phys ATK", roll: 63.8, unit: "" },
      { key: "outerPen", label: "Phys Pen", roll: 9.0, unit: "%" },
      { key: "crit", label: "Crit Rate", roll: 7.4, unit: "%" },
      { key: "critDmg", label: "Crit DMG", roll: 5.0, unit: "%" },
      { key: "aff", label: "Affinity Rate", roll: 3.6, unit: "%" },
      { key: "affDmg", label: "Affinity DMG", roll: 5.0, unit: "%" },
      { key: "prec", label: "Precision", roll: 6.6, unit: "%" },
      { key: "maxPz", label: "Max Bamboocut ATK", roll: 36.2, unit: "" },
      { key: "pzPen", label: "Formless Pen", roll: 9.0, unit: "%" },
      { key: "dcrit", label: "Direct Crit Rate", roll: 4.6, unit: "%" },
      { key: "umbAll", label: "Art of Umbrella Boost", roll: 2.6, unit: "%" },
      { key: "umbMartial", label: "Umb Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "ropeAll", label: "Art of Rope Dart Boost", roll: 2.6, unit: "%" },
      { key: "ropeMartial", label: "Rope Dart Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "swordAll", label: "Art of Sword Boost", roll: 2.6, unit: "%" },
      { key: "swordMartial", label: "Sword Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "spearAll", label: "Art of Spear Boost", roll: 2.6, unit: "%" },
      { key: "spearMartial", label: "Spear Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "fanAll", label: "Art of Fan Boost", roll: 2.6, unit: "%" },
      { key: "fanMartial", label: "Fan Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "twinbladesAll", label: "Art of Dual Blades Boost", roll: 2.6, unit: "%" },
      { key: "twinbladesMartial", label: "Dual Blades Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "modaoAll", label: "Art of Mo Blade Boost", roll: 2.6, unit: "%" },
      { key: "modaoMartial", label: "Mo Blade Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "hengdaoAll", label: "Art of Heng Blade Boost", roll: 2.6, unit: "%" },
      { key: "hengdaoMartial", label: "Heng Blade Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "gauntletsAll", label: "Art of Gauntlets Boost", roll: 2.6, unit: "%" },
      { key: "gauntletsMartial", label: "Gauntlets Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "allArts", label: "All Martial Art Skill DMG Boost", roll: 5.0, unit: "%" },
      { key: "bossDmg", label: "Boss DMG", roll: 2.0, unit: "%" },
      { key: "outerDmg", label: "Phys DMG", roll: 2.0, unit: "%" },
    ];

    // Only show weapon-specific boosts for THIS build's two weapons; keep all
    // universal stats. Avoids cluttering the list with irrelevant weapon paths.
    const buildPrefixes = getBuildWeaponPrefixes(selectedBuild);
    const STAT_ROLLS = ALL_STAT_ROLLS.filter(({ key }) => {
      const m = (key as string).match(WEAPON_STAT_KEY_RE);
      if (!m) return true; // universal stat
      return buildPrefixes.includes(m[1]);
    });

    const totalFor = (p: PanelStats) => {
      let total = 0;
      getRotationForBuild(selectedBuild).forEach((item) => {
        const { total: dmg } = calcSkill(item, p, activeTier, {
          set: p.set || adjustedPanel.set,
          datang,
          yishui,
          buildKey: selectedBuild,
        });
        total += dmg;
      });
      return total;
    };
    const gradFor = (p: PanelStats) => (totalFor(p) / baselineScore) * 100;

    const baseGrad = rotationStats.gradRate;
    const baseTotal = rotationStats.totalDmg;
    const rotTime = getRotationTimeForBuild(selectedBuild);

    const rows = STAT_ROLLS.map(({ key, label, roll, unit }) => {
      const cur = adjustedPanel[key] as number;
      const pUp = { ...adjustedPanel, [key]: cur + roll };
      const upTotal = totalFor(pUp);
      const gain = (upTotal / baselineScore) * 100 - baseGrad;
      const gainDps = (upTotal - baseTotal) / rotTime; // DPS added by one more roll

      const pDown = { ...adjustedPanel, [key]: Math.max(0, cur - roll) };
      const loss = gradFor(pDown) - baseGrad; // negative or ~zero

      return { key, label, roll, unit, gain, gainDps, loss };
    });

    return {
      base: baseGrad,
      gains: [...rows].sort((a, b) => b.gain - a.gain),
      losses: [...rows].sort((a, b) => a.loss - b.loss),
    };
  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore, rotationStats.gradRate, rotationStats.totalDmg]);

  // Helper to dynamically calculate stats for any stored profile
  const getDynamicProfileStats = (prof: typeof profiles[0]) => {
    const profPanel = { ...prof.panel };
    profPanel.iwGeneralDmg = iwStats.generalDmg;
    profPanel.iwOuterPen = iwStats.outerPen;
    profPanel.iwPzPen = iwStats.pzPen;
    profPanel.iwPzDmg = iwStats.pzDmg;

    let totalDmg = 0;
    getRotationForBuild(selectedBuild).forEach((item) => {
      const { total } = calcSkill(item, profPanel, activeTier, {
        set: profPanel.set || "gold",
        datang,
        yishui,
        buildKey: selectedBuild,
      });
      totalDmg += total;
    });

    const dps = totalDmg / getRotationTimeForBuild(selectedBuild);
    const gradRate = (totalDmg / baselineScore) * 100;

    return {
      dps,
      gradRate
    };
  };

  // ── Team builder (Phase 4) ──────────────────────────────────────────────────
  // Team DPS = sum of each member's solo DPS (their saved profile panel run through
  // the current build's rotation) × optional team-wide buff multipliers. Kill time =
  // boss HP / team DPS. Placed AFTER getDynamicProfileStats (TDZ).
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>(["", "", "", "", ""]);
  const [teamVuln, setTeamVuln] = useState<boolean>(false);
  const [teamRevelry, setTeamRevelry] = useState<boolean>(false);
  const [bossHp, setBossHp] = useState<number>(3500000);
  const teamSim = useMemo(() => {
    const active = teamMemberIds.map(id => {
      const prof = id ? profiles.find(p => p.id === id) : undefined;
      return prof ? { id, name: prof.name, dps: getDynamicProfileStats(prof).dps } : null;
    }).filter(Boolean) as { id: string; name: string; dps: number }[];
    const soloSum = active.reduce((s, m) => s + m.dps, 0);
    const buffMult = 1 + (teamVuln ? 0.08 : 0) + (teamRevelry ? 0.30 : 0);
    const teamDps = soloSum * buffMult;
    const killTime = teamDps > 0 ? bossHp / teamDps : 0;
    return { active, soloSum, buffMult, teamDps, killTime };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamMemberIds, profiles, teamVuln, teamRevelry, bossHp, adjustedPanel, activeTier, datang, yishui, selectedBuild, iwStats, baselineScore]);

  const statPriorities = useMemo(() => {
    const baseDmg = rotationStats.totalDmg;
    if (baseDmg <= 0) return [];

    // Define increments for testing marginal gains
    const increments = [
      { key: "maxOuter", label: "Physical Atk (Phys Atk)", value: 10, bonusLabel: "+10 Atk", color: "from-[#e6c200] to-[#f0b400]" },
      { key: "outerPen", label: "Physical Penetration (Phys Pen %)", value: 1.0, bonusLabel: "+1.0%", color: "from-red-600 to-rose-500" },
      { key: "crit", label: "Critical Rate (Crit Rate %)", value: 1.0, bonusLabel: "+1.0%", color: "from-orange-500 to-orange-400" },
      { key: "critDmg", label: "Critical Damage (Crit DMG %)", value: 1.0, bonusLabel: "+1.0%", color: "from-yellow-600 to-yellow-500" },
      { key: "aff", label: "Affinity Rate (Affinity %)", value: 1.0, bonusLabel: "+1.0%", color: "from-indigo-500 to-indigo-400" },
      { key: "maxPz", label: "Bamboocut Atk (Bamboocut Atk)", value: 10, bonusLabel: "+10 Atk", color: "from-emerald-600 to-emerald-500" },
      { key: "pzPen", label: "Bamboocut Penetration (Bamboocut Pen %)", value: 1.0, bonusLabel: "+1.0%", color: "from-teal-500 to-teal-400" },
      { key: "pzDmg", label: "Bamboocut DMG Boost (Bamboocut DMG %)", value: 1.0, bonusLabel: "+1.0%", color: "from-cyan-500 to-cyan-400" },
    ];

    const results = increments.map((inc) => {
      const cloned = { ...adjustedPanel };
      
      if (inc.key === "maxOuter") {
        cloned.maxOuter += inc.value;
        cloned.minOuter += inc.value / 2;
      } else if (inc.key === "maxPz") {
        cloned.maxPz += inc.value;
        cloned.minPz += inc.value / 2;
      } else {
        (cloned as any)[inc.key] += inc.value;
      }

      const newDmg = computeTotalDamage(cloned);
      const gain = Math.max(0, newDmg - baseDmg);
      const gainPerUnit = gain / inc.value;

      return {
        ...inc,
        gain,
        gainPerUnit,
      };
    });

    const maxGain = Math.max(...results.map((r) => r.gainPerUnit));

    return results
      .map((r) => {
        const relative = maxGain > 0 ? (r.gainPerUnit / maxGain) * 100 : 0;
        return {
          ...r,
          relative,
        };
      })
      .sort((a, b) => b.gainPerUnit - a.gainPerUnit);
  }, [adjustedPanel, activeTier, datang, yishui, rotationStats.totalDmg]);

  // Handle OCR fast load
  const handleOcrResult = (scanned: Partial<PanelStats>) => {
    setPanel((prev) => ({
      ...prev,
      ...scanned,
    }));
    setActiveTab("calculator");
  };

  // Synchronizers from Simulators
  const handleSimSync = (scanned: Partial<PanelStats>) => {
    setPanel((prev) => ({
      ...prev,
      ...scanned,
    }));
  };

  const netPhysPen = useMemo(() => {
    return adjustedPanel.outerPen - activeTier.physRes;
  }, [adjustedPanel, activeTier]);

  const netPzPen = useMemo(() => {
    return adjustedPanel.pzPen - activeTier.attrRes;
  }, [adjustedPanel, activeTier]);

  const judgmentFactor = 1 + activeTier.judgeRes;
  const effPrecision = useMemo(() => {
    return Math.min(100, (0.65 + Math.max(0, adjustedPanel.prec - 65) / 100 / judgmentFactor) * 100);
  }, [adjustedPanel, judgmentFactor]);

  const effCritRate = useMemo(() => {
    // Direct Crit is NOT limited by the 80% Crit cap (game: "not limited by
    // Critical Rate cap"). Cap the base crit at 80, then add Direct Crit on top.
    // Matches calc.ts: min(critEff, 0.8) + dirCrit.
    return Math.min(80, (adjustedPanel.crit / 100 / judgmentFactor) * 100) + adjustedPanel.dcrit;
  }, [adjustedPanel, judgmentFactor]);

  const effAffRate = useMemo(() => {
    return Math.min(40, (adjustedPanel.aff / 100 / judgmentFactor) * 100) + adjustedPanel.daff;
  }, [adjustedPanel, judgmentFactor]);

  const effectivePrecision = useMemo(() => {
    return Math.min(100, adjustedPanel.prec / judgmentFactor);
  }, [adjustedPanel.prec, judgmentFactor]);

  const effectiveCritical = useMemo(() => {
    return Math.min(80, adjustedPanel.crit / judgmentFactor);
  }, [adjustedPanel.crit, judgmentFactor]);

  const effectiveAffinity = useMemo(() => {
    return Math.min(40, adjustedPanel.aff / judgmentFactor);
  }, [adjustedPanel.aff, judgmentFactor]);

  const effGrazeRate = useMemo(() => {
    return Math.max(0, 100 - effPrecision);
  }, [effPrecision]);

  const expectedMultiplier = useMemo(() => {
    return 1 + (effCritRate / 100) * (adjustedPanel.critDmg / 100) + (effAffRate / 100) * (adjustedPanel.affDmg / 100);
  }, [effCritRate, effAffRate, adjustedPanel]);

  const handleStatChange = (key: keyof PanelStats, val: number | string) => {
    setPanel((prev) => ({
      ...prev,
      [key]: val,
    }));
  };


  return (
    <div className="min-h-screen bg-[#1a1a1d] text-[#e0e0e0] font-sans antialiased selection:bg-[#f0b400]/25 selection:text-[#f0b400]">
      {/* Accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#e6c200] via-[#f0b400] to-[#e6c200]" />

      {/* ── HEADER ── */}
      <header>
        <div className="header-title-container">
          <div className="header-title-group">
            <h1>Where Winds Meet Gear Graduation Manager</h1>
            <button
              onClick={() => {
                alert(
                  "Where Winds Meet Gear Graduation Manager\\n" +
                  "Edition: Global (T91 / Lv95)\\n" +
                  "Author: Wonton"
                );
              }}
              className="info-icon-btn"
              title="About this site"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M10 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="13" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <span className="xinli-hint">Last DB Update: June 15, 2026</span>
        </div>
        <div className="header-controls">
          <div className="account-select-group">
            <label>Current Role:</label>
            <select
              value={charsData.activeCharId ?? ""}
              onChange={(e) => {
                const headId = e.target.value;
                const char = charsData.chars.find(c => c.id === headId);
                const firstSchemeId = char?.schemes[0]?.id ?? null;
                const newData = { ...charsData, activeCharId: headId, activeSchemeId: firstSchemeId };
                setCharsData(newData);
                localStorage.setItem("wwm_chars_v3", JSON.stringify(newData));
              }}
              id="account-select"
            >
              {charsData.chars.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {charsData.chars.length > 1 && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this character?")) {
                    const remaining = charsData.chars.filter(c => c.id !== charsData.activeCharId);
                    const newData: CharsData = {
                      chars: remaining,
                      activeCharId: remaining[0]?.id ?? null,
                      activeSchemeId: remaining[0]?.schemes[0]?.id ?? null
                    };
                    setCharsData(newData);
                    localStorage.setItem("wwm_chars_v3", JSON.stringify(newData));
                  }
                }}
                className="danger-btn"
                title="Delete current character"
              >
                Delete
              </button>
            )}
          </div>
          <button
            onClick={() => {
              const name = prompt("Enter new character name:");
              if (!name) return;
              const newId = "char-" + Date.now();
              const schemeId = "scheme-" + Date.now();
              const newChar: Character = {
                id: newId,
                name,
                schemes: [
                  {
                    id: schemeId,
                    name: "Scheme 1",
                    panel: panel,
                    gear: DEFAULT_GEAR
                  }
                ]
              };
              const newData: CharsData = {
                ...charsData,
                chars: [...charsData.chars, newChar],
                activeCharId: newId,
                activeSchemeId: schemeId
              };
              setCharsData(newData);
              localStorage.setItem("wwm_chars_v3", JSON.stringify(newData));
            }}
            className="secondary-btn"
          >
            + New Role
          </button>
          <button
            onClick={() => setIsExportImportModalOpen(true)}
            className="secondary-btn"
          >
            Export/Import Data
          </button>
          <button
            onClick={() => setIsBatchOcrModalOpen(true)}
            className="secondary-btn"
          >
            Batch OCR
          </button>
          <button
            onClick={() => setIsGameImportOpen(true)}
            className="secondary-btn"
            title="Import your equipped gear straight from the official WWM dashboard"
          >
            📥 Import from Game
          </button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="app-layout">
        {/* Left Column: Inventory */}
        <div className="layout-left" id="main-content">
          <div id="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div className="filter-capsule">
              {[
                { key: "ALL", label: "All Slots" },
                { key: "Umbrella", label: "Weapon 1" },
                { key: "Rope Dart", label: "Weapon 2" },
                { key: "Helmet", label: "Helmet" },
                { key: "Chest", label: "Chest" },
                { key: "Bracers", label: "Hands" },
                { key: "Greaves", label: "Legs" },
                { key: "Disc", label: "Disc" },
                { key: "Pendant", label: "Pendant" }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setGearFilterSlot(tab.key)}
                  className={`filter-btn ${gearFilterSlot === tab.key ? "active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Weapons/Disc/Pendant and armor use different set pools — set each, then Set all">
              <select
                value={setAllWeapon}
                onChange={e => setSetAllWeapon(e.target.value)}
                title="Weapon / accessory set (Weapon 1·2, Disc, Pendant)"
                style={{ width: 'auto', minWidth: 88, padding: '6px', fontSize: 12 }}
              >
                {WEAPON_SET_KEYS.map(k => <option key={k} value={k}>{getSetName(k)}</option>)}
              </select>
              <select
                value={setAllArmor}
                onChange={e => setSetAllArmor(e.target.value)}
                title="Armor 4pc set (Helmet, Chest, Hands, Legs)"
                style={{ width: 'auto', minWidth: 88, padding: '6px', fontSize: 12 }}
              >
                {ARMOR_SET_KEYS.map(k => <option key={k} value={k}>{getSetName(k)}</option>)}
              </select>
              <button
                className="secondary-btn"
                onClick={applySetToAll}
                title="Weapon set → Weapon/Disc/Pendant · Armor set → armor pieces"
                style={{ whiteSpace: 'nowrap' }}
              >Set all</button>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormName("");
                setFormQuality("gold");
                const initialSlot = gearFilterSlot === "ALL" ? "Umbrella" : gearFilterSlot;
                setSelectedSlot(initialSlot);
                if (initialSlot === "Umbrella" || initialSlot === "Rope Dart" || initialSlot === "Pendant" || initialSlot === "Disc") {
                  setFormSet("none");
                } else if (initialSlot === "Bow/Ring") {
                  setFormSet("pursuing");
                } else {
                  setFormSet("stars");
                }
                const defaultTypes = BUILD_WEAPON_TYPES[selectedBuild] || ["Umbrella", "Rope Dart"];
                setFormWeaponType(initialSlot === "Umbrella" ? defaultTypes[0] : initialSlot === "Rope Dart" ? defaultTypes[1] : "Sword");
                setFormMastery("");
                setFormSubs([
                  { type: "Other", val: "" },
                  { type: "Other", val: "" },
                  { type: "Other", val: "" },
                  { type: "Other", val: "" },
                  { type: "Other", val: "" },
                  { type: "Other", val: "" }
                ]);
                setIsItemModalOpen(true);
              }}
              className="primary-btn"
              id="add-btn"
              style={{ position: 'relative', top: 'auto', transform: 'none', right: 'auto' }}
            >
              <span className="add-btn-icon">+</span> Add Gear
            </button>
          </div>

          {getActiveGear().filter(it => gearFilterSlot === "ALL" || it.slot === gearFilterSlot).length === 0 ? (
            <div id="empty-equip-message" className="empty-equip-message" style={{ display: 'block' }}>
              No gear items in this slot. Click <strong className="text-accent">Add Gear</strong> above to enter one.
            </div>
          ) : (
            <main id="equipment-grid" className="grid-container">
              {getActiveGear()
                .filter(it => gearFilterSlot === "ALL" || it.slot === gearFilterSlot)
                .sort((a, b) => {
                  if (gearSortBy === "mastery") {
                    const mA = a.mastery !== undefined ? parseInt(a.mastery.toString()) : 0;
                    const mB = b.mastery !== undefined ? parseInt(b.mastery.toString()) : 0;
                    return mB - mA;
                  }
                  // Equipped first, then by grade (grad delta) high → low.
                  const eqA = isItemEquipped(a, getActiveGear()) ? 1 : 0;
                  const eqB = isItemEquipped(b, getActiveGear()) ? 1 : 0;
                  if (eqA !== eqB) return eqB - eqA;
                  const dB = getGearItemCompareStats(b).totalGradDelta;
                  const dA = getGearItemCompareStats(a).totalGradDelta;
                  if (dB !== dA) return dB - dA;
                  return a.name.localeCompare(b.name);
                })
                .map(item => {
                  const isEquipped = isItemEquipped(item, getActiveGear());
                  const isGold = item.quality === "gold";
                  const isPurple = item.quality === "purple";
                  const slotObj = SLOTS.find(s => s.name === item.slot);
                  const slotIcon = slotObj?.icon || "🛡";
                  const { totalGradDelta } = getGearItemCompareStats(item);

                  // Letter grade from grad delta (per-slot a single piece tops out ~8%).
                  const grade = totalGradDelta >= 7 ? "S" : totalGradDelta >= 5.5 ? "A" : totalGradDelta >= 4 ? "B" : totalGradDelta >= 2 ? "C" : "D";
                  const rarityClass = isGold ? "ga-rarity5" : isPurple ? "ga-rarity4" : "ga-rarity3";
                  const stars = isGold ? "★★★★★" : isPurple ? "★★★★" : "★★★";
                  const hasTuned = item.subs.some(s => s.isTuned);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleEquip(item)}
                      className={`equip-card ga-card ga-card--${rarityClass} ${isEquipped ? "equip-card-equipped" : ""}`}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {isEquipped && <span className="equipped-badge">Equipped</span>}
                      <button
                        className="edit-btn ga-card__edit"
                        onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                        title="Edit Gear"
                      >✎</button>

                      <div className="ga-card__top">
                        <div className="equip-icon-wrap ga-card__icon">
                          <img src={(item.slot === "Umbrella" || item.slot === "Rope Dart") ? getWeaponIconUrlByType(item.weaponType, item.slot, selectedBuild) : SLOT_IMAGES[item.slot]} alt={item.slot} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <div className="ga-card__id">
                          <div className={`ga-card__stars ga-card__stars--${isGold ? 5 : isPurple ? 4 : 3}`}>{stars}</div>
                          <h3 className="ga-card__name">{item.name}</h3>
                          <span className="ga-card__slot">{getSlotLabel(item.slot)}{item.weaponType ? ` · ${item.weaponType}` : ""}</span>
                        </div>
                        <div className={`ga-card__score ga-card__score--${grade}`}>
                          <span className="ga-card__score-grade">{grade}</span>
                          <span className="ga-card__score-val">{totalGradDelta.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="ga-card__subs">
                        {item.subs.slice(0, 4).map((sub, sidx) => (
                          <div key={sidx} className="ga-card__sub">
                            <span className="ga-card__sub-name">{sub.type} {sub.isTuned && <span className="ga-card__tuned">✦</span>}</span>
                            <span className="ga-card__sub-val">{sub.val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="ga-card__foot">
                        <div className="ga-card__badges">
                          {hasTuned && <span className="ga-card__badge ga-card__badge--tuned">Tuned</span>}
                          {item.mastery !== undefined && (
                            <span className="ga-card__badge" style={{ background: 'rgba(255,215,0,0.12)', color: '#d4b24a', borderColor: 'rgba(255,215,0,0.3)' }} title="Martial Mastery (武学修为)">MM {item.mastery}</span>
                          )}
                        </div>
                        <span className={`ga-card__delta ${totalGradDelta >= 0 ? "is-up" : "is-down"}`}>
                          {totalGradDelta >= 0 ? "+" : ""}{totalGradDelta.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </main>
          )}
        </div>

        {/* Right Column: Simulator Panel */}
        <aside id="simulator-panel">
          <div className="sim-header" style={{ cursor: 'default' }}>
            <h2>Panel Simulator</h2>
            <div className="sim-header-controls" style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedBuild}
                onChange={e => setSelectedBuild(e.target.value)}
                id="class-select"
                title="Select build path"
              >
                {Object.entries(BUILD_PROFILES).map(([key, b]) => (
                  <option key={key} value={key}>{b.label}{ESTIMATED_BUILDS.has(key) ? " (est.)" : ""}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => setCalibOpen(true)}
            className="secondary-btn"
            title="Match the panel to your in-game Combat Attributes (per character)"
            style={{ width: '100%', marginBottom: 12, whiteSpace: 'nowrap', borderColor: activeScheme?.baseOverride ? '#4caf50' : undefined, color: activeScheme?.baseOverride ? '#4caf50' : undefined }}
          >
            {activeScheme?.baseOverride ? "✓ Calibrated — matches in-game" : "⚙ Calibrate panel to in-game"}
          </button>
          {calibOpen && (
            <div className="modal" onClick={() => setCalibOpen(false)}>
              <div className="modal-content modal-content-medium" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title-no-margin">Calibrate panel from in-game</h2>
                  <span className="close-btn" onClick={() => setCalibOpen(false)}>×</span>
                </div>
                <div className="modal-body">
                  <p style={{ fontSize: 12.5, color: 'var(--text-sub)', lineHeight: 1.5, marginTop: 0 }}>
                    Type the numbers from your in-game <b>Combat Attributes</b> screen. First make sure the <b>same Inner Ways are selected here as in-game</b> — the app subtracts your gear sub-stats <i>and</i> inner-way stats to learn this character's true base, so the in-combat panel matches the game exactly (no double-counting). Re-calibrate if you change gear or inner ways.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
                    {CALIB_FIELDS.map(f => (
                      <label key={f.key as string} style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, color: 'var(--text-sub)' }}>
                        {f.label}
                        <input
                          type="number"
                          value={calibInputs[f.key as string] ?? ''}
                          onChange={e => setCalibInputs({ ...calibInputs, [f.key as string]: e.target.value })}
                          style={{ padding: '6px 8px' }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="modal-footer modal-footer-between">
                  <button className="danger-btn" onClick={clearCalibration} disabled={!activeScheme?.baseOverride}>Clear calibration</button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="cancel-btn" onClick={() => setCalibOpen(false)}>Cancel</button>
                    <button className="save-btn" onClick={applyCalibration}>Compute &amp; Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="scheme-controls">
            <label className="sim-label" style={{ margin: 0 }}>Scheme:</label>
            <select
              value={charsData.activeSchemeId ?? ""}
              onChange={(e) => {
                const sid = e.target.value;
                const nd = { ...charsData, activeSchemeId: sid };
                setCharsData(nd);
                localStorage.setItem("wwm_chars_v3", JSON.stringify(nd));
              }}
              id="scheme-select"
              style={{ flex: 1 }}
            >
              {activeChar?.schemes.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const s = activeChar?.schemes.find(sch => sch.id === charsData.activeSchemeId);
                if (!s) return;
                const nm = prompt("Rename scheme:", s.name);
                if (!nm) return;
                const uc = charsData.chars.map(c => c.id === charsData.activeCharId ? { ...c, schemes: c.schemes.map(sch => sch.id === s.id ? { ...sch, name: nm } : sch) } : c);
                const nd = { ...charsData, chars: uc };
                setCharsData(nd);
                localStorage.setItem("wwm_chars_v3", JSON.stringify(nd));
              }}
              className="secondary-btn"
              title="Rename scheme"
            >
              ✎
            </button>
            {activeChar && activeChar.schemes.length > 1 && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this scheme?")) {
                    const remaining = activeChar.schemes.filter(s => s.id !== charsData.activeSchemeId);
                    const uc = charsData.chars.map(c => c.id === charsData.activeCharId ? { ...c, schemes: remaining } : c);
                    const nd = { ...charsData, chars: uc, activeSchemeId: remaining[0]?.id ?? null };
                    setCharsData(nd);
                    localStorage.setItem("wwm_chars_v3", JSON.stringify(nd));
                  }
                }}
                className="danger-btn"
                title="Delete scheme"
              >
                🗑
              </button>
            )}
            <button
              onClick={() => {
                const name = prompt("New scheme name:");
                if (!name) return;
                const sid = "scheme-" + Date.now();
                const ns: Scheme = { id: sid, name, panel: panel, gear: DEFAULT_GEAR };
                const uc = charsData.chars.map(c => c.id === charsData.activeCharId ? { ...c, schemes: [...c.schemes, ns] } : c);
                const nd = { ...charsData, chars: uc, activeSchemeId: sid };
                setCharsData(nd);
                localStorage.setItem("wwm_chars_v3", JSON.stringify(nd));
              }}
              className="secondary-btn"
            >
              + New
            </button>
          </div>

          {/* Xinfa (Inner Ways) Slots */}
          <div className="xinfa-section" style={{ marginTop: '10px' }}>
            <div className="xinfa-grid">
              {[0, 1, 2, 3].map(index => {
                const iwId = selectedInnerWays[index];
                const iw = iwId ? INNER_WAYS.find(item => item.id === iwId) : null;
                const imageUrl = iw ? INNER_WAY_IMAGES[iw.name] : null;
                const tierNum = iwId ? (innerWayTiers[iwId] ?? 6) : 6;
                const tierStat = iw?.tiers.find(t => t.tier === tierNum)?.stat || {};
                const statSummary = formatIwStat(tierStat);
                return (
                  <div
                    key={index}
                    className="xinfa-slot"
                    onClick={() => {
                      setXinfaModalIndex(index);
                      setIsXinfaModalOpen(true);
                    }}
                  >
                    {iw ? (
                      <>
                        {imageUrl && <img src={imageUrl} alt={iw.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                        <span className="xinfa-tier-badge">T{tierNum}</span>
                        {statSummary && <span className="xinfa-stat-badge">{statSummary}</span>}
                        <div className="xinfa-name">{iw.name}</div>
                      </>
                    ) : (
                      <div className="slot-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: '0.8rem' }}>
                        + Select
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inner Ways — DPS loss if removed */}
          {innerWayContrib.length > 0 && (
            <div style={{ marginTop: 10, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#f0b400", textTransform: "uppercase", letterSpacing: 0.4 }}>Inner Way Contribution</span>
                <span style={{ fontSize: 10, color: "#6e7681" }} title="DPS lost if this inner way were removed at its current tier. Bigger loss = more important to keep leveled.">DPS loss if removed ⓘ</span>
              </div>
              {innerWayContrib.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 12, color: "#c9d1d9" }}>{c.name} <span style={{ color: "#6e7681", fontSize: 10 }}>T{c.tier}</span></span>
                  <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#ff7b72" }}>−{Math.round(c.lossDps).toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "#8b949e", width: 52, textAlign: "right" }}>−{c.lossPct.toFixed(2)}%</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Equipped Slots Grid */}
          <div className="sim-layout-container" style={{ marginTop: '15px' }}>
            <div className="sim-slots-grid">
              {(() => {
                const defaultTypes = BUILD_WEAPON_TYPES[selectedBuild] || ["Umbrella", "Rope Dart"];
                return [
                  { name: "Umbrella", key: "weapon1", label: "Weapon 1" },
                  { name: "Rope Dart", key: "weapon2", label: "Weapon 2" },
                  { name: "Disc", key: "disc", label: "Disc" },
                  { name: "Pendant", key: "pendant", label: "Pendant" },
                  { name: "Helmet", key: "head", label: "Helmet" },
                  { name: "Chest", key: "chest", label: "Chest" },
                  { name: "Bracers", key: "hands", label: "Hands" },
                  { name: "Greaves", key: "legs", label: "Legs" }
                ].map(slot => {
                  const item = getActiveGear().find(it => it.slot === slot.name && isItemEquipped(it, getActiveGear()));
                  const isWeapon = slot.name === "Umbrella" || slot.name === "Rope Dart";
                  const slotImgSrc = isWeapon 
                    ? getWeaponIconUrlByType(item?.weaponType, slot.name, selectedBuild) 
                    : SLOT_IMAGES[slot.name];
                  return (
                    <div
                      key={slot.key}
                      className="sim-slot"
                      data-slot-key={slot.key}
                      style={{ position: 'relative' }}
                      onClick={() => {
                        // Non-destructive (locked #11): open an inline quick-swap
                        // popover for this slot instead of instantly unequipping.
                        setSlotPopover(prev => prev === slot.name ? null : slot.name);
                        setGearFilterSlot(slot.name);
                      }}
                      title={item ? `Equipped: ${item.name}. Click to swap/unequip.` : `Empty. Click to pick gear.`}
                    >
                      {item ? (
                        <>
                          <img src={slotImgSrc} alt={item.name} className="slot-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <div className="slot-name-overlay">{item.name}</div>
                        </>
                      ) : (
                        <>
                          <img src={slotImgSrc} alt={slot.label} className="slot-image-placeholder" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, filter: 'grayscale(1)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <div className="slot-placeholder">{slot.label}</div>
                        </>
                      )}
                      {slotPopover === slot.name && (() => {
                        const slotGear = getActiveGear().filter(it => it.slot === slot.name);
                        return (
                          <div
                            className="slot-swap-popover"
                            onClick={(e) => e.stopPropagation()}
                            style={{ position: 'absolute', top: '102%', left: 0, zIndex: 50, minWidth: 180, maxWidth: 240, maxHeight: 260, overflowY: 'auto', background: '#15161a', border: '1px solid rgba(245,180,0,0.35)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', padding: 6 }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#f0b400', textTransform: 'uppercase', letterSpacing: 0.4 }}>{slot.label}</span>
                              <span onClick={() => setSlotPopover(null)} style={{ cursor: 'pointer', color: '#8b949e', fontSize: 14, lineHeight: 1 }}>×</span>
                            </div>
                            {item && (
                              <button
                                onClick={() => { unequipItem(slot.name); setSlotPopover(null); }}
                                style={{ width: '100%', textAlign: 'left', padding: '5px 8px', marginBottom: 4, background: 'rgba(252,165,165,0.08)', border: '1px solid rgba(252,165,165,0.25)', borderRadius: 5, color: '#fca5a5', fontSize: 11.5, cursor: 'pointer' }}
                              >✕ Unequip current</button>
                            )}
                            {slotGear.length === 0 ? (
                              <div style={{ padding: '6px 8px', fontSize: 11, color: '#6b7280' }}>No gear for this slot. Use + Add Gear.</div>
                            ) : slotGear.map(g => {
                              const equipped = isItemEquipped(g, getActiveGear());
                              return (
                                <button
                                  key={g.id}
                                  onClick={() => { toggleEquip(g); setSlotPopover(null); }}
                                  title={equipped ? "Currently equipped" : "Equip this"}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '5px 8px', marginBottom: 2, background: equipped ? 'rgba(126,231,135,0.12)' : 'transparent', border: equipped ? '1px solid rgba(126,231,135,0.4)' : '1px solid transparent', borderRadius: 5, color: equipped ? '#7ee787' : '#c9d1d9', fontSize: 11.5, cursor: 'pointer' }}
                                >
                                  {equipped && <span style={{ fontSize: 10 }}>✓</span>}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                });
              })()}
            </div>
            <div className="sim-side-panel">
              <div className="sim-slot bow-slot" title="Bow attribute (pick below)">
                <img src="/bow-icon.jpg" alt="Bow/Ring" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="sim-controls">
                <select
                  value={bowSelect}
                  onChange={(e) => setBowSelect(e.target.value as any)}
                  className="mini-select"
                  title="Select ring attribute"
                >
                  <option value="crit">Crit Ring (+3.7%)</option>
                  <option value="prec">Precision Ring (+3.3%)</option>
                  <option value="aff">Affinity Ring (+1.8%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Gear Contribution — DPS loss if each equipped piece were removed */}
          {gearContrib.length > 0 && (
            <div style={{ marginTop: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#f0b400", textTransform: "uppercase", letterSpacing: 0.4 }}>DPS Breakdown by Gear</span>
                <span style={{ fontSize: 10, color: "#6e7681" }} title="DPS lost if this piece were unequipped (its sub-stats and any set bonus it completes). Bigger loss = bigger contributor.">DPS loss if removed ⓘ</span>
              </div>
              {gearContrib.map(c => (
                <div key={c.slot + c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 12, color: "#c9d1d9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{c.name} <span style={{ color: "#6e7681", fontSize: 10 }}>{c.slot}</span></span>
                  <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#ff7b72" }}>−{Math.round(c.lossDps).toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "#8b949e", width: 52, textAlign: "right" }}>−{c.lossPct.toFixed(2)}%</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Ring (bow) attribute comparison */}
          {bowCompare.length > 0 && (
            <div style={{ marginTop: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#f0b400", textTransform: "uppercase", letterSpacing: 0.4 }}>Ring Attribute</span>
                <span style={{ fontSize: 10, color: "#6e7681" }} title="DPS for each ring choice vs your current pick. Switch in the Ring selector above.">DPS · vs current ⓘ</span>
              </div>
              {bowCompare.map(o => (
                <div key={o.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid rgba(255,255,255,0.05)", background: o.active ? "rgba(245,180,0,0.08)" : undefined }}>
                  <span style={{ fontSize: 12, color: o.active ? "#f0b400" : "#c9d1d9", fontWeight: o.active ? 700 : 400 }}>{o.label}{o.active ? " ✓" : ""}</span>
                  <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#c9d1d9" }}>{Math.round(o.dps).toLocaleString()}</span>
                    <span style={{ fontSize: 11, width: 56, textAlign: "right", color: o.delta > 0.5 ? "#7ee787" : o.delta < -0.5 ? "#ff7b72" : "#6e7681" }}>{o.active ? "—" : `${o.delta >= 0 ? "+" : ""}${Math.round(o.delta).toLocaleString()}`}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Armor set comparison (2pc verified; 4pc modeled only where ✓) */}
          {armorSetCompare.length > 0 && (
            <div style={{ marginTop: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#f0b400", textTransform: "uppercase", letterSpacing: 0.4 }}>Armor Set</span>
                <span style={{ fontSize: 10, color: "#6e7681" }} title="DPS for each 4-piece armor set vs your current set. 2pc stats are T91-verified; ✓ = 4pc effect modeled in the calc, others compare the 2pc stat only.">DPS · vs current ⓘ</span>
              </div>
              {armorSetCompare.map(o => (
                <div key={o.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid rgba(255,255,255,0.05)", background: o.active ? "rgba(245,180,0,0.08)" : undefined }}>
                  <span style={{ fontSize: 12, color: o.active ? "#f0b400" : "#c9d1d9", fontWeight: o.active ? 700 : 400 }}>
                    {o.name}{o.active ? " ✓" : ""}
                    {!o.modeled && <span style={{ color: "#6e7681", fontSize: 10 }} title="4pc effect not modeled in the calc yet — compares 2pc stat only"> (2pc)</span>}
                  </span>
                  <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#c9d1d9" }}>{Math.round(o.dps).toLocaleString()}</span>
                    <span style={{ fontSize: 11, width: 56, textAlign: "right", color: o.delta > 0.5 ? "#7ee787" : o.delta < -0.5 ? "#ff7b72" : "#6e7681" }}>{o.active ? "—" : `${o.delta >= 0 ? "+" : ""}${Math.round(o.delta).toLocaleString()}`}</span>
                  </span>
                </div>
              ))}
              <div style={{ padding: "5px 10px", fontSize: 10, color: "#6e7681", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                2pc stats are T91-verified. <b>(2pc)</b> rows compare the 2-piece stat only — their 4pc effect isn't modeled yet (needs the Excel source).
              </div>
            </div>
          )}

          <div className="panel-checkbox-container" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="panel-checkbox-wrapper">
              <label className="panel-checkbox-label">
                <input
                  type="checkbox"
                  checked={food}
                  onChange={(e) => setFood(e.target.checked)}
                  className="panel-checkbox-input"
                />
                <span>Food buff (+90 min / +180 max Phys Atk)</span>
              </label>
              <label className="panel-checkbox-label">
                <input
                  type="checkbox"
                  checked={script50}
                  onChange={(e) => setScript50(e.target.checked)}
                  className="panel-checkbox-input"
                />
                <span>Script &lt;50% HP (+15% Direct Crit)</span>
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 11.5, color: '#8b949e' }}>
              <span title="DPS Expectation is a THEORETICAL ceiling (perfect rotation + full buff uptime). A real parse loses ~10-20% to rotation downtime, buff ramp-up and execution. This factor estimates your realistic sustained DPS — tune it to match your in-game parse. Graduation % is unaffected.">
                Rotation efficiency ⓘ
              </span>
              <input
                type="range" min={50} max={100} step={1}
                value={Math.round(dpsEff * 100)}
                onChange={(e) => setDpsEff(parseInt(e.target.value, 10) / 100)}
                style={{ flex: 1 }}
              />
              <span style={{ color: '#f0b400', fontWeight: 700, width: 38, textAlign: 'right' }}>{Math.round(dpsEff * 100)}%</span>
            </div>
          </div>

          {/* Graduation rate banner */}
          <div
            className="graduation-banner"
            id="open-grad-modal-btn"
            onClick={() => {
              setGradModalActiveTab("manual");
              setIsGradModalOpen(true);
            }}
          >
            <div className="banner-content">
              <span className="banner-label">Graduation Rate</span>
              <span id="graduation-rate-display" className="banner-value">
                {rotationStats.gradRate.toFixed(2)}%
              </span>
            </div>
            <div className="banner-footer banner-footer-content">
              <span className="banner-footer-text">
                DPS Expectation: <span className="text-white font-bold">{Math.round(rotationStats.dps).toLocaleString()}</span>
                <span className="text-[#8b949e]"> · Total DMG: </span>
                <span className="text-white font-bold">{Math.round(rotationStats.totalDmg).toLocaleString()}</span>
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsDmgStatsOpen(true); }}
                title="Open the in-game-style Damage Statistics panel (damage split by hit type)"
                style={{ marginLeft: 10, padding: "2px 8px", fontSize: 11, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(245,180,0,0.4)", background: "rgba(245,180,0,0.12)", color: "#f0b400", cursor: "pointer" }}
              >
                📊 Damage Statistics
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsSimOpen(true); }}
                title="Monte Carlo simulation: roll each hit to see DPS variance and best/worst parses"
                style={{ marginLeft: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(126,231,135,0.4)", background: "rgba(126,231,135,0.12)", color: "#7ee787", cursor: "pointer" }}
              >
                🎲 Simulate
              </button>
            </div>
            <div className="banner-footer" style={{ marginTop: 2 }}>
              <span className="banner-footer-text" title="Realistic sustained DPS ≈ theoretical × rotation efficiency (slider above). For a calibrated build this defaults to 1.0 (= theoretical); lower the slider to model your own rotation downtime / execution and match your in-game parse.">
                Realistic DPS ≈ <span className="font-bold" style={{ color: '#7ee787' }}>{Math.round(rotationStats.dps * dpsEff).toLocaleString()}</span>
                <span className="text-[#8b949e]"> ({Math.round(dpsEff * 100)}% efficiency)</span>
              </span>
            </div>
            <div className="banner-arrow">›</div>
          </div>

          {/* Stats Display — two columns: in-game menu base vs in-combat (with Inner Ways + buffs) */}
          <div id="stats-display" className="stats-panel">
            {(() => {
              const fmt = (v: number | undefined, pct?: boolean, plus?: boolean) => {
                if (v === undefined) return "—";
                const n = pct ? `${v.toFixed(1)}%` : `${Math.round(v)}`;
                return plus ? `+${n}` : n;
              };
              const rows: { label: string; base?: number; combat?: number; pct?: boolean; plus?: boolean; derived?: boolean }[] = [
                { label: "Min Physical Atk", base: basePanel.minOuter, combat: adjustedPanel.minOuter },
                { label: "Max Physical Atk", base: basePanel.maxOuter, combat: adjustedPanel.maxOuter },
                { label: "Physical Pen", base: basePanel.outerPen, combat: adjustedPanel.outerPen, pct: true },
                { label: "↳ Net (after enemy res)", combat: netPhysPen, pct: true, derived: true },
                { label: "Crit Rate", base: basePanel.crit, combat: adjustedPanel.crit, pct: true },
                { label: "↳ Effective", combat: effCritRate, pct: true, derived: true },
                { label: "Direct Crit Rate", base: basePanel.dcrit, combat: adjustedPanel.dcrit, pct: true },
                { label: "Crit DMG", base: basePanel.critDmg, combat: adjustedPanel.critDmg, pct: true, plus: true },
                { label: "Affinity Rate", base: basePanel.aff, combat: adjustedPanel.aff, pct: true },
                { label: "↳ Effective", combat: effAffRate, pct: true, derived: true },
                { label: "Direct Affinity Rate", base: basePanel.daff, combat: adjustedPanel.daff, pct: true },
                { label: "Affinity DMG", base: basePanel.affDmg, combat: adjustedPanel.affDmg, pct: true, plus: true },
                { label: "Precision Rate", base: basePanel.prec, combat: adjustedPanel.prec, pct: true },
                { label: "↳ Effective", combat: effPrecision, pct: true, derived: true },
                { label: `Min ${innerAttrName(selectedBuild)} Atk`, base: basePanel.minPz, combat: adjustedPanel.minPz },
                { label: `Max ${innerAttrName(selectedBuild)} Atk`, base: basePanel.maxPz, combat: adjustedPanel.maxPz },
                { label: `Formless Pen`, base: basePanel.pzPen, combat: adjustedPanel.pzPen, pct: true },
                { label: "↳ Net (after enemy res)", combat: netPzPen, pct: true, derived: true },
                { label: `${innerAttrName(selectedBuild)} DMG Bonus`, base: basePanel.pzDmg, combat: adjustedPanel.pzDmg, pct: true },
                { label: "Physical DMG Bonus", base: basePanel.outerDmg, combat: adjustedPanel.outerDmg, pct: true },
                { label: "All Martial Art Skill DMG", base: basePanel.allArts, combat: adjustedPanel.allArts, pct: true },
                { label: `${(() => { const wp = getBuildWeaponPrefixes(selectedBuild); return wp[0] ? wp[0].charAt(0).toUpperCase() + wp[0].slice(1) : "Weapon"; })() } Martial Art Boost`, base: basePanel[`${getBuildWeaponPrefixes(selectedBuild)[0] || "umb"}Martial` as keyof PanelStats] as number, combat: adjustedPanel[`${getBuildWeaponPrefixes(selectedBuild)[0] || "umb"}Martial` as keyof PanelStats] as number, pct: true },
                { label: "Combat Boost vs Boss", base: basePanel.bossDmg, combat: adjustedPanel.bossDmg, pct: true },
                { label: "Combat Boost on Players", base: basePanel.playerDmg, combat: adjustedPanel.playerDmg, pct: true },
                { label: "Single-Target Mystic DMG", base: basePanel.singleTargetDmg, combat: adjustedPanel.singleTargetDmg, pct: true },
                { label: "Area Mystic Skill DMG", base: basePanel.groupDmg, combat: adjustedPanel.groupDmg, pct: true },
              ];
              return (
                <>
                  <div className="stat-row-display" style={{ borderBottom: "1px solid rgba(245,180,0,0.25)", paddingBottom: 4, marginBottom: 2 }}>
                    <span className="stat-label" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: "#8b949e" }}>Stat</span>
                    <span style={{ display: "flex", gap: 14 }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: "#8b949e", width: 56, textAlign: "right" }} title="Value shown in the in-game Combat Attributes menu (no Inner Ways)">Menu</span>
                      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: "#f0b400", width: 56, textAlign: "right" }} title="Effective in-combat value = base + Inner Ways + toggled buffs">Combat</span>
                    </span>
                  </div>
                  {rows.map((r, idx) => {
                    const boosted = !r.derived && r.base !== undefined && r.combat !== undefined && Math.abs(r.combat - r.base) > 0.05;
                    return (
                      <div key={idx} className="stat-row-display">
                        <span className="stat-label" style={r.derived ? { paddingLeft: 10, color: "#7b8794", fontSize: 11.5 } : undefined}>{r.label}</span>
                        <span style={{ display: "flex", gap: 14 }}>
                          <span className="stat-val" style={{ width: 56, textAlign: "right", color: r.derived ? "#5b6570" : undefined }}>
                            {r.derived ? "—" : fmt(r.base, r.pct, r.plus)}
                          </span>
                          <span className="stat-val" style={{ width: 56, textAlign: "right", color: boosted ? "#7ee787" : (r.derived ? "#a7b0bb" : undefined), fontWeight: boosted ? 700 : undefined }}>
                            {fmt(r.combat, r.pct, r.plus)}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                  <p style={{ fontSize: 10.5, color: "#6e7681", marginTop: 6, lineHeight: 1.4 }}>
                    <b style={{ color: "#8b949e" }}>Menu</b> = matches your in-game Combat Attributes screen · <b style={{ color: "#f0b400" }}>Combat</b> = effective in fight (Inner Ways at max stacks + active buffs). Green = boosted by Inner Ways/buffs.
                  </p>
                </>
              );
            })()}
          </div>
        </aside>
      </div>

      {/* ── IMPORT FROM GAME MODAL ── */}
      {isGameImportOpen && (() => {
        const bookmarklet = `javascript:(function(){var t=localStorage.getItem('h72na_data_token');if(!t){var c=document.cookie.match(/token=([^;]+)/);if(c)t=c[1]}if(!t){alert('Not logged in to the WWM dashboard.');return}var x=new XMLHttpRequest();x.open('GET','https://s2.easebar.com/78ae9d90792a3e9b/role/roleInfo',true);x.withCredentials=true;x.setRequestHeader('access_token',t);x.onload=function(){try{var j=JSON.parse(x.responseText);if(!j.data||!j.data.wearEquipsDetailed){alert('Could not load gear data.');return}navigator.clipboard.writeText(JSON.stringify(j.data)).then(function(){alert('Gear copied! Paste it into the calculator.')}).catch(function(){prompt('Copy this:',JSON.stringify(j.data))})}catch(e){alert('Error: '+e.message)}};x.send()})()`;
        const res = gameImportResult;
        return (
          <div className="modal" onClick={() => setIsGameImportOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
              <div className="modal-header">
                <h2>📥 Import Equipped Gear from Game <span style={{ fontSize: 11, color: "#f0b400", fontWeight: 600 }}>(Beta)</span></h2>
                <span className="close-btn" onClick={() => setIsGameImportOpen(false)}>&times;</span>
              </div>
              <div className="modal-body" style={{ padding: 20, overflowY: "auto" }}>
                <div style={{ fontSize: 12.5, color: "#c9d1d9", lineHeight: 1.6, marginBottom: 12 }}>
                  <b style={{ color: "#58a6ff" }}>How to use</b>
                  <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                    <li>Open the <a href="https://www.wherewindsmeetgame.com/m/2025h5sjgj/en/" target="_blank" rel="noreferrer" style={{ color: "#58a6ff" }}>official WWM dashboard</a> and log in (your character must show).</li>
                    <li>Make a bookmark whose URL is the code below (copy it, create a bookmark, paste as the URL).</li>
                    <li>Click that bookmark while on the dashboard → your gear is copied to the clipboard.</li>
                    <li>Paste it here and click <b>Parse</b>.</li>
                  </ol>
                  <p style={{ margin: "6px 0 0", color: "#6e7681", fontSize: 11 }}>Only <b>equipped</b> gear is available from the dashboard (the API has no bag/inventory). For other owned gear, use Batch OCR.</p>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input readOnly value={bookmarklet} onFocus={e => e.currentTarget.select()}
                    style={{ flex: 1, padding: "6px 8px", background: "#15161a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#8b949e", fontSize: 11, fontFamily: "monospace" }} />
                  <button type="button" onClick={() => { navigator.clipboard.writeText(bookmarklet); }}
                    style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(88,166,255,0.5)", background: "rgba(88,166,255,0.15)", color: "#58a6ff", cursor: "pointer", whiteSpace: "nowrap" }}>Copy bookmarklet</button>
                </div>

                <textarea value={gameImportRaw} onChange={e => setGameImportRaw(e.target.value)}
                  placeholder="Paste the copied gear JSON here..."
                  style={{ width: "100%", height: 90, padding: 8, background: "#15161a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#e0e0e0", fontSize: 12, fontFamily: "monospace", resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="button" onClick={parseGameImport}
                    style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(126,231,135,0.5)", background: "rgba(126,231,135,0.15)", color: "#7ee787", cursor: "pointer" }}>Parse</button>
                  {res && (
                    <button type="button" onClick={applyGameImport}
                      style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(245,180,0,0.6)", background: "rgba(245,180,0,0.18)", color: "#f0b400", cursor: "pointer" }}>
                      ✓ Import &amp; equip {res.pieces.length} pieces
                    </button>
                  )}
                </div>

                {gameImportError && <p style={{ color: "#ff7b72", fontSize: 12, marginTop: 10 }}>{gameImportError}</p>}

                {res && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: "#c9d1d9", marginBottom: 8 }}>
                      <b style={{ color: "#fff" }}>{res.roleName}</b> · Lv {res.level} · {res.pieces.length} pieces parsed.
                      <span style={{ color: "#f0b400" }}> Amber = auto-mapped, please verify.</span>
                    </div>
                    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
                      {res.pieces.map(p => (
                        <div key={p.officialSlot} style={{ padding: "6px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#f0b400" }}>{p.slot}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", marginTop: 2 }}>
                            {p.subs.map((s, i) => (
                              <span key={i} style={{ fontSize: 11.5, color: s.flagged ? "#f0b400" : "#c9d1d9" }}>
                                {s.type}: <b>{s.val}</b>{s.flagged ? " ?" : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {res.skipped.length > 0 && (
                      <details style={{ marginTop: 8 }}>
                        <summary style={{ cursor: "pointer", fontSize: 11, color: "#8b949e" }}>{res.skipped.length} not imported ▾</summary>
                        <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 11, color: "#6e7681" }}>
                          {res.skipped.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </details>
                    )}
                    <p style={{ marginTop: 10, fontSize: 11, color: "#6e7681" }}>
                      Values are exact from the game. Set bonus isn't imported (pick it per piece after). Importing equips these and unequips the current piece in each slot (old pieces stay in your pool).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── DAMAGE STATISTICS MODAL (in-game style) ── */}
      {isDmgStatsOpen && (() => {
        const pct = rotationStats.compositionPct;
        const c1 = pct.crit, c2 = c1 + pct.aff, c3 = c2 + pct.normal;
        const donutBg = `conic-gradient(#f0b400 0% ${c1}%, #ff8c42 ${c1}% ${c2}%, #8b949e ${c2}% ${c3}%, #ff5c5c ${c3}% 100%)`;
        const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
        const setName = (adjustedPanel.set && adjustedPanel.set !== "none") ? cap(adjustedPanel.set) : null;
        const buffChips = [
          datang && "大唐 Datang",
          yishui && "一水 Yishui",
          (adjustedPanel as any).weaponStars && "Stars Align",
          food && "Food Buff",
          script50 && "Script <50% HP",
          setName && `Set: ${setName}`,
        ].filter(Boolean) as string[];
        const legend = [
          { label: "Critical DMG", color: "#f0b400", v: pct.crit },
          { label: "Affinity Damage", color: "#ff8c42", v: pct.aff },
          { label: "Normal Damage", color: "#8b949e", v: pct.normal },
          { label: "Abrasion Damage", color: "#ff5c5c", v: pct.abrasion },
        ];
        return (
          <div className="modal" onClick={() => setIsDmgStatsOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <div className="modal-header">
                <h2>📊 Damage Statistics</h2>
                <span className="close-btn" onClick={() => setIsDmgStatsOpen(false)}>&times;</span>
              </div>
              <div className="modal-body" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 4 }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{Math.round(rotationStats.totalDmg).toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: "#8b949e", textTransform: "uppercase", letterSpacing: 0.5 }}>Total DMG</span>
                </div>
                <div style={{ fontSize: 16, color: "#7ee787", fontWeight: 700, marginBottom: 18 }}>
                  {Math.round(rotationStats.dps).toLocaleString()}<span style={{ fontSize: 12, color: "#8b949e", fontWeight: 400 }}> /s</span>
                </div>

                <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
                    <div style={{ width: 150, height: 150, borderRadius: "50%", background: donutBg }} />
                    <div style={{ position: "absolute", top: 27, left: 27, width: 96, height: 96, borderRadius: "50%", background: "var(--bg, #0d1117)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "#f0b400" }}>{pct.crit.toFixed(0)}%</span>
                      <span style={{ fontSize: 9, color: "#8b949e", textTransform: "uppercase" }}>Critical</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {legend.map(l => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ width: 11, height: 11, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#c9d1d9", flex: 1 }}>{l.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: l.color }}>{l.v.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Buff Effect</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {buffChips.length === 0
                      ? <span style={{ fontSize: 12, color: "#6e7681" }}>No buffs active</span>
                      : buffChips.map(b => (
                        <span key={b} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "rgba(126,231,135,0.12)", border: "1px solid rgba(126,231,135,0.3)", color: "#7ee787" }}>{b}</span>
                      ))}
                  </div>
                </div>

                <p style={{ marginTop: 16, fontSize: 11.5, color: "#6e7681", lineHeight: 1.5 }}>
                  Expected damage split over one rotation by hit outcome. <b style={{ color: "#8b949e" }}>Critical</b> = crit hits,
                  <b style={{ color: "#8b949e" }}> Affinity</b> = 会心 hits, <b style={{ color: "#8b949e" }}>Normal</b> = ordinary hits,
                  <b style={{ color: "#8b949e" }}> Abrasion</b> = graze (擦伤) hits. Chips show the buffs this calculation assumes active.
                </p>

                <details style={{ marginTop: 14 }}>
                  <summary style={{ cursor: "pointer", fontSize: 11, color: "#8b949e", textTransform: "uppercase", letterSpacing: 0.5 }}>Per-skill damage (per hit) ▾</summary>
                  <div style={{ marginTop: 8, maxHeight: 220, overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}>
                    <div style={{ display: "flex", padding: "4px 10px", position: "sticky", top: 0, background: "#15161a", fontSize: 9.5, color: "#8b949e", textTransform: "uppercase" }}>
                      <span style={{ flex: 1 }}>Skill</span>
                      <span style={{ width: 58, textAlign: "right", color: "#ff5c5c" }}>Abrasion</span>
                      <span style={{ width: 58, textAlign: "right", color: "#8b949e" }}>Normal</span>
                      <span style={{ width: 58, textAlign: "right", color: "#f0b400" }}>Crit</span>
                      <span style={{ width: 58, textAlign: "right", color: "#ff8c42" }}>Affinity</span>
                    </div>
                    {skillPreview.map((s, i) => (
                      <div key={s.name + i} style={{ display: "flex", padding: "4px 10px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11.5 }}>
                        <span style={{ flex: 1, color: "#c9d1d9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.name}>{translateSkillName(s.name)} <span style={{ color: "#6e7681" }}>×{s.count}</span></span>
                        <span style={{ width: 58, textAlign: "right", color: "#c9d1d9", fontFamily: "monospace" }}>{Math.round(s.abrasion).toLocaleString()}</span>
                        <span style={{ width: 58, textAlign: "right", color: "#c9d1d9", fontFamily: "monospace" }}>{Math.round(s.normal).toLocaleString()}</span>
                        <span style={{ width: 58, textAlign: "right", color: "#f0b400", fontFamily: "monospace" }}>{Math.round(s.crit).toLocaleString()}</span>
                        <span style={{ width: 58, textAlign: "right", color: "#ff8c42", fontFamily: "monospace" }}>{Math.round(s.aff).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── DAMAGE SIMULATION MODAL (Monte Carlo) ── */}
      {isSimOpen && (
        <div className="modal" onClick={() => setIsSimOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h2>🎲 Damage Simulation</h2>
              <span className="close-btn" onClick={() => setIsSimOpen(false)}>&times;</span>
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              <p style={{ fontSize: 12, color: "#8b949e", lineHeight: 1.5, marginBottom: 14 }}>
                Monte Carlo of your rotation: instead of the average, each cast rolls a random
                crit / affinity / normal / abrasion outcome. The simulated average should match the
                main calc — that verifies the math — and the spread shows real parse-to-parse variance.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <label style={{ fontSize: 12, color: "#c9d1d9" }}>Simulations:&nbsp;
                  <input type="number" min={1} max={2000} value={simRuns}
                    onChange={e => setSimRuns(Math.max(1, Math.min(2000, Number(e.target.value) || 1)))}
                    style={{ width: 70, padding: "3px 6px", background: "#15161a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 5, color: "#fff", fontSize: 12 }} />
                </label>
                <button type="button" onClick={runSimulation}
                  style={{ padding: "5px 14px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(126,231,135,0.5)", background: "rgba(126,231,135,0.15)", color: "#7ee787", cursor: "pointer" }}>
                  ▶ Run Simulation
                </button>
              </div>

              {!simResult ? (
                <div style={{ fontSize: 12, color: "#6e7681", padding: "10px 0" }}>Set a count and click Run.</div>
              ) : (() => {
                const sr = simResult;
                const matched = Math.abs(sr.diffPct) <= 1;
                const card = (label: string, val: string, color?: string) => (
                  <div style={{ flex: 1, minWidth: 120, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9.5, color: "#8b949e", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: color || "#fff" }}>{val}</div>
                  </div>
                );
                const r0 = (n: number) => Math.round(n).toLocaleString();
                const rows = [
                  { k: "Best", dps: sr.bestDps, c: "#7ee787" },
                  { k: "P75", dps: sr.p75 },
                  { k: "Median (P50)", dps: sr.p50, c: "#f0b400" },
                  { k: "P25", dps: sr.p25 },
                  { k: "Worst", dps: sr.worstDps, c: "#ff7b72" },
                ];
                const dist = [
                  { label: "Crit", color: "#f0b400", d: sr.dist.crit },
                  { label: "Affinity", color: "#ff8c42", d: sr.dist.aff },
                  { label: "Normal", color: "#8b949e", d: sr.dist.normal },
                  { label: "Abrasion", color: "#ff5c5c", d: sr.dist.abrasion },
                ];
                return (
                  <>
                    <div style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 12, fontWeight: 600,
                      background: matched ? "rgba(126,231,135,0.1)" : "rgba(245,180,0,0.1)",
                      border: `1px solid ${matched ? "rgba(126,231,135,0.3)" : "rgba(245,180,0,0.3)"}`,
                      color: matched ? "#7ee787" : "#f0b400" }}>
                      {matched ? "✓ " : "⚠ "}Simulated avg {r0(sr.avgDps)} vs expected {r0(sr.expectedDps)} DPS ({sr.diffPct >= 0 ? "+" : ""}{sr.diffPct.toFixed(2)}%)
                      {matched ? " — calculation verified." : " — outside 1%, try more runs."}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      {card("Average DPS", r0(sr.avgDps))}
                      {card("DPS Range", `±${sr.rangePct.toFixed(1)}%`)}
                      {card("Best Parse", r0(sr.bestDps), "#7ee787")}
                      {card("Worst Parse", r0(sr.worstDps), "#ff7b72")}
                    </div>

                    <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Percentiles</div>
                    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                      {rows.map(r => (
                        <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 12, color: r.c || "#c9d1d9", fontWeight: r.c ? 700 : 400 }}>{r.k}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: r.c || "#c9d1d9", fontFamily: "monospace" }}>{r0(r.dps)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Hit Distribution (avg)</div>
                    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ display: "flex", padding: "4px 10px", background: "rgba(255,255,255,0.03)", fontSize: 9.5, color: "#8b949e", textTransform: "uppercase" }}>
                        <span style={{ flex: 1 }}>Type</span><span style={{ width: 70, textAlign: "right" }}>Hit %</span><span style={{ width: 80, textAlign: "right" }}>Damage %</span>
                      </div>
                      {dist.map(d => (
                        <div key={d.label} style={{ display: "flex", alignItems: "center", padding: "5px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#c9d1d9" }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />{d.label}
                          </span>
                          <span style={{ width: 70, textAlign: "right", fontSize: 12, color: "#8b949e", fontFamily: "monospace" }}>{d.d.hit.toFixed(1)}%</span>
                          <span style={{ width: 80, textAlign: "right", fontSize: 12, fontWeight: 700, color: d.color, fontFamily: "monospace" }}>{d.d.dmg.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ marginTop: 12, fontSize: 11, color: "#6e7681" }}>{sr.runs} runs · ~{sr.hitsPerRun} hits/run · {sr.duration.toFixed(1)}s rotation. Hit % = share of hits; Damage % = share of total damage.</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── GRADUATION ANALYSIS MODAL ── */}
      {isGradModalOpen && (
        <div className="modal" onClick={() => setIsGradModalOpen(false)}>
          <div className="modal-content modal-content-xlarge" onClick={e => e.stopPropagation()} style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>Graduation Analysis</h2>
              <span className="close-btn" onClick={() => setIsGradModalOpen(false)}>&times;</span>
            </div>
            <div className="modal-body grad-layout-container grad-layout-container-inline" style={{ display: 'flex', flex: 1, minHeight: 0, padding: 0 }}>
              {/* Left Panel */}
              <div className="grad-left-panel" style={{ width: '280px', flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div className="current-rate-box">
                  <div className="label">Graduation Rate</div>
                  <div className="value">{rotationStats.gradRate.toFixed(2)}%</div>
                </div>
                <div className="grad-meta-info-inline">
                  <div className="grad-meta-text">
                    <div className="grad-meta-item">Edition: <span className="text-white">Global (T91 / Lv95)</span></div>
                    <div className="grad-meta-item">Author: <span className="text-white">Wonton</span></div>
                  </div>
                </div>
                <div className="current-equip-list" style={{ padding: '10px' }}>
                  {SLOTS.map(slot => {
                    const item = getActiveGear().find(it => it.slot === slot.name && isItemEquipped(it, getActiveGear()));
                    const isActive = selectedSlot === slot.name;
                    return (
                      <div key={slot.name} className={`grad-equip-item${isActive ? " active" : ""}`} onClick={() => { setSelectedSlot(slot.name); setTransmuteSlot(slot.name); setTransmuteSubIndex(null); }}>
                        <div className="grad-equip-info">
                          <div className="grad-equip-name">{item ? item.name : "— Empty Slot —"}</div>
                          <div className="grad-equip-sub">{getSlotLabel(slot.name)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Right Panel */}
              <div className="grad-right-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <div className="grad-tabs">
                  {[
                    { key: "manual", label: "Manual Sheet" },
                    { key: "priority", label: "Stat Priority" },
                    { key: "cultivate", label: "Cultivate (beta)" },
                    { key: "compare", label: "Compare" },
                    { key: "transmute", label: "Transmute Advice" },
                    { key: "best-build", label: "Best Build" },
                    { key: "rotations", label: "Rotations" },
                    { key: "skill-editor", label: "Skill Editor" },
                    { key: "team", label: "Team" },
                  ].map(tab => (
                    <div
                      key={tab.key}
                      className={`grad-tab ${gradModalActiveTab === tab.key ? "active" : ""}`}
                      onClick={() => setGradModalActiveTab(tab.key)}
                    >
                      {tab.label}
                    </div>
                  ))}
                </div>
                <div className="grad-tab-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                  {/* Tab Panes */}
                  {gradModalActiveTab === "rotations" && (() => {
                    const buildLabel = (BUILD_PROFILES as any)[selectedBuild]?.label || selectedBuild;
                    const rotWindow = getRotationTimeForBuild(selectedBuild);
                    const bd = rotationSim.breakdown;
                    const bdTot = (bd.crit + bd.aff + bd.normal + bd.abrasion) || 1;
                    const dDps = rotationSim.dps - rotationStats.dps;
                    return (
                    <div className="space-y-4" style={{ textAlign: 'left' }}>
                      <div className="bg-[#1e1a12] border border-[#f0b400]/30 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-[#f0b400] mb-2 flex items-center gap-2">🗡️ Rotations editor <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0b400]/15 text-[#f0b400]/80">beta</span></h3>
                        <p className="text-[12px] text-slate-300 leading-relaxed">
                          Edit the cast <b>count</b> of each skill in <b className="text-[#f0b400]">{buildLabel}</b>'s rotation; DPS recomputes live through the verified per-hit formula (only the rotation composition changes — the damage math is untouched). Window is fixed at the build's calibrated <b>{rotWindow.toFixed(1)}s</b>.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 bg-[#141619] border border-[#23262c] rounded-xl p-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Rotation DPS</div>
                          <div className="text-[22px] font-bold text-white leading-tight">{Math.round(rotationSim.dps).toLocaleString()}<span className="text-[12px] text-[#8b949e] font-normal"> /s</span></div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Total damage</div>
                          <div className="text-[18px] font-semibold text-slate-200 leading-tight">{Math.round(rotationSim.totalDmg).toLocaleString()}</div>
                        </div>
                        {editedRotation && (
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">vs default</div>
                            <div className="text-[16px] font-semibold leading-tight" style={{ color: dDps >= 0 ? '#7ee787' : '#ff7b72' }}>{dDps >= 0 ? '+' : ''}{Math.round(dDps).toLocaleString()}/s</div>
                          </div>
                        )}
                        <button
                          onClick={() => setEditedRotation(null)}
                          disabled={!editedRotation}
                          className="ml-auto text-[12px] px-3 py-1.5 rounded border border-[#23262c] text-slate-300 disabled:opacity-40 hover:border-[#f0b400]/50"
                        >Reset to build default</button>
                      </div>

                      <div className="bg-[#141619] border border-[#23262c] rounded-xl overflow-hidden">
                        <table className="w-full text-[12.5px]">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-[#a19683] font-mono border-b border-[#23262c]">
                              <th className="text-left px-3 py-2">Skill</th>
                              <th className="text-center px-2 py-2">Count</th>
                              <th className="text-right px-3 py-2">DPS</th>
                              <th className="text-right px-3 py-2">Share</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {effectiveRotation.map((item, i) => {
                              const ps = rotationSim.perSkill.find(s => s.name === item.name);
                              return (
                                <tr key={item.name + i} className="border-b border-[#23262c]/40">
                                  <td className="text-left px-3 py-1.5 text-slate-200" title={item.name}>{translateSkillName(item.name)}</td>
                                  <td className="text-center px-2 py-1.5">
                                    <input type="number" min={0} value={item.count}
                                      onChange={e => { const n = Number(e.target.value); if (!isNaN(n)) setSkillCount(i, n); }}
                                      className="w-14 bg-[#111316] border border-[#23262c] rounded px-1.5 py-0.5 text-center text-slate-100 text-[12.5px]" />
                                  </td>
                                  <td className="text-right px-3 py-1.5 text-slate-300">{ps ? Math.round(ps.dps).toLocaleString() : '—'}</td>
                                  <td className="text-right px-3 py-1.5 text-[#f0b400]/90">{ps ? (ps.share * 100).toFixed(1) + '%' : '—'}</td>
                                  <td className="text-center px-1 py-1.5">
                                    <button onClick={() => removeSkill(i)} title="Remove skill" className="text-[#ff7b72]/70 hover:text-[#ff7b72] text-[13px]">✕</button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-[#141619] border border-[#23262c] rounded-xl p-3 text-[12px] text-slate-300">
                        <span className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono mr-2">Hit-type mix</span>
                        crit <b className="text-white">{(bd.crit / bdTot * 100).toFixed(1)}%</b> · affinity <b className="text-white">{(bd.aff / bdTot * 100).toFixed(1)}%</b> · normal <b className="text-white">{(bd.normal / bdTot * 100).toFixed(1)}%</b> · abrasion <b className="text-white">{(bd.abrasion / bdTot * 100).toFixed(1)}%</b>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 bg-[#141619] border border-[#23262c] rounded-xl p-3">
                        <span className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Add skill</span>
                        <select value={addSkillName} onChange={e => setAddSkillName(e.target.value)}
                          className="flex-1 min-w-[160px] bg-[#111316] border border-[#23262c] rounded px-2 py-1 text-slate-100 text-[12px]">
                          <option value="">— pick a skill from this build —</option>
                          {buildSkillNames.map(n => <option key={n} value={n}>{translateSkillName(n)}</option>)}
                        </select>
                        <button onClick={() => addSkillToRotation(addSkillName)} disabled={!addSkillName}
                          className="text-[12px] px-3 py-1.5 rounded border border-[#23262c] text-[#7ee787] disabled:opacity-40 hover:border-[#7ee787]/50">+ Add to rotation</button>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Edit counts, remove (✕), or add another cast of a build skill (clones its default buff context). Tweaking a skill's coefficients lives in the <b>Skill Editor</b> tab (preview only). DPS = total ÷ the build's fixed rotation window.
                      </p>
                    </div>
                    );
                  })()}
                  {gradModalActiveTab === "skill-editor" && (() => {
                    const p = skillEditorPreview;
                    const fields: { key: keyof SkillDefinition; label: string; step: number }[] = [
                      { key: "outerRatio", label: "Phys ratio (外攻倍率)", step: 0.01 },
                      { key: "eleRatio", label: "Element ratio (元素倍率)", step: 0.01 },
                      { key: "fixed", label: "Fixed damage", step: 1 },
                      { key: "exCritDmg", label: "Extra Crit DMG", step: 0.01 },
                      { key: "exDmg", label: "Extra DMG%", step: 0.01 },
                      { key: "exPen", label: "Extra Pen", step: 0.1 },
                    ];
                    const cells = p ? [
                      { label: "Abrasion", v: p.sim.grazeHit, b: p.base.grazeHit, color: "#8b949e" },
                      { label: "Normal", v: p.sim.normHit, b: p.base.normHit, color: "#e8e8e8" },
                      { label: "Crit", v: p.sim.critHit, b: p.base.critHit, color: "#f0b400" },
                      { label: "Affinity", v: p.sim.affHit, b: p.base.affHit, color: "#7ee787" },
                    ] : [];
                    return (
                    <div className="space-y-4" style={{ textAlign: 'left' }}>
                      <div className="bg-[#1e1a12] border border-[#f0b400]/30 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-[#f0b400] mb-2 flex items-center gap-2">🎚️ Skill Editor <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0b400]/15 text-[#f0b400]/80">beta</span></h3>
                        <p className="text-[12px] text-slate-300 leading-relaxed">
                          Pick a skill, edit its coefficients, and watch the per-hit damage recompute live through the verified formula. <b>Preview only</b> — edits don't change the rotation DPS or the real skill (the damage math is untouched). Values use your current panel, tier and in-combat buffs.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 bg-[#141619] border border-[#23262c] rounded-xl p-4">
                        <span className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Skill</span>
                        <select value={editorSkillName} onChange={e => setEditorSkillName(e.target.value)}
                          className="flex-1 min-w-[200px] bg-[#111316] border border-[#23262c] rounded px-2 py-1 text-slate-100 text-[12.5px]">
                          {buildSkillNames.length === 0 && <option value="">(no skills in this build)</option>}
                          {buildSkillNames.map(n => <option key={n} value={n}>{translateSkillName(n)}</option>)}
                        </select>
                        <button onClick={() => setEditorOverrides(null)} disabled={!editorOverrides}
                          className="text-[12px] px-3 py-1.5 rounded border border-[#23262c] text-slate-300 disabled:opacity-40 hover:border-[#f0b400]/50">Reset coefficients</button>
                      </div>

                      {p ? (
                        <>
                          <div className="grid grid-cols-4 gap-3">
                            {cells.map(c => {
                              const d = c.v - c.b;
                              return (
                                <div key={c.label} className="bg-[#141619] border border-[#23262c] rounded-xl p-3 text-center">
                                  <div className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">{c.label}</div>
                                  <div className="text-[18px] font-bold leading-tight" style={{ color: c.color }}>{Math.round(c.v).toLocaleString()}</div>
                                  {editorOverrides && Math.abs(d) >= 0.5 && (
                                    <div className="text-[11px] font-semibold" style={{ color: d >= 0 ? '#7ee787' : '#ff7b72' }}>{d >= 0 ? '+' : ''}{Math.round(d).toLocaleString()}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="bg-[#141619] border border-[#23262c] rounded-xl p-4 grid grid-cols-2 gap-3">
                            {fields.map(f => {
                              const val = (editorOverrides?.[f.key] ?? p.orig[f.key]) as number;
                              const changed = !!editorOverrides && editorOverrides[f.key] !== undefined && editorOverrides[f.key] !== p.orig[f.key];
                              return (
                                <label key={f.key} className="flex flex-col gap-1 text-[11.5px] text-slate-300">
                                  <span className="flex items-center gap-1">{f.label}{changed && <span className="text-[#f0b400]" title="edited">●</span>}</span>
                                  <input type="number" step={f.step} value={val}
                                    onChange={e => { const n = Number(e.target.value); if (!isNaN(n)) setSkillField(f.key, n); }}
                                    className="bg-[#111316] border border-[#23262c] rounded px-2 py-1 text-slate-100 text-[12.5px]" />
                                  <span className="text-[10px] text-slate-500">orig {String(p.orig[f.key])}</span>
                                </label>
                              );
                            })}
                          </div>

                          <p className="text-[11px] text-slate-500 leading-snug">
                            Classification fields (type / weapon-type / charge / set bonus) decide how the skill is bucketed and aren't safe to edit in v1. To make an edit affect rotation DPS you'd wire an override — a later phase.
                          </p>
                        </>
                      ) : (
                        <div className="text-[12px] text-slate-400">Select a skill to edit.</div>
                      )}
                    </div>
                    );
                  })()}
                  {gradModalActiveTab === "team" && (
                    <div className="space-y-4" style={{ textAlign: 'left' }}>
                      <div className="bg-[#1e1a12] border border-[#f0b400]/30 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-[#f0b400] mb-2 flex items-center gap-2">👥 Team Builder <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0b400]/15 text-[#f0b400]/80">beta</span></h3>
                        <p className="text-[12px] text-slate-300 leading-relaxed">
                          Pick up to 5 members from your <b>saved profiles</b>. Team DPS = sum of each member's solo DPS (their saved panel run through this build's rotation) × team buffs. Kill time = boss HP / team DPS.
                        </p>
                      </div>

                      <div className="bg-[#141619] border border-[#23262c] rounded-xl p-4 space-y-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Members</span>
                        {teamMemberIds.map((id, i) => {
                          const m = teamSim.active.find(a => a.id === id);
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="w-5 text-center text-[12px] text-[#a19683] font-mono">{i + 1}</span>
                              <select value={id} onChange={e => setTeamMemberIds(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                                className="flex-1 bg-[#111316] border border-[#23262c] rounded px-2 py-1 text-slate-100 text-[12.5px]">
                                <option value="">— empty —</option>
                                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <span className="w-28 text-right text-[12.5px] font-bold text-slate-200">{m ? Math.round(m.dps).toLocaleString() + " /s" : "—"}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-[#141619] border border-[#23262c] rounded-xl p-4 space-y-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Team buffs <span className="text-slate-500 normal-case">(idealized full-uptime — don't double-count with per-member settings)</span></span>
                        <label className="flex items-center gap-2 text-[12.5px] text-slate-300"><input type="checkbox" checked={teamVuln} onChange={e => setTeamVuln(e.target.checked)} /> Vulnerability +8% (teammate debuff on boss)</label>
                        <label className="flex items-center gap-2 text-[12.5px] text-slate-300"><input type="checkbox" checked={teamRevelry} onChange={e => setTeamRevelry(e.target.checked)} /> Revelry Script +30% (HP &lt; 30%)</label>
                      </div>

                      <div className="bg-[#141619] border border-[#23262c] rounded-xl p-4 flex flex-wrap items-center gap-3">
                        <span className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Boss HP</span>
                        <input type="number" value={bossHp} onChange={e => setBossHp(Math.max(0, Number(e.target.value) || 0))}
                          className="w-36 bg-[#111316] border border-[#23262c] rounded px-2 py-1 text-slate-100 text-[12.5px]" />
                        {([["Puppeteer", 3500000], ["1M", 1000000], ["5M", 5000000]] as [string, number][]).map(([lbl, hp]) => (
                          <button key={lbl} onClick={() => setBossHp(hp)} className="text-[11px] px-2 py-1 rounded border border-[#23262c] text-slate-300 hover:border-[#f0b400]/50">{lbl}</button>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#141619] border border-[#23262c] rounded-xl p-3 text-center">
                          <div className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Team DPS</div>
                          <div className="text-[20px] font-bold text-[#f0b400] leading-tight">{Math.round(teamSim.teamDps).toLocaleString()}<span className="text-[11px] text-slate-400 font-normal"> /s</span></div>
                          {teamSim.buffMult > 1 && <div className="text-[11px] text-[#7ee787]">+{Math.round((teamSim.buffMult - 1) * 100)}% buffs</div>}
                        </div>
                        <div className="bg-[#141619] border border-[#23262c] rounded-xl p-3 text-center">
                          <div className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Members</div>
                          <div className="text-[20px] font-bold text-slate-100 leading-tight">{teamSim.active.length}<span className="text-[11px] text-slate-400 font-normal"> / 5</span></div>
                          <div className="text-[11px] text-slate-400">solo Σ {Math.round(teamSim.soloSum).toLocaleString()}</div>
                        </div>
                        <div className="bg-[#141619] border border-[#23262c] rounded-xl p-3 text-center">
                          <div className="text-[10px] uppercase tracking-widest text-[#a19683] font-mono">Kill time</div>
                          <div className="text-[20px] font-bold text-slate-100 leading-tight">{teamSim.killTime > 0 ? teamSim.killTime.toFixed(1) + "s" : "—"}</div>
                          <div className="text-[11px] text-slate-400">boss {(bossHp / 1e6).toFixed(2)}M</div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-snug">
                        Each member's DPS uses their saved panel run through <b>this build's</b> rotation. Buffs are flat idealized multipliers (no Qi-break window / buff-ramp timeline — that needs a real per-second engine, hence no DPS-over-time chart).
                      </p>
                    </div>
                  )}
                  {gradModalActiveTab === "manual" && (
                    <div className="space-y-6" style={{ textAlign: 'left' }}>
                      {/* How to use */}
                      <div className="bg-[#1e1a12] border border-[#f0b400]/30 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-[#f0b400] mb-2 flex items-center gap-2">📖 How to use</h3>
                        <ol className="text-[12.5px] text-slate-300 leading-relaxed list-decimal pl-5 space-y-1">
                          <li><b>Enter panel</b>: Open <b>Combat Attributes</b> in-game (the <b>C</b> key) and type the stats below. Or the panel auto-computes from the gear you entered on the main screen.</li>
                          <li><b>Read results</b>: The top bar shows <b>Graduation Rate</b> (% vs the BiS T91 build) and <b>DPS Expectation</b>.</li>
                          <li><b>Pick build & bow/set</b>: In the <b>Panel Simulator</b> (right of the main screen) choose the right path, bow attribute, and gear set.</li>
                        </ol>
                        <div className="text-[12px] text-slate-400 mt-3 pt-2 border-t border-[#23262c]/60 leading-relaxed">
                          <b className="text-[#f0b400]/90">What the other tabs do:</b>
                          <ul className="list-disc pl-5 mt-1 space-y-0.5">
                            <li><b>Stat Priority</b> — which stats to add/drop to graduate fastest.</li>
                            <li><b>Cultivate</b> — substat (条) summary, which tuned (✦) lines to upgrade, and the next 8 substats worth investing in.</li>
                            <li><b>Compare</b> — compare each gear piece to see which raises graduation the most.</li>
                            <li><b>Transmute Advice</b> — per-slot transmute (转律) suggestions: the optimal main + sub substat config to raise graduation.</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-[#141619] border border-[#23262c] rounded-xl p-4 space-y-2">
                        <p className="text-[11.5px] text-slate-400 leading-snug">
                          Panel stats are <b className="text-[#f0b400]">auto-computed from equipped gear</b>. Equip/unequip items to see stats change. Inner Ways are added on top automatically.
                        </p>
                      </div>

                      <div className="bg-[#141619] border border-[#23262c] rounded-xl p-4 space-y-3">
                        <span className="text-[12px] font-mono font-bold tracking-widest text-[#a19683] uppercase">Dungeon Target</span>
                        <select
                          value={tierKey}
                          onChange={(e) => setTierKey(e.target.value)}
                          className="bg-[#141619] font-mono text-sm text-[#f0b400] rounded px-2.5 py-1"
                        >
                          <option value="350|0.45">Tier 91 / Lv95 (Global)</option>
                          <option value="307|0.3">Tier 86 / Lv90</option>
                          <option value="405|0.65">Tier 96 / Lv100 (Lower)</option>
                          <option value="405|0.65b">Tier 96 / Lv100 (Upper)</option>
                          <option value="559|1.15">CN Level 105 (Ref)</option>
                          <option value="custom">Custom Params</option>
                        </select>
                      </div>

                      {(() => {
                        const inner = innerAttrName(selectedBuild);
                        const wPrefix = getBuildWeaponPrefixes(selectedBuild)[0] || "umb";
                        const wMartialKey = `${wPrefix}Martial`;
                        const GROUPS: { title: string; note?: string; fields: { label: string; key: string; step?: number }[] }[] = [
                          {
                            title: "Physical Attributes",
                            fields: [
                              { label: "Min Physical Atk", key: "minOuter" },
                              { label: "Max Physical Atk", key: "maxOuter" },
                              { label: "Physical Pen %", key: "outerPen", step: 0.1 },
                              { label: "Physical DMG Bonus %", key: "outerDmg", step: 0.1 },
                            ],
                          },
                          {
                            title: `${inner} (Attribute) Attributes`,
                            fields: [
                              { label: `Min ${inner} Atk`, key: "minPz" },
                              { label: `Max ${inner} Atk`, key: "maxPz" },
                              { label: `${inner} Pen %`, key: "pzPen", step: 0.1 },
                              { label: `${inner} DMG Bonus %`, key: "pzDmg", step: 0.1 },
                            ],
                          },
                          {
                            title: "Crit / Affinity / Precision",
                            fields: [
                              { label: "Critical Rate %", key: "crit", step: 0.1 },
                              { label: "Affinity Rate %", key: "aff", step: 0.1 },
                              { label: "Precision Rate %", key: "prec", step: 0.1 },
                              { label: "Direct Critical Rate %", key: "dcrit", step: 0.1 },
                              { label: "Direct Affinity Rate %", key: "daff", step: 0.1 },
                              { label: "Critical DMG Bonus %", key: "critDmg", step: 0.1 },
                              { label: "Affinity DMG Bonus %", key: "affDmg", step: 0.1 },
                            ],
                          },
                          {
                            title: "Skill DMG Boosts",
                            note: "Some lines only appear on certain gear/tuning — leave at 0 if your panel doesn't show them.",
                            fields: [
                              { label: "All Martial Art Skill DMG Boost %", key: "allArts", step: 0.1 },
                              { label: "Specified Weapon Martial Art Boost %", key: wMartialKey, step: 0.1 },
                              { label: "Combat Boost Against Boss Units %", key: "bossDmg", step: 0.1 },
                              { label: "Single-Target Mystic Skill DMG Boost %", key: "singleTargetDmg", step: 0.1 },
                              { label: "Area Mystic Skill DMG Boost %", key: "groupDmg", step: 0.1 },
                            ],
                          },
                        ];
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {GROUPS.map((grp) => (
                              <div key={grp.title}>
                                <h3 className="text-sm font-semibold text-[#f0b400] uppercase tracking-widest mb-1 border-b border-[#23262c] pb-1">{grp.title}</h3>
                                {grp.note && <p className="text-[10.5px] text-slate-500 mb-2 leading-snug">{grp.note}</p>}
                                <div className="space-y-2 mt-2">
                                  {grp.fields.map((st) => (
                                    <div key={st.key} className="flex justify-between items-center bg-[#1a1a1d]/70 p-2 rounded border border-[#23262c] text-sm">
                                      <span className="text-slate-500">{st.label}</span>
                                      <input
                                        type="number"
                                        step={st.step || 1}
                                        value={panel[st.key as keyof PanelStats] as number}
                                        disabled={autoGearPanel}
                                        onChange={(e) => handleStatChange(st.key as keyof PanelStats, parseFloat(e.target.value) || 0)}
                                        className="bg-transparent border-none text-right text-slate-100 focus:outline-none w-24 font-mono disabled:opacity-50"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {gradModalActiveTab === "priority" && (
                    <div style={{ textAlign: 'left' }}>
                      {gradModalActiveTab === "priority" && (
          <div className="space-y-6">
            <div className="bg-[#141619] border border-[#23262c] rounded-xl p-6 shadow-lg">
              <div className="border-b border-[#f0b400]/25 pb-4 mb-5">
                <h2 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                  <TrendingUp className="text-[#f0b400] w-5 h-5" /> Stat Priority — Graduation Impact
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Live ranking for <strong className="text-[#f0b400]">{(BUILD_PROFILES as any)[selectedBuild]?.label || "your build"}</strong>, computed from your current panel ({rotationStats.gradRate.toFixed(1)}% graduation). Each row simulates adding/removing <strong>one typical substat roll</strong> on a single sub-stat and shows the resulting change in graduation %.
                </p>
              </div>

              {/* Two-column gain/loss ranking */}
              <div className="bg-[#1a1a1d]/60 rounded-xl p-3 border border-[#23262c] text-sm text-[#f0b400]/95 flex items-center gap-2 mb-4">
                <span className="text-lg">💡</span>
                <span>
                  Calculated against the <strong>Global Tier 91 (Lv95)</strong> boss constants (Defense 350, Judgment Resist ×1.45), using your live panel and active build's rotation.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Gains column */}
                <div>
                  <h3 className="text-[13px] uppercase tracking-wider font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Adding +1 substat roll
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-1">
                    <span className="w-4" /><span className="w-32">Stat</span><span className="w-12 text-right">Roll</span>
                    <div className="flex-1" />
                    <span className="w-16 text-right text-sky-300">DPS gain</span>
                    <span className="w-16 text-right text-emerald-400">% gain</span>
                  </div>
                  <div className="space-y-1.5">
                    {statPriorityList.gains.map((g, idx) => {
                      const maxGain = statPriorityList.gains[0].gain || 1;
                      const width = maxGain > 0 ? Math.max(0, (g.gain / maxGain) * 100) : 0;
                      return (
                        <div key={g.key} className="flex items-center gap-2 text-sm">
                          <span className="w-4 text-slate-300 font-mono text-right text-[12px]">{idx + 1}</span>
                          <span className="w-32 text-slate-300 font-medium truncate">{g.label}</span>
                          <span className="w-12 text-slate-500 font-mono text-right text-[12px]">+{g.roll}{g.unit}</span>
                          <div className="flex-1 h-2 bg-[#1a1a1d] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="w-16 font-mono text-right text-sky-300 text-[12px]" title="DPS added by one more max roll of this stat">
                            +{Math.round(g.gainDps).toLocaleString()}
                          </span>
                          <span className="w-16 font-mono text-right font-bold text-emerald-400">
                            +{g.gain.toFixed(3)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Losses column */}
                <div>
                  <h3 className="text-[13px] uppercase tracking-wider font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" /> Removing 1 substat roll
                  </h3>
                  <div className="space-y-1.5">
                    {statPriorityList.losses.map((g, idx) => {
                      const maxLoss = Math.abs(statPriorityList.losses[0].loss) || 1;
                      const width = maxLoss > 0 ? Math.max(0, (Math.abs(g.loss) / maxLoss) * 100) : 0;
                      return (
                        <div key={g.key} className="flex items-center gap-2 text-sm">
                          <span className="w-4 text-slate-300 font-mono text-right text-[12px]">{idx + 1}</span>
                          <span className="w-32 text-slate-300 font-medium truncate">{g.label}</span>
                          <span className="w-12 text-slate-500 font-mono text-right text-[12px]">-{g.roll}{g.unit}</span>
                          <div className="flex-1 h-2 bg-[#1a1a1d] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-rose-700 to-rose-400"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="w-16 font-mono text-right font-bold text-rose-400">
                            {g.loss.toFixed(3)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <p className="text-[12px] text-slate-500 mt-4 italic">
                Note: if a stat is already past its cap (e.g. Precision/Crit/Affinity at 100%/80%/40% effective), adding more shows ~0% gain — that's expected, not a bug. A near-zero loss means you have "slack" on that stat to relay elsewhere.
              </p>
            </div>

            {/* General T91 Priority Rules Guide */}
            <div className="bg-[#141619] border border-[#23262c] rounded-xl p-6 shadow-lg">
              <h3 className="text-sm uppercase tracking-widest font-extrabold text-[#f0b400] font-serif border-b border-[#23262c] pb-2 mb-4">
                General Theorycrafting Guide · T91 Global (http://spongem.com/yysls/)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-300 leading-relaxed">
                <div className="space-y-3">
                  <p>
                    <strong className="text-[#f0b400]">1. Physical Penetration (Phys Pen)</strong>: The most crucial core attribute until reaching the optimal cap in dungeon content (e.g., 51.2% for T91). Every point of Phys Pen below this threshold provides massive exponential damage amplification.
                  </p>
                  <p>
                    <strong className="text-[#f0b400]">2. Critical Rate Cap (80%)</strong>: The absolute maximum Critical Rate in Where Winds Meet is capped at <strong className="text-orange-400">80%</strong>. If your combined character attributes and passive/active buffs push your Crit beyond 80%, the surplus is ignored. Aim for roughly 73% unbuffed so that party buffs safely top you off at the optimal 80% maximum.
                  </p>
                  <p>
                    <strong className="text-[#f0b400]">3. Critical Damage (Crit DMG %)</strong>: Crit DMG works in direct synergy with Crit Rate. Once your critical chance is secure, augmenting critical multipliers scales your total active DPS and Everspring Umbrella execution chain jumps exponentially.
                  </p>
                </div>
                <div className="space-y-3">
                  <p>
                    <strong className="text-[#f0b400]">4. Affinity Rate (Cap 40%) & Bamboocut</strong>: Bamboocut Dust damage scales heavily with your overall break stats. Although Affinity is restricted to an absolute <strong className="text-orange-400">40%</strong> maximum cap in-game, adding Affinity attributes on Tier 91 gears (up to 4.5% per item) remains a powerful build option to convert graze hits into full-powered breaking attacks.
                  </p>
                  <p>
                    <strong className="text-[#f0b400]">5. Substat Relaying (Inherit mechanics)</strong>: When refining Level 91 gear, always prioritize relaying/inheriting attributes that have reached diamond/gold thresholds (such as Phys Pen 9.0%, Max Atk 63.8, Crit 7.4%, etc.). A carefully put-together set can singlehandedly contribute over 40% of your graduation progression.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
                    </div>
                  )}
                  {gradModalActiveTab === "cultivate" && (
                    <div style={{ textAlign: 'left' }}>
                      {gradModalActiveTab === "cultivate" && (
          <div className="space-y-6">
            <div className="bg-[#141619] border border-[#23262c] rounded-xl p-6 shadow-lg">
              <div className="border-b border-[#f0b400]/25 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold font-serif text-slate-105 flex items-center gap-2">
                    🎯 Cultivation Summary
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Compare your current in-combat panel against the fully-graduated target panel.
                  </p>
                  <p className="text-amber-500/70 text-[11.5px] mt-1">
                    ⓘ Caps = the verified 95下 (Global T91) graduated panel from the official sheet. Progress over 100% means you already exceed the graduated target for that stat. Five-attribute (Strength/Power/Agility) tiles track gear substats.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-mono text-slate-500">Select Class:</span>
                  <select
                    value={cultivateClass}
                    onChange={(e) => setCultivateClass(e.target.value)}
                    className="bg-[#1a1a1d] border border-[#23262c]/30 hover:border-[#f0b400]/50 text-[#f0b400] text-sm rounded-lg px-3 py-1.5 focus:outline-none font-bold transition-all cursor-pointer"
                  >
                    {Object.keys(GRAD95_PANEL).map((cls) => (
                      <option key={cls} value={cls}>
                        {classDisplayName(cls)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stats Overview */}
              {(() => {
                const classData = WWM_DATA.classes[cultivateClass as keyof typeof WWM_DATA.classes] || { graduationPanel: {}, marginalGains: [] };
                const graduationPanel = classData.graduationPanel || {};
                const marginalGains = classData.marginalGains || [];

                // helper mapping function
                const getStatConfig = (statName: string, gradPanel: any) => {
                  let gearType = "";
                  let gradKey = "";
                  let isPercentage = false;
                  let fallbackTarget = 100;

                  const nameLower = statName.toLowerCase();
                  if (nameLower.includes("max phys atk") || nameLower === "max physical atk") {
                    gearType = "Max Phys Atk";
                    gradKey = "Max Phys Atk";
                    isPercentage = false;
                  } else if (nameLower.includes("min phys atk") || nameLower === "min physical atk") {
                    gearType = "Min Phys Atk";
                    gradKey = "Min Phys Atk";
                    isPercentage = false;
                  } else if (nameLower.includes("phys pen") || nameLower === "physical penetration") {
                    gearType = "Phys Pen";
                    gradKey = "Phys Pen";
                    isPercentage = true;
                  } else if (nameLower.includes("crit rate") || nameLower === "critical rate") {
                    gearType = "Crit Rate";
                    gradKey = "Crit Rate";
                    isPercentage = true;
                  } else if (nameLower.includes("crit dmg") || nameLower === "critical damage") {
                    gearType = "Crit DMG";
                    gradKey = "Crit DMG";
                    isPercentage = true;
                  } else if (nameLower.includes("affinity rate")) {
                    gearType = "Affinity Rate";
                    gradKey = "Affinity Rate";
                    isPercentage = true;
                  } else if (nameLower.includes("affinity dmg")) {
                    gearType = "Affinity DMG";
                    gradKey = "Affinity DMG";
                    isPercentage = true;
                  } else if (nameLower.includes("precision")) {
                    gearType = "Precision";
                    gradKey = "Precision";
                    isPercentage = true;
                  } else if (nameLower.includes("max bamboocut")) {
                    gearType = "Max Bamboocut Atk";
                    gradKey = "Max Bamboocut";
                    isPercentage = false;
                  } else if (nameLower.includes("min bamboocut")) {
                    gearType = "Min Bamboocut Atk";
                    gradKey = "Min Bamboocut";
                    isPercentage = false;
                  } else if (nameLower.includes("formless pen") || nameLower.includes("bamboocut pen")) {
                    gearType = "Formless Pen";
                    gradKey = "Bamboocut Pen";
                    isPercentage = true;
                  } else if (nameLower.includes("own weapon bonus") || nameLower.includes("own weapon martial")) {
                    gearType = "Art of Weapon Boost";
                    gradKey = "Own Weapon Bonus";
                    isPercentage = true;
                    fallbackTarget = 32.0;
                  } else if (nameLower.includes("all weapon") || nameLower.includes("all martial")) {
                    gearType = "All Martial Arts";
                    gradKey = "All Martial Arts Bonus";
                    isPercentage = true;
                    fallbackTarget = 16.0;
                  } else if (nameLower.includes("boss dmg")) {
                    gearType = "Boss DMG%";
                    gradKey = "Boss DMG Bonus";
                    isPercentage = true;
                    fallbackTarget = 12.0;
                  } else if (nameLower.includes("strength")) {
                    gearType = "Strength";
                    gradKey = "Strength";
                    isPercentage = false;
                    fallbackTarget = 120;
                  } else if (nameLower.includes("power")) {
                    gearType = "Power";
                    gradKey = "Power";
                    isPercentage = false;
                    fallbackTarget = 120;
                  } else if (nameLower.includes("agility")) {
                    gearType = "Agility";
                    gradKey = "Agility";
                    isPercentage = false;
                    fallbackTarget = 120;
                  } else if (nameLower.includes("phys dmg")) {
                    gearType = "Phys DMG%";
                    gradKey = "Phys DMG Up";
                    isPercentage = true;
                    fallbackTarget = 15;
                  }

                  let rawTarget = 0;
                  if (gradKey && gradPanel && gradPanel[gradKey] !== undefined) {
                    rawTarget = gradPanel[gradKey];
                    if (isPercentage && rawTarget <= 2.0 && rawTarget > 0) {
                      rawTarget = rawTarget * 100;
                    }
                  } else {
                    rawTarget = fallbackTarget;
                  }

                  const scaledTarget = rawTarget * 0.604;

                  return {
                    gearType,
                    gradKey,
                    isPercentage,
                    scaledTarget
                  };
                };

                // get active gear items
                const activeGear = getActiveGear();

                // Compute summed substats per gearType
                const currentSubsSum: Record<string, number> = {};
                activeGear.forEach((gear) => {
                  gear.subs.forEach((sub) => {
                    const type = sub.type;
                    const valNum = parseFloat(sub.val.replace(/[^\d.]/g, "")) || 0;
                    currentSubsSum[type] = (currentSubsSum[type] || 0) + valNum;
                  });
                });

                // Cultivation summary in SUBSTAT-COUNT (条) units, matching the
                // reference layout: each stat shows the current "count" (gear sum ÷
                // max 95下 roll) vs the verified graduated substat count
                // (GRAD95_COUNTS). e.g. Max Phys 4.7/12条.
                const counts95 = GRAD95_COUNTS[cultivateClass] || {};
                const ownWeaponSum = Object.entries(currentSubsSum)
                  .filter(([k]) => SUB_MAP[k] && /^(umb|rope|sword|spear|fan|twinblades|modao|hengdao|gauntlets)(All|Martial|Special|Charged)$/.test(SUB_MAP[k] as string))
                  .reduce((s, [, v]) => s + (v || 0), 0);
                const COUNT_CATS: { key: string; label: string; roll: number; sum: number }[] = [
                  { key: "maxOuter",  label: "Max Phys Atk",     roll: 63.8, sum: currentSubsSum["Max Phys Atk"] || 0 },
                  { key: "strength",  label: "Strength (劲)",     roll: 40.4, sum: currentSubsSum["Strength"] || 0 },
                  { key: "crit",      label: "Crit Rate",        roll: 7.4,  sum: currentSubsSum["Crit Rate"] || 0 },
                  { key: "agility",   label: "Agility (敏)",      roll: 40.4, sum: currentSubsSum["Agility"] || 0 },
                  { key: "prec",      label: "Precision",        roll: 6.6,  sum: currentSubsSum["Precision"] || 0 },
                  { key: "power",     label: "Power (势)",        roll: 40.4, sum: currentSubsSum["Power"] || 0 },
                  { key: "aff",       label: "Affinity Rate",    roll: 3.6,  sum: currentSubsSum["Affinity Rate"] || 0 },
                  { key: "minOuter",  label: "Min Phys Atk",     roll: 63.8, sum: currentSubsSum["Min Phys Atk"] || 0 },
                  { key: "boss",      label: "Boss DMG",         roll: 2.6,  sum: currentSubsSum["Boss DMG%"] || 0 },
                  { key: "ownWeapon", label: "Own Weapon Boost", roll: 5.2,  sum: ownWeaponSum },
                  { key: "allWeapon", label: "All Martial Arts", roll: 2.6,  sum: currentSubsSum["All Martial Arts"] || 0 },
                ];

                const tiles = COUNT_CATS.map(cat => {
                  const targetCount = counts95[cat.key] || 0;
                  const currentCount = cat.roll > 0 ? cat.sum / cat.roll : 0;
                  if (targetCount === 0 && currentCount < 0.05) return null; // not graduated & not owned
                  const progressPct = targetCount > 0 ? (currentCount / targetCount) * 100 : 100;
                  const progressCapped = Math.min(progressPct, 100);
                  let bgCardClass = "bg-[#1f1915]/40 border-rose-950/40 text-rose-450";
                  let progressFillColor = "bg-rose-500";
                  if (progressPct >= 80) { bgCardClass = "bg-[#141c16]/40 border-emerald-950/30 text-emerald-400"; progressFillColor = "bg-emerald-500"; }
                  else if (progressPct >= 40) { bgCardClass = "bg-[#1e1a12]/40 border-[#23262c]/30 text-[#f0b400]"; progressFillColor = "bg-[#f0b400]"; }
                  return { label: cat.label, currentCount, targetCount, progressPct, progressCapped, bgCardClass, progressFillColor };
                }).filter(Boolean) as any[];

                // Total graduated substats (~40) and the user's capped progress toward it.
                const totalTargetCount = (Object.values(counts95) as number[]).reduce((a, b) => a + b, 0) || 40;
                const totalProgressVal = tiles.reduce((acc: number, t: any) => acc + (t.targetCount > 0 ? Math.min(t.currentCount, t.targetCount) : 0), 0);

                // Dingyin counts
                let totalSubsCount = 0;
                let tunedSubsCount = 0;
                activeGear.forEach((gear) => {
                  gear.subs.forEach((sub) => {
                    totalSubsCount++;
                    if (sub.isTuned) {
                      tunedSubsCount++;
                    }
                  });
                });
                const dingyinPct = totalSubsCount > 0 ? (tunedSubsCount / totalSubsCount) * 100 : 0;

                // ── Steps 2 & 3 helpers: graduation rate for an arbitrary panel ──
                // Reuses the live DPS formula + authoritative T91 baseline, exactly
                // like statPriorityList, so simulated upgrades read in real grad-%.
                const gradForPanel = (p: PanelStats): number => {
                  let total = 0;
                  getRotationForBuild(selectedBuild).forEach((item) => {
                    const { total: dmg } = calcSkill(item, p, activeTier, {
                      set: p.set || adjustedPanel.set,
                      datang, yishui, buildKey: selectedBuild,
                      weaponStars: (adjustedPanel as any).weaponStars,
                    } as any);
                    total += dmg;
                  });
                  return (total / baselineScore) * 100;
                };
                const baseGradRate = rotationStats.gradRate;

                // ── STEP 2: 定音词条总结 (Tuned/Dingyin substat summary) ──
                // For every equipped tuned substat, simulate raising it to the 95下
                // per-line cap and measure the resulting graduation-rate gain.
                const equippedForCult = activeGear.filter((it) => isItemEquipped(it, activeGear));
                let dyCurSum = 0, dyMaxSum = 0;
                const dingyinRows = equippedForCult.flatMap((gear) =>
                  gear.subs
                    .map((sub, si) => ({ sub, si }))
                    .filter(({ sub }) => sub.isTuned && SUB_MAP[sub.type] && MAX_ROLL_95[SUB_MAP[sub.type]])
                    .map(({ sub }) => {
                      const pKey = SUB_MAP[sub.type];
                      const maxVal = MAX_ROLL_95[pKey] as number;
                      const curVal = parseFloat(sub.val.replace(/[^\d.]/g, "")) || 0;
                      dyCurSum += Math.min(curVal, maxVal);
                      dyMaxSum += maxVal;
                      const delta = Math.max(0, maxVal - curVal);
                      const upPanel = { ...adjustedPanel, [pKey]: (adjustedPanel[pKey] as number) + delta } as PanelStats;
                      const rateUpgrade = delta > 0 ? gradForPanel(upPanel) - baseGradRate : 0;
                      const isPct = /Pen|Rate|DMG|Precision|Boost|Bonus|Arts/.test(sub.type);
                      return { slotLabel: getSlotLabel(gear.slot), itemName: gear.name, statType: sub.type, curVal, maxVal, rateUpgrade, isPct };
                    })
                ).sort((a, b) => b.rateUpgrade - a.rateUpgrade);
                const dingyinFillPct = dyMaxSum > 0 ? (dyCurSum / dyMaxSum) * 100 : 0;

                // ── STEP 3: 培养建议 (Optimal allocation) — greedy next-best ──
                // Greedily allocate the next CULT_BUDGET substat rolls onto the
                // current panel, each time choosing the stat with the highest
                // marginal grad-rate gain. Shows the recommended cultivation
                // direction + total reachable grad-% for this path.
                // NOTE: Penetration (phys/attr) is intentionally EXCLUDED here — like
                // spongem, pen comes only from tuned (定音) lines and is handled by the
                // 定音 summary above. Including it makes the greedy dump everything into
                // uncapped pen. Step 3 optimises the regular (non-tuned) substat pool.
                const CULT_BUDGET = 8;
                const OPT_CANDIDATES_ALL: { key: keyof PanelStats; label: string; roll: number; isPct: boolean }[] = [
                  { key: "maxOuter", label: "Max Phys Atk", roll: 63.8, isPct: false },
                  { key: "minOuter", label: "Min Phys Atk", roll: 63.8, isPct: false },
                  { key: "crit", label: "Crit Rate", roll: 7.4, isPct: true },
                  { key: "aff", label: "Affinity Rate", roll: 3.6, isPct: true },
                  { key: "prec", label: "Precision", roll: 6.6, isPct: true },
                  { key: "maxPz", label: "Bamboocut Atk", roll: 36.2, isPct: false },
                  { key: "bossDmg", label: "Boss DMG", roll: 2.6, isPct: true },
                  { key: "allArts", label: "All Martial Arts", roll: 2.6, isPct: true },
                ];
                const OPT_CANDIDATES = OPT_CANDIDATES_ALL.filter((c) => MAX_ROLL_95[c.key] !== undefined);
                // Per-stat headroom = graduated 条 target (GRAD95_COUNTS) − 条 already
                // owned. Caps each stat so the greedy spreads across stats toward the
                // path's graduated distribution instead of dumping into one linear stat.
                const optCounts95 = GRAD95_COUNTS[cultivateClass] || GRAD95_COUNTS["Bamboocut-Dust"];
                const ownedCountFor = (key: keyof PanelStats, roll: number): number => {
                  const subName = Object.keys(SUB_MAP).find((k) => SUB_MAP[k] === key);
                  const sum = subName ? (currentSubsSum[subName] || 0) : 0;
                  return roll > 0 ? sum / roll : 0;
                };
                const headroom: Record<string, number> = {};
                OPT_CANDIDATES.forEach((c) => {
                  const target = optCounts95[c.key as string] ?? 0;
                  headroom[c.key as string] = Math.max(0, target - ownedCountFor(c.key, c.roll));
                });
                const optAlloc: Record<string, { label: string; count: number; gain: number; isPct: boolean }> = {};
                let optPanel = { ...adjustedPanel } as PanelStats;
                let optGradRunning = baseGradRate;
                for (let step = 0; step < CULT_BUDGET; step++) {
                  let best: { cand: typeof OPT_CANDIDATES[number]; grad: number } | null = null;
                  for (const cand of OPT_CANDIDATES) {
                    if ((headroom[cand.key as string] ?? 0) < 1) continue; // graduated for this stat
                    const trial = { ...optPanel, [cand.key]: (optPanel[cand.key] as number) + cand.roll } as PanelStats;
                    const g = gradForPanel(trial);
                    if (!best || g > best.grad) best = { cand, grad: g };
                  }
                  if (!best || best.grad - optGradRunning < 0.001) break;
                  const c = best.cand;
                  optPanel = { ...optPanel, [c.key]: (optPanel[c.key] as number) + c.roll } as PanelStats;
                  headroom[c.key as string] = (headroom[c.key as string] ?? 0) - 1;
                  const slot = (optAlloc[c.key as string] ||= { label: c.label, count: 0, gain: 0, isPct: c.isPct });
                  slot.count += 1;
                  slot.gain += best.grad - optGradRunning;
                  optGradRunning = best.grad;
                }
                const optRows = Object.values(optAlloc).sort((a, b) => b.gain - a.gain);
                const optTotalGain = optGradRunning - baseGradRate;

                return (
                  <div className="space-y-6">
                    {/* Header Summary Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-[#181512] border border-[#23262c] rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-sm font-mono uppercase tracking-wider text-slate-500">
                          Total sub-stat progress
                        </span>
                        <div className="text-3xl font-extrabold text-[#f0b400] font-serif mt-1 flex items-baseline gap-1.5">
                          <span>{totalProgressVal.toFixed(1)}</span>
                          <span className="text-base font-sans font-normal text-slate-500">/ {totalTargetCount} 条</span>
                        </div>
                      </div>
                      <div className="bg-[#181512] border border-[#23262c] rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-sm font-mono uppercase tracking-wider text-slate-500">
                          Dingyin (Tuned) stats
                        </span>
                        <div className="text-3xl font-extrabold text-[#f0b400] font-serif mt-1">
                          {dingyinPct.toFixed(1)}<span className="text-lg font-sans font-normal text-slate-500">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Grid of Stat Tiles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tiles.map((tile: any, idx: number) => {
                        return (
                          <div 
                            key={idx} 
                            className={`border rounded-xl p-5 space-y-3 transition-colors ${tile.bgCardClass}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-base font-bold font-mono tracking-tight text-slate-100">
                                {tile.label}
                              </span>
                              <span className="text-[12px] uppercase tracking-wider text-slate-500 font-mono">
                                {tile.targetCount > 0 ? "Graduated" : "Off-spec"}
                              </span>
                            </div>

                            <div className="flex justify-between items-baseline font-mono text-base">
                              <span className="text-slate-250 font-bold">
                                {tile.currentCount.toFixed(2)} 条
                              </span>
                              <span className="text-slate-500 font-medium">
                                / {tile.targetCount} 条
                              </span>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <div className="w-full bg-[#1a1a1d]/70 rounded-full h-2.5 overflow-hidden border border-[#23262c]">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${tile.progressFillColor}`}
                                  style={{ width: `${tile.progressCapped}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[13px] font-mono text-slate-500">
                                <span>Progress</span>
                                <span className="font-bold">{tile.progressPct.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Note at bottom */}
                    <div className="bg-[#141619]/30 border border-[#23262c]/40 rounded-xl p-4 text-sm text-slate-500 leading-relaxed font-mono">
                      Counts are in 条 (substat units): current = your gear's summed value ÷ the 95下 max roll; target = the verified 95下 (Global T91) graduated substat count for this path. Penetration is tuned/attuned (定音) — tracked separately.
                    </div>

                    {/* ── STEP 2: 定音词条总结 (Tuned Substat Summary) ── */}
                    <div className="bg-[#181512] border border-[#23262c] rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4 border-b border-[#23262c]/50 pb-3">
                        <h3 className="text-base font-bold font-serif text-slate-100">
                          🎵 Tuned (定音) Substat Summary
                        </h3>
                        <div className="text-right">
                          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">% of max</span>
                          <span className="text-xl font-extrabold text-[#f0b400] font-mono">{dingyinFillPct.toFixed(1)}%</span>
                        </div>
                      </div>
                      {dingyinRows.length === 0 ? (
                        <p className="text-sm text-slate-500 font-mono">No tuned (定音) substats on equipped gear yet. Mark a substat as ✦ Tuned to track its upgrade potential.</p>
                      ) : (
                        <>
                          <p className="text-[12px] text-slate-500 mb-3 font-mono">Tuned lines ranked by graduation-% gained if upgraded to the 95下 cap:</p>
                          <div className="flex flex-col gap-2">
                            {dingyinRows.map((row, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-white/[0.03] rounded-lg border-l-[3px] border-[#f0b400]">
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-slate-100 truncate">{row.slotLabel}</div>
                                  <div className="text-[12px] text-slate-500 truncate">{row.statType}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[12px] text-slate-500 font-mono">
                                    {row.curVal.toFixed(1)}{row.isPct ? "%" : ""} / {row.maxVal.toFixed(1)}{row.isPct ? "%" : ""}
                                  </div>
                                  <div className={`text-[13px] font-bold font-mono mt-0.5 ${row.rateUpgrade > 0.001 ? "text-emerald-400" : "text-slate-600"}`}>
                                    {row.rateUpgrade > 0.001 ? `Grad +${row.rateUpgrade.toFixed(2)}%` : "Maxed"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* ── STEP 3: 培养建议 (Optimal Cultivation Direction) ── */}
                    <div className="bg-[#141c16]/40 border border-emerald-950/40 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4 border-b border-emerald-900/40 pb-3">
                        <h3 className="text-base font-bold font-serif text-emerald-300">
                          💡 Cultivation Advice — best next {CULT_BUDGET} 条
                        </h3>
                        <div className="text-right">
                          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">Reachable</span>
                          <span className="text-xl font-extrabold text-emerald-400 font-mono">+{optTotalGain.toFixed(2)}%</span>
                        </div>
                      </div>
                      {optRows.length === 0 ? (
                        <p className="text-sm text-slate-500 font-mono">Your panel is already optimal — no single substat roll improves the graduation rate for this path.</p>
                      ) : (
                        <>
                          <p className="text-[12px] text-slate-500 mb-3 font-mono">
                            Greedy allocation of your next {CULT_BUDGET} substat rolls — invest in these stats (in order) to climb graduation fastest:
                          </p>
                          <div className="flex flex-col gap-2">
                            {optRows.map((row, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-white/[0.03] rounded-lg border-l-[3px] border-emerald-500">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-emerald-400 font-extrabold font-mono text-lg shrink-0">{row.count}×</span>
                                  <span className="text-sm font-bold text-slate-100 truncate">{row.label}</span>
                                </div>
                                <span className="text-[13px] font-bold font-mono text-emerald-400 shrink-0">+{row.gain.toFixed(2)}%</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-3 font-mono">
                            Each 条 = one max substat roll at 95下. Gains are diminishing (crit/affinity caps, pen breakpoints), so the allocation reflects real marginal value.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
                    </div>
                  )}
                  {gradModalActiveTab === "compare" && (
                    <div style={{ textAlign: 'left' }}>
                      {gradModalActiveTab === "compare" && (
          <div className="space-y-6">
            <div className="bg-[#141619] border border-[#23262c] rounded-xl p-6">
              <div className="mb-4 border-b border-[#23262c] pb-3">
                <h2 className="text-base font-extrabold text-[#f0b400] uppercase tracking-wider font-serif flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Item Comparison & Graduation Deltas
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Select a slot from the left panel to compare gear items. Ranked by graduation contribution using the T91/Lv95 damage formula.
                </p>
              </div>

              {/* Upgrade Analysis — cross-slot recommendation (T91/Lv95 formula) */}
              {(() => {
                const gear = getActiveGear();
                const slotInfo = SLOTS.map(slot => {
                  const items = gear.filter(it => it.slot === slot.name);
                  if (items.length === 0) return null;
                  const scored = items.map(it => ({ it, total: getGearItemCompareStats(it).totalGradDelta, equipped: isItemEquipped(it, gear) }));
                  scored.sort((a, b) => b.total - a.total);
                  const best = scored[0];
                  const equipped = scored.find(s => s.equipped) || null;
                  const equippedTotal = equipped ? equipped.total : 0;
                  const gain = best.total - equippedTotal;
                  return { slot: slot.name, label: getSlotLabel(slot.name), best, equipped, equippedTotal, gain };
                }).filter(Boolean) as { slot: string; label: string; best: any; equipped: any; equippedTotal: number; gain: number }[];

                const upgrades = slotInfo.filter(s => s.best && !s.best.equipped && s.gain > 0.01).sort((a, b) => b.gain - a.gain);
                const equippedSlots = slotInfo.filter(s => s.equipped).sort((a, b) => a.equippedTotal - b.equippedTotal);
                const totalSwapGain = upgrades.reduce((sum, u) => sum + u.gain, 0);

                // Top stat priorities for this build (highest marginal gain per roll)
                const build = BUILD_PROFILES[selectedBuild as keyof typeof BUILD_PROFILES];
                const priorityStats = (build?.priorityStats || []).slice(0, 4);
                const STAT_LABELS: Record<string, string> = {
                  maxOuter: "Max Phys Atk", minOuter: "Min Phys Atk", outerPen: "Phys Pen",
                  crit: "Crit Rate", critDmg: "Crit DMG", aff: "Affinity Rate", affDmg: "Affinity DMG",
                  prec: "Precision", maxPz: "Bamboocut Atk", pzPen: "Formless Pen", pzDmg: "Bamboocut DMG",
                  umbMartial: "Umbrella Boost", ropeMartial: "Rope Dart Boost", allArts: "All Martial Arts", bossDmg: "Boss DMG",
                };

                return (
                  <div className="bg-[#161310] border border-amber-500/25 rounded-xl p-4 mb-6">
                    <h3 className="text-[13px] font-extrabold text-amber-400 uppercase tracking-wider font-serif flex items-center gap-2 mb-2">
                      🔍 Upgrade Analysis
                      <span className="text-[10px] font-mono text-slate-500 normal-case tracking-normal">(T91/Lv95 formula)</span>
                    </h3>

                    {upgrades.length > 0 ? (
                      <>
                        <p className="text-[12px] text-slate-300 mb-2.5">
                          You have <b className="text-emerald-400">{upgrades.length}</b> swap{upgrades.length > 1 ? "s" : ""} available worth up to{" "}
                          <b className="text-emerald-400">+{totalSwapGain.toFixed(2)}%</b> graduation. Highest-impact first:
                        </p>
                        <div className="space-y-1.5">
                          {upgrades.slice(0, 5).map((u, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 bg-[#0f0d0b] border border-slate-800/60 rounded-md px-3 py-1.5">
                              <span className="text-[12px] text-slate-300 truncate">
                                <span className="text-amber-500 font-bold">{u.label}</span>: equip <span className="text-slate-100">{u.best.it.name}</span>
                              </span>
                              <span className="text-[12px] font-mono font-bold text-emerald-400 shrink-0">+{u.gain.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-[12px] text-emerald-400/90 mb-1">✓ Your best available item is already equipped in every slot — no inventory swaps gain graduation right now.</p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-1">Stat priority (chase these)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {priorityStats.map((s, i) => (
                            <span key={s} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-600/15 text-amber-400 border border-amber-700/30">
                              {i + 1}. {STAT_LABELS[s] || s}
                            </span>
                          ))}
                        </div>
                      </div>
                      {equippedSlots.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-1">Weakest equipped slots</div>
                          <div className="flex flex-wrap gap-1.5">
                            {equippedSlots.slice(0, 3).map((s) => (
                              <span key={s.slot} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-400 border border-slate-700/40">
                                {s.label} ({s.equippedTotal.toFixed(1)}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-600 mt-2.5 leading-snug">
                      Gains are marginal graduation-% from this slot's substats vs your currently equipped item, using the verified T91/Lv95 (95下) damage formula. Add more items to a slot (via Gear / OCR) to compare alternatives.
                    </p>
                  </div>
                );
              })()}

              {/* Comparison list section — slot selected via left panel */}
              <div>
                <h3 className="text-sm uppercase font-bold tracking-widest text-slate-500 font-mono mb-4">
                  Graduation ranking for slot: <span className="text-[#f0b400] font-serif">{getSlotLabel(selectedSlot)}</span>
                </h3>

                {(() => {
                  const slotItems = getActiveGear().filter(it => it.slot === selectedSlot);
                  if (slotItems.length === 0) {
                    return (
                      <div className="bg-[#1a1a1d]/40 border border-dashed border-[#23262c] p-8 rounded-lg text-center font-mono">
                        <p className="text-slate-500 text-sm">No items in this slot to compare.</p>
                        <p className="text-[12px] text-slate-500 mt-1">Go to the "🛡 Gear" tab to add items for comparison.</p>
                      </div>
                    );
                  }
                  
                  const scored = slotItems.map(item => {
                    const stats = getGearItemCompareStats(item);
                    return {
                      item,
                      total: stats.totalGradDelta,
                      subs: stats.subsWithDeltas
                    };
                  });
                  
                  scored.sort((a, b) => b.total - a.total);
                  const bestScore = scored[0].total;
                  
                  return (
                    <div className="space-y-4">
                      {scored.map((entry, rankIdx) => {
                        const rank = rankIdx + 1;
                        const item = entry.item;
                        const isBest = rank === 1;
                        const gapToBest = isBest ? 0 : bestScore - entry.total;
                        const qualityClass = item.quality === "gold" ? "border-[#23262c] bg-[#1b1510]/80" : item.quality === "purple" ? "border-purple-500/20 bg-[#16121c]/80" : "border-sky-500/20 bg-[#11141a]/80";
                        
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border relative transition-all ${qualityClass}`}
                          >
                            <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-[#1a1a1d] border border-slate-700 flex items-center justify-center font-bold text-sm text-[#f0b400] font-serif shadow-inner">
                              #{rank}
                            </div>

                            <div className="pl-10">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#23262c]/40 pb-2 mb-3">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                    <span>{item.name}</span>
                                    {isBest && (
                                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider scale-90">
                                        Best Option
                                      </span>
                                    )}
                                  </h4>

                                </div>
                                <div className="text-right flex flex-col items-end gap-1.5">
                                  <div className="text-sm font-mono font-extrabold text-[#f0b400]">
                                    +{entry.total.toFixed(2)}% graduation
                                  </div>
                                  {!isBest && (
                                    <div className="text-[12px] font-mono font-semibold text-rose-400">
                                      -{gapToBest.toFixed(2)}% vs best
                                    </div>
                                  )}
                                  <button
                                    onClick={() => {
                                      const gear = getActiveGear();
                                      const others = gear.filter(g => g.id !== item.id);
                                      const reordered = [item, ...others];
                                      saveActiveGear(reordered);
                                    }}
                                    className="text-[11px] px-2 py-1 rounded bg-[#f0b400] hover:bg-[#ffed4e] text-slate-950 font-bold font-mono uppercase tracking-wide transition-colors"
                                  >
                                    ⚔ Equip
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {entry.subs.map((sub, sidx) => {
                                  const subDeltaString = sub.delta > 0 ? `+${sub.delta.toFixed(2)}` : "0.00";
                                  
                                  return (
                                    <div key={sidx} className="bg-[#1a1a1d]/70 p-2 rounded border border-[#23262c] flex items-center justify-between font-mono text-[12px]">
                                      <div className="truncate text-slate-500 flex items-center gap-1 shrink md:shrink-0 pr-1">
                                        <span>{sub.type}</span>
                                        {sub.isTuned && <span className="text-[#f0b400] text-[11px]">✦</span>}
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="text-slate-300 font-semibold">{sub.val}</div>
                                        <div className="text-emerald-400 text-[11px] font-bold mt-0.5">
                                          +{subDeltaString}% grad
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
                    </div>
                  )}
                  {gradModalActiveTab === "transmute" && (
                    <div style={{ textAlign: 'left' }}>
                      {(() => {
                        // 95下 max single-roll per gear substat. Crit DMG / Affinity
                        // DMG are NOT gear substats — they only exist on Inner Ways —
                        // so they are intentionally excluded as transmute targets.
                        const MAX_ROLL_95: Record<string, string> = {
                          "Max Phys Atk": "63.8", "Min Phys Atk": "63.8",
                          "Crit Rate": "7.4%",
                          "Phys Pen": "7.0%", "Affinity Rate": "3.6%",
                          "Precision": "6.6%",
                          "Strength": "40.4", "Power": "40.4", "Agility": "40.4",
                          "Boss DMG%": "2.6%", "All Martial Arts": "2.6%",
                          "Phys DMG%": "2.6%",
                          "Art of Umbrella Boost": "5.2%", "Art of Rope Dart Boost": "5.2%",
                          "Art of Sword Boost": "5.2%", "Art of Spear Boost": "5.2%",
                          "Art of Fan Boost": "5.2%", "Art of Dual Blades Boost": "5.2%",
                          "Art of Mo Blade Boost": "5.2%", "Art of Heng Blade Boost": "5.2%",
                          "Art of Gauntlets Boost": "5.2%",
                        };

                        const TRANSMUTE_CANDIDATES = [
                          "Max Phys Atk", "Min Phys Atk", "Crit Rate",
                          "Phys Pen", "Affinity Rate", "Precision",
                          "Strength", "Power", "Agility",
                          "Boss DMG%", "All Martial Arts", "Phys DMG%",
                        ];

                        const gear = getActiveGear();
                        const slotItems = gear.filter(it => it.slot === transmuteSlot);
                        const equipped = slotItems.find(it => isItemEquipped(it, gear)) || slotItems[0] || null;

                        const currentStats = equipped ? getGearItemCompareStats(equipped) : null;
                        const currentTotal = currentStats ? currentStats.totalGradDelta : 0;

                        // Build replacement analysis
                        let results: { candidateStat: string; maxRoll: string; newTotal: number; delta: number }[] = [];
                        if (equipped && transmuteSubIndex !== null && transmuteSubIndex < equipped.subs.length) {
                          const selectedSub = equipped.subs[transmuteSubIndex];
                          results = TRANSMUTE_CANDIDATES
                            .filter(candidate => {
                              // Skip if candidate is same as selected sub
                              if (candidate === selectedSub.type) return false;
                              // Skip if candidate already exists on item (can't have duplicate)
                              if (equipped.subs.some((s, i) => i !== transmuteSubIndex && s.type === candidate)) return false;
                              return true;
                            })
                            .map(candidate => {
                              const maxRoll = MAX_ROLL_95[candidate] || "0";
                              // Create a copy of the item with the replacement
                              const newSubs = equipped.subs.map((s, i) =>
                                i === transmuteSubIndex ? { type: candidate, val: maxRoll, isTuned: false } : { ...s }
                              );
                              const fakeItem = { ...equipped, subs: newSubs };
                              const newStats = getGearItemCompareStats(fakeItem);
                              return {
                                candidateStat: candidate,
                                maxRoll,
                                newTotal: newStats.totalGradDelta,
                                delta: newStats.totalGradDelta - currentTotal,
                              };
                            })
                            .sort((a, b) => b.delta - a.delta);
                        }

                        const bestResult = results.length > 0 ? results[0] : null;
                        const selectedSubDelta = (currentStats && transmuteSubIndex !== null && transmuteSubIndex < (currentStats.subsWithDeltas || []).length)
                          ? currentStats.subsWithDeltas[transmuteSubIndex].delta
                          : 0;

                        // Verdict logic
                        let verdict = "";
                        let verdictColor = "";
                        if (bestResult) {
                          if (bestResult.delta > 0.5) {
                            verdict = "Worth re-rolling — significant upgrade possible";
                            verdictColor = "text-emerald-400";
                          } else if (bestResult.delta > 0.1) {
                            verdict = "Marginal improvement — re-roll if resources allow";
                            verdictColor = "text-yellow-400";
                          } else {
                            verdict = "Keep current substat — no meaningful upgrade available";
                            verdictColor = "text-rose-400";
                          }
                        }

                        return (
                          <div className="space-y-6">
                            <div className="bg-[#141619] border border-[#23262c] rounded-xl p-6">
                              <div className="mb-4 border-b border-[#23262c] pb-3">
                                <h2 className="text-base font-extrabold text-[#f0b400] uppercase tracking-wider font-serif flex items-center gap-2">
                                  🔄 Transmutation Advice
                                </h2>
                                <p className="text-[12px] text-slate-500 mt-0.5">
                                  Pick a slot from the left panel, select a substat to re-roll, and see which replacement yields the best graduation improvement at T91 max rolls.
                                </p>
                              </div>

                              {/* Equipped item display — slot selected via left panel */}
                              {!equipped ? (
                                <div className="bg-[#1a1a1d]/40 border border-dashed border-[#23262c] p-8 rounded-lg text-center font-mono">
                                  <p className="text-slate-500 text-sm">No items in this slot. Add gear via the 🛡 Gear tab.</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Current item card */}
                                  <div className="bg-[#1a1a1d]/60 border border-[#23262c] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3 border-b border-[#23262c]/40 pb-2">
                                      <h3 className="text-sm font-bold text-slate-100">{equipped.name}</h3>
                                      <span className="text-sm font-mono font-extrabold text-[#f0b400]">+{currentTotal.toFixed(2)}% graduation</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mb-3">Click a substat to select it for transmutation analysis:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {(currentStats?.subsWithDeltas || []).map((sub, sidx) => {
                                        const isSubSelected = transmuteSubIndex === sidx;
                                        return (
                                          <button
                                            key={sidx}
                                            onClick={() => setTransmuteSubIndex(isSubSelected ? null : sidx)}
                                            className={`p-2 rounded border font-mono text-[12px] text-left transition-all ${
                                              isSubSelected
                                                ? "bg-[#f0b400]/15 border-[#f0b400] ring-1 ring-[#f0b400]/50"
                                                : "bg-[#1a1a1d]/70 border-[#23262c] hover:border-slate-600"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="truncate text-slate-400 flex items-center gap-1 pr-1">
                                                <span>{sub.type}</span>
                                                {sub.isTuned && <span className="text-[#f0b400] text-[11px]">✦</span>}
                                              </div>
                                              <div className="text-right shrink-0">
                                                <div className="text-slate-300 font-semibold">{sub.val}</div>
                                                <div className={`text-[11px] font-bold mt-0.5 ${sub.delta > 0 ? "text-emerald-400" : "text-slate-600"}`}>
                                                  +{sub.delta.toFixed(2)}% grad
                                                </div>
                                              </div>
                                            </div>
                                            {isSubSelected && (
                                              <div className="mt-1.5 pt-1.5 border-t border-[#f0b400]/30 text-[10px] text-[#f0b400] font-bold uppercase tracking-wider">
                                                ▸ Selected for re-roll
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Results */}
                                  {transmuteSubIndex !== null && equipped.subs[transmuteSubIndex] && (
                                    <div className="bg-[#141619] border border-[#23262c] rounded-xl p-4 space-y-4">
                                      <div className="border-b border-[#23262c] pb-3">
                                        <h3 className="text-[12px] font-mono font-bold tracking-widest text-[#f0b400] uppercase">
                                          Transmutation Results
                                        </h3>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          Re-rolling <span className="text-slate-300 font-semibold">{equipped.subs[transmuteSubIndex].type}</span> ({equipped.subs[transmuteSubIndex].val}) — showing max T91 roll for each candidate replacement.
                                        </p>
                                      </div>

                                      {/* Verdict banner */}
                                      {verdict && (
                                        <div className={`bg-[#1a1a1d]/80 border border-[#23262c] rounded-lg p-3 text-center ${verdictColor}`}>
                                          <div className="text-sm font-bold font-serif">{verdict}</div>
                                          {bestResult && bestResult.delta > 0 && (
                                            <div className="text-[11px] text-slate-400 mt-1">
                                              Best option: <span className="text-slate-200 font-semibold">{bestResult.candidateStat}</span> for{" "}
                                              <span className="text-emerald-400 font-bold">+{bestResult.delta.toFixed(2)}%</span> graduation improvement
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Individual results */}
                                      <div className="space-y-2">
                                        {results.map((r, ridx) => {
                                          const colorClass = r.delta > 0.5 ? "text-emerald-400" : r.delta > 0.1 ? "text-yellow-400" : r.delta > 0 ? "text-slate-400" : "text-rose-400";
                                          const bgClass = ridx === 0 && r.delta > 0.1 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#1a1a1d]/60 border-[#23262c]";
                                          return (
                                            <div key={r.candidateStat} className={`flex items-center justify-between p-3 rounded-lg border ${bgClass}`}>
                                              <div>
                                                <div className="text-[13px] text-slate-200 font-semibold">{r.candidateStat}</div>
                                                <div className="text-[11px] text-slate-500 font-mono">max roll: {r.maxRoll}</div>
                                              </div>
                                              <div className="text-right">
                                                <div className={`text-sm font-mono font-bold ${colorClass}`}>
                                                  {r.delta >= 0 ? "+" : ""}{r.delta.toFixed(2)}% grad
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-mono">
                                                  total: {r.newTotal.toFixed(2)}%
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {results.length === 0 && (
                                        <div className="text-center text-slate-500 text-sm py-4 font-mono">
                                          No valid replacement candidates for this substat.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {gradModalActiveTab === "best-build" && (
                    <div style={{ textAlign: 'left' }}>
                      <div className="bg-[#141619] border border-[#23262c] rounded-xl p-6">
                        <div className="mb-4 border-b border-[#23262c] pb-3">
                          <h2 className="text-base font-extrabold text-[#f0b400] uppercase tracking-wider font-serif flex items-center gap-2">🏆 Best Build</h2>
                          <p className="text-[12px] text-slate-500 mt-0.5">
                            Scans every gear piece in this scheme's pool (equipped or not), grouped by slot, and finds the combination with the highest graduation rate for the current build, set, ring and Inner Ways.
                          </p>
                        </div>
                        {!bestBuildRunning && (
                          <button onClick={runBestBuild} className="primary-btn" style={{ marginBottom: 12 }}>
                            {bestBuildResult ? "Re-run search" : "Find best build"}
                          </button>
                        )}
                        {bestBuildRunning && (
                          <div style={{ marginBottom: 12 }}>
                            <div className="text-[12px] text-slate-300 mb-1">Searching combinations… {bestBuildProgress}%</div>
                            <div className="progress-bar-container" style={{ height: 8, background: '#1a1a1d', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${bestBuildProgress}%`, height: '100%', background: '#4caf50', transition: 'width 0.2s' }} />
                            </div>
                          </div>
                        )}
                        {bestBuildResult && bestBuildResult.length > 0 && (() => {
                          const best = bestBuildResult[0];
                          const slotLabels: Record<string, string> = { Umbrella: "Weapon 1", "Rope Dart": "Weapon 2", Disc: "Disc", Pendant: "Pendant", Helmet: "Helmet", Chest: "Chest", Bracers: "Hands", Greaves: "Legs" };
                          const equipCombo = (g: GearItem[]) => {
                            const ids = new Set(g.map(x => x.id));
                            saveActiveGear(getActiveGear().map(it => ({ ...it, isEquipped: ids.has(it.id) })));
                          };
                          return (
                            <div className="space-y-4">
                              <div className="bg-[#1a1a1d]/60 border border-[#23262c] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3 border-b border-[#23262c]/40 pb-2">
                                  <h3 className="text-sm font-bold text-slate-100">Best combination</h3>
                                  <span className="text-sm font-mono font-extrabold text-[#f0b400]">{best.rate.toFixed(2)}% graduation</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {best.gear.map((g, i) => (
                                    <div key={i} className="bg-[#15161a] border border-[#23262c] rounded p-2">
                                      <div className="text-[10px] text-[#f0b400] uppercase tracking-wide">{slotLabels[g.slot] || g.slot}</div>
                                      <div className="text-[11.5px] text-slate-200 truncate" title={g.name}>{g.name}</div>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => equipCombo(best.gear)}
                                  className="primary-btn"
                                  style={{ marginTop: 12 }}
                                >Equip this build</button>
                              </div>
                              {bestBuildResult.length > 1 && (
                                <div>
                                  <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-2">Top alternatives</h4>
                                  <div className="space-y-1">
                                    {bestBuildResult.slice(1, 6).map((r, idx) => (
                                      <div key={idx} className="flex items-center justify-between bg-[#1a1a1d]/40 border border-[#23262c] rounded px-3 py-1.5 text-[11.5px]">
                                        <span className="text-slate-400">#{idx + 2}</span>
                                        <span className="text-slate-300 truncate flex-1 px-2" title={r.gear.map(g => g.name).join(", ")}>{r.gear.map(g => g.name).join(" · ")}</span>
                                        <span className="font-mono font-bold text-[#f0b400] mr-2">{r.rate.toFixed(2)}%</span>
                                        <button
                                          onClick={() => equipCombo(r.gear)}
                                          className="text-[10px] uppercase tracking-wide px-2 py-1 rounded border border-[#4caf50]/60 text-[#4caf50] hover:bg-[#4caf50]/15 whitespace-nowrap"
                                          title="Equip this combination to test it"
                                        >Equip</button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {bestBuildResult && bestBuildResult.length === 0 && (
                          <div className="text-slate-500 text-sm">No gear in the pool to search. Add gear via the 🛡 Gear tab.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT ITEM MODAL ── */}
      {isItemModalOpen && (
        <div className="modal" onClick={() => setIsItemModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '95%' }}>
            <div className="modal-header">
              <h2>{editingItem ? "Edit Gear Item" : "Add Gear Item"}</h2>
              <span className="close-btn" onClick={() => setIsItemModalOpen(false)}>&times;</span>
            </div>
            <div className="modal-body" style={{ textAlign: 'left' }}>
              <div className="form-row">
                <div className="form-group flex-08">
                  <label>Slot</label>
                  <select
                    value={selectedSlot}
                    onChange={e => {
                      const newSlot = e.target.value;
                      setSelectedSlot(newSlot);
                      if (newSlot === "Umbrella") setFormWeaponType("Umbrella");
                      else if (newSlot === "Rope Dart") setFormWeaponType("Rope Dart");

                      // reset set selection based on slot
                      if (newSlot === "Umbrella" || newSlot === "Rope Dart" || newSlot === "Pendant" || newSlot === "Disc") {
                        setFormSet("none");
                      } else if (newSlot === "Bow/Ring") {
                        setFormSet("pursuing");
                      } else {
                        setFormSet("stars");
                      }

                      // Auto-name: generate a default name based on slot
                      const slotLabel = getSlotLabel(newSlot);
                      const existingCount = getActiveGear().filter(it => it.slot === newSlot).length;
                      const autoName = existingCount === 0 ? slotLabel : `${slotLabel} #${existingCount + 1}`;
                      const isAutoNamed = !formName || SLOTS.some(s => formName.startsWith(getSlotLabel(s.name)));
                      if (isAutoNamed) setFormName(autoName);
                    }}
                    required
                  >
                    {SLOTS.map(s => (
                      <option key={s.name} value={s.name}>{getSlotLabel(s.name)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-08">
                  <label>Quality</label>
                  <select
                    value={formQuality}
                    onChange={e => setFormQuality(e.target.value as any)}
                  >
                    <option value="gold">Gold (Legendary)</option>
                    <option value="purple">Purple (Epic)</option>
                    <option value="blue">Blue (Rare)</option>
                  </select>
                </div>
                <div className="form-group grow">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Enter gear name"
                    required
                  />
                </div>
              </div>
              {(selectedSlot === "Umbrella" || selectedSlot === "Rope Dart") && (
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Weapon Type</label>
                    <select
                      value={formWeaponType}
                      onChange={e => setFormWeaponType(e.target.value)}
                    >
                      <option value="Sword">Sword</option>
                      <option value="Spear">Spear</option>
                      <option value="Umbrella">Umbrella</option>
                      <option value="Fan">Fan</option>
                      <option value="Rope Dart">Rope Dart</option>
                      <option value="Dual Blades">Dual Blades</option>
                      <option value="Modao">Modao</option>
                      <option value="Hengdao">Hengdao</option>
                      <option value="Gauntlets">Gauntlets</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Set</label>
                  <select
                    value={formSet}
                    onChange={e => setFormSet(e.target.value)}
                  >
                    {getSetOptionsForSlot(selectedSlot).map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mastery (optional)</label>
                  <input
                    type="number"
                    value={formMastery}
                    onChange={e => setFormMastery(e.target.value)}
                      placeholder="e.g. 832"
                    />
                  </div>
                </div>

                {/* In-Modal Gear Quick OCR Zone */}
                <div 
                  style={{
                    border: '1px dashed #78350f',
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#1b1310',
                    marginTop: '15px',
                    marginBottom: '10px',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (const item of Array.from(items)) {
                      if (item.type.startsWith("image/")) {
                        const file = item.getAsFile();
                        if (file) {
                          e.preventDefault();
                          handleModalOcr(file);
                        }
                      }
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      handleModalOcr(file);
                    }
                  }}
                  tabIndex={0}
                >
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleModalOcr(file);
                    }}
                  />
                  {isModalOcrProcessing ? (
                    <span style={{ fontSize: '12px', color: 'gold', fontWeight: 'bold' }} className="blink">
                      ⏳ Scanning gear stats with OCR...
                    </span>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#b5a297' }}>
                      📸 <strong>Quick OCR:</strong> <span style={{ textDecoration: 'underline', color: '#f59e0b', cursor: 'pointer' }} onClick={() => modalFileInputRef.current?.click()}>Choose an image</span>, drag &amp; drop, or press <strong>Ctrl+V</strong> on this page to auto-fill stats!
                    </div>
                  )}
                </div>

                {selectedSlot !== "Bow/Ring" && (
                <div className="stat-section" style={{ marginTop: '15px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ margin: 0 }}>Sub Stats</h3>
                  </div>
                  <div className="flex-column-gap8">
                    {formSubs.map((sub, sidx) => (
                      <React.Fragment key={sidx}>
                        {sidx === 0 && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Main Substat · 主词条</div>}
                        {sidx === 1 && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>Sub Substats · 副词条</div>}
                        {sidx === 5 && <div style={{ fontSize: 11, fontWeight: 700, color: '#f0b400', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>Tuned Substat · 定音 (tick ✦ on the tuned line)</div>}
                      <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                        <SearchableSelect
                          value={sub.type}
                          onChange={val => {
                            const next = [...formSubs];
                            next[sidx].type = val;
                            setFormSubs(next);
                          }}
                          options={SUB_STAT_OPTIONS}
                          placeholder="Search stat..."
                        />
                        <input
                          type="text"
                          value={sub.val}
                          onChange={e => {
                            const next = [...formSubs];
                            next[sidx].val = e.target.value;
                            setFormSubs(next);
                          }}
                          placeholder="e.g. 59.2 or 7.4%"
                          style={{ flex: 1, fontFamily: 'monospace' }}
                        />
                        <label
                          className="flex items-center gap-1 cursor-pointer select-none"
                          style={{ minWidth: '65px' }}
                          title="Attuned / Tuned (Dingyin) — boosts this substat's effect by 15% (x1.15)"
                        >
                          <input
                            type="checkbox"
                            checked={!!sub.isTuned}
                            onChange={e => {
                              const next = [...formSubs];
                              if (e.target.checked) {
                                next.forEach((s, idx) => {
                                  s.isTuned = idx === sidx;
                                });
                              } else {
                                next[sidx].isTuned = false;
                              }
                              setFormSubs(next);
                            }}
                            className="accent-[#f0b400] h-3.5 w-3.5"
                          />
                          <span className="text-[#f0b400] font-bold text-[10px] uppercase font-mono">Tuned ✦</span>
                        </label>
                      </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                )}
              </div>
              <div className="modal-footer modal-footer-between">
                <div className="modal-footer-left">
                  {editingItem && (
                    <button
                      onClick={() => handleDeleteItem(editingItem.id)}
                      className="danger-btn"
                      style={{ padding: '8px 16px' }}
                    >
                      Delete Item
                    </button>
                  )}
                </div>
                <div className="modal-footer-right">
                  <button
                    onClick={() => setIsItemModalOpen(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveItem}
                    className="save-btn"
                  >
                    Save Gear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ── EXPORT/IMPORT MODAL ── */}
      {isExportImportModalOpen && (
        <div className="modal" onClick={() => setIsExportImportModalOpen(false)}>
          <div className="modal-content modal-content-export" onClick={e => e.stopPropagation()} style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>Export / Import Data</h2>
              <span className="close-btn" onClick={() => setIsExportImportModalOpen(false)}>&times;</span>
            </div>
            <div className="modal-body export-import-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(88,166,255,0.08)", border: "1px solid rgba(88,166,255,0.25)", borderRadius: 8, fontSize: 12, color: "#adbac7", lineHeight: 1.55 }}>
                <b style={{ color: "#58a6ff" }}>How to share your build</b><br />
                1. Click <b>Export Data</b> — your full build (gear, stats, inner ways) is copied to the clipboard as text.<br />
                2. Send that text to a friend (Discord, paste-bin, etc.).<br />
                3. They open this same window, paste it into the box below, and click <b>Import</b>.<br />
                <span style={{ color: "#6e7681" }}>This is a text copy, not a website link — nothing is uploaded. Prefer a file? Use <b>Download to File</b>.</span>
              </div>
              <div className="export-import-buttons" style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  onClick={() => {
                    const str = JSON.stringify(charsData, null, 2);
                    const textarea = document.getElementById("export-import-textarea") as HTMLTextAreaElement;
                    if (textarea) textarea.value = str;
                    navigator.clipboard.writeText(str);
                    alert("Data copied to clipboard!");
                  }}
                  className="primary-btn"
                >
                  Export Data
                </button>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(charsData, null, 2));
                    const a = document.createElement('a');
                    a.setAttribute("href", dataStr);
                    a.setAttribute("download", `WWM_Builds_${new Date().toISOString().slice(0,10)}.json`);
                    document.body.appendChild(a); a.click(); a.remove();
                  }}
                  className="secondary-btn"
                >
                  Download to File
                </button>
                <label className="secondary-btn cursor-pointer inline-flex">
                  Upload File
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          const parsed = sanitizeChars(JSON.parse(ev.target?.result as string));
                          if (parsed.chars && Array.isArray(parsed.chars)) {
                            setCharsData(parsed);
                            localStorage.setItem("wwm_chars_v3", JSON.stringify(parsed));
                            alert("Data imported successfully!");
                            setIsExportImportModalOpen(false);
                          } else {
                            alert("Invalid file structure.");
                          }
                        } catch {
                          alert("Failed to parse JSON file.");
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    const textarea = document.getElementById("export-import-textarea") as HTMLTextAreaElement;
                    if (textarea && textarea.value.trim()) {
                      try {
                        const parsed = sanitizeChars(JSON.parse(textarea.value.trim()));
                        if (parsed.chars && Array.isArray(parsed.chars)) {
                          setCharsData(parsed);
                          localStorage.setItem("wwm_chars_v3", JSON.stringify(parsed));
                          alert("Data imported successfully!");
                          setIsExportImportModalOpen(false);
                        } else {
                          alert("Invalid data structure.");
                        }
                      } catch {
                        alert("Failed to parse JSON string.");
                      }
                    } else {
                      alert("Please paste data content into the text area first.");
                    }
                  }}
                  className="secondary-btn"
                >
                  Paste to Import
                </button>
              </div>
              <div className="export-import-textarea-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <label className="export-import-label">Data Content:</label>
                <textarea
                  id="export-import-textarea"
                  className="export-import-textarea"
                  placeholder="Click Export Data button to generate JSON, or paste a backup string here to import."
                  style={{ flex: 1, minHeight: '150px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BATCH OCR MODAL ── */}
      {isBatchOcrModalOpen && (
        <div className="modal" onClick={() => setIsBatchOcrModalOpen(false)}>
          <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()} style={{ width: '900px', maxWidth: '95%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>Batch OCR (Text Recognition)</h2>
              <span className="close-btn" onClick={() => setIsBatchOcrModalOpen(false)}>&times;</span>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              <OcrScanner
                onOcrResult={(scanned) => {
                  handleOcrResult(scanned);
                  setIsBatchOcrModalOpen(false);
                }}
                onImportGears={(scannedGears) => {
                  const newItems: GearItem[] = scannedGears.map(item => parseTextToGearItem(item.rawText, item.fileName));
                  
                  setCharsData(prev => {
                    const activeCharIdx = prev.chars.findIndex(c => c.id === prev.activeCharId);
                    if (activeCharIdx === -1) return prev;
                    
                    const char = prev.chars[activeCharIdx];
                    const updatedChars = [...prev.chars];
                    updatedChars[activeCharIdx] = {
                      ...char,
                      schemes: char.schemes.map(s => {
                        if (s.id === prev.activeSchemeId) {
                          return {
                            ...s,
                            gear: [...(s.gear || []), ...newItems]
                          };
                        }
                        return s;
                      })
                    };
                    
                    const nextData = {
                      ...prev,
                      chars: updatedChars
                    };
                    localStorage.setItem("wwm_chars_v3", JSON.stringify(nextData));
                    return nextData;
                  });

                  setIsBatchOcrModalOpen(false);
                  alert(`🎉 Successfully imported ${newItems.length} new gear items into your inventory!`);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── SELECT XINFA MODAL ── */}
      {isXinfaModalOpen && (
        <div className="modal" onClick={() => setIsXinfaModalOpen(false)}>
          <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()} style={{ width: '900px', maxWidth: '95%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>Select Inner Way (Xinfa)</h2>
              <span className="close-btn" onClick={() => setIsXinfaModalOpen(false)}>&times;</span>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={innerWaySearch}
                  onChange={(e) => setInnerWaySearch(e.target.value)}
                  placeholder="Search Inner Ways..."
                  className="flex-1"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: '#1a1a1d', color: '#fff' }}
                />
              </div>
              <div className="xinfa-select-grid" style={{ flex: 1, overflowY: 'auto' }}>
                {INNER_WAYS.filter(iw => {
                  if (innerWaySearch && !iw.name.toLowerCase().includes(innerWaySearch.toLowerCase())) return false;
                  return true;
                }).map(iw => {
                  const isSelected = selectedInnerWays.includes(iw.id);
                  const imageUrl = INNER_WAY_IMAGES[iw.name];
                  return (
                    <div
                      key={iw.id}
                      className={`xinfa-select-item ${isSelected ? "selected-innerway" : ""}`}
                      onClick={() => {
                        let updated = [...selectedInnerWays];
                        if (isSelected) {
                          updated = updated.filter(id => id !== iw.id);
                        } else {
                          if (updated.length < 4) {
                            updated.push(iw.id);
                          } else {
                            alert("You can select up to 4 Inner Ways.");
                          }
                        }
                        updated = updated.filter(Boolean);
                        setSelectedInnerWays(updated);
                      }}
                    >
                      <div className="xinfa-img-wrapper" style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#56657a', userSelect: 'none' }}>{iw.name[0]}</span>
                        {imageUrl && <img src={imageUrl} alt={iw.name} style={{ position: 'relative', zIndex: 1, backgroundColor: '#000' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'gold',
                            color: '#1a1a1d',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            zIndex: 2
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="xinfa-select-name">{iw.name}</div>
                      {isSelected && (
                        <select
                          className="xinfa-tier-select"
                          value={innerWayTiers[iw.id] ?? 6}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); setInnerWayTiers({ ...innerWayTiers, [iw.id]: Number(e.target.value) }); }}
                          title="Breakthrough tier (changes the granted stat)"
                        >
                          {[1, 2, 3, 4, 5, 6].map(t => <option key={t} value={t}>Tier {t}</option>)}
                        </select>
                      )}
                      {(() => {
                        const trig = iw.trigger || "utility";
                        const meta: Record<string, { label: string; color: string; bg: string }> = {
                          passive:     { label: "Always-on", color: "#7ee787", bg: "rgba(46,160,67,0.15)" },
                          ramp:        { label: "Ramps in combat", color: "#f0b400", bg: "rgba(187,128,9,0.15)" },
                          conditional: { label: "Conditional", color: "#ff9f6b", bg: "rgba(219,109,40,0.15)" },
                          utility:     { label: "Utility (no stat)", color: "#8b949e", bg: "rgba(110,118,129,0.12)" },
                        };
                        const m = meta[trig];
                        const shownTier = isSelected ? (innerWayTiers[iw.id] ?? 6) : 6;
                        const maxStat = (iw.tiers.find(t => t.tier === shownTier) || iw.tiers[iw.tiers.length - 1])?.stat || {};
                        const labels: Record<string, string> = {
                          outerPen: "Pen", pzPen: "Formless Pen", crit: "Crit", aff: "Aff", dcrit: "D.Crit",
                          critDmg: "Crit DMG%", affDmg: "Aff DMG%", outerDmg: "Phys DMG%", pzDmg: "Attr DMG%", generalDmg: "DMG%",
                        };
                        const parts = Object.entries(maxStat)
                          .filter(([, v]) => (v as number) > 0)
                          .map(([k, v]) => `+${v}${k === "outerPen" || k === "pzPen" || k === "dcrit" ? "" : "%"} ${labels[k] || k}`);
                        return (
                          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                            <span style={{ fontSize: 9.5, fontWeight: 700, color: m.color, background: m.bg, padding: "1px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.3 }}>
                              {m.label}
                            </span>
                            {parts.length > 0 && (
                              <span style={{ fontSize: 9.5, color: "#a7b0bb", fontFamily: "monospace" }} title="Max value applied as in-combat buff">
                                {parts.join(" · ")}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11.5, color: "#f0b400cc", lineHeight: 1.4, margin: 0 }}>
                ⓘ Inner Ways are <b>in-combat buffs</b> — they do NOT appear in your character-menu panel. The calculator adds each selected stat at its <b>max value</b> (full stacks / condition met) on top of your base panel. "Conditional" ones require a specific state (enemy exhausted, &gt;50% HP, random proc…), so real uptime may be lower.
              </p>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#232328', padding: '15px 20px', margin: '0 -20px -20px -20px', borderRadius: '0 0 12px 12px', borderTop: '1px solid #3d3d42' }}>
                <span style={{ color: 'var(--text-sub)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Selected: {selectedInnerWays.length} / 4
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="cancel-btn"
                    onClick={() => setSelectedInnerWays([])}
                    style={{ padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold' }}
                  >
                    Clear All
                  </button>
                  <button
                    className="primary-btn"
                    onClick={() => setIsXinfaModalOpen(false)}
                    style={{ padding: '8px 24px', borderRadius: '4px', fontWeight: 'bold' }}
                  >
                    Confirm & Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
