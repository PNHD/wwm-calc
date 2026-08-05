import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

function replaceRegexRequired(pattern, replacement, label) {
  if (!pattern.test(source)) {
    if (source.includes(replacement)) return;
    throw new Error(`[model-assumptions] Missing regex anchor: ${label}`);
  }
  source = source.replace(pattern, replacement);
}

function addTierFoodProps(componentName) {
  const start = source.indexOf(`<${componentName}`);
  if (start < 0) throw new Error(`[model-assumptions] Missing component: ${componentName}`);
  const end = source.indexOf("/>", start);
  if (end < 0) throw new Error(`[model-assumptions] Unterminated component: ${componentName}`);
  const block = source.slice(start, end + 2);
  if (block.includes("foodMin={activeTier.foodMin}")) return;
  if (!block.includes("food={food}")) throw new Error(`[model-assumptions] Missing food prop in ${componentName}`);
  const patched = block.replace(
    "food={food}",
    "food={food}\n              foodMin={activeTier.foodMin}\n              foodMax={activeTier.foodMax}",
  );
  source = source.slice(0, start) + patched + source.slice(end + 2);
}

replaceRegexRequired(
  /const DEFAULT_DPS_EFFICIENCY = 0\.88;\nconst savedDpsEfficiency = \(\) => \{[\s\S]*?\n\};/,
  `const DEFAULT_DPS_EFFICIENCY = 1;
const EXECUTION_SCALING_STORAGE_KEY = "wwm_execution_scaling_v2";
const savedDpsEfficiency = () => {
  try {
    // Legacy configuration stored 88% as a global default and silently scaled
    // modeled output. The v2 key is opt-in and controls parse projection only.
    const value = Number(localStorage.getItem(EXECUTION_SCALING_STORAGE_KEY));
    return Number.isFinite(value) && value > 0
      ? Math.max(0.5, Math.min(1, value))
      : DEFAULT_DPS_EFFICIENCY;
  } catch {
    return DEFAULT_DPS_EFFICIENCY;
  }
};`,
  "execution scaling default and migration",
);

source = source.replaceAll(
  "if (config.dpsEff !== undefined) setDpsEff(config.dpsEff === 1 && !config.dpsEffUserSet ? DEFAULT_DPS_EFFICIENCY : config.dpsEff);",
  "setDpsEff(savedDpsEfficiency());",
);
source = source.replaceAll(
  "onEfficiencyChange={setDpsEff}",
  "onEfficiencyChange={(value) => { setDpsEff(value); localStorage.setItem(EXECUTION_SCALING_STORAGE_KEY, String(value)); }}",
);

source = source.replaceAll("foodMin: 90, foodMax: 180", "foodMin: 120, foodMax: 240");
addTierFoodProps("BuildWorkspace");
addTierFoodProps("CombatWorkspace");

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
source = source.replaceAll("efficiency applied", "optional parse scaling");

if (source.includes("Food buff (+90 min / +180 max")) {
  throw new Error("[model-assumptions] Stale T91 food copy remains in generated App.tsx");
}
if (source.includes("estimate: Math.round(rotationStats.dps * dpsEff)")) {
  throw new Error("[model-assumptions] Product context still scales modeled DPS");
}
if (source.includes("modeledDps={rotationStats.dps * dpsEff}")) {
  throw new Error("[model-assumptions] Optimizer-facing modeled DPS still uses parse scaling");
}
if (!source.includes("EXECUTION_SCALING_STORAGE_KEY")) {
  throw new Error("[model-assumptions] Parse projection persistence was not generated");
}

fs.writeFileSync(path, source, "utf8");
console.log("[model-assumptions] T96 food, unscaled optimizer output, and optional parse projection applied.");
