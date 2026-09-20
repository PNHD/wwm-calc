import {
  HARD_PITY, SCHEMA_VERSION, UNLOCK_ATTEMPTS, activeLockCount, clampInt,
  clone, costForLocks, createSlots, nextInactiveSlot, normalizeSlots, safeText
} from './common.js';
import { appearancesFor } from '../data/weapons.v1.js';
import {
  MAX_PLANS, applyPlan, deletePlan, normalizePlans, renamePlan, savePlan
} from './plans.js';

export const PRACTICE_STORAGE_KEY = 'wontonReforgeLab.practice.v2';
export const LEGACY_PRACTICE_STORAGE_KEY = 'wontonSimulatorState.v2';
export const STORAGE_KEY = PRACTICE_STORAGE_KEY;
export { HARD_PITY, UNLOCK_ATTEMPTS, MAX_PLANS, applyPlan, deletePlan, renamePlan, savePlan };

const HISTORY_LIMIT = 200;
const UNDO_LIMIT = 30;

export function hashSeed(value) {
  const text = String(value || 'wonton-practice');
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 0x6d2b79f5;
}

export function nextRng(rngState) {
  const state = (Math.imul(rngState >>> 0, 1664525) + 1013904223) >>> 0;
  return { value: state / 4294967296, state };
}

export function createSeededRng(seed) {
  let state = hashSeed(seed);
  return () => {
    const next = nextRng(state);
    state = next.state;
    return next.value;
  };
}

function takeRandom(state) {
  const next = nextRng(state.rngState);
  state.rngState = next.state;
  return next.value;
}

export function qualityRates(mode, pityAfterRoll) {
  const pity = clampInt(pityAfterRoll, 0, HARD_PITY);
  if (pity >= HARD_PITY) return { blue: 0, purple: 0, gold: 1 };
  const gold = mode === 'community' && pity > 60 ? 0.05
    : mode === 'community' && pity > 30 ? 0.04 : 0.03;
  return { blue: 0.85 - gold, purple: 0.15, gold };
}

export function activationChance(attempt) {
  const value = Math.max(1, Math.floor(Number(attempt) || 1));
  return value <= 10 ? 0.02 : value <= 20 ? 0.035 : 0.05;
}

export function attributeList(slotId, quality) {
  return appearancesFor(Number(slotId), quality);
}

function pickAttribute(slotId, quality, randomValue) {
  const options = attributeList(slotId, quality);
  return options[Math.min(options.length - 1, Math.floor(randomValue * options.length))];
}

function rollQuality(mode, pityAfterRoll, randomValue) {
  const rates = qualityRates(mode, pityAfterRoll);
  if (rates.gold === 1 || randomValue >= rates.blue + rates.purple) return 'gold';
  return randomValue < rates.blue ? 'blue' : 'purple';
}

export function createPracticeState(options = {}) {
  const seed = String(options.seed || 'practice-1');
  const slots = createSlots();
  return {
    schemaVersion: SCHEMA_VERSION,
    mode: options.mode === 'community' ? 'community' : 'official',
    seed,
    rngState: hashSeed(seed),
    slots,
    baselineSlots: clone(slots),
    totalStones: 0,
    reforgeCount: 0,
    history: [],
    plans: [],
    target: { weapon: '', color: '', part1: '', part2: '', part3: '' },
    budget: { region: 'United States', startingBeads: 0, startingStones: 0, baseWeaponBeads: 0 },
    goals: { goal: 'gold-2', strategy: 'lock-gold', runs: 100, maxReforges: 500 },
    batchHistory: [],
    lastRoll: null,
    pendingGold: null,
    undoStack: []
  };
}

export const createInitialState = createPracticeState;

export function normalizePracticeState(input) {
  const source = input && typeof input === 'object' ? clone(input) : createPracticeState();
  const state = createPracticeState({ mode: source.mode, seed: source.seed });
  state.rngState = Number.isInteger(source.rngState) ? source.rngState >>> 0 : hashSeed(state.seed);
  state.slots = normalizeSlots(source.slots);
  state.baselineSlots = normalizeSlots(source.baselineSlots || state.slots);
  state.totalStones = Math.max(0, Number(source.totalStones) || 0);
  state.reforgeCount = clampInt(source.reforgeCount, 0, Number.MAX_SAFE_INTEGER);
  state.history = Array.isArray(source.history) ? source.history.slice(0, HISTORY_LIMIT).map(event => ({
    ...event,
    roll: clampInt(event?.roll, 0, Number.MAX_SAFE_INTEGER),
    cost: clampInt(event?.cost, 0, 10),
    at: safeText(event?.at, '', 40)
  })) : [];
  state.plans = normalizePlans(source.plans);
  for (const key of Object.keys(state.target)) state.target[key] = safeText(source.target?.[key], '', 80);
  state.budget.region = safeText(source.budget?.region, state.budget.region, 40);
  state.budget.startingBeads = Math.max(0, Number(source.budget?.startingBeads) || 0);
  state.budget.startingStones = Math.max(0, Number(source.budget?.startingStones) || 0);
  state.budget.baseWeaponBeads = Math.max(0, Number(source.budget?.baseWeaponBeads) || 0);
  state.goals = {
    goal: safeText(source.goals?.goal, 'gold-2', 20),
    strategy: source.goals?.strategy === 'no-lock' ? 'no-lock' : 'lock-gold',
    runs: [100, 1000, 10000].includes(Number(source.goals?.runs)) ? Number(source.goals.runs) : 100,
    maxReforges: clampInt(source.goals?.maxReforges, 1, 5000)
  };
  state.batchHistory = Array.isArray(source.batchHistory) ? source.batchHistory.slice(0, 20) : [];
  state.lastRoll = source.lastRoll && Number(source.lastRoll.roll) === state.reforgeCount ? source.lastRoll : null;
  state.pendingGold = source.pendingGold && Number(source.pendingGold.roll) === state.reforgeCount
    ? source.pendingGold : null;
  state.undoStack = Array.isArray(source.undoStack)
    ? source.undoStack.filter(value => typeof value === 'string').slice(-UNDO_LIMIT) : [];
  return state;
}

export const normalizeState = normalizePracticeState;

export function nextUnlockSlotId(inputState) {
  return nextInactiveSlot(normalizePracticeState(inputState))?.id || null;
}

export function allSlotsUnlocked(inputState) {
  return normalizePracticeState(inputState).slots.every(slot => slot.active);
}

function snapshotForUndo(state) {
  const snapshot = clone(state);
  snapshot.undoStack = [];
  return JSON.stringify(snapshot);
}

function rollSlot(state, slot) {
  const pityAfterRoll = Math.min(HARD_PITY, slot.pity + 1);
  const quality = rollQuality(state.mode, pityAfterRoll, takeRandom(state));
  const attribute = pickAttribute(slot.id, quality, takeRandom(state));
  slot.quality = quality;
  slot.attribute = attribute;
  slot.pity = quality === 'gold' ? 0 : pityAfterRoll;
  return { slot: slot.id, quality, attribute, pity: slot.pity };
}

function advanceUnlock(state) {
  const slot = nextInactiveSlot(state);
  if (!slot) return { slot: null, activated: false, progress: 100, attempts: 0 };
  slot.activationAttempts = Math.min(UNLOCK_ATTEMPTS, slot.activationAttempts + 1);
  // Early unlock is a separately labeled Community/Unofficial mechanic in both
  // quality modes; "official" controls quality rates only.
  const direct = takeRandom(state) < activationChance(slot.activationAttempts);
  if (!direct) slot.progress = Math.min(100, Number((slot.activationAttempts / UNLOCK_ATTEMPTS * 100).toFixed(2)));
  if (!direct && slot.activationAttempts < UNLOCK_ATTEMPTS) {
    return { slot: slot.id, activated: false, direct: false, progress: slot.progress, attempts: slot.activationAttempts };
  }
  slot.active = true;
  slot.progress = 100;
  slot.pity = 0;
  slot.locked = slot.id === 5;
  if (slot.id === 5) {
    slot.quality = 'gold';
    slot.attribute = 'Sunlight';
    return { slot: 5, activated: true, direct, progress: 100, attempts: slot.activationAttempts, quality: 'gold', attribute: 'Sunlight' };
  }
  const quality = rollQuality(state.mode, 0, takeRandom(state));
  const attribute = pickAttribute(slot.id, quality, takeRandom(state));
  slot.quality = quality;
  slot.attribute = attribute;
  return { slot: slot.id, activated: true, direct, progress: 100, attempts: slot.activationAttempts, quality, attribute };
}

export function reforge(inputState) {
  const previous = normalizePracticeState(inputState);
  const state = clone(previous);
  state.undoStack = [...previous.undoStack, snapshotForUndo(previous)].slice(-UNDO_LIMIT);
  const lockedCount = activeLockCount(state);
  const cost = costForLocks(lockedCount);
  const changes = [];
  state.totalStones += cost;
  state.reforgeCount += 1;
  state.slots.slice(0, 4).forEach(slot => {
    if (slot.active && !slot.locked) changes.push(rollSlot(state, slot));
  });
  const activation = advanceUnlock(state);
  const goldSlots = changes.filter(change => change.quality === 'gold').map(change => change.slot);
  const event = { roll: state.reforgeCount, cost, lockedCount, changes, activation, goldSlots, hasGold: goldSlots.length > 0, totalStones: state.totalStones };
  state.lastRoll = event;
  state.pendingGold = goldSlots.length ? { roll: state.reforgeCount, goldSlots, changes: clone(changes) } : null;
  state.history.unshift(event);
  state.history = state.history.slice(0, HISTORY_LIMIT);
  return { state, event };
}

export function countGold(inputState) {
  return normalizePracticeState(inputState).slots.slice(0, 4).filter(slot => slot.active && slot.quality === 'gold').length;
}

export function sameGoldSetCount(inputState) {
  const counts = { 'Set 1': 0, 'Set 2': 0 };
  normalizePracticeState(inputState).slots.slice(0, 4).forEach(slot => {
    if (slot.active && slot.quality === 'gold' && Object.hasOwn(counts, slot.attribute)) counts[slot.attribute] += 1;
  });
  return Math.max(counts['Set 1'], counts['Set 2']);
}

export function goalReached(inputState, goal) {
  if (goal === 'set-2') return sameGoldSetCount(inputState) >= 2;
  if (goal === 'set-3') return sameGoldSetCount(inputState) >= 3;
  const target = Number(String(goal || 'gold-2').replace('gold-', '')) || 2;
  return countGold(inputState) >= Math.min(4, Math.max(1, target));
}

export function autoLockGold(inputState, goal) {
  const state = normalizePracticeState(inputState);
  state.slots.slice(0, 4).forEach(slot => { slot.locked = false; });
  if (!allSlotsUnlocked(state)) return state;
  const gold = state.slots.slice(0, 4).filter(slot => slot.quality === 'gold');
  let candidates = gold;
  if (goal === 'set-2' || goal === 'set-3') {
    const set1 = gold.filter(slot => slot.attribute === 'Set 1');
    const set2 = gold.filter(slot => slot.attribute === 'Set 2');
    candidates = set2.length > set1.length ? set2 : set1;
  }
  candidates.slice(0, 3).forEach(slot => { slot.locked = true; });
  return state;
}

export function undoPractice(inputState) {
  const state = normalizePracticeState(inputState);
  const raw = state.undoStack.at(-1);
  if (!raw) return { state, undone: false };
  try {
    const restored = normalizePracticeState(JSON.parse(raw));
    restored.undoStack = state.undoStack.slice(0, -1);
    return { state: restored, undone: true };
  } catch {
    state.undoStack = [];
    return { state, undone: false };
  }
}

export function restartPractice(inputState) {
  const previous = normalizePracticeState(inputState);
  const state = clone(previous);
  state.slots = normalizeSlots(previous.baselineSlots);
  state.rngState = hashSeed(state.seed);
  state.totalStones = 0;
  state.reforgeCount = 0;
  state.history = [];
  state.lastRoll = null;
  state.pendingGold = null;
  state.undoStack = [];
  return { state };
}

export function setBaselineSlots(inputState, slots) {
  const state = normalizePracticeState(inputState);
  state.baselineSlots = normalizeSlots(slots || state.slots);
  return state;
}

function percentile(sorted, ratio) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))];
}

function goalReachedFast(state, goal) {
  const gold = state.slots.slice(0, 4).filter(slot => slot.active && slot.quality === 'gold');
  if (goal === 'set-2' || goal === 'set-3') {
    const needed = goal === 'set-2' ? 2 : 3;
    return Math.max(
      gold.filter(slot => slot.attribute === 'Set 1').length,
      gold.filter(slot => slot.attribute === 'Set 2').length
    ) >= needed;
  }
  return gold.length >= Math.min(4, Math.max(1, Number(String(goal || 'gold-2').replace('gold-', '')) || 2));
}

function autoLockGoldFast(state, goal) {
  state.slots.slice(0, 4).forEach(slot => { slot.locked = false; });
  if (!state.slots.every(slot => slot.active)) return;
  let candidates = state.slots.slice(0, 4).filter(slot => slot.quality === 'gold');
  if (goal === 'set-2' || goal === 'set-3') {
    const set1 = candidates.filter(slot => slot.attribute === 'Set 1');
    const set2 = candidates.filter(slot => slot.attribute === 'Set 2');
    candidates = set2.length > set1.length ? set2 : set1;
  }
  candidates.slice(0, 3).forEach(slot => { slot.locked = true; });
}

function reforgeBatchState(state) {
  state.totalStones += costForLocks(activeLockCount(state));
  state.reforgeCount += 1;
  state.slots.slice(0, 4).forEach(slot => {
    if (slot.active && !slot.locked) rollSlot(state, slot);
  });
  advanceUnlock(state);
}

export function runBatch(inputState, options = {}) {
  const runs = clampInt(options.runs, 1, 10000);
  const maxReforges = clampInt(options.maxReforges, 1, 5000);
  const goal = options.goal || 'gold-2';
  const strategy = options.strategy || 'lock-gold';
  const base = normalizePracticeState(inputState);
  const outcomes = [];
  let successes = 0;
  for (let run = 0; run < runs; run += 1) {
    let state = clone(base);
    state.seed = `${base.seed}:batch:${run}`;
    state.rngState = hashSeed(state.seed);
    state.totalStones = 0;
    state.reforgeCount = 0;
    state.history = [];
    state.lastRoll = null;
    state.pendingGold = null;
    state.undoStack = [];
    if (strategy === 'lock-gold') autoLockGoldFast(state, goal);
    const successful = current => (strategy !== 'lock-gold' || current.slots.every(slot => slot.active))
      && goalReachedFast(current, goal);
    let success = successful(state);
    while (!success && state.reforgeCount < maxReforges) {
      reforgeBatchState(state);
      if (strategy === 'lock-gold') autoLockGoldFast(state, goal);
      success = successful(state);
    }
    if (success) successes += 1;
    outcomes.push({ success, reforges: state.reforgeCount, stones: state.totalStones });
  }
  const sample = outcomes.filter(item => item.success);
  const values = sample.length ? sample : outcomes;
  const reforges = values.map(item => item.reforges).sort((a, b) => a - b);
  const stones = values.map(item => item.stones).sort((a, b) => a - b);
  const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return {
    runs, goal, strategy, successes, successRate: successes / runs,
    averageReforges: Number(average(reforges).toFixed(2)), averageStones: Number(average(stones).toFixed(2)),
    medianReforges: percentile(reforges, 0.5), medianStones: percentile(stones, 0.5),
    p90Stones: percentile(stones, 0.9), maxReforges
  };
}
