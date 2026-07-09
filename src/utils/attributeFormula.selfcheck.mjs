import assert from "node:assert";
import { readFileSync } from "node:fs";

const calc = readFileSync(new URL("./calc.ts", import.meta.url), "utf8");

assert(calc.includes("+ tier.hiddenAttr"), "own-element damage must include hidden level attribute");
assert(!calc.includes("minPzTot * pzMult - tier.def"), "attribute damage must not subtract physical defense");
assert(!calc.includes("maxPzTot * pzMult - tier.def"), "attribute damage must not subtract physical defense");
assert(calc.includes("offAvgTerm = ((offMin + offMax) / 2) * sk.outerRatio"), "off-element damage must use physical ratio");
assert(calc.includes("const offPzZone = T;"), "off-element damage must not use elemental penetration or elemental damage bonus");
assert(calc.includes("ownPzZone = (1 + Fpz) * T * (1 + pzDmgBonus)"), "own-element damage must keep elemental penetration and elemental damage bonus");

console.log("attribute formula self-check OK");
