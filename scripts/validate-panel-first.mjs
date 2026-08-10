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
const model = read("src/utils/t96ProductModel.mjs");

requireText("src/data/panelOptimizationEvidence.ts", evidence, "CLIENT_T96_ATTRIBUTE_CONVERSIONS", "client-calibrated Global T96 conversion source");
requireText("src/data/panelOptimizationEvidence.ts", evidence, "GLOBAL_ATTRIBUTE_CONVERSIONS_COMMUNITY_PRIOR", "community coefficient provenance");
requireText("src/utils/t96ProductModel.mjs", model, "client-calibrated-single-swap", "conversion confidence disclosure");
requireText("src/utils/t96ProductModel.mjs", model, "minOuterPerPoint: 0.225", "Power → Min Physical measured prior");
requireText("src/utils/t96ProductModel.mjs", model, "maxOuterPerPoint: 1.3459821428571428", "T96 Power → Max Physical client calibration");
requireText("src/utils/t96ProductModel.mjs", model, "critRatePerPoint: 0.10560344827586207", "T96 Agility → Crit client calibration");

requireText("src/App.tsx", app, "power * GLOBAL_ATTRIBUTE_CONVERSIONS.power.minOuterPerPoint", "Power projection into menu panel");
requireText("src/App.tsx", app, "momentum * GLOBAL_ATTRIBUTE_CONVERSIONS.momentum.affinityRatePerPoint", "Momentum projection into menu panel");
requireText("src/App.tsx", app, "agility * GLOBAL_ATTRIBUTE_CONVERSIONS.agility.critRatePerPoint", "Agility projection into menu panel");
requireText("src/App.tsx", app, "panelModelVersion: PANEL_MODEL_VERSION", "versioned panel calibration");
requireText("src/App.tsx", app, "s.panelModelVersion !== PANEL_MODEL_VERSION", "legacy calibration invalidation");
requireText("src/App.tsx", app, "starweavePieces >= 2", "T96 Starweave static 2pc rebuild");
requireText("src/App.tsx", app, "const candidateCombo = [", "complete replacement comparison");
if (!(app.includes("comboInCombat(candidateCombo).total") || (app.includes("const candidateCombat = comboInCombat(candidateCombo)") && app.includes("candidateCombat.total")))) {
  failures.push("src/App.tsx: missing replacement panel and rotation evaluation");
}
requireText("src/App.tsx", app, "deltaDps", "absolute replacement DPS delta");
requireText("src/App.tsx", app, "timelineResult.total", "timeline-driven optimizer ranking");

requireText("src/utils/globalT96Gear.ts", scorer, "const overall = modeledContribution * 0.85 + buildFit * 0.15", "cap-independent item diagnostic score");
forbidText("src/utils/globalT96Gear.ts", scorer, "rollQuality * 0.5", "roll cap used in build ranking");
if (!(compare.includes("Menu panel + combat timeline + rotation") || compare.includes("Menu panel → eligibility → timeline → DPS"))) {
  failures.push("src/product/workspaces/GearCompareWorkspace.tsx: missing full-build comparison label");
}
requireText("src/product/workspaces/GearCompareWorkspace.tsx", compare, "modeledDps", "modeled DPS comparison field");
requireText("src/product/workspaces/GearCompareWorkspace.tsx", compare, "MENU PANEL DELTA", "deterministic menu-panel delta UI");
requireText("src/product/workspaces/OptimizeWorkspace.tsx", optimize, "Panel-first build optimizer", "panel-first optimizer heading");
requireText("src/product/workspaces/OptimizeWorkspace.tsx", optimize, "not by proximity to a roll cap", "cap diagnostic positioning");
forbidText("src/data/panelOptimizationEvidence.ts", evidence, "0 Precision / 0 Crit", "Bellstrike distribution leaking into active Bamboocut model");
forbidText("src/data/panelOptimizationEvidence.ts", evidence, "2 Precision + 1 Crit", "Bellstrike distribution leaking into active Bamboocut model");

if (failures.length) {
  console.error("[panel-first-audit] FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("[panel-first-audit] PASS — Global T96 client-calibrated panel, set rebuild, full replacement comparison, timeline ranking and cap-independent diagnostics are active.");
