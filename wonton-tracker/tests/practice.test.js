import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPracticeState, createSeededRng, qualityRates, reforge, restartPractice,
  runBatch, undoPractice
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

