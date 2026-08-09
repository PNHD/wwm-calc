import fs from "node:fs";

const path = "src/utils/ocrParser.ts";
let source = fs.readFileSync(path, "utf8");

function replaceRequired(from, to, label) {
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`[ocr-regression] Missing anchor: ${label}`);
  source = source.replace(from, to);
}

replaceRequired(
  'export const matchStatType = (lcLine: string): string => {',
  `const OCR_CANONICAL_TYPES: Record<string, string> = {
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
  return /\\bturn\\b/.test(lcLine)
    || /\\btuned\\b/.test(lcLine)
    || /\\bretun(?:e|ed|ing)\\b/.test(lcLine)
    || lcLine.includes("định âm")
    || lcLine.includes("dingyin")
    || lcLine.includes("定音");
};

export const matchStatType = (lcLine: string): string => {`,
  "canonical OCR types and retune semantics",
);

replaceRequired(
  '    if (matched) return rule.type;',
  '    if (matched) return canonicalOcrType(rule.type);',
  "canonical stat match output",
);

replaceRequired(
  `  const lines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const hasNum = /\\d+(?:\\.\\d+)/.test(rawLines[i]);
    const hasStat = matchStatType(rawLines[i].toLowerCase()) !== "";

    if (hasStat && !hasNum && i + 1 < rawLines.length && /\\d+(?:\\.\\d+)/.test(rawLines[i + 1])) {`,
  `  const lines: string[] = [];
  lineJoin: for (let i = 0; i < rawLines.length; i++) {
    const hasNum = /\\d+(?:\\.\\d+)/.test(rawLines[i]);
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
        if (/\\d+(?:\\.\\d+)/.test(rawLines[i + j])) break;
        joined += " " + rawLines[i + j];
        if (matchStatType(joined.toLowerCase()) !== "") {
          lines.push(joined);
          i += j;
          continue lineJoin;
        }
      }
    }

    if (hasStat && !hasNum && i + 1 < rawLines.length && /\\d+(?:\\.\\d+)/.test(rawLines[i + 1])) {`,
  "numeric-leading multiline stat join",
);

replaceRequired(
  '      const isTuned = lcLine.includes("turn") || lcLine.includes("tuned") || lcLine.includes("attuned") || lcLine.includes("👍") || lcLine.includes("✦") || lcLine.includes("định âm") || lcLine.includes("dingyin") || lcLine.includes("定音");',
  '      const isTuned = isRetunedStatLine(lcLine);',
  "primary retuned detection",
);

replaceRequired(
  `      // Try joining with 1-2 previous lines
      for (let back = 1; back <= 2 && um.idx - back >= 0; back++) {
        let combined = "";
        for (let b = back; b >= 0; b--) combined += (combined ? " " : "") + lines[um.idx - b];
        const lcCombined = combined.toLowerCase().replace(/[|[\\]{}()]/g, " ");`,
  `      // A value may be emitted on its own line after a wrapped label. Look
      // back up to three NON-NUMERIC continuation lines, but never cross a
      // previous stat row that already contains a value.
      for (let back = 1; back <= 3 && um.idx - back >= 0; back++) {
        const contextLines = lines.slice(um.idx - back, um.idx + 1);
        if (contextLines.slice(0, -1).some((entry) => /\\d+(?:\\.\\d+)/.test(entry))) continue;
        const combined = contextLines.join(" ");
        const lcCombined = combined.toLowerCase().replace(/[|[\\]{}()]/g, " ");`,
  "safe value-only backward join",
);

replaceRequired(
  '          const isTuned = lcCombined.includes("turn") || lcCombined.includes("tuned") || lcCombined.includes("attuned") || lcCombined.includes("👍") || lcCombined.includes("✦");',
  '          const isTuned = isRetunedStatLine(lcCombined);',
  "second-pass retuned detection",
);

replaceRequired(
  `export const runDualPassOcr = async (
  worker: any,`,
  `const scoreOcrParse = (text: string, subs: OcrSub[]): number => {
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
  worker: any,`,
  "OCR semantic pass scoring",
);

replaceRequired(
  `  let subs = parseSubStats(rawText);
  let bestText = rawText;
  const rawMatched = subs.filter(s => s.type !== "Other").length;

  // Pass 2: preprocessed (contrast-enhanced), only if raw got < 6 stats
  if (rawMatched < 6) {`,
  `  let subs = parseSubStats(rawText);
  let bestText = rawText;
  const rawMatched = subs.filter(s => s.type !== "Other").length;
  let bestQuality = scoreOcrParse(rawText, subs);

  // Pass 2 also runs when six rows were found but semantic confidence is low;
  // previously a wrong sixth row stopped OCR before enhanced passes could help.
  if (rawMatched < 6 || bestQuality < 600) {`,
  "semantic fallback pass 2",
);

replaceRequired(
  `    const procSubs = parseSubStats(procText);
    const procMatched = procSubs.filter(s => s.type !== "Other").length;
    if (procMatched > rawMatched) {
      subs = procSubs;
      bestText = procText;
    }
  }

  // Pass 3: high-contrast binarized, only if still < 6 stats
  const bestMatched = subs.filter(s => s.type !== "Other").length;
  if (bestMatched < 6) {`,
  `    const procSubs = parseSubStats(procText);
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
  if (bestMatched < 6 || bestQuality < 600) {`,
  "semantic fallback pass 3",
);

replaceRequired(
  `    const binSubs = parseSubStats(binText);
    const binMatched = binSubs.filter(s => s.type !== "Other").length;
    if (binMatched > bestMatched) {
      subs = binSubs;
      bestText = binText;
    }`,
  `    const binSubs = parseSubStats(binText);
    const binMatched = binSubs.filter(s => s.type !== "Other").length;
    const binQuality = scoreOcrParse(binText, binSubs);
    if (binQuality > bestQuality || (binQuality === bestQuality && binMatched > bestMatched)) {
      subs = binSubs;
      bestText = binText;
      bestQuality = binQuality;
    }`,
  "semantic pass 3 selection",
);

fs.writeFileSync(path, source, "utf8");
console.log("[ocr-regression] Multiline Attunement parsing, canonical stat names, and safe Retuning detection applied.");
