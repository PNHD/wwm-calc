import fs from "node:fs";
import { parseGlobalEnglishStatSpans } from "../src/utils/ocrGlobalEnglish.ts";
import { parseSubStats } from "../src/utils/ocrParser.ts";

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

// Exact user-visible gear from the 2026-08-10 regression report. This fixture
// deliberately simulates two common Tesseract errors at once:
// - a wrapped Boss label
// - the Everspring percentage losing its decimal separator (5.2 -> 52)
const currentFixture = [
  "Power 43.8",
  "[Turn]Max Physical Attack 73.1",
  "Combat Boost Against",
  "Boss Units 2.6%",
  "Power 37.5",
  "Critical Rate 7.3%",
  "Everspring Umbrella - 52",
  "Martial Art Skill DMG",
  "Boost",
].join("\n");

const expected = [
  ["Power", "43.8", false],
  ["Max Phys Atk", "73.1", true],
  ["Boss DMG%", "2.6", false],
  ["Power", "37.5", false],
  ["Crit Rate", "7.3", false],
  ["Umb Martial Art Skill DMG Boost", "5.2", false],
];

const spans = parseGlobalEnglishStatSpans(currentFixture);
expect(spans.length === 6, `Global-English span parser should find exactly 6 rows, got ${spans.length}`);
expected.forEach(([type, val, tuned], index) => {
  const actual = spans[index];
  expect(actual?.type === type, `span #${index + 1}: expected ${type}, got ${actual?.type ?? "missing"}`);
  expect(actual?.val === val, `span #${index + 1}: expected value ${val}, got ${actual?.val ?? "missing"}`);
  expect(Boolean(actual?.isTuned) === tuned, `span #${index + 1}: tuned flag mismatch`);
});

const parsed = parseSubStats(currentFixture).filter((sub) => sub.type !== "Other");
expect(parsed.length === 6, `parseSubStats should return exactly 6 rows, got ${parsed.length}`);
expected.forEach(([type, val, tuned], index) => {
  const actual = parsed[index];
  expect(actual?.type === type, `parse #${index + 1}: expected ${type}, got ${actual?.type ?? "missing"}`);
  expect(actual?.val === val, `parse #${index + 1}: expected value ${val}, got ${actual?.val ?? "missing"}`);
  expect(Boolean(actual?.isTuned) === tuned, `parse #${index + 1}: tuned flag mismatch`);
});
expect(!parsed.some((sub) => sub.type === "Boss DMG%" && ["37.5", "52", "5.2"].includes(sub.val)), "Boss DMG must not steal Power 37.5 or Everspring 5.2");
expect(parsed.filter((sub) => sub.type === "Power").map((sub) => sub.val).join(",") === "43.8,37.5", "duplicate Power rows must survive independently");
expect(parsed.filter((sub) => sub.isTuned).length === 1 && parsed.find((sub) => sub.isTuned)?.type === "Max Phys Atk", "only [Turn] Max Physical Attack may be Retuned");

// Decimal-preserving variant: the normal 5.2 spelling must remain untouched.
const normalDecimalFixture = currentFixture.replace("Everspring Umbrella - 52", "Everspring Umbrella - 5.2%");
const decimalParsed = parseSubStats(normalDecimalFixture).filter((sub) => sub.type !== "Other");
expect(decimalParsed.find((sub) => sub.type === "Umb Martial Art Skill DMG Boost")?.val === "5.2", "normal Everspring 5.2 must remain 5.2");

const scanner = fs.readFileSync("src/components/OcrScanner.tsx", "utf8");
const app = fs.readFileSync("src/App.tsx", "utf8");
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

console.log("[ocr-structured-audit] PASS — current screenshot parses as Power 43.8 / tuned Max Phys 73.1 / Boss 2.6 / Power 37.5 / Crit 7.3 / Everspring 5.2, with lossless import semantics.");
