import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-draught-"));
const calcBundlePath = path.join(tempDir, "calc.mjs");
const catalogBundlePath = path.join(tempDir, "catalog.mjs");
const appBundlePath = path.join(tempDir, "app.mjs");

try {
  await build({
    entryPoints: { calc: "src/utils/calc.ts", catalog: "src/data/pathCatalog.ts", app: "src/App.tsx" },
    bundle: true,
    format: "esm",
    platform: "node",
    outdir: tempDir,
    outExtension: { ".js": ".mjs" },
  });

  const calc = await import(pathToFileURL(calcBundlePath).href);
  const catalog = await import(pathToFileURL(catalogBundlePath).href);
  const app = await import(pathToFileURL(appBundlePath).href);
  const paths = catalog.createProductPathCatalog({ "bamboocut-dust": { tier: "Modeled" } }, new Set());
  const expectedRoster = [
    ["bellstrike-splendor", "Nameless Sword", "Nameless Spear"], ["bellstrike-umbra", "Strategic Sword", "Heavenquaker Spear"],
    ["silkbind-jade", "Vernal Umbrella", "Inkwell Fan"], ["silkbind-deluge", "Soulshade Umbrella", "Panacea Fan"],
    ["stonesplit-might", "Thundercry Blade", "Stormbreaker Spear"], ["stonesplit-strength", "Snowparting Blade", "Phalanxbane Blade"],
    ["bamboocut-wind", "Infernal Twinblades", "Mortal Rope Dart"], ["bamboocut-dust", "Everspring Umbrella", "Unfettered Rope Dart"],
    ["bamboocut-kite", "Heavenwill Gauntlets", "Skygrasp Rope Dart"], ["bamboocut-draught", "Skystrike Gauntlets", "Riven Twinblades"],
  ];
  assert.deepEqual(paths.map(({ id, weapon1, weapon2, currentGlobal }) => [id, weapon1, weapon2, currentGlobal]), expectedRoster.map(([id, weapon1, weapon2]) => [id, weapon1, weapon2, true]), "canonical Global roster must be the exact ten-path table");
  assert.equal(paths.length, 10, "there must be exactly ten current Global paths");
  assert.equal(new Set(paths.map((path) => path.id)).size, 10, "canonical path keys must be unique");
  assert.ok(!paths.some((path) => ["stonesplit-awe", "stonesplit-pure-datang", "bamboocut-bird"].includes(path.id)), "obsolete aliases must not be active Global paths");
  assert.notDeepEqual(paths.find((path) => path.id === "stonesplit-might")?.knownMartialArts, paths.find((path) => path.id === "stonesplit-strength")?.knownMartialArts, "Might and Strength must remain distinct");
  assert.equal(new Set(paths.map((path) => path.weapons)).size, 10, "no weapon pair may be assigned to multiple path identities");
  assert.equal(catalog.getNumericalPathAvailability("stonesplit-might").numericalModelAvailable, false, "corrected Might must not inherit the prior Strength-pair numerical model");
  assert.equal(catalog.getNumericalPathAvailability("stonesplit-strength").numericalModelAvailable, false, "Strength must remain unmodeled");
  assert.equal(calc.getRotationForBuild("stonesplit-might"), null, "corrected Might must stop before legacy numerical rotation data");
  assert.equal(calc.getRotationForBuild("stonesplit-strength"), null, "Strength must stop before legacy numerical rotation data");
  assert.equal(catalog.getNumericalPathAvailability("stonesplit-awe").reason, "UNSUPPORTED_LEGACY_PATH", "obsolete saved ids must fail closed rather than map to a current path");
  assert.deepEqual(app.BUILD_WEAPONS["stonesplit-might"], ["thundercry-blade", "stormbreaker-spear"], "Might must expose its canonical ordered weapon ids");
  assert.deepEqual(app.BUILD_WEAPON_TYPES["stonesplit-might"], ["Mo Blade", "Spear"], "Might weapon types must match Thundercry Blade and Stormbreaker Spear");
  assert.deepEqual(app.BUILD_WEAPONS["stonesplit-strength"], ["snowparting-blade", "phalanxbane-blade"], "Strength must expose its canonical ordered weapon ids");
  assert.deepEqual(app.BUILD_WEAPON_TYPES["stonesplit-strength"], ["Hengdao", "Mo Blade"], "Strength weapon types must match Snowparting Blade and Phalanxbane Blade");
  assert.deepEqual(app.BUILD_WEAPONS["silkbind-jade"], ["vernal-umbrella", "inkwell-fan"], "Jade must retain its canonical ordered weapon ids");
  assert.deepEqual(app.BUILD_WEAPONS["silkbind-deluge"], ["soulshade-umbrella", "panacea-fan"], "Deluge must retain its canonical ordered weapon ids");
  for (const map of [app.PATH_ICONS, app.BUILD_WEAPONS, app.BUILD_WEAPON_TYPES, app.BUILD_TIPS, app.ATTUNED_BONUS_LABEL]) {
    assert.ok(!Object.hasOwn(map, "stonesplit-awe") && !Object.hasOwn(map, "stonesplit-scale") && !Object.hasOwn(map, "stonesplit-pure-datang"), "active current-Global UI maps must not expose obsolete Stonesplit aliases");
  }
  assert.equal(app.BUILD_PROFILES["stonesplit-might"], undefined, "the Strength-pair profile must not remain active under Might");
  assert.equal(app.BUILD_PROFILES["stonesplit-strength"], undefined, "Strength must not gain an unverified numerical profile");
  const staleProfile = { "stonesplit-might": { gradTargets: { maxOuter: 1 }, priorityStats: ["maxOuter"] }, "stonesplit-strength": { gradTargets: { maxOuter: 1 }, priorityStats: ["maxOuter"] } };
  assert.equal(catalog.getModeledPathMetadata("stonesplit-might", staleProfile), undefined, "unmodeled Might must not expose profile gradTargets or priority stats through UI metadata");
  assert.equal(catalog.getModeledPathMetadata("stonesplit-strength", staleProfile), undefined, "unmodeled Strength must not expose profile gradTargets or priority stats through UI metadata");
  const appSource = await readFile("src/App.tsx", "utf8");
  assert.match(appSource, /const buildOptions = createProductPathCatalog\(BUILD_PROFILES, ESTIMATED_BUILDS\);/, "PvE must derive its selector from the canonical catalog");
  assert.match(appSource, /\{buildOptions\.map\(\(build\) => <option key=\{build\.id\}/, "Team must consume canonical catalog options");
  const arenaSource = await readFile("src/arena/ArenaWorkspace.tsx", "utf8");
  assert.match(arenaSource, /const PATHS = CANONICAL_GLOBAL_PATHS\.map/, "Arena path selection must consume canonical Global identities");
  assert.match(arenaSource, /CANONICAL_GLOBAL_PATHS\.map\(\(path\) => \{ const data: any = PATH_COMPETITIVE_PROFILES/, "Arena must retain identity truth when a competitive model is unavailable");
  const draught = paths.find((entry) => entry.id === "bamboocut-draught");
  assert.ok(draught, "Draught must be a normal entry in the canonical primary path catalog");
  assert.equal(draught.capability, "UNMODELED", "Draught must explicitly declare an unmodeled capability");
  assert.equal(draught.currentGlobal, true, "Draught must retain its accepted current-Global status");
  const rotation = calc.getRotationForBuild("bamboocut-draught");
  const duration = calc.getRotationTimeForBuild("bamboocut-draught");
  const baseline = calc.calcBaseline(calc.TIERS.T96, "bamboocut-draught");

  assert.equal(rotation, null, "unmodeled Draught rotation must be unavailable, not an empty modeled rotation");
  assert.equal(duration, null, "unmodeled Draught duration must be unavailable, not numeric zero");
  assert.equal(baseline, null, "unmodeled Draught graduation baseline must be unavailable, not numeric zero");
  const availability = catalog.getNumericalPathAvailability("bamboocut-draught");
  assert.equal(availability.numericalModelAvailable, false, "an unmodeled path must stop at the numerical product boundary");
  assert.equal(catalog.isBestBuildEligible("bamboocut-draught"), false, "Draught must not be eligible for Best Build");
  assert.equal(catalog.canRenderBestBuildResult("bamboocut-draught", "bamboocut-dust"), false, "a modeled-path Best Build result must not render after switching to Draught");
  assert.equal(catalog.canRenderBestBuildResult("bamboocut-dust", "bamboocut-dust"), true, "a matching modeled-path Best Build result remains renderable");

  const kite = paths.find((entry) => entry.id === "bamboocut-kite");
  assert.ok(kite, "Kite must be a normal entry in the canonical primary path catalog");
  assert.deepEqual(kite.knownMartialArts, ["Heavenwill Gauntlets", "Skygrasp Rope Dart"], "Kite must use current Global martial-art names");
  assert.equal(kite.currentGlobal, true, "Kite must be current Global content");
  assert.equal(kite.capability, "UNMODELED", "Kite must explicitly declare an unmodeled capability");
  assert.equal(calc.getRotationForBuild("bamboocut-kite"), null, "Kite must not inherit another path rotation");
  assert.equal(calc.getRotationTimeForBuild("bamboocut-kite"), null, "Kite must not inherit another path duration");
  assert.equal(calc.calcBaseline(calc.TIERS.T96, "bamboocut-kite"), null, "Kite must not inherit another path graduation baseline");
  assert.equal(catalog.isBestBuildEligible("bamboocut-kite"), false, "Kite must not be eligible for Best Build");
  assert.equal(catalog.canRenderBestBuildResult("bamboocut-kite", "bamboocut-dust"), false, "Kite must not render another path's Best Build result");

  console.log("[v13-bamboocut-paths] PASS — current Global Draught/Kite capability, exact Kite martial-art names, unavailable numerical inputs, and stale-result guards verified.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
