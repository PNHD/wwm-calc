import assert from "node:assert";
import { readFileSync } from "node:fs";

const calc = readFileSync(new URL("./calc.ts", import.meta.url), "utf8");

assert(calc.includes("function netPenZone"), "net penetration must be centralized");
assert(calc.includes("return delta >= 0 ? delta / 100 : delta / 200;"), "positive net pen must use /100 and negative net pen must use /200");
assert(!calc.includes("totalOuterPen >= 0 ? totalOuterPen / 200"), "physical pen branch is reversed");
assert(!calc.includes("totalPzPen >= 0 ? totalPzPen / 200"), "attribute pen branch is reversed");

console.log("penetration self-check OK");
