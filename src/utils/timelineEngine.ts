// Rotation timeline engine — reusable rotation → DPS computation.
//
// Wraps calc.ts/calcSkill so ANY rotation (the built-in one OR a user-edited one)
// can be turned into total damage + DPS + per-skill + hit-type breakdown without
// duplicating the verified damage math. This is the foundation the Rotations
// editor, Skill editor and Team builder all build on.
//
// It does NOT touch the verified per-hit formula (calcSkill) or App.tsx's existing
// rotationStats / Damage-Stats / Monte-Carlo memos — it only consumes calcSkill.
//
// NOTE: the built-in ROTATION counts in calc.ts are already calibrated to a real
// 60s parse, so simulateBuild() reproduces App.tsx's rotationStats numbers. The
// engine's value is being reusable for EDITED rotations / skills / team members.

import { calcSkill, getRotationForBuild, getRotationTimeForBuild } from "./calc";
import type { PanelStats, RotationItem } from "../types";

// Derive tier/opts types straight from calcSkill so this stays in sync with it.
type CalcTier = Parameters<typeof calcSkill>[2];
type CalcOpts = Parameters<typeof calcSkill>[3];

export interface SimSkill {
  name: string;
  total: number;
  perHit: number;
  dps: number;
  share: number; // fraction of total damage (0..1)
}

export interface RotationSim {
  totalDmg: number;
  dps: number;
  breakdown: { crit: number; aff: number; normal: number; abrasion: number };
  perSkill: SimSkill[];
}

/**
 * Simulate an arbitrary rotation against a panel.
 * `rotationTime` is the rotation window in seconds (DPS = totalDmg / rotationTime).
 */
export function simulateRotation(
  rotation: RotationItem[],
  panel: PanelStats,
  tier: CalcTier,
  opts: CalcOpts,
  rotationTime: number,
): RotationSim {
  let totalDmg = 0;
  const breakdown = { crit: 0, aff: 0, normal: 0, abrasion: 0 };
  const perSkill: SimSkill[] = [];

  for (const item of rotation) {
    const r = calcSkill(item, panel, tier, opts);
    totalDmg += r.total;
    if (r.breakdown) {
      breakdown.crit += r.breakdown.crit;
      breakdown.aff += r.breakdown.aff;
      breakdown.normal += r.breakdown.normal;
      breakdown.abrasion += r.breakdown.abrasion;
    }
    perSkill.push({ name: item.name, total: r.total, perHit: r.perHit, dps: 0, share: 0 });
  }

  const dps = rotationTime > 0 ? totalDmg / rotationTime : 0;
  for (const s of perSkill) {
    s.dps = rotationTime > 0 ? s.total / rotationTime : 0;
    s.share = totalDmg > 0 ? s.total / totalDmg : 0;
  }
  perSkill.sort((a, b) => b.total - a.total);

  return { totalDmg, dps, breakdown, perSkill };
}

/** Simulate a build's built-in rotation — reproduces App.tsx rotationStats. */
export function simulateBuild(
  buildKey: string,
  panel: PanelStats,
  tier: CalcTier,
  opts: CalcOpts,
): RotationSim {
  return simulateRotation(
    getRotationForBuild(buildKey),
    panel,
    tier,
    opts,
    getRotationTimeForBuild(buildKey),
  );
}
