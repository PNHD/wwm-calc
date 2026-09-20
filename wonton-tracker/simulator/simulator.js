(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WontonSimulator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'wontonSimulatorState.v2';
  const HARD_PITY = 90;
  const UNLOCK_ATTEMPTS = 30;
  const UNLOCK_STEP = 100 / UNLOCK_ATTEMPTS;
  const LOCK_COSTS = [1, 2, 5, 10];
  const MAX_PLANS = 5;

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

  function takeRandom(state) {
    const next = nextRng(state.rngState);
    state.rngState = next.state;
    return next.value;
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

  function clampProgress(value) {
    const parsed = Number.isFinite(Number(value)) ? Number(value) : 0;
    return Math.min(100, Math.max(0, parsed));
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

  // Community activation model used by WWMReforge v1.3.
  // The 30-attempt maximum is widely reported; these early-unlock rates are not official.
  function activationChance(attempt) {
    const n = Math.max(1, Math.floor(Number(attempt) || 1));
    if (n <= 10) return 0.02;
    if (n <= 20) return 0.035;
    return 0.05;
  }

  function defaultSlot(id) {
    if (id === 1) {
      return {
        id,
        active: true,
        quality: 'blue',
        attribute: 'Set 1',
        locked: false,
        pity: 0,
        progress: 100,
        activationAttempts: 0
      };
    }
    if (id === 5) {
      return {
        id,
        active: false,
        quality: 'gold',
        attribute: 'Sunlight',
        locked: false,
        pity: 0,
        progress: 0,
        activationAttempts: 0
      };
    }
    return {
      id,
      active: false,
      quality: 'blue',
      attribute: 'Set 1',
      locked: false,
      pity: 0,
      progress: 0,
      activationAttempts: 0
    };
  }

  function createInitialState(options) {
    const opts = options || {};
    const seed = String(opts.seed || 'practice-1');
    return {
      version: 2,
      mode: opts.mode === 'community' ? 'community' : 'official',
      seed,
      rngState: hashSeed(seed),
      slots: [1, 2, 3, 4, 5].map(defaultSlot),
      totalStones: 0,
      reforgeCount: 0,
      history: [],
      plans: [],
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

  function attributeList(slotId, quality) {
    if (slotId === 5) return ['Sunlight'];
    const source = slotId === 1 ? ATTRIBUTES[1] : ATTRIBUTES[234];
    return source[quality] || ['Set 1'];
  }

  function normalizePlan(plan, index) {
    const source = plan && typeof plan === 'object' ? plan : {};
    const rawSlots = Array.isArray(source.slots) ? source.slots : [];
    const slots = [1, 2, 3, 4, 5].map((id, slotIndex) => {
      const incoming = rawSlots[slotIndex] || {};
      if (id === 5) {
        return {
          id,
          active: !!incoming.active,
          quality: 'gold',
          attribute: 'Sunlight'
        };
      }
      const quality = ['blue', 'purple', 'gold'].includes(incoming.quality) ? incoming.quality : 'blue';
      const allowed = attributeList(id, quality);
      const attribute = allowed.includes(incoming.attribute) ? incoming.attribute : allowed[0];
      return {
        id,
        active: id === 1 ? true : !!incoming.active,
        quality,
        attribute
      };
    });

    return {
      id: Number.isInteger(source.id) && source.id > 0 ? source.id : index + 1,
      name: String(source.name || `Plan ${index + 1}`).slice(0, 80),
      savedAt: typeof source.savedAt === 'string' ? source.savedAt : '',
      slots
    };
  }

  function normalizeState(input) {
    const state = cloneState(input || createInitialState());
    state.version = 2;
    state.mode = state.mode === 'community' ? 'community' : 'official';
    state.seed = String(state.seed || 'practice-1');
    state.rngState = Number.isInteger(state.rngState) ? state.rngState >>> 0 : hashSeed(state.seed);
    state.totalStones = Math.max(0, Number(state.totalStones) || 0);
    state.reforgeCount = Math.max(0, Math.floor(Number(state.reforgeCount) || 0));
    state.history = Array.isArray(state.history) ? state.history.slice(0, 200) : [];
    const rawPlans = Array.isArray(state.plans) ? state.plans.slice(0, MAX_PLANS) : [];
    state.plans = rawPlans.map(normalizePlan);
    const usedPlanIds = new Set();
    let nextPlanId = 1;
    state.plans.forEach(plan => {
      if (usedPlanIds.has(plan.id)) {
        while (usedPlanIds.has(nextPlanId)) nextPlanId += 1;
        plan.id = nextPlanId;
      }
      usedPlanIds.add(plan.id);
      nextPlanId = Math.max(nextPlanId, plan.id + 1);
    });

    state.slots = [1, 2, 3, 4, 5].map((id, index) => {
      const fallback = defaultSlot(id);
      const incoming = state.slots && state.slots[index] ? state.slots[index] : fallback;
      const quality = ['blue', 'purple', 'gold'].includes(incoming.quality) ? incoming.quality : fallback.quality;
      return {
        id,
        active: id === 1 ? true : !!incoming.active,
        quality: id === 5 ? 'gold' : quality,
        attribute: id === 5 ? 'Sunlight' : String(incoming.attribute || 'Set 1'),
        locked: id === 5 ? !!incoming.active : !!incoming.locked,
        pity: id === 5 ? 0 : clampPity(incoming.pity),
        progress: id === 1 ? 100 : clampProgress(incoming.progress),
        activationAttempts: id === 1 ? 0 : Math.min(UNLOCK_ATTEMPTS, Math.max(0, Math.floor(Number(incoming.activationAttempts) || 0)))
      };
    });

    // Real reforge progression is sequential. Once an inactive slot is reached,
    // later slots cannot be active yet.
    let foundInactive = false;
    for (let i = 1; i < state.slots.length; i += 1) {
      const slot = state.slots[i];
      if (foundInactive) {
        slot.active = false;
        slot.locked = false;
        slot.pity = 0;
        slot.progress = 0;
        slot.activationAttempts = 0;
        continue;
      }
      if (slot.active) {
        slot.progress = 100;
        if (slot.id === 5) {
          slot.quality = 'gold';
          slot.attribute = 'Sunlight';
          slot.locked = true;
          slot.pity = 0;
        }
      } else {
        foundInactive = true;
        slot.locked = false;
        slot.pity = 0;
        slot.progress = Math.min(99.99, slot.progress);
        const inferredAttempts = Math.round(slot.progress / UNLOCK_STEP);
        slot.activationAttempts = Math.min(
          UNLOCK_ATTEMPTS - 1,
          Math.max(slot.activationAttempts, inferredAttempts)
        );
      }
    }

    const activeLocks = state.slots.slice(0, 4).filter(slot => slot.active && slot.locked);
    if (activeLocks.length > 3) activeLocks.slice(3).forEach(slot => { slot.locked = false; });
    return state;
  }

  function nextUnlockSlotId(inputState) {
    const state = normalizeState(inputState);
    const next = state.slots.find(slot => slot.id > 1 && !slot.active);
    return next ? next.id : null;
  }

  function allSlotsUnlocked(inputState) {
    return normalizeState(inputState).slots.every(slot => slot.active);
  }

  function rollSlot(state, slot, incrementPity) {
    const pityAfterRoll = incrementPity ? Math.min(HARD_PITY, slot.pity + 1) : 0;
    const quality = rollQuality(state.mode, pityAfterRoll, takeRandom(state));
    const attribute = pickAttribute(slot.id, quality, takeRandom(state));
    slot.quality = quality;
    slot.attribute = attribute;
    slot.pity = incrementPity && quality !== 'gold' ? pityAfterRoll : 0;
    return { slot: slot.id, quality, attribute, pity: slot.pity };
  }

  function advanceUnlock(state) {
    const id = nextUnlockSlotId(state);
    if (!id) return { slot: null, activated: false, progress: 100, attempts: 0 };

    const slot = state.slots[id - 1];
    slot.activationAttempts = Math.min(UNLOCK_ATTEMPTS, slot.activationAttempts + 1);

    const direct = takeRandom(state) < activationChance(slot.activationAttempts);
    if (!direct) {
      slot.progress = Math.min(100, Number((slot.progress + UNLOCK_STEP).toFixed(2)));
    }

    const activated = direct || slot.activationAttempts >= UNLOCK_ATTEMPTS || slot.progress >= 99.9;
    if (!activated) {
      return {
        slot: id,
        activated: false,
        direct: false,
        progress: slot.progress,
        attempts: slot.activationAttempts
      };
    }

    slot.active = true;
    slot.progress = 100;
    slot.locked = false;
    slot.pity = 0;

    if (id === 5) {
      slot.quality = 'gold';
      slot.attribute = 'Sunlight';
      slot.locked = true;
      return {
        slot: id,
        activated: true,
        direct,
        progress: 100,
        attempts: slot.activationAttempts,
        quality: 'gold',
        attribute: 'Sunlight'
      };
    }

    const initial = rollSlot(state, slot, false);
    return {
      slot: id,
      activated: true,
      direct,
      progress: 100,
      attempts: slot.activationAttempts,
      quality: initial.quality,
      attribute: initial.attribute
    };
  }

  function reforge(inputState) {
    const state = normalizeState(inputState);
    const lockedCount = state.slots.slice(0, 4).filter(slot => slot.active && slot.locked).length;
    const cost = costForLocks(lockedCount);
    const changes = [];

    state.totalStones += cost;
    state.reforgeCount += 1;

    // Only currently active, unlocked Slots 1-4 reroll.
    // Inactive parts have no pity counter yet.
    for (let i = 0; i < 4; i += 1) {
      const slot = state.slots[i];
      if (!slot.active || slot.locked) continue;
      changes.push(rollSlot(state, slot, true));
    }

    // The next inactive slot progresses after the current reroll.
    const activation = advanceUnlock(state);

    const event = {
      roll: state.reforgeCount,
      cost,
      lockedCount,
      changes,
      activation,
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

    // Common cost-saving practice is to unlock through Bright Light first,
    // then start paying extra to preserve useful Gold parts.
    if (!allSlotsUnlocked(next)) return next;

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

  function savePlan(inputState, name = '') {
    const state = normalizeState(inputState);
    if (state.plans.length >= MAX_PLANS) {
      return { state, plan: null, saved: false };
    }

    const nextId = state.plans.reduce((max, plan) => Math.max(max, plan.id), 0) + 1;
    const plan = {
      id: nextId,
      name: String(name || `Plan ${state.plans.length + 1}`).slice(0, 80),
      savedAt: new Date().toISOString(),
      slots: state.slots.map(slot => ({
        id: slot.id,
        active: slot.active,
        quality: slot.id === 5 ? 'gold' : slot.quality,
        attribute: slot.id === 5 ? 'Sunlight' : slot.attribute
      }))
    };

    state.plans.push(plan);
    return { state, plan, saved: true };
  }

  function applyPlan(inputState, planId) {
    const state = normalizeState(inputState);
    const plan = state.plans.find(item => item.id === Number(planId));
    if (!plan) return { state, plan: null, applied: false };

    state.slots.forEach((slot, index) => {
      const saved = plan.slots[index];
      if (!slot.active || !saved || !saved.active) return;
      if (slot.id === 5) {
        slot.quality = 'gold';
        slot.attribute = 'Sunlight';
        return;
      }
      slot.quality = saved.quality;
      slot.attribute = saved.attribute;
    });

    return { state: normalizeState(state), plan, applied: true };
  }

  function deletePlan(inputState, planId) {
    const state = normalizeState(inputState);
    const before = state.plans.length;
    state.plans = state.plans.filter(item => item.id !== Number(planId));
    return { state, deleted: state.plans.length !== before };
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
      const isSuccessful = current => strategy === 'lock-gold'
        ? allSlotsUnlocked(current) && goalReached(current, goal)
        : goalReached(current, goal);
      let success = isSuccessful(state);
      while (!success && state.reforgeCount < maxReforges) {
        state = reforge(state).state;
        if (strategy === 'lock-gold') state = autoLockGold(state, goal);
        success = isSuccessful(state);
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
    UNLOCK_ATTEMPTS,
    MAX_PLANS,
    ATTRIBUTES,
    clampPity,
    costForLocks,
    qualityRates,
    activationChance,
    createSeededRng,
    createInitialState,
    normalizeState,
    nextUnlockSlotId,
    allSlotsUnlocked,
    reforge,
    countGold,
    sameGoldSetCount,
    goalReached,
    savePlan,
    applyPlan,
    deletePlan,
    runBatch
  };
});