(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WontonSimulator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'wontonSimulatorState.v1';
  const HARD_PITY = 90;
  const LOCK_COSTS = [1, 2, 5, 10];

  const ATTRIBUTES = {
    1: {
      blue: ['Set 1', 'Rouge', 'Lapis', 'Vast', 'Vermilion', 'Pine Green', 'Sprout Yellow', 'Dusk Violet', 'Feather Gray', 'Ink Dust'],
      purple: ['Set 1', 'Set 2', 'Apricot Pink', 'Smoke Blue', 'Water Hue', 'Azalea', 'Young Grass', 'Tangerine', 'Wisteria', 'White Shell', 'Jackdaw'],
      gold: ['Set 1', 'Set 2', 'Peach Crystal', 'Dragon Abyss', 'Ice Spring', 'Red Brocade', 'Jade', 'Gold', 'Violet Glaze', 'Pearl', 'Obsidian']
    },
    234: {
      blue: ['Set 1'],
      purple: ['Set 1', 'Set 2'],
      gold: ['Set 1', 'Set 2']
    }
  };

  function hashSeed(value) {
    const text = String(value || 'wonton-practice');
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0 || 0x6d2b79f5;
  }

  function nextRng(state) {
    const next = (Math.imul(state >>> 0, 1664525) + 1013904223) >>> 0;
    return { value: next / 4294967296, state: next };
  }

  function createSeededRng(seed) {
    let state = hashSeed(seed);
    return function rng() {
      const next = nextRng(state);
      state = next.state;
      return next.value;
    };
  }

  function clampPity(value) {
    const parsed = Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0;
    return Math.min(HARD_PITY, Math.max(0, parsed));
  }

  function costForLocks(count) {
    return LOCK_COSTS[Math.min(3, Math.max(0, Math.floor(Number(count) || 0)))];
  }

  function qualityRates(mode, pityAfterRoll) {
    const pity = clampPity(pityAfterRoll);
    if (pity >= HARD_PITY) return { blue: 0, purple: 0, gold: 1 };

    let gold = 0.03;
    if (mode === 'community') {
      if (pity > 60) gold = 0.05;
      else if (pity > 30) gold = 0.04;
    }
    return { blue: 0.85 - gold, purple: 0.15, gold };
  }

  function defaultSlot(id) {
    if (id === 5) {
      return { id, active: true, quality: 'gold', attribute: 'Sunlight', locked: true, pity: 0 };
    }
    return {
      id,
      active: true,
      quality: 'blue',
      attribute: 'Set 1',
      locked: false,
      pity: 0
    };
  }

  function createInitialState(options) {
    const opts = options || {};
    const seed = String(opts.seed || 'practice-1');
    return {
      version: 1,
      mode: opts.mode === 'community' ? 'community' : 'official',
      seed,
      rngState: hashSeed(seed),
      slots: [1, 2, 3, 4, 5].map(defaultSlot),
      totalStones: 0,
      reforgeCount: 0,
      history: [],
      lastRoll: null
    };
  }

  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function pickAttribute(slotId, quality, randomValue) {
    if (slotId === 5) return 'Sunlight';
    const source = slotId === 1 ? ATTRIBUTES[1] : ATTRIBUTES[234];
    const list = source[quality] || ['Set 1'];
    const index = Math.min(list.length - 1, Math.floor(randomValue * list.length));
    return list[index];
  }

  function rollQuality(mode, pityAfterRoll, randomValue) {
    const rates = qualityRates(mode, pityAfterRoll);
    if (rates.gold === 1) return 'gold';
    if (randomValue < rates.blue) return 'blue';
    if (randomValue < rates.blue + rates.purple) return 'purple';
    return 'gold';
  }

  function normalizeState(input) {
    const state = cloneState(input || createInitialState());
    state.mode = state.mode === 'community' ? 'community' : 'official';
    state.seed = String(state.seed || 'practice-1');
    state.rngState = Number.isInteger(state.rngState) ? state.rngState >>> 0 : hashSeed(state.seed);
    state.totalStones = Math.max(0, Number(state.totalStones) || 0);
    state.reforgeCount = Math.max(0, Math.floor(Number(state.reforgeCount) || 0));
    state.history = Array.isArray(state.history) ? state.history.slice(0, 200) : [];
    state.slots = [1, 2, 3, 4, 5].map((id, index) => {
      const incoming = state.slots && state.slots[index] ? state.slots[index] : defaultSlot(id);
      if (id === 5) return { id: 5, active: !!incoming.active, quality: 'gold', attribute: 'Sunlight', locked: true, pity: 0 };
      const quality = ['blue', 'purple', 'gold'].includes(incoming.quality) ? incoming.quality : 'blue';
      return {
        id,
        active: !!incoming.active,
        quality,
        attribute: String(incoming.attribute || 'Set 1'),
        locked: !!incoming.locked,
        pity: clampPity(incoming.pity)
      };
    });
    const activeLocks = state.slots.slice(0, 4).filter(slot => slot.active && slot.locked);
    if (activeLocks.length > 3) activeLocks.slice(3).forEach(slot => { slot.locked = false; });
    return state;
  }

  function reforge(inputState) {
    const state = normalizeState(inputState);
    const lockedCount = state.slots.slice(0, 4).filter(slot => slot.active && slot.locked).length;
    const cost = costForLocks(lockedCount);
    const changes = [];

    state.totalStones += cost;
    state.reforgeCount += 1;

    for (let i = 0; i < 4; i += 1) {
      const slot = state.slots[i];
      if (!slot.active || slot.locked) continue;

      const pityAfterRoll = Math.min(HARD_PITY, slot.pity + 1);
      let rng = nextRng(state.rngState);
      state.rngState = rng.state;
      const quality = rollQuality(state.mode, pityAfterRoll, rng.value);

      rng = nextRng(state.rngState);
      state.rngState = rng.state;
      const attribute = pickAttribute(slot.id, quality, rng.value);

      slot.quality = quality;
      slot.attribute = attribute;
      slot.pity = quality === 'gold' ? 0 : pityAfterRoll;
      changes.push({ slot: slot.id, quality, attribute, pity: slot.pity });
    }

    const event = {
      roll: state.reforgeCount,
      cost,
      lockedCount,
      changes,
      totalStones: state.totalStones
    };
    state.lastRoll = event;
    state.history.unshift(event);
    state.history = state.history.slice(0, 200);
    return { state, event };
  }

  function countGold(state) {
    return normalizeState(state).slots.slice(0, 4).filter(slot => slot.active && slot.quality === 'gold').length;
  }

  function sameGoldSetCount(state) {
    const counts = { 'Set 1': 0, 'Set 2': 0 };
    normalizeState(state).slots.slice(0, 4).forEach(slot => {
      if (slot.active && slot.quality === 'gold' && Object.hasOwn(counts, slot.attribute)) counts[slot.attribute] += 1;
    });
    return Math.max(counts['Set 1'], counts['Set 2']);
  }

  function goalReached(state, goal) {
    if (goal === 'set-2') return sameGoldSetCount(state) >= 2;
    if (goal === 'set-3') return sameGoldSetCount(state) >= 3;
    const target = Number(String(goal || 'gold-2').replace('gold-', '')) || 2;
    return countGold(state) >= Math.min(4, Math.max(1, target));
  }

  function autoLockGold(state, goal) {
    const next = normalizeState(state);
    next.slots.slice(0, 4).forEach(slot => { slot.locked = false; });
    const goldSlots = next.slots.slice(0, 4).filter(slot => slot.active && slot.quality === 'gold');

    let candidates = goldSlots;
    if (goal === 'set-2' || goal === 'set-3') {
      const set1 = goldSlots.filter(slot => slot.attribute === 'Set 1');
      const set2 = goldSlots.filter(slot => slot.attribute === 'Set 2');
      candidates = set2.length > set1.length ? set2 : set1;
    }
    candidates.slice(0, 3).forEach(slot => { slot.locked = true; });
    return next;
  }

  function percentile(sortedValues, ratio) {
    if (!sortedValues.length) return 0;
    const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(sortedValues.length * ratio) - 1));
    return sortedValues[index];
  }

  function runBatch(inputState, options) {
    const opts = options || {};
    const runs = Math.min(10000, Math.max(1, Math.floor(Number(opts.runs) || 100)));
    const maxReforges = Math.min(5000, Math.max(1, Math.floor(Number(opts.maxReforges) || 500)));
    const goal = opts.goal || 'gold-2';
    const strategy = opts.strategy || 'lock-gold';
    const base = normalizeState(inputState);
    const outcomes = [];
    let successCount = 0;

    for (let run = 0; run < runs; run += 1) {
      let state = normalizeState(base);
      state.seed = `${base.seed}:batch:${run}`;
      state.rngState = hashSeed(state.seed);
      state.totalStones = 0;
      state.reforgeCount = 0;
      state.history = [];
      state.lastRoll = null;

      if (strategy === 'lock-gold') state = autoLockGold(state, goal);
      let success = goalReached(state, goal);
      while (!success && state.reforgeCount < maxReforges) {
        state = reforge(state).state;
        if (strategy === 'lock-gold') state = autoLockGold(state, goal);
        success = goalReached(state, goal);
      }

      if (success) successCount += 1;
      outcomes.push({ success, reforges: state.reforgeCount, stones: state.totalStones });
    }

    const completed = outcomes.filter(item => item.success);
    const sample = completed.length ? completed : outcomes;
    const reforges = sample.map(item => item.reforges).sort((a, b) => a - b);
    const stones = sample.map(item => item.stones).sort((a, b) => a - b);
    const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

    return {
      runs,
      goal,
      strategy,
      successes: successCount,
      successRate: successCount / runs,
      averageReforges: Number(average(reforges).toFixed(2)),
      averageStones: Number(average(stones).toFixed(2)),
      medianReforges: percentile(reforges, 0.5),
      medianStones: percentile(stones, 0.5),
      p90Stones: percentile(stones, 0.9),
      maxReforges
    };
  }

  return {
    STORAGE_KEY,
    HARD_PITY,
    ATTRIBUTES,
    clampPity,
    costForLocks,
    qualityRates,
    createSeededRng,
    createInitialState,
    normalizeState,
    reforge,
    countGold,
    sameGoldSetCount,
    goalReached,
    runBatch
  };
});