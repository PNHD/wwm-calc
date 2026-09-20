import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../core/common.js';
import { createLiveState, LIVE_STORAGE_KEY } from '../core/live.js';
import { PRACTICE_STORAGE_KEY, createPracticeState } from '../core/practice.js';
import {
  BACKUP_SCHEMA, LEGACY_BASELINE_KEY, LEGACY_LIVE_KEY, LEGACY_PRACTICE_KEY,
  exportBackup, importBackup, migrateStorage
} from '../core/storage.js';

class MemoryStorage {
  constructor(entries = {}) { this.values = new Map(Object.entries(entries)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

test('legacy Live and Practice states migrate separately and idempotently', () => {
  const legacyLive = { holes: [
    { active: true, quality: 'gold', attribute: 'Peach Crystal', guaranteeCounter: 12, progress: 100, locked: false },
    ...[2,3,4,5].map(id => ({ id, active: false, quality: id === 5 ? 'gold' : 'blue', attribute: id === 5 ? 'Sunlight' : 'Set 1', guaranteeCounter: 0, progress: 0, locked: false }))
  ], totalStones: 9, reforgeCount: 4, history: [], schemes: [] };
  const legacyPractice = { version: 2, mode: 'official', seed: 'old-seed', slots: [
    { id: 1, active: true, quality: 'purple', attribute: 'Set 1', locked: false, pity: 7, progress: 100, activationAttempts: 0 },
    ...[2,3,4,5].map(id => ({ id, active: false, quality: id === 5 ? 'gold' : 'blue', attribute: id === 5 ? 'Sunlight' : 'Set 1', locked: false, pity: 0, progress: 0, activationAttempts: 0 }))
  ], totalStones: 3, reforgeCount: 2, history: [], plans: [] };
  const storage = new MemoryStorage({
    [LEGACY_LIVE_KEY]: JSON.stringify(legacyLive),
    [LEGACY_PRACTICE_KEY]: JSON.stringify(legacyPractice),
    [LEGACY_BASELINE_KEY]: JSON.stringify(legacyPractice.slots)
  });
  const first = migrateStorage(storage);
  assert.equal(first.report.live, 'migrated');
  assert.equal(first.report.practice, 'migrated');
  assert.equal(first.live.totalStones, 9);
  assert.equal(first.practice.seed, 'old-seed');
  assert.ok(storage.getItem(LEGACY_LIVE_KEY), 'old Live key retained');
  assert.ok(storage.getItem(LEGACY_PRACTICE_KEY), 'old Practice key retained');
  assert.ok(storage.getItem(LIVE_STORAGE_KEY));
  assert.ok(storage.getItem(PRACTICE_STORAGE_KEY));
  const second = migrateStorage(storage);
  assert.equal(second.report.live, 'current');
  assert.equal(second.report.practice, 'current');
});

test('corrupted legacy state fails safely without deletion', () => {
  const storage = new MemoryStorage({ [LEGACY_LIVE_KEY]: '{bad json' });
  const result = migrateStorage(storage);
  assert.equal(result.live.reforgeCount, 0);
  assert.equal(storage.getItem(LEGACY_LIVE_KEY), '{bad json');
  assert.equal(storage.getItem(LIVE_STORAGE_KEY), null);
});

test('invalid JSON and unsupported backup schema/version are rejected', () => {
  assert.throws(() => importBackup('{bad', 'live'), /Invalid JSON/);
  assert.throws(() => importBackup(JSON.stringify({ schema: 'other', version: 2 }), 'live'), /Unsupported backup schema/);
  assert.throws(() => importBackup(JSON.stringify({ schema: BACKUP_SCHEMA, version: 99, mode: 'live', state: {} }), 'live'), /Unsupported backup version/);
});

test('imported strings remain inert and are escaped before HTML rendering', () => {
  const state = createLiveState();
  state.plans = [{ id: 1, name: '<img src=x onerror=alert(1)>', savedAt: '', slots: state.slots }];
  const imported = importBackup(exportBackup('live', state), 'live');
  assert.equal(imported.plans[0].name, '<img src=x onerror=alert(1)>');
  assert.equal(escapeHtml(imported.plans[0].name), '&lt;img src=x onerror=alert(1)&gt;');
});


test('Practice import normalizes untrusted history cost before rendering', () => {
  const state = createPracticeState({ seed: 'import-safety' });
  state.history = [{
    roll: 1,
    cost: '<img src=x onerror=alert(1)>',
    changes: [],
    activation: null,
    hasGold: false,
    at: '<script>alert(1)</script>'
  }];
  const imported = importBackup(exportBackup('practice', state), 'practice');
  assert.equal(imported.history[0].cost, 0);
  assert.equal(imported.history[0].at, '<script>alert(1)</script>');
});