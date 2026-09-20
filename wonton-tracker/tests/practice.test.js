import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attributeList, createPracticeState, createSeededRng, goalReached, qualityRates, reforge, restartPractice,
  runBatch, sameGoldSetCount, undoPractice
} from '../core/practice.js';

test('seeded RNG replay is deterministic', () => {
  const a = createSeededRng('repeat');
  const b = createSeededRng('repeat');
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

test('official and Community quality rates are correctly separated', () => {
  assert.deepEqual(qualityRates('official', 1), { blue: .82, purple: .15, gold: .03 });
  assert.deepEqual(qualityRates('official', 89), { blue: .82, purple: .15, gold: .03 });
  assert.equal(qualityRates('community', 31).gold, .04);
  assert.equal(qualityRates('community', 61).gold, .05);
  assert.deepEqual(qualityRates('official', 90), { blue: 0, purple: 0, gold: 1 });
});

test('hard pity 90 produces Gold and resets only the rerolled slot', () => {
  const state = createPracticeState({ seed: 'pity' });
  state.slots[0].pity = 89;
  const result = reforge(state).state;
  assert.equal(result.slots[0].quality, 'gold');
  assert.equal(result.slots[0].pity, 0);
});

test('inactive slots do not reroll or gain pity', () => {
  const state = createPracticeState({ seed: 'inactive' });
  const result = reforge(state).state;
  assert.equal(result.slots[1].pity, 0);
  assert.equal(result.slots[2].quality, 'blue');
  assert.equal(result.slots[2].active, false);
});

test('sequential unlock is guaranteed by attempt 30 and Slot 5 is fixed', () => {
  let state = createPracticeState({ seed: 'sequential' });
  for (let target = 2; target <= 5; target += 1) {
    while (!state.slots[target - 1].active) state = reforge(state).state;
    assert.equal(state.slots.slice(target).some(slot => slot.active), false);
    assert.equal(state.slots[target - 1].pity, 0);
  }
  assert.equal(state.slots[4].quality, 'gold');
  assert.equal(state.slots[4].attribute, 'Sunlight');
});

test('Practice lock cost, undo, and restart work', () => {
  const state = createPracticeState({ seed: 'undo' });
  state.slots[0].locked = true;
  const rolled = reforge(state).state;
  assert.equal(rolled.totalStones, 2);
  assert.equal(undoPractice(rolled).state.totalStones, 0);
  const restarted = restartPractice(rolled).state;
  assert.equal(restarted.reforgeCount, 0);
  assert.equal(restarted.seed, 'undo');
});

test('batch simulation is deterministic for identical seed and state', () => {
  const state = createPracticeState({ seed: 'batch' });
  const options = { runs: 100, goal: 'gold-2', maxReforges: 250 };
  assert.deepEqual(runBatch(state, options), runBatch(state, options));
});


test('batch supports both auto-lock and never-lock strategies', () => {
  const state = createPracticeState({ seed: 'strategy' });
  const lockGold = runBatch(state, { runs: 25, goal: 'gold-2', strategy: 'lock-gold', maxReforges: 250 });
  const noLock = runBatch(state, { runs: 25, goal: 'gold-2', strategy: 'no-lock', maxReforges: 250 });
  assert.equal(lockGold.strategy, 'lock-gold');
  assert.equal(noLock.strategy, 'no-lock');
  assert.deepEqual(noLock, runBatch(state, { runs: 25, goal: 'gold-2', strategy: 'no-lock', maxReforges: 250 }));
});

test('Practice uses the selected weapon set library instead of generic Set 1 / Set 2', () => {
  assert.deepEqual(attributeList(2, 'gold', 'Cloudsplitter'), ['Set - Flying Fire', 'Set - Startling Thunder']);
  assert.deepEqual(attributeList(2, 'purple', 'Cloudsplitter'), ['Set - Night Mist', 'Set - Bright Sky']);
});

test('matching-set goals recognize real weapon-specific Gold set names', () => {
  const state = createPracticeState({ seed: 'real-sets' });
  state.target.weapon = 'Cloudsplitter';
  for (let index = 0; index < 3; index += 1) {
    state.slots[index].active = true;
    state.slots[index].progress = 100;
    state.slots[index].quality = 'gold';
    state.slots[index].attribute = 'Set - Flying Fire';
  }
  assert.equal(sameGoldSetCount(state), 3);
  assert.equal(goalReached(state, 'set-2'), true);
  assert.equal(goalReached(state, 'set-3'), true);
});

test('active Bright Light follows a verified full matching set and falls back to Sunlight when broken', () => {
  const state = createPracticeState({ seed: 'bright-light' });
  state.target.weapon = 'Cloudsplitter';
  for (let index = 0; index < 5; index += 1) {
    state.slots[index].active = true;
    state.slots[index].progress = 100;
  }
  for (let index = 0; index < 4; index += 1) {
    state.slots[index].quality = 'gold';
    state.slots[index].attribute = 'Set - Flying Fire';
  }
  let normalized = reforge({ ...state, slots: state.slots.map(slot => ({ ...slot, locked: slot.id < 5 })) }).state;
  assert.equal(normalized.slots[4].attribute, 'Set - Flying Fire');

  normalized.slots[3].attribute = 'Set - Startling Thunder';
  normalized = reforge(normalized).state;
  assert.equal(normalized.slots[4].attribute, 'Sunlight');
});
