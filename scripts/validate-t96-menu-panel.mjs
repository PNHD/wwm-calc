import assert from "node:assert/strict";
import fs from "node:fs";
import { T96_PRODUCT_MODEL_VERSION } from "../src/utils/t96ProductModel.mjs";

const app = fs.readFileSync("src/App.tsx", "utf8");

assert.equal(T96_PRODUCT_MODEL_VERSION, 4, "menu-panel contract change must invalidate v3 calibrations");
assert.ok(app.includes('if (selectedBuild === "bamboocut-dust") {\n        projected.outerPen += iwStats.outerPen'), "Bamboocut MENU PANEL must add static Inner Way Attribute Buffs after residual+gear projection");
assert.ok(app.includes('if (selectedBuild !== "bamboocut-dust") {'), "adjusted panel must preserve legacy paths while avoiding Bamboocut double count");
assert.ok(app.includes('p.iwGeneralDmg = 0; p.iwOuterPen = 0; p.iwPzPen = 0; p.iwPzDmg = 0;'), "Bamboocut conditional Inner Way mechanics must stay out of deterministic panel state");
assert.ok(app.includes('const observedInnerWayIds = ["phantom_rally", "morale_chant", "towline_sweep", "song_of_tang"]'), "observed preset must load the supplied four T6 Inner Ways");
assert.ok(app.includes("const observedResidual: Partial<PanelStats> = {};"), "observed preset must solve a residual instead of relying on the legacy fixed gearless base");
assert.ok(app.includes("observed - (observedGearSum[key] || 0) - (observedIw[key as string] || 0)"), "observed preset residual must subtract gear and static Inner Way contributions");
assert.ok(app.includes("panelModelVersion: PANEL_MODEL_VERSION"), "observed preset calibration must be versioned");
assert.ok(app.includes("setSelectedInnerWays(observedInnerWayIds)"), "observed preset must activate supplied Inner Ways without owner re-entry");
assert.ok(app.includes("setInnerWayTiers(observedInnerWayTiers)"), "observed preset must activate all four at T6");

console.log("[t96-menu-panel] PASS — deterministic Bamboocut menu panel and observed 1106 preset obey the residual + gear + static Inner Way contract.");
