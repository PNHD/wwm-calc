import assert from "node:assert/strict";
import fs from "node:fs";

const file = "public/data/library-v1.json";
const library = JSON.parse(fs.readFileSync(file, "utf8"));
const TYPES = new Set(["PVE_BUILD", "GVG_BUILD", "REFERENCE_BUILD", "COMMUNITY_BUILD", "GUILD_WAR_ROSTER", "GUILD_WAR_STRATEGY"]);
const MATURITY = new Set(["CALIBRATED", "CLIENT_VERIFIED", "OFFICIAL_REFERENCE", "COMMUNITY_REFERENCE", "MODELED", "EXPERIMENTAL", "OUTDATED"]);
const REQUIRED = [
  "bamboocut-dust-global-t96-calibrated",
  "silkbind-jade-mun-patch-2-community",
  "bamboocut-dust-gvg-anti-heal-zone",
  "balanced-guild-war-roster-template",
  "example-guild-war-strategy-template",
];

assert.equal(library.schemaVersion, 1, "Library schema must be versioned");
assert.equal(library.currentRegion, "Global");
assert.equal(library.currentPatch, "2.0");
assert.ok(Array.isArray(library.items) && library.items.length >= 5 && library.items.length <= 100);
const ids = new Set();
for (const item of library.items) {
  assert.match(item.id, /^[a-z0-9-]+$/);
  assert.ok(!ids.has(item.id), `duplicate library id ${item.id}`);
  ids.add(item.id);
  assert.ok(TYPES.has(item.type), `unsupported type ${item.type}`);
  assert.ok(item.workspace === "PVE" || item.workspace === "GVG");
  assert.ok(item.title && item.title.length <= 120);
  assert.ok(item.region && item.patch && item.tier && item.createdDate && item.lastReviewedDate && item.source);
  assert.equal(item.librarySchemaVersion, 1);
  assert.ok(Number.isInteger(item.buildSchemaVersion) && item.buildSchemaVersion >= 1);
  assert.ok(Array.isArray(item.maturity) && item.maturity.length > 0 && item.maturity.every((value) => MATURITY.has(value)));
  assert.ok(item.source.label && item.source.kind);
  if (item.source.url) {
    const url = new URL(item.source.url);
    assert.equal(url.protocol, "https:");
    assert.equal(url.username, "");
    assert.equal(url.password, "");
  }
  assert.ok(item.build && typeof item.build === "object" && !Array.isArray(item.build));
  if (item.build.gear) assert.ok(Array.isArray(item.build.gear) && item.build.gear.length <= 16);
  if (item.build.innerWays) assert.ok(Array.isArray(item.build.innerWays) && item.build.innerWays.length <= 8);
  if (item.build.roster) {
    assert.ok(Array.isArray(item.build.roster) && item.build.roster.length <= 30);
    for (const member of item.build.roster) {
      assert.ok(member.id && member.name && member.role);
      assert.ok(member.name.length <= 80);
    }
  }
  const serialized = JSON.stringify(item);
  for (const forbidden of ["__proto__", "prototype", "constructor"]) assert.equal(serialized.includes(`\"${forbidden}\"`), false, `${item.id} contains forbidden object key`);
}
for (const id of REQUIRED) assert.ok(ids.has(id), `missing required curated seed ${id}`);

const calibrated = library.items.find((item) => item.id === REQUIRED[0]);
assert.deepEqual(calibrated.maturity, ["CALIBRATED", "CLIENT_VERIFIED", "MODELED"]);
assert.equal(calibrated.build.modeledDps, 61266);
assert.equal(calibrated.build.panel.minOuter, 1614);
assert.equal(calibrated.build.panel.maxOuter, 2777);
assert.equal(calibrated.build.panel.prec, 122.1);
assert.equal(calibrated.build.panel.attunedBonus, 20);

const jade = library.items.find((item) => item.id === REQUIRED[1]);
assert.equal(jade.source.label, "Ultimate Umbrella Guide — Mun");
assert.ok(jade.maturity.includes("COMMUNITY_REFERENCE") && jade.maturity.includes("MODELED"));
assert.equal(jade.build.modeledDps, undefined, "Community Jade must not invent a DPS number");

const gvg = library.items.find((item) => item.id === REQUIRED[2]);
assert.ok(gvg.maturity.includes("EXPERIMENTAL"));
assert.ok(Object.keys(gvg.build.roleScores || {}).length >= 8);

const roster = library.items.find((item) => item.id === REQUIRED[3]);
assert.equal(roster.build.roster.length, 30);
assert.equal(new Set(roster.build.roster.map((member) => member.name)).size, 30);
assert.ok(roster.build.roster.every((member) => /^Slot \d{2}$/.test(member.name)), "curated roster must not contain real player identities");

const strategy = library.items.find((item) => item.id === REQUIRED[4]);
assert.ok(strategy.build.strategy.phases.some((line) => line.includes("3:00")));
assert.ok(strategy.build.strategy.phases.some((line) => line.includes("60s")));

const source = fs.readFileSync("src/library/model.ts", "utf8");
assert.match(source, /MAX_SHARED_PAYLOAD_BYTES\s*=\s*48 \* 1024/);
assert.match(source, /FORBIDDEN_KEYS = new Set\(\["__proto__", "prototype", "constructor"\]\)/);
assert.match(source, /url\.protocol === "https:"/);
assert.match(source, /migrateLegacyEnvelope/);
assert.match(source, /unsupported schema version/i);
assert.match(source, /wwm:analytics/);

const ui = fs.readFileSync("src/product/LibraryWorkspace.tsx", "utf8");
for (const phrase of ["OUTDATED REFERENCE", "Clone to My Workspace", "Compare with My Build", "Report Data Issue", "No builds match these filters.", "Featured means curated."]) assert.ok(ui.includes(phrase), `missing required UX phrase: ${phrase}`);
for (const forbiddenClaim of ["Top Meta", "S-TIER", "user ratings", "most popular"]) assert.equal(ui.includes(forbiddenClaim), forbiddenClaim === "Top Meta", `unexpected fake popularity/ranking claim: ${forbiddenClaim}`);

console.log(JSON.stringify({ ok: true, schemaVersion: library.schemaVersion, items: library.items.length, requiredSeeds: REQUIRED.length, maxRoster: 30, maxShareBytes: 49152 }, null, 2));
