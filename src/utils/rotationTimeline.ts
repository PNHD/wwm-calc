// Event-driven Global T96 rotation timeline simulator.
//
// Menu-panel stats are deterministic and stay separate from combat-only effects.
// For Bamboocut-Dust this module models the supplied current-client mechanics:
// Morale Chant / Yi River, Song of Tang / Tang Melody, Phantom Chime, and the
// stack-based portion of Starweave. It intentionally does not invent unresolved
// Starweave distance damage or outcome rules for special-resolution sources.

import { calcSkill } from "./calc";
import { lookupTiming } from "../data/skillTiming";
import { INNER_WAYS } from "../data/innerways";
import type { PanelStats, RotationItem, TierConstants } from "../types";

type CalcOpts = Parameters<typeof calcSkill>[3];
type BuffTrigger = "static" | "any-damage" | "martial-art" | "resonance";
type BuffScope = "all" | "martial-art";

export interface BuffDelta {
  outerPen?: number; pzPen?: number; critDmg?: number; affDmg?: number;
  outerDmg?: number; generalDmg?: number; pzDmg?: number; crit?: number;
  aff?: number; dcrit?: number; daff?: number; prec?: number;
  minOuter?: number; maxOuter?: number;
}

export interface TimelineBuff {
  id: string;
  name: string;
  maxDelta: BuffDelta;
  maxStacks: number;
  duration: number;
  ramp: boolean;
  color: string;
  trigger?: BuffTrigger;
  scope?: BuffScope;
  minTriggerInterval?: number;
  evidence?: string;
}

export interface TLCast {
  name: string;
  start: number;
  dur: number;
  dmg: number;
  stacks: Record<string, number>;
}

export interface TLSkillAgg { name: string; casts: number; dmg: number; dps: number; share: number; }
export interface TLBuffAgg { id: string; name: string; color: string; uptime: number; avgStacks: number; maxStacks: number; ramp: boolean; }

export interface TimelineResult {
  casts: TLCast[];
  perSkill: TLSkillAgg[];
  perBuff: TLBuffAgg[];
  total: number;
  dps: number;
  duration: number;
  fullUptimeDps: number;
  uptimeLoss: number;
}

const BUFF_PALETTE = ["#e0b45a", "#4fb27c", "#bd8fdb", "#5f97c6", "#e05a41", "#4fc9c0", "#d68f5f", "#9ab04f"];

const CONDITIONAL_INNER_WAYS: Record<string, Omit<TimelineBuff, "color">> = {
  morale_chant: {
    id: "morale_chant:yi-river",
    name: "Morale Chant · Yi River",
    maxDelta: { outerPen: 10, generalDmg: 5 },
    maxStacks: 5,
    duration: 12,
    ramp: true,
    trigger: "any-damage",
    scope: "all",
    minTriggerInterval: 2,
    evidence: "Global T6 client: +2 Physical Penetration and +1% damage per stack; 12s; max 5; check once per 2s.",
  },
  song_of_tang: {
    id: "song_of_tang:tang-melody",
    name: "Song of Tang · Tang Melody",
    maxDelta: { critDmg: 15 },
    maxStacks: 5,
    duration: 7,
    ramp: true,
    trigger: "martial-art",
    scope: "martial-art",
    minTriggerInterval: 0.5,
    evidence: "Global T6 client: Martial Art Skill damage grants Tang Melody; +3% Martial Art Skill Crit DMG/stack; max 5; max 2 stacks/s; 7s.",
  },
  phantom_rally: {
    id: "phantom_rally:phantom-chime",
    name: "Phantom Rally · Phantom Chime",
    // -2 Physical Resistance/stack is damage-equivalent to +2 Physical Penetration
    // in the current net-penetration branch, while keeping the deterministic menu
    // panel untouched.
    maxDelta: { outerPen: 10 },
    maxStacks: 5,
    duration: 5,
    ramp: true,
    trigger: "resonance",
    scope: "all",
    minTriggerInterval: 0,
    evidence: "Global T6 client: Resonance applies -2 Physical Resistance/stack for 5s, max 5.",
  },
};

/**
 * Build static Inner Way Attribute Buffs plus explicit conditional combat buffs.
 * `tiers[].stat` remains the source of MENU-panel/static effects; conditional
 * effects are separate entries and therefore cannot leak into the menu panel.
 */
export function buildTimelineBuffs(
  selectedInnerWays: string[],
  innerWayTiers: Record<string, number>,
): TimelineBuff[] {
  const out: TimelineBuff[] = [];
  let ci = 0;
  for (const id of selectedInnerWays) {
    const iw = INNER_WAYS.find((w) => w.id === id);
    if (!iw) continue;
    const tierNum = innerWayTiers[id] ?? 6;
    const t = iw.tiers.find((x) => x.tier === tierNum);
    if (t?.stat && Object.values(t.stat).some((v) => v)) {
      out.push({
        id: `${id}:static`,
        name: `${iw.name} · Attribute Buff`,
        maxDelta: t.stat as BuffDelta,
        maxStacks: 1,
        duration: Infinity,
        ramp: false,
        trigger: "static",
        scope: "all",
        minTriggerInterval: 0,
        color: BUFF_PALETTE[ci++ % BUFF_PALETTE.length],
      });
    }
    // Current conditional definitions represent the supplied T6 behavior. Do not
    // silently apply them to lower tiers where the relevant effect is unavailable.
    if (tierNum >= 6 && CONDITIONAL_INNER_WAYS[id]) {
      out.push({
        ...CONDITIONAL_INNER_WAYS[id],
        color: BUFF_PALETTE[ci++ % BUFF_PALETTE.length],
      });
    }
  }
  return out;
}

function starweaveBuff(color: string): TimelineBuff {
  return {
    id: "starweave:stacks",
    name: "Starweave · Martial Art Skill Damage",
    maxDelta: { generalDmg: 15 },
    maxStacks: 5,
    duration: 5,
    ramp: true,
    trigger: "martial-art",
    scope: "martial-art",
    minTriggerInterval: 0.5,
    color,
    evidence: "Global T96 client: boss hit grants stack; +3% Martial Art Skill DMG/stack; max 5; max 2 stacks/s; 5s. Distance component excluded here.",
  };
}

function applyDelta(p: PanelStats, d: BuffDelta, k: number) {
  p.outerPen += (d.outerPen || 0) * k;
  p.pzPen += (d.pzPen || 0) * k;
  p.crit += (d.crit || 0) * k;
  p.aff += (d.aff || 0) * k;
  p.dcrit += (d.dcrit || 0) * k;
  p.daff += (d.daff || 0) * k;
  p.critDmg += (d.critDmg || 0) * k;
  p.affDmg += (d.affDmg || 0) * k;
  p.outerDmg += (d.outerDmg || 0) * k;
  p.pzDmg += (d.pzDmg || 0) * k;
  p.prec += (d.prec || 0) * k;
  p.minOuter += (d.minOuter || 0) * k;
  p.maxOuter += (d.maxOuter || 0) * k;
  p.iwGeneralDmg = (p.iwGeneralDmg || 0) + (d.generalDmg || 0) * k;
  p.iwOuterPen = (p.iwOuterPen || 0) + (d.outerPen || 0) * k;
  p.iwPzPen = (p.iwPzPen || 0) + (d.pzPen || 0) * k;
  p.iwPzDmg = (p.iwPzDmg || 0) + (d.pzDmg || 0) * k;
}

const isResonance = (item: RotationItem) => item.name.toLowerCase().includes("resonance");
const isMartialArt = (item: RotationItem) => Boolean(item.isDingyin) || isResonance(item);

function triggerMatches(buff: TimelineBuff, item: RotationItem) {
  if (buff.trigger === "any-damage") return true;
  if (buff.trigger === "martial-art") return isMartialArt(item);
  if (buff.trigger === "resonance") return isResonance(item);
  return false;
}

function scopeMatches(buff: TimelineBuff, item: RotationItem) {
  return buff.scope !== "martial-art" || isMartialArt(item);
}

/**
 * Simulate a rotation using event frequency over the selected window.
 *
 * Each skill's observed/selected cast count is distributed across the window and
 * then merged into one chronological stream. This avoids the old artifact where
 * all casts of one grouped row occurred before the next row, which made a high-
 * frequency Resonance source impossible to use as a real debuff trigger.
 */
export function simulateTimeline(
  rotation: RotationItem[],
  basePanel: PanelStats,
  buffs: TimelineBuff[],
  tier: TierConstants,
  opts: CalcOpts,
  window: number,
  timingOverrides: Record<string, { castTime?: number }> = {},
): TimelineResult {
  const isT96Bamboocut = opts.buildKey === "bamboocut-dust";
  const allBuffs = [...buffs];
  if (isT96Bamboocut && opts.weaponStars) {
    allBuffs.push(starweaveBuff(BUFF_PALETTE[allBuffs.length % BUFF_PALETTE.length]));
  }

  const events: { item: RotationItem; start: number; dur: number; ordinal: number }[] = [];
  rotation.forEach((item, rowIndex) => {
    const n = Math.max(0, Math.round(item.count));
    if (!n) return;
    const timing = { ...lookupTiming(item.name), ...timingOverrides[item.name] };
    const dur = Math.max(0.05, timing.castTime || 0.6);
    for (let i = 0; i < n; i++) {
      // A small deterministic row offset prevents identical timestamps from being
      // ordered by source-array grouping while remaining negligible to cooldowns.
      const start = Math.min(window, ((i + 0.5) / n) * window + rowIndex * 1e-6);
      events.push({ item, start, dur, ordinal: rowIndex });
    }
  });
  events.sort((a, b) => a.start - b.start || a.ordinal - b.ordinal || a.item.name.localeCompare(b.item.name));

  const state = allBuffs.map((b) => ({
    stacks: b.ramp ? 0 : b.maxStacks,
    lastAccepted: -Infinity,
    expiresAt: b.ramp ? -Infinity : Infinity,
    weightedStacks: 0,
  }));
  const casts: TLCast[] = [];
  const skillMap = new Map<string, { casts: number; dmg: number }>();
  let total = 0;
  let previousTime = 0;

  // Bamboocut timeline owns these conditional effects. Passing the old toggles to
  // calcSkill would double-count permanent max Yi River / Song of Tang.
  const eventOpts: CalcOpts = isT96Bamboocut ? { ...opts, yishui: false, datang: false } : opts;

  for (const event of events) {
    const start = Math.max(0, Math.min(window, event.start));
    allBuffs.forEach((b, bi) => {
      const st = state[bi];
      if (b.ramp) {
        const aliveUntil = Math.min(start, st.expiresAt);
        if (aliveUntil > previousTime && st.stacks > 0) st.weightedStacks += st.stacks * (aliveUntil - previousTime);
        if (start > st.expiresAt) st.stacks = 0;
      } else if (start > previousTime) {
        st.weightedStacks += b.maxStacks * (start - previousTime);
      }
    });

    const panel: PanelStats = { ...basePanel };
    const stacksNow: Record<string, number> = {};
    allBuffs.forEach((b, bi) => {
      const cur = state[bi].stacks;
      stacksNow[b.id] = cur;
      if (cur > 0 && scopeMatches(b, event.item)) applyDelta(panel, b.maxDelta, cur / b.maxStacks);
    });

    const r = calcSkill({ ...event.item, count: 1 }, panel, tier, eventOpts);
    total += r.total;
    const agg = skillMap.get(event.item.name) || { casts: 0, dmg: 0 };
    agg.casts += 1;
    agg.dmg += r.total;
    skillMap.set(event.item.name, agg);
    casts.push({ name: event.item.name, start, dur: event.dur, dmg: r.total, stacks: stacksNow });

    // Effects are granted by the landed damage event, so they affect subsequent
    // events rather than retroactively buffing the triggering hit.
    allBuffs.forEach((b, bi) => {
      if (!b.ramp || !triggerMatches(b, event.item)) return;
      const st = state[bi];
      const minInterval = b.minTriggerInterval || 0;
      if (start - st.lastAccepted + 1e-9 < minInterval) return;
      st.stacks = Math.min(b.maxStacks, st.stacks + 1);
      st.lastAccepted = start;
      st.expiresAt = start + b.duration;
    });
    previousTime = start;
  }

  allBuffs.forEach((b, bi) => {
    const st = state[bi];
    if (b.ramp) {
      const aliveUntil = Math.min(window, st.expiresAt);
      if (aliveUntil > previousTime && st.stacks > 0) st.weightedStacks += st.stacks * (aliveUntil - previousTime);
    } else if (window > previousTime) {
      st.weightedStacks += b.maxStacks * (window - previousTime);
    }
  });

  const duration = window;
  const dps = window > 0 ? total / window : 0;
  const perSkill: TLSkillAgg[] = [...skillMap.entries()]
    .map(([name, v]) => ({ name, casts: v.casts, dmg: v.dmg, dps: window > 0 ? v.dmg / window : 0, share: total > 0 ? v.dmg / total : 0 }))
    .sort((a, b) => b.dmg - a.dmg);

  const perBuff: TLBuffAgg[] = allBuffs.map((b, bi) => {
    const avg = window > 0 ? state[bi].weightedStacks / window : 0;
    return {
      id: b.id,
      name: b.name,
      color: b.color,
      maxStacks: b.maxStacks,
      ramp: b.ramp,
      avgStacks: avg,
      uptime: b.maxStacks > 0 ? avg / b.maxStacks : 0,
    };
  });

  // A diagnostic ceiling only. Optimizer ranking always uses `dps` above.
  let full = 0;
  {
    const panel: PanelStats = { ...basePanel };
    for (const b of allBuffs) {
      if (b.scope === "all" || b.trigger === "static") applyDelta(panel, b.maxDelta, 1);
    }
    for (const item of rotation) {
      const scoped: PanelStats = { ...panel };
      for (const b of allBuffs) {
        if (b.scope === "martial-art" && isMartialArt(item)) applyDelta(scoped, b.maxDelta, 1);
      }
      full += calcSkill(item, scoped, tier, eventOpts).total;
    }
  }
  const fullUptimeDps = window > 0 ? full / window : 0;

  return {
    casts,
    perSkill,
    perBuff,
    total,
    dps,
    duration,
    fullUptimeDps,
    uptimeLoss: fullUptimeDps > 0 ? Math.max(0, 1 - dps / fullUptimeDps) : 0,
  };
}
