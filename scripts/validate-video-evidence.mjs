import fs from "node:fs";

const failures = [];
const app = fs.readFileSync("src/App.tsx", "utf8");
const calc = fs.readFileSync("src/utils/calc.ts", "utf8");
const preset = fs.readFileSync("src/data/globalT96Preset.ts", "utf8");
const evidence = fs.readFileSync("src/data/globalV2VideoEvidence.ts", "utf8");

function requireText(path, source, text, label) {
  if (!source.includes(text)) failures.push(`${path}: missing ${label}`);
}

function forbidText(path, source, text, label) {
  if (source.includes(text)) failures.push(`${path}: stale ${label}`);
}

requireText("src/App.tsx", app, 'name: "Starweave"', "current set name");
requireText("src/App.tsx", app, 'stat2pc: { minOuter: 78 }', "Starweave T96 two-piece stat");
requireText("src/App.tsx", app, 'Min Physical ATK +78 (effective from Lv.96)', "Starweave two-piece tooltip");
forbidText("src/App.tsx", app, "Stars Align", "legacy Stars Align name");
requireText("src/utils/calc.ts", calc, "Five stacks of the explicit +3% Martial Art Skill component = +15%", "transparent Starweave base model");
requireText("src/utils/calc.ts", calc, "distance component", "unmodeled Starweave distance caveat");

for (const id of ["t96-observed-helmet", "t96-observed-chest", "t96-observed-greaves", "t96-observed-bracers"]) {
  const start = preset.indexOf(`id: "${id}"`);
  const next = preset.indexOf("  {\n    id:", start + 1);
  const block = preset.slice(start, next < 0 ? preset.length : next);
  if (start < 0 || !block.includes('set: "calmwaters"')) failures.push(`src/data/globalT96Preset.ts: ${id} is not assigned to Calmwaters`);
}
requireText("src/data/globalT96Preset.ts", preset, 'id: "t96-observed-chest-1129"', "1129 spare chest candidate");
requireText("src/data/globalT96Preset.ts", preset, 'mastery: 1129', "1129 mastery");
requireText("src/data/globalT96Preset.ts", preset, '{ type: "Agility", val: "46.4" }', "1129 Agility line");
requireText("src/data/globalT96Preset.ts", preset, '{ type: "Min Phys Atk", val: "61.4" }', "1129 Min Physical line");
requireText("src/data/globalT96Preset.ts", preset, '{ type: "Max Phys Atk", val: "67.3", isTuned: true }', "1129 tuned Max Physical line");

for (const text of [
  "minPhysicalAttackWithFood: 1839",
  "maxPhysicalAttackWithFood: 3024",
  "precisionPanel: 115.5",
  "criticalPanel: 131.1",
  "finalCriticalAndAffinity: 91.2",
  'displayedDps: 47224',
  'displayedDps: 45825',
  'currentEnglishName: "Starweave"',
  "minPhysicalAttack: 78",
  'currentEnglishName: "Calmwaters"',
  "physicalDefense: 39",
]) requireText("src/data/globalV2VideoEvidence.ts", evidence, text, text);

const dummyBlock = evidence.match(/GLOBAL_T96_VIDEO_DUMMY_RESULTS\s*=\s*\{([\s\S]*?)\n\} as const;/)?.[1] ?? "";
const displayedDps = [...dummyBlock.matchAll(/displayedDps:\s*(\d+)/g)].map((match) => Number(match[1]));
const storedDelta = Number(dummyBlock.match(/observedDpsDelta1129Minus1106:\s*(\d+)/)?.[1]);
if (displayedDps.length !== 2 || displayedDps[0] - displayedDps[1] !== storedDelta) {
  failures.push("src/data/globalV2VideoEvidence.ts: A/B dummy DPS delta is inconsistent");
}

if (failures.length) {
  console.error("[video-evidence-audit] FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[video-evidence-audit] PASS — 1129/1106 panels, Starweave, Calmwaters, and A/B dummy summaries match the supplied recording.");
