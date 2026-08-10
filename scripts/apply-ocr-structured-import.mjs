import fs from "node:fs";

const files = {
  parser: "src/utils/ocrParser.ts",
  scanner: "src/components/OcrScanner.tsx",
  app: "src/App.tsx",
};

const read = (path) => fs.readFileSync(path, "utf8");
const write = (path, content) => fs.writeFileSync(path, content, "utf8");

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[ocr-structured] Missing anchor: ${label}`);
  return source.replace(from, to);
}

function replaceRegexRequired(source, pattern, to, label) {
  if (typeof to === "string" && source.includes(to)) return source;
  if (!pattern.test(source)) throw new Error(`[ocr-structured] Missing regex anchor: ${label}`);
  return source.replace(pattern, to);
}

// ── 1. Prefer exact Global-English stat spans before fuzzy line parsing -------
let parser = read(files.parser);
parser = replaceRequired(
  parser,
  "export interface OcrSub {",
  'import { parseGlobalEnglishStatSpans } from "./ocrGlobalEnglish.ts";\n\nexport interface OcrSub {',
  "Global English span parser import",
);
parser = replaceRequired(
  parser,
  'export const parseSubStats = (text: string): OcrSub[] => {\n  console.log("[OCR] Raw text:\\n", text);',
  `export const parseSubStats = (text: string): OcrSub[] => {
  console.log("[OCR] Raw text:\\n", text);

  // The English Global client uses stable labels even when Tesseract changes
  // line breaks. Parse those labels as ordered spans first so a wrapped Boss or
  // Everspring label cannot borrow the next row's value. This also repairs the
  // common dropped-decimal OCR form (5.2 -> 52) only for percentage-like stats.
  const exactGlobalRows = parseGlobalEnglishStatSpans(text);
  if (exactGlobalRows.length >= 6) {
    const exact: OcrSub[] = exactGlobalRows.slice(0, 6).map(({ type, val, isTuned }) => ({ type, val, isTuned }));
    let tunedSeen = false;
    exact.forEach((row) => {
      if (!row.isTuned) return;
      if (tunedSeen) row.isTuned = false;
      else tunedSeen = true;
    });
    console.log("[OCR] Exact Global English rows:", exact);
    return exact;
  }`,
  "exact Global English parser priority",
);
write(files.parser, parser);

// ── 2. Batch OCR sends structured values; no destructive second parse --------
let scanner = read(files.scanner);
scanner = replaceRequired(
  scanner,
  '  onImportGears?: (items: { rawText: string; fileName: string }[]) => void;',
  `  onImportGears?: (items: {
    rawText: string;
    fileName: string;
    slot: string;
    mastery?: number;
    subs: OcrSub[];
  }[]) => void;`,
  "structured batch import type",
);
scanner = replaceRequired(
  scanner,
  '  if (value.includes("rope dart") || value.includes("rope_dart") || value.includes("绳镖")) return "Rope Dart";\n  if (value.includes("umbrella") || value.includes("伞")) return "Umbrella";',
  `  // Weapon names also appear in Attunement lines on armor/relics. Never use
  // that line alone to infer a weapon slot; a false negative (Auto) is safer
  // than importing an armor piece into Weapon 1.
  const hasWeaponSkillLine = value.includes("martial art skill dmg")
    || value.includes("special skill dmg")
    || value.includes("charged skill dmg");
  if (!hasWeaponSkillLine && (value.includes("rope dart") || value.includes("rope_dart") || value.includes("绳镖"))) return "Rope Dart";
  if (!hasWeaponSkillLine && (value.includes("umbrella") || value.includes("伞"))) return "Umbrella";`,
  "safe weapon slot inference",
);
scanner = replaceRequired(
  scanner,
  '                    const invalidItems = activeItems.filter((it) => validateGlobalT96GearLines(it.slot, it.subs).errors.length > 0);',
  '                    const invalidItems = activeItems.filter((it) => it.slot === "Auto" || validateGlobalT96GearLines(it.slot, it.subs).errors.length > 0);',
  "require explicit slot before batch import",
);
scanner = replaceRequired(
  scanner,
  '                  disabled={queue.filter((it) => it.isSelected && it.status === "success" && validateGlobalT96GearLines(it.slot, it.subs).errors.length === 0).length === 0}',
  '                  disabled={queue.filter((it) => it.isSelected && it.status === "success" && it.slot !== "Auto" && validateGlobalT96GearLines(it.slot, it.subs).errors.length === 0).length === 0}',
  "disable batch import while slot is Auto",
);
scanner = replaceRegexRequired(
  scanner,
  /return \{\s*rawText: lines\.join\("\\n"\),\s*fileName: it\.fileName\s*\};/,
  `return {
                        // Keep the original OCR text for diagnostics/fallback,
                        // but the parent receives the already-reviewed structured rows.
                        rawText: it.rawText || lines.join("\\n"),
                        fileName: it.fileName,
                        slot: it.slot,
                        mastery: it.mastery,
                        subs: it.subs.filter((sub) => sub.type !== "Other" && sub.val).map((sub) => ({ ...sub })),
                      };`,
  "structured batch payload",
);
write(files.scanner, scanner);

// ── 3. Parent import uses structured rows verbatim ----------------------------
let app = read(files.app);
app = replaceRequired(
  app,
  '                  const newItems: GearItem[] = scannedGears.map(item => parseTextToGearItem(item.rawText, item.fileName));',
  `                  const newItems: GearItem[] = scannedGears.map((item) => {
                    const fallback = parseTextToGearItem(item.rawText, item.fileName);
                    const structuredSubs: GearSub[] = Array.isArray(item.subs)
                      ? item.subs
                          .filter((sub) => sub.type !== "Other" && sub.val)
                          .map((sub) => ({ type: sub.type, val: sub.val, isTuned: Boolean(sub.isTuned) }))
                      : [];
                    return {
                      ...fallback,
                      slot: item.slot && item.slot !== "Auto" ? item.slot : fallback.slot,
                      mastery: typeof item.mastery === "number" ? item.mastery : fallback.mastery,
                      // Critical invariant: once the user reviewed OCR rows, never
                      // serialize and parse them again. Preserve duplicate Power,
                      // decimals, canonical stat types and the single Retuned flag.
                      subs: structuredSubs.length ? structuredSubs : fallback.subs,
                    };
                  });`,
  "structured OCR parent handoff",
);
write(files.app, app);

console.log("[ocr-structured] Exact English rows, safe slot inference, and lossless structured import applied.");
