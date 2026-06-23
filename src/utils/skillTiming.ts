// Per-skill timing for the rotation timeline (Phase 2 Rotations/Skill editor).
//
// Real per-skill cast times are NOT in the repo yet — referenceData.ts only carries
// the rotation WINDOW (`useTime`), not per-cast timing. Rather than invent specific
// numbers (the project rule: numbers come from the source, not guesses), this derives
// a UNIFORM per-cast time from the already-calibrated rotation: window / total casts.
//
// ponytail: uniform estimate — every cast gets the same slice. Good enough to lay
// skills on a timeline; swap `castSec` per skill with real CN cast times (competitor
// /game source) when we have them — the interface and consumers don't change.

import { getRotationForBuild, getRotationTimeForBuild } from "./calc";

export interface SkillTiming {
  castSec: number;    // seconds this cast occupies on the timeline
  estimated: boolean; // true while derived uniformly (not a real measured value)
}

export interface BuildTiming {
  window: number;                       // rotation window in seconds
  secondsPerCast: number;               // window / total casts
  perSkill: Record<string, SkillTiming>;
}

export function buildSkillTimings(buildKey: string): BuildTiming {
  const rot = getRotationForBuild(buildKey);
  const window = getRotationTimeForBuild(buildKey);
  const totalCasts = rot.reduce((n, r) => n + (r.count || 0) * (r.tiaozhan || 1), 0) || 1;
  const secondsPerCast = window / totalCasts;
  const perSkill: Record<string, SkillTiming> = {};
  for (const r of rot) perSkill[r.name] = { castSec: secondsPerCast, estimated: true };
  return { window, secondsPerCast, perSkill };
}

// ponytail self-check: the calibrated build yields a positive, finite cadence.
export function demoCheck() {
  const t = buildSkillTimings("bamboocut-dust");
  console.assert(t.window > 0, "window > 0");
  console.assert(t.secondsPerCast > 0 && isFinite(t.secondsPerCast), "cadence finite");
  console.assert(Object.keys(t.perSkill).length > 0, "has skills");
  return t;
}
