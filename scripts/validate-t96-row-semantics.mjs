import fs from "node:fs";
import { parseSubStats } from "../src/utils/ocrParser.ts";
import {
  applyGearRowSemantics,
  matchWeaponAttunementText,
  toGearFormRows,
} from "../src/data/gearAttunement.ts";

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const everspringFixture = [
  "Critical Rate 8.1%",
  "Agility 46.4",
  "Min Physical Attack 68.4",
  "[Turn]Max Physical Attack 73.1",
  "Min Bamboocut Attack 35.6",
  "Everspring Umbrella -",
  "Martial Art Skill DMG",
  "Boost 5.2%",
].join("\n");

const everspring = parseSubStats(everspringFixture).filter((row) => row.type !== "Other");
expect(everspring.length === 6, `Everspring: expected 6 semantic rows, got ${everspring.length}`);
const expectedEverspring = [
  ["Crit Rate", "8.1", "primary", false],
  ["Agility", "46.4", "additional", false],
  ["Min Phys Atk", "68.4", "additional", false],
  ["Max Phys Atk", "73.1", "additional", true],
  ["Min Bamboocut Atk", "35.6", "additional", false],
  ["Umb Martial Art Skill DMG Boost", "5.2", "attunement", false],
];
expectedEverspring.forEach(([type, val, role, retuned], index) => {
  const row = everspring[index];
  expect(row?.type === type, `Everspring row ${index + 1}: expected ${type}, got ${row?.type ?? "missing"}`);
  expect(row?.val === val, `Everspring row ${index + 1}: expected ${val}, got ${row?.val ?? "missing"}`);
  expect(row?.role === role, `Everspring row ${index + 1}: expected role ${role}, got ${row?.role ?? "missing"}`);
  expect(Boolean(row?.isRetuned ?? row?.isTuned) === retuned, `Everspring row ${index + 1}: Retuned mismatch`);
  expect(row?.sourceOrder === index, `Everspring row ${index + 1}: source order was not preserved`);
});
expect(everspring[5]?.attunementId === "everspring-umbrella", "Everspring Attunement must retain exact weapon identity");
expect(everspring[5]?.displayName === "Everspring Umbrella — Martial Art Skill DMG Boost", "Everspring Global display label mismatch");

const ropeFixture = [
  "Precision Rate 6.3%",
  "Maximum Bamboocut Attack 34.8",
  "Min Bamboocut Attack 35.4",
  "[Turn]Critical Rate 7.4%",
  "Max Physical Attack 59.7",
  "Unfettered Rope Dart -",
  "Martial Art Skill DMG",
  "Boost 3.9%",
].join("\n");

const rope = parseSubStats(ropeFixture).filter((row) => row.type !== "Other");
expect(rope.length === 6, `Rope Dart: expected 6 semantic rows, got ${rope.length}`);
expect(rope.map((row) => row.type).join("|") === [
  "Precision",
  "Max Bamboocut Atk",
  "Min Bamboocut Atk",
  "Crit Rate",
  "Max Phys Atk",
  "Rope Dart Martial Art Skill DMG Boost",
].join("|"), "Rope Dart source order/types mismatch");
expect(rope[3]?.val === "7.4" && rope[3]?.role === "additional" && rope[3]?.isRetuned === true, "Rope Dart [Turn] Crit Rate must be the only Retuned row");
expect(rope.filter((row) => row.isRetuned).length === 1, "Rope Dart must contain exactly one Retuned row");
expect(rope[5]?.role === "attunement" && rope[5]?.isRetuned === false, "Rope Dart final weapon bonus must be Attunement, not Retuned");
expect(rope[5]?.attunementId === "unfettered-rope-dart", "Rope Dart Attunement must retain exact Unfettered identity");
expect(rope[5]?.displayName === "Unfettered Rope Dart — Martial Art Skill DMG Boost", "Rope Dart player-facing Global label mismatch");
expect(!rope.some((row) => row.type === "Art of Rope Dart Boost"), "Unfettered Martial Art Skill DMG Boost must never canonicalize to legacy Art of Rope Dart Boost");

const missingNormalFixture = [
  "Critical Rate 8.1%",
  "Agility 46.4",
  "Min Physical Attack 68.4",
  "[Turn]Max Physical Attack 73.1",
  // Min Bamboocut Attack intentionally missing.
  "Everspring Umbrella -",
  "Martial Art Skill DMG",
  "Boost 5.2%",
].join("\n");
const missingNormal = parseSubStats(missingNormalFixture).filter((row) => row.type !== "Other");
expect(missingNormal.length === 5, `missing-normal: production parser must preserve 5 semantic rows, got ${missingNormal.length}`);
expect(missingNormal[3]?.type === "Max Phys Atk" && missingNormal[3]?.isRetuned === true, "missing-normal: Max Phys must remain the Retuned ordinary roll");
expect(missingNormal[4]?.role === "attunement" && missingNormal[4]?.type === "Umb Martial Art Skill DMG Boost", "missing-normal: surviving Attunement must not shift into an ordinary slot");
const missingNormalForm = toGearFormRows(missingNormal);
expect(missingNormalForm.length === 6, "missing-normal form must expose five normal slots plus one Attunement slot");
expect(missingNormalForm.slice(0, 5).filter((row) => row.type === "Other").length === 1, "missing-normal form must leave exactly one normal slot unresolved");
expect(missingNormalForm[5]?.role === "attunement" && missingNormalForm[5]?.type === "Umb Martial Art Skill DMG Boost", "missing-normal form must keep Everspring in the Attunement section");

const missingAttunementFixture = [
  "Precision Rate 6.3%",
  "Maximum Bamboocut Attack 34.8",
  "Min Bamboocut Attack 35.4",
  "[Turn]Critical Rate 7.4%",
  "Max Physical Attack 59.7",
].join("\n");
const missingAttunement = parseSubStats(missingAttunementFixture).filter((row) => row.type !== "Other");
expect(missingAttunement.length === 5, `missing-attunement: production parser must preserve 5 normal rows, got ${missingAttunement.length}`);
expect(missingAttunement.every((row) => row.role !== "attunement"), "missing-attunement: ordinary row must never be promoted to Attunement");
expect(missingAttunement[4]?.type === "Max Phys Atk" && missingAttunement[4]?.role === "additional", "missing-attunement: fifth normal stat must remain additional");
const missingAttunementForm = toGearFormRows(missingAttunement);
expect(missingAttunementForm[5]?.role === "attunement" && missingAttunementForm[5]?.type === "Other", "missing-attunement form must leave Attunement unresolved/empty");

const genericMatch = matchWeaponAttunementText("Mortal Rope Dart - Martial Art Skill DMG Boost 4.1%");
expect(genericMatch?.statKey === "Rope Dart Martial Art Skill DMG Boost", "generic weapon allowlist must map Mortal Rope Dart to the existing ropeMartial key");
expect(genericMatch?.displayName === "Mortal Rope Dart — Martial Art Skill DMG Boost", "generic weapon allowlist must preserve the current weapon display name");

const legacy = applyGearRowSemantics([
  { type: "Art of Rope Dart Boost", val: "2.6", isTuned: false },
  { type: "Rope Dart Martial Art Skill DMG Boost", val: "3.9", isTuned: true },
]);
expect(legacy[0]?.type === "Art of Rope Dart Boost" && legacy[0]?.role === "primary", "legacy Art of Rope Dart Boost key must retain its existing calculation meaning");
expect(legacy[1]?.type === "Rope Dart Martial Art Skill DMG Boost" && legacy[1]?.role === "attunement", "legacy ropeMartial key must migrate semantically to Attunement without a destructive key rename");
expect(legacy[1]?.isRetuned === false && legacy[1]?.isTuned === false, "legacy Attunement must never remain marked Retuned");
expect(!legacy[1]?.attunementId, "legacy family-level key must not guess a specific weapon identity");

const app = fs.readFileSync("src/App.tsx", "utf8");
const scanner = fs.readFileSync("src/components/OcrScanner.tsx", "utf8");
const parser = fs.readFileSync("src/utils/ocrParser.ts", "utf8");
expect(app.includes("Attunement · Weapon Martial Art Skill DMG Boost"), "Add Gear must expose a separate Attunement section");
expect(app.includes("Retuned ✦"), "Add Gear ordinary-row checkbox must use Retuned terminology");
expect(!app.includes("Tuned substat (select one line)"), "legacy Tuned-substat heading must be removed");
expect(app.includes("ATTUNEMENT_SELECT_OPTIONS"), "manual Add Gear must provide repository-backed weapon Attunement options");
expect(scanner.includes("ATTUNEMENT"), "batch review must label Attunement independently");
expect(scanner.includes("RETUNED"), "batch review must label ordinary [Turn] rows Retuned");
expect(parser.includes("hybridGlobalRows.length >= 5"), "production parser must preserve one-missing-row semantic OCR instead of falling back/padding");
expect(parser.includes("attunementId, displayName"), "production parser must carry weapon display metadata through OCR");

if (failures.length) {
  console.error("[t96-row-semantics-audit] FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("[t96-row-semantics-audit] PASS — Retuned and Attunement are independent across Everspring, Unfettered Rope Dart, missing-normal, missing-Attunement, legacy migration, manual UI, and batch structured OCR paths.");
