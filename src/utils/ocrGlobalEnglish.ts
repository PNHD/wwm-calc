import {
  applyGearRowSemantics,
  matchWeaponAttunementText,
  type GearSubRole,
} from "../data/gearAttunement.ts";
import { CURRENT_WEAPON_ART_LABELS } from "../data/gearStatCatalog.ts";

export interface GlobalEnglishOcrSub {
  type: string;
  val: string;
  isTuned?: boolean;
  isRetuned?: boolean;
  role?: GearSubRole;
  sourceOrder?: number;
  attunementId?: string;
  displayName?: string;
  sourceIndex: number;
  sourceEnd: number;
}

type PatternRule = {
  type: string;
  regex: RegExp;
  valueGroup: number;
  turnGroup?: number;
  percentLike?: boolean;
};

const PERCENT_MAX: Record<string, number> = {
  "Crit Rate": 12,
  "Crit DMG": 25,
  "Affinity Rate": 8,
  "Affinity DMG": 25,
  "Precision": 12,
  "Boss DMG%": 5,
  "Phys DMG%": 12,
  "Bamboocut DMG%": 12,
  "Silkbind DMG%": 12,
  "Bellstrike DMG%": 12,
  "Stonesplit DMG%": 12,
  "Umb Martial Art Skill DMG Boost": 8,
  ...Object.fromEntries(CURRENT_WEAPON_ART_LABELS.map((type) => [type, 8])),
};

const PERCENT_LIKE_TYPES = new Set(Object.keys(PERCENT_MAX));

const normalizeNumber = (type: string, rawValue: string, percentLike = false): string => {
  const cleaned = rawValue.replace(",", ".").replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return "";

  // Tesseract can drop the decimal separator in compact percentage rolls.
  // Repair only known percentage-like families and only when the repaired value
  // is plausible for that family at current/legacy endgame tiers. Flat attack,
  // Power, Agility, Momentum, etc. are never divided by ten here.
  const maxPlausible = PERCENT_MAX[type]
    ?? (type.includes("Martial Art Skill DMG Boost") ? 8 : undefined);
  const repaired = value / 10;
  const shouldRepairDroppedDecimal = (percentLike || PERCENT_LIKE_TYPES.has(type))
    && !cleaned.includes(".")
    && value >= 20
    && value < 100
    && Number.isFinite(maxPlausible)
    && repaired <= maxPlausible;
  if (shouldRepairDroppedDecimal) return repaired.toFixed(1);
  return cleaned;
};

const ART_OF_RULES: PatternRule[] = CURRENT_WEAPON_ART_LABELS.map((type) => {
  const weapon = type.slice("Art of ".length, -" DMG Boost".length).replace(/\s+/g, "\\s+");
  return {
    type,
    regex: new RegExp(`(\\[\\s*turn\\s*\\])?\\s*art\\s+of\\s+${weapon}\\s+dmg\\s+boost\\s*[:\\-]?\\s*(\\d{1,3}(?:[.,]\\d+)?)\\s*%?`, "gi"),
    valueGroup: 2,
    turnGroup: 1,
    percentLike: true,
  };
});

const RULES: PatternRule[] = [
  ...ART_OF_RULES,
  {
    type: "Max Formless Attack",
    regex: /(\[\s*turn\s*\])?\s*max(?:imum)?\s+formless\s+attack\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Physical Penetration",
    regex: /(\[\s*turn\s*\])?\s*(?:physical\s+penetration|phys(?:ical)?\s+pen(?:etration)?)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Max Physical Attack",
    regex: /(\[\s*turn\s*\])?\s*(?:max(?:imum)?\s+physical\s+attack|max\s+phys(?:ical)?\s+atk)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Min Physical Attack",
    regex: /(\[\s*turn\s*\])?\s*(?:min(?:imum)?\s+physical\s+attack|min\s+phys(?:ical)?\s+atk)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Max Void Atk",
    regex: /(\[\s*turn\s*\])?\s*(?:max(?:imum)?\s+void\s+attack|max\s+void\s+atk)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Min Void Atk",
    regex: /(\[\s*turn\s*\])?\s*(?:min(?:imum)?\s+void\s+attack|min\s+void\s+atk)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Max Bamboocut Atk",
    regex: /(\[\s*turn\s*\])?\s*(?:max(?:imum)?\s+bamboocut\s+attack|max\s+bamboocut\s+atk)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Min Bamboocut Atk",
    regex: /(\[\s*turn\s*\])?\s*(?:min(?:imum)?\s+bamboocut\s+attack|min\s+bamboocut\s+atk)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Power",
    regex: /(\[\s*turn\s*\])?\s*\bpower\b\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Agility",
    regex: /(\[\s*turn\s*\])?\s*\bagility\b\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Momentum",
    regex: /(\[\s*turn\s*\])?\s*\bmomentum\b\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Strength",
    regex: /(\[\s*turn\s*\])?\s*\bstrength\b\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Crit Rate",
    regex: /(\[\s*turn\s*\])?\s*(?:critical\s+rate|crit\s+rate)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%?/gi,
    valueGroup: 2,
    turnGroup: 1,
    percentLike: true,
  },
  {
    type: "Precision",
    regex: /(\[\s*turn\s*\])?\s*(?:precision(?:\s+rate)?)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%?/gi,
    valueGroup: 2,
    turnGroup: 1,
    percentLike: true,
  },
  {
    type: "Affinity Rate",
    regex: /(\[\s*turn\s*\])?\s*(?:affinity(?:\s+rate)?)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%?/gi,
    valueGroup: 2,
    turnGroup: 1,
    percentLike: true,
  },
  {
    type: "Boss DMG%",
    regex: /(\[\s*turn\s*\])?\s*combat\s+boost\s+against\s+boss\s+units\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%?/gi,
    valueGroup: 2,
    turnGroup: 1,
    percentLike: true,
  },
  {
    type: "Boss DMG%",
    regex: /(\[\s*turn\s*\])?\s*combat\s+boost\s+against\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%?\s*boss\s+units/gi,
    valueGroup: 2,
    turnGroup: 1,
    percentLike: true,
  },
  {
    type: "Umb Martial Art Skill DMG Boost",
    regex: /everspring\s+umbrella\s*[-–—:]?\s*martial\s+art\s+skill\s+dmg(?:\s+boost)?\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%?/gi,
    valueGroup: 1,
    percentLike: true,
  },
  {
    type: "Umb Martial Art Skill DMG Boost",
    regex: /everspring\s+umbrella\s*[-–—:]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%?[\s\S]{0,72}?martial\s+art\s+skill\s+dmg(?:\s+boost)?/gi,
    valueGroup: 1,
    percentLike: true,
  },
];

const normalizeText = (text: string): string => text
  .replace(/\r\n?/g, "\n")
  .replace(/[‐‑‒]/g, "-")
  .replace(/\t/g, " ");

export const parseGlobalEnglishStatSpans = (text: string): GlobalEnglishOcrSub[] => {
  const normalized = normalizeText(text);
  const matches: GlobalEnglishOcrSub[] = [];

  for (const rule of RULES) {
    rule.regex.lastIndex = 0;
    for (const match of normalized.matchAll(rule.regex)) {
      const rawValue = match[rule.valueGroup] ?? "";
      const val = normalizeNumber(rule.type, rawValue, rule.percentLike);
      if (!val) continue;
      const sourceIndex = match.index ?? 0;
      matches.push({
        type: rule.type,
        val,
        isTuned: rule.turnGroup ? Boolean(match[rule.turnGroup]) : false,
        sourceIndex,
        sourceEnd: sourceIndex + match[0].length,
      });
    }
  }

  matches.sort((a, b) => a.sourceIndex - b.sourceIndex || b.sourceEnd - a.sourceEnd);
  const deduped: GlobalEnglishOcrSub[] = [];
  for (const candidate of matches) {
    const duplicate = deduped.some((existing) =>
      existing.type === candidate.type
      && existing.val === candidate.val
      && Math.abs(existing.sourceIndex - candidate.sourceIndex) < 12,
    );
    if (!duplicate) deduped.push(candidate);
  }
  const semantic = applyGearRowSemantics(deduped) as GlobalEnglishOcrSub[];
  semantic.forEach((row, index) => {
    row.sourceOrder = index;
    if (row.role !== "attunement") return;
    row.isRetuned = false;
    row.isTuned = false;
    const context = normalized.slice(row.sourceIndex, Math.min(normalized.length, row.sourceEnd + 96));
    const definition = matchWeaponAttunementText(context);
    if (definition) {
      row.attunementId = definition.id;
      row.displayName = definition.displayName;
    }
  });
  return semantic;
};

type SourceLine = {
  text: string;
  start: number;
  end: number;
  numericStart?: number;
  rawValue?: string;
};

const linesWithOffsets = (text: string): SourceLine[] => {
  const normalized = normalizeText(text);
  const lines: SourceLine[] = [];
  let offset = 0;
  for (const line of normalized.split("\n")) {
    // OCR damage can introduce digits inside a label (e.g. P0wer). The game
    // value is the trailing numeric token on the visual row, so anchor on the
    // last token instead of the first digit-like token in the line.
    const valueMatches = [...line.matchAll(/\d{1,3}(?:[.,]\d+)?%?/g)];
    const valueMatch = valueMatches[valueMatches.length - 1];
    const numericStart = valueMatch?.index === undefined ? undefined : offset + valueMatch.index;
    lines.push({
      text: line.trim(),
      start: offset,
      end: offset + line.length,
      numericStart,
      rawValue: valueMatch?.[0],
    });
    offset += line.length + 1;
  }
  return lines;
};

const isCovered = (position: number, rows: GlobalEnglishOcrSub[]): boolean =>
  rows.some((row) => position >= row.sourceIndex && position < row.sourceEnd);

const normalizeLabel = (value: string): string => value
  .toLowerCase()
  .replace(/0/g, "o")
  .replace(/1/g, "i")
  .replace(/[^a-z]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const hasAll = (label: string, words: string[]): boolean => words.every((word) => label.includes(word));

const classifyUnresolvedEnglishRow = (context: string): {
  type: string;
  percentLike?: boolean;
  role?: GearSubRole;
  attunementId?: string;
  displayName?: string;
} | null => {
  const label = normalizeLabel(context);
  if (!label) return null;

  const attunement = matchWeaponAttunementText(context);
  if (attunement) {
    return {
      type: attunement.statKey,
      percentLike: true,
      role: "attunement",
      attunementId: attunement.id,
      displayName: attunement.displayName,
    };
  }

  if (hasAll(label, ["everspring", "umbrella"]) && hasAll(label, ["martial", "art", "skill", "dmg"])) {
    return { type: "Umb Martial Art Skill DMG Boost", percentLike: true };
  }
  if (hasAll(label, ["combat", "boost", "boss"]) || hasAll(label, ["boss", "units"])) {
    return { type: "Boss DMG%", percentLike: true };
  }
  const artType = CURRENT_WEAPON_ART_LABELS.find((type) => {
    const words = type.toLowerCase().replace("dmg boost", "").split(/\s+/).filter(Boolean);
    return hasAll(label, [...words, "dmg", "boost"]);
  });
  if (artType) return { type: artType, percentLike: true };
  if (hasAll(label, ["max", "formless", "attack"])) return { type: "Max Formless Attack" };
  if (hasAll(label, ["physical", "penetration"]) || hasAll(label, ["phys", "pen"])) {
    return { type: "Physical Penetration" };
  }
  if (hasAll(label, ["max", "physical", "attack"]) || hasAll(label, ["max", "phys", "atk"])) {
    return { type: "Max Physical Attack" };
  }
  if (hasAll(label, ["min", "physical", "attack"]) || hasAll(label, ["min", "phys", "atk"])) {
    return { type: "Min Physical Attack" };
  }
  if (hasAll(label, ["critical", "rate"]) || hasAll(label, ["crit", "rate"])) {
    return { type: "Crit Rate", percentLike: true };
  }
  if (label.includes("precision")) return { type: "Precision", percentLike: true };
  if (label.includes("affinity")) return { type: "Affinity Rate", percentLike: true };
  if (label.includes("agility")) return { type: "Agility" };
  if (label.includes("momentum")) return { type: "Momentum" };
  if (label.includes("strength")) return { type: "Strength" };
  if (label.includes("power") || label.includes("povver") || label.includes("pwer")) return { type: "Power" };
  return null;
};

const explicitRetuned = (context: string): boolean => {
  const lc = context.toLowerCase();
  if (lc.includes("attun")) return false;
  return /\[\s*turn\s*\]/i.test(context)
    || /\bretun(?:e|ed|ing)\b/i.test(context)
    || /\btuned\b/i.test(context);
};

const overlaps = (a: GlobalEnglishOcrSub, b: GlobalEnglishOcrSub): boolean =>
  a.sourceIndex < b.sourceEnd && b.sourceIndex < a.sourceEnd;

/**
 * Hybrid Global-English parser used by browser OCR.
 *
 * 1. Lock every confidently recognized exact label/value span.
 * 2. Treat each remaining numeric visual line as the anchor of at most one row.
 * 3. Build local context only from adjacent NON-numeric continuation lines.
 *    This makes cross-row value borrowing impossible.
 * 4. Fuzzy-classify only those unresolved numeric anchors.
 * 5. Merge by source order; dedupe only overlapping parser descriptions, never
 *    by stat type, so duplicate Power rolls remain independent rows.
 */
export const parseHybridGlobalEnglishRows = (text: string): GlobalEnglishOcrSub[] => {
  const exactRows = parseGlobalEnglishStatSpans(text);
  const lines = linesWithOffsets(text);
  const recovered: GlobalEnglishOcrSub[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.numericStart === undefined || !line.rawValue) continue;
    if (isCovered(line.numericStart, exactRows)) continue;

    const contextLines: SourceLine[] = [];
    for (let back = Math.max(0, i - 3); back < i; back++) {
      const candidate = lines[back];
      if (candidate.numericStart !== undefined) continue;
      if (candidate.text && !isCovered(candidate.start, exactRows)) contextLines.push(candidate);
    }
    contextLines.push(line);
    for (let forward = i + 1; forward <= Math.min(lines.length - 1, i + 3); forward++) {
      const candidate = lines[forward];
      if (candidate.numericStart !== undefined) break;
      if (candidate.text && !isCovered(candidate.start, exactRows)) contextLines.push(candidate);
    }

    const context = contextLines.map((entry) => entry.text).join(" ");
    const classification = classifyUnresolvedEnglishRow(context);
    if (!classification) continue;

    const val = normalizeNumber(classification.type, line.rawValue, classification.percentLike);
    if (!val) continue;
    const sourceIndex = Math.min(...contextLines.map((entry) => entry.start));
    const sourceEnd = Math.max(...contextLines.map((entry) => entry.end));
    const candidate: GlobalEnglishOcrSub = {
      type: classification.type,
      val,
      isTuned: classification.role === "attunement" ? false : explicitRetuned(context),
      isRetuned: classification.role === "attunement" ? false : explicitRetuned(context),
      role: classification.role,
      attunementId: classification.attunementId,
      displayName: classification.displayName,
      sourceIndex,
      sourceEnd,
    };
    if (!exactRows.some((row) => overlaps(row, candidate))) recovered.push(candidate);
  }

  const merged = [...exactRows, ...recovered]
    .sort((a, b) => a.sourceIndex - b.sourceIndex || a.sourceEnd - b.sourceEnd);
  const deduped: GlobalEnglishOcrSub[] = [];
  for (const candidate of merged) {
    const duplicate = deduped.some((existing) =>
      overlaps(existing, candidate)
      && existing.type === candidate.type
      && existing.val === candidate.val,
    );
    if (!duplicate) deduped.push(candidate);
  }

  const semantic = applyGearRowSemantics(deduped) as GlobalEnglishOcrSub[];
  let tunedSeen = false;
  semantic.forEach((row, index) => {
    row.sourceOrder = index;
    if (row.role === "attunement") {
      row.isRetuned = false;
      row.isTuned = false;
      return;
    }
    if (!row.isRetuned) return;
    if (tunedSeen) { row.isRetuned = false; row.isTuned = false; }
    else tunedSeen = true;
  });
  return semantic;
};
