import fs from "node:fs";

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, source) { fs.writeFileSync(path, source, "utf8"); }
function replaceContract(path, marker, before, after, label) {
  let source = read(path);
  if (source.includes(marker)) return;
  if (!source.includes(before)) throw new Error(`Competitive V2 final runtime fix: ${label} anchor missing`);
  source = source.replace(before, after);
  if (!source.includes(marker)) throw new Error(`Competitive V2 final runtime fix: ${label} marker missing after patch`);
  write(path, source);
}

// Preserve the UNKNOWN Guild War Attunement state through the V1-compatible
// workspace sanitizer. UNKNOWN must never silently become ARENA.
replaceContract(
  "src/gvg/model.js",
  "COMPETITIVE_V2_GVG_ATTUNEMENT_SANITIZER_UNKNOWN",
  `      gvgSelectedProfile: member.gvgSelectedProfile === "NORMAL" ? "NORMAL" : "ARENA",`,
  `      gvgSelectedProfile: member.gvgSelectedProfile === "NORMAL" || member.gvgSelectedProfile === "ARENA" ? member.gvgSelectedProfile : "UNKNOWN", // COMPETITIVE_V2_GVG_ATTUNEMENT_SANITIZER_UNKNOWN`,
  "Guild War Attunement sanitizer",
);

// Arena V2 history must retain the actual mode taxonomy. The legacy sanitizer
// used to collapse all V2 mode IDs to 1v1, which would merge incompatible modes.
replaceContract(
  "src/arena/arena-core.mjs",
  "COMPETITIVE_V2_ARENA_HISTORY_MODE_IDS",
  `    mode: ARENA_MODES.includes(entry.mode) ? entry.mode : "1v1", battlegroup: cleanText(entry.battlegroup || "", 40), opponentPath: allowedPath(entry.opponentPath),`,
  `    mode: [...ARENA_MODES, "1V1_ARENA", "3V3_ARENA", "GROUP_STRATEGY", "5V5_ARENA", "PERCEPTION_FOREST", "TRAINING_TERRACE"].includes(entry.mode) ? entry.mode : "1v1", /* COMPETITIVE_V2_ARENA_HISTORY_MODE_IDS */ battlegroup: cleanText(entry.battlegroup || "", 40), opponentPath: allowedPath(entry.opponentPath),`,
  "Arena history V2 mode preservation",
);

replaceContract(
  "scripts/validate-arena-model.mjs",
  "COMPETITIVE_V2_ARENA_HISTORY_MODE_TEST",
  `  saveArenaHistory([{ id: "h1", date: "2026-08-18", patch: "2.0", mode: "1v1", opponentPath: "Bamboocut-Wind", result: "WIN", durationSeconds: 70, notes: "Observed" }], storage);`,
  `  saveArenaHistory([{ id: "h1", date: "2026-08-18", patch: "2.0", mode: "PERCEPTION_FOREST", opponentPath: "Bamboocut-Wind", result: "WIN", durationSeconds: 70, notes: "Observed" }], storage); // COMPETITIVE_V2_ARENA_HISTORY_MODE_TEST`,
  "Arena history V2 mode validator fixture",
);
replaceContract(
  "scripts/validate-arena-model.mjs",
  "COMPETITIVE_V2_ARENA_HISTORY_MODE_ASSERT",
  `  const rows = loadArenaHistory(storage); assert.equal(rows.length, 1); assert.equal(rows[0].result, "WIN");`,
  `  const rows = loadArenaHistory(storage); assert.equal(rows.length, 1); assert.equal(rows[0].result, "WIN"); assert.equal(rows[0].mode, "PERCEPTION_FOREST"); // COMPETITIVE_V2_ARENA_HISTORY_MODE_ASSERT`,
  "Arena history V2 mode validator assertion",
);

// Browser fixture bug: addInitScript executes before every navigation/reload.
// Seeding history deletion there made the history persistence test erase its own
// saved record on reload. Seed Arena state exactly once instead.
replaceContract(
  "scripts/runtime-arena-acceptance.spec.mjs",
  "COMPETITIVE_V2_ARENA_ONE_SHOT_SEED",
  `async function seedArena(page) {\n  const state = defaultArenaState();\n  state.onboardingComplete = true;\n  await page.addInitScript((value) => {\n    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(value));\n    localStorage.removeItem("wwm_arena_mode_v2");\n    localStorage.removeItem("wwm_arena_history_v1");\n  }, state);\n}`,
  `async function seedArena(page) {\n  const state = defaultArenaState();\n  state.onboardingComplete = true;\n  await page.goto(base, { waitUntil: "domcontentloaded" });\n  await page.evaluate((value) => {\n    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(value));\n    localStorage.removeItem("wwm_arena_mode_v2");\n    localStorage.removeItem("wwm_arena_history_v1");\n  }, state); // COMPETITIVE_V2_ARENA_ONE_SHOT_SEED\n}`,
  "Arena one-shot browser seed",
);
replaceContract(
  "scripts/runtime-arena-acceptance.spec.mjs",
  "COMPETITIVE_V2_ARENA_HISTORY_RUNTIME_MODE",
  `  await expect(page.getByText(/n=1; descriptive record only/i)).toBeVisible();\n  await page.reload({ waitUntil: "networkidle" });`,
  `  await expect(page.getByText(/n=1; descriptive record only/i)).toBeVisible();\n  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_history_v1") || "[]")[0]?.mode)).toBe("PERCEPTION_FOREST"); // COMPETITIVE_V2_ARENA_HISTORY_RUNTIME_MODE\n  await page.reload({ waitUntil: "networkidle" });`,
  "Arena runtime history mode persistence",
);

// Scope repeated Guild War labels to the actual timeline surface.
replaceContract(
  "scripts/runtime-gvg-acceptance.spec.mjs",
  "COMPETITIVE_V2_GVG_TIMELINE_SCOPE",
  `  await expect(page.getByTestId("gvg-timeline")).toBeVisible();\n  await expect(page.getByText("OUTPOST PHASE", { exact: true })).toBeVisible();\n  await expect(page.getByText("3:00", { exact: true })).toBeVisible();`,
  `  const timelineSurface = page.getByTestId("gvg-timeline" /* COMPETITIVE_V2_GVG_TIMELINE_SCOPE */);\n  await expect(timelineSurface).toBeVisible();\n  await expect(timelineSurface.getByText("OUTPOST PHASE", { exact: true })).toBeVisible();\n  await expect(timelineSurface.getByText("3:00", { exact: true })).toBeVisible();`,
  "Guild War timeline label scope",
);

// Objective IDs intentionally exist both on map controls and detail cards so
// timeline/map can share state. Runtime acceptance should verify the map controls.
replaceContract(
  "scripts/runtime-gvg-acceptance.spec.mjs",
  "COMPETITIVE_V2_GVG_OBJECTIVE_MAP_SCOPE",
  `  await expect(page.getByTestId("gvg-strategy")).toBeVisible();\n  await expect(page.locator('[data-objective-id="BULWARK"]')).toBeVisible();\n  await expect(page.locator('[data-objective-id="GOOSE"]')).toBeVisible();\n  await expect(page.locator('[data-objective-id="FORTUNE_TREE"]')).toBeVisible();`,
  `  await expect(page.getByTestId("gvg-strategy")).toBeVisible();\n  const objectiveMap = page.getByTestId("gvg-objective-map" /* COMPETITIVE_V2_GVG_OBJECTIVE_MAP_SCOPE */);\n  await expect(objectiveMap.locator('button[data-objective-id="BULWARK"]')).toBeVisible();\n  await expect(objectiveMap.locator('button[data-objective-id="GOOSE"]')).toBeVisible();\n  await expect(objectiveMap.locator('button[data-objective-id="FORTUNE_TREE"]')).toBeVisible();`,
  "Guild War objective map scope",
);

replaceContract(
  "scripts/runtime-workspace-ux.spec.mjs",
  "COMPETITIVE_V2_WORKSPACE_OBJECTIVE_MAP_SCOPE",
  `  await gvg(page, "Strategy"); await expect(page.getByTestId("gvg-strategy")).toBeVisible(); await expect(page.locator('[data-objective-id="BULWARK"]')).toBeVisible(); await page.screenshot({ path: \`${qaDir}/1440-gvg-v2-strategy.png\`, fullPage: true });`,
  `  await gvg(page, "Strategy"); await expect(page.getByTestId("gvg-strategy")).toBeVisible(); await expect(page.getByTestId("gvg-objective-map" /* COMPETITIVE_V2_WORKSPACE_OBJECTIVE_MAP_SCOPE */).locator('button[data-objective-id="BULWARK"]')).toBeVisible(); await page.screenshot({ path: \`${qaDir}/1440-gvg-v2-strategy.png\`, fullPage: true });`,
  "workspace Guild War objective map scope",
);

// V1 representative-scale acceptance must exercise the current Arena V2
// decision surface, not resurrect the removed weighted "Run Top 3" optimizer.
replaceContract(
  "scripts/runtime-v1-release-acceptance.spec.mjs",
  "COMPETITIVE_V2_V1_PERF_TIMING_NAME",
  `  const timings = { pveInventory: {}, arenaBestBuildMs: null, gvgRosterRenderMs: null, gvgStrategyMs: null, libraryFilterMs: null };`,
  `  const timings = { pveInventory: {}, arenaBuildDecisionMs: null, gvgRosterRenderMs: null, gvgStrategyMs: null, libraryFilterMs: null }; // COMPETITIVE_V2_V1_PERF_TIMING_NAME`,
  "V1 performance Arena timing name",
);
replaceContract(
  "scripts/runtime-v1-release-acceptance.spec.mjs",
  "COMPETITIVE_V2_V1_PERF_ARENA_DECISION",
  `  let start = Date.now();\n  await page.getByRole("button", { name: /Run Top 3/i }).click();\n  await expect(page.locator(".arena-ranked-list > div")).toHaveCount(3);\n  timings.arenaBestBuildMs = Date.now() - start;`,
  `  let start = Date.now();\n  const arenaDecision = page.getByTestId("arena-best-build" /* COMPETITIVE_V2_V1_PERF_ARENA_DECISION */);\n  await expect(arenaDecision).toBeVisible();\n  await expect(arenaDecision.getByText("NO UNIVERSAL WINNER", { exact: true })).toBeVisible();\n  await expect(arenaDecision).toContainText(/Optimizer locked|Tradeoff candidates/);\n  expect(await page.locator(".arena-ranked-list").count()).toBe(0);\n  timings.arenaBuildDecisionMs = Date.now() - start;`,
  "V1 performance Arena V2 decision surface",
);

// Test fixtures should not seed the unresolved Guild War Attunement as Arena.
replaceContract(
  "scripts/runtime-v1-release-acceptance.spec.mjs",
  "COMPETITIVE_V2_V1_GVG_ATTUNEMENT_UNKNOWN",
  `    buildReference: "", exTechnique: "Everspring Umbrella: EX", exLevel: 3, normalProfile: "PvE / Normal", arenaProfile: "Arena", gvgSelectedProfile: "ARENA",`,
  `    buildReference: "", exTechnique: "Everspring Umbrella: EX", exLevel: 3, normalProfile: "PvE / Normal", arenaProfile: "Arena", gvgSelectedProfile: "UNKNOWN", // COMPETITIVE_V2_V1_GVG_ATTUNEMENT_UNKNOWN`,
  "V1 Guild War seed Attunement UNKNOWN",
);

// Existing production migration already switches to the V2 strategy surface;
// scope the shared objective ID to the battlefield-map control as well.
replaceContract(
  "scripts/runtime-production-v1.spec.mjs",
  "COMPETITIVE_V2_PROD_GVG_OBJECTIVE_MAP_SCOPE",
  `  await expect(page.getByTestId("gvg-strategy" /* COMPETITIVE_V2_PROD_GVG_STRATEGY */)).toBeVisible();\n  await expect(page.locator('[data-objective-id="BULWARK"]')).toBeVisible();`,
  `  await expect(page.getByTestId("gvg-strategy" /* COMPETITIVE_V2_PROD_GVG_STRATEGY */)).toBeVisible();\n  await expect(page.getByTestId("gvg-objective-map" /* COMPETITIVE_V2_PROD_GVG_OBJECTIVE_MAP_SCOPE */).locator('button[data-objective-id="BULWARK"]')).toBeVisible();`,
  "production Guild War objective map scope",
);

console.log("Competitive V2 final runtime correctness and acceptance contracts applied deterministically.");
