import assert from "node:assert/strict";
import fs from "node:fs";

const calc = fs.readFileSync("src/utils/calc.ts", "utf8");
const app = fs.readFileSync("src/App.tsx", "utf8");
const trust = fs.readFileSync("src/data/modelTrust.ts", "utf8");

assert.match(calc, /UNMODELED_PATHS = new Set\(\["bamboocut-draught"\]\)/);
assert.match(calc, /if \(buildKey && UNMODELED_PATHS\.has\(buildKey\)\) return \[\]/);
assert.match(calc, /if \(buildKey && UNMODELED_PATHS\.has\(buildKey\)\) return 0/);
assert.match(calc, /if \(UNMODELED_PATHS\.has\(key\)\) return 0/);
assert.match(trust, /label: "Bamboocut - Draught"/);
assert.match(trust, /maturity: "UNMODELED"/);
assert.match(trust, /Skystrike Gauntlets and Riven Twinblades are known/);
assert.match(app, /Bamboocut - Draught \(current Global · numerical model unavailable\)/);
assert.match(app, /DPS, graduation, ranking, and optimizer recommendations are unavailable/);
assert.match(app, /Best Build is unavailable: Bamboocut - Draught has no numerical model/);
assert.doesNotMatch(calc, /"bamboocut-draught"\s*:/);

console.log("[v13-bamboocut-draught] PASS — current content is recognized and numerical fallback is blocked.");
