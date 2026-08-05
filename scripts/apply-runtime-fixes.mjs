import fs from "node:fs";

const path = "src/utils/globalT96Gear.ts";
let source = fs.readFileSync(path, "utf8");

const stale = '  if (!recognized.length) warnings.push("This item cannot be roll-scored from the verified 100上 table yet.");';
const fixed = '  if (recognizedLineCount === 0) warnings.push("This item cannot be roll-scored from the verified 100上 table yet.");';

if (!source.includes(fixed)) {
  if (!source.includes(stale)) {
    throw new Error("[runtime-fixes] Missing stale recognized.length anchor in generated gear scorer");
  }
  source = source.replace(stale, fixed);
  fs.writeFileSync(path, source, "utf8");
}

if (/\brecognized\.length\b/.test(source)) {
  throw new Error("[runtime-fixes] Generated gear scorer still contains an undefined recognized.length reference");
}

console.log("[runtime-fixes] Removed stale recognized.length reference from the generated gear scorer.");
