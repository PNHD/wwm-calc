import fs from "node:fs";
import { matchStatType, parseSubStats } from "../src/utils/ocrParser.ts";
import { applyGearRowSemantics, toGearFormRows } from "../src/data/gearAttunement.ts";
import {
  ARMOR_SETS,
  CURRENT_GLOBAL_SET_CATALOG,
  LEGACY_SET_ALIASES,
  UNMAPPED_LEGACY_SET_IDS,
  WEAPON_ACCESSORY_SETS,
  canonicalizeSetId,
  setEffectModelUnavailable,
} from "../src/data/setCatalog.ts";
import { canonicalStat, scoreGlobalT96Gear } from "../src/utils/globalT96Gear.ts";

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const expectedWeaponSets = [
  "Hawkwing", "Starweave", "Jadeware", "Rainwhisper", "Cleftpeak", "Mistwillow",
  "Ivorybloom", "Swallowcall", "Etherwrath", "Swift Gale", "Swaying Heights", "Tiltrim",
];
const expectedArmorSets = [
  "Eaglerise", "Formbend", "Moonflare", "Ebonward", "Beyond the Chill", "Whirlsnow",
  "Calmwaters", "Jadeclasp", "Honorbound", "Ripple Step", "Flawless Guardian", "Brimflow",
];

expect(CURRENT_GLOBAL_SET_CATALOG.length === 24, `catalog must contain 24 current sets, got ${CURRENT_GLOBAL_SET_CATALOG.length}`);
expect(WEAPON_ACCESSORY_SETS.map((set) => set.name).join("|") === expectedWeaponSets.join("|"), "weapon/accessory catalog mismatch");
expect(ARMOR_SETS.map((set) => set.name).join("|") === expectedArmorSets.join("|"), "armor catalog mismatch");
expect(WEAPON_ACCESSORY_SETS.every((set) => set.family === "weapon-accessory"), "weapon/accessory family contamination");
expect(ARMOR_SETS.every((set) => set.family === "armor"), "armor family contamination");
expect(WEAPON_ACCESSORY_SETS.some((set) => set.id === "hawkwing"), "Hawkwing must be a weapon/accessory set");
expect(ARMOR_SETS.some((set) => set.id === "eaglerise"), "Eaglerise must be an armor set");
expect(WEAPON_ACCESSORY_SETS.some((set) => set.id === "tiltrim"), "Tiltrim must be a weapon/accessory set");
expect(ARMOR_SETS.some((set) => set.id === "brimflow"), "Brimflow must be an armor set");
expect(canonicalizeSetId("eaglerise", "weapon-accessory") === "hawkwing", "legacy weapon eaglerise alias must migrate to Hawkwing");
expect(canonicalizeSetId("stormrain", "armor") === "eaglerise", "legacy armor stormrain alias must migrate to Eaglerise");
expect(canonicalizeSetId("stars", "weapon-accessory") === "starweave", "legacy stars alias must migrate to Starweave");
expect(canonicalizeSetId("stormrain", "weapon-accessory") === "stormrain", "aliases must be family-scoped");
expect(LEGACY_SET_ALIASES.every((alias) => alias.provenance.length > 0), "every legacy alias must carry provenance");
expect(UNMAPPED_LEGACY_SET_IDS.includes("ironweave"), "unproven legacy IDs must stay explicitly unmapped");
expect(setEffectModelUnavailable("tiltrim") && setEffectModelUnavailable("brimflow"), "new set effects must fail closed");
expect(setEffectModelUnavailable("hawkwing"), "reference-only set effects must fail closed");
expect(setEffectModelUnavailable("stormrain"), "unmigrated legacy IDs must not borrow a current effect");

const fixture = [
  "Momentum — 41.1",
  "Art of Sword DMG Boost — 6.1%",
  "[Turn] Momentum — 49.4",
  "Max Formless Attack — 41.7",
  "Max Physical Attack — 77.5",
  "Physical Penetration — 9.4",
].join("\n");
const rows = parseSubStats(fixture).filter((row) => row.type !== "Other" || row.val);
const expectedRows = [
  ["Momentum", "41.1", false],
  ["Art of Sword DMG Boost", "6.1%", false],
  ["Momentum", "49.4", true],
  ["Max Formless Attack", "41.7", false],
  ["Max Physical Attack", "77.5", false],
  ["Physical Penetration", "9.4", false],
];
expect(rows.length === 6, `six-row fixture must preserve 6 normal rows, got ${rows.length}`);
expectedRows.forEach(([type, val, retuned], index) => {
  const row = rows[index];
  expect(row?.type === type, `row ${index + 1} type: expected ${type}, got ${row?.type ?? "missing"}`);
  expect(row?.val === val, `row ${index + 1} value: expected ${val}, got ${row?.val ?? "missing"}`);
  expect(Boolean(row?.isRetuned) === retuned, `row ${index + 1} Retuned mismatch`);
  expect(row?.sourceOrder === index, `row ${index + 1} source order mismatch`);
  expect(row?.role !== "attunement", `row ${index + 1} must be a normal roll`);
});

const form = toGearFormRows(rows);
expect(form.length === 7, `six normal rows must produce 7 form rows including Attunement, got ${form.length}`);
expect(form.slice(0, 6).every((row, index) => row.type === expectedRows[index][0]), "form must preserve all six normal rows in order");
expect(form[6]?.role === "attunement" && form[6]?.type === "Other", "Attunement must remain a distinct empty seventh row");
const overflow = toGearFormRows([...rows, { type: "Power", val: "40" }]);
expect(overflow.length === 8 && overflow[6]?.type === "Power" && overflow[7]?.role === "attunement", "normal-row overflow must not be silently truncated");

const migrated = applyGearRowSemantics([{ type: "Art of Sword Boost", val: "6.1" }, { type: "Phys Pen", val: "9.4" }]);
expect(migrated[0]?.type === "Art of Sword DMG Boost" && migrated[0]?.val === "6.1%", "legacy Sword label/unit migration failed");
expect(migrated[1]?.type === "Physical Penetration", "legacy Physical Penetration migration failed");
expect(canonicalStat("Max Formless Attack") === "maxFormless", "Max Formless Attack canonical identity missing");
expect(canonicalStat("Max Physical Attack") === "maxOuter", "Max Physical Attack canonical identity missing");
expect(canonicalStat("Physical Penetration") === "outerPen", "Physical Penetration canonical identity missing");
expect(matchStatType("max formless attack") === "Max Formless Attack", "Max Formless Attack fallback collision");
expect(matchStatType("formless penetration") === "Formless Penetration", "Formless Penetration must not collide with Physical Penetration");
expect(matchStatType("physical penetration") === "Physical Penetration", "Physical Penetration fallback missing");
expect(matchStatType("art of sword dmg boost") === "Art of Sword DMG Boost", "Art of Sword label recognition missing");
expect(matchStatType("sword martial art skill dmg boost") === "Sword Martial Art Skill DMG Boost", "weapon Martial Art Skill line must stay distinct from Art of Sword DMG Boost");
const formlessScore = scoreGlobalT96Gear([{ type: "Max Formless Attack", val: "41.7" }], "bamboocut-dust", 0, "Umbrella");
expect(formlessScore.recognizedLines === 1 && formlessScore.lines[0]?.cap === null, "Max Formless Attack must be recognized without an invented cap");
expect(formlessScore.lines[0]?.reason.includes("calculation mapping"), "Max Formless Attack must report unavailable calculation semantics");

const app = fs.readFileSync("src/App.tsx", "utf8");
expect(app.includes("WEAPON_ACCESSORY_SETS.map"), "weapon selector must derive from canonical catalog");
expect(app.includes("CURRENT_ARMOR_SETS.map"), "armor selector must derive from canonical catalog");
expect(!app.includes('const WEAPON_SET_KEYS = ["stars"'), "stale hard-coded weapon selector must be absent");
expect(!app.includes('item.subs.slice(0, 4)'), "gear cards must not hide normal rows");

if (failures.length) {
  console.error("[usertest-ocr-set-audit] FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("[usertest-ocr-set-audit] PASS — current set families, explicit aliases, fail-closed effects, six normal rows, units, Retuned state, and Formless identity are preserved.");
