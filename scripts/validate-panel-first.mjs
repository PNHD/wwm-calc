import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const failures = [];
const requireText = (path, source, text, label) => {
  if (!source.includes(text)) failures.push(`${path}: missing ${label}`);
};
const forbidText = (path, source, text, label) => {
  if (source.includes(text)) failures.push(`${path}: stale ${label}`);
};

const app = read("src/App.tsx");
const scorer = read("src/utils/globalT96Gear.ts");
const compare = read("src/product/workspaces/GearCompareWorkspace.tsx");
const optimize = read("src/product/workspaces/OptimizeWorkspace.tsx");
const evidence = read("src/data/panelOptimizationEvidence.ts");

requireText("src/data/panelOptimizationEvidence.ts", evidence, "minOuterPerPoint: 0.225", "Power → Min Physical conversion");
requireText("src/data/panelOptimizationEvidence.ts", evidence, "maxOuterPerPoint: 1.36", "Power → Max Physical conversion");
requireText("src/data/panelOptimizationEvidence.ts", evidence, "affinityRatePerPoint: 0.038", "Momentum → Affinity conversion");
requireText("src/data/panelOptimizationEvidence.ts", evidence, "critRatePerPoint: 0.076", "Agility → Crit conversion");

requireText("src/App.tsx", app, "power * GLOBAL_ATTRIBUTE_CONVERSIONS.power.minOuterPerPoint", "Power projection into menu panel");
requireText("src/App.tsx", app, "momentum * GLOBAL_ATTRIBUTE_CONVERSIONS.momentum.affinityRatePerPoint", "Momentum projection into menu panel");
requireText("src/App.tsx", app, "agility * GLOBAL_ATTRIBUTE_CONVERSIONS.agility.critRatePerPoint", "Agility projection into menu panel");
requireText("src/App.tsx", app, "panelModelVersion: PANEL_MODEL_VERSION", "versioned panel calibration");
requireText("src/App.tsx", app, "s.panelModelVersion !== PANEL_MODEL_VERSION", "legacy calibration invalidation");
requireText("src/App.tsx", app, "const candidateCombo = [", "complete replacement comparison");
requireText("src/App.tsx", app, "comboInCombat(candidateCombo).total", "replacement panel and rotation evaluation");
requireText("src/App.tsx", app, "deltaDps", "absolute replacement DPS delta");

requireText("src/utils/globalT96Gear.ts", scorer, "const overall = modeledContribution * 0.85 + buildFit * 0.15", "cap-independent item score");
forbidText("src/utils/globalT96Gear.ts", scorer, "rollQuality * 0.5", "roll cap used in build ranking");
requireText("src/product/workspaces/GearCompareWorkspace.tsx", compare, "Full panel + rotation", "full-build comparison label");
requireText("src/product/workspaces/GearCompareWorkspace.tsx", compare, "modeledDps", "modeled DPS comparison field");
requireText("src/product/workspaces/OptimizeWorkspace.tsx", optimize, "Panel-first build optimizer", "panel-first optimizer heading");
requireText("src/product/workspaces/OptimizeWorkspace.tsx", optimize, "not by proximity to a roll cap", "cap diagnostic positioning");

if (failures.length) {
  console.error("[panel-first-audit] FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("[panel-first-audit] PASS — attribute conversion, calibration versioning, full replacement comparison, and cap-independent ranking are active.");
