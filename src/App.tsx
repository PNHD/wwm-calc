import React, { useState, useEffect, useMemo } from "react";
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
import StatSwapSimulator from "./components/StatSwapSimulator";

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
  "Fire-Fist-Healer": ["Panacea Fan", "Soulshade Umbrella"],
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
  { pct: 90, label: "S", color: "bg-amber-500" },
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

const INITIAL_PANEL: PanelStats = {
  minOuter: 1507,
  maxOuter: 2278,
  outerPen: 36.4,
  minPz: 377,
  maxPz: 688,
  pzPen: 18.0,
  pzDmg: 9.0,
  prec: 116.9,
  crit: 116.9,
  aff: 14.7,
  dcrit: 4.6,
  daff: 0,
  critDmg: 54,
  affDmg: 35,
  outerDmg: 2.8,
  bossDmg: 0,
  umbBonus: 5.1,
  ropeBonus: 0,
  swordBonus: 0,
  spearBonus: 0,
  fanBonus: 0,
  twinbladesBonus: 0,
  modaoBonus: 0,
  hengdaoBonus: 0,
  gauntletsBonus: 0,
  allArts: 0,
  attunedBonus: 0,
  wuxiangMin: 0,
  wuxiangMax: 0,
  set: "stars",
};

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
  main: string;
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
  { name: "Pendant",   icon: <Gem       className="w-4 h-4" />, label: "◇" },
  { name: "Helmet",    icon: <HardHat   className="w-4 h-4" />, label: "▲" },
  { name: "Chest",     icon: <Shirt     className="w-4 h-4" />, label: "▣" },
  { name: "Greaves",   icon: <Target    className="w-4 h-4" />, label: "◎" },
  { name: "Bracers",   icon: <Hand      className="w-4 h-4" />, label: "✋" },
  { name: "Bow/Ring",  icon: <Target    className="w-4 h-4" />, label: "◯" },
];

const SLOT_IMAGES: Record<string, string> = {
  "Umbrella":  "icon/icon1_3.jpg",
  "Rope Dart": "icon/icon1_5.jpg",
  "Helmet":    "icon/icon5.jpg",
  "Chest":     "icon/icon6.jpg",
  "Bracers":   "icon/icon8.jpg",
  "Greaves":   "icon/icon7.jpg",
  "Pendant":   "icon/icon4.jpg",
  "Bow/Ring":  "icon/icon3.jpg"
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
  "stars":         "from-amber-500 to-yellow-700",      // Moonflare
  "eaglerise":     "from-sky-500 to-blue-700",          // Hawking
  "stormrain":     "from-teal-400 to-cyan-700",         // Eaglerise
  "jadeware":      "from-emerald-400 to-green-700",     // Jadeware
  "ivorybloom":    "from-pink-400 to-rose-700",         // Ivorybloom
  "rainwhisper":   "from-indigo-400 to-blue-800",       // Rainwhisper
  "pursuing":      "from-purple-400 to-violet-700",     // Pursuing Shadow
  "plume":         "from-cyan-400 to-blue-600",          // Plume
  "string":        "from-indigo-500 to-purple-800",     // Startling String
  "shakenhill":    "from-stone-400 to-stone-700",
  "swallowreturn": "from-orange-400 to-orange-700",
  "ironweave":     "from-slate-400 to-slate-700",
  "none":          "from-slate-600 to-slate-800",
};

const DEFAULT_GEAR: GearItem[] = [
  { id:"g1", slot:"Umbrella", name:"Swiftwing Cloud Umbrella", quality:"gold", main:"Phys Atk 48~112", set:"stars",
    subs:[{type:"Max Phys Atk",val:"59.2"},{type:"Max Phys Atk",val:"63.8"},{type:"Umbrella Bonus",val:"5.1%"},{type:"Min Phys Atk",val:"62.9"},{type:"Crit Rate",val:"7.4%"},{type:"Phys Pen",val:"7.4"}]},
  { id:"g2", slot:"Rope Dart", name:"Swiftwing Charm", quality:"gold", main:"Min Phys Atk 71", set:"stars",
    subs:[{type:"Min Phys Atk",val:"56.2"},{type:"Max Phys Atk",val:"59.9"},{type:"Min Phys Atk",val:"61.7"},{type:"Max Bamboocut Atk",val:"35.0"},{type:"Crit Rate",val:"7.4%"},{type:"Phys Pen",val:"6.4"}]},
  { id:"g3", slot:"Pendant", name:"Swiftwing Pendant", quality:"gold", main:"Max Phys Atk 106", set:"stars",
    subs:[{type:"Max Phys Atk",val:"49.9"},{type:"Max Phys Atk",val:"58.3"},{type:"Min Phys Atk",val:"63.8",isTuned:true},{type:"Crit Rate",val:"6.8%"},{type:"Phys Pen",val:"8.6"}]},
  { id:"g4", slot:"Helmet", name:"Nightfarer Crown", quality:"gold", main:"HP 4614 / DEF 18", set:"eaglerise",
    subs:[{type:"Crit Rate",val:"7.0%"},{type:"Crit Rate",val:"7.1%"},{type:"Min Phys Atk",val:"63.8",isTuned:true},{type:"Max Bamboocut Atk",val:"33.4"},{type:"Max Phys Atk",val:"62.7"},{type:"Umbrella Bonus",val:"4.8%"}]},
  { id:"g5", slot:"Chest", name:"Nightfarer Armor", quality:"gold", main:"HP 9227 / DEF 18", set:"eaglerise",
    subs:[{type:"Precision",val:"6.3%"},{type:"Max Bamboocut Atk",val:"34.8"},{type:"Min Bamboocut Atk",val:"35.4"},{type:"Crit Rate",val:"7.4%",isTuned:true},{type:"Max Phys Atk",val:"59.7"},{type:"Umbrella Bonus",val:"4.8%"}]},
  { id:"g6", slot:"Greaves", name:"Nightfarer Night Leg Armor", quality:"purple", main:"HP 4153 / DEF 32", set:"eaglerise",
    subs:[{type:"Crit Rate",val:"6.8%"},{type:"Max Phys Atk",val:"63.8",isTuned:true},{type:"Precision",val:"6.6%"},{type:"Crit Rate",val:"6.9%"},{type:"Min Bamboocut Atk",val:"33.7"},{type:"Umbrella Bonus",val:"4.5%"}]},
  { id:"g7", slot:"Bracers", name:"Nightfarer Bracers", quality:"purple", main:"HP 4614 / DEF 18", set:"eaglerise",
    subs:[{type:"Crit Rate",val:"7.2%"},{type:"Max Bamboocut Atk",val:"36.2"},{type:"Min Phys Atk",val:"63.8",isTuned:true},{type:"Crit Rate",val:"7.3%"},{type:"Max Phys Atk",val:"59.8"},{type:"Umbrella Bonus",val:"5.0%"}]},
  { id:"g8", slot:"Bow/Ring", name:"Eastgaze Bow: Divine + Eastgaze Ring", quality:"gold", main:"Pursuing Shadow Set 2/2",
    set:"pursuing", subs:[{type:"Affinity Rate",val:"1.8% (set)"},{type:"All Weapon",val:"12.5%"},{type:"Crit Rate",val:"6.8%"}]},
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
  "Attr Pen": "pzPen",
  "Bamboocut DMG%": "pzDmg",
  "Umbrella Bonus": "umbBonus",
  "Rope Dart Bonus": "ropeBonus",
  "Sword Bonus": "swordBonus",
  "Spear Bonus": "spearBonus",
  "Fan Bonus": "fanBonus",
  "Twinblades Bonus": "twinbladesBonus",
  "Modao Bonus": "modaoBonus",
  "Hengdao Bonus": "hengdaoBonus",
  "Gauntlets Bonus": "gauntletsBonus",
  "All Weapon": "allArts",
  "Phys DMG%": "outerDmg",
  "Boss DMG%": "bossDmg",
};

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
const computeGearPanel = (current: PanelStats, gear: GearItem[]): PanelStats => {
  const gearSum = sumGearSubs(gear);
  const next = { ...current };
  (Object.values(SUB_MAP) as (keyof PanelStats)[]).forEach(key => {
    (next[key] as number) = (BASE_PANEL_NO_GEAR[key] as number) + (gearSum[key] || 0);
  });
  return next;
};
// ---------------------------------------------------------------------------

const BUILD_PROFILES = {
  "bamboocut-dust": {
    label: "Bamboocut-Dust", weapons: "Everspring Umbrella + Unfettered Rope Dart",
    tier: "T0 AoE", color: "text-amber-500",
    gradTargets: { maxOuter: 4046, minOuter: 1657, outerPen: 51.2, crit: 116.9, aff: 14.7, critDmg: 54 },
    notes: "Priority: Max Phys ATK → Phys Pen → Bamboocut ATK. Prec ~116% (effectively capped). Crit ~116%+ panel to cap at 80% eff.",
    priorityStats: ["maxOuter","outerPen","crit","critDmg","maxPz","umbBonus"],
  },
  "bellstrike-umbra": {
    label: "Bellstrike-Umbra", weapons: "Strategic Sword + Heavenquaker Spear",
    tier: "T0 Single", color: "text-indigo-400",
    gradTargets: { maxOuter: 4231, minOuter: 1800, outerPen: 45.0, crit: 95.4, aff: 71.6, critDmg: 60 },
    notes: "Priority: Affinity Rate → Max Phys ATK → Crit DMG. Aff cap = 40% eff (need ~58% panel at T91).",
    priorityStats: ["aff","affDmg","maxOuter","crit","outerPen"],
  },
  "bellstrike-splendor": {
    label: "Bellstrike-Splendor", weapons: "Nameless Sword + Nameless Spear",
    tier: "T1 Easy", color: "text-blue-400",
    gradTargets: { maxOuter: 3800, minOuter: 1500, outerPen: 40.0, crit: 54.4, aff: 43.5, critDmg: 45 },
    notes: "Priority: Max Phys ATK → Crit Rate → Affinity Rate. Forgiving build for beginners.",
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
    gradTargets: { maxOuter: 3500, minOuter: 1400, outerPen: 38.0, crit: 81.2, aff: 21.75, critDmg: 45 },
    notes: "Priority: Max Phys ATK → Crit Rate → Phys Pen. Avoid Attr ATK stats (useless for this path).",
    priorityStats: ["maxOuter","crit","outerPen","critDmg","allArts"],
  },
  "silkbind-jade": {
    label: "Silkbind-Jade", weapons: "Vernal Umbrella + Inkwell Fan",
    tier: "T1 Ranged", color: "text-teal-400",
    gradTargets: { maxOuter: 4007, minOuter: 1700, outerPen: 44.0, crit: 107.6, aff: 43.5, critDmg: 50 },
    notes: "Priority: Max Phys ATK → Bamboocut ATK → Crit Rate → Affinity Rate.",
    priorityStats: ["maxOuter","crit","aff","affDmg","outerPen","umbBonus"],
  },
  "silkbind-deluge": {
    label: "Silkbind-Deluge (Healer)", weapons: "Panacea Fan + Soulshade Umbrella",
    tier: "T1 Healer", color: "text-emerald-400",
    gradTargets: { maxOuter: 2800, minOuter: 1200, outerPen: 30.0, crit: 43.5, aff: 29.0, critDmg: 40 },
    notes: "Focus on healing power > personal DPS. Do NOT chase Bamboocut ATK or high pen.",
    priorityStats: ["maxOuter","crit","aff","outerPen","allArts"],
  },
  "bamboocut-kite": {
    label: "Bamboocut-Kite", weapons: "Heavenstrike Gauntlets + Unfettered Rope Dart",
    tier: "T0 AoE", color: "text-amber-600",
    gradTargets: { maxOuter: 3800, minOuter: 1500, outerPen: 45.0, crit: 116.9, aff: 14.7, critDmg: 54 },
    notes: "Priority: Max Phys ATK → Bamboocut ATK → Phys Pen. Gauntlets + Rope Dart.",
    priorityStats: ["maxOuter","outerPen","crit","critDmg","maxPz","ropeBonus"],
  },
  "stonesplit-awe": {
    label: "Stonesplit-Awe", weapons: "Thundercry Blade + Stormbreaker Spear",
    tier: "T0 Tank", color: "text-red-500",
    gradTargets: { maxOuter: 3900, minOuter: 1600, outerPen: 42.0, crit: 90.0, aff: 30.0, critDmg: 50 },
    notes: "Priority: Max Phys ATK → Crit Rate → Phys Pen. Modao + Spear.",
    priorityStats: ["maxOuter","crit","outerPen","critDmg","allArts"],
  },
  "stonesplit-pure-datang": {
    label: "Stonesplit-Pure Datang", weapons: "Thundercry Blade + Snowparting Blade",
    tier: "T0 Single", color: "text-rose-600",
    gradTargets: { maxOuter: 4200, minOuter: 1800, outerPen: 50.0, crit: 100.0, aff: 20.0, critDmg: 55 },
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

const getSetOptionsForSlot = (slot: string) => {
  if (slot === "Umbrella" || slot === "Rope Dart" || slot === "Pendant") {
    return [
      { key: "none", name: "No Set / Mixed" }
    ];
  }
  if (slot === "Bow/Ring") {
    return [
      { key: "none", name: "No Set / Mixed" },
      { key: "pursuing", name: "Pursuing Shadow" },
      { key: "plume", name: "Plume" },
      { key: "string", name: "Startling String" }
    ];
  }
  return Object.entries(ARMOR_SETS).map(([key, s]) => ({
    key,
    name: s.name
  }));
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
    stat2pc: { aff: 6.1 },               // (~) estimate
    desc2pc: "2/4: +6.1% Affinity Rate",
    desc4pc: "4/4: Affinity DMG triggers give a stack: +2% Phys ATK/stack (5s, max 5 = +10% Phys ATK)",
    recommended: ["bamboocut-wind", "stonesplit-might", "bellstrike-umbra"],
  },
  "jadeware": {
    name: "Jadeware",
    stat2pc: { maxOuter: 64 },           // (~) estimate
    desc2pc: "2/4: Max Physical ATK +64",
    desc4pc: "4/4: Martial Art Skill → Jadeware buff: each Affinity hit further increases Affinity DMG.",
    recommended: ["bellstrike-umbra", "bellstrike-splendor"],
  },
  "ivorybloom": {
    name: "Ivorybloom",
    stat2pc: { crit: 7.3 },              // (~) estimate
    desc2pc: "2/4: +7.3% Critical Rate",
    desc4pc: "4/4: At Max HP: +5% Crit Chance and +15% Critical DMG/Heal.",
    recommended: ["silkbind-deluge", "silkbind-jade"],
  },
  "shakenhill": {
    name: "Shattered Ridge",
    stat2pc: { prec: 6.1 },              // (~) estimate
    desc2pc: "2/4: +6.1% Precision Rate",
    desc4pc: "4/4: Perfect Deflect boosts next skill/heavy attack DMG significantly.",
    recommended: ["stonesplit-pure-datang"],
  },
  "swallowreturn": {
    name: "Swaying Heights",
    stat2pc: { minOuter: 64 },           // (~) estimate
    desc2pc: "2/4: Min Physical ATK +64",
    desc4pc: "4/4: DMG +10% vs targets above 50% HP.",
    recommended: ["bamboocut-wind", "bamboocut-dust"],
  },
  "swiftgale": {
    name: "Swift Gale",
    stat2pc: { maxOuter: 64 },           // (~) estimate
    desc2pc: "2/4: Max Physical ATK +64",
    desc4pc: "4/4: Airborne Heavy Attacks gain +DMG and knock targets back.",
    recommended: [],
  },
  "swallowcall": {
    name: "Swallowcall",
    stat2pc: {},
    desc2pc: "2/4: (stat pending verification)",
    desc4pc: "4/4: Various effect — verify in-game.",
    recommended: [],
  },
  "mistwillow": {
    name: "Mistwillow",
    stat2pc: {},
    desc2pc: "2/4: (stat pending verification)",
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

  // Auto-compute panel stats (Min/Max Phys Atk, Pen, Crit, Aff, Bamboocut Atk, etc.)
  // from the 8 equipped gear pieces, instead of manual entry.
  const [autoGearPanel, setAutoGearPanel] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("wwm_auto_gear_panel");
    return stored === null ? true : stored === "1";
  });

  useEffect(() => {
    localStorage.setItem("wwm_auto_gear_panel", autoGearPanel ? "1" : "0");
  }, [autoGearPanel]);

  const [activeTab, setActiveTab ] = useState<"calculator" | "priority" | "gear" | "compare" | "simulators" | "ocr" | "profiles" | "rot-sim" | "cultivate">("calculator");

  // ── NEW STATES & HELPERS FOR REDESIGNED LAYOUT ──
  const [isGradModalOpen, setIsGradModalOpen] = useState<boolean>(false);
  const [gradModalActiveTab, setGradModalActiveTab] = useState<string>("manual");
  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState<boolean>(false);
  const [isBatchOcrModalOpen, setIsBatchOcrModalOpen] = useState<boolean>(false);
  const [isXinfaModalOpen, setIsXinfaModalOpen] = useState<boolean>(false);
  const [xinfaModalIndex, setXinfaModalIndex] = useState<number | null>(null);
  const [pvpMode, setPvpMode] = useState<boolean>(false);
  const [loanDingyin, setLoanDingyin] = useState<boolean>(false);

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
      <div className="border-b border-slate-800/50 pb-2 mb-2">
        <button
          onClick={() => setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          })}
          className="w-full flex items-center justify-between text-[11px] font-mono tracking-wider text-amber-500/80 uppercase mb-1"
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
            return parsed;
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

  const getActiveGear = (): GearItem[] => {
    return activeScheme?.gear ?? DEFAULT_GEAR;
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
  useEffect(() => {
    if (!autoGearPanel) return;
    const gear = getActiveGear();
    setPanel(prev => computeGearPanel(prev, gear));
  }, [autoGearPanel, activeScheme?.gear]);

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
    "Umbrella Bonus": 1,
    "Rope Dart Bonus": 1,
    "Sword Bonus": 1,
    "Spear Bonus": 1,
    "Fan Bonus": 1,
    "Twinblades Bonus": 1,
    "Modao Bonus": 1,
    "Hengdao Bonus": 1,
    "Gauntlets Bonus": 1,
    "All Weapon": 1,
    "Phys DMG%": 1,
    "Boss DMG%": 1,
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
  const [gearFilterSlot, setGearFilterSlot] = useState<string>("ALL");
  const [gearSortBy, setGearSortBy] = useState<"name" | "mastery">("name");
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formQuality, setFormQuality] = useState<"gold" | "purple" | "blue">("gold");
  const [formMain, setFormMain] = useState("");
  const [formSet, setFormSet] = useState("stars");
  const [formMastery, setFormMastery] = useState<string>("");
  const [formWeaponType, setFormWeaponType] = useState<string>("Sword");
  const [formSubs, setFormSubs] = useState<{type: string; val: string; isTuned?: boolean}[]>(
    Array(6).fill(null).map(() => ({ type: "Max Phys Atk", val: "", isTuned: false }))
  );

  const openAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormQuality("gold");
    setFormMain("");
    if (selectedSlot === "Umbrella" || selectedSlot === "Rope Dart" || selectedSlot === "Pendant") {
      setFormSet("none");
    } else if (selectedSlot === "Bow/Ring") {
      setFormSet("pursuing");
    } else {
      setFormSet("stars");
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
    setFormMain(item.main);
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
          const isWeapon = it.slot === "Umbrella" || it.slot === "Rope Dart";
          return {
            ...it,
            name: formName,
            quality: formQuality,
            main: formMain,
            set: formSet,
            mastery: masteryVal,
            subs: savedSubs,
            weaponType: isWeapon ? formWeaponType : undefined
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
        main: formMain,
        set: formSet,
        mastery: masteryVal,
        subs: savedSubs,
        weaponType: isWeapon ? formWeaponType : undefined
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
  const [earlySeason, setEarlySeason] = useState<boolean>(() => {
    const config = getCustomConfig();
    return config?.earlySeason ?? false;
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
      earlySeason,
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
          if (config.earlySeason !== undefined) setEarlySeason(config.earlySeason);
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
      setEarlySeason(false);
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
      setEarlySeason(false);
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
            umbBonus: 2.0,
            ropeBonus: 0,
            swordBonus: 0,
            spearBonus: 0,
            fanBonus: 0,
            twinbladesBonus: 0,
            modaoBonus: 0,
            hengdaoBonus: 0,
            gauntletsBonus: 0,
            allArts: 0,
            attunedBonus: 0,
            wuxiangMin: 0,
            wuxiangMax: 0,
            set: "none"
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
            dcrit: 4.6,
            daff: 0,
            critDmg: 50,
            affDmg: 30,
            outerDmg: 2.3,
            bossDmg: 4.0,
            umbBonus: 4.5,
            ropeBonus: 0,
            swordBonus: 0,
            spearBonus: 0,
            fanBonus: 0,
            twinbladesBonus: 0,
            modaoBonus: 0,
            hengdaoBonus: 0,
            gauntletsBonus: 0,
            allArts: 3.5,
            attunedBonus: 0,
            wuxiangMin: 0,
            wuxiangMax: 0,
            set: "stars"
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
            dcrit: 4.6,
            daff: 0,
            critDmg: 54,
            affDmg: 35,
            outerDmg: 2.8,
            bossDmg: 7.6,
            umbBonus: 7.4,
            ropeBonus: 0,
            swordBonus: 0,
            spearBonus: 0,
            fanBonus: 0,
            twinbladesBonus: 0,
            modaoBonus: 0,
            hengdaoBonus: 0,
            gauntletsBonus: 0,
            allArts: 7.2,
            attunedBonus: 0,
            wuxiangMin: 0,
            wuxiangMax: 0,
            set: "stars"
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
    };
    selectedInnerWays.forEach((id) => {
      const iw = INNER_WAYS.find((item) => item.id === id);
      if (iw) {
        const tierNum = innerWayTiers[id] ?? 5;
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
        }
      }
    });
    return bonus;
  }, [selectedInnerWays, innerWayTiers]);

  // 2. Compute Adjusted Panel Stats (applying passive buffs dynamically)
  const adjustedPanel = useMemo((): PanelStats => {
    let p = { ...panel };

    // Apply Bow stats
    if (bowSelect === "crit") p.crit += 7.0;
    if (bowSelect === "prec") p.prec += 6.1;
    if (bowSelect === "aff") p.aff += 3.5;

    // Apply food buff
    if (food) {
      p.minOuter += activeTier.foodMin;
      p.maxOuter += activeTier.foodMax;
    }

    // Apply Sub-50% HP passive buff
    if (script50) {
      p.dcrit += 15.0;
    }

    // Season early bonus
    if (earlySeason) {
      p.minOuter += 4.4;
      p.maxOuter += 27.2;
    }

    // Apply Inner Ways direct stat offsets
    p.outerPen += iwStats.outerPen;
    p.pzPen += iwStats.pzPen;
    p.critDmg += iwStats.critDmg;
    p.affDmg += iwStats.affDmg;
    p.outerDmg += iwStats.outerDmg;
    p.pzDmg += iwStats.pzDmg;
    p.crit += iwStats.crit;
    p.aff += iwStats.aff;
    p.dcrit += iwStats.dcrit;

    // Store raw innerway factors so they pass to formula
    p.iwGeneralDmg = iwStats.generalDmg;
    p.iwOuterPen = iwStats.outerPen;
    p.iwPzPen = iwStats.pzPen;
    p.iwPzDmg = iwStats.pzDmg;

    // Apply Armor Set 2pc flat/percentage stat bonuses
    const activeSet = ARMOR_SETS[p.set as keyof typeof ARMOR_SETS];
    if (activeSet && activeSet.stat2pc) {
      const s2 = (activeSet as any).stat2pc;
      if (s2.minOuter) p.minOuter += s2.minOuter;
      if (s2.maxOuter) p.maxOuter += s2.maxOuter;
      if (s2.prec) p.prec += s2.prec;
      if (s2.crit) p.crit += s2.crit;
      if (s2.aff) p.aff += s2.aff;
    }

    return p;
  }, [panel, bowSelect, food, script50, earlySeason, activeTier, iwStats]);

  // 3. Compute baseline reference graduation score
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
      });
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

  // 5. Live Stat Priority: % graduation gain/loss per substat roll, computed against the CURRENT panel
  const statPriorityList = useMemo(() => {
    const STAT_ROLLS: { key: keyof PanelStats; label: string; roll: number; unit: string }[] = [
      { key: "maxOuter", label: "Max Phys ATK", roll: 63.8, unit: "" },
      { key: "minOuter", label: "Min Phys ATK", roll: 26, unit: "" },
      { key: "outerPen", label: "Phys Pen", roll: 9.0, unit: "%" },
      { key: "crit", label: "Crit Rate", roll: 6.5, unit: "%" },
      { key: "critDmg", label: "Crit DMG", roll: 5.0, unit: "%" },
      { key: "aff", label: "Affinity Rate", roll: 4.5, unit: "%" },
      { key: "affDmg", label: "Affinity DMG", roll: 5.0, unit: "%" },
      { key: "prec", label: "Precision", roll: 5.0, unit: "%" },
      { key: "maxPz", label: "Max Bamboocut ATK", roll: 30, unit: "" },
      { key: "pzPen", label: "Bamboocut Pen", roll: 9.0, unit: "%" },
      { key: "dcrit", label: "Direct Crit Rate", roll: 4.6, unit: "%" },
      { key: "umbBonus", label: "Umbrella Bonus", roll: 2.0, unit: "%" },
      { key: "ropeBonus", label: "Rope Dart Bonus", roll: 2.0, unit: "%" },
      { key: "swordBonus", label: "Sword Bonus", roll: 2.0, unit: "%" },
      { key: "spearBonus", label: "Spear Bonus", roll: 2.0, unit: "%" },
      { key: "fanBonus", label: "Fan Bonus", roll: 2.0, unit: "%" },
      { key: "twinbladesBonus", label: "Twinblades Bonus", roll: 2.0, unit: "%" },
      { key: "modaoBonus", label: "Modao Bonus", roll: 2.0, unit: "%" },
      { key: "hengdaoBonus", label: "Hengdao Bonus", roll: 2.0, unit: "%" },
      { key: "gauntletsBonus", label: "Gauntlets Bonus", roll: 2.0, unit: "%" },
      { key: "allArts", label: "All Weapon Bonus", roll: 2.0, unit: "%" },
      { key: "bossDmg", label: "Boss DMG", roll: 2.0, unit: "%" },
      { key: "outerDmg", label: "Phys DMG", roll: 2.0, unit: "%" },
    ];

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
      { key: "maxOuter", label: "Physical Atk (Phys Atk)", value: 10, bonusLabel: "+10 Atk", color: "from-amber-600 to-amber-500" },
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
    return Math.min(80, (adjustedPanel.crit / 100 / judgmentFactor + adjustedPanel.dcrit / 100) * 100);
  }, [adjustedPanel, judgmentFactor]);

  const effAffRate = useMemo(() => {
    return Math.min(40, (adjustedPanel.aff / 100 / judgmentFactor + adjustedPanel.daff / 100) * 100);
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
    <div className="min-h-screen bg-[#1a1a1d] text-[#e0e0e0] font-sans antialiased selection:bg-amber-600/30 selection:text-amber-200">
      {/* Accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700" />

      {/* ── HEADER ── */}
      <header>
        <div className="header-title-container">
          <div className="header-title-group">
            <h1>Where Winds Meet Gear Graduation Manager</h1>
            <button
              onClick={() => {
                alert(
                  "Where Winds Meet Gear Graduation Manager\\n" +
                  "Version: 3.0.0 (T91 Global)\\n" +
                  "Last DB Update: June 15, 2026\\n" +
                  "Author: T91 Global Team\\n" +
                  "Adapted from spongem.com/yysls/ layout."
                );
              }}
              className="info-icon-btn"
              title="About this site"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M10 6V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
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
                { key: "Pendant", label: "Pendant" },
                { key: "Bow/Ring", label: "Ring" }
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
            <button
              onClick={() => {
                setEditingItem(null);
                setFormName("");
                setFormQuality("gold");
                const initialSlot = gearFilterSlot === "ALL" ? "Umbrella" : gearFilterSlot;
                setSelectedSlot(initialSlot);
                setFormMain("");
                if (initialSlot === "Umbrella" || initialSlot === "Rope Dart" || initialSlot === "Pendant") {
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
                  return a.name.localeCompare(b.name);
                })
                .map(item => {
                  const isEquipped = isItemEquipped(item, getActiveGear());
                  const isGold = item.quality === "gold";
                  const isPurple = item.quality === "purple";
                  const slotObj = SLOTS.find(s => s.name === item.slot);
                  const slotIcon = slotObj?.icon || "🛡";
                  const { totalGradDelta } = getGearItemCompareStats(item);

                  let borderClass = "";
                  if (isEquipped) {
                    borderClass = "equip-card-equipped";
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleEquip(item)}
                      className={`equip-card ${borderClass}`}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {isEquipped && (
                        <span className="equipped-badge">Equipped</span>
                      )}
                      <div className="card-header" style={{ position: 'relative', paddingRight: '35px' }}>
                        <div className="equip-icon-wrap" style={{ width: '50px', height: '50px', borderRadius: '4px', border: '1px solid #555', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1d' }}>
                          <img src={(item.slot === "Umbrella" || item.slot === "Rope Dart") ? getWeaponIconUrlByType(item.weaponType, item.slot, selectedBuild) : SLOT_IMAGES[item.slot]} alt={item.slot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <div className="card-title" style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                            {getSlotLabel(item.slot)}{item.weaponType ? ` (${item.weaponType})` : ""}
                          </span>
                        </div>
                        <button
                          className="edit-btn"
                          style={{
                            position: 'absolute',
                            right: '0px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#d48c2a',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            zIndex: 10
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(item);
                          }}
                          title="Edit Gear"
                        >
                          ✎
                        </button>
                      </div>
                      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                        <div className="stat-line main-stat">
                          <span className="stat-label">Main Stat</span>
                          <span className="val">{item.main}</span>
                        </div>
                        {item.subs.slice(0, 4).map((sub, sidx) => (
                          <div key={sidx} className="stat-line sub-stat">
                            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              {sub.type} {sub.isTuned && <span className="text-amber-500 font-bold">✦</span>}
                            </span>
                            <span className="val">{sub.val}</span>
                          </div>
                        ))}
                        <div className="diff-result flex justify-between pt-2 border-t border-slate-800" style={{ marginTop: '5px' }}>
                          <span className="text-slate-500">Grad Delta:</span>
                          <span className={totalGradDelta >= 0 ? "text-green" : "text-red"}>
                            {totalGradDelta >= 0 ? "+" : ""}{totalGradDelta.toFixed(2)}%
                          </span>
                        </div>
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
                  <option key={key} value={key}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

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
                        <img src={imageUrl || ""} alt={iw.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                  { name: "Helmet", key: "head", label: "Helmet" },
                  { name: "Chest", key: "chest", label: "Chest" },
                  { name: "Bracers", key: "hands", label: "Hands" },
                  { name: "Greaves", key: "legs", label: "Legs" },
                  { name: "Pendant", key: "pendant", label: "Pendant" },
                  { name: "Bow/Ring", key: "ring", label: "Ring" }
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
                      onClick={() => {
                        if (item) {
                          unequipItem(slot.name);
                        } else {
                          setGearFilterSlot(slot.name);
                        }
                      }}
                      title={item ? `Equipped: ${item.name}. Click to unequip.` : `Empty. Click to filter inventory.`}
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
                    </div>
                  );
                });
              })()}
            </div>
            <div className="sim-side-panel">
              <div className="sim-slot bow-slot">
                <img id="bow-icon" src="icon/icon9_1.jpg" alt="Bow" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="sim-controls">
                <select
                  value={bowSelect}
                  onChange={(e) => setBowSelect(e.target.value as any)}
                  className="mini-select"
                  title="Select bow attribute"
                >
                  <option value="precision">Precision Bow</option>
                  <option value="crit">Crit Bow</option>
                  <option value="intent">Affinity Bow</option>
                </select>
                <select
                  value={panel.set}
                  onChange={(e) => handleStatChange("set", e.target.value)}
                  className="mini-select"
                  title="Select set bonus"
                >
                  {Object.entries(ARMOR_SETS).map(([key, s]) => (
                    <option key={key} value={key}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="panel-checkbox-container">
            <div className="panel-checkbox-wrapper">
              <label className="panel-checkbox-label">
                <input
                  type="checkbox"
                  checked={earlySeason}
                  onChange={(e) => setEarlySeason(e.target.checked)}
                  className="panel-checkbox-input"
                />
                <span>Early season bonus (caps may rise)</span>
              </label>
              <label className="panel-checkbox-label">
                <input
                  type="checkbox"
                  checked={pvpMode}
                  onChange={(e) => setPvpMode(e.target.checked)}
                  className="panel-checkbox-input"
                />
                <span>Boss counts as Player (PVP scaling)</span>
              </label>
              <label className="panel-checkbox-label">
                <input
                  type="checkbox"
                  checked={loanDingyin}
                  onChange={(e) => setLoanDingyin(e.target.checked)}
                  className="panel-checkbox-input"
                />
                <span>Loan max tuned (Dingyin) stats</span>
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
                Excel Sheet: <span className="text-bbb">{(rotationStats.gradRate / 0.94).toFixed(2)}%</span>
              </span>
              <span className="banner-footer-text">
                DPS Expectation: <span className="text-white font-bold">{Math.round(rotationStats.dps).toLocaleString()}</span>
              </span>
            </div>
            <div className="banner-arrow">›</div>
          </div>

          {/* Stats Display */}
          <div id="stats-display" className="stats-panel">
            {[
              { label: "Min Physical Atk", val: adjustedPanel.minOuter },
              { label: "Max Physical Atk", val: adjustedPanel.maxOuter },
              { label: "Physical Pen %", val: `${adjustedPanel.outerPen.toFixed(1)}%` },
              { label: "Net Phys Pen (in dungeon)", val: `${netPhysPen.toFixed(1)}%` },
              { label: "Crit Rate %", val: `${adjustedPanel.crit.toFixed(1)}%` },
              { label: "Effective Crit Rate %", val: `${effCritRate.toFixed(1)}%` },
              { label: "Crit DMG %", val: `+${adjustedPanel.critDmg.toFixed(1)}%` },
              { label: "Affinity Rate %", val: `${adjustedPanel.aff.toFixed(1)}%` },
              { label: "Effective Affinity Rate %", val: `${effAffRate.toFixed(1)}%` },
              { label: "Affinity DMG %", val: `+${adjustedPanel.affDmg.toFixed(1)}%` },
              { label: "Precision Rate %", val: `${adjustedPanel.prec.toFixed(1)}%` },
              { label: "Effective Precision %", val: `${effPrecision.toFixed(1)}%` },
              { label: "Min Bamboocut Atk", val: adjustedPanel.minPz },
              { label: "Max Bamboocut Atk", val: adjustedPanel.maxPz },
              { label: "Bamboocut Pen %", val: `${adjustedPanel.pzPen.toFixed(1)}%` },
              { label: "Net Bamboocut Pen", val: `${netPzPen.toFixed(1)}%` },
              { label: "Bamboocut DMG Bonus %", val: `${adjustedPanel.pzDmg.toFixed(1)}%` }
            ].map((stat, idx) => (
              <div key={idx} className="stat-row-display">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-val">{stat.val}</span>
              </div>
            ))}
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
                <div className="grad-excel-rate-box">
                  <div className="grad-excel-rate-text">Excel Sheet: <span className="text-bbb font-bold">{(rotationStats.gradRate / 0.94).toFixed(2)}%</span></div>
                </div>
                <div className="grad-meta-info-inline">
                  <div className="grad-meta-text">
                    <div className="grad-meta-item">DB Last Updated: <span className="text-white">June 15, 2026</span></div>
                    <div className="grad-meta-item">Version: <span className="text-white">3.0.0 (T91 Global)</span></div>
                    <div className="grad-meta-item">Author: <span className="text-white">T91 Global Team</span></div>
                  </div>
                </div>
                <div className="current-equip-list" style={{ padding: '10px' }}>
                  {SLOTS.map(slot => {
                    const item = getActiveGear().find(it => it.slot === slot.name && isItemEquipped(it, getActiveGear()));
                    return (
                      <div key={slot.name} className="grad-equip-item" onClick={() => { setIsGradModalOpen(false); setGearFilterSlot(slot.name); }}>
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
                    { key: "cultivate", label: "Cultivate" },
                    { key: "compare", label: "Compare" },
                    { key: "simulators", label: "Swap Sim" },
                    { key: "rot-sim", label: "Rotation Sim" },
                    { key: "profiles", label: "Sets & Backup" }
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
                      <div className="bg-[#1c1a17] border border-amber-900/20 rounded-xl p-4 space-y-2">
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <span className="text-[12px] font-mono font-bold tracking-widest text-[#a19683] uppercase flex items-center gap-1.5">
                            Auto Panel From Gear
                          </span>
                          <input
                            type="checkbox"
                            checked={autoGearPanel}
                            onChange={(e) => setAutoGearPanel(e.target.checked)}
                            className="w-4 h-4 accent-amber-500"
                          />
                        </label>
                        <p className="text-[11.5px] text-slate-500 leading-snug">
                          {autoGearPanel
                            ? "ON — Panel stats are computed from equipped items. Change gear to change stats."
                            : "OFF — all stats below are entered manually and will not update when you change gear."}
                        </p>
                      </div>

                      <div className="bg-[#1c1a17] border border-amber-900/20 rounded-xl p-4 space-y-3">
                        <span className="text-[12px] font-mono font-bold tracking-widest text-[#a19683] uppercase">Dungeon Target</span>
                        <select
                          value={tierKey}
                          onChange={(e) => setTierKey(e.target.value)}
                          className="bg-slate-900 font-mono text-sm text-amber-500 rounded px-2.5 py-1"
                        >
                          <option value="350|0.45">Tier 91 / Lv95 (Global)</option>
                          <option value="307|0.3">Tier 86 / Lv90</option>
                          <option value="405|0.65">Tier 96 / Lv100 (Lower)</option>
                          <option value="405|0.65b">Tier 96 / Lv100 (Upper)</option>
                          <option value="559|1.15">CN Level 105 (Ref)</option>
                          <option value="custom">Custom Params</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-widest mb-3 border-b border-amber-500/20 pb-1">Physical Attributes</h3>
                          <div className="space-y-2">
                            {[
                              { label: "Min Physical Atk", key: "minOuter" },
                              { label: "Max Physical Atk", key: "maxOuter" },
                              { label: "Physical Pen %", key: "outerPen", step: 0.1 }
                            ].map(st => (
                              <div key={st.key} className="flex justify-between items-center bg-slate-950/70 p-2 rounded border border-slate-800 text-sm">
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

                        <div>
                          <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-widest mb-3 border-b border-amber-500/20 pb-1">Bamboocut Attributes</h3>
                          <div className="space-y-2">
                            {[
                              { label: "Min Bamboocut Atk", key: "minPz" },
                              { label: "Max Bamboocut Atk", key: "maxPz" },
                              { label: "Bamboocut Pen %", key: "pzPen", step: 0.1 },
                              { label: "Bamboocut DMG Bonus %", key: "pzDmg", step: 0.1 }
                            ].map(st => (
                              <div key={st.key} className="flex justify-between items-center bg-slate-950/70 p-2 rounded border border-slate-800 text-sm">
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
                      </div>
                    </div>
                  )}
                  {gradModalActiveTab === "priority" && (
                    <div style={{ textAlign: 'left' }}>
                      {gradModalActiveTab === "priority" && (
          <div className="space-y-6">
            <div className="bg-[#141210] border border-amber-500/20 rounded-xl p-6 shadow-lg">
              <div className="border-b border-amber-500/25 pb-4 mb-5">
                <h2 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                  <TrendingUp className="text-amber-500 w-5 h-5" /> Stat Priority — Graduation Impact
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Live ranking for <strong className="text-amber-400">{(BUILD_PROFILES as any)[selectedBuild]?.label || "your build"}</strong>, computed from your current panel ({rotationStats.gradRate.toFixed(1)}% graduation). Each row simulates adding/removing <strong>one typical substat roll</strong> on a single sub-stat and shows the resulting change in graduation %.
                </p>
              </div>

              {/* Two-column gain/loss ranking */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-sm text-amber-500/95 flex items-center gap-2 mb-4">
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
                          <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
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
                          <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
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
            <div className="bg-[#141210] border border-amber-500/20 rounded-xl p-6 shadow-lg">
              <h3 className="text-sm uppercase tracking-widest font-extrabold text-amber-500 font-serif border-b border-amber-500/20 pb-2 mb-4">
                General Theorycrafting Guide · T91 Global (http://spongem.com/yysls/)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-300 leading-relaxed">
                <div className="space-y-3">
                  <p>
                    <strong className="text-amber-400">1. Physical Penetration (Phys Pen)</strong>: The most crucial core attribute until reaching the optimal cap in dungeon content (e.g., 51.2% for T91). Every point of Phys Pen below this threshold provides massive exponential damage amplification.
                  </p>
                  <p>
                    <strong className="text-amber-400">2. Critical Rate Cap (80%)</strong>: The absolute maximum Critical Rate in Where Winds Meet is capped at <strong className="text-orange-400">80%</strong>. If your combined character attributes and passive/active buffs push your Crit beyond 80%, the surplus is ignored. Aim for roughly 73% unbuffed so that party buffs safely top you off at the optimal 80% maximum.
                  </p>
                  <p>
                    <strong className="text-amber-400">3. Critical Damage (Crit DMG %)</strong>: Crit DMG works in direct synergy with Crit Rate. Once your critical chance is secure, augmenting critical multipliers scales your total active DPS and Everspring Umbrella execution chain jumps exponentially.
                  </p>
                </div>
                <div className="space-y-3">
                  <p>
                    <strong className="text-amber-400">4. Affinity Rate (Cap 40%) & Bamboocut</strong>: Bamboocut Dust damage scales heavily with your overall break stats. Although Affinity is restricted to an absolute <strong className="text-orange-400">40%</strong> maximum cap in-game, adding Affinity attributes on Tier 91 gears (up to 4.5% per item) remains a powerful build option to convert graze hits into full-powered breaking attacks.
                  </p>
                  <p>
                    <strong className="text-amber-400">5. Substat Relaying (Inherit mechanics)</strong>: When refining Level 91 gear, always prioritize relaying/inheriting attributes that have reached diamond/gold thresholds (such as Phys Pen 9.0%, Max Atk 63.8, Crit 6.5%, etc.). A carefully put-together set can singlehandedly contribute over 40% of your graduation progression.
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
            <div className="bg-[#141210] border border-amber-500/20 rounded-xl p-6 shadow-lg">
              <div className="border-b border-amber-500/25 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold font-serif text-slate-105 flex items-center gap-2">
                    🎯 Cultivation Summary
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Compare your current accumulated gear substats with the graduation panel targets.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-mono text-slate-500">Select Class:</span>
                  <select
                    value={cultivateClass}
                    onChange={(e) => setCultivateClass(e.target.value)}
                    className="bg-slate-950 border border-amber-900/30 hover:border-amber-500/50 text-amber-500 text-sm rounded-lg px-3 py-1.5 focus:outline-none font-bold transition-all cursor-pointer"
                  >
                    {Object.keys(WWM_DATA.classes).map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
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
                  } else if (nameLower.includes("bamboocut pen")) {
                    gearType = "Attr Pen";
                    gradKey = "Bamboocut Pen";
                    isPercentage = true;
                  } else if (nameLower.includes("own weapon bonus")) {
                    gearType = "Umbrella Bonus";
                    gradKey = "Own Weapon Bonus";
                    isPercentage = true;
                    fallbackTarget = 32.0;
                  } else if (nameLower.includes("all weapon")) {
                    gearType = "All Weapon";
                    gradKey = "All Weapon Bonus";
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

                  const scaledTarget = rawTarget * 0.606;

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

                // Prepare stat tiles based on marginalGains
                const tiles = marginalGains.map((gain: any) => {
                  const label = gain.stat;
                  const config = getStatConfig(label, graduationPanel);
                  
                  let currentVal = 0;
                  if (label.toLowerCase().includes("own weapon")) {
                    currentVal = (currentSubsSum["Umbrella Bonus"] || 0) + (currentSubsSum["Rope Dart Bonus"] || 0);
                  } else if (label.toLowerCase().includes("all weapon")) {
                    currentVal = currentSubsSum["All Weapon"] || 0;
                  } else if (label.toLowerCase().includes("boss dmg")) {
                    currentVal = currentSubsSum["Boss DMG%"] || 0;
                  } else if (label.toLowerCase().includes("bamboocut pen")) {
                    currentVal = currentSubsSum["Attr Pen"] || 0;
                  } else if (label.toLowerCase().includes("phys dmg")) {
                    currentVal = currentSubsSum["Phys DMG%"] || 0;
                  } else if (label.toLowerCase().includes("strength")) {
                    currentVal = currentSubsSum["Strength"] || 0;
                  } else if (label.toLowerCase().includes("power")) {
                    currentVal = currentSubsSum["Power"] || 0;
                  } else if (label.toLowerCase().includes("agility")) {
                    currentVal = currentSubsSum["Agility"] || 0;
                  } else {
                    currentVal = currentSubsSum[config.gearType] || 0;
                  }

                  const targetVal = config.scaledTarget;
                  const progressPct = targetVal > 0 ? (currentVal / targetVal) * 100 : 0;
                  const progressCapped = Math.min(progressPct, 100);

                  // Colors: >= 80% filled is Green, 40-79% is Amber, < 40% is Red
                  let bgCardClass = "bg-[#1f1915]/40 border-rose-950/40 text-rose-450";
                  let progressFillColor = "bg-rose-500";
                  if (progressPct >= 80) {
                    bgCardClass = "bg-[#141c16]/40 border-emerald-950/30 text-emerald-400";
                    progressFillColor = "bg-emerald-500";
                  } else if (progressPct >= 40) {
                    bgCardClass = "bg-[#1e1a12]/40 border-amber-950/30 text-amber-500";
                    progressFillColor = "bg-amber-500";
                  }

                  return {
                    label,
                    gearType: config.gearType,
                    currentVal,
                    targetVal,
                    progressPct,
                    progressCapped,
                    bgCardClass,
                    progressFillColor,
                    isPercentage: config.isPercentage
                  };
                });

                // Calculate total progress: Average progress capped at 100%, scaled to 40
                const totalProgressSum = tiles.reduce((acc: number, t: any) => acc + t.progressCapped, 0);
                const averageProgressPct = tiles.length > 0 ? totalProgressSum / tiles.length : 0;
                const totalProgressVal = (averageProgressPct / 100) * 40;

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

                return (
                  <div className="space-y-6">
                    {/* Header Summary Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-[#181512] border border-amber-500/20 rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-sm font-mono uppercase tracking-wider text-slate-500">
                          Total sub-stat progress
                        </span>
                        <div className="text-3xl font-extrabold text-amber-500 font-serif mt-1 flex items-baseline gap-1.5">
                          <span>{totalProgressVal.toFixed(1)}</span>
                          <span className="text-base font-sans font-normal text-slate-500">/ 40</span>
                        </div>
                      </div>
                      <div className="bg-[#181512] border border-amber-500/20 rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-sm font-mono uppercase tracking-wider text-slate-500">
                          Dingyin (Tuned) stats
                        </span>
                        <div className="text-3xl font-extrabold text-amber-500 font-serif mt-1">
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
                                T91 Cap
                              </span>
                            </div>

                            <div className="flex justify-between items-baseline font-mono text-base">
                              <span className="text-slate-250 font-bold">
                                {tile.currentVal.toFixed(tile.isPercentage ? 1 : 0)}{tile.isPercentage ? "%" : ""}
                              </span>
                              <span className="text-slate-500 font-medium">
                                / {tile.targetVal.toFixed(tile.isPercentage ? 1 : 0)}{tile.isPercentage ? "%" : ""}
                              </span>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <div className="w-full bg-slate-950/70 rounded-full h-2.5 overflow-hidden border border-slate-800">
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
                    <div className="bg-[#141210]/30 border border-slate-800/40 rounded-xl p-4 text-sm text-slate-500 leading-relaxed font-mono">
                      Progress estimates based on Graduation Panel targets (CN Lv105).
                      Tier 91 caps are ~60% of shown values.
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
            <div className="bg-[#141210] border border-amber-500/20 rounded-xl p-6">
              <div className="mb-4 border-b border-amber-500/20 pb-3">
                <h2 className="text-base font-extrabold text-amber-500 uppercase tracking-wider font-serif flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Item Comparison & Graduation Deltas
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Understand exactly which gears represent the largest marginal upgrade relative to your active panel. Ranked descending by total simulation contribution.
                </p>
              </div>

              {/* 4x2 Grid of Slot Selection Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {SLOTS.map((slot) => {
                  const itemsInSlot = getActiveGear().filter(it => it.slot === slot.name);
                  const hasItems = itemsInSlot.length > 0;
                  const isSelected = selectedSlot === slot.name;
                  
                  return (
                    <button
                      key={slot.name}
                      onClick={() => setSelectedSlot(slot.name)}
                      className={`relative flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-md shadow-amber-500/5"
                          : "bg-slate-950/60 text-slate-500 hover:text-slate-200 border-slate-800/60 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-lg">{slot.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] truncate uppercase tracking-wide font-semibold">{getSlotLabel(slot.name)}</div>
                        {hasItems && (
                          <div className={`text-[11px] mt-0.5 ${isSelected ? "text-slate-900 font-bold" : "text-slate-500"}`}>
                            {itemsInSlot.length} item{itemsInSlot.length > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                      
                      {/* Gold dot indicator if possesses items */}
                      {hasItems && (
                        <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-slate-950" : "bg-amber-500 animate-pulse"}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Comparison list section */}
              <div>
                <h3 className="text-sm uppercase font-bold tracking-widest text-slate-500 font-mono mb-4">
                  Graduation ranking for slot: <span className="text-amber-500 font-serif">{getSlotLabel(selectedSlot)}</span>
                </h3>

                {(() => {
                  const slotItems = getActiveGear().filter(it => it.slot === selectedSlot);
                  if (slotItems.length === 0) {
                    return (
                      <div className="bg-slate-950/40 border border-dashed border-slate-800/60 p-8 rounded-lg text-center font-mono">
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
                        const qualityClass = item.quality === "gold" ? "border-amber-500/20 bg-[#1b1510]/80" : item.quality === "purple" ? "border-purple-500/20 bg-[#16121c]/80" : "border-sky-500/20 bg-[#11141a]/80";
                        
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border relative transition-all ${qualityClass}`}
                          >
                            <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center font-bold text-sm text-amber-500 font-serif shadow-inner">
                              #{rank}
                            </div>

                            <div className="pl-10">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/40 pb-2 mb-3">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                    <span>{item.name}</span>
                                    {isBest && (
                                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider scale-90">
                                        Best Option
                                      </span>
                                    )}
                                  </h4>
                                  <div className="text-[12px] text-slate-500 font-mono mt-0.5">
                                    Main: {item.main}
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1.5">
                                  <div className="text-sm font-mono font-extrabold text-amber-400">
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
                                    className="text-[11px] px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono uppercase tracking-wide transition-colors"
                                  >
                                    ⚔ Equip
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {entry.subs.map((sub, sidx) => {
                                  const subDeltaString = sub.delta > 0 ? `+${sub.delta.toFixed(2)}` : "0.00";
                                  
                                  return (
                                    <div key={sidx} className="bg-slate-950/70 p-2 rounded border border-slate-800/60 flex items-center justify-between font-mono text-[12px]">
                                      <div className="truncate text-slate-500 flex items-center gap-1 shrink md:shrink-0 pr-1">
                                        <span>{sub.type}</span>
                                        {sub.isTuned && <span className="text-amber-500 text-[11px]">✦</span>}
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
                  {gradModalActiveTab === "simulators" && (
                    <div style={{ textAlign: 'left' }}>
                      <StatSwapSimulator
                        adjustedPanel={adjustedPanel}
                        activeTier={activeTier}
                        datang={datang}
                        yishui={yishui}
                        selectedBuild={selectedBuild}
                      />
                    </div>
                  )}
                  {gradModalActiveTab === "rot-sim" && (
                    <div style={{ textAlign: 'left' }}>
                      {gradModalActiveTab === "rot-sim" && (() => {
          const allowedWeapons = CLASS_WEAPONS[rotSimClass] || [];
          const simulatorSkills = WWM_DATA.skills.filter(s => allowedWeapons.includes(s.weapon));

          // 1. Calculate Standard Rotation Details
          let totalSimCurrentDmg = 0;
          const currentSimDetails = simulatorSkills.map(s => {
            const hits = hitsState[s.name] || 0;
            const synthRotationItem = {
              name: s.name,
              count: 1,
              isDingyin: s.name.toLowerCase().includes("resonance") || s.name.toLowerCase().includes("attuned") || s.name.toLowerCase().includes("dingyin"),
              generalBonus: 0.315,
              yishui: 10,
              tiaozhan: 1
            };
            const { perHit } = calcSkill(synthRotationItem as any, adjustedPanel, activeTier, {
              set: adjustedPanel.set || "stars",
              datang,
              yishui,
              buildKey: selectedBuild
            });
            const skillTotal = perHit * hits;
            totalSimCurrentDmg += skillTotal;
            return {
              name: s.name,
              weaponName: s.weapon,
              hits,
              perHit,
              total: skillTotal,
              dps: skillTotal / 60
            };
          });
          const totalSimCurrentDps = totalSimCurrentDmg / 60;

          // 2. Calculate Swapped Weapon Rotation Details
          const swappedPanel = {
            ...adjustedPanel,
            minOuter: swapMinAtk,
            maxOuter: swapMaxAtk
          };
          let totalSimSwappedDmg = 0;
          const scrappedSimDetails = simulatorSkills.map(s => {
            const hits = hitsState[s.name] || 0;
            const synthRotationItem = {
              name: s.name,
              count: 1,
              isDingyin: s.name.toLowerCase().includes("resonance") || s.name.toLowerCase().includes("attuned") || s.name.toLowerCase().includes("dingyin"),
              generalBonus: 0.315,
              yishui: 10,
              tiaozhan: 1
            };
            const { perHit } = calcSkill(synthRotationItem as any, swappedPanel, activeTier, {
              set: swappedPanel.set || "stars",
              datang,
              yishui,
              buildKey: selectedBuild
            });
            const skillTotal = perHit * hits;
            totalSimSwappedDmg += skillTotal;
          });
          const totalSimSwappedDps = totalSimSwappedDmg / 60;
          const swapDpsDiffPct = totalSimCurrentDps > 0 ? ((totalSimSwappedDps - totalSimCurrentDps) / totalSimCurrentDps) * 100 : 0;

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Inputs, Selection & Core Config */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Selector Block */}
                  <div className="bg-[#141210] border border-amber-500/20 rounded-xl p-5 shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-500/20 pb-3">
                      <div>
                        <h3 className="text-base font-bold font-serif text-slate-100 flex items-center gap-2">
                          🔄 Rotation Combat Simulator
                        </h3>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          Set custom hits parsed in combat to calculate authentic class-specific active DPS.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-450 font-mono">Select Class:</span>
                        <select
                          value={rotSimClass}
                          onChange={(e) => setRotSimClass(e.target.value)}
                          className="bg-slate-950 border border-amber-900/45 text-amber-500 text-sm rounded-md px-3 py-1.5 focus:outline-none font-bold"
                        >
                          {Object.keys(WWM_DATA.classes).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Calibration Note/Banner */}
                    <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3.5 text-sm text-amber-500/90 leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <span>⚠️</span> <span>Calibration & Engine Disclaimer</span>
                      </div>
                      <p className="text-[13px] text-slate-350">
                        Our engine is calibrated against actual Global Tier 91 (approx. 3% total deviation).
                        Discrepancies can occur on Resonance/AoE skills (e.g. Flute Waves) due to stack scaling, multi-hits, and proximity.
                        <strong> We strongly recommend entering hits parsed from actual combat.</strong>
                      </p>
                    </div>

                    {/* Presets / Helper Buttons */}
                    <div className="flex flex-wrap gap-2 items-center text-sm">
                      <span className="text-slate-500 font-mono text-[12px] uppercase">Quick Presets:</span>
                      <button
                        onClick={() => {
                          const updated = { ...hitsState };
                          const HEAVY_PRESETS: Record<string, Record<string, number>> = {
                            "Bamboocut-Dust": {
                              "Scarlet Spin": 78,
                              "Resonance": 75,
                              "Burn and Bury": 4,
                              "Soul Sweep": 3,
                              "Soaring Spin": 6,
                              "Piercing Dart": 7,
                              "Cyclone Waltz": 11
                            },
                            "Bamboocut-Wind": { "Mortal Dart Red Blade (12345345)": 4, "Mortal Dart Red Blade (345)": 4, "Mortal Dart Q (Full Combo)": 8, "Mortal Dart Cross Slash (Heavy)": 6, "Mortal Dart White Blade Light": 10, "Twinblades Light Combo (Full)": 8, "Twinblades Q": 20, "Twinblades Charged": 4 },
                            "Nameless": { "Nameless Sword Q": 10, "Nameless Sword Heavy": 15, "Nameless Sword Charge Lv2": 8, "Nameless Sword Mystic Charge": 5, "Nameless Spear Q": 20, "Nameless Spear Windmill (Fast)": 30, "Nameless Spear Windmill (Finisher)": 8 },
                            "Jade": { "Inkwell Fan Q": 15, "Inkwell Fan Light Charge": 20, "Inkwell Fan Heavy": 15, "Inkwell Fan Heavy Charge Lv2 (Full)": 8, "Vernal Umbrella R": 30, "Vernal Fan Wind Wall": 8, "Vernal Fan Heavy": 10, "Vernal Fan 4x Light Charge": 4 },
                            "Nine-Nine": { "Strategic Sword Q (5 Bleed)": 12, "Strategic Sword Heavy (4 Bleed)": 10, "Bleed Tick (5 Stack)": 60, "Blood Explosion": 8, "Heavenquaker Spear Q (Full 5)": 15, "Heavenquaker Spear Heavy": 10, "Heavenquaker Spear Charge Lv2": 5 },
                            "Rocksplit-Might": { "Thundercry Blade Q (Deathstrike)": 10, "Thundercry Blade Stance Combo": 12, "Thundercry Blade Light Charge": 15, "Thundercry Blade Heavy Derived": 12, "Spirit Clone (Thundercry)": 20, "Stormbreaker Spear Charge": 8, "Stormbreaker Spear Heavy": 10 },
                            "Rocksplit-Jun": { "Snowparting Blade Q (3 Charge, 2 Intent)": 8, "Snowparting Derived (2 Intent)": 8, "Phalanxbane Blade Q (Fast 3 Charge)": 5, "Phalanxbane Quick Q": 8, "Spirit Blade Clone (Lv2)": 16, "Spirit Blade Clone (Lv1)": 8 },
                            "Pure-Healer": { "Panacea Fan Heavy Strike": 20, "Panacea Fan Q": 8, "Panacea Fan Light Charge": 15, "Soulshade Umbrella Q": 15, "Soulshade Off-Field Heal": 30, "Soulshade Light Charge": 10 },
                            "Fire-Fist-Healer": { "Panacea Fan Heavy Strike": 15, "Panacea Fan Q": 10, "Soulshade Umbrella Q": 20, "Soulshade Off-Field Heal": 25, "Soulshade Light Charge": 12 },
                          };
                          const classPreset = HEAVY_PRESETS[rotSimClass] || {};
                          simulatorSkills.forEach(s => { updated[s.name] = classPreset[s.name] ?? 0; });
                          setHitsState(updated);
                        }}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded text-sm text-slate-350 hover:text-slate-200 transition-colors"
                      >
                        🔥 Heavy Attack Rotation
                      </button>
                      <button
                        onClick={() => {
                          const updated = { ...hitsState };
                          const BALANCED_PRESETS: Record<string, Record<string, number>> = {
                            "Bamboocut-Dust": {
                              "Scarlet Spin": 50,
                              "Resonance": 45,
                              "Burn and Bury": 3,
                              "Soul Sweep": 2,
                              "Soaring Spin": 4,
                              "Piercing Dart": 4,
                              "Cyclone Waltz": 6
                            },
                            "Bamboocut-Wind": { "Mortal Dart Red Blade (12345345)": 3, "Mortal Dart Q (Full Combo)": 6, "Mortal Dart Cross Slash (Heavy)": 4, "Mortal Dart White Blade Light": 8, "Twinblades Light Combo (Full)": 6, "Twinblades Q": 15, "Twinblades Charged": 3 },
                            "Nameless": { "Nameless Sword Q": 8, "Nameless Sword Heavy": 10, "Nameless Sword Charge Lv2": 5, "Nameless Spear Q": 15, "Nameless Spear Windmill (Fast)": 20, "Nameless Spear Windmill (Finisher)": 5 },
                            "Jade": { "Inkwell Fan Q": 12, "Inkwell Fan Light Charge": 15, "Inkwell Fan Heavy": 10, "Vernal Umbrella R": 20, "Vernal Fan Wind Wall": 6, "Vernal Fan Heavy": 8 },
                            "Nine-Nine": { "Strategic Sword Q (5 Bleed)": 8, "Strategic Sword Heavy (4 Bleed)": 8, "Bleed Tick (5 Stack)": 40, "Blood Explosion": 5, "Heavenquaker Spear Q (Full 5)": 10, "Heavenquaker Spear Heavy": 8 },
                            "Rocksplit-Might": { "Thundercry Blade Q (Deathstrike)": 8, "Thundercry Blade Stance Combo": 8, "Thundercry Blade Light Charge": 10, "Spirit Clone (Thundercry)": 15, "Stormbreaker Spear Charge": 6, "Stormbreaker Spear Heavy": 8 },
                            "Rocksplit-Jun": { "Snowparting Blade Q (3 Charge, 2 Intent)": 5, "Snowparting Derived (2 Intent)": 5, "Phalanxbane Blade Q (Fast 3 Charge)": 4, "Phalanxbane Quick Q": 6, "Spirit Blade Clone (Lv2)": 10 },
                            "Pure-Healer": { "Panacea Fan Heavy Strike": 15, "Panacea Fan Q": 6, "Panacea Fan Light Charge": 10, "Soulshade Umbrella Q": 10, "Soulshade Off-Field Heal": 20, "Soulshade Light Charge": 8 },
                            "Fire-Fist-Healer": { "Panacea Fan Heavy Strike": 10, "Panacea Fan Q": 8, "Soulshade Umbrella Q": 15, "Soulshade Off-Field Heal": 18 },
                          };
                          const classPreset = BALANCED_PRESETS[rotSimClass] || {};
                          simulatorSkills.forEach(s => { updated[s.name] = classPreset[s.name] ?? 0; });
                          setHitsState(updated);
                        }}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded text-sm text-slate-350 hover:text-slate-200 transition-colors"
                      >
                        ⚡ Balanced Rotation
                      </button>
                      <button
                        onClick={() => {
                          const updated = { ...hitsState };
                          WWM_DATA.skills.forEach(s => {
                            updated[s.name] = 0;
                          });
                          setHitsState(updated);
                        }}
                        className="px-2 py-1 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded text-sm text-rose-400 transition-colors font-mono"
                      >
                        🧹 Reset to 0 Hits
                      </button>
                    </div>

                    {/* Interactive Skills Table */}
                    <div className="h-[450px] overflow-y-auto pr-1 border border-slate-800 bg-slate-950/40 rounded-lg p-2">
                      <span className="text-[12px] uppercase font-mono text-slate-500 font-semibold px-2 block mb-2">
                        Active Skills ({simulatorSkills.length}) for {rotSimClass} Weapons:
                      </span>
                      <div className="space-y-2">
                        {simulatorSkills.map((s) => {
                          const hits = hitsState[s.name] || 0;
                          return (
                            <div key={s.name} className="flex items-center justify-between p-2.5 bg-slate-950/70 rounded border border-slate-800 hover:border-slate-850 transition-colors gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-slate-200 truncate">{s.name}</div>
                                <div className="text-[12px] text-slate-500 truncate font-mono">{s.weapon}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-mono text-slate-500">Hits/60s:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="999"
                                  value={hits === 0 ? "" : hits}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setHitsState(prev => ({ ...prev, [s.name]: val }));
                                  }}
                                  className="w-16 bg-slate-950 border border-slate-800 rounded p-1 text-sm text-center text-amber-500 font-mono font-bold focus:outline-none focus:border-amber-500/50"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Disclaimer about non-Bamboocut-Dust path skill names */}
                    <div className="mt-2 text-[12px] text-slate-500 italic leading-relaxed px-1 flex items-start gap-1">
                      <span className="shrink-0 text-amber-500/80">⚠️</span>
                      <span>
                        Skill names for non-Bamboocut-Dust paths are approximate. Enter hits from your actual damage log for accurate results.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Outputs & Gear Swap Simulator */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Core Combat Output Parse Card */}
                  <div className="bg-[#141210] border border-amber-500/20 rounded-xl p-5 shadow-lg space-y-4">
                    <h3 className="text-base font-bold font-serif text-slate-100 flex items-center gap-2 border-b border-amber-500/20 pb-2">
                      ⚔ Simulated Combat Parse
                    </h3>
                    
                    {/* Big Stats Indicator */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-[12px] uppercase font-mono tracking-wider text-slate-500">Total Combat Damage</div>
                        <div className="text-xl font-bold font-serif text-amber-500 mt-0.5">
                          {Math.round(totalSimCurrentDmg).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[12px] uppercase font-mono tracking-wider text-slate-500">Effective Parse DPS</div>
                        <div className="text-xl font-bold font-serif text-amber-500 mt-0.5">
                          {totalSimCurrentDps.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </div>
                      </div>
                    </div>

                    {/* Skill Contributions table */}
                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950 border-b border-amber-500/20 text-[11px] uppercase tracking-wider font-mono text-slate-500">
                            <th className="py-2 px-3">Skill Spec</th>
                            <th className="py-2 px-3 text-right">Hits</th>
                            <th className="py-2 px-3 text-right">DMG/hit</th>
                            <th className="py-2 px-3 text-right font-bold text-amber-500/80">Total</th>
                            <th className="py-2 px-3 text-right">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-950 bg-slate-950/25 font-mono text-[13px] text-slate-300">
                          {currentSimDetails
                            .filter(item => item.hits > 0)
                            .sort((a, b) => b.total - a.total)
                            .map((item, idx) => {
                              const percent = totalSimCurrentDmg > 0 ? ((item.total / totalSimCurrentDmg) * 100).toFixed(1) : "0.0";
                              return (
                                <tr key={idx} className="hover:bg-slate-950/60 transition-colors">
                                  <td className="py-2 px-3 font-sans font-medium text-slate-200">
                                    {item.name}
                                  </td>
                                  <td className="py-2 px-3 text-right text-slate-500">{item.hits}</td>
                                  <td className="py-2 px-3 text-right text-slate-450">{Math.round(item.perHit).toLocaleString()}</td>
                                  <td className="py-2 px-3 text-right font-extrabold text-amber-500">
                                    {Math.round(item.total).toLocaleString()}
                                  </td>
                                  <td className="py-2 px-3 text-right text-slate-500">{percent}%</td>
                                </tr>
                              );
                            })}
                          {currentSimDetails.filter(x => x.hits > 0).length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-500 italic text-[13px]">
                                No skills have active Hits entered. Please type some Hits in the table to display the parse data here.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Weapon Swap Simulator Card */}
                  <div className="bg-[#141210] border border-amber-500/20 rounded-xl p-5 shadow-lg space-y-4">
                    <div className="border-b border-amber-500/20 pb-2">
                      <h3 className="text-base font-bold font-serif text-slate-100 flex items-center gap-1.5">
                        🛠 Weapon/Gear Swap Simulator
                      </h3>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        Test how alternate weapons stack up by modifying the Base Physical Attack min & max attributes.
                      </p>
                    </div>

                    <div className="space-y-3 font-mono text-sm">
                      
                      {/* Presets dropdown */}
                      <div className="space-y-1">
                        <label className="text-[12px] text-slate-500 font-sans font-bold uppercase tracking-wider block">Weapon Base Presets</label>
                        <select
                          value={swapWeaponId}
                          onChange={(e) => {
                            const wid = e.target.value;
                            setSwapWeaponId(wid);
                            const found = PREDEFINED_WEAPONS.find(w => w.id === wid);
                            if (found && wid !== "custom") {
                              setSwapMinAtk(found.min);
                              setSwapMaxAtk(found.max);
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-amber-500/50 block w-full"
                        >
                          {PREDEFINED_WEAPONS.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Inputs min & max */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[12px] text-slate-500 font-sans block">New Min Base Atk</label>
                          <input
                            type="number"
                            value={swapMinAtk}
                            onChange={(e) => {
                              setSwapMinAtk(parseInt(e.target.value) || 0);
                              setSwapWeaponId("custom");
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 placeholder:text-slate-705 focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[12px] text-slate-500 font-sans block">New Max Base Atk</label>
                          <input
                            type="number"
                            value={swapMaxAtk}
                            onChange={(e) => {
                              setSwapMaxAtk(parseInt(e.target.value) || 0);
                              setSwapWeaponId("custom");
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 placeholder:text-slate-705 focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>

                      {/* Swap Comparison results banner */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                        <div className="text-[12px] uppercase font-bold text-slate-500 tracking-wider">Recalculated Weapon Comparison</div>
                        
                        <div className="mt-2.5 flex items-baseline justify-between">
                          <div className="text-slate-500 text-sm">Simulated DPS:</div>
                          <div className="text-lg font-bold text-amber-500">
                            {totalSimSwappedDps.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-sm">
                          <span className="text-slate-500">Total Parse Gain/Loss:</span>
                          {swapDpsDiffPct >= 0 ? (
                            <span className="font-extrabold text-emerald-500 text-base">
                              +{swapDpsDiffPct.toFixed(2)}% DPS Increase
                            </span>
                          ) : (
                            <span className="font-extrabold text-rose-500 text-base">
                              {swapDpsDiffPct.toFixed(2)}% DPS Decrease
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Helpful quick guide */}
                      <div className="text-[12px] text-slate-500 leading-normal font-sans space-y-1 pl-1">
                        <p>💡 <strong>Note</strong>: This swap calculations assume panel scaling bonuses (such as Phys Pen, Critical multipliers, and Skill Damage attributes) remain active and apply seamlessly onto the new weapon base damage floor.</p>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            </div>
          );
        })()}
                    </div>
                  )}
                  {gradModalActiveTab === "profiles" && (
                    <div style={{ textAlign: 'left' }}>
                      {gradModalActiveTab === "profiles" && (
          <div className="space-y-6">
            <div className="bg-[#141210] border border-amber-500/20 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2 border-b border-amber-500/25 pb-4 mb-5">
                <Database className="text-amber-500 w-5 h-5" /> Gear Sets Management & Comparisons Matrix
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Save active panel box */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4 md:col-span-1">
                  <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest font-mono">
                    Save Active Panel Setup
                  </h3>
                  <div className="space-y-2">
                    <label className="text-[13px] text-slate-500 block font-medium">Profile Name</label>
                    <input
                      type="text"
                      placeholder="e.g., T91 Gold Set, Pen Focused..."
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="w-full bg-slate-900 text-slate-100 border border-slate-700 text-sm px-3 py-2 rounded focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!newProfileName.trim()) return;
                      const updated = [
                        {
                          id: Date.now().toString(),
                          name: newProfileName.trim(),
                          timestamp: new Date().toLocaleString(),
                          panel: { ...panel },
                          gradRate: rotationStats.gradRate,
                          dps: rotationStats.dps,
                        },
                        ...profiles,
                      ];
                      saveProfilesList(updated);
                      setNewProfileName("");
                    }}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded text-sm py-2 px-3 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Save Profile
                  </button>

                  <div className="border-t border-slate-800 pt-3">
                    <h4 className="text-[12px] uppercase tracking-wider font-extrabold text-slate-500 mb-2 font-mono">
                      Backups & Cross-sync
                    </h4>
                    <div className="space-y-2 text-[12px] text-slate-500">
                      <button
                        onClick={() => {
                          const str = JSON.stringify(profiles, null, 2);
                          navigator.clipboard.writeText(str);
                          alert("Successfully copied profile catalogs as JSON to clipboard!");
                        }}
                        className="text-amber-500/80 hover:text-amber-400 block font-semibold underline text-left"
                      >
                        Export Profiles (Copy JSON)
                      </button>
                      <button
                        onClick={() => {
                          const txt = prompt("Paste your profiles JSON backup string here:");
                          if (txt) {
                            try {
                              const parsed = JSON.parse(txt);
                              if (Array.isArray(parsed)) {
                                saveProfilesList(parsed);
                                alert("Profile catalogs loaded and synchronized successfully!");
                              } else {
                                alert("Invalid backup structure. Verified profiles must be a valid JSON list array.");
                              }
                            } catch (e) {
                              alert("An error occurred while parsing your profile JSON string.");
                            }
                          }
                        }}
                        className="text-amber-500/80 hover:text-amber-400 block font-semibold underline text-left mt-1"
                      >
                        Import Profiles (Paste JSON)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profiles catalogs */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest font-mono flex justify-between items-center">
                    <span>Saved Configurations ({profiles.length})</span>
                    {profiles.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete all saved configurations?")) {
                            saveProfilesList([]);
                          }
                        }}
                        className="text-rose-500 hover:text-rose-400 text-[12px] underline font-bold"
                      >
                        Delete All
                      </button>
                    )}
                  </h3>

                  {profiles.length === 0 ? (
                    <div className="bg-[#0e0d0b] border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
                      No stored configurations found. Current indicators will be lost on page reload if not saved. Record your setup using the panel on the left!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profiles.map((prof) => {
                        const isComparing = compareProfileIds.includes(prof.id);
                        const dyn = getDynamicProfileStats(prof);
                        return (
                          <div
                            key={prof.id}
                            className={`border rounded-xl p-4 transition-all relative ${
                              isComparing
                                ? "bg-amber-950/10 border-amber-500/65"
                                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <span className="text-[11px] font-mono text-slate-500 block">
                              {prof.timestamp}
                            </span>
                            <h4 className="text-base font-bold text-slate-100 font-serif mt-1 truncate">
                              {prof.name}
                            </h4>

                            <div className="grid grid-cols-2 gap-2 mt-2.5 text-[12px] font-mono border-t border-slate-800 pt-2.5">
                              <div>
                                <span className="text-slate-500 block">Graduation:</span>
                                <strong className="text-amber-500 text-sm">
                                  {dyn.gradRate.toFixed(1)}%
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block">DPS Score:</span>
                                <strong className="text-slate-200">
                                  {Math.round(dyn.dps).toLocaleString()}/s
                                </strong>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => {
                                  setPanel(prof.panel);
                                  alert(`Successfully restored configuration "${prof.name}" to active panel!`);
                                }}
                                className="flex-1 bg-slate-905 border border-slate-700 hover:bg-slate-900 text-slate-200 text-[13px] py-1.5 px-2 rounded text-center transition-colors font-bold cursor-pointer"
                              >
                                Equip Build
                              </button>
                              <button
                                onClick={() => {
                                  if (isComparing) {
                                    setCompareProfileIds(compareProfileIds.filter((id) => id !== prof.id));
                                  } else {
                                    setCompareProfileIds([...compareProfileIds, prof.id]);
                                  }
                                }}
                                className={`flex-1 border text-[13px] py-1.5 px-2 rounded font-bold transition-all text-center cursor-pointer ${
                                  isComparing
                                    ? "bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400 font-extrabold"
                                    : "bg-slate-905 border-slate-700 text-amber-500/95 hover:bg-slate-900"
                                }`}
                              >
                                {isComparing ? "✓ Selected" : "Compare"}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete profile "${prof.name}"?`)) {
                                    const updated = profiles.filter((p) => p.id !== prof.id);
                                    saveProfilesList(updated);
                                    setCompareProfileIds(compareProfileIds.filter((id) => id !== prof.id));
                                  }
                                }}
                                className="border border-slate-800 hover:bg-rose-950/10 hover:border-rose-900 text-rose-500 text-sm px-2.5 rounded transition-colors cursor-pointer"
                                title="Delete profile"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side-by-side multiple comparison matrix */}
            {compareProfileIds.length > 0 && (() => {
              const selectedProfs = profiles.filter((p) => compareProfileIds.includes(p.id));
              if (selectedProfs.length === 0) return null;

              const keysToCompare: { label: string; key: keyof PanelStats; unit: string }[] = [
                { label: "Max Physical Atk", key: "maxOuter", unit: "" },
                { label: "Min Physical Atk", key: "minOuter", unit: "" },
                { label: "Physical Penetration (Phys Pen)", key: "outerPen", unit: "%" },
                { label: "Critical Rate (Crit Rate)", key: "crit", unit: "%" },
                { label: "Critical Damage (Crit DMG)", key: "critDmg", unit: "%" },
                { label: "Bamboocut Penetration (Pz Pen)", key: "pzPen", unit: "%" },
                { label: "Bamboocut DMG Boost (Pz DMG)", key: "pzDmg", unit: "%" },
                { label: "Max Bamboocut", key: "maxPz", unit: "" },
                { label: "Affinity Rate", key: "aff", unit: "%" },
              ];

              return (
                <div className="bg-[#141210]/95 border-2 border-amber-500 rounded-xl p-5 shadow-2xl relative">
                  <div className="flex justify-between items-center border-b border-amber-500/20 pb-3 mb-4">
                    <h3 className="text-base font-serif font-bold text-amber-500 uppercase tracking-wider">
                      Multi Gear Sets Comparison Matrix ({selectedProfs.length} builds selected)
                    </h3>
                    <button
                      onClick={() => setCompareProfileIds([])}
                      className="text-sm text-rose-400 hover:text-rose-300 font-bold border border-rose-900/45 px-2.5 py-1 rounded bg-rose-950/20 cursor-pointer"
                    >
                      Clear all comparisons &times;
                    </button>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse font-sans min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-500 text-[12px] uppercase font-mono">
                          <th className="py-2.5 px-3">Attribute / Substat</th>
                          <th className="py-2.5 px-3 text-right text-amber-400 bg-amber-500/5">Active Configuration</th>
                          {selectedProfs.map((p) => (
                            <th key={p.id} className="py-2.5 px-3 text-right max-w-[200px] truncate" title={p.name}>
                              {p.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {keysToCompare.map((item) => {
                          const activeVal = adjustedPanel[item.key] as number;
                          return (
                            <tr key={item.key} className="border-b border-slate-800 text-sm font-mono hover:bg-slate-900/20">
                              <td className="py-2.5 px-3 font-sans font-medium text-slate-300">{item.label}</td>
                              <td className="py-2.5 px-3 text-right text-amber-400 font-bold bg-amber-500/5">
                                {activeVal.toFixed(item.key === "minOuter" || item.key === "maxOuter" || item.key === "maxPz" || item.key === "minPz" ? 0 : 1)}
                                {item.unit}
                              </td>
                              {selectedProfs.map((p) => {
                                const compVal = p.panel[item.key] as number;
                                const diff = activeVal - compVal;
                                return (
                                  <td key={p.id} className="py-2.5 px-3 text-right">
                                    <div className="text-slate-100 font-medium">
                                      {compVal.toFixed(item.key === "minOuter" || item.key === "maxOuter" || item.key === "maxPz" || item.key === "minPz" ? 0 : 1)}
                                      {item.unit}
                                    </div>
                                    <div className={`text-[11px] font-bold ${diff > 0 ? "text-rose-400" : diff < 0 ? "text-emerald-400" : "text-slate-500"}`}>
                                      {diff > 0 ? "▼ -" : diff < 0 ? "▲ +" : ""}
                                      {diff !== 0 ? Math.abs(diff).toFixed(item.key === "minOuter" || item.key === "maxOuter" || item.key === "maxPz" || item.key === "minPz" ? 0 : 1) : "equal"}
                                      {diff !== 0 ? item.unit : ""}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}

                        {/* Graduation Rate */}
                        <tr className="border-b border-slate-800 text-sm font-mono bg-amber-500/5 font-bold">
                          <td className="py-3 px-3 font-sans text-amber-400">Graduation Rate</td>
                          <td className="py-3 px-3 text-right text-amber-500 font-extrabold bg-amber-500/10">
                            {rotationStats.gradRate.toFixed(1)}%
                          </td>
                          {selectedProfs.map((p) => {
                            const dyn = getDynamicProfileStats(p);
                            const diff = rotationStats.gradRate - dyn.gradRate;
                            return (
                              <td key={p.id} className="py-3 px-3 text-right">
                                <div className="text-slate-200 font-extrabold">{dyn.gradRate.toFixed(1)}%</div>
                                <div className={`text-[11px] font-bold ${diff > 0 ? "text-rose-400" : diff < 0 ? "text-emerald-400" : "text-slate-500"}`}>
                                  {diff > 0 ? "▼ -" : diff < 0 ? "▲ +" : ""}
                                  {diff !== 0 ? Math.abs(diff).toFixed(1) : "equal"}
                                  {diff !== 0 ? "%" : ""}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Skill DPS */}
                        <tr className="border-b border-slate-800 text-sm font-mono bg-amber-400/5 font-bold">
                          <td className="py-3 px-3 font-sans text-amber-400 font-serif">Rotation Skill DPS</td>
                          <td className="py-3 px-3 text-right text-slate-100 font-extrabold bg-amber-500/10">
                            {Math.round(rotationStats.dps).toLocaleString()}/s
                          </td>
                          {selectedProfs.map((p) => {
                            const dyn = getDynamicProfileStats(p);
                            const diff = rotationStats.dps - dyn.dps;
                            return (
                              <td key={p.id} className="py-3 px-3 text-right">
                                <div className="text-slate-200 font-extrabold">{Math.round(dyn.dps).toLocaleString()}/s</div>
                                <div className={`text-[11px] font-bold ${diff > 0 ? "text-[#e94b29]" : diff < 0 ? "text-[#3fc05c]" : "text-slate-500"}`}>
                                  {diff > 0 ? "▼ -" : diff < 0 ? "▲ +" : ""}
                                  {diff !== 0 ? Math.round(Math.abs(diff)).toLocaleString() : ""}
                                  {diff !== 0 ? "/s" : "equal"}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
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
                      if (newSlot === "Umbrella" || newSlot === "Rope Dart" || newSlot === "Pendant") {
                        setFormSet("none");
                      } else if (newSlot === "Bow/Ring") {
                        setFormSet("pursuing");
                      } else {
                        setFormSet("stars");
                      }
                    }}
                    disabled={!!editingItem}
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
                  <label>Main Stat Text</label>
                  <input
                    type="text"
                    value={formMain}
                    onChange={e => setFormMain(e.target.value)}
                    placeholder="e.g. Max Phys Atk 106"
                    required
                  />
                </div>
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

              <div className="stat-section" style={{ marginTop: '15px' }}>
                <h3>Sub Stats</h3>
                <div className="flex-column-gap8" style={{ marginTop: '8px' }}>
                  {formSubs.map((sub, sidx) => (
                    <div key={sidx} className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                      <select
                        value={sub.type}
                        onChange={e => {
                          const next = [...formSubs];
                          next[sidx].type = e.target.value;
                          setFormSubs(next);
                        }}
                        style={{ flex: 1.5 }}
                      >
                        <option value="Other">Select stat / Empty</option>
                        {Object.keys(SUB_MAP).map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
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
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!sub.isTuned}
                          onChange={e => {
                            const next = [...formSubs];
                            next[sidx].isTuned = e.target.checked;
                            setFormSubs(next);
                          }}
                          className="accent-amber-500 h-3.5 w-3.5"
                        />
                        <span className="text-amber-500 font-bold text-xs">✦</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
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
                          const parsed = JSON.parse(ev.target?.result as string);
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
                        const parsed = JSON.parse(textarea.value.trim());
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
          <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '95%' }}>
            <div className="modal-header">
              <h2>Batch OCR (Text Recognition)</h2>
              <span className="close-btn" onClick={() => setIsBatchOcrModalOpen(false)}>&times;</span>
            </div>
            <div className="modal-body">
              <OcrScanner
                onOcrResult={(scanned) => {
                  handleOcrResult(scanned);
                  setIsBatchOcrModalOpen(false);
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
                        <img src={imageUrl || ""} alt={iw.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                    </div>
                  );
                })}
              </div>
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
