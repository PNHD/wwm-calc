import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

const importAnchor = 'import { SPEEDRUN_BOSSES, SPEEDRUN_PLAYBOOK } from "./data/speedrunGuide";';
const compatibilityImport = 'import { validateGlobalT96GearLines } from "./data/globalT96GearCompatibility";';
if (!source.includes(compatibilityImport)) {
  if (!source.includes(importAnchor)) throw new Error("[t96-best-build-validity] import anchor missing");
  source = source.replace(importAnchor, `${importAnchor}\n${compatibilityImport}`);
}

const oldPool = `    const pool = getActiveGear();
    const SLOT_ORDER = ["Umbrella", "Rope Dart", "Disc", "Pendant", "Helmet", "Chest", "Bracers", "Greaves"];
    const bySlot: Record<string, GearItem[]> = {};
    SLOT_ORDER.forEach(s => { bySlot[s] = pool.filter(it => it.slot === s); });`;
const newPool = `    const rawPool = getActiveGear();
    // Revalidate stored/manual inventory as well as OCR imports. Legacy data can
    // predate the T96 source guard, so a weapon containing both native Void and
    // historical Path lines must never participate in optimizer ranking.
    const pool = rawPool.filter((item) => validateGlobalT96GearLines(item.slot, item.subs).errors.length === 0);
    const SLOT_ORDER = ["Umbrella", "Rope Dart", "Disc", "Pendant", "Helmet", "Chest", "Bracers", "Greaves"];
    const bySlot: Record<string, GearItem[]> = {};
    SLOT_ORDER.forEach(s => { bySlot[s] = pool.filter(it => it.slot === s); });
    const missingSlots = SLOT_ORDER.filter((slot) => bySlot[slot].length === 0);
    if (missingSlots.length) {
      console.warn(`[best-build] No valid complete build: missing ${missingSlots.join(", ")}`);
      setBestBuildResult([]);
      setBestBuildProgress(100);
      setBestBuildEta(null);
      setBestBuildRunning(false);
      return;
    }`;
if (!source.includes(newPool)) {
  if (!source.includes(oldPool)) throw new Error("[t96-best-build-validity] optimizer pool anchor missing");
  source = source.replace(oldPool, newPool);
}

source = source.replace(
  '      if (opts.length === 0) { await recurse(idx + 1, acc); return; }',
  '      if (opts.length === 0) throw new Error(`Best Build invariant: missing required slot ${SLOT_ORDER[idx]}`);',
);
source = source.replace(
  '        if (!options.length) continue;',
  '        if (!options.length) throw new Error(`Best Build invariant: missing required slot ${SLOT_ORDER[slotIndex]}`);',
);

if (!source.includes("validateGlobalT96GearLines(item.slot, item.subs).errors.length === 0")) throw new Error("[t96-best-build-validity] invalid gear filter missing");
if (!source.includes("const missingSlots = SLOT_ORDER.filter")) throw new Error("[t96-best-build-validity] complete-slot guard missing");
fs.writeFileSync(path, source, "utf8");
console.log("[t96-best-build-validity] PASS — Best Build ranks only valid complete 8-slot Global T96 combinations.");
