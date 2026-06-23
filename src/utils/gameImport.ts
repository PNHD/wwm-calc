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
// ponytail: heuristic mapper from one sample — correct family + value, best-effort
// on min/max & critDMG/affDMG/pen collisions. Refine AFFIX_OVERRIDE as users report.

export interface ImportedSub { type: string; val: string; flagged?: boolean }
export interface ImportedPiece { officialSlot: string; slot: string; subs: ImportedSub[] }
export interface ImportResult {
  roleName: string; level: number;
  pieces: ImportedPiece[];
  skipped: string[]; // human notes about slots/affixes we couldn't map
}

// Official equip-slot id → app gear slot. 9 & 21 are bow/archer-only pieces the app
// models as a ring attribute, not gear — skipped. Armour 3/4/5/8 order is a guess.
const SLOT_MAP: Record<string, string> = {
  "1": "Umbrella", "2": "Rope Dart",
  "3": "Helmet", "4": "Chest", "5": "Greaves", "8": "Bracers",
  "10": "Disc", "11": "Pendant",
};

// Exact affixId → stat overrides (highest confidence). Extend as we confirm codes.
const AFFIX_OVERRIDE: Record<string, string> = {};

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

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

function mapAffix(affixId: number, value: number, quality: number): ImportedSub | null {
  const id = String(affixId);
  if (AFFIX_OVERRIDE[id]) return { type: AFFIX_OVERRIDE[id], val: round1(value < 1 ? value * 100 : value), flagged: true };
  const q = quality > 0 ? quality : 1;
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
  let flagged = best.flagged;
  // Min/Max phys: ids ...7 = Min, ...8 = Max; otherwise keep default (Max) but flag.
  if (best.mr === 63.8) {
    if (id.endsWith("7")) type = "Min Phys Atk";
    else if (id.endsWith("8")) type = "Max Phys Atk";
    else flagged = true;
  }
  if (best.mr === 36.2 && id.endsWith("7")) type = "Min Bamboocut Atk";
  return { type, val: round1(shown), flagged };
}

export function parseGameData(raw: string): ImportResult {
  let data: any;
  try {
    data = JSON.parse(raw.trim());
  } catch {
    throw new Error("That doesn't look like valid JSON. Re-copy with the bookmarklet.");
  }
  // Accept either the whole {data:{...}} or just the inner data object.
  if (data && data.data && data.data.wearEquipsDetailed) data = data.data;
  const detailed = data?.wearEquipsDetailed;
  if (!detailed || typeof detailed !== "object") {
    throw new Error("No equipped-gear data found (wearEquipsDetailed missing).");
  }
  const pieces: ImportedPiece[] = [];
  const skipped: string[] = [];
  for (const officialSlot of Object.keys(detailed)) {
    const slot = SLOT_MAP[officialSlot];
    if (!slot) { skipped.push(`Slot ${officialSlot} (not modeled — likely a bow piece)`); continue; }
    const affixes = detailed[officialSlot]?.exVo?.baseAffixes;
    if (!Array.isArray(affixes)) continue;
    const subs: ImportedSub[] = [];
    for (const a of affixes) {
      const d = a?.equipmentDetails;
      if (!Array.isArray(d) || d.length < 3) continue;
      const sub = mapAffix(Number(d[0]), Number(d[1]), Number(d[2]));
      if (sub) subs.push(sub);
      else skipped.push(`${slot}: affix ${d[0]} (${d[1]}) — unrecognised`);
    }
    if (subs.length) pieces.push({ officialSlot, slot, subs });
  }
  return {
    roleName: String(data?.roleName ?? "Imported"),
    level: Number(data?.level ?? 0),
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
  console.assert(subs.some(s => s.type === "Crit Rate" && s.val === "7"), "crit map");
  console.assert(subs.some(s => s.type === "Max Phys Atk"), "max phys map (...8)");
  console.assert(subs.some(s => s.type === "Min Phys Atk"), "min phys map (...7)");
  console.assert(r.pieces[0].slot === "Umbrella", "slot map");
  return r;
}
