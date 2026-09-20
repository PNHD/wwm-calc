import test from 'node:test';
import assert from 'node:assert/strict';
import { beadsForStones, costForLocks } from '../core/common.js';
import { createLiveState } from '../core/live.js';
import { applyPlan, deletePlan, renamePlan, savePlan, targetMatch } from '../core/plans.js';
import { budgetSummary, packageReferenceFor } from '../core/pricing.js';

test('lock costs are exactly 1 / 2 / 5 / 10', () => {
  assert.deepEqual([0, 1, 2, 3].map(costForLocks), [1, 2, 5, 10]);
});

test('Taiyi Stones convert to 200 Echo Beads each', () => {
  assert.equal(beadsForStones(1), 200);
  assert.equal(beadsForStones(10), 2000);
});

test('plans cap at five and support rename/delete', () => {
  let state = createLiveState();
  for (let index = 0; index < 7; index += 1) state = savePlan(state).state;
  assert.equal(state.plans.length, 5);
  state = renamePlan(state, state.plans[0].id, '<b>Observed</b>').state;
  assert.equal(state.plans[0].name, '<b>Observed</b>');
  state = deletePlan(state, state.plans[0].id).state;
  assert.equal(state.plans.length, 4);
});

test('plan apply changes appearance only on compatible active slots', () => {
  let state = createLiveState();
  state.slots[1].active = true;
  state.slots[1].progress = 100;
  state.slots[0].quality = 'gold';
  state.slots[0].attribute = 'Peach Crystal';
  state.slots[1].quality = 'purple';
  state.slots[1].attribute = 'Set 2';
  state = savePlan(state, 'Appearance').state;

  state.slots[0].quality = 'blue';
  state.slots[0].attribute = 'Rouge';
  state.slots[0].pity = 47;
  state.slots[0].locked = true;
  state.slots[1].active = false;
  state.slots[1].progress = 44;
  state.totalStones = 22;
  state.reforgeCount = 13;
  const planId = state.plans[0].id;
  state = applyPlan(state, planId).state;

  assert.equal(state.slots[0].quality, 'gold');
  assert.equal(state.slots[0].attribute, 'Peach Crystal');
  assert.equal(state.slots[0].pity, 47);
  assert.equal(state.slots[0].locked, true);
  assert.equal(state.slots[1].active, false, 'plan must not activate an unopened slot');
  assert.equal(state.slots[1].progress, 44);
  assert.equal(state.totalStones, 22);
  assert.equal(state.reforgeCount, 13);
});

test('budget arithmetic is resource-first', () => {
  const state = createLiveState();
  state.totalStones = 2;
  state.budget.startingStones = 5;
  state.budget.startingBeads = 200;
  state.budget.baseWeaponBeads = 100;
  const summary = budgetSummary(state);
  assert.equal(summary.spentBeads, 500);
  assert.equal(summary.remainingBeads, 700);
  assert.equal(summary.nextStones, 1);
});

test('target matching preserves slot positions when earlier targets are omitted', () => {
  const state = createLiveState();
  state.slots[1].active = true;
  state.slots[1].attribute = 'Set 2';
  assert.deepEqual(targetMatch(state.slots, { color: '', part1: 'Set 2' }), {
    matches: 1, total: 1, label: '1/1 target parts match'
  });
});


test('regional package references change the monetary estimate while bead math stays fixed', () => {
  const state = createLiveState();
  state.totalStones = 36;
  state.budget.region = 'Japan';
  const summary = budgetSummary(state);
  assert.equal(summary.spentBeads, 7200);
  assert.equal(summary.referenceCurrency, 'JPY');
  assert.equal(summary.approximateRegional, 15000);
  assert.equal(packageReferenceFor('United States').price, 99.99);
  assert.equal(packageReferenceFor('Other / custom'), null);
});

test('restoring a snapshot overwrites locked-slot appearance but preserves the lock and pity', () => {
  let state = createLiveState();

  // Plan A: Slot 1 Gold, Slot 2 not yet active.
  state.slots[0].quality = 'gold';
  state.slots[0].attribute = 'Peach Crystal';
  state = savePlan(state, 'Plan A').state;
  const planA = state.plans[0].id;

  // Current state later has Slot 2 active and Gold. Slot 1 is locked.
  state.slots[0].quality = 'blue';
  state.slots[0].attribute = 'Ink Dust';
  state.slots[0].locked = true;
  state.slots[0].pity = 31;
  state.slots[1].active = true;
  state.slots[1].progress = 100;
  state.slots[1].quality = 'gold';
  state.slots[1].attribute = 'Set 1';

  state = applyPlan(state, planA).state;

  assert.equal(state.slots[0].quality, 'gold');
  assert.equal(state.slots[0].attribute, 'Peach Crystal');
  assert.equal(state.slots[0].locked, true, 'restore keeps the current lock state');
  assert.equal(state.slots[0].pity, 31, 'restore keeps the current visible pity');
  assert.equal(state.slots[1].quality, 'gold', 'saved inactive slot leaves the current slot untouched');
  assert.equal(state.slots[1].attribute, 'Set 1');
});

test('restoring a later snapshot can replace the appearance of a currently locked Gold slot', () => {
  let state = createLiveState();
  state.slots[1].active = true;
  state.slots[1].progress = 100;

  // Plan B: S1 Blue, S2 Gold.
  state.slots[0].quality = 'blue';
  state.slots[0].attribute = 'Ink Dust';
  state.slots[1].quality = 'gold';
  state.slots[1].attribute = 'Set 1';
  state = savePlan(state, 'Plan B').state;
  const planB = state.plans[0].id;

  // Before restore, S1 is Gold and locked.
  state.slots[0].quality = 'gold';
  state.slots[0].attribute = 'Peach Crystal';
  state.slots[0].locked = true;
  state.slots[0].pity = 22;

  state = applyPlan(state, planB).state;

  assert.equal(state.slots[0].quality, 'blue', 'snapshot appearance overwrites the locked slot');
  assert.equal(state.slots[0].attribute, 'Ink Dust');
  assert.equal(state.slots[0].locked, true, 'the lock itself remains enabled');
  assert.equal(state.slots[0].pity, 22, 'visible pity remains unchanged');
  assert.equal(state.slots[1].quality, 'gold');
});
