// src/data/affixMap.ts
//
// Decode tables for "Import Equipped Gear from Game" (src/utils/gameImport.ts).
// Maps the official WWM dashboard payload's coded affixes/slots to the app's
// stat vocabulary — every value here is one of the keys of SUB_MAP in App.tsx.
//
// SOURCE & CONFIDENCE
// ───────────────────
// The official payload codes each affix as [affixId, value, quality, tier, bool]
// inside  wearEquipsDetailed[slot].exVo.baseAffixes.  Confirmed against the
// competitor wherewindsmath.pages.dev, whose bundle reads the exact same
// `exVo.baseAffixes` and decodes affixes in TWO levels:
//
//   level 1 :  affixId ("9293019")  ->  internal stat id (0x149)
//   level 2 :  internal stat id     ->  {label, minRoll, maxRoll, isPercent}
//
// Level 1 was extractable verbatim from the bundle (AFFIX_INTERNAL_ID below).
// Level 2 is obfuscated (string-array packed); only ids cross-checked against a
// real payload are named (INTERNAL_STAT). Everything named here is CONFIRMED —
// we do NOT guess stat names. Name more internal ids from real payloads and the
// whole weapon-family fans out automatically.
//
// The competitor identifies stats by {minRoll, maxRoll, isPercent} — the SAME
// max-roll method gameImport.ts already uses, so that heuristic is sound. These
// tables only exist to harden the exact-id collisions the heuristic must flag
// (Min/Max Phys, Crit-DMG vs Affinity-DMG, Phys-Pen vs Formless-Pen).
//
// ponytail: confirmed entries only. AFFIX_INTERNAL_ID is the raw level-1 dump;
// resolveAffixStat() composes it with INTERNAL_STAT so coverage grows by naming
// internal ids, not by hand-listing every affixId.

/** Official equip-slot id -> app gear slot.
 *  1/2 = the two weapon slots (CONFIRMED; labels are the Bamboocut defaults).
 *  10/11 accessories CONFIRMED. Armour order 3/4/5/8 is INFERRED (unverified).
 *  Slots 9 & 21 are bow/archer-only pieces the app models as a ring attr — skip. */
export const OFFICIAL_SLOT_MAP: Record<string, string> = {
  "1": "Umbrella",
  "2": "Rope Dart",
  "3": "Helmet",
  "4": "Chest",
  "5": "Greaves",
  "8": "Bracers",
  "10": "Disc",
  "11": "Pendant",
};

/** CONFIRMED affixId -> exact SUB_MAP stat key. Drop straight into gameImport's
 *  AFFIX_OVERRIDE. Min/Max Phys share max-roll 63.8 and can only be split by id. */
export const AFFIX_STAT: Record<string, string> = {
  "9293007": "Min Phys Atk", // real-payload anchor (...7 = Min)
  "9293008": "Max Phys Atk", // real-payload anchor (...8 = Max)
  // Crit Rate = internal 0x149, across every weapon family that carries it:
  "9243004": "Crit Rate",
  "9293019": "Crit Rate",
  "9294019": "Crit Rate",
  "9752004": "Crit Rate",
  "9753004": "Crit Rate",
  "9793119": "Crit Rate",
};

/** CONFIRMED internal-stat-id -> stat key. Resolves a whole weapon family at once.
 *  0x143–0x14a look like the combat-% cluster (Crit/Prec/Affinity ±DMG) but only
 *  0x149 is anchored to a real payload — the rest are intentionally left unnamed. */
export const INTERNAL_STAT: Record<number, string> = {
  0x149: "Crit Rate",
};

/** RAW level-1 dump from the competitor bundle: affixId -> internal stat id.
 *  Real data, but only ids present in INTERNAL_STAT resolve to a name. */
export const AFFIX_INTERNAL_ID: Record<string, number> = {
  "9211003":0x86,"9211005":0x88,"9211008":0x8b,"9211009":0x8e,"9211015":0x144,
  "9212004":0x87,"9213005":0x88,"9213010":0x8f,"9221002":0x10,"9221004":0x87,
  "9221010":0x8f,"9222001":0xf,"9222002":0x10,"9222005":0x88,"9222006":0x89,
  "9222008":0x8b,"9222013":0x143,"9222014":0x164,"9223001":0xf,"9223007":0x8a,
  "9223009":0x8e,"9223011":0x4,"9231011":0x143,"9232002":0x10,"9232005":0x88,
  "9232009":0x8e,"9233002":0x10,"9233008":0x8b,"9233010":0x8f,"9242006":0x143,
  "9242007":0x164,"9243001":0x9,"9243004":0x149,"9243005":0x14a,"9251003":0x148,
  "9251006":0x1,"9251009":0x164,"9253001":0x9,"9253003":0x148,"9271003":0x129,
  "9272001":0x122,"9272002":0x123,"9272004":0x12a,"9273001":0x122,"9283001":0x121,
  "9283006":0x127,"9283008":0x129,"9284005":0x126,"9284007":0x128,"9284010":0x12c,
  "9284011":0x12d,"9293006":0x9,"9293017":0x8f,"9293018":0x148,"9293019":0x149,
  "9293020":0x14a,"9293024":0xfb,"9293028":0xfe,"9293032":0x172,"9293034":0x174,
  "9294017":0x8f,"9294019":0x149,"9711013":0x89,"9712006":0x5,"9712010":0x86,
  "9712017":0x8f,"9713004":0x18e,"9713010":0x89,"9713011":0x8a,"9713012":0x8b,
  "9713013":0x8e,"9731002":0x10,"9731004":0x164,"9731006":0x143,"9732001":0xf,
  "9732003":0x164,"9733001":0xf,"9741007":0x164,"9742002":0x26,"9751002":0x26,
  "9751003":0x148,"9751006":0x1,"9751007":0x2,"9751009":0x164,"9752003":0x148,
  "9752004":0x149,"9752005":0x14a,"9752007":0x2,"9753001":0x9,"9753002":0x26,
  "9753004":0x149,"9753005":0x14a,"9753007":0x2,"9771006":0x144,"9772003":0x129,
  "9773001":0x122,"9773004":0x12a,"9784003":0x123,"9784005":0x126,"9793005":0x5,
  "9793007":0xf,"9793009":0x26,"9793010":0x18d,"9793012":0x148,"9793015":0xf8,
  "9793016":0xf9,"9793022":0x18f,"9793023":0x86,"9793026":0x89,"9793027":0x8a,
  "9793109":0x26,"9793115":0x8b,"9793117":0x8f,"9793119":0x149,"9793125":0x174,
  "9794004":0x4,"9794015":0xf8,"9794017":0xfa,"9794019":0x165,"9794020":0x186,
  "9794024":0x87,"9794103":0x6,"9794112":0x88,"9794113":0x89,"9794115":0x8b,
  "9794120":0x14a,"9794121":0xfe,"9794122":0x19b,
};

/** Resolve an affixId to a CONFIRMED stat key, or null if not yet known.
 *  Order: explicit override → internal-id naming (level1 ∘ level2). */
export function resolveAffixStat(affixId: number | string): string | null {
  const id = String(affixId);
  if (AFFIX_STAT[id]) return AFFIX_STAT[id];
  const internal = AFFIX_INTERNAL_ID[id];
  if (internal !== undefined && INTERNAL_STAT[internal]) return INTERNAL_STAT[internal];
  return null;
}

// ponytail self-check: confirmed ids resolve (both paths), unknown -> null.
export function demoCheck() {
  console.assert(resolveAffixStat(9293019) === "Crit Rate", "direct crit");
  console.assert(resolveAffixStat("9293007") === "Min Phys Atk", "min phys override");
  console.assert(resolveAffixStat(9243004) === "Crit Rate", "crit via internal id");
  console.assert(resolveAffixStat(9999999) === null, "unknown -> null");
  console.assert(OFFICIAL_SLOT_MAP["1"] === "Umbrella", "slot map");
  return true;
}
