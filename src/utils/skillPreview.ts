// src/utils/skillPreview.ts
//
// Live per-hit preview for the Skill Editor (Phase 3). Lets the UI show what an
// EDITED skill coefficient set would hit for, reusing the VERIFIED damage math
// (calcSkill) without touching calc.ts or mutating any real skill.
//
// How: temporarily inject the edited SkillDefinition under a private key, run
// calcSkill once, then restore SKILL_DB exactly as it was. The inject→run→restore
// is fully synchronous (no await in between), so it cannot race the shared
// singleton SKILL_DB. Returns only the per-hit `sim` (critHit/affHit/normHit/grazeHit).
//
// ponytail: singleton temp-inject, synchronous — the cheapest way to reuse the
// locked formula for an arbitrary def. demoCheck() asserts SKILL_DB is left intact.

import { calcSkill, SKILL_DB } from "./calc";
import type { SkillDefinition, PanelStats, RotationItem } from "../types";

type CalcTier = Parameters<typeof calcSkill>[2];
type CalcOpts = Parameters<typeof calcSkill>[3];

const PREVIEW_KEY = "__skill_preview__";

/** Per-hit damage for an (edited) skill def — reuses calcSkill, restores SKILL_DB. */
export function previewSkill(
  def: SkillDefinition,
  panel: PanelStats,
  tier: CalcTier,
  opts: CalcOpts,
) {
  const had = Object.prototype.hasOwnProperty.call(SKILL_DB, PREVIEW_KEY);
  const prev = SKILL_DB[PREVIEW_KEY];
  SKILL_DB[PREVIEW_KEY] = def;
  const rot: RotationItem = {
    name: PREVIEW_KEY, count: 1, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1,
  };
  try {
    return calcSkill(rot, panel, tier, opts).sim; // critHit/affHit/normHit/grazeHit + probs
  } finally {
    if (had) SKILL_DB[PREVIEW_KEY] = prev;
    else delete SKILL_DB[PREVIEW_KEY];
  }
}

// ponytail self-check: the temp key is gone afterwards and SKILL_DB is unchanged.
export function demoCheck() {
  const before = Object.keys(SKILL_DB).length;
  const def: SkillDefinition = {
    outerRatio: 1, fixed: 100, eleRatio: 1, exCritDmg: 0.27, exDmg: 0.05, exPen: 0,
    isCharge: 0, type: "weapon", wType: "single", force: "", special: "", csBonus: 0,
  };
  const panel: any = { minOuter: 1000, maxOuter: 2000, crit: 100, prec: 100, aff: 20, critDmg: 50, affDmg: 30, minPz: 100, maxPz: 200, outerPen: 30, pzPen: 10 };
  const sim = previewSkill(def, panel, { def: 350, pen: 0.45 } as any, { buildKey: "bamboocut-dust" } as any);
  console.assert(typeof sim.critHit === "number", "returns critHit");
  console.assert(!Object.prototype.hasOwnProperty.call(SKILL_DB, PREVIEW_KEY), "temp key cleaned up");
  console.assert(Object.keys(SKILL_DB).length === before, "SKILL_DB size unchanged");
  return sim;
}
