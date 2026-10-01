import { calcSkill } from "./calc";
import { simulateTimeline, type TimelineBuff } from "./rotationTimeline";
import type { PanelStats, RotationItem, SkillDefinition, TierConstants } from "../types";

export interface ScenarioInputs {
  rotation: RotationItem[];
  duration: number;
  tier: TierConstants;
  opts: Parameters<typeof calcSkill>[3];
  buffs: TimelineBuff[];
  timingOverrides: Record<string, { castTime?: number }>;
  skillOverrides: Record<string, Partial<SkillDefinition>>;
}

// Both current and candidate panels arrive in the same combat coordinate.
// Conditional buffs are added here; static Inner Way stats are already present.
export function evaluateScenario(panel: PanelStats, input: ScenarioInputs) {
  const opts = { ...input.opts, set: panel.set, armorSet: (panel as any).armorSet, weaponStars: (panel as any).weaponStars };
  if (opts.buildKey === "bamboocut-dust") {
    const result = simulateTimeline(input.rotation, panel, input.buffs, input.tier, opts, input.duration, input.timingOverrides, input.skillOverrides);
    return { total: result.total, dps: result.dps, breakdown: result.breakdown, samples: result.samples, perSkill: result.perSkill.map(row => ({ name: row.name, dmg: row.dmg, casts: row.casts })) };
  }
  const rows = input.rotation.map(item => ({ item, result: calcSkill(item, panel, input.tier, { ...opts, skillOverride: input.skillOverrides[item.name] }) }));
  const total = rows.reduce((n, row) => n + row.result.total, 0);
  const breakdown = { crit: 0, aff: 0, normal: 0, abrasion: 0 };
  for (const row of rows) for (const key of Object.keys(breakdown) as (keyof typeof breakdown)[]) breakdown[key] += row.result.breakdown[key];
  return { total, dps: input.duration > 0 ? total / input.duration : 0, breakdown, samples: rows.map(row => row.result.sim), perSkill: rows.map(row => ({ name: row.item.name, dmg: row.result.total, casts: row.item.count })) };
}
