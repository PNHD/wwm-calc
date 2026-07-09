import assert from "node:assert";
import { readFileSync } from "node:fs";

const calc = readFileSync(new URL("./calc.ts", import.meta.url), "utf8");

for (const key of ["350|0.45", "350|0.45-t96", "307|0.3", "405|0.65", "405|0.65b", "559|1.15"]) {
  assert(calc.includes(`"${key}"`), `missing tier ${key}`);
}

assert(calc.includes("Tier 96 / Lv95 Global Preview"), "missing Global T96 preview label");
assert(calc.includes("Excel 各等级模板: 95上"), "T96 preview must cite the 95上 source column");

console.log("tier constants self-check OK");
