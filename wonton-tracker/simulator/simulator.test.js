const assert = require('node:assert/strict');
const sim = require('./simulator.js');

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run('lock costs are 1 / 2 / 5 / 10 stones', () => {
  assert.deepEqual([0, 1, 2, 3].map(sim.costForLocks), [1, 2, 5, 10]);
});

run('official mode keeps 82/15/3 until hard pity 90', () => {
  assert.deepEqual(sim.qualityRates('official', 1), { blue: 0.82, purple: 0.15, gold: 0.03 });
  assert.deepEqual(sim.qualityRates('official', 89), { blue: 0.82, purple: 0.15, gold: 0.03 });
  assert.deepEqual(sim.qualityRates('official', 90), { blue: 0, purple: 0, gold: 1 });
});

run('community mode uses 3/4/5 percent gold soft tiers', () => {
  assert.equal(sim.qualityRates('community', 30).gold, 0.03);
  assert.equal(sim.qualityRates('community', 31).gold, 0.04);
  assert.equal(sim.qualityRates('community', 60).gold, 0.04);
  assert.equal(sim.qualityRates('community', 61).gold, 0.05);
  assert.equal(sim.qualityRates('community', 90).gold, 1);
});

run('pity is clamped to 0..90', () => {
  assert.equal(sim.clampPity(-5), 0);
  assert.equal(sim.clampPity(52.9), 52);
  assert.equal(sim.clampPity(999), 90);
});

run('seeded RNG is deterministic', () => {
  const a = sim.createSeededRng('practice-42');
  const b = sim.createSeededRng('practice-42');
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

run('locked slots do not change while unlocked slots reforge', () => {
  const state = sim.createInitialState({ mode: 'official', seed: 'locked-test' });
  state.slots.forEach((slot, index) => {
    slot.active = index < 4;
    slot.pity = 10;
  });
  state.slots[0].locked = true;
  const before = JSON.parse(JSON.stringify(state.slots[0]));
  const next = sim.reforge(state);
  assert.deepEqual(next.state.slots[0], before);
  assert.equal(next.state.totalStones, 2);
  assert.equal(next.state.reforgeCount, 1);
});

run('hard pity produces gold and resets pity', () => {
  const state = sim.createInitialState({ mode: 'official', seed: 'hard-pity' });
  state.slots.forEach(slot => { slot.active = false; });
  state.slots[0].active = true;
  state.slots[0].pity = 89;
  const next = sim.reforge(state);
  assert.equal(next.state.slots[0].quality, 'gold');
  assert.equal(next.state.slots[0].pity, 0);
});

run('goal detection supports 2 gold, 3 gold and all four', () => {
  const state = sim.createInitialState();
  state.slots.slice(0, 4).forEach(slot => { slot.active = true; slot.quality = 'blue'; });
  state.slots[0].quality = 'gold';
  state.slots[1].quality = 'gold';
  assert.equal(sim.goalReached(state, 'gold-2'), true);
  assert.equal(sim.goalReached(state, 'gold-3'), false);
  state.slots[2].quality = 'gold';
  assert.equal(sim.goalReached(state, 'gold-3'), true);
  state.slots[3].quality = 'gold';
  assert.equal(sim.goalReached(state, 'gold-4'), true);
});

run('batch simulator returns deterministic aggregate metrics', () => {
  const setup = sim.createInitialState({ mode: 'official', seed: 'batch-seed' });
  setup.slots.slice(0, 4).forEach(slot => { slot.active = true; slot.pity = 0; });
  const resultA = sim.runBatch(setup, { runs: 25, goal: 'gold-2', maxReforges: 250 });
  const resultB = sim.runBatch(setup, { runs: 25, goal: 'gold-2', maxReforges: 250 });
  assert.deepEqual(resultA, resultB);
  assert.equal(resultA.runs, 25);
  assert.ok(resultA.successRate >= 0 && resultA.successRate <= 1);
  assert.ok(resultA.averageReforges >= 0);
  assert.ok(resultA.averageStones >= 0);
});

run('simulator storage key is isolated from real tracker state', () => {
  assert.equal(sim.STORAGE_KEY, 'wontonSimulatorState.v1');
  assert.notEqual(sim.STORAGE_KEY, 'weaponState');
});
