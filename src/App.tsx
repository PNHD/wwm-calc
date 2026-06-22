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
import { PanelStats, TierConstants } from "./types";
import { TIERS, calcSkill, calcBaseline, getRotationForBuild, getRotationTimeForBuild } from "./utils/calc";
import { INNER_WAYS } from "./data/innerways";
import { INNER_WAY_IMAGES, WEAPON_IMAGES_G8, MYSTIC_SKILL_IMAGES, ARMOR_SET_IMAGES } from "./data/game8Images";
import { WWM_DATA } from "./data/wwmData";
import OcrScanner from "./components/OcrScanner";
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
  { pct: 90, label: "S", color: "bg-[#ffd700]" },
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
  "stars":         "from-[#ffd700] to-yellow-700",
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
  "flawlessdef":   "from-yellow-200 to-[#ffd700]",
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

// Load/import guard: a calibration baseOverride poisoned by a Min>Max typo
// (e.g. 1362 entered as 13622) silently inflates DPS/graduation to absurd values.
// Drop the bad override so the panel auto-recomputes from gear instead of showing
// garbage. Healthy gearless bases always keep min <= max.
const sanitizeChars = <T,>(data: T): T => {
  (data as { chars?: { schemes?: { baseOverride?: Partial<PanelStats> }[] }[] })?.chars?.forEach(c =>
    c?.schemes?.forEach(s => {
      const b = s?.baseOverride;
      if (b && ((b.minOuter ?? 0) > (b.maxOuter ?? 0) || (b.minPz ?? 0) > (b.maxPz ?? 0))) delete s.baseOverride;
    }),
  );
  return data;
};
// ---------------------------------------------------------------------------

const BUILD_PROFILES = {
  "bamboocut-dust": {
    label: "Bamboocut-Dust", weapons: "Everspring Umbrella + Unfettered Rope Dart",
    tier: "T0 AoE", color: "text-[#ffd700]",
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
    tier: "T0 AoE", color: "text-[#ffd700]",
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
      <div className="border-b border-[#3d3d45]/50 pb-2 mb-2">
        <button
          onClick={() => setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          })}
          className="w-full flex items-center justify-between text-[11px] font-mono tracking-wider text-[#ffd700]/80 uppercase mb-1"
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
    setFormName(`${slotLabel} ${existingCount + 1}`);
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
      customRes
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
    // Typo guard: Physical/Attribute Min must be <= Max. A stray extra digit
    // (e.g. 1362 -> 13622) poisons the gearless base and inflates DPS hugely.
    const minO = parseFloat(calibInputs["minOuter"]), maxO = parseFloat(calibInputs["maxOuter"]);
    const minP = parseFloat(calibInputs["minPz"]), maxP = parseFloat(calibInputs["maxPz"]);
    if ((!isNaN(minO) && !isNaN(maxO) && minO > maxO) || (!isNaN(minP) && !isNaN(maxP) && minP > maxP)) {
      alert("Min Atk is greater than Max Atk — that's almost always a typo (check for an extra digit). Calibration not saved.");
      return;
    }
    const allGear = getActiveGear();
    const equipped = allGear.filter(it => isItemEquipped(it, allGear));
    const gearSum = sumGearSubs(equipped);
    const override: Partial<PanelStats> = {};
    CALIB_FIELDS.forEach(f => {
      const v = parseFloat(calibInputs[f.key as string]);
      if (!isNaN(v)) (override[f.key] as number) = v - (gearSum[f.key] || 0);
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
  }, [panel, bowSelect, food, script50, activeTier, iwStats, autoGearPanel, activeScheme?.gear]);

  // 3. Baseline = authoritative "fully graduated" T91/Lv95 DPS per build (from the
  //    源 spreadsheet, converted to rotation-window total). See calcBaseline / T91_GRAD_DPS.
  const baselineScore = useMemo(() => {
    return calcBaseline(activeTier, selectedBuild);
  }, [activeTier, selectedBuild]);

  // 4. Compute Rotation list damage
  const rotationStats = useMemo(() => {
    let totalDmg = 0;
    const items = getRotationForBuild(selectedBuild).map((item) => {
      const { perHit, total } = calcSkill(item, adjustedPanel, activeTier, {
        set: adjustedPanel.set,
        datang,
        yishui,
        buildKey: selectedBuild,
        weaponStars: (adjustedPanel as any).weaponStars,
      } as any);
      totalDmg += total;
      return {
        ...item,
        perHit,
        total,
      };
    });

    const dps = totalDmg / getRotationTimeForBuild(selectedBuild);
    const gradRate = (totalDmg / baselineScore) * 100;

    return {
      items,
      totalDmg,
      dps,
      gradRate,
    };
  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore]);

  // ── Best Build search ──────────────────────────────────────────────────────
  // Scans the whole gear pool (all items, equipped or not) for this scheme,
  // groups by slot, and finds the gear combination with the highest graduation
  // rate. Mirrors the live grad-rate pipeline so its numbers match the panel.
  const gradRateForGearCombo = (combo: GearItem[]): number => {
    // 1. base character-menu panel from this gear combo
    let p = computeGearPanel(panel, combo, activeScheme?.baseOverride, innerAttrName(selectedBuild));
    // 2. apply the same in-combat buffs as `adjustedPanel`
    if (food) { p.minOuter += activeTier.foodMin; p.maxOuter += activeTier.foodMax; }
    if (bowSelect === "crit") p.crit += 3.7; else if (bowSelect === "prec") p.prec += 3.3; else if (bowSelect === "aff") p.aff += 1.8;
    if (script50) p.dcrit += 15.0;
    // active 4pc set from the combo
    const setCounts: Record<string, number> = {};
    combo.forEach(it => { if (it.set && it.set !== "none") setCounts[it.set] = (setCounts[it.set] || 0) + 1; });
    let active4pc = "none";
    Object.entries(setCounts).forEach(([k, c]) => { if (c >= 4) active4pc = k; });
    p.set = active4pc;
    (p as any).weaponStars = (setCounts["stars"] || 0) >= 4 || active4pc === "stars";
    // inner ways on top
    p.outerPen += iwStats.outerPen; p.pzPen += iwStats.pzPen; p.crit += iwStats.crit; p.aff += iwStats.aff;
    p.dcrit += iwStats.dcrit; p.critDmg += iwStats.critDmg; p.affDmg += iwStats.affDmg;
    p.outerDmg += iwStats.outerDmg; p.pzDmg += iwStats.pzDmg; p.iwGeneralDmg = iwStats.generalDmg;
    // 3. rotation → grad rate
    let totalDmg = 0;
    getRotationForBuild(selectedBuild).forEach(item => {
      const { total } = calcSkill(item, p, activeTier, { set: p.set, datang, yishui, buildKey: selectedBuild, weaponStars: (p as any).weaponStars } as any);
      totalDmg += total;
    });
    let rate = (totalDmg / baselineScore) * 100;
    // ponytail: crit above the effective cap (80% × judgmentFactor) adds zero
    // DPS, so calcSkill scores two combos identically whether one wastes 10%
    // crit or not. Subtract a tiny penalty per overcap point so the search
    // breaks those ties toward the combo that wastes less — letting you re-roll
    // the dead crit into pen/crit-DMG. Penalty is ~0.001%/pt: it only ever
    // decides between otherwise-equal builds, never overrides a real DPS gain.
    const critCap = 80 * judgmentFactor;
    const overCrit = Math.max(0, p.crit - critCap);
    rate -= overCrit * 0.001;
    return rate;
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

    const gradFor = (p: PanelStats) => {
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
      return (total / baselineScore) * 100;
    };

    const baseGrad = rotationStats.gradRate;

    const rows = STAT_ROLLS.map(({ key, label, roll, unit }) => {
      const cur = adjustedPanel[key] as number;
      const pUp = { ...adjustedPanel, [key]: cur + roll };
      const gain = gradFor(pUp) - baseGrad;

      const pDown = { ...adjustedPanel, [key]: Math.max(0, cur - roll) };
      const loss = gradFor(pDown) - baseGrad; // negative or ~zero

      return { key, label, roll, unit, gain, loss };
    });

    return {
      base: baseGrad,
      gains: [...rows].sort((a, b) => b.gain - a.gain),
      losses: [...rows].sort((a, b) => a.loss - b.loss),
    };
  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore, rotationStats.gradRate]);

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


  const statPriorities = useMemo(() => {
    const baseDmg = rotationStats.totalDmg;
    if (baseDmg <= 0) return [];

    // Define increments for testing marginal gains
    const increments = [
      { key: "maxOuter", label: "Physical Atk (Phys Atk)", value: 10, bonusLabel: "+10 Atk", color: "from-[#e6c200] to-[#ffd700]" },
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
    <div className="min-h-screen bg-[#1a1a1d] text-[#e0e0e0] font-sans antialiased selection:bg-[#ffd700]/25 selection:text-[#ffd700]">
      {/* Accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#e6c200] via-[#ffd700] to-[#e6c200]" />

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
                    Type the numbers from your in-game <b>Combat Attributes</b> screen (current gear + inner ways equipped). The app subtracts your equipped gear's sub-stats to learn this character's true base, so the panel matches the game. Re-calibrate if you change gear a lot.
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

          <div className="panel-checkbox-container">
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
                  {gradModalActiveTab === "manual" && (
                    <div className="space-y-6" style={{ textAlign: 'left' }}>
                      {/* How to use */}
                      <div className="bg-[#1e1a12] border border-[#ffd700]/30 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-[#ffd700] mb-2 flex items-center gap-2">📖 How to use</h3>
                        <ol className="text-[12.5px] text-slate-300 leading-relaxed list-decimal pl-5 space-y-1">
                          <li><b>Enter panel</b>: Open <b>Combat Attributes</b> in-game (the <b>C</b> key) and type the stats below. Or the panel auto-computes from the gear you entered on the main screen.</li>
                          <li><b>Read results</b>: The top bar shows <b>Graduation Rate</b> (% vs the BiS T91 build) and <b>DPS Expectation</b>.</li>
                          <li><b>Pick build & bow/set</b>: In the <b>Panel Simulator</b> (right of the main screen) choose the right path, bow attribute, and gear set.</li>
                        </ol>
                        <div className="text-[12px] text-slate-400 mt-3 pt-2 border-t border-[#3d3d45]/60 leading-relaxed">
                          <b className="text-[#ffd700]/90">What the other tabs do:</b>
                          <ul className="list-disc pl-5 mt-1 space-y-0.5">
                            <li><b>Stat Priority</b> — which stats to add/drop to graduate fastest.</li>
                            <li><b>Cultivate</b> — substat (条) summary, which tuned (✦) lines to upgrade, and the next 8 substats worth investing in.</li>
                            <li><b>Compare</b> — compare each gear piece to see which raises graduation the most.</li>
                            <li><b>Transmute Advice</b> — per-slot transmute (转律) suggestions: the optimal main + sub substat config to raise graduation.</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-4 space-y-2">
                        <p className="text-[11.5px] text-slate-400 leading-snug">
                          Panel stats are <b className="text-[#ffd700]">auto-computed from equipped gear</b>. Equip/unequip items to see stats change. Inner Ways are added on top automatically.
                        </p>
                      </div>

                      <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-4 space-y-3">
                        <span className="text-[12px] font-mono font-bold tracking-widest text-[#a19683] uppercase">Dungeon Target</span>
                        <select
                          value={tierKey}
                          onChange={(e) => setTierKey(e.target.value)}
                          className="bg-[#2d2d35] font-mono text-sm text-[#ffd700] rounded px-2.5 py-1"
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
                                <h3 className="text-sm font-semibold text-[#ffd700] uppercase tracking-widest mb-1 border-b border-[#3d3d45] pb-1">{grp.title}</h3>
                                {grp.note && <p className="text-[10.5px] text-slate-500 mb-2 leading-snug">{grp.note}</p>}
                                <div className="space-y-2 mt-2">
                                  {grp.fields.map((st) => (
                                    <div key={st.key} className="flex justify-between items-center bg-[#1a1a1d]/70 p-2 rounded border border-[#3d3d45] text-sm">
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
            <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-6 shadow-lg">
              <div className="border-b border-[#ffd700]/25 pb-4 mb-5">
                <h2 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                  <TrendingUp className="text-[#ffd700] w-5 h-5" /> Stat Priority — Graduation Impact
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Live ranking for <strong className="text-[#ffd700]">{(BUILD_PROFILES as any)[selectedBuild]?.label || "your build"}</strong>, computed from your current panel ({rotationStats.gradRate.toFixed(1)}% graduation). Each row simulates adding/removing <strong>one typical substat roll</strong> on a single sub-stat and shows the resulting change in graduation %.
                </p>
              </div>

              {/* Two-column gain/loss ranking */}
              <div className="bg-[#1a1a1d]/60 rounded-xl p-3 border border-[#3d3d45] text-sm text-[#ffd700]/95 flex items-center gap-2 mb-4">
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
            <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-6 shadow-lg">
              <h3 className="text-sm uppercase tracking-widest font-extrabold text-[#ffd700] font-serif border-b border-[#3d3d45] pb-2 mb-4">
                General Theorycrafting Guide · T91 Global (http://spongem.com/yysls/)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-300 leading-relaxed">
                <div className="space-y-3">
                  <p>
                    <strong className="text-[#ffd700]">1. Physical Penetration (Phys Pen)</strong>: The most crucial core attribute until reaching the optimal cap in dungeon content (e.g., 51.2% for T91). Every point of Phys Pen below this threshold provides massive exponential damage amplification.
                  </p>
                  <p>
                    <strong className="text-[#ffd700]">2. Critical Rate Cap (80%)</strong>: The absolute maximum Critical Rate in Where Winds Meet is capped at <strong className="text-orange-400">80%</strong>. If your combined character attributes and passive/active buffs push your Crit beyond 80%, the surplus is ignored. Aim for roughly 73% unbuffed so that party buffs safely top you off at the optimal 80% maximum.
                  </p>
                  <p>
                    <strong className="text-[#ffd700]">3. Critical Damage (Crit DMG %)</strong>: Crit DMG works in direct synergy with Crit Rate. Once your critical chance is secure, augmenting critical multipliers scales your total active DPS and Everspring Umbrella execution chain jumps exponentially.
                  </p>
                </div>
                <div className="space-y-3">
                  <p>
                    <strong className="text-[#ffd700]">4. Affinity Rate (Cap 40%) & Bamboocut</strong>: Bamboocut Dust damage scales heavily with your overall break stats. Although Affinity is restricted to an absolute <strong className="text-orange-400">40%</strong> maximum cap in-game, adding Affinity attributes on Tier 91 gears (up to 4.5% per item) remains a powerful build option to convert graze hits into full-powered breaking attacks.
                  </p>
                  <p>
                    <strong className="text-[#ffd700]">5. Substat Relaying (Inherit mechanics)</strong>: When refining Level 91 gear, always prioritize relaying/inheriting attributes that have reached diamond/gold thresholds (such as Phys Pen 9.0%, Max Atk 63.8, Crit 7.4%, etc.). A carefully put-together set can singlehandedly contribute over 40% of your graduation progression.
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
            <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-6 shadow-lg">
              <div className="border-b border-[#ffd700]/25 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                    className="bg-[#1a1a1d] border border-[#3d3d45]/30 hover:border-[#ffd700]/50 text-[#ffd700] text-sm rounded-lg px-3 py-1.5 focus:outline-none font-bold transition-all cursor-pointer"
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
                  else if (progressPct >= 40) { bgCardClass = "bg-[#1e1a12]/40 border-[#3d3d45]/30 text-[#ffd700]"; progressFillColor = "bg-[#ffd700]"; }
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
                      <div className="bg-[#181512] border border-[#3d3d45] rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-sm font-mono uppercase tracking-wider text-slate-500">
                          Total sub-stat progress
                        </span>
                        <div className="text-3xl font-extrabold text-[#ffd700] font-serif mt-1 flex items-baseline gap-1.5">
                          <span>{totalProgressVal.toFixed(1)}</span>
                          <span className="text-base font-sans font-normal text-slate-500">/ {totalTargetCount} 条</span>
                        </div>
                      </div>
                      <div className="bg-[#181512] border border-[#3d3d45] rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-sm font-mono uppercase tracking-wider text-slate-500">
                          Dingyin (Tuned) stats
                        </span>
                        <div className="text-3xl font-extrabold text-[#ffd700] font-serif mt-1">
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
                              <div className="w-full bg-[#1a1a1d]/70 rounded-full h-2.5 overflow-hidden border border-[#3d3d45]">
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
                    <div className="bg-[#2d2d35]/30 border border-[#3d3d45]/40 rounded-xl p-4 text-sm text-slate-500 leading-relaxed font-mono">
                      Counts are in 条 (substat units): current = your gear's summed value ÷ the 95下 max roll; target = the verified 95下 (Global T91) graduated substat count for this path. Penetration is tuned/attuned (定音) — tracked separately.
                    </div>

                    {/* ── STEP 2: 定音词条总结 (Tuned Substat Summary) ── */}
                    <div className="bg-[#181512] border border-[#3d3d45] rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4 border-b border-[#3d3d45]/50 pb-3">
                        <h3 className="text-base font-bold font-serif text-slate-100">
                          🎵 Tuned (定音) Substat Summary
                        </h3>
                        <div className="text-right">
                          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">% of max</span>
                          <span className="text-xl font-extrabold text-[#ffd700] font-mono">{dingyinFillPct.toFixed(1)}%</span>
                        </div>
                      </div>
                      {dingyinRows.length === 0 ? (
                        <p className="text-sm text-slate-500 font-mono">No tuned (定音) substats on equipped gear yet. Mark a substat as ✦ Tuned to track its upgrade potential.</p>
                      ) : (
                        <>
                          <p className="text-[12px] text-slate-500 mb-3 font-mono">Tuned lines ranked by graduation-% gained if upgraded to the 95下 cap:</p>
                          <div className="flex flex-col gap-2">
                            {dingyinRows.map((row, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-white/[0.03] rounded-lg border-l-[3px] border-[#ffd700]">
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
            <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-6">
              <div className="mb-4 border-b border-[#3d3d45] pb-3">
                <h2 className="text-base font-extrabold text-[#ffd700] uppercase tracking-wider font-serif flex items-center gap-2">
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
                  Graduation ranking for slot: <span className="text-[#ffd700] font-serif">{getSlotLabel(selectedSlot)}</span>
                </h3>

                {(() => {
                  const slotItems = getActiveGear().filter(it => it.slot === selectedSlot);
                  if (slotItems.length === 0) {
                    return (
                      <div className="bg-[#1a1a1d]/40 border border-dashed border-[#3d3d45] p-8 rounded-lg text-center font-mono">
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
                        const qualityClass = item.quality === "gold" ? "border-[#3d3d45] bg-[#1b1510]/80" : item.quality === "purple" ? "border-purple-500/20 bg-[#16121c]/80" : "border-sky-500/20 bg-[#11141a]/80";
                        
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border relative transition-all ${qualityClass}`}
                          >
                            <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-[#1a1a1d] border border-slate-700 flex items-center justify-center font-bold text-sm text-[#ffd700] font-serif shadow-inner">
                              #{rank}
                            </div>

                            <div className="pl-10">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3d3d45]/40 pb-2 mb-3">
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
                                  <div className="text-sm font-mono font-extrabold text-[#ffd700]">
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
                                    className="text-[11px] px-2 py-1 rounded bg-[#ffd700] hover:bg-[#ffed4e] text-slate-950 font-bold font-mono uppercase tracking-wide transition-colors"
                                  >
                                    ⚔ Equip
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {entry.subs.map((sub, sidx) => {
                                  const subDeltaString = sub.delta > 0 ? `+${sub.delta.toFixed(2)}` : "0.00";
                                  
                                  return (
                                    <div key={sidx} className="bg-[#1a1a1d]/70 p-2 rounded border border-[#3d3d45] flex items-center justify-between font-mono text-[12px]">
                                      <div className="truncate text-slate-500 flex items-center gap-1 shrink md:shrink-0 pr-1">
                                        <span>{sub.type}</span>
                                        {sub.isTuned && <span className="text-[#ffd700] text-[11px]">✦</span>}
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
                            <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-6">
                              <div className="mb-4 border-b border-[#3d3d45] pb-3">
                                <h2 className="text-base font-extrabold text-[#ffd700] uppercase tracking-wider font-serif flex items-center gap-2">
                                  🔄 Transmutation Advice
                                </h2>
                                <p className="text-[12px] text-slate-500 mt-0.5">
                                  Pick a slot from the left panel, select a substat to re-roll, and see which replacement yields the best graduation improvement at T91 max rolls.
                                </p>
                              </div>

                              {/* Equipped item display — slot selected via left panel */}
                              {!equipped ? (
                                <div className="bg-[#1a1a1d]/40 border border-dashed border-[#3d3d45] p-8 rounded-lg text-center font-mono">
                                  <p className="text-slate-500 text-sm">No items in this slot. Add gear via the 🛡 Gear tab.</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Current item card */}
                                  <div className="bg-[#1a1a1d]/60 border border-[#3d3d45] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3 border-b border-[#3d3d45]/40 pb-2">
                                      <h3 className="text-sm font-bold text-slate-100">{equipped.name}</h3>
                                      <span className="text-sm font-mono font-extrabold text-[#ffd700]">+{currentTotal.toFixed(2)}% graduation</span>
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
                                                ? "bg-[#ffd700]/15 border-[#ffd700] ring-1 ring-[#ffd700]/50"
                                                : "bg-[#1a1a1d]/70 border-[#3d3d45] hover:border-slate-600"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="truncate text-slate-400 flex items-center gap-1 pr-1">
                                                <span>{sub.type}</span>
                                                {sub.isTuned && <span className="text-[#ffd700] text-[11px]">✦</span>}
                                              </div>
                                              <div className="text-right shrink-0">
                                                <div className="text-slate-300 font-semibold">{sub.val}</div>
                                                <div className={`text-[11px] font-bold mt-0.5 ${sub.delta > 0 ? "text-emerald-400" : "text-slate-600"}`}>
                                                  +{sub.delta.toFixed(2)}% grad
                                                </div>
                                              </div>
                                            </div>
                                            {isSubSelected && (
                                              <div className="mt-1.5 pt-1.5 border-t border-[#ffd700]/30 text-[10px] text-[#ffd700] font-bold uppercase tracking-wider">
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
                                    <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-4 space-y-4">
                                      <div className="border-b border-[#3d3d45] pb-3">
                                        <h3 className="text-[12px] font-mono font-bold tracking-widest text-[#ffd700] uppercase">
                                          Transmutation Results
                                        </h3>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          Re-rolling <span className="text-slate-300 font-semibold">{equipped.subs[transmuteSubIndex].type}</span> ({equipped.subs[transmuteSubIndex].val}) — showing max T91 roll for each candidate replacement.
                                        </p>
                                      </div>

                                      {/* Verdict banner */}
                                      {verdict && (
                                        <div className={`bg-[#1a1a1d]/80 border border-[#3d3d45] rounded-lg p-3 text-center ${verdictColor}`}>
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
                                          const bgClass = ridx === 0 && r.delta > 0.1 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#1a1a1d]/60 border-[#3d3d45]";
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
                      <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-6">
                        <div className="mb-4 border-b border-[#3d3d45] pb-3">
                          <h2 className="text-base font-extrabold text-[#ffd700] uppercase tracking-wider font-serif flex items-center gap-2">🏆 Best Build</h2>
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
                          return (
                            <div className="space-y-4">
                              <div className="bg-[#1a1a1d]/60 border border-[#3d3d45] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3 border-b border-[#3d3d45]/40 pb-2">
                                  <h3 className="text-sm font-bold text-slate-100">Best combination</h3>
                                  <span className="text-sm font-mono font-extrabold text-[#ffd700]">{best.rate.toFixed(2)}% graduation</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {best.gear.map((g, i) => (
                                    <div key={i} className="bg-[#15161a] border border-[#3d3d45] rounded p-2">
                                      <div className="text-[10px] text-[#ffd700] uppercase tracking-wide">{slotLabels[g.slot] || g.slot}</div>
                                      <div className="text-[11.5px] text-slate-200 truncate" title={g.name}>{g.name}</div>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => {
                                    const pool = getActiveGear();
                                    const bestIds = new Set(best.gear.map(g => g.id));
                                    saveActiveGear(pool.map(it => ({ ...it, isEquipped: bestIds.has(it.id) })));
                                  }}
                                  className="primary-btn"
                                  style={{ marginTop: 12 }}
                                >Equip this build</button>
                              </div>
                              {bestBuildResult.length > 1 && (
                                <div>
                                  <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-2">Top alternatives</h4>
                                  <div className="space-y-1">
                                    {bestBuildResult.slice(1, 6).map((r, idx) => (
                                      <div key={idx} className="flex items-center justify-between bg-[#1a1a1d]/40 border border-[#3d3d45] rounded px-3 py-1.5 text-[11.5px]">
                                        <span className="text-slate-400">#{idx + 2}</span>
                                        <span className="text-slate-300 truncate flex-1 px-2" title={r.gear.map(g => g.name).join(", ")}>{r.gear.map(g => g.name).join(" · ")}</span>
                                        <span className="font-mono font-bold text-[#ffd700]">{r.rate.toFixed(2)}%</span>
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
                      const autoName = `${slotLabel} ${existingCount + 1}`;
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
                        {sidx === 5 && <div style={{ fontSize: 11, fontWeight: 700, color: '#ffd700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>Tuned Substat · 定音 (tick ✦ on the tuned line)</div>}
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
                            className="accent-[#ffd700] h-3.5 w-3.5"
                          />
                          <span className="text-[#ffd700] font-bold text-[10px] uppercase font-mono">Tuned ✦</span>
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
