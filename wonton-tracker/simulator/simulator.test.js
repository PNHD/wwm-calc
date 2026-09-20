import assert from 'node:assert/strict';

await import('./simulator.js');
const sim = globalThis.WontonSimulator;

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

run('community unlock crit model uses 2 / 3.5 / 5 percent tiers', () => {
  assert.equal(sim.activationChance(1), 0.02);
  assert.equal(sim.activationChance(10), 0.02);
  assert.equal(sim.activationChance(11), 0.035);
  assert.equal(sim.activationChance(20), 0.035);
  assert.equal(sim.activationChance(21), 0.05);
  assert.equal(sim.activationChance(29), 0.05);
});

run('fresh simulator starts with only Slot 1 active', () => {
  const state = sim.createInitialState({ seed: 'fresh-start' });
  assert.deepEqual(state.slots.map(slot => slot.active), [true, false, false, false, false]);
  assert.deepEqual(state.slots.map(slot => slot.progress), [100, 0, 0, 0, 0]);
  assert.equal(sim.nextUnlockSlotId(state), 2);
});

run('inactive slots do not reroll or build pity before they unlock', () => {
  const state = sim.createInitialState({ mode: 'official', seed: 'no-early-unlock' });
  state.slots[0].locked = true;

  const probe = sim.createSeededRng('no-early-unlock');
  assert.ok(probe() > sim.activationChance(1), 'chosen seed should not crit Slot 2 on the first unlock attempt');

  const next = sim.reforge(state).state;
  assert.equal(next.slots[1].active, false);
  assert.equal(next.slots[1].pity, 0);
  assert.equal(next.slots[2].active, false);
  assert.equal(next.slots[2].pity, 0);
  assert.equal(next.slots[3].active, false);
  assert.equal(next.slots[3].pity, 0);
  assert.ok(next.slots[1].progress > 0 && next.slots[1].progress < 100);
});

run('next slot is guaranteed to unlock by its 30th activation attempt', () => {
  const state = sim.createInitialState({ mode: 'official', seed: 'unlock-at-30' });
  state.slots[0].locked = true;
  state.slots[1].progress = 96.67;
  state.slots[1].activationAttempts = 29;

  const next = sim.reforge(state);
  assert.equal(next.state.slots[1].active, true);
  assert.equal(next.state.slots[1].progress, 100);
  assert.equal(next.state.slots[1].pity, 0);
  assert.equal(next.event.activation.slot, 2);
  assert.equal(next.event.activation.activated, true);
});

run('only active unlocked slots reroll', () => {
  const state = sim.createInitialState({ mode: 'official', seed: 'active-only' });
  const beforeSlot3 = JSON.parse(JSON.stringify(state.slots[2]));
  const next = sim.reforge(state);
  assert.equal(next.event.changes.every(change => change.slot === 1), true);
  assert.equal(next.state.slots[2].active, false);
  assert.deepEqual(next.state.slots[2], beforeSlot3);
});

run('locked active slots do not change while unlocked active slots reforge', () => {
  const state = sim.createInitialState({ mode: 'official', seed: 'locked-test' });
  state.slots[1].active = true;
  state.slots[1].progress = 100;
  state.slots[0].pity = 10;
  state.slots[1].pity = 10;
  state.slots[0].locked = true;

  const before = JSON.parse(JSON.stringify(state.slots[0]));
  const next = sim.reforge(state);
  assert.deepEqual(next.state.slots[0], before);
  assert.equal(next.state.totalStones, 2);
  assert.equal(next.state.reforgeCount, 1);
});

run('hard pity produces gold and resets pity', () => {
  const state = sim.createInitialState({ mode: 'official', seed: 'hard-pity' });
  state.slots[0].pity = 89;
  const next = sim.reforge(state);
  assert.equal(next.state.slots[0].quality, 'gold');
  assert.equal(next.state.slots[0].pity, 0);
});

run('goal detection supports 2 gold, 3 gold and all four', () => {
  const state = sim.createInitialState();
  state.slots.slice(0, 4).forEach(slot => {
    slot.active = true;
    slot.progress = 100;
    slot.quality = 'blue';
  });
  state.slots[0].quality = 'gold';
  state.slots[1].quality = 'gold';
  assert.equal(sim.goalReached(state, 'gold-2'), true);
  assert.equal(sim.goalReached(state, 'gold-3'), false);
  state.slots[2].quality = 'gold';
  assert.equal(sim.goalReached(state, 'gold-3'), true);
  state.slots[3].quality = 'gold';
  assert.equal(sim.goalReached(state, 'gold-4'), true);
});


run('saved plans snapshot appearance and cap at five', () => {
  let state = sim.createInitialState({ seed: 'plans' });
  state.slots[0].quality = 'gold';
  state.slots[0].attribute = 'Peach Crystal';

  state = sim.savePlan(state).state;
  assert.equal(state.plans.length, 1);
  assert.equal(state.plans[0].name, 'Plan 1');
  assert.equal(state.plans[0].slots[0].quality, 'gold');
  assert.equal(state.plans[0].slots[0].attribute, 'Peach Crystal');

  state.slots[0].quality = 'blue';
  assert.equal(state.plans[0].slots[0].quality, 'gold', 'saved snapshot must not mutate with live state');

  for (let i = 0; i < 8; i += 1) state = sim.savePlan(state).state;
  assert.equal(state.plans.length, 5);
});

run('applying a saved plan restores appearance without changing progression or cost', () => {
  let state = sim.createInitialState({ seed: 'apply-plan' });
  state.slots[1].active = true;
  state.slots[1].progress = 100;
  state.slots[0].quality = 'gold';
  state.slots[0].attribute = 'Peach Crystal';
  state.slots[1].quality = 'purple';
  state.slots[1].attribute = 'Set 2';
  state = sim.savePlan(state, 'Gold + Purple').state;

  state.slots[0].quality = 'blue';
  state.slots[0].attribute = 'Rouge';
  state.slots[0].pity = 47;
  state.slots[0].locked = true;
  state.slots[1].quality = 'blue';
  state.slots[1].attribute = 'Set 1';
  state.slots[1].pity = 18;
  state.totalStones = 22;
  state.reforgeCount = 13;
  const beforeProgress = state.slots[1].progress;
  const planId = state.plans[0].id;

  const applied = sim.applyPlan(state, planId);
  assert.equal(applied.applied, true);
  state = applied.state;
  assert.equal(state.slots[0].quality, 'gold');
  assert.equal(state.slots[0].attribute, 'Peach Crystal');
  assert.equal(state.slots[1].quality, 'purple');
  assert.equal(state.slots[1].attribute, 'Set 2');
  assert.equal(state.slots[0].pity, 47);
  assert.equal(state.slots[1].pity, 18);
  assert.equal(state.slots[0].locked, true);
  assert.equal(state.slots[1].progress, beforeProgress);
  assert.equal(state.totalStones, 22);
  assert.equal(state.reforgeCount, 13);
});

run('applying a plan never skips sequential unlock progression', () => {
  let future = sim.createInitialState({ seed: 'future-plan' });
  future.slots[1].active = true;
  future.slots[1].progress = 100;
  future.slots[1].quality = 'gold';
  future.slots[1].attribute = 'Set 2';
  future = sim.savePlan(future, 'Future').state;

  let current = sim.createInitialState({ seed: 'current-progress' });
  current.plans = future.plans;
  const applied = sim.applyPlan(current, future.plans[0].id).state;

  assert.equal(applied.slots[0].active, true);
  assert.equal(applied.slots[1].active, false);
  assert.equal(applied.slots[1].pity, 0);
  assert.equal(sim.nextUnlockSlotId(applied), 2);
});

run('saved plans can be deleted without changing the live roll state', () => {
  let state = sim.createInitialState({ seed: 'delete-plan' });
  state.slots[0].pity = 12;
  state.totalStones = 4;
  state = sim.savePlan(state, 'Keep').state;
  const planId = state.plans[0].id;

  state = sim.deletePlan(state, planId).state;
  assert.equal(state.plans.length, 0);
  assert.equal(state.slots[0].pity, 12);
  assert.equal(state.totalStones, 4);
});

run('batch simulator remains deterministic with sequential unlocking', () => {
  const setup = sim.createInitialState({ mode: 'official', seed: 'batch-seed' });
  const resultA = sim.runBatch(setup, { runs: 25, goal: 'gold-2', maxReforges: 250 });
  const resultB = sim.runBatch(setup, { runs: 25, goal: 'gold-2', maxReforges: 250 });
  assert.deepEqual(resultA, resultB);
  assert.equal(resultA.runs, 25);
  assert.ok(resultA.successRate >= 0 && resultA.successRate <= 1);
  assert.ok(resultA.averageReforges >= 0);
  assert.ok(resultA.averageStones >= 0);
});

run('simulator v2 storage is isolated from tracker and old broken simulator state', () => {
  assert.equal(sim.STORAGE_KEY, 'wontonSimulatorState.v2');
  assert.notEqual(sim.STORAGE_KEY, 'wontonSimulatorState.v1');
  assert.notEqual(sim.STORAGE_KEY, 'weaponState');
});
