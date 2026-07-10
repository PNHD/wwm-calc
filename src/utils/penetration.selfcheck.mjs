import assert from "node:assert";
import { readFileSync } from "node:fs";

const calc = readFileSync(new URL("./calc.ts", import.meta.url), "utf8");

assert(calc.includes("function netPenZone"), "net penetration must be centralized");
assert(calc.includes("return delta >= 0 ? delta / 200 : delta / 100;"), "Global T91 positive net pen must use /200 and negative net pen must use /100");

console.log("penetration self-check OK");
