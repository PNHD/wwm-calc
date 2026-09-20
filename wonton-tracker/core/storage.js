import { SCHEMA_VERSION, clone, safeText } from './common.js';
import { createLiveState, LIVE_STORAGE_KEY, normalizeLiveState } from './live.js';
import { PRACTICE_STORAGE_KEY, createPracticeState, normalizePracticeState } from './practice.js';

export const LEGACY_LIVE_KEY = 'wonton-tracker-state-v1';
export const PREVIOUS_PRACTICE_KEY = 'wontonReforgeLab.practice.v2';
export const LEGACY_PRACTICE_KEY = 'wontonSimulatorState.v2';
export const LEGACY_BASELINE_KEY = 'wontonSimulatorBaseline.v2';
export const BACKUP_SCHEMA = 'wonton-reforge-lab';

function parseObject(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

function trackerPlan(scheme, index) {
  return {
    id: Number.isInteger(scheme?.id) && scheme.id > 0 ? scheme.id : index + 1,
    name: safeText(scheme?.name, `Plan ${index + 1}`, 80),
    savedAt: safeText(scheme?.timestamp, '', 40),
    slots: (Array.isArray(scheme?.holes) ? scheme.holes : []).map((hole, slotIndex) => ({
      id: slotIndex + 1,
      active: slotIndex === 0 || !!hole?.active,
      quality: hole?.quality,
      attribute: safeText(hole?.attribute, slotIndex === 4 ? 'Sunlight' : 'Set 1', 80)
    }))
  };
}

export function migrateLegacyLive(value) {
  if (!value || !Array.isArray(value.holes)) throw new Error('Legacy Live state is malformed.');
  const state = createLiveState();
  state.slots = value.holes.map((hole, index) => ({
    id: index + 1,
    active: index === 0 || !!hole?.active,
    quality: hole?.quality,
    attribute: hole?.attribute,
    locked: !!hole?.locked,
    pity: hole?.guaranteeCounter,
    progress: hole?.progress,
    activationAttempts: hole?.activationAttempts
  }));
  state.totalStones = value.totalStones;
  state.reforgeCount = value.reforgeCount;
  state.history = Array.isArray(value.history) ? value.history : [];
  state.plans = (Array.isArray(value.schemes) ? value.schemes : []).map(trackerPlan);
  return normalizeLiveState(state);
}

export function migrateLegacyPractice(value, baselineValue) {
  if (!value || !Array.isArray(value.slots)) throw new Error('Legacy Practice state is malformed.');
  const old = normalizePracticeState(value);
  const fresh = createPracticeState({ mode: old.mode, seed: old.seed });
  fresh.plans = clone(old.plans);
  fresh.target = clone(old.target);
  fresh.budget = clone(old.budget);
  fresh.goals = clone(old.goals);
  fresh.batchHistory = clone(old.batchHistory);
  return normalizePracticeState(fresh);
}

export function repairPreviousPractice(value) {
  if (!value || !Array.isArray(value.slots)) throw new Error('Previous Practice state is malformed.');
  return migrateLegacyPractice(value, null);
}

function loadCurrent(storage, key, normalize) {
  const parsed = parseObject(storage.getItem(key));
  if (!parsed) return null;
  try { return normalize(parsed); } catch { return null; }
}

export function migrateStorage(storage) {
  const report = { live: 'default', practice: 'default', errors: [] };
  let live = loadCurrent(storage, LIVE_STORAGE_KEY, normalizeLiveState);
  let practice = loadCurrent(storage, PRACTICE_STORAGE_KEY, normalizePracticeState);

  if (live) report.live = 'current';
  else {
    const legacy = parseObject(storage.getItem(LEGACY_LIVE_KEY));
    if (legacy) {
      try {
        live = migrateLegacyLive(legacy);
        storage.setItem(LIVE_STORAGE_KEY, JSON.stringify(live));
        report.live = 'migrated';
      } catch (error) { report.errors.push(`Live: ${error.message}`); }
    }
  }

  if (practice) report.practice = 'current';
  else {
    const previous = parseObject(storage.getItem(PREVIOUS_PRACTICE_KEY));
    if (previous) {
      try {
        practice = repairPreviousPractice(previous);
        storage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(practice));
        report.practice = 'repaired';
      } catch (error) { report.errors.push(`Practice: ${error.message}`); }
    } else {
      const legacy = parseObject(storage.getItem(LEGACY_PRACTICE_KEY));
      const baseline = parseObject(storage.getItem(LEGACY_BASELINE_KEY));
      if (legacy) {
        try {
          practice = migrateLegacyPractice(legacy, baseline);
          storage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(practice));
          report.practice = 'migrated';
        } catch (error) { report.errors.push(`Practice: ${error.message}`); }
      }
    }
  }

  return { live: live || createLiveState(), practice: practice || createPracticeState(), report };
}

export function persistState(storage, mode, state) {
  const key = mode === 'practice' ? PRACTICE_STORAGE_KEY : LIVE_STORAGE_KEY;
  const normalized = mode === 'practice' ? normalizePracticeState(state) : normalizeLiveState(state);
  storage.setItem(key, JSON.stringify(normalized));
  return normalized;
}

export function exportBackup(mode, state) {
  const normalized = mode === 'practice' ? normalizePracticeState(state) : normalizeLiveState(state);
  return JSON.stringify({ schema: BACKUP_SCHEMA, version: SCHEMA_VERSION, mode, exportedAt: new Date().toISOString(), state: normalized }, null, 2);
}

export function importBackup(text, expectedMode) {
  let backup;
  try { backup = JSON.parse(String(text)); } catch { throw new Error('Invalid JSON backup.'); }
  if (!backup || backup.schema !== BACKUP_SCHEMA) throw new Error('Unsupported backup schema.');
  if (backup.version !== SCHEMA_VERSION) throw new Error(`Unsupported backup version: ${String(backup.version)}.`);
  if (!['live', 'practice'].includes(backup.mode)) throw new Error('Backup mode is invalid.');
  if (expectedMode && backup.mode !== expectedMode) throw new Error(`This is a ${backup.mode} backup, not ${expectedMode}.`);
  if (!backup.state || typeof backup.state !== 'object') throw new Error('Backup state is missing.');
  return backup.mode === 'practice' ? normalizePracticeState(backup.state) : normalizeLiveState(backup.state);
}

export function exportText(mode, state) {
  const normalized = mode === 'practice' ? normalizePracticeState(state) : normalizeLiveState(state);
  const lines = [
    `Wonton Reforge Lab v2 — ${mode === 'practice' ? 'Practice' : 'Live Tracker'}`,
    `Exported: ${new Date().toISOString()}`,
    `Reforges: ${normalized.reforgeCount}`,
    `Taiyi Stones used: ${normalized.totalStones}`,
    '',
    ...normalized.slots.map(slot => `Slot ${slot.id}: ${slot.active ? `${slot.quality} · ${slot.attribute}` : 'inactive'} | pity ${slot.pity}/90 | progress ${slot.progress}% | locked ${slot.locked ? 'yes' : 'no'}`),
    '', 'History:',
    ...normalized.history.slice().reverse().map(event => `${event.at || ''} ${event.text || `Roll ${event.roll || ''}`}`.trim())
  ];
  return lines.join('\n');
}
