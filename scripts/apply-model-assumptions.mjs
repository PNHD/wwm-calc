import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

function replaceRequired(from, to, label) {
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`[model-assumptions] Missing anchor: ${label}`);
  source = source.replace(from, to);
}

function replaceAllRequired(from, to, label) {
  if (!source.includes(from)) {
    if (source.includes(to)) return;
    throw new Error(`[model-assumptions] Missing anchor: ${label}`);
  }
  source = source.replaceAll(from, to);
}

function replaceRegexRequired(pattern, replacement, label) {
  if (!pattern.test(source)) {
    if (source.includes(replacement)) return;
    throw new Error(`[model-assumptions] Missing regex anchor: ${label}`);
  }
  source = source.replace(pattern, replacement);
}

replaceRegexRequired(
  /const DEFAULT_DPS_EFFICIENCY = 0\.88;\nconst savedDpsEfficiency = \(\) => \{[\s\S]*?\n\};/,
  `const DEFAULT_DPS_EFFICIENCY = 1;
const EXECUTION_SCALING_VERSION = 2;
const savedDpsEfficiency = () => {
  try {
    const config = JSON.parse(localStorage.getItem("wwm_calc_config") || "{}");
    // Version 1 stored 88% as a global default and silently scaled every modeled
    // number. Version 2 treats execution as an optional parse projection only.
    if (config?.executionScalingVersion !== EXECUTION_SCALING_VERSION) return DEFAULT_DPS_EFFICIENCY;
    const value = Number(config?.dpsEff);
    return Number.isFinite(value) ? Math.max(0.5, Math.min(1, value)) : DEFAULT_DPS_EFFICIENCY;
  } catch {
    return DEFAULT_DPS_EFFICIENCY;
  }
};`,
  "execution scaling default and migration",
);

replaceAllRequired(
  "dpsEffUserSet: true,",
  "dpsEffUserSet: true, executionScalingVersion: EXECUTION_SCALING_VERSION,",
  "execution scaling config version",
);

source = source.replaceAll(
  "if (config.dpsEff !== undefined) setDpsEff(config.dpsEff === 1 && !config.dpsEffUserSet ? DEFAULT_DPS_EFFICIENCY : config.dpsEff);",
  "setDpsEff(config.executionScalingVersion === EXECUTION_SCALING_VERSION && Number.isFinite(Number(config.dpsEff)) ? Math.max(0.5, Math.min(1, Number(config.dpsEff))) : DEFAULT_DPS_EFFICIENCY);",
);

source = source.replaceAll("foodMin: 90, foodMax: 180", "foodMin: 120, foodMax: 240");

replaceAllRequired(
  "food={food}\n              efficiency={dpsEff}",
  "food={food}\n              foodMin={activeTier.foodMin}\n              foodMax={activeTier.foodMax}\n              efficiency={dpsEff}",
  "tier-aware food props",
);

source = source.replaceAll(
  "estimate: Math.round(rotationStats.dps * dpsEff).toLocaleString(),",
  "estimate: Math.round(rotationStats.dps).toLocaleString(),",
);
source = source.replaceAll(
  "estimate: Math.round(rotationStats.dps * dpsEff),",
  "estimate: Math.round(rotationStats.dps),",
);
source = source.replaceAll(
  "modeledDps={rotationStats.dps * dpsEff}",
  "modeledDps={rotationStats.dps}",
);

source = source.replaceAll(
  "<span>Food buff (+90 min / +180 max Phys Atk)</span>",
  "<span>Attack-Boosting Food (+{activeTier.foodMin} min / +{activeTier.foodMax} max Physical ATK)</span>",
);
source = source.replaceAll("Rotation efficiency", "Parse projection");
source = source.replaceAll(
  "Adjusts the theoretical rotation to a realistic parse estimate.",
  "Presentation-only estimate for missed inputs and imperfect uptime; excluded from gear ranking.",
);
source = source.replaceAll(
  "efficiency applied",
  "optional parse scaling",
);

if (source.includes("Food buff (+90 min / +180 max")) {
  throw new Error("[model-assumptions] Stale T91 food copy remains in generated App.tsx");
}
if (source.includes("estimate: Math.round(rotationStats.dps * dpsEff)")) {
  throw new Error("[model-assumptions] Product context still scales modeled DPS");
}
if (source.includes("modeledDps={rotationStats.dps * dpsEff}")) {
  throw new Error("[model-assumptions] Optimizer-facing modeled DPS still uses parse scaling");
}

fs.writeFileSync(path, source, "utf8");
console.log("[model-assumptions] T96 food, unscaled optimizer output, and optional parse projection applied.");
