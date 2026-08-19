const ARENA_MODES = new Set(["1V1_ARENA", "3V3_ARENA", "GROUP_STRATEGY", "5V5_ARENA", "PERCEPTION_FOREST", "TRAINING_TERRACE"]);
const GVG_PHASES = new Set(["PREPARATION", "OPENING", "LANE_RESOURCE_CONTROL", "OUTPOST_PHASE", "HALFTIME", "BULWARK_PRESSURE", "GOOSE_PRESSURE", "FORTUNE_TREE_ESCORT", "ENDGAME"]);
const OBJECTIVE_IDS = new Set(["TOP_OUTPOST", "BOTTOM_OUTPOST", "JUNGLE", "BULWARK", "GOOSE", "FORTUNE_TREE", "FALLBACK"]);
const FORBIDDEN = new Set(["__proto__", "prototype", "constructor"]);
const GVG_RECOVERY_SUFFIX = "__recovery_backup_v1";
let gvgStorageRecovery = "";

export const ARENA_MODE_STORAGE_KEY = "wwm_arena_mode_v2";
export const GVG_PHASE_STORAGE_KEY = "wwm_gvg_phase_v2";
export const GVG_ASSIGNMENTS_STORAGE_KEY = "wwm_gvg_v2_assignments";
export const GVG_MANUAL_STORAGE_KEY = "wwm_gvg_v2_manual";

function getStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function readText(key, storage) {
  try { return getStorage(storage)?.getItem(key) ?? null; } catch { return null; }
}

function writeText(key, value, storage) {
  try { getStorage(storage)?.setItem(key, value); return true; } catch { return false; }
}

function preserveGvgBackup(key, raw, storage) {
  try { if (raw && raw.length <= 128 * 1024) getStorage(storage)?.setItem(`${key}${GVG_RECOVERY_SUFFIX}`, raw); } catch {}
}
function recoverGvgKey(key, raw, storage, reason) {
  preserveGvgBackup(key, raw, storage);
  gvgStorageRecovery ||= `Saved Guild War ${reason} was reset safely; a bounded recovery backup is available when possible.`;
}
export function consumeGvgStorageRecovery() { const message = gvgStorageRecovery; gvgStorageRecovery = ""; return message; }

function parseSmallObject(raw, maxChars = 8192) {
  if (!raw || raw.length > maxChars) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null;
    if (Object.keys(value).some((key) => FORBIDDEN.has(key))) return null;
    return value;
  } catch { return null; }
}

export function sanitizeArenaModeV2(value, fallback = "1V1_ARENA") {
  return ARENA_MODES.has(value) ? value : ARENA_MODES.has(fallback) ? fallback : "1V1_ARENA";
}

export function loadArenaModeV2(fallback = "1V1_ARENA", storage) {
  return sanitizeArenaModeV2(readText("wwm_arena_mode_v2", storage), fallback);
}

export function saveArenaModeV2(value, storage) {
  const safe = sanitizeArenaModeV2(value);
  writeText("wwm_arena_mode_v2", safe, storage);
  return safe;
}

export function sanitizeGvgPhaseV2(value) {
  return GVG_PHASES.has(value) ? value : "PREPARATION";
}

export function loadGvgPhaseV2(storage) {
  const raw = readText("wwm_gvg_phase_v2", storage);
  if (raw == null) return "PREPARATION";
  if (!GVG_PHASES.has(raw)) { recoverGvgKey(GVG_PHASE_STORAGE_KEY, raw, storage, "phase"); return "PREPARATION"; }
  return raw;
}

export function saveGvgPhaseV2(value, storage) {
  const safe = sanitizeGvgPhaseV2(value);
  writeText("wwm_gvg_phase_v2", safe, storage);
  return safe;
}

export function sanitizeGvgAssignmentsV2(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return {};
  const result = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!OBJECTIVE_IDS.has(key) || FORBIDDEN.has(key) || typeof raw !== "string") continue;
    const label = raw.replace(/[<>]/g, "").trim().slice(0, 80);
    if (label) result[key] = label;
  }
  return result;
}

export function loadGvgAssignmentsV2(storage) {
  const raw = readText(GVG_ASSIGNMENTS_STORAGE_KEY, storage);
  const parsed = parseSmallObject(raw, 4096);
  if (raw != null && !parsed) recoverGvgKey(GVG_ASSIGNMENTS_STORAGE_KEY, raw, storage, "objective assignments");
  return sanitizeGvgAssignmentsV2(parsed);
}

export function saveGvgAssignmentsV2(value, storage) {
  const safe = sanitizeGvgAssignmentsV2(value);
  writeText("wwm_gvg_v2_assignments", JSON.stringify(safe), storage);
  return safe;
}

export function sanitizeGvgManualV2(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return {};
  const result = {};
  const trigger = value.halftimeTrigger;
  if (trigger !== "" && trigger != null) {
    const number = Number(trigger);
    if (Number.isFinite(number) && number >= 0 && number <= 3600) result.halftimeTrigger = Math.round(number);
  }
  return result;
}

export function loadGvgManualV2(storage) {
  const raw = readText(GVG_MANUAL_STORAGE_KEY, storage);
  const parsed = parseSmallObject(raw, 2048);
  if (raw != null && !parsed) recoverGvgKey(GVG_MANUAL_STORAGE_KEY, raw, storage, "manual overrides");
  return sanitizeGvgManualV2(parsed);
}

export function saveGvgManualV2(value, storage) {
  const safe = sanitizeGvgManualV2(value);
  writeText("wwm_gvg_v2_manual", JSON.stringify(safe), storage);
  return safe;
}
