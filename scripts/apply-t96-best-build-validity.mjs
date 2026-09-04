import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

const normalizeEol = (value) => value.replace(/\r\n/g, "\n");
const hasNormalized = (value, expected) => normalizeEol(value).includes(expected);
const replaceNormalized = (value, from, to, label) => {
  if (!hasNormalized(value, from)) throw new Error(`[t96-best-build-validity] ${label} missing`);
  const eol = value.includes("\r\n") ? "\r\n" : "\n";
  return value.replace(from.replaceAll("\n", eol), to.replaceAll("\n", eol));
};

const importAnchor = 'import { SPEEDRUN_BOSSES, SPEEDRUN_PLAYBOOK } from "./data/speedrunGuide";';
const compatibilityImport = 'import { validateGlobalT96GearLines } from "./data/globalT96GearCompatibility";';
const requiredSlotOrder = 'const SLOT_ORDER = ["Umbrella", "Rope Dart", "Disc", "Pendant", "Helmet", "Chest", "Bracers", "Greaves"];';
const validityInvariants = (value) => {
  const normalized = normalizeEol(value);
  const requestGuard = "bestBuildRequestId.current === requestId && selectedBuild === requestPathKey";
  const requestGuardCount = normalized.split(requestGuard).length - 1;
  const legacyCompletion = normalized.includes("setBestBuildResult([]);");
  const pathKeyedCompletion = requestGuardCount >= 2
    && normalized.includes("setBestBuildResult({ pathKey: requestPathKey, entries: [] });")
    && normalized.includes("setBestBuildResult({ pathKey: requestPathKey, entries: top });");
  return {
    compatibilityImport: normalized.includes(compatibilityImport),
    validGearFilter: normalized.includes("validateGlobalT96GearLines(item.slot, item.subs).errors.length === 0"),
    requiredSlotOrder: normalized.includes(requiredSlotOrder),
    completeSlotDetection: normalized.includes("const missingSlots = SLOT_ORDER.filter((slot) => bySlot[slot].length === 0);")
      && normalized.includes('console.warn("[best-build] No valid complete build: missing " + missingSlots.join(", "));'),
    exactSearchFailClosed: normalized.includes('if (opts.length === 0) throw new Error(`Best Build invariant: missing required slot ${SLOT_ORDER[idx]}`);'),
    beamSearchFailClosed: normalized.includes('if (!options.length) throw new Error(`Best Build invariant: missing required slot ${SLOT_ORDER[slotIndex]}`);'),
    completionState: legacyCompletion || pathKeyedCompletion,
  };
};
const missingValidityInvariants = (value) => Object.entries(validityInvariants(value))
  .filter(([, present]) => !present)
  .map(([name]) => name);

if (missingValidityInvariants(source).length === 0) {
  console.log("[t96-best-build-validity] Already applied; preserving path-keyed Best Build state.");
  process.exit(0);
}

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
      console.warn("[best-build] No valid complete build: missing " + missingSlots.join(", "));
      setBestBuildResult([]);
      setBestBuildProgress(100);
      setBestBuildEta(null);
      setBestBuildRunning(false);
      return;
    }`;
if (!hasNormalized(source, newPool)) {
  source = replaceNormalized(source, oldPool, newPool, "optimizer pool anchor");
}

const recurseFallback = '      if (opts.length === 0) { await recurse(idx + 1, acc); return; }';
const recurseInvariant = '      if (opts.length === 0) throw new Error(`Best Build invariant: missing required slot ${SLOT_ORDER[idx]}`);';
if (!hasNormalized(source, recurseInvariant)) {
  source = replaceNormalized(source, recurseFallback, recurseInvariant, "exact-search empty-slot fallback");
}

const beamFallback = '        if (!options.length) continue;';
const beamInvariant = '        if (!options.length) throw new Error(`Best Build invariant: missing required slot ${SLOT_ORDER[slotIndex]}`);';
if (!hasNormalized(source, beamInvariant)) {
  source = replaceNormalized(source, beamFallback, beamInvariant, "beam-search empty-slot fallback");
}

const missing = missingValidityInvariants(source);
if (missing.length) throw new Error(`[t96-best-build-validity] required invariants missing after transform: ${missing.join(", ")}`);
fs.writeFileSync(path, source, "utf8");
console.log("[t96-best-build-validity] PASS — Best Build ranks only valid complete 8-slot Global T96 combinations.");
