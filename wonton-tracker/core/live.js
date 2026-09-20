import {
  HARD_PITY, SCHEMA_VERSION, UNLOCK_ATTEMPTS, activateSlot, activeLockCount,
  clampInt, clampNumber, clone, costForLocks, createSlots, nextInactiveSlot,
  normalizeSlots, safeText
} from './common.js';
import { normalizePlans } from './plans.js';
import { brightLightAppearance } from '../data/weapons.v1.js';

export const LIVE_STORAGE_KEY = 'wontonReforgeLab.live.v2';

export function createLiveState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    mode: 'live',
    slots: createSlots(),
    totalStones: 0,
    reforgeCount: 0,
    history: [],
    plans: [],
    observedGoldIntervals: { 1: [], 2: [], 3: [], 4: [] },
    target: { weapon: '', color: '', part1: '', part2: '', part3: '' },
    budget: { region: 'United States', startingBeads: 0, startingStones: 0, baseWeaponBeads: 0 },
    pendingResult: null,
    undoStack: []
  };
}

export function normalizeLiveState(input) {
  const source = input && typeof input === 'object' ? clone(input) : createLiveState();
  const state = createLiveState();
  state.slots = normalizeSlots(source.slots);
  state.totalStones = Math.max(0, Number(source.totalStones) || 0);
  state.reforgeCount = Math.max(0, clampInt(source.reforgeCount, 0, Number.MAX_SAFE_INTEGER));
  state.history = Array.isArray(source.history) ? source.history.slice(0, 200).map(event => ({
    at: safeText(event?.at, '', 40),
    roll: clampInt(event?.roll, 0, Number.MAX_SAFE_INTEGER),
    cost: clampInt(event?.cost, 0, 10),
    text: safeText(event?.text, '', 300),
    type: safeText(event?.type, 'info', 20)
  })) : [];
  state.plans = normalizePlans(source.plans);
  for (let id = 1; id <= 4; id += 1) {
    const values = source.observedGoldIntervals?.[id];
    state.observedGoldIntervals[id] = (Array.isArray(values) ? values : [])
      .map(value => clampInt(value, 1, HARD_PITY)).slice(0, 200);
  }
  for (const key of Object.keys(state.target)) state.target[key] = safeText(source.target?.[key], '', 80);
  state.budget.region = safeText(source.budget?.region, state.budget.region, 40);
  state.budget.startingBeads = Math.max(0, Number(source.budget?.startingBeads) || 0);
  state.budget.startingStones = Math.max(0, Number(source.budget?.startingStones) || 0);
  state.budget.baseWeaponBeads = Math.max(0, Number(source.budget?.baseWeaponBeads) || 0);
  state.pendingResult = source.pendingResult && Number(source.pendingResult.roll) === state.reforgeCount
    ? {
        roll: state.reforgeCount,
        activatedSlot: [2, 3, 4, 5].includes(Number(source.pendingResult.activatedSlot))
          ? Number(source.pendingResult.activatedSlot) : null,
        goldSlots: [...new Set(Array.isArray(source.pendingResult.goldSlots) ? source.pendingResult.goldSlots.map(Number) : [])]
          .filter(id => id >= 1 && id <= 4)
      }
    : null;
  state.undoStack = Array.isArray(source.undoStack) ? source.undoStack.filter(value => typeof value === 'string').slice(-20) : [];
  if (state.slots[4].active) {
    state.slots[4].quality = 'gold';
    state.slots[4].attribute = brightLightAppearance(state.slots, state.target.weapon);
  }
  return state;
}

function snapshotForUndo(state) {
  const snapshot = clone(state);
  snapshot.undoStack = [];
  return JSON.stringify(snapshot);
}

function activateNext(state) {
  const slot = nextInactiveSlot(state);
  if (!slot) return null;
  activateSlot(slot);
  return slot.id;
}

export function recordActualReforge(inputState) {
  const previous = normalizeLiveState(inputState);
  const state = clone(previous);
  state.undoStack = [...previous.undoStack, snapshotForUndo(previous)].slice(-20);
  const cost = costForLocks(activeLockCount(state));
  state.totalStones += cost;
  state.reforgeCount += 1;

  state.slots.slice(0, 4).forEach(slot => {
    if (slot.active && !slot.locked) slot.pity = Math.min(HARD_PITY, slot.pity + 1);
  });

  const next = nextInactiveSlot(state);
  let activatedSlot = null;
  if (next) {
    next.activationAttempts = Math.min(UNLOCK_ATTEMPTS, next.activationAttempts + 1);
    next.progress = Math.min(100, Number((next.activationAttempts / UNLOCK_ATTEMPTS * 100).toFixed(2)));
    if (next.activationAttempts >= UNLOCK_ATTEMPTS) activatedSlot = activateNext(state);
  }

  if (state.slots[4].active) state.slots[4].attribute = brightLightAppearance(state.slots, state.target.weapon);
  state.pendingResult = { roll: state.reforgeCount, activatedSlot, goldSlots: [] };
  state.history.unshift({
    at: new Date().toISOString(), roll: state.reforgeCount, cost, type: 'record',
    text: `Recorded actual reforge #${state.reforgeCount}${activatedSlot ? `; Slot ${activatedSlot} activated at full progress` : ''}.`
  });
  state.history = state.history.slice(0, 200);
  return { state, event: { roll: state.reforgeCount, cost, activatedSlot } };
}

function markGoldInPlace(state, ids) {
  if (!state.pendingResult) return [];
  const already = new Set(state.pendingResult.goldSlots || []);
  const added = [];
  [...new Set((Array.isArray(ids) ? ids : [ids]).map(Number))].forEach(id => {
    const slot = state.slots[id - 1];
    if (!slot || id < 1 || id > 4 || !slot.active || slot.locked || already.has(id)) return;
    state.observedGoldIntervals[id].push(Math.max(1, slot.pity));
    state.observedGoldIntervals[id] = state.observedGoldIntervals[id].slice(-200);
    slot.pity = 0;
    slot.quality = 'gold';
    already.add(id);
    added.push(id);
  });
  state.pendingResult.goldSlots = [...already];
  return added;
}

export function recordObservedGold(inputState, ids) {
  const state = normalizeLiveState(inputState);
  if (!state.pendingResult) return { state, recorded: false, goldSlots: [] };
  const added = markGoldInPlace(state, ids);
  if (added.length) {
    state.history.unshift({
      at: new Date().toISOString(), roll: state.reforgeCount, cost: 0, type: 'gold',
      text: `Gold observed in Slot${added.length > 1 ? 's' : ''} ${added.join(', ')}; selected pity counter${added.length > 1 ? 's' : ''} reset.`
    });
    state.history = state.history.slice(0, 200);
  }
  if (state.slots[4].active) state.slots[4].attribute = brightLightAppearance(state.slots, state.target.weapon);
  return { state, recorded: added.length > 0, goldSlots: added };
}

export function recordEarlyUnlock(inputState) {
  const state = normalizeLiveState(inputState);
  if (!state.pendingResult || state.pendingResult.activatedSlot) {
    return { state, recorded: false, activatedSlot: state.pendingResult?.activatedSlot || null };
  }
  const activatedSlot = activateNext(state);
  if (!activatedSlot) return { state, recorded: false, activatedSlot: null };
  state.pendingResult.activatedSlot = activatedSlot;
  state.history.unshift({
    at: new Date().toISOString(), roll: state.reforgeCount, cost: 0, type: 'activate',
    text: `Slot ${activatedSlot} activated early.`
  });
  state.history = state.history.slice(0, 200);
  if (state.slots[4].active) state.slots[4].attribute = brightLightAppearance(state.slots, state.target.weapon);
  return { state, recorded: true, activatedSlot };
}

export function recordActualResult(inputState, details = {}) {
  const state = normalizeLiveState(inputState);
  if (!state.pendingResult) return { state, recorded: false, goldSlots: [], activatedSlot: null };

  const addedGold = markGoldInPlace(state, details.goldSlots || []);
  const changes = Array.isArray(details.changes) ? details.changes : [];
  changes.forEach(change => {
    const slot = state.slots[Number(change?.slotId) - 1];
    if (!slot?.active) return;
    if (slot.id === 5) {
      slot.quality = 'gold';
      slot.attribute = brightLightAppearance(state.slots, state.target.weapon);
      return;
    }
    if (['blue', 'purple', 'gold'].includes(change.quality)) slot.quality = change.quality;
    if (typeof change.attribute === 'string') slot.attribute = safeText(change.attribute, slot.attribute, 80);
  });

  let activatedSlot = state.pendingResult.activatedSlot || null;
  if (details.unlockEarly && !activatedSlot) {
    activatedSlot = activateNext(state);
    if (activatedSlot) state.pendingResult.activatedSlot = activatedSlot;
  }

  const allGold = [...new Set(state.pendingResult.goldSlots || [])];
  const summary = [
    allGold.length ? `Gold observed in Slot${allGold.length > 1 ? 's' : ''} ${allGold.join(', ')}` : 'No Gold recorded',
    activatedSlot ? `Slot ${activatedSlot} activated` : '',
    changes.length ? 'appearance details updated' : ''
  ].filter(Boolean).join('; ');

  state.history.unshift({
    at: new Date().toISOString(), roll: state.reforgeCount, cost: 0,
    type: allGold.length || addedGold.length ? 'gold' : 'result', text: `${summary}.`
  });
  state.history = state.history.slice(0, 200);
  if (state.slots[4].active) state.slots[4].attribute = brightLightAppearance(state.slots, state.target.weapon);
  state.pendingResult = null;
  return { state, recorded: true, goldSlots: allGold, activatedSlot };
}

export function undoLive(inputState) {
  const state = normalizeLiveState(inputState);
  const raw = state.undoStack.at(-1);
  if (!raw) return { state, undone: false };
  try {
    const restored = normalizeLiveState(JSON.parse(raw));
    restored.undoStack = state.undoStack.slice(0, -1);
    return { state: restored, undone: true };
  } catch {
    state.undoStack = [];
    return { state, undone: false };
  }
}

export function setLiveSlot(inputState, id, patch = {}) {
  const state = normalizeLiveState(inputState);
  const slot = state.slots[Number(id) - 1];
  if (!slot) return state;
  if ('active' in patch && slot.id > 1) slot.active = !!patch.active;
  if (slot.id < 5) {
    if (['blue', 'purple', 'gold'].includes(patch.quality)) slot.quality = patch.quality;
    if (typeof patch.attribute === 'string') slot.attribute = safeText(patch.attribute, slot.attribute, 80);
    if ('pity' in patch) slot.pity = clampInt(patch.pity, 0, HARD_PITY);
    if ('locked' in patch) slot.locked = !!patch.locked;
  }
  if ('progress' in patch && !slot.active) slot.progress = clampNumber(patch.progress, 0, 99.99);
  return normalizeLiveState(state);
}

export function observedStats(values) {
  const sample = (Array.isArray(values) ? values : []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sample.length) return { count: 0, average: null, median: null };
  const middle = Math.floor(sample.length / 2);
  const median = sample.length % 2 ? sample[middle] : (sample[middle - 1] + sample[middle]) / 2;
  return {
    count: sample.length,
    average: Number((sample.reduce((sum, value) => sum + value, 0) / sample.length).toFixed(1)),
    median: Number(median.toFixed(1))
  };
}
