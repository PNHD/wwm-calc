import fs from "node:fs";
import assert from "node:assert/strict";

const src = fs.readFileSync(new URL("../data/innerways.ts", import.meta.url), "utf8");
const block = (id) => {
  const start = src.indexOf(`id:"${id}"`);
  assert(start >= 0, `Missing inner way: ${id}`);
  const rest = src.slice(start);
  const match = /\r?\n  },\r?\n  \{/.exec(rest.slice(1));
  return rest.slice(0, match ? match.index + 1 : rest.indexOf("\n];"));
};

assert(!src.includes("generalDmg:"), "Inner Ways must not add generic DPS estimates by default");
assert(!/tier:6[\s\S]*stat:\{[^}]*outerPen/.test(block("morale_chant")), "Morale Chant ramp Pen must not be a flat stat");
assert(!/tier:6[\s\S]*stat:\{[^}]*outerPen/.test(block("bitter_seasons")), "Bitter Seasons poison Pen must not be a flat stat");

console.log("innerways self-check OK");
