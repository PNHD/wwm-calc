import { calcSkill, getSkillForBuild } from "./calc";
import type { PanelStats, RotationItem, SkillDefinition } from "../types";

type CalcTier = Parameters<typeof calcSkill>[2];
type CalcOpts = Parameters<typeof calcSkill>[3];

/** Per-hit preview for one selected path-owned skill; never mutates a shared registry. */
export function previewSkill(
  skillName: string,
  panel: PanelStats,
  tier: CalcTier,
  opts: CalcOpts,
  skillOverride?: Partial<SkillDefinition>,
) {
  const rot: RotationItem = {
    name: skillName, count: 1, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1,
  };
  return calcSkill(rot, panel, tier, { ...opts, skillOverride });
}

// ponytail self-check: an actual path-owned identity stays available through the shared calculator.
export function demoCheck() {
  const skillName = "飞花逐月";
  const def = getSkillForBuild("bamboocut-dust", skillName);
  console.assert(def !== null, "requires an owned skill");
  const panel: any = { minOuter: 1000, maxOuter: 2000, crit: 100, prec: 100, aff: 20, critDmg: 50, affDmg: 30, minPz: 100, maxPz: 200, outerPen: 30, pzPen: 10 };
  const result = previewSkill(skillName, panel, { def: 350, judgeRes: 0.45, physRes: 20, attrRes: 24 } as any, { set: "", datang: false, yishui: false, buildKey: "bamboocut-dust" });
  console.assert(result.available, "returns a path-owned preview");
  return result;
}
