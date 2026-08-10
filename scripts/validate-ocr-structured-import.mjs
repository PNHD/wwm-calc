import fs from "node:fs";
import { parseGlobalEnglishStatSpans, parseHybridGlobalEnglishRows } from "../src/utils/ocrGlobalEnglish.ts";
import { parseSubStats } from "../src/utils/ocrParser.ts";

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const expected = [
  ["Power", "43.8", false],
  ["Max Phys Atk", "73.1", true],
  ["Boss DMG%", "2.6", false],
  ["Power", "37.5", false],
  ["Crit Rate", "7.3", false],
  ["Umb Martial Art Skill DMG Boost", "5.2", false],
];

const fixtures = {
  A: [
    "Power 43.8",
    "[Turn]Max Physical Attack 73.1",
    "Combat Boost Against",
    "Boss Units 2.6%",
    "Power 37.5",
    "Critical Rate 7.3%",
    "Everspring Umbrella - 5.2%",
    "Martial Art Skill DMG",
    "Boost",
  ].join("\n"),
  B: [
    "Power 43.8",
    "[Turn]Max Physical Attack 73.1",
    "Combat Boost Against",
    "Boss Units 2.6%",
    "Power 37.5",
    "Critical Rate 7.3%",
    "Everspring Umbrella - 52",
    "Martial Art Skill DMG",
    "Boost",
  ].join("\n"),
  // Deliberately damage exactly one label. The exact parser must recognize only
  // five rows; the browser production parser must keep those five locked rows
  // and recover only the unresolved numeric row instead of falling back globally.
  C: [
    "Power 43.8",
    "[Turn]Max Physical Attack 73.1",
    "Combat Boost Against",
    "Boss Units 2.6%",
    "P0wer 37.5",
    "Critical Rate 7.3%",
    "Everspring Umbrella - 5.2%",
    "Martial Art Skill DMG",
    "Boost",
  ].join("\n"),
};

const assertExpected = (label, parsed) => {
  const rows = parsed.filter((sub) => sub.type !== "Other");
  expect(rows.length === 6, `${label}: expected exactly 6 rows, got ${rows.length}`);
  expected.forEach(([type, val, tuned], index) => {
    const actual = rows[index];
    expect(actual?.type === type, `${label} row #${index + 1}: expected ${type}, got ${actual?.type ?? "missing"}`);
    expect(actual?.val === val, `${label} row #${index + 1}: expected value ${val}, got ${actual?.val ?? "missing"}`);
    expect(Boolean(actual?.isTuned) === tuned, `${label} row #${index + 1}: tuned flag mismatch`);
  });
  expect(rows.filter((sub) => sub.type === "Power").map((sub) => sub.val).join(",") === "43.8,37.5", `${label}: duplicate Power rows must remain positional duplicates`);
  expect(rows.filter((sub) => sub.isTuned).length === 1 && rows.find((sub) => sub.isTuned)?.type === "Max Phys Atk", `${label}: only [Turn] Max Physical Attack may be Retuned`);
  expect(!rows.some((sub) => sub.type === "Boss DMG%" && ["37.5", "52", "5.2"].includes(sub.val)), `${label}: Boss DMG must not steal Power/Everspring values`);
};

for (const [label, fixture] of Object.entries(fixtures)) {
  assertExpected(`hybrid fixture ${label}`, parseHybridGlobalEnglishRows(fixture));
  // This is the exact function invoked by runDualPassOcr in the browser path.
  assertExpected(`production parseSubStats fixture ${label}`, parseSubStats(fixture));
}

const exactC = parseGlobalEnglishStatSpans(fixtures.C);
expect(exactC.length === 5, `fixture C must prove partial exact recognition (expected 5 exact rows, got ${exactC.length})`);
expect(!exactC.some((row) => row.type === "Power" && row.val === "37.5"), "fixture C damaged Power row must be absent from exact spans");

// Decimal repair is scoped: percentage-like Everspring 52 -> 5.2, while flat
// attribute/attack values are not divided by ten by any generic heuristic.
const flatValuesFixture = [
  "Power 52",
  "Agility 46",
  "Max Physical Attack 73",
  "Critical Rate 73",
  "Everspring Umbrella - 52",
  "Martial Art Skill DMG",
  "Boost",
].join("\n");
const flatRows = parseHybridGlobalEnglishRows(flatValuesFixture);
expect(flatRows.find((row) => row.type === "Power")?.val === "52", "Power 52 must remain 52");
expect(flatRows.find((row) => row.type === "Agility")?.val === "46", "Agility 46 must remain 46");
expect(flatRows.find((row) => row.type === "Max Phys Atk")?.val === "73", "Max Physical Attack 73 must remain 73");
expect(flatRows.find((row) => row.type === "Crit Rate")?.val === "7.3", "Crit Rate 73 may repair to 7.3 within a percentage family");
expect(flatRows.find((row) => row.type === "Umb Martial Art Skill DMG Boost")?.val === "5.2", "Everspring 52 must repair to 5.2");

const scanner = fs.readFileSync("src/components/OcrScanner.tsx", "utf8");
const app = fs.readFileSync("src/App.tsx", "utf8");
const parser = fs.readFileSync("src/utils/ocrParser.ts", "utf8");
expect(parser.includes("parseHybridGlobalEnglishRows"), "production ocrParser must import the hybrid row parser");
expect(parser.includes("const hybridGlobalRows = parseHybridGlobalEnglishRows(text);"), "parseSubStats must invoke the hybrid parser used by browser OCR");
expect(!parser.includes("const exactGlobalRows = parseGlobalEnglishStatSpans(text);"), "all-or-nothing exact parser gate must be removed");
expect(scanner.includes("subs: OcrSub[];"), "batch callback must expose structured substats");
expect(scanner.includes("subs: it.subs.filter"), "batch payload must carry reviewed structured rows");
expect(scanner.includes('it.slot === "Auto" || validateGlobalT96GearLines'), "batch import must require an explicit slot");
expect(scanner.includes('const hasWeaponSkillLine = value.includes("martial art skill dmg")'), "weapon Attunement text must be excluded from slot inference");
expect(app.includes("const structuredSubs: GearSub[]"), "App must consume structured OCR rows");
expect(app.includes("subs: structuredSubs.length ? structuredSubs : fallback.subs"), "structured OCR rows must override legacy text reparsing");

if (failures.length) {
  console.error("[ocr-structured-audit] FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("[ocr-structured-audit] PASS — production parseSubStats preserves all six Global T96 rows across normal, lost-decimal, and partial-exact browser OCR variants.");
