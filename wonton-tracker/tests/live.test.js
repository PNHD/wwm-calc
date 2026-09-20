import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLiveState, observedStats, recordActualReforge, recordActualResult,
  recordEarlyUnlock, recordObservedGold, undoLive
} from '../core/live.js';

test('recording a Live reforge never invokes RNG', () => {
  const original = Math.random;
  Math.random = () => { throw new Error('RNG invoked'); };
  try {
    const result = recordActualReforge(createLiveState());
    assert.equal(result.state.reforgeCount, 1);
    assert.equal(result.state.slots[0].attribute, 'Set 1');
  } finally { Math.random = original; }
});

test('only active unlocked pity increments and cost respects locks', () => {
  const state = createLiveState();
  state.slots[1].active = true;
  state.slots[1].progress = 100;
  state.slots[0].locked = true;
  const result = recordActualReforge(state).state;
  assert.equal(result.slots[0].pity, 0, 'locked pity');
  assert.equal(result.slots[1].pity, 1, 'active unlocked pity');
  assert.equal(result.slots[2].pity, 0, 'inactive pity');
  assert.equal(result.totalStones, 2);
});

test('quick Gold marking resets only selected slot and keeps the current roll open for another hit', () => {
  const state = createLiveState();
  state.slots[1].active = true;
  state.slots[1].progress = 100;
  state.slots[0].pity = 20;
  state.slots[1].pity = 40;

  let recorded = recordActualReforge(state).state;
  recorded = recordObservedGold(recorded, [2]).state;
  assert.equal(recorded.slots[0].pity, 21);
  assert.equal(recorded.slots[1].pity, 0);
  assert.deepEqual(recorded.observedGoldIntervals[2], [41]);
  assert.deepEqual(recorded.pendingResult.goldSlots, [2]);

  recorded = recordObservedGold(recorded, [1]).state;
  assert.equal(recorded.slots[0].pity, 0);
  assert.deepEqual(recorded.observedGoldIntervals[1], [21]);
  assert.deepEqual(recorded.pendingResult.goldSlots, [2, 1]);
});

test('quick Gold marking ignores locked and inactive slots and cannot double-count the same roll', () => {
  const state = createLiveState();
  state.slots[1].active = true;
  state.slots[1].progress = 100;
  state.slots[0].locked = true;
  let recorded = recordActualReforge(state).state;

  recorded = recordObservedGold(recorded, [1, 2, 3]).state;
  assert.equal(recorded.observedGoldIntervals[1].length, 0);
  assert.equal(recorded.observedGoldIntervals[2].length, 1);
  assert.equal(recorded.observedGoldIntervals[3].length, 0);

  recorded = recordObservedGold(recorded, [2]).state;
  assert.equal(recorded.observedGoldIntervals[2].length, 1);
});

test('sequential unlock starts new pity at zero and does not require a result form every roll', () => {
  let state = createLiveState();
  for (let target = 2; target <= 5; target += 1) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      state = recordActualReforge(state).state;
    }
    assert.equal(state.slots[target - 1].active, true);
    assert.equal(state.slots[target - 1].pity, 0);
  }
  assert.equal(state.slots[4].quality, 'gold');
  assert.equal(state.slots[4].attribute, 'Sunlight');
  assert.equal(state.slots[4].locked, true);
});

test('quick early-unlock action activates only the next slot and only once for the roll', () => {
  let state = recordActualReforge(createLiveState()).state;
  state = recordEarlyUnlock(state).state;
  state = recordEarlyUnlock(state).state;
  assert.deepEqual(state.slots.map(slot => slot.active), [true, true, false, false, false]);
  assert.equal(state.slots[1].pity, 0);
  assert.equal(state.pendingResult.activatedSlot, 2);
});

test('a full-progress activation cannot also early-unlock the following slot on the same reforge', () => {
  const state = createLiveState();
  state.slots[1].activationAttempts = 29;
  state.slots[1].progress = 96.67;
  const recorded = recordActualReforge(state).state;
  assert.equal(recorded.pendingResult.activatedSlot, 2);
  const result = recordEarlyUnlock(recorded).state;
  assert.deepEqual(result.slots.map(slot => slot.active), [true, true, false, false, false]);
});

test('undo restores the state before the last recorded reforge', () => {
  const before = createLiveState();
  const after = recordActualReforge(before).state;
  const undone = undoLive(after);
  assert.equal(undone.undone, true);
  assert.equal(undone.state.reforgeCount, 0);
  assert.equal(undone.state.totalStones, 0);
  assert.equal(undone.state.slots[0].pity, 0);
});

test('observed interval analytics calculate average and median', () => {
  assert.deepEqual(observedStats([20, 40, 30, 10]), { count: 4, average: 25, median: 25 });
  assert.deepEqual(observedStats([]), { count: 0, average: null, median: null });
});


test('another reforge can be logged without resolving a no-special-result modal', () => {
  let state = createLiveState();
  state = recordActualReforge(state).state;
  state = recordActualReforge(state).state;
  assert.equal(state.reforgeCount, 2);
  assert.equal(state.slots[0].pity, 2);
  assert.equal(state.pendingResult.roll, 2);
});


test('optional detail save does not double-count a Gold already marked by quick action', () => {
  const state = createLiveState();
  state.slots[0].pity = 34;
  let recorded = recordActualReforge(state).state;
  recorded = recordObservedGold(recorded, [1]).state;

  const detailed = recordActualResult(recorded, {
    goldSlots: [1],
    changes: [{ slotId: 1, quality: 'gold', attribute: 'Pearl' }]
  }).state;

  assert.deepEqual(detailed.observedGoldIntervals[1], [35]);
  assert.equal(detailed.slots[0].pity, 0);
  assert.equal(detailed.slots[0].quality, 'gold');
  assert.equal(detailed.slots[0].attribute, 'Pearl');
  assert.equal(detailed.pendingResult, null);
});
