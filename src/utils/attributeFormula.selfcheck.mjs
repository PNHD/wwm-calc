import assert from "node:assert";
import { readFileSync } from "node:fs";

const calc = readFileSync(new URL("./calc.ts", import.meta.url), "utf8");

assert(calc.includes("+ tier.hiddenAttr"), "own-element damage must include hidden level attribute");
assert(!calc.includes("minPzTot * pzMult - tier.def"), "attribute damage must not subtract physical defense");
assert(!calc.includes("maxPzTot * pzMult - tier.def"), "attribute damage must not subtract physical defense");
assert(calc.includes("offMin * sk.outerRatio"), "off-element damage must use physical ratio");

console.log("attribute formula self-check OK");
