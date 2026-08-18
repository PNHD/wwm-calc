import assert from "node:assert/strict";
import { STORAGE_REGISTRY, readJsonStorage } from "../src/product/storage-registry.js";
import {
  ARENA_STORAGE_KEY,
  defaultArenaState,
  loadArenaState,
  validateArenaShare,
} from "../src/arena/arena-core.mjs";
import {
  SHARE_KINDS,
  defaultWorkspace,
  migrateWorkspace,
  migrateWorkspaceWithStatus,
  validateShareEnvelope,
} from "../src/gvg/model.js";

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const registryKeys = new Set(STORAGE_REGISTRY.map((item) => item.key));
for (const key of [
  "wwm_product_shell_v2", "wwm_selected_build", "wwm_chars_v3", "wwm_t91_custom_config",
  "wwm_t91_profiles", "wwm_skill_overrides", "wwm_timing_overrides", "wwm_rotation_presets",
  "wwm_relay_cooldowns", "wwm_arena_state_v1", "wwm_arena_history_v1", "wwm_gvg_workspace_v1",
  "wwm_library_favorites_v1", "wwm_library_gvg_clones_v1",
]) assert.ok(registryKeys.has(key), `storage registry missing ${key}`);

for (const raw of ["", "{", "not-json"]) {
  const storage = new MemoryStorage({ [ARENA_STORAGE_KEY]: raw });
  const state = loadArenaState(storage);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.activeProfileId, "arena-main");
}

{
  const storage = new MemoryStorage({ [ARENA_STORAGE_KEY]: JSON.stringify({ ...defaultArenaState(), schemaVersion: 99 }) });
  const state = loadArenaState(storage);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.activeProfileId, "arena-main");
}

{
  const legacy = defaultArenaState();
  delete legacy.schemaVersion;
  legacy.profiles.push({ ...legacy.profiles[0], id: "arena-main", name: "Duplicate" });
  const storage = new MemoryStorage({ [ARENA_STORAGE_KEY]: JSON.stringify(legacy) });
  const state = loadArenaState(storage);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.profiles.length, 1, "Arena duplicate profile IDs must be deduplicated");
}

{
  const state = defaultArenaState();
  state.profiles[0].gearSnapshot = JSON.parse('{"gear":[],"__proto__":{"polluted":true}}');
  const storage = new MemoryStorage({ [ARENA_STORAGE_KEY]: JSON.stringify(state) });
  const safe = loadArenaState(storage);
  assert.equal(safe.profiles[0].gearSnapshot, null, "unsafe Arena gear snapshot must be dropped");
  assert.equal({}.polluted, undefined);
}

assert.throws(() => validateArenaShare(JSON.parse('{"schemaVersion":1,"type":"ARENA_BUILD","name":"x","path":"Bamboocut-Dust","mode":"1v1","__proto__":{"polluted":true}}')), /Prototype key rejected/);

{
  const malformed = migrateWorkspaceWithStatus({ schema: "wwm-gvg-workspace", version: 1, roster: "bad", strategy: { positions: [] }, timeline: {} });
  assert.equal(malformed.workspace.schema, "wwm-gvg-workspace");
  assert.ok(Array.isArray(malformed.workspace.roster));
  assert.ok(Array.isArray(malformed.workspace.timeline));
  assert.equal(typeof malformed.workspace.strategy.positions, "object");
  assert.equal(malformed.recovered, true);
}

{
  const input = defaultWorkspace();
  input.roster = [
    { id: "same", name: "One", roles: ["DUELIST"], availability: true },
    { id: "same", name: "Two", roles: ["HEALER"], availability: true },
  ];
  input.strategy.positions = { same: { x: 10, y: 20 }, orphan: { x: 40, y: 50 } };
  input.duelist = { primary: "orphan", backup1: "same", backup2: null };
  input.timeline = [{ id: "event", label: "A", timeSeconds: 10, type: "PLAN" }, { id: "event", label: "B", timeSeconds: 11, type: "PLAN" }];
  const safe = migrateWorkspace(input);
  assert.equal(safe.roster.length, 2);
  assert.equal(new Set(safe.roster.map((member) => member.id)).size, 2, "GvG duplicate member IDs must be repaired deterministically");
  assert.equal("orphan" in safe.strategy.positions, false, "orphan strategy positions must be removed");
  assert.equal(safe.duelist.primary, null, "orphan duelist reference must be cleared");
  assert.equal(new Set(safe.timeline.map((event) => event.id)).size, 2, "timeline IDs must remain unique");
}

{
  const future = migrateWorkspaceWithStatus({ schema: "wwm-gvg-workspace", version: 9 });
  assert.equal(future.recovered, true);
  assert.equal(future.workspace.version, 1);
}

function envelope(kind, payload) {
  return { schema: "wwm-gvg-share", version: 1, kind, createdAt: "2026-08-18T00:00:00.000Z", privacy: { playerNamesRedacted: true }, payload };
}

for (const kind of SHARE_KINDS) {
  const result = validateShareEnvelope(envelope(kind, {}));
  assert.equal(result.valid, true, `${kind} baseline share should remain valid`);
}

{
  const malicious = JSON.parse('{"schema":"wwm-gvg-share","version":1,"kind":"ROSTER","payload":{"__proto__":{"polluted":true},"roster":[]}}');
  const result = validateShareEnvelope(malicious);
  assert.equal(result.valid, false);
  assert.equal({}.polluted, undefined);
}

{
  const roster = Array.from({ length: 31 }, (_, index) => ({ id: `p-${index}`, name: `P${index}` }));
  assert.equal(validateShareEnvelope(envelope("ROSTER", { roster })).valid, false);
}

{
  const roster = [{ id: "same", name: "A" }, { id: "same", name: "B" }];
  assert.equal(validateShareEnvelope(envelope("ROSTER", { roster })).valid, false);
}

{
  const giant = envelope("FULL_GUILD_WAR_PLAN", { note: "x".repeat(70 * 1024) });
  assert.equal(validateShareEnvelope(giant).valid, false);
}

{
  const nested = { value: "ok" };
  let cursor = nested;
  for (let index = 0; index < 14; index += 1) cursor = cursor.next = {};
  assert.equal(validateShareEnvelope(envelope("STRATEGY", nested)).valid, false);
}

{
  const storage = new MemoryStorage({ test: JSON.stringify({ okay: true }) });
  const result = readJsonStorage("test", { storage, fallback: () => ({}), validate: (value) => value.okay ? "" : "bad" });
  assert.deepEqual(result.value, { okay: true });
  assert.equal(result.recovered, false);
}

console.log(JSON.stringify({
  success: true,
  registryKeys: STORAGE_REGISTRY.length,
  arenaCorruptionCases: 6,
  gvgMigrationCases: 3,
  shareSecurityCases: 6,
}, null, 2));
