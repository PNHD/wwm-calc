import assert from "node:assert";
import { readFileSync } from "node:fs";

const calc = readFileSync(new URL("./calc.ts", import.meta.url), "utf8");

assert(calc.includes("minPzTot * pzMult - tier.def"), "Global T91 attribute damage must stay on calibrated defense-subtracted branch");
assert(calc.includes("maxPzTot * pzMult - tier.def"), "Global T91 attribute damage must stay on calibrated defense-subtracted branch");
assert(calc.includes("sk.outerRatio * offMinFrac"), "off-element damage must use physical ratio");
assert(!calc.includes("+ tier.hiddenAttr"), "Global T91 calibrated branch must not add CN hidden attribute into player panel damage");

console.log("attribute formula self-check OK");
