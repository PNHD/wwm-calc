// Parse the official WWM dashboard `roleInfo` payload (what the "Copy WWM Gear"
// bookmarklet copies: JSON.stringify(j.data)) into gear pieces the app understands.
//
// Only EQUIPPED gear is in this payload (wearEquipsDetailed) — the API has no bag.
// Affixes are coded as [affixId, value, quality, tier, isSpecial]; the game gives
// the exact value, and value/quality === the stat's max roll. We identify the stat
// by that max roll (+ a few id heuristics for min/max & %-collisions). Values are
// always exact; ambiguous stat *labels* are marked `flagged` so the UI can ask the
// user to verify.
//
// ponytail: historical one-sample label heuristic; every fallback needs review.
// Expand confirmed ID coverage only from attributable dashboard payloads.

import { resolveAffixStat, OFFICIAL_SLOT_MAP } from "../data/affixMap";
import { inspectBoundedJson, isPlainRecord } from "../product/storage-registry.js";

export interface ImportedSub { type: string; val: string; flagged?: boolean }
export interface ImportedPiece { officialSlot: string; slot: string; subs: ImportedSub[] }
export interface ImportResult {
  roleName: string; level: number;
  pieces: ImportedPiece[];
  skipped: string[]; // human notes about slots/affixes we couldn't map
}

// Slot + affixId decode tables live in src/data/affixMap.ts (extracted from the
// official + competitor data). resolveAffixStat() returns a CONFIRMED stat or null;
// OFFICIAL_SLOT_MAP maps official slot ids → app slots (9 & 21 = bow pieces, skipped).
const SLOT_MAP = OFFICIAL_SLOT_MAP;

// Known max rolls (display units) → candidate stat. `flagged` collisions need a
// human check. Min/Max phys share 63.8 and are split by the id's last digit below.
interface Bucket { mr: number; pct: boolean; type: string; flagged?: boolean }
const BUCKETS: Bucket[] = [
  { mr: 7.4, pct: true, type: "Crit Rate" },
  { mr: 6.6, pct: true, type: "Precision" },
  { mr: 3.6, pct: true, type: "Affinity Rate" },
  { mr: 5.0, pct: true, type: "Crit DMG", flagged: true },   // vs Affinity DMG
  { mr: 2.6, pct: true, type: "All Martial Arts", flagged: true }, // vs weapon boost
  { mr: 2.0, pct: true, type: "Phys DMG%", flagged: true },  // vs Boss/Player DMG
  { mr: 63.8, pct: false, type: "Max Phys Atk" },            // min/max split by id
  { mr: 36.2, pct: false, type: "Max Bamboocut Atk", flagged: true }, // min/max + element
  { mr: 40.4, pct: false, type: "Power" },                   // five-attr, ~no DPS impact
  { mr: 9.0, pct: false, type: "Phys Pen", flagged: true },  // vs Formless Pen
  { mr: 10.8, pct: false, type: "Phys Pen", flagged: true },
];

function displayValue(value: number, percent: boolean): string {
  // Remove multiplication noise without rounding rolled stats to tenths.
  return String(percent ? Number((value * 100).toPrecision(12)) : value);
}

function mapAffix(affixId: number, value: number, quality: number): ImportedSub | null {
  const id = String(affixId);
  // Confirmed exact mapping first (affixMap), else fall back to the max-roll heuristic.
  const exact = resolveAffixStat(affixId);
  if (exact) return { type: exact, val: displayValue(value, exact === "Crit Rate"), flagged: false };
  const q = quality;
  const pct = value > 0 && value < 1;        // %-stats are stored as fractions
  const shown = pct ? value * 100 : value;
  const maxRoll = shown / q;
  let best: Bucket | null = null;
  let bestErr = Infinity;
  for (const b of BUCKETS) {
    if (b.pct !== pct) continue;
    const err = Math.abs(b.mr - maxRoll) / b.mr;
    if (err < bestErr) { bestErr = err; best = b; }
  }
  if (!best || bestErr > 0.08) return null; // unknown stat → caller notes it
  let type = best.type;
  // Min/Max phys: ids ...7 = Min, ...8 = Max; otherwise keep default (Max) but flag.
  if (best.mr === 63.8) {
    if (id.endsWith("7")) type = "Min Phys Atk";
    else if (id.endsWith("8")) type = "Max Phys Atk";
  }
  if (best.mr === 36.2 && id.endsWith("7")) type = "Min Bamboocut Atk";
  return { type, val: displayValue(value, pct), flagged: true };
}

export function parseGameData(raw: string): ImportResult {
  if (raw.length > 512 * 1024 || new TextEncoder().encode(raw).byteLength > 512 * 1024) throw new Error("Gear JSON is too large (maximum 512 KiB). Copy equipped gear only.");
  let data: any;
  try {
    data = JSON.parse(raw.trim());
  } catch {
    throw new Error("That doesn't look like valid JSON. Re-copy with the bookmarklet.");
  }
  // Accept either the whole {data:{...}} or just the inner data object.
  if (isPlainRecord(data) && isPlainRecord(data.data) && data.data.wearEquipsDetailed) data = data.data;
  const detailed = data?.wearEquipsDetailed;
  if (!isPlainRecord(data) || !isPlainRecord(detailed)) {
    throw new Error("No equipped-gear data found (wearEquipsDetailed missing).");
  }
  inspectBoundedJson(detailed, { maxArray: 100, maxKeys: 100, maxString: 1024 });
  const pieces: ImportedPiece[] = [];
  const skipped: string[] = [];
  for (const officialSlot of Object.keys(detailed)) {
    const slot = Object.hasOwn(SLOT_MAP, officialSlot) ? SLOT_MAP[officialSlot] : undefined;
    if (!slot) { skipped.push(`Slot ${officialSlot} (not modeled — likely a bow piece)`); continue; }
    const affixes = detailed[officialSlot]?.exVo?.baseAffixes;
    if (!Array.isArray(affixes) || affixes.length > 24) throw new Error(`${slot}: equipped affixes are missing or invalid.`);
    const subs: ImportedSub[] = [];
    for (const a of affixes) {
      const d = a?.equipmentDetails;
      if (!Array.isArray(d) || d.length < 3 || !Number.isSafeInteger(d[0]) || d[0] <= 0 || typeof d[1] !== "number" || !Number.isFinite(d[1]) || d[1] < 0 || typeof d[2] !== "number" || !Number.isFinite(d[2]) || d[2] <= 0) throw new Error(`${slot}: an affix has an invalid ID, value or quality. No gear was imported.`);
      const sub = mapAffix(d[0], d[1], d[2]);
      if (sub) subs.push(sub);
      else skipped.push(`${slot}: affix ${d[0]} (${d[1]}) — unrecognised`);
    }
    if (subs.length) pieces.push({ officialSlot, slot, subs });
  }
  if (!pieces.length) throw new Error("No supported equipped gear could be mapped. Check the copied dashboard data.");
  return {
    roleName: typeof data.roleName === "string" ? data.roleName.slice(0, 80) : "Imported",
    level: Number.isSafeInteger(data.level) && data.level >= 0 && data.level <= 1000 ? data.level : 0,
    pieces, skipped,
  };
}

// ponytail self-check: one weapon piece from a real payload maps to exact values.
export function demoCheck() {
  const sample = JSON.stringify({ data: { roleName: "T", level: 95, wearEquipsDetailed: {
    "1": { exVo: { baseAffixes: [
      { equipmentDetails: [9293019, 0.06956, 0.94, 3, true] }, // crit 7.4 max → 7.4
      { equipmentDetails: [9293008, 59.972, 0.94, 3, true] },  // ...8 → Max Phys, 63.8
      { equipmentDetails: [9293007, 59.972, 0.94, 3, true] },  // ...7 → Min Phys
    ] } },
  } } });
  const r = parseGameData(sample);
  const subs = r.pieces[0].subs;
  // value is the actual rolled stat (6.956% here), not the max roll.
  console.assert(subs.some(s => s.type === "Crit Rate" && s.val === "6.956"), "crit map");
  console.assert(subs.some(s => s.type === "Max Phys Atk"), "max phys map (...8)");
  console.assert(subs.some(s => s.type === "Min Phys Atk"), "min phys map (...7)");
  console.assert(r.pieces[0].slot === "Umbrella", "slot map");
  return r;
}
