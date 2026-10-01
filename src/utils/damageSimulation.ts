import type { calcSkill } from "./calc";

export type DamageSample = ReturnType<typeof calcSkill>["sim"];
export interface DamageJob {
  generation: number;
  fingerprint: string;
  seed: number;
  runs: number;
  duration: number;
  expected: number;
  samples: DamageSample[];
}

// Roll the evaluator's priced outcomes, rather than rebuilding combat inputs.
export function simulateDamage(job: DamageJob, progress: (percent: number) => void = () => {}) {
  if (!Number.isInteger(job.runs) || job.runs < 1 || job.runs > 2000 || !Number.isFinite(job.duration) || job.duration <= 0 || !Number.isFinite(job.expected) || job.expected <= 0 || !Number.isInteger(job.seed)) throw new Error("Invalid simulation inputs");
  if (!job.samples.length || job.samples.length > 10000) throw new Error("Outcome samples unavailable for this model");
  for (const s of job.samples) {
    if (Object.values(s).some(v => !Number.isFinite(v) || v < 0) || s.casts > 10000 || Math.abs(s.pCrit + s.pAff + s.pGraze + s.pWhite - 1) > 1e-9) throw new Error("Invalid outcome sample");
  }
  if (job.runs * job.samples.reduce((sum, s) => sum + Math.ceil(s.casts), 0) > 20000000) throw new Error("Simulation exceeds the 20 million outcome budget; reduce runs/counts");
  let state = job.seed >>> 0;
  const random = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const totals: number[] = [];
  let hits = 0, damage = 0;
  const outcomes = { crit: [0, 0], aff: [0, 0], normal: [0, 0], abrasion: [0, 0] };
  for (let run = 0; run < job.runs; run++) {
    let total = 0;
    for (const s of job.samples) for (let cast = 0; cast < s.casts; cast++) {
      const weight = Math.min(1, s.casts - cast);
      const roll = random();
      const outcome = roll < s.pCrit ? "crit" : roll < s.pCrit + s.pAff ? "aff" : roll < s.pCrit + s.pAff + s.pGraze ? "abrasion" : "normal";
      const value = weight * (outcome === "crit" ? s.critHit : outcome === "aff" ? s.affHit : outcome === "abrasion" ? s.grazeHit : s.normHit);
      total += value; hits += weight; damage += value;
      outcomes[outcome][0] += weight; outcomes[outcome][1] += value;
    }
    totals.push(total);
    if (run % 25 === 0) progress(Math.round((run + 1) / job.runs * 100));
  }
  totals.sort((a, b) => a - b);
  const percentile = (fraction: number) => totals[Math.min(totals.length - 1, Math.floor(fraction * totals.length))] / job.duration;
  const mean = totals.reduce((sum, value) => sum + value, 0) / job.runs;
  const percent = (value: number, denominator: number) => denominator ? value / denominator * 100 : 0;
  return {
    seed: job.seed, runs: job.runs, hitsPerRun: hits / job.runs, duration: job.duration,
    expectedDps: job.expected / job.duration, avgDps: mean / job.duration,
    bestDps: totals.at(-1)! / job.duration, worstDps: totals[0] / job.duration,
    p25: percentile(.25), p50: percentile(.5), p75: percentile(.75),
    diffPct: percent(mean - job.expected, job.expected), rangePct: percent((totals.at(-1)! - totals[0]) / 2, mean),
    dist: Object.fromEntries(Object.entries(outcomes).map(([key, [count, value]]) => [key, { hit: percent(count, hits), dmg: percent(value, damage) }])),
  };
}
