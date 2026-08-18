import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ARENA_ATTUNEMENTS, ARENA_HISTORY_KEY, ARENA_STORAGE_KEY, BAMBOOCUT_DUST_RULES, EVIDENCE,
  PATH_PROFILES, PVE_INVENTORY_KEY, applyArenaEvent, clampEnduranceReduction, compareArenaBuilds,
  createCombatState, decodeArenaShare, defaultArenaState, encodeArenaShare, loadArenaHistory,
  loadArenaState, matchupCompare, rankArenaCandidates, readPveInventorySnapshot, saveArenaHistory,
  saveArenaState, simulateTeamArena, simulateTimeline, validate3v3Composition, validateArenaShare,
} from "../src/arena/arena-core.mjs";

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const fakeStorage = (seed = {}) => {
  const map = new Map(Object.entries(seed));
  return { getItem: (k) => map.has(k) ? map.get(k) : null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k), map };
};

test("workspace routing keeps Arena outside legacy App router", () => {
  const root = fs.readFileSync("src/RootRouter.tsx", "utf8");
  const main = fs.readFileSync("src/main.tsx", "utf8");
  const migration = fs.readFileSync("scripts/apply-arena-product-surface.mjs", "utf8");
  assert.match(root, /#arena/);
  assert.match(root, /<App \/>/);
  assert.match(root, /<ArenaWorkspace \/>/);
  assert.match(main, /RootRouter/);
  assert.match(migration, /#arena\/overview/);
});

test("Arena storage is isolated from PvE and Guild War", () => {
  assert.notEqual(ARENA_STORAGE_KEY, PVE_INVENTORY_KEY);
  assert.notEqual(ARENA_HISTORY_KEY, PVE_INVENTORY_KEY);
  const storage = fakeStorage({ [PVE_INVENTORY_KEY]: JSON.stringify({ untouched: true }) });
  const before = storage.getItem(PVE_INVENTORY_KEY);
  saveArenaState(defaultArenaState(), storage);
  assert.equal(storage.getItem(PVE_INVENTORY_KEY), before);
});

test("PvE inventory is read-only snapshot input", () => {
  const storage = fakeStorage({ [PVE_INVENTORY_KEY]: JSON.stringify({ chars: [{ id: "c", name: "Owner", schemes: [{ id: "s", name: "1106", gear: [{ id: "g1", slot: "Head", name: "Fixture" }] }] }], activeCharId: "c", activeSchemeId: "s" }) });
  const before = storage.getItem(PVE_INVENTORY_KEY);
  const snap = readPveInventorySnapshot(storage);
  assert.equal(snap.schemeName, "1106");
  snap.gear[0].name = "Changed copy";
  assert.equal(storage.getItem(PVE_INVENTORY_KEY), before);
});

test("Arena Attunement never stacks Normal Attunement by default", () => {
  const state = defaultArenaState();
  assert.equal(state.profiles[0].normalAttunementProfile, null);
  assert.ok(state.profiles[0].arenaAttunementIds.length > 0);
  assert.ok(ARENA_ATTUNEMENTS.every((a) => a.slot && a.patch && a.evidence));
});

test("Endurance reduction is capped at current official 40 percent", () => {
  assert.equal(clampEnduranceReduction(15), 15);
  assert.equal(clampEnduranceReduction(40), 40);
  assert.equal(clampEnduranceReduction(99), 40);
  assert.equal(clampEnduranceReduction(-5), 0);
});

test("Execute get-up produces distinct Tenacity, Control Immunity and Super Armor", () => {
  let state = applyArenaEvent(createCombatState(), { t: 1, type: "EXECUTE_KNOCKDOWN" });
  assert.equal(state.state, "KNOCKDOWN");
  state = applyArenaEvent(state, { t: 2, type: "GET_UP_AFTER_EXECUTE" });
  assert.equal(state.state, "GET_UP_PROTECTION");
  assert.ok(state.tags.includes("TENACITY"));
  assert.ok(state.tags.includes("CONTROL_IMMUNITY"));
  assert.ok(state.tags.includes("SUPER_ARMOR"));
  assert.notEqual("TENACITY", "SUPER_ARMOR");
});

test("Execute knockdown blocks Qi Damage", () => {
  let state = applyArenaEvent(createCombatState({ qi: 80 }), { type: "EXECUTE_KNOCKDOWN" });
  state = applyArenaEvent(state, { type: "QI_DAMAGE", amount: 30 });
  assert.equal(state.qi, 80);
});

test("Guarding Qi Core restores HP/Qi, clears qualifying control and grants 0.5s Invincibility", () => {
  let state = createCombatState({ hp: 50, qi: 40, state: "CONTROLLED", tags: ["CONTROLLED"] });
  state = applyArenaEvent(state, { t: 4, type: "GUARDING_QI_CORE", hpRestore: 12, qiRestore: 8 });
  assert.equal(state.hp, 62); assert.equal(state.qi, 48); assert.equal(state.state, "INVINCIBLE"); assert.equal(state.invincibleUntil, 4.5); assert.ok(!state.tags.includes("CONTROLLED"));
  const neutral = applyArenaEvent(createCombatState({ state: "NEUTRAL" }), { t: 1, type: "GUARDING_QI_CORE" });
  assert.match(neutral.log.at(-1).note, /does not trigger outside hit stagger/i);
});

test("Passive Break Control reaches explicit ready state without fabricated fill rate", () => {
  let state = applyArenaEvent(createCombatState(), { type: "BREAK_CONTROL_PROGRESS", delta: 45 });
  assert.equal(state.breakControlProgress, 45);
  state = applyArenaEvent(state, { type: "BREAK_CONTROL_PROGRESS", delta: 55 });
  assert.equal(state.state, "BREAK_CONTROL_READY");
});

test("Deflect and Dodge use explicit states", () => {
  assert.equal(applyArenaEvent(createCombatState(), { type: "DEFLECT" }).state, "DEFLECT");
  assert.equal(applyArenaEvent(createCombatState(), { type: "DODGE", duration: .2 }).state, "DODGE_IFRAME");
});

test("1v1 matchup is deterministic and has no win probability", () => {
  const result = matchupCompare("Bamboocut-Dust", "Bamboocut-Wind", "1v1");
  assert.equal(result.mode, "1v1");
  assert.ok(result.dimensions.some((d) => d.key === "control"));
  assert.ok(!("winProbability" in result));
  assert.match(result.why.join(" "), /not an empirical win probability/i);
});

test("3v3 no-healer revive logic and duplicate Martial Art restriction", () => {
  const ok = validate3v3Composition([{ martialArts: ["A","B"] }, { martialArts: ["A","C"] }, { martialArts: ["D","E"] }]);
  assert.equal(ok.valid, true); assert.match(ok.revive, /one revive opportunity/i); assert.match(ok.revive, /10m/i); assert.match(ok.revive, /15s/i);
  const bad = validate3v3Composition([{ martialArts: ["A"] }, { martialArts: ["A"] }, { martialArts: ["A"] }]);
  assert.equal(bad.valid, false); assert.match(bad.violations[0], /more than twice/i);
  assert.equal(simulateTeamArena({ mode: "3v3", players: [{ martialArts: ["A"] }, { martialArts: ["B"] }, { martialArts: ["C"] }], healer: false }).reviveAvailable, true);
});

test("5v5 Group Strategy remains team-event abstraction", () => {
  const result = simulateTeamArena({ mode: "5v5" });
  assert.equal(result.abstraction, "TEAM_EVENT_STATE"); assert.match(result.note, /without.*frame simulation/i);
});

test("Bamboocut Dust Version 2.0 official rules are isolated from PvE-only effects", () => {
  assert.equal(BAMBOOCUT_DUST_RULES.burnAndBury.unblockable, true);
  assert.equal(BAMBOOCUT_DUST_RULES.burnAndBury.warning, "golden flash");
  assert.equal(BAMBOOCUT_DUST_RULES.piercingDart.tenacityStartSeconds, .5);
  assert.equal(BAMBOOCUT_DUST_RULES.scarletSpin.staggerImproved, true);
  assert.ok(BAMBOOCUT_DUST_RULES.pveOnly.every((text) => /non-player/i.test(text)));
  assert.equal(BAMBOOCUT_DUST_RULES.burnAndBury.evidence, EVIDENCE.CONFIRMED_OFFICIAL);
});

test("Arena compare excludes PvE DPS winner leakage", () => {
  const a = { path: "Bamboocut-Dust", name: "1106", pveDps: 999999 };
  const b = { path: "Bamboocut-Dust", name: "1129", pveDps: 1, arenaDimensions: { survival: .3 } };
  const result = compareArenaBuilds(a, b, { objective: "VS_BURST" });
  assert.match(result.explanation, /PvE modeled DPS is intentionally excluded/i);
  assert.notEqual(result.verdict, "A BETTER FOR THIS OBJECTIVE");
});

test("Arena Best Build ranking is objective-specific and exposes close-call semantics", () => {
  const candidates = [
    { id: "pressure", path: "Bamboocut-Dust", arenaDimensions: { burst: .5, survival: -.2 } },
    { id: "survival", path: "Bamboocut-Dust", arenaDimensions: { burst: -.2, survival: .6, recovery: .3 } },
    { id: "control", path: "Bamboocut-Dust", arenaDimensions: { control: .5, mobility: .2 } },
  ];
  const general = rankArenaCandidates(candidates, "1V1_GENERAL");
  const antiBurst = rankArenaCandidates(candidates, "VS_BURST");
  assert.equal(antiBurst[0].id, "survival");
  assert.ok(general[0].arenaObjectiveScore !== undefined);
  assert.ok(["MODELED", "CLOSE CALL"].includes(general[0].rankingConfidence));
});

test("Arena references are mechanic-only and never fabricate gear", () => {
  const refs = JSON.parse(fs.readFileSync("src/arena/arena-evidence.json", "utf8"));
  assert.equal(refs.region, "Global");
  assert.ok(refs.records.some((r) => r.id === "arena-3v3-revive"));
  assert.ok(refs.records.some((r) => r.id === "dust-burn-bury" && r.category === "CONFIRMED_OFFICIAL"));
});

test("Arena share roundtrip validates schema and rejects malformed/prototype payloads", () => {
  const payload = { schemaVersion: 1, type: "ARENA_BUILD", name: "Dust Arena", path: "Bamboocut-Dust", mode: "1v1", arenaAttunementIds: ["arena-everspring-scarlet-spin"], strengths: ["Control"], risks: ["Charge window"], maturity: "MODELED", patch: "2.0" };
  const decoded = decodeArenaShare(encodeArenaShare(payload));
  assert.equal(decoded.path, "Bamboocut-Dust"); assert.equal(decoded.type, "ARENA_BUILD");
  assert.throws(() => validateArenaShare({ ...payload, mode: "9v9" }), /mode/i);
  assert.throws(() => validateArenaShare({ ...payload, path: "<script>" }), /path/i);
  const polluted = JSON.parse('{"schemaVersion":1,"type":"ARENA_BUILD","name":"x","path":"Bamboocut-Dust","mode":"1v1","__proto__":{"polluted":true}}');
  assert.throws(() => validateArenaShare(polluted), /Prototype key rejected/);
});

test("Arena clone/load sanitization cannot overwrite active profile implicitly", () => {
  const storage = fakeStorage();
  const state = defaultArenaState();
  const original = state.activeProfileId;
  const clone = { ...state.profiles[0], id: "clone", name: "Clone" };
  saveArenaState({ ...state, profiles: [...state.profiles, clone] }, storage);
  const loaded = loadArenaState(storage);
  assert.equal(loaded.activeProfileId, original);
  assert.equal(loaded.profiles.length, 2);
});

test("History persists locally, bounds payloads and reports sample size", () => {
  const storage = fakeStorage();
  saveArenaHistory([{ id: "h1", date: "2026-08-18", patch: "2.0", mode: "1v1", opponentPath: "Bamboocut-Wind", result: "WIN", durationSeconds: 70, notes: "Observed" }], storage);
  const rows = loadArenaHistory(storage); assert.equal(rows.length, 1); assert.equal(rows[0].result, "WIN");
  assert.ok(storage.getItem(ARENA_HISTORY_KEY));
});

test("timeline simulator exposes reaction assumptions instead of skill ratings", () => {
  const sim = simulateTimeline({ horizon: 30, reaction: "perfect" });
  assert.equal(sim.horizon, 30); assert.match(sim.reactionAssumption, /not a player skill rating/i); assert.match(sim.note, /not human reaction frame prediction/i);
});

test("responsive Arena CSS explicitly guards 390px overflow and 1024/1440 layouts remain bounded", () => {
  const css = fs.readFileSync("src/arena/arena.css", "utf8");
  assert.match(css, /@media\(max-width:390px\)/);
  assert.match(css, /overflow-x:hidden/);
  assert.match(css, /max-width:100vw/);
  assert.match(css, /@media\(max-width:1180px\)/);
  assert.match(css, /@media\(max-width:820px\)/);
});

test("documentation records official/current/unknown separation", () => {
  const doc = fs.readFileSync("docs/GLOBAL_ARENA_MODEL.md", "utf8");
  assert.match(doc, /CONFIRMED_OFFICIAL/); assert.match(doc, /Version 2\.0/); assert.match(doc, /UNKNOWN/); assert.match(doc, /Burn and Bury/); assert.match(doc, /3v3/);
});

for (const [name, fn] of tests) {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
console.log(`Arena model validation complete: ${tests.length}/${tests.length} passed.`);
