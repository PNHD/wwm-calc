import fs from "node:fs";

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, source) { fs.writeFileSync(path, source, "utf8"); }
function replaceContract(path, marker, before, after, label) {
  let source = read(path);
  if (source.includes(marker)) return;
  if (!source.includes(before)) throw new Error(`Competitive V2 final2: ${label} anchor missing`);
  source = source.replace(before, after);
  if (!source.includes(marker)) throw new Error(`Competitive V2 final2: ${label} marker missing after patch`);
  write(path, source);
}

// The V1 hardening generator creates this sanitizer before Competitive V2 runs.
// Make the patch tolerant of formatting/generator ordering while still failing if
// neither the unsafe nor safe contract exists. UNKNOWN must never alias to ARENA.
{
  const path = "src/gvg/model.js";
  const marker = "COMPETITIVE_V2_GVG_ATTUNEMENT_SANITIZER_UNKNOWN";
  let source = read(path);
  if (!source.includes(marker)) {
    const unsafe = /gvgSelectedProfile:\s*member\.gvgSelectedProfile\s*===\s*"NORMAL"\s*\?\s*"NORMAL"\s*:\s*"ARENA"\s*,/;
    if (!unsafe.test(source)) {
      if (/gvgSelectedProfile:[^\n]*UNKNOWN/.test(source)) {
        source = source.replace(/(gvgSelectedProfile:[^\n]*UNKNOWN[^\n]*,)/, `$1 // ${marker}`);
      } else {
        throw new Error("Competitive V2 final2: generated Guild War Attunement sanitizer contract missing");
      }
    } else {
      source = source.replace(unsafe, `gvgSelectedProfile: member.gvgSelectedProfile === "NORMAL" || member.gvgSelectedProfile === "ARENA" ? member.gvgSelectedProfile : "UNKNOWN", // ${marker}`);
    }
    if (!source.includes(marker)) throw new Error("Competitive V2 final2: Guild War Attunement sanitizer marker missing");
    write(path, source);
  }
}

// Arena V2 history must retain the actual mode taxonomy. The legacy sanitizer
// used to collapse all V2 mode IDs to 1v1, merging incompatible mode records.
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
// A one-shot seed prevents the persistence test from deleting its own history.
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

// Repeated labels/objective IDs are intentional in the War Room. Scope browser
// checks to their semantic surfaces rather than requiring global uniqueness.
replaceContract(
  "scripts/runtime-gvg-acceptance.spec.mjs",
  "COMPETITIVE_V2_GVG_TIMELINE_SCOPE",
  `  await expect(page.getByTestId("gvg-timeline")).toBeVisible();\n  await expect(page.getByText("OUTPOST PHASE", { exact: true })).toBeVisible();\n  await expect(page.getByText("3:00", { exact: true })).toBeVisible();`,
  `  const timelineSurface = page.getByTestId("gvg-timeline" /* COMPETITIVE_V2_GVG_TIMELINE_SCOPE */);\n  await expect(timelineSurface).toBeVisible();\n  await expect(timelineSurface.getByText("OUTPOST PHASE", { exact: true })).toBeVisible();\n  await expect(timelineSurface.getByText("3:00", { exact: true })).toBeVisible();`,
  "Guild War timeline label scope",
);
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
// decision surface, never resurrect the removed weighted Top-3 optimizer.
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
replaceContract(
  "scripts/runtime-v1-release-acceptance.spec.mjs",
  "COMPETITIVE_V2_V1_GVG_ATTUNEMENT_UNKNOWN",
  `    buildReference: "", exTechnique: "Everspring Umbrella: EX", exLevel: 3, normalProfile: "PvE / Normal", arenaProfile: "Arena", gvgSelectedProfile: "ARENA",`,
  `    buildReference: "", exTechnique: "Everspring Umbrella: EX", exLevel: 3, normalProfile: "PvE / Normal", arenaProfile: "Arena", gvgSelectedProfile: "UNKNOWN", // COMPETITIVE_V2_V1_GVG_ATTUNEMENT_UNKNOWN`,
  "V1 Guild War seed Attunement UNKNOWN",
);

// Production smoke uses the V2 strategy map after the earlier runtime-fix pass.
replaceContract(
  "scripts/runtime-production-v1.spec.mjs",
  "COMPETITIVE_V2_PROD_GVG_OBJECTIVE_MAP_SCOPE",
  `  await expect(page.getByTestId("gvg-strategy" /* COMPETITIVE_V2_PROD_GVG_STRATEGY */)).toBeVisible();\n  await expect(page.locator('[data-objective-id="BULWARK"]')).toBeVisible();`,
  `  await expect(page.getByTestId("gvg-strategy" /* COMPETITIVE_V2_PROD_GVG_STRATEGY */)).toBeVisible();\n  await expect(page.getByTestId("gvg-objective-map" /* COMPETITIVE_V2_PROD_GVG_OBJECTIVE_MAP_SCOPE */).locator('button[data-objective-id="BULWARK"]')).toBeVisible();`,
  "production Guild War objective map scope",
);

console.log("Competitive V2 final generator-safe runtime correctness and acceptance contracts applied deterministically.");
