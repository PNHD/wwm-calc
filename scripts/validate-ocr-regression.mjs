import { parseSubStats, matchStatType } from "../src/utils/ocrParser.ts";

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(
  matchStatType("everspring umbrella martial art skill dmg boost") === "Umb Martial Art Skill DMG Boost",
  "Everspring Martial Art Skill DMG must use the canonical OCR/UI stat name",
);

const firstLineValueFixture = [
  "Critical Rate 8.2%",
  "Critical Rate 7.9%",
  "[Turn]Agility 46.4",
  "Maximum Bamboocut Attack 33.4",
  "Max Physical Attack 73.1",
  "Everspring Umbrella - 5.3%",
  "Martial Art Skill DMG",
  "Boost",
].join("\n");

const firstLineParsed = parseSubStats(firstLineValueFixture).filter((sub) => sub.type !== "Other");
expect(firstLineParsed.length === 6, `first-line-value fixture should yield 6 stats, got ${firstLineParsed.length}`);
expect(firstLineParsed[0]?.type === "Crit Rate" && firstLineParsed[0]?.val === "8.2", "primary Critical Rate 8.2 lost");
expect(firstLineParsed[1]?.type === "Crit Rate" && firstLineParsed[1]?.val === "7.9", "second Critical Rate 7.9 lost");
expect(firstLineParsed[2]?.type === "Agility" && firstLineParsed[2]?.val === "46.4", "[Turn] Agility 46.4 lost");
expect(firstLineParsed[2]?.isTuned === true, "[Turn] Agility must remain the Retuned line");
expect(firstLineParsed[3]?.type === "Max Bamboocut Atk" && firstLineParsed[3]?.val === "33.4", "Maximum Bamboocut Attack 33.4 lost");
expect(firstLineParsed[4]?.type === "Max Phys Atk" && firstLineParsed[4]?.val === "73.1", "Max Physical Attack 73.1 lost");
expect(
  firstLineParsed[5]?.type === "Umb Martial Art Skill DMG Boost" && firstLineParsed[5]?.val === "5.3",
  `wrapped Everspring boost should be 5.3, got ${firstLineParsed[5]?.type} ${firstLineParsed[5]?.val}`,
);
expect(firstLineParsed[5]?.isTuned !== true, "weapon Attunement must not be mislabeled as Retuned");

const valueOnlyFixture = [
  "Critical Rate 8.2%",
  "Critical Rate 7.9%",
  "[Turn] Agility 46.4",
  "Maximum Bamboocut Attack 33.4",
  "Max Physical Attack 73.1",
  "Everspring Umbrella -",
  "Martial Art Skill DMG",
  "Boost",
  "5.3%",
].join("\n");

const valueOnlyParsed = parseSubStats(valueOnlyFixture).filter((sub) => sub.type !== "Other");
expect(valueOnlyParsed.length === 6, `value-only fixture should yield 6 stats, got ${valueOnlyParsed.length}`);
const valueOnlyBoost = valueOnlyParsed.find((sub) => sub.type === "Umb Martial Art Skill DMG Boost");
expect(valueOnlyBoost?.val === "5.3", `value-only wrapped boost should retain 5.3, got ${valueOnlyBoost?.val ?? "missing"}`);
expect(!valueOnlyParsed.some((sub) => sub.type === "Max Bamboocut Atk" && sub.val === "5.3"), "5.3 must never be borrowed into Max Bamboocut Atk");

if (failures.length) {
  console.error("[ocr-regression-audit] FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[ocr-regression-audit] PASS — wrapped Everspring Attunement remains 5.3%, [Turn] Agility stays Retuned, and no cross-row value borrowing occurs.");
