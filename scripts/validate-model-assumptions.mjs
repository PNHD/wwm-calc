import fs from "node:fs";

const app = fs.readFileSync("src/App.tsx", "utf8");
const build = fs.readFileSync("src/product/workspaces/BuildWorkspace.tsx", "utf8");
const combat = fs.readFileSync("src/product/workspaces/CombatWorkspace.tsx", "utf8");
const css = fs.readFileSync("src/product/model-assumptions.css", "utf8");

const failures = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) failures.push(`${label}: missing ${JSON.stringify(text)}`);
};
const rejectText = (source, text, label) => {
  if (source.includes(text)) failures.push(`${label}: stale ${JSON.stringify(text)}`);
};

requireText(app, "const DEFAULT_DPS_EFFICIENCY = 1;", "execution default");
requireText(app, "const EXECUTION_SCALING_VERSION = 2;", "execution migration");
requireText(app, "foodMin={activeTier.foodMin}", "dynamic food minimum");
requireText(app, "foodMax={activeTier.foodMax}", "dynamic food maximum");
rejectText(app, "estimate: Math.round(rotationStats.dps * dpsEff)", "product modeled estimate");
rejectText(app, "modeledDps={rotationStats.dps * dpsEff}", "optimizer modeled DPS");
rejectText(app, "Food buff (+90 min / +180 max", "legacy food copy");

requireText(build, "Attack-Boosting Food", "build food label");
requireText(build, "+{foodMin} Min / +{foodMax} Max Physical Attack", "build food values");
requireText(build, "Advanced parse projection", "build advanced projection");
requireText(build, "does not change panel stats, Gear Compare, Stat Priority or Best Build ranking", "build projection scope");
rejectText(build, "Execution efficiency", "build execution label");

requireText(combat, "Modeled rotation DPS", "combat optimizer metric");
requireText(combat, "Parse projection", "combat projection metric");
requireText(combat, "excluded from panel calculation, gear ranking and optimization", "combat projection scope");
requireText(combat, "+{foodMin} Min / +{foodMax} Max Physical Attack", "combat food values");
rejectText(combat, "+90 min / +180 max", "combat legacy food");
rejectText(combat, "Execution efficiency", "combat execution label");

requireText(css, ".app-root[data-workspace] > .app-layout", "legacy layout isolation");
requireText(css, "display: none !important", "legacy layout hidden");

if (failures.length) {
  console.error("[model-assumptions-audit] FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[model-assumptions-audit] PASS — T96 food is tier-aware, optimizer DPS is unscaled, parse projection is optional, and legacy layout is isolated.");
