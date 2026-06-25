import { ROTATIONS_WWM } from "../data/rotationsWWM";
import { ABILITY_MAP_WWM } from "../data/abilityMapWWM";
import { calcSkill, SKILL_DB } from "./calc";
import { RotationItem, PanelStats, TierConstants } from "../types";

// App build key -> wherewindsmath bundle path key.
export const BUILD_TO_WWM: Record<string, string> = {
  "bamboocut-dust": "bamboocut_dust",
  "bellstrike-umbra": "bellstrike_umbra",
  "bellstrike-splendor": "bellstrike_splendor",
  "stonesplit-might": "stonesplit_might",
  "silkbind-jade": "silkbind_jade",
  "stonesplit-pure-datang": "stonesplit_strength",
};

// Translate one bundle tier into app RotationItem[], collecting unmapped abilities.
export function translateTier(buildKey: string, tier: string): { items: RotationItem[]; unmapped: string[] } {
  const wwmKey = BUILD_TO_WWM[buildKey];
  const steps = (wwmKey && ROTATIONS_WWM[wwmKey]?.[tier]) || [];
  const map = (wwmKey && ABILITY_MAP_WWM[wwmKey]) || {};
  const items: RotationItem[] = [];
  const unmapped: string[] = [];
  for (const s of steps) {
    const m = map[s.ability];
    if (!m) { unmapped.push(s.ability); continue; }
    items.push({
      name: m.appName,
      count: s.numUse,
      isDingyin: m.isDingyin ?? false,
      generalBonus: m.generalBonus ?? 0,
      yishui: m.yishui ?? 0,
      tiaozhan: m.tiaozhan ?? 0,
    });
  }
  return { items, unmapped };
}

// Sum DPS for one tier using the UNCHANGED app formula.
export function engine2Dps(
  buildKey: string,
  tier: string,
  panel: PanelStats,
  activeTier: TierConstants,
  opts: { set: string; datang: boolean; yishui: boolean },
  rotationTimeSec: number,
): { dps: number; total: number; steps: number; mapped: number; unmapped: string[] } {
  const wwmKey = BUILD_TO_WWM[buildKey];
  const rawSteps = (wwmKey && ROTATIONS_WWM[wwmKey]?.[tier]) || [];
  const { items, unmapped } = translateTier(buildKey, tier);
  let total = 0;
  let priced = 0;
  for (const item of items) {
    const sk = SKILL_DB[item.name];
    const { total: t } = calcSkill(item, panel, activeTier, {
      set: opts.set,
      datang: opts.datang,
      yishui: opts.yishui,
      buildKey,
    });
    // A mapped-but-unpriced skill (0 damage AND its name resolves nowhere — `sk`
    // was absent before calc and calcSkill returns 0 for an unknown skill) is
    // treated as unmapped: "mapped" must mean mapped AND priced.
    if (t <= 0 && !sk) { unmapped.push(item.name); continue; }
    // calcSkill already multiplies by rot.count internally (see calc.ts:603-604,
    // `total = perHit * rot.count * (rot.tiaozhan || 1)`), and the app's own
    // computeTotalDamage (App.tsx) sums `total` once per item with no external
    // `* count`. Match that: do NOT multiply by item.count again here.
    total += t;
    priced++;
  }
  const dps = rotationTimeSec > 0 ? total / rotationTimeSec : 0;
  return { dps, total, steps: rawSteps.length, mapped: priced, unmapped };
}
