import { parseHybridGlobalEnglishRows } from "./ocrGlobalEnglish.ts";
import { applyGearRowSemantics, type GearSubRole } from "../data/gearAttunement.ts";

export interface OcrSub {
  type: string;
  val: string;
  isTuned?: boolean;
  isRetuned?: boolean;
  role?: GearSubRole;
  sourceOrder?: number;
  attunementId?: string;
  displayName?: string;
}

const fuzzyContains = (haystack: string, needle: string, maxDist = 2): boolean => {
  if (haystack.includes(needle)) return true;
  if (needle.length < 4) return false;
  for (let i = 0; i <= haystack.length - needle.length + maxDist; i++) {
    const window = haystack.substring(i, i + needle.length + maxDist);
    let mismatches = 0;
    let ni = 0;
    for (let wi = 0; wi < window.length && ni < needle.length; wi++) {
      if (window[wi] === needle[ni]) { ni++; }
      else { mismatches++; }
      if (mismatches > maxDist) break;
    }
    if (ni >= needle.length - 1 && mismatches <= maxDist) return true;
  }
  return false;
};

// Type values MUST match SUB_MAP keys in App.tsx exactly
const STAT_PATTERNS: { type: string; patterns: string[][]; exclude?: string[][] }[] = [
  // ── "Art of [Weapon] Boost" = boosts all skills of that weapon type ──
  { type: "Art of Umbrella DMG Boost", patterns: [["art", "umbrella"], ["art", "everspring"], ["umbrella", "boost"], ["everspring", "boost"]], exclude: [["martial"]] },
  { type: "Art of Rope Dart DMG Boost", patterns: [["art", "rope"], ["rope", "dart", "boost"], ["unfettered", "boost"]], exclude: [["martial"]] },
  { type: "Art of Sword DMG Boost", patterns: [["art", "sword"]], exclude: [["martial"], ["twinblade"], ["twin"]] },
  { type: "Art of Spear DMG Boost", patterns: [["art", "spear"]], exclude: [["martial"]] },
  { type: "Art of Fan DMG Boost", patterns: [["art", "fan"]], exclude: [["martial"]] },
  { type: "Art of Dual Blades DMG Boost", patterns: [["art", "dual"], ["art", "twinblade"], ["art", "twin", "blade"]], exclude: [["martial"]] },
  { type: "Art of Mo Blade DMG Boost", patterns: [["art", "mo", "blade"], ["art", "modao"]], exclude: [["martial"]] },
  { type: "Art of Heng Blade DMG Boost", patterns: [["art", "heng"], ["art", "hengdao"]], exclude: [["martial"]] },
  { type: "Art of Gauntlets DMG Boost", patterns: [["art", "gauntlet"]], exclude: [["martial"]] },
  // ── "[Weapon] Martial Art Skill DMG Boost" = boosts only martial art skills ──
  { type: "Umb Martial", patterns: [["umbrella", "martial"], ["everspring", "martial"], ["soulshade", "martial"], ["vernal", "martial"], ["umbrella", "art", "skill"], ["umbrella", "art", "dmg"], ["umbrella", "skill", "dmg", "boost"], ["umbrella", "skill", "boost"], ["umbrella", "dmg", "boost"]] },
  { type: "Umb Special", patterns: [["umbrella", "special"], ["everspring", "special"], ["soulshade", "special"], ["vernal", "special"], ["umbrella", "derivation"], ["everspring", "derivation"]] },
  { type: "Umb Charged", patterns: [["umbrella", "charged"], ["umbrella", "charge"], ["everspring", "charged"], ["soulshade", "charged"], ["vernal", "charged"], ["everspring", "charge"]] },
  { type: "Rope Martial", patterns: [["rope", "dart", "martial"], ["rope", "martial"], ["unfettered", "martial"], ["mortal", "martial"], ["rope", "dart", "skill"], ["rope", "dart", "dmg"]] },
  { type: "Rope Special", patterns: [["rope", "dart", "special"], ["rope", "special"], ["unfettered", "special"], ["mortal", "special"]] },
  { type: "Rope Charged", patterns: [["rope", "dart", "charged"], ["rope", "charge"], ["unfettered", "charged"], ["mortal", "charged"]] },
  { type: "Sword Martial", patterns: [["sword", "martial"], ["thundercry", "martial"], ["nameless", "sword", "martial"], ["strategic", "martial"], ["snowparting", "martial"]], exclude: [["twinblade"], ["twin"]] },
  { type: "Sword Special", patterns: [["sword", "special"], ["thundercry", "special"], ["nameless", "sword", "special"], ["strategic", "special"], ["snowparting", "special"]], exclude: [["twinblade"], ["twin"]] },
  { type: "Sword Charged", patterns: [["sword", "charged"], ["thundercry", "charged"], ["snowparting", "charged"]], exclude: [["twinblade"], ["twin"]] },
  { type: "Spear Martial", patterns: [["spear", "martial"], ["stormbreaker", "martial"], ["heavenquaker", "martial"], ["phalanxbane", "martial"]] },
  { type: "Spear Special", patterns: [["spear", "special"], ["stormbreaker", "special"], ["heavenquaker", "special"]] },
  { type: "Spear Charged", patterns: [["spear", "charged"], ["stormbreaker", "charged"], ["heavenquaker", "charged"]] },
  { type: "Fan Martial", patterns: [["fan", "martial"], ["panacea", "martial"], ["inkwell", "martial"]] },
  { type: "Fan Special", patterns: [["fan", "special"], ["panacea", "special"], ["inkwell", "special"]] },
  { type: "Fan Charged", patterns: [["fan", "charged"], ["panacea", "charged"], ["inkwell", "charged"]] },
  { type: "Twinblades Martial", patterns: [["twinblade", "martial"], ["twin", "blade", "martial"], ["infernal", "martial"]] },
  { type: "Twinblades Special", patterns: [["twinblade", "special"], ["twin", "blade", "special"], ["infernal", "special"]] },
  { type: "Twinblades Charged", patterns: [["twinblade", "charged"], ["twin", "blade", "charged"], ["infernal", "charged"]] },
  { type: "Modao Martial", patterns: [["modao", "martial"]] },
  { type: "Modao Special", patterns: [["modao", "special"]] },
  { type: "Modao Charged", patterns: [["modao", "charged"]] },
  { type: "Hengdao Martial", patterns: [["hengdao", "martial"]] },
  { type: "Hengdao Special", patterns: [["hengdao", "special"]] },
  { type: "Hengdao Charged", patterns: [["hengdao", "charged"]] },
  { type: "Gauntlets Martial", patterns: [["gauntlet", "martial"]] },
  { type: "Gauntlets Special", patterns: [["gauntlet", "special"]] },
  { type: "Gauntlets Charged", patterns: [["gauntlet", "charged"]] },
  // ── Global T96 weapon attribute lines ──
  // Weapons use the universal Void Attack label. Relics/armor retain their
  // Bamboocut/Silkbind/Bellstrike/Stonesplit labels and are matched below.
  {
    type: "Max Void Atk",
    patterns: [["max", "void"], ["maximum", "void"], ["void", "max"], ["最大", "无相"]],
  },
  {
    type: "Min Void Atk",
    patterns: [["min", "void"], ["minimum", "void"], ["void", "min"], ["最小", "无相"]],
  },
  // ── Boss / Group / Single Target ──
  {
    type: "Boss DMG%",
    patterns: [["boss", "dmg"], ["boss", "damage"], ["首领"], ["combat", "boost", "boss"], ["boss", "unit"], ["boss", "boost"], ["combat", "boss"], ["combat", "boost"]]
  },
  // ── General stats ──
  {
    type: "Physical Penetration",
    patterns: [["physical", "penetration"], ["破防"], ["破甲"], ["外功", "穿透"], ["xuyên"], ["phá giáp"], ["pen", "phys"], ["pen", "attack"]],
    exclude: [["破竹"], ["bamboo"], ["phá trúc"], ["silkbind"], ["bellstrike"], ["stonesplit"], ["tâm pháp"]]
  },
  {
    type: "Max Formless Attack",
    patterns: [["max", "formless", "attack"], ["maximum", "formless", "attack"]],
  },
  {
    type: "Max Physical Attack",
    patterns: [["max", "attack"], ["max", "phys"], ["maximum", "physical"], ["tối đa", "ngoại"], ["tối đa", "công"], ["最大", "外功"]],
    exclude: [["formless"], ["破竹"], ["bamboo"], ["phá trúc"], ["silkbind"], ["bellstrike"], ["stonesplit"], ["tâm pháp"], ["umbrella"], ["everspring"], ["soulshade"], ["vernal"], ["combat", "boost"], ["boss"]]
  },
  {
    type: "Min Physical Attack",
    patterns: [["min", "attack"], ["min", "phys"], ["tối thiểu", "ngoại"], ["tối thiểu", "công"], ["最小", "外功"]],
    exclude: [["破竹"], ["bamboo"], ["phá trúc"], ["silkbind"], ["bellstrike"], ["stonesplit"], ["tâm pháp"]]
  },
  {
    type: "Max Silkbind Atk",
    patterns: [["max", "silkbind"], ["silkbind", "max"], ["turn", "silkbind"], ["maximum", "silkbind"], ["最大", "牵丝"]],
  },
  {
    type: "Min Silkbind Atk",
    patterns: [["min", "silkbind"], ["silkbind", "min"], ["silkbind", "attack"], ["最小", "牵丝"]],
  },
  {
    type: "Silkbind Pen",
    patterns: [["silkbind", "pen"], ["牵丝", "穿透"]],
  },
  {
    type: "Crit Rate",
    patterns: [["crit rate"], ["crit", "rate"], ["hội tâm"], ["会心"]],
    exclude: [["伤害"], ["sát thương"], ["dmg"], ["damage"], ["hội thương"], ["加成"], ["umbrella"], ["everspring"], ["soulshade"], ["vernal"], ["boost"], ["martial"]]
  },
  {
    type: "Crit DMG",
    patterns: [["crit", "dmg"], ["crit", "damage"], ["hội thương"], ["会心伤害"], ["hội tâm", "sát thương"]]
  },
  {
    type: "Affinity Rate",
    patterns: [["affinity", "rate"], ["affinity"], ["thức phá"], ["识破"]],
    exclude: [["sát thương"], ["dmg"], ["damage"], ["伤害"], ["加成"]]
  },
  {
    type: "Affinity DMG",
    patterns: [["affinity", "dmg"], ["affinity", "damage"], ["thức phá", "sát thương"], ["识破伤害"]]
  },
  {
    type: "Bamboocut Pen",
    patterns: [["bamboo", "pen"], ["破竹", "破防"], ["破竹", "穿透"], ["phá trúc", "xuyên"]]
  },
  {
    type: "Bamboocut DMG%",
    patterns: [["bamboo", "dmg"], ["bamboo", "damage"], ["破竹", "伤害"], ["phá trúc", "sát thương"]]
  },
  {
    type: "Precision",
    patterns: [["precision"], ["chính xác"], ["精准"], ["业准"]]
  },
  {
    type: "Agility",
    patterns: [["agility"], ["thân pháp"], ["身法"]],
    exclude: [["umbrella"], ["everspring"], ["soulshade"], ["vernal"], ["boost"], ["martial"]]
  },
  {
    type: "Power",
    patterns: [["power"], ["lực lượng"], ["力量"]]
  },
  {
    type: "Strength",
    patterns: [["strength"], ["sức mạnh"], ["劲力"]],
    exclude: [["power"]]
  },
  {
    type: "Momentum",
    patterns: [["momentum"], ["thế năng"], ["势能"]]
  },
  {
    type: "HP",
    patterns: [["constitution"], ["thể chất"], ["体质"]]
  },
  {
    type: "Defense",
    patterns: [["defense"], ["phòng ngự"], ["防御"]]
  },
  {
    type: "Phys DMG%",
    patterns: [["phys", "dmg"], ["physical", "damage", "bonus"], ["外功伤害"]],
    exclude: [["reduction"]]
  },
  {
    type: "Phys Resist",
    patterns: [["physical", "resistance"], ["phys", "resist"], ["物理抗性"], ["vật lý kháng"]],
    exclude: [["penetration"], ["pen"]]
  },
  {
    type: "Phys DMG Reduction",
    patterns: [["physical", "reduction"], ["phys", "reduction"], ["物理减伤"]]
  },
  {
    type: "Direct Crit",
    patterns: [["direct", "crit"], ["直接会心"]],
    exclude: [["dmg"], ["damage"]]
  },
  {
    type: "Group Anomaly DMG",
    patterns: [["group", "anomaly"], ["群体", "异常"], ["group", "dmg"]]
  },
  {
    type: "Single Target DMG",
    patterns: [["single", "target"], ["单体", "控制"], ["single", "control"]]
  },
  {
    type: "All Martial Arts",
    patterns: [["all", "martial"], ["all", "weapon"], ["all", "arts"], ["万法"]]
  },
  {
    type: "Min Bamboocut Atk",
    patterns: [["min", "bamboo"], ["bamboo", "min"], ["最小", "破竹"]],
  },
  {
    type: "Max Bamboocut Atk",
    patterns: [["max", "bamboo"], ["bamboo", "max"], ["maximum", "bamboo"], ["最大", "破竹"]],
  },
  {
    type: "Max Bellstrike Atk",
    patterns: [["max", "bellstrike"], ["bellstrike", "max"], ["maximum", "bellstrike"], ["最大", "鸣金"]],
  },
  {
    type: "Min Bellstrike Atk",
    patterns: [["min", "bellstrike"], ["bellstrike", "min"], ["最小", "鸣金"]],
  },
  {
    type: "Bellstrike Pen",
    patterns: [["bellstrike", "pen"], ["鸣金", "穿透"]],
  },
  {
    type: "Bellstrike DMG%",
    patterns: [["bellstrike", "dmg"], ["bellstrike", "damage"]],
  },
  {
    type: "Max Stonesplit Atk",
    patterns: [["max", "stonesplit"], ["stonesplit", "max"], ["maximum", "stonesplit"], ["最大", "裂石"]],
  },
  {
    type: "Min Stonesplit Atk",
    patterns: [["min", "stonesplit"], ["stonesplit", "min"], ["最小", "裂石"]],
  },
  {
    type: "Stonesplit Pen",
    patterns: [["stonesplit", "pen"], ["裂石", "穿透"]],
  },
  {
    type: "Stonesplit DMG%",
    patterns: [["stonesplit", "dmg"], ["stonesplit", "damage"]],
  },
  {
    type: "Silkbind DMG%",
    patterns: [["silkbind", "dmg"], ["silkbind", "damage"]],
  },
  // Unified attribute/formless penetration (patch 4.30: 无相穿透). Maps to pzPen
  // via SUB_MAP. CN-only tokens so it doesn't collide with Phys Pen's English
  // "penetration" match; element pens above are matched first by element name.
  { type: "Formless Penetration", patterns: [["formless", "penetration"]] },
  {
    type: "Formless Penetration",
    patterns: [["无相", "穿透"], ["属性", "穿透"]],
  },
];

const OCR_CANONICAL_TYPES: Record<string, string> = {
  "Umb Martial": "Umb Martial Art Skill DMG Boost",
  "Umb Special": "Umb Special Skill DMG Boost",
  "Umb Charged": "Umb Charged Skill DMG Boost",
  "Rope Martial": "Rope Dart Martial Art Skill DMG Boost",
  "Rope Special": "Rope Dart Special Skill DMG Boost",
  "Rope Charged": "Rope Dart Charged Skill DMG Boost",
  "Sword Martial": "Sword Martial Art Skill DMG Boost",
  "Sword Special": "Sword Special Skill DMG Boost",
  "Sword Charged": "Sword Charged Skill DMG Boost",
  "Spear Martial": "Spear Martial Art Skill DMG Boost",
  "Spear Special": "Spear Special Skill DMG Boost",
  "Spear Charged": "Spear Charged Skill DMG Boost",
  "Fan Martial": "Fan Martial Art Skill DMG Boost",
  "Fan Special": "Fan Special Skill DMG Boost",
  "Fan Charged": "Fan Charged Skill DMG Boost",
  "Twinblades Martial": "Dual Blades Martial Art Skill DMG Boost",
  "Twinblades Special": "Dual Blades Special Skill DMG Boost",
  "Twinblades Charged": "Dual Blades Charged Skill DMG Boost",
  "Modao Martial": "Mo Blade Martial Art Skill DMG Boost",
  "Modao Special": "Mo Blade Special Skill DMG Boost",
  "Modao Charged": "Mo Blade Charged Skill DMG Boost",
  "Hengdao Martial": "Heng Blade Martial Art Skill DMG Boost",
  "Hengdao Special": "Heng Blade Special Skill DMG Boost",
  "Hengdao Charged": "Heng Blade Charged Skill DMG Boost",
  "Gauntlets Martial": "Gauntlets Martial Art Skill DMG Boost",
  "Gauntlets Special": "Gauntlets Special Skill DMG Boost",
  "Gauntlets Charged": "Gauntlets Charged Skill DMG Boost",
};

const canonicalOcrType = (type: string): string => OCR_CANONICAL_TYPES[type] ?? type;

const isRetunedStatLine = (lcLine: string): boolean => {
  // Attunement (weapon-specific skill bonus) and Retuning are separate systems.
  // The Global client exposes retuned lines as [Turn] / Retuned. Never infer a
  // retuned line from an Attunement word or decorative diamond/star glyph.
  if (lcLine.includes("attun")) return false;
  return /\bturn\b/.test(lcLine)
    || /\btuned\b/.test(lcLine)
    || /\bretun(?:e|ed|ing)\b/.test(lcLine)
    || lcLine.includes("định âm")
    || lcLine.includes("dingyin")
    || lcLine.includes("定音");
};

export const matchStatType = (lcLine: string): string => {
  for (const rule of STAT_PATTERNS) {
    if (rule.exclude) {
      const excluded = rule.exclude.some(ex => ex.every(kw => lcLine.includes(kw)));
      if (excluded) continue;
    }
    const matched = rule.patterns.some(group =>
      group.every(kw => fuzzyContains(lcLine, kw))
    );
    if (matched) return canonicalOcrType(rule.type);
  }
  return "";
};

export const parseSubStats = (text: string): OcrSub[] => {
  console.log("[OCR] Raw text:\n", text);

  // Lock every confidently recognized Global-English label/value span, recover
  // only unresolved numeric rows from local non-numeric continuation context,
  // then merge by source order. Unlike the old all-or-nothing exact parser,
  // five correct rows are never discarded just because the sixth label is OCR-
  // damaged. Numeric row anchors prevent a wrapped Boss label from consuming
  // the following Power value. Decimal repair remains percentage-family scoped.
  const hybridGlobalRows = parseHybridGlobalEnglishRows(text);
  if (hybridGlobalRows.length >= 5) {
    const hybrid: OcrSub[] = hybridGlobalRows.map(({
      type, val, isTuned, isRetuned, role, sourceOrder, attunementId, displayName,
    }) => ({ type, val, isTuned, isRetuned, role, sourceOrder, attunementId, displayName }));
    console.log("[OCR] Hybrid Global English rows:", hybrid);
    return hybrid;
  }
  const rawLines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const parsedSubs: OcrSub[] = [];

  const cleanNum = (str: string) => {
    const match = str.match(/\d+(?:\.\d+)?/);
    return match ? match[0] : "";
  };

  // Join adjacent lines for multi-line stat names (e.g. weapon-specific skill DMG boosts)
  const lines: string[] = [];
  lineJoin: for (let i = 0; i < rawLines.length; i++) {
    const hasNum = /\d+(?:\.\d+)/.test(rawLines[i]);
    const hasStat = matchStatType(rawLines[i].toLowerCase()) !== "";

    // Game UI often puts the value on the FIRST visual line of a wrapped
    // Attunement label, e.g. "Everspring Umbrella - 5.3%" followed by
    // "Martial Art Skill DMG" / "Boost". The old parser only joined forward
    // when the first line had no number, so 5.3 could be borrowed by the
    // previous Bamboocut/Physical Attack line. Complete the label before
    // classification and never cross into another numeric row.
    if (hasNum && !hasStat) {
      let joined = rawLines[i];
      for (let j = 1; j <= 3 && i + j < rawLines.length; j++) {
        if (/\d+(?:\.\d+)/.test(rawLines[i + j])) break;
        joined += " " + rawLines[i + j];
        if (matchStatType(joined.toLowerCase()) !== "") {
          lines.push(joined);
          i += j;
          continue lineJoin;
        }
      }
    }

    if (hasStat && !hasNum && i + 1 < rawLines.length && /\d+(?:\.\d+)/.test(rawLines[i + 1])) {
      lines.push(rawLines[i] + " " + rawLines[i + 1]);
      i++;
    } else if (!hasStat && !hasNum && i + 1 < rawLines.length) {
      // No stat match — try joining 2-4 lines to form a stat name + value
      let joined = rawLines[i];
      let skip = 0;
      for (let j = 1; j <= 3 && i + j < rawLines.length; j++) {
        joined += " " + rawLines[i + j];
        const joinedHasStat = matchStatType(joined.toLowerCase()) !== "";
        const joinedHasNum = /\d+(?:\.\d+)/.test(joined);
        if (joinedHasStat && joinedHasNum) {
          skip = j;
          break;
        }
        if (joinedHasStat && !joinedHasNum && i + j + 1 < rawLines.length && /\d+(?:\.\d+)/.test(rawLines[i + j + 1])) {
          joined += " " + rawLines[i + j + 1];
          skip = j + 1;
          break;
        }
      }
      if (skip > 0) {
        lines.push(joined);
        i += skip;
      } else {
        lines.push(rawLines[i]);
      }
    } else {
      lines.push(rawLines[i]);
    }
  }

  console.log("[OCR] Joined lines:", lines);

  for (const line of lines) {
    const lcLine = line.toLowerCase().replace(/[|[\]{}()]/g, " ");
    const valueMatch = line.match(/\d+(?:\.\d+)?%?/);
    if (!valueMatch) continue;
    const valStr = cleanNum(valueMatch[0]);
    if (!valStr || parseFloat(valStr) === 0) continue;

    const numVal = parseFloat(valStr);
    if (numVal >= 500 && numVal <= 999 && !valStr.includes(".")) continue;

    const matchedType = matchStatType(lcLine);
    console.log("[OCR] Line:", JSON.stringify(line), "→", matchedType || "(no match)", "val:", valStr);

    if (matchedType) {
      const isTuned = isRetunedStatLine(lcLine);
      parsedSubs.push({ type: matchedType, val: valStr, isTuned });
    }
  }

  // Second pass: try joining consecutive unmatched lines with already-matched ones
  const unmatchedWithNums: { line: string; val: string; idx: number }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const lc = lines[i].toLowerCase().replace(/[|[\]{}()]/g, " ");
      const vm = lines[i].match(/\d+(?:\.\d+)?%?/);
      if (!vm) continue;
      const v = cleanNum(vm[0]);
      const n = parseFloat(v);
      if (!v || n === 0 || (n >= 500 && n <= 999 && !v.includes("."))) continue;
      if (matchStatType(lc)) continue; // already matched
      unmatchedWithNums.push({ line: lines[i], val: v, idx: i });
    }
  for (const um of unmatchedWithNums) {
      // A value may be emitted on its own line after a wrapped label. Look
      // back up to three NON-NUMERIC continuation lines, but never cross a
      // previous stat row that already contains a value.
      for (let back = 1; back <= 3 && um.idx - back >= 0; back++) {
        const contextLines = lines.slice(um.idx - back, um.idx + 1);
        if (contextLines.slice(0, -1).some((entry) => /\d+(?:\.\d+)/.test(entry))) continue;
        const combined = contextLines.join(" ");
        const lcCombined = combined.toLowerCase().replace(/[|[\]{}()]/g, " ");
        const mType = matchStatType(lcCombined);
        if (mType) {
          const isTuned = isRetunedStatLine(lcCombined);
          console.log("[OCR] 2nd pass joined:", JSON.stringify(combined), "→", mType);
          parsedSubs.push({ type: mType, val: um.val, isTuned });
          break;
        }
      }
  }

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

  return applyGearRowSemantics(parsedSubs) as OcrSub[];
};

export const parseMastery = (text: string): string => {
  const lines = text.split("\n");
  // Pass 1: look for explicit "mastery" keyword
  for (const line of lines) {
    const lcLine = line.toLowerCase();
    if (lcLine.includes("mastery") || lcLine.includes("chế bực") || lcLine.includes("chế ngự") || lcLine.includes("制御") || lcLine.includes("精工")) {
      const match = line.match(/\b\d{3,4}\b/);
      if (match) return match[0];
    }
  }
  // Pass 2: look for standalone 3-digit number (600-900 range) on its own line or near top
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(/^\d{3}$/);
    if (match) {
      const val = parseInt(match[0]);
      if (val >= 500 && val <= 900) return match[0];
    }
  }
  return "";
};

export const preprocessImage = (objectUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(objectUrl); return; }

      const scale = Math.max(1, Math.min(3, 1500 / img.naturalWidth));
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const w = canvas.width, h = canvas.height;
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          let gray = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]);
          gray = Math.min(255, Math.max(0, Math.round((gray - 80) * (255 / 140))));
          d[i] = gray; d[i+1] = gray; d[i+2] = gray;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch { resolve(objectUrl); }
    };
    img.onerror = () => resolve(objectUrl);
    img.src = objectUrl;
  });
};

const scoreOcrParse = (text: string, subs: OcrSub[]): number => {
  const recognized = subs.filter((sub) => sub.type !== "Other" && sub.val);
  let score = recognized.length * 100;
  const lc = text.toLowerCase();

  const expectedWeaponSignals: { tokens: string[]; type: string }[] = [
    { tokens: ["everspring", "martial"], type: "Umb Martial Art Skill DMG Boost" },
    { tokens: ["umbrella", "martial"], type: "Umb Martial Art Skill DMG Boost" },
    { tokens: ["rope", "dart", "martial"], type: "Rope Dart Martial Art Skill DMG Boost" },
  ];
  for (const signal of expectedWeaponSignals) {
    if (signal.tokens.every((token) => lc.includes(token))) {
      score += recognized.some((sub) => sub.type === signal.type) ? 40 : -80;
    }
  }

  // Flat attack rolls are tens of points at current/legacy endgame tiers. A
  // single-digit value classified as an Attack line is a strong sign that a
  // nearby percentage Attunement value was attached to the wrong label.
  for (const sub of recognized) {
    const value = Number(sub.val);
    if (/ (?:Phys|Void|Bamboocut|Silkbind|Bellstrike|Stonesplit) Atk$/.test(sub.type) && value > 0 && value < 12) {
      score -= 60;
    }
  }
  return score;
};

export const runDualPassOcr = async (
  worker: any,
  objectUrl: string,
  onProgress?: (msg: string) => void
): Promise<{ subs: OcrSub[]; mastery: string; bestText: string }> => {
  // Configure Tesseract for game UI text
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: "6", // Assume single uniform block of text
      preserve_interword_spaces: "1",
    });
  } catch { /* older API may not support */ }

  // Pass 1: raw image (upscaled)
  onProgress?.("OCR Pass 1 (raw)...");
  const upscaledUrl = await upscaleImage(objectUrl);
  const rawBlob = await fetch(upscaledUrl).then(r => r.blob());
  const { data: { text: rawText } } = await worker.recognize(rawBlob);
  console.log("[OCR] Pass 1 raw:", rawText);
  let subs = parseSubStats(rawText);
  let bestText = rawText;
  const rawMatched = subs.filter(s => s.type !== "Other").length;
  let bestQuality = scoreOcrParse(rawText, subs);

  // Pass 2 also runs when six rows were found but semantic confidence is low;
  // previously a wrong sixth row stopped OCR before enhanced passes could help.
  if (rawMatched < 6 || bestQuality < 600) {
    onProgress?.("OCR Pass 2 (enhanced)...");
    const processedUrl = await preprocessImage(objectUrl);
    const procBlob = await fetch(processedUrl).then(r => r.blob());
    const { data: { text: procText } } = await worker.recognize(procBlob);
    console.log("[OCR] Pass 2 enhanced:", procText);
    const procSubs = parseSubStats(procText);
    const procMatched = procSubs.filter(s => s.type !== "Other").length;
    const procQuality = scoreOcrParse(procText, procSubs);
    if (procQuality > bestQuality || (procQuality === bestQuality && procMatched > rawMatched)) {
      subs = procSubs;
      bestText = procText;
      bestQuality = procQuality;
    }
  }

  // Pass 3: high-contrast binarized when rows are missing or confidence remains low.
  const bestMatched = subs.filter(s => s.type !== "Other").length;
  if (bestMatched < 6 || bestQuality < 600) {
    onProgress?.("OCR Pass 3 (binarized)...");
    const binUrl = await binarizeImage(objectUrl);
    const binBlob = await fetch(binUrl).then(r => r.blob());
    const { data: { text: binText } } = await worker.recognize(binBlob);
    console.log("[OCR] Pass 3 binarized:", binText);
    const binSubs = parseSubStats(binText);
    const binMatched = binSubs.filter(s => s.type !== "Other").length;
    const binQuality = scoreOcrParse(binText, binSubs);
    if (binQuality > bestQuality || (binQuality === bestQuality && binMatched > bestMatched)) {
      subs = binSubs;
      bestText = binText;
      bestQuality = binQuality;
    }
  }

  const mastery = parseMastery(bestText);
  return { subs, mastery, bestText };
};

const upscaleImage = (objectUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(objectUrl); return; }
      const scale = Math.max(1, Math.min(4, 2000 / img.naturalWidth));
      if (scale <= 1.1) { resolve(objectUrl); return; }
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(objectUrl);
    img.src = objectUrl;
  });
};

const binarizeImage = (objectUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(objectUrl); return; }
      const scale = Math.max(1, Math.min(4, 2000 / img.naturalWidth));
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        const w = canvas.width, h = canvas.height;
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]);
          const val = gray < 140 ? 0 : 255;
          d[i] = val; d[i+1] = val; d[i+2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch { resolve(objectUrl); }
    };
    img.onerror = () => resolve(objectUrl);
    img.src = objectUrl;
  });
};
