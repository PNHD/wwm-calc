import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const provenance = read("src/product/PathProvenance.tsx");
const shell = read("src/product/ProductShell.tsx");
const compare = read("src/product/workspaces/GearCompareWorkspace.tsx");
const app = read("src/App.tsx");
const trust = read("src/data/modelTrust.ts");
const catalog = read("src/data/pathCatalog.ts");

for (const token of ["Provisional model", "REFERENCE_ONLY", "Numerical model unavailable", "49.5-second source/CN", "60-second Global 2.1", "0.65 provisional", "0.45 legacy Jade", "observed roughly 46–47k versus modeled roughly 60–61k"]) assert.ok(provenance.includes(token), `missing provenance disclosure: ${token}`);
assert.ok(shell.includes("<PathProvenance pathKey={context.pathKey} />"), "path provenance is not visible in the product shell");
assert.ok(shell.includes("Run provisional Best Build"), "Best Build lacks provisional qualifier");
assert.ok(compare.includes('getCapabilityState(pathKey, "gearCompare") === "PROVISIONAL"'), "Gear Compare is not capability-aware");
assert.ok(compare.includes("row.available !== false"), "Gear Compare winner guard is missing");
assert.ok(compare.includes("PROVISIONAL MODEL DPS"), "Gear Compare lacks provisional qualifier");
assert.ok(app.includes("Provisional model ranking for"), "Stat Priority lacks provisional qualifier");
assert.ok(app.includes("Provisional Best Build") && app.includes("Leading modeled combination"), "Best Build still presents as an absolute recommendation");
assert.ok(app.includes('const legacyCapability = legacyAnalysisCapability[gradModalActiveTab];') && app.includes('if (legacyCapability && !isProductCapabilityEnabled(selectedBuild, legacyCapability))'), "stale actionable analysis result guard is missing");
assert.ok(!trust.includes('maturity: "CALIBRATED"'), "Dust still claims calibrated maturity");
for (const path of ["bamboocut-wind", "stonesplit-might", "stonesplit-strength", "bamboocut-kite", "bamboocut-draught"]) assert.ok(catalog.includes(`"${path}"`), `missing canonical path: ${path}`);
assert.ok(catalog.includes('"bamboocut-wind": { pathKey: "bamboocut-wind", ...pathCapabilities("REFERENCE_ONLY"'), "Wind must remain reference-only");
for (const path of ["stonesplit-might", "stonesplit-strength", "bamboocut-kite", "bamboocut-draught"]) assert.ok(catalog.includes(`"${path}": { pathKey: "${path}", ...pathCapabilities("UNMODELED"`), `${path} must remain unmodeled`);
assert.ok(!provenance.includes("utils/") && !compare.includes("gearPathFit"), "presentation slice must not change numerical calculation or revive path fit");

console.log("[v13-provenance-presentation] PASS — provisional, reference-only, and unavailable presentation contracts verified.");
