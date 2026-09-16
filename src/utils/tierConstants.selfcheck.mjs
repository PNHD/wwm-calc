import assert from "node:assert";
import { readFileSync } from "node:fs";

const calc = readFileSync(new URL("./calc.ts", import.meta.url), "utf8");

for (const key of ["350|0.45", "350|0.45-t96", "307|0.3", "405|0.65", "405|0.65b", "559|1.15"]) {
  assert(calc.includes(`"${key}"`), `missing tier ${key}`);
}

assert(calc.includes("Tier 96 / Lv100 Global 2.1"), "missing accepted Global 2.1 T96 label");
assert(calc.includes("Existing accepted T96 calibration fixture + Excel"), "T96 tier must cite the accepted calibration and source sheet");

console.log("tier constants self-check OK");
