export const STORAGE_RECOVERY_SCHEMA = 1;
export const MAX_RECOVERY_BACKUP_CHARS = 128 * 1024;

export const STORAGE_REGISTRY = Object.freeze([
  { key: "wwm_product_shell_v2", owner: "GLOBAL", schemaVersion: 2, migration: "tolerant shell defaults", fallback: "workspace shell defaults", size: "small", corruption: "reset shell only" },
  { key: "wwm_uid", owner: "GLOBAL", schemaVersion: 1, migration: "verified {uid,name,server} access-gate record", fallback: "prompt for Player ID again", size: "tiny", corruption: "UID gate only; never clear gameplay data" },
  { key: "wwm_selected_build", owner: "PVE", schemaVersion: 1, migration: "allowlisted build fallback", fallback: "Bamboocut-Dust", size: "tiny", corruption: "reset selected build only" },
  { key: "wwm_chars_v3", owner: "PVE", schemaVersion: 3, migration: "sanitizeChars", fallback: "factory character/scheme", size: "medium-large", corruption: "bounded PvE recovery" },
  { key: "wwm_t91_custom_config", owner: "PVE", schemaVersion: 1, migration: "legacy tolerant", fallback: "factory panel defaults", size: "small", corruption: "ignore config only" },
  { key: "wwm_t91_profiles", owner: "PVE", schemaVersion: 1, migration: "legacy tolerant", fallback: "default profiles", size: "small", corruption: "ignore profiles only" },
  { key: "wwm_skill_overrides", owner: "PVE", schemaVersion: 1, migration: "legacy tolerant", fallback: "empty overrides", size: "small", corruption: "ignore overrides only" },
  { key: "wwm_timing_overrides", owner: "PVE", schemaVersion: 1, migration: "legacy tolerant", fallback: "empty overrides", size: "small", corruption: "ignore overrides only" },
  { key: "wwm_rotation_presets", owner: "PVE", schemaVersion: 1, migration: "legacy tolerant", fallback: "empty presets", size: "small-medium", corruption: "ignore presets only" },
  { key: "wwm_relay_cooldowns", owner: "PVE", schemaVersion: 1, migration: "legacy tolerant", fallback: "empty cooldowns", size: "small", corruption: "ignore cooldowns only" },
  { key: "wwm_arena_state_v1", owner: "ARENA", schemaVersion: 1, migration: "v0/unversioned → v1 sanitize", fallback: "default Arena profile", size: "medium", corruption: "backup + Arena-only recovery" },
  { key: "wwm_arena_history_v1", owner: "ARENA", schemaVersion: 1, migration: "entry sanitize", fallback: "empty local history", size: "medium", corruption: "history-only recovery" },
  { key: "wwm_arena_library_compare_v1", owner: "ARENA", schemaVersion: 1, migration: "legacy local descriptor → session-scoped comparison descriptor", fallback: "no Library reference selected for Arena compare", size: "tiny", corruption: "drop comparison descriptor only" },
  { key: "wwm_gvg_workspace_v1", owner: "GUILD_WAR", schemaVersion: 1, migration: "v0 → v1 bounded sanitize", fallback: "empty Guild War plan", size: "large", corruption: "backup + Guild-War-only recovery" },
  { key: "wwm_library_favorites_v1", owner: "LIBRARY", schemaVersion: 1, migration: "string-ID list sanitize", fallback: "empty favorites", size: "tiny", corruption: "favorites-only recovery" },
  { key: "wwm_library_recent_v1", owner: "LIBRARY", schemaVersion: 1, migration: "string-ID list sanitize", fallback: "empty recently viewed", size: "tiny", corruption: "recent-only recovery" },
  { key: "wwm_library_clone_descriptor_v1", owner: "LIBRARY", schemaVersion: 1, migration: "descriptor replacement", fallback: "no pending clone", size: "small", corruption: "descriptor-only recovery" },
  { key: "wwm_library_gvg_clones_v1", owner: "LIBRARY", schemaVersion: 1, migration: "validated clone envelopes", fallback: "empty cloned plans", size: "medium-large", corruption: "clone-store-only recovery" },
]);

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function inspectBoundedJson(value, options = {}, depth = 0) {
  const maxDepth = options.maxDepth ?? 10;
  const maxArray = options.maxArray ?? 500;
  const maxKeys = options.maxKeys ?? 200;
  const maxString = options.maxString ?? 64 * 1024;
  if (depth > maxDepth) throw new Error("Saved data is nested too deeply.");
  if (value == null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > maxString) throw new Error("Saved data contains an oversized string.");
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Math.abs(value) > 1_000_000_000) throw new Error("Saved data contains an invalid number.");
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > maxArray) throw new Error("Saved data contains an oversized array.");
    value.forEach((item) => inspectBoundedJson(item, options, depth + 1));
    return;
  }
  if (!isPlainRecord(value)) throw new Error("Saved data contains an unsupported object.");
  const entries = Object.entries(value);
  if (entries.length > maxKeys) throw new Error("Saved data contains too many object fields.");
  for (const [key, child] of entries) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error("Saved data contains a forbidden object key.");
    if (key.length > 120) throw new Error("Saved data contains an oversized field name.");
    inspectBoundedJson(child, options, depth + 1);
  }
}

function safeStorage() {
  try { return globalThis?.localStorage ?? null; } catch { return null; }
}

export function recoveryBackupKey(key) {
  return `${key}__recovery_backup_v${STORAGE_RECOVERY_SCHEMA}`;
}

export function backupDomainValue(key, raw) {
  const storage = safeStorage();
  if (!storage || typeof raw !== "string" || raw.length > MAX_RECOVERY_BACKUP_CHARS) return false;
  try {
    storage.setItem(recoveryBackupKey(key), raw);
    return true;
  } catch {
    return false;
  }
}

export function readJsonStorage(key, options = {}) {
  const storage = options.storage ?? safeStorage();
  const fallback = typeof options.fallback === "function" ? options.fallback : () => options.fallback;
  if (!storage?.getItem) return { value: fallback(), recovered: false, migrated: false, recoveryMessage: "", reason: "storage unavailable" };
  let raw = null;
  try { raw = storage.getItem(key); } catch { return { value: fallback(), recovered: false, migrated: false, recoveryMessage: "", reason: "storage unavailable" }; }
  if (raw == null) return { value: fallback(), recovered: false, migrated: false, recoveryMessage: "", reason: "missing" };
  const ownerLabel = options.ownerLabel || "saved";
  const recoveryMessage = options.recoveryMessage || `Some saved ${ownerLabel} data could not be loaded.`;
  try {
    if (!raw.trim()) throw new Error("Saved data is empty.");
    if (raw.length > (options.maxChars ?? 512 * 1024)) throw new Error("Saved data exceeds the supported size.");
    const parsed = JSON.parse(raw);
    inspectBoundedJson(parsed, options.bounds);
    const validation = options.validate?.(parsed);
    if (typeof validation === "string" && validation) throw new Error(validation);
    const migration = options.migrate?.(parsed);
    if (migration && typeof migration === "object" && "value" in migration) {
      const recovered = Boolean(migration.recovered);
      const backedUp = (recovered || migration.backup) ? backupDomainValue(key, raw) : false;
      const message = migration.message || (recovered ? recoveryMessage : "");
      return {
        value: migration.value,
        recovered,
        migrated: Boolean(migration.migrated),
        recoveryMessage: `${message}${backedUp && message ? " A local recovery backup was preserved." : ""}`,
        reason: recovered ? (migration.reason || "normalized") : migration.migrated ? "migrated" : "ok",
      };
    }
    return { value: parsed, recovered: false, migrated: false, recoveryMessage: "", reason: "ok" };
  } catch (error) {
    const backedUp = backupDomainValue(key, raw);
    return {
      value: fallback(),
      recovered: true,
      migrated: false,
      recoveryMessage: `${recoveryMessage}${backedUp ? " A local recovery backup was preserved." : ""}`,
      reason: error instanceof Error ? error.message : "Invalid saved data.",
    };
  }
}

export function cloneBoundedJson(value, options = {}) {
  inspectBoundedJson(value, options);
  const text = JSON.stringify(value);
  if (text.length > (options.maxChars ?? 128 * 1024)) throw new Error("Saved snapshot is too large.");
  return JSON.parse(text);
}
