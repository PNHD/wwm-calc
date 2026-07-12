import assert from "node:assert";
import { applyTeamModifiers, qiBreakBonus } from "./teamModifiers.js";

const result = applyTeamModifiers([
  { buildKey: "stonesplit-might", dps: 100 },
  { buildKey: "bamboocut-dust", dps: 100 },
], { vulnerability: true, revelryUptime: 0.4 });
assert.equal(result.total, 240, "Stonesplit-Might gets 16% Vulnerability; Revelry averages +8%");
assert.equal(qiBreakBonus(["bamboocut-dust", "bellstrike-splendor"], true), 20);
console.log("team modifiers self-check OK");
