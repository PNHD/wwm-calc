// Buff-uptime rotation timeline simulator.
//
// This is the "Where Winds Math"-style rotation model: instead of assuming every
// buff is at max stacks for the whole fight (what the graduation panel does —
// LOCKED decision #2, and CORRECT for the graduation %), this lays each cast on a
// real timeline and models stacking buffs RAMPING UP over their duration, so early
// casts get fewer stacks and the DPS reflects realistic buff uptime.
//
// It does NOT touch the verified per-hit formula (calcSkill) or the graduation
// math. It only VARIES the panel handed to calcSkill per cast (base gear panel +
// the buff stat deltas scaled by the buff's live stack count at that moment). At
// FULL uptime (every buff static at max) it reproduces the verified rotation DPS —
// that invariant is asserted in the self-check.
//
// Cast timings come from src/data/skillTiming.ts (extracted from the reference
// calculator). Buff stack/duration rules come from the inner-way descriptions.

import { calcSkill } from "./calc";
import { lookupTiming } from "../data/skillTiming";
import { INNER_WAYS } from "../data/innerways";
import type { PanelStats, RotationItem, TierConstants } from "../types";

type CalcOpts = Parameters<typeof calcSkill>[3];

// iwStats-shaped stat delta (same field set App.tsx sums into `iwStats`).
export interface BuffDelta {
  outerPen?: number; pzPen?: number; critDmg?: number; affDmg?: number;
  outerDmg?: number; generalDmg?: number; pzDmg?: number; crit?: number;
  aff?: number; dcrit?: number; daff?: number; prec?: number;
  minOuter?: number; maxOuter?: number;
}

export interface TimelineBuff {
  id: string;
  name: string;
  maxDelta: BuffDelta;   // stat contribution at MAX stacks (= inner-way tier stat)
  maxStacks: number;     // >= 1
  duration: number;      // seconds a refresh keeps the buff alive
  ramp: boolean;         // true → stacks build 1/cast; false → static at max (100%)
  color: string;
}

export interface TLCast {
  name: string;
  start: number;   // seconds from rotation start
  dur: number;     // cast length in seconds
  dmg: number;     // damage of this single cast (with live buffs)
  stacks: Record<string, number>; // buff id → stacks active for this cast
}

export interface TLSkillAgg { name: string; casts: number; dmg: number; dps: number; share: number; }
export interface TLBuffAgg { id: string; name: string; color: string; uptime: number; avgStacks: number; maxStacks: number; ramp: boolean; }

export interface TimelineResult {
  casts: TLCast[];
  perSkill: TLSkillAgg[];
  perBuff: TLBuffAgg[];
  total: number;
  dps: number;
  duration: number;   // timeline length used for DPS (the calibrated window)
  fullUptimeDps: number; // DPS if every buff were pinned at max (the verified number)
  uptimeLoss: number;    // fraction lost to ramp (0..1)
}

const BUFF_PALETTE = ["#e0b45a", "#4fb27c", "#bd8fdb", "#5f97c6", "#e05a41", "#4fc9c0", "#d68f5f", "#9ab04f"];

// `tiers[].stat` is restricted to flat Attr Buff / breakthrough stats. Conditional
// Basic Buffs live in text only until they have their own explicitly modelled
// timeline source; otherwise we would ramp or pin the wrong stat and inflate DPS.
const BUFF_RAMP: Record<string, { maxStacks: number; duration: number }> = {};

/** Build the timeline buff list from the user's selected inner ways. */
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
    if (!t || !t.stat) continue;
    // skip inner ways that contribute no combat stat at this tier
    if (!Object.values(t.stat).some((v) => v)) continue;
    const ramp = BUFF_RAMP[id];
    out.push({
      id,
      name: iw.name,
      maxDelta: t.stat as BuffDelta,
      maxStacks: ramp ? ramp.maxStacks : 1,
      duration: ramp ? ramp.duration : Infinity,
      ramp: !!ramp,
      color: BUFF_PALETTE[ci++ % BUFF_PALETTE.length],
    });
  }
  return out;
}

// Apply a (possibly scaled) buff delta onto a panel copy — MIRRORS App.tsx's
// adjustedPanel iwStats application so full-uptime reproduces the verified panel.
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

/**
 * Simulate a rotation on a real timeline with ramping buffs.
 *
 * @param rotation   list of skill groups (each carries a cast `count`)
 * @param basePanel  gear-only panel (WITHOUT the inner-way buffs — the sim adds them)
 * @param buffs      timeline buffs (from buildTimelineBuffs)
 * @param tier       tier constants
 * @param opts       calcSkill opts (set/datang/yishui/...)
 * @param window     rotation window in seconds (DPS = total / window)
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
  // 1. Expand groups into individual casts, keeping source timing.
  const raw: { item: RotationItem; castTime: number }[] = [];
  for (const item of rotation) {
    const timing = { ...lookupTiming(item.name), ...timingOverrides[item.name] };
    const ct = Math.max(0.05, timing.castTime || 0.6);
    const n = Math.max(0, Math.round(item.count));
    for (let i = 0; i < n; i++) raw.push({ item, castTime: ct });
  }
  const totalCastTime = raw.reduce((s, c) => s + c.castTime, 0) || 1;
  // Scale cast times so the timeline spans exactly the calibrated window — keeps DPS
  // comparable to the verified rotation while preserving each skill's relative length.
  const scale = window / totalCastTime;

  // 2. Walk the timeline, tracking each buff's live stacks.
  const state = buffs.map(() => ({ stacks: 0, lastTrigger: -Infinity }));
  const casts: TLCast[] = [];
  const skillMap = new Map<string, { casts: number; dmg: number }>();
  const buffStackSum = buffs.map(() => 0);
  let total = 0;
  let clock = 0;

  for (const { item, castTime } of raw) {
    const dur = castTime * scale;
    const start = clock;
    // stacks active for THIS cast = stacks accumulated BEFORE this cast triggers
    const stacksNow: Record<string, number> = {};
    const panel: PanelStats = { ...basePanel };
    buffs.forEach((b, bi) => {
      const st = state[bi];
      if (b.ramp) {
        if (start - st.lastTrigger > b.duration) st.stacks = 0; // expired since last trigger
      } else {
        st.stacks = b.maxStacks; // static passive: always max
      }
      const cur = st.stacks;
      stacksNow[b.id] = cur;
      buffStackSum[bi] += cur;
      if (cur > 0) applyDelta(panel, b.maxDelta, cur / b.maxStacks);
    });

    const r = calcSkill({ ...item, count: 1 }, panel, tier, opts);
    total += r.total;
    const agg = skillMap.get(item.name) || { casts: 0, dmg: 0 };
    agg.casts += 1; agg.dmg += r.total;
    skillMap.set(item.name, agg);
    casts.push({ name: item.name, start, dur, dmg: r.total, stacks: stacksNow });

    // this cast triggers/refreshes the ramping buffs → stack for the NEXT cast
    buffs.forEach((b, bi) => {
      if (!b.ramp) return;
      const st = state[bi];
      st.stacks = Math.min(b.maxStacks, st.stacks + 1);
      st.lastTrigger = start;
    });
    clock += dur;
  }

  const duration = clock || window;
  const dps = total / (window || duration);

  const perSkill: TLSkillAgg[] = [...skillMap.entries()]
    .map(([name, v]) => ({ name, casts: v.casts, dmg: v.dmg, dps: v.dmg / window, share: total > 0 ? v.dmg / total : 0 }))
    .sort((a, b) => b.dmg - a.dmg);

  const nCasts = raw.length || 1;
  const perBuff: TLBuffAgg[] = buffs.map((b, bi) => {
    const avg = buffStackSum[bi] / nCasts;
    return { id: b.id, name: b.name, color: b.color, maxStacks: b.maxStacks, ramp: b.ramp, avgStacks: avg, uptime: avg / b.maxStacks };
  });

  // Full-uptime reference (every buff pinned at max) = the verified rotation number.
  let full = 0;
  {
    const panel: PanelStats = { ...basePanel };
    for (const b of buffs) applyDelta(panel, b.maxDelta, 1);
    for (const item of rotation) full += calcSkill(item, panel, tier, opts).total;
  }
  const fullUptimeDps = full / window;

  return { casts, perSkill, perBuff, total, dps, duration, fullUptimeDps, uptimeLoss: fullUptimeDps > 0 ? 1 - dps / fullUptimeDps : 0 };
}
