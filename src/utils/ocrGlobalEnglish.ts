export interface GlobalEnglishOcrSub {
  type: string;
  val: string;
  isTuned?: boolean;
  sourceIndex: number;
}

type PatternRule = {
  type: string;
  regex: RegExp;
  valueGroup: number;
  turnGroup?: number;
  percentLike?: boolean;
};

const PERCENT_LIKE_TYPES = new Set([
  "Crit Rate",
  "Crit DMG",
  "Affinity Rate",
  "Affinity DMG",
  "Precision",
  "Boss DMG%",
  "Phys DMG%",
  "Bamboocut DMG%",
  "Silkbind DMG%",
  "Bellstrike DMG%",
  "Stonesplit DMG%",
  "Umb Martial Art Skill DMG Boost",
]);

const normalizeNumber = (type: string, rawValue: string, percentLike = false): string => {
  const cleaned = rawValue.replace(",", ".").replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return "";

  // Tesseract occasionally drops the decimal separator in compact percentage
  // rolls: 5.2 -> 52, 2.6 -> 26, 7.3 -> 73. This is only repaired for stats
  // whose game representation is percentage-like; attack/attribute values are
  // never modified by this heuristic.
  const shouldRepairDroppedDecimal = (percentLike || PERCENT_LIKE_TYPES.has(type))
    && !cleaned.includes(".")
    && value >= 20
    && value < 100;
  if (shouldRepairDroppedDecimal) return (value / 10).toFixed(1);
  return cleaned;
};

const RULES: PatternRule[] = [
  {
    type: "Max Phys Atk",
    regex: /(\[\s*turn\s*\])?\s*(?:max(?:imum)?\s+physical\s+attack|max\s+phys(?:ical)?\s+atk)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/gi,
    valueGroup: 2,
    turnGroup: 1,
  },
  {
    type: "Min Phys Atk",
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
    // Alternate Tesseract reading: value emitted between "Against" and the
    // wrapped "Boss Units" continuation.
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
    // Common wrapped layout: "Everspring Umbrella - 5.2%" is followed by
    // "Martial Art Skill DMG" / "Boost" on later visual lines.
    type: "Umb Martial Art Skill DMG Boost",
    regex: /everspring\s+umbrella\s*[-–—:]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%?[\s\S]{0,72}?martial\s+art\s+skill\s+dmg(?:\s+boost)?/gi,
    valueGroup: 1,
    percentLike: true,
  },
];

export const parseGlobalEnglishStatSpans = (text: string): GlobalEnglishOcrSub[] => {
  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/[‐‑‒]/g, "-")
    .replace(/[ \t]+/g, " ");
  const matches: GlobalEnglishOcrSub[] = [];

  for (const rule of RULES) {
    rule.regex.lastIndex = 0;
    for (const match of normalized.matchAll(rule.regex)) {
      const rawValue = match[rule.valueGroup] ?? "";
      const val = normalizeNumber(rule.type, rawValue, rule.percentLike);
      if (!val) continue;
      matches.push({
        type: rule.type,
        val,
        isTuned: rule.turnGroup ? Boolean(match[rule.turnGroup]) : false,
        sourceIndex: match.index ?? 0,
      });
    }
  }

  // Overlapping alternate patterns can describe the same visual row. Keep the
  // earliest unique type/value/index neighborhood while preserving duplicate
  // legitimate stats such as Power 43.8 + Power 37.5 or two Crit Rate lines.
  matches.sort((a, b) => a.sourceIndex - b.sourceIndex);
  const deduped: GlobalEnglishOcrSub[] = [];
  for (const candidate of matches) {
    const duplicate = deduped.some((existing) =>
      existing.type === candidate.type
      && existing.val === candidate.val
      && Math.abs(existing.sourceIndex - candidate.sourceIndex) < 12,
    );
    if (!duplicate) deduped.push(candidate);
  }
  return deduped;
};
