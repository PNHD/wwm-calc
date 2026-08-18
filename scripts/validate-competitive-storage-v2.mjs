import assert from "node:assert/strict";
import {
  loadArenaModeV2, loadGvgAssignmentsV2, loadGvgManualV2, loadGvgPhaseV2,
  saveArenaModeV2, saveGvgAssignmentsV2, saveGvgManualV2, saveGvgPhaseV2,
  sanitizeArenaModeV2, sanitizeGvgAssignmentsV2, sanitizeGvgManualV2, sanitizeGvgPhaseV2,
} from "../src/competitive/storage-v2.mjs";

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
}

assert.equal(sanitizeArenaModeV2("3V3_ARENA"), "3V3_ARENA");
assert.equal(sanitizeArenaModeV2("PVE_BOSS"), "1V1_ARENA");
assert.equal(sanitizeGvgPhaseV2("HALFTIME"), "HALFTIME");
assert.equal(sanitizeGvgPhaseV2("WIN_NOW"), "PREPARATION");

const assignments = sanitizeGvgAssignmentsV2({ BULWARK: " Main <Ball> ", GOOSE: "Flex A", FAKE: "drop", __proto__: "drop" });
assert.deepEqual(assignments, { BULWARK: "Main Ball", GOOSE: "Flex A" });
assert.deepEqual(sanitizeGvgAssignmentsV2([]), {});
assert.deepEqual(sanitizeGvgAssignmentsV2(null), {});

assert.deepEqual(sanitizeGvgManualV2({ halftimeTrigger: 600 }), { halftimeTrigger: 600 });
assert.deepEqual(sanitizeGvgManualV2({ halftimeTrigger: -1 }), {});
assert.deepEqual(sanitizeGvgManualV2({ halftimeTrigger: 3601 }), {});
assert.deepEqual(sanitizeGvgManualV2({ halftimeTrigger: "900.4", extra: "drop" }), { halftimeTrigger: 900 });

{
  const storage = new MemoryStorage({
    wwm_arena_mode_v2: "PERCEPTION_FOREST",
    wwm_gvg_phase_v2: "GOOSE_PRESSURE",
    wwm_gvg_v2_assignments: JSON.stringify({ TOP_OUTPOST: "Flex A", FAKE: "discard" }),
    wwm_gvg_v2_manual: JSON.stringify({ halftimeTrigger: 780, cost: 999 }),
  });
  assert.equal(loadArenaModeV2("1V1_ARENA", storage), "PERCEPTION_FOREST");
  assert.equal(loadGvgPhaseV2(storage), "GOOSE_PRESSURE");
  assert.deepEqual(loadGvgAssignmentsV2(storage), { TOP_OUTPOST: "Flex A" });
  assert.deepEqual(loadGvgManualV2(storage), { halftimeTrigger: 780 });
  assert.equal(saveArenaModeV2("INVALID", storage), "1V1_ARENA");
  assert.equal(saveGvgPhaseV2("INVALID", storage), "PREPARATION");
  assert.deepEqual(saveGvgAssignmentsV2({ FORTUNE_TREE: "Escort <One>", BAD: "x" }, storage), { FORTUNE_TREE: "Escort One" });
  assert.deepEqual(saveGvgManualV2({ halftimeTrigger: 420, commandCost: 5 }, storage), { halftimeTrigger: 420 });
}

{
  const storage = new MemoryStorage({
    wwm_gvg_v2_assignments: "x".repeat(5000),
    wwm_gvg_v2_manual: '{"__proto__":{"polluted":true},"halftimeTrigger":600}',
  });
  assert.deepEqual(loadGvgAssignmentsV2(storage), {});
  assert.deepEqual(loadGvgManualV2(storage), {});
  assert.equal({}.polluted, undefined);
}

console.log(JSON.stringify({ success: true, suite: "Competitive V2 bounded storage", domains: 4 }, null, 2));
