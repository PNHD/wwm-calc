import assert from "node:assert";
import { readFileSync } from "node:fs";

const calc = readFileSync(new URL("./calc.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

assert(calc.includes("function tierBaselineScale"), "calcBaseline must scale preview/reference tier baselines");
assert(calc.includes('if (!tier || tier.name === t91.name) return 1;'), "T91 baseline must remain exact");
assert(calc.includes("dps * tierBaselineScale(tier) * getRotationTimeForBuild(key)"), "calcBaseline must use tierBaselineScale");
assert(!app.includes("vs the best-in-slot T91 build"), "main help text must not hard-code BiS T91 baseline");
assert(app.includes("% vs the selected tier baseline"), "main help text should explain selected tier baseline");

console.log("baseline self-check OK");
