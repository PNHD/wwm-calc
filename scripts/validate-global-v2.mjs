import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const failures = [];

function requireText(path, source, text, label) {
  if (!source.includes(text)) failures.push(`${path}: missing ${label}`);
}

function forbidText(path, source, text, label) {
  if (source.includes(text)) failures.push(`${path}: stale ${label}`);
}

const app = read("src/App.tsx");
const calc = read("src/utils/calc.ts");
const innerWays = read("src/data/innerways.ts");
const ocr = read("src/components/OcrScanner.tsx");
const select = read("src/components/SearchableSelect.tsx");
const scorer = read("src/utils/globalT96Gear.ts");
const rules = read("src/data/globalT96Rules.ts");
const compatibility = read("src/data/globalT96GearCompatibility.ts");
const evidence = read("src/data/globalV2CombatEvidence.ts");
const indexHtml = read("index.html");

requireText("index.html", indexHtml, "Global 2.0 · Tier 96", "Global T96 document title");

requireText("src/utils/calc.ts", calc, 'const t96 = TIERS["405|0.65b"]', "current 100-upper tier baseline");
requireText("src/utils/calc.ts", calc, "GLOBAL_V2_SKILL_OUTCOME_RULES", "current skill outcome rules");
requireText("src/utils/calc.ts", calc, "let critEff = Math.min(0.8, critRateInput / 100 / jR);", "base Crit cap before Direct Crit");
requireText("src/utils/calc.ts", calc, "let dirCrit = (panel.dcrit || 0) / 100;", "separate Direct Crit input");
requireText("src/utils/calc.ts", calc, "const critBeforePrecision = Math.min(critEff + dirCrit, 0.8 + dirCrit);", "Direct Crit added after the base cap");
requireText("src/utils/calc.ts", calc, "* pPrec", "Precision gate after Crit/Affinity resolution");

requireText("src/data/innerways.ts", innerWays, "GLOBAL_V2_INNER_WAY_OVERRIDES", "current Global Inner Way overlay");
requireText("src/data/globalV2CombatEvidence.ts", evidence, "Burn and Bury", "dummy skill fixture");
requireText("src/data/globalV2CombatEvidence.ts", evidence, "damageCompositionIsDamageShareNotHitRate: true", "damage-share interpretation guard");

requireText("src/App.tsx", app, '"Max Void Atk": "maxPz"', "Void Attack panel mapping");
requireText("src/App.tsx", app, "subStatOptionsForSlot", "slot-aware manual stat picker");
requireText("src/App.tsx", app, "validateGlobalT96GearLines(selectedSlot, savedSubs)", "manual gear validation");
requireText("src/App.tsx", app, "let masteryVal: number | undefined = undefined", "non-fabricated OCR mastery");
requireText("src/App.tsx", app, "weaponSetSlots", "slot-correct imported set family");
requireText("src/App.tsx", app, "scoreGlobalT96Gear(item.subs, selectedBuild, contribution, item.slot)", "slot-aware gear scoring");

requireText("src/components/OcrScanner.tsx", ocr, "validateGlobalT96GearLines", "batch OCR validation");
requireText("src/components/OcrScanner.tsx", ocr, "filterGlobalT96StatOptions", "batch OCR slot filtering");
requireText("src/components/OcrScanner.tsx", ocr, "Gear slot / stat pool", "visible slot selector");
requireText("src/components/OcrScanner.tsx", ocr, "validation.label", "dynamic native/relaid source feedback");
requireText("src/components/OcrScanner.tsx", ocr, 'validation.origin === "relaid"', "Relaid visual state");
requireText("src/components/SearchableSelect.tsx", select, "spaceBelow", "vertical dropdown positioning");
requireText("src/components/SearchableSelect.tsx", select, "window.addEventListener('scroll', reposition, true)", "dropdown scroll tracking");

requireText("src/utils/globalT96Gear.ts", scorer, "gearOrigin === \"relaid\"", "honest Relaid scoring branch");
requireText("src/utils/globalT96Gear.ts", scorer, "rollQualityAvailable", "Relaid roll-quality availability flag");
requireText("src/data/globalT96GearCompatibility.ts", compatibility, "A weapon cannot be both native T96 Void gear and Relaid Path-stat gear", "mixed-pool guard");
requireText("src/data/globalT96GearCompatibility.ts", compatibility, "Modulating cap is lower than standard Tier 96 gear", "Relaid cap caveat");

const capChecks = [
  ["strength", "49.4"], ["power", "49.4"], ["agility", "49.4"],
  ["minOuter", "77.8"], ["maxOuter", "77.8"], ["precision", "8.0"],
  ["crit", "9.0"], ["affinity", "4.4"], ["minElement", "44.2"],
  ["maxElement", "44.2"], ["physicalPen", "11.0"], ["elementPen", "13.0"],
  ["allArts", "3.2"], ["weaponMartial", "6.2"], ["specifiedSkill", "6.0"],
  ["bossDmg", "3.2"],
];
for (const [key, value] of capChecks) {
  const pattern = new RegExp(`${key}:\\s*${value.replace(".", "\\.")}(?:,|\\s)`);
  if (!pattern.test(rules)) failures.push(`src/data/globalT96Rules.ts: wrong or missing ${key}=${value}`);
}

forbidText("src/App.tsx", app, "T91 now / T96 preview", "preview edition label");
forbidText("src/App.tsx", app, "need 116%+ panel", "T91 Crit breakpoint");
forbidText("src/App.tsx", app, "food adds +90/+180", "T91 food values");
forbidText("src/App.tsx", app, "let masteryVal = 832", "fabricated OCR mastery");
forbidText("src/utils/calc.ts", calc, "const T91_OVERRIDE_TIME", "T91-only rotation override");

const skillBlock = evidence.match(/skills:\s*\[([\s\S]*?)\]\s*satisfies GlobalT96DummySkillRow\[\]/)?.[1];
const resultBlock = evidence.match(/result:\s*\{([\s\S]*?)\n\s*\},\n\s*skills:/)?.[1];
if (!skillBlock || !resultBlock) {
  failures.push("src/data/globalV2CombatEvidence.ts: cannot parse dummy fixture");
} else {
  const toNumber = (value) => Number(value.replaceAll("_", ""));
  const damages = [...skillBlock.matchAll(/totalDamage:\s*([\d_]+)/g)].map((match) => toNumber(match[1]));
  const attempts = [...skillBlock.matchAll(/attempts:\s*([\d_]+)/g)].map((match) => toNumber(match[1]));
  const expectedDamage = resultBlock.match(/totalDamage:\s*([\d_]+)/);
  const expectedAttempts = resultBlock.match(/totalAttempts:\s*([\d_]+)/);
  if (!expectedDamage || damages.reduce((sum, value) => sum + value, 0) !== toNumber(expectedDamage[1])) {
    failures.push("src/data/globalV2CombatEvidence.ts: dummy skill damage rows do not sum to the recorded result");
  }
  if (!expectedAttempts || attempts.reduce((sum, value) => sum + value, 0) !== toNumber(expectedAttempts[1])) {
    failures.push("src/data/globalV2CombatEvidence.ts: dummy attempt rows do not sum to the recorded result");
  }
}

if (failures.length) {
  console.error("[global-v2-audit] FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[global-v2-audit] PASS — tier, OCR, gear compatibility, Inner Ways, Crit model, caps, and dummy fixture are internally consistent.");
