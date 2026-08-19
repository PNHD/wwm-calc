import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { defaultArenaState } from "../src/arena/arena-core.mjs";
import { defaultWorkspace } from "../src/gvg/model.js";

const base = process.env.PRODUCTION_URL || "https://wonton-wwm.pages.dev/";
const expectedSha = process.env.EXPECTED_SHA || "";

async function waitForExactDeployment(request) {
  const deadline = Date.now() + 8 * 60 * 1000;
  let last = null;
  while (Date.now() < deadline) {
    try {
      const response = await request.get(`${base}build-info.json?v=${Date.now()}`, { timeout: 15000 });
      if (response.ok()) {
        last = await response.json();
        if (last?.commit === expectedSha) return last;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Cloudflare Pages did not reach exact SHA ${expectedSha}; last observed=${last?.commit || "unavailable"}`);
}

function seedGvg() {
  const workspace = defaultWorkspace();
  workspace.roster = Array.from({ length: 30 }, (_, index) => ({
    id: `prod-${index + 1}`, name: `Player ${String(index + 1).padStart(2, "0")}`, path: "Bamboocut - Dust",
    weapons: ["Everspring Umbrella", "Unfettered Rope Dart"], roles: [index % 6 === 0 ? "HEALER" : "MAIN_BALL"], team: index < 15 ? "Main Ball" : "Flex",
    buildReference: "", exTechnique: "Everspring Umbrella: EX", exLevel: 3, normalProfile: "PvE / Normal", arenaProfile: "Arena", gvgSelectedProfile: "UNKNOWN" /* COMPETITIVE_V2_PROD_GVG_ATTUNEMENT_UNKNOWN */,
    availability: true, notes: "", antiHeal: true, aoeCc: index % 3 === 0,
  }));
  workspace.strategy.positions = Object.fromEntries(workspace.roster.map((member, index) => [member.id, { x: 10 + (index % 6) * 15, y: 10 + Math.floor(index / 6) * 17 }]));
  workspace.timeline = [{ id: "prod-opening", label: "Opening", timeSeconds: 180, type: "PLAN" }];
  return workspace;
}

async function noOverflow(page) {
  const size = await page.evaluate(() => ({ width: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(size.html).toBeLessThanOrEqual(size.width + 1);
  expect(size.body).toBeLessThanOrEqual(size.width + 1);
}

test("production is exact main SHA and V1 critical surfaces pass", async ({ page, request }) => {
  test.setTimeout(10 * 60 * 1000);
  if (!expectedSha) throw new Error("EXPECTED_SHA is required for production verification");
  const buildInfo = await waitForExactDeployment(request);
  expect(buildInfo.commit).toBe(expectedSha);

  const arena = defaultArenaState(); arena.onboardingComplete = true;
  const gvg = seedGvg();
  await page.addInitScript(({ arena, gvg }) => {
    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(arena));
    localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify(gvg));
    localStorage.removeItem("wwm_arena_history_v1");
  }, { arena, gvg });

  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto(`${base}#pve/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("pve-overview")).toBeVisible();
  await expect(page.getByTestId("model-about")).toBeVisible();
  await page.goto(`${base}#pve/gear`, { waitUntil: "networkidle" });
  await expect(page.getByLabel("PvE navigation").getByRole("button", { name: /^Gear/ })).toHaveAttribute("aria-current", "page");
  const observed = page.getByRole("button", { name: /Load observed T96/i });
  if (await observed.count()) { await observed.click(); await page.waitForTimeout(250); }
  await page.goto(`${base}#pve/best-build`, { waitUntil: "networkidle" });
  await expect(page.getByLabel("PvE navigation").getByRole("button", { name: /^Best Build/ })).toHaveAttribute("aria-current", "page");

  await page.goto(`${base}#arena/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-overview")).toBeVisible();
  await page.goto(`${base}#arena/matchups`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-matchup-result")).toBeVisible();
  await expect(page.getByText(/not an empirical win probability/i)).toBeVisible();

  const arenaBeforeTraining = await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"));
  await page.goto(`${base}#training-terrace/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("training-terrace-workspace")).toBeVisible();
  await page.getByLabel("Target or dummy label").fill("Production training dummy");
  await page.getByLabel("HP baseline").fill("100");
  await page.getByLabel("HP after").fill("125");
  await expect(page.getByText("+25 (+25.00%)")).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByLabel("Target or dummy label")).toHaveValue("Production training dummy");
  expect(await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"))).toBe(arenaBeforeTraining);

  await page.goto(`${base}#gvg/roster`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-roster")).toBeVisible();
  await expect(page.getByLabel("Player name")).toHaveCount(30);
  await page.goto(`${base}#gvg/strategy`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-strategy" /* COMPETITIVE_V2_PROD_GVG_STRATEGY */)).toBeVisible();
  await expect(page.getByTestId("gvg-objective-map" /* COMPETITIVE_V2_PROD_GVG_OBJECTIVE_MAP_SCOPE */).locator('button[data-objective-id="BULWARK"]')).toBeVisible();

  await page.goto(`${base}#library`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  const libraryResponse = await request.get(`${base}data/library-v1.json?verify=${Date.now()}`);
  expect(libraryResponse.ok()).toBeTruthy();
  const libraryDocument = await libraryResponse.json();
  const envelope = { schemaVersion: 2, kind: "PVE_BUILD", sharedAt: new Date().toISOString(), source: "LIBRARY", entry: libraryDocument.items[0] };
  const token = Buffer.from(JSON.stringify(envelope), "utf8").toString("base64url");
  await page.goto(`${base}#shared-build=${token}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-landing")).toBeVisible();

  await page.evaluate(() => {
    localStorage.removeItem("wwm_gvg_workspace_v1__recovery_backup_v1");
    localStorage.setItem("wwm_gvg_workspace_v1", "{");
  });
  await page.goto(`${base}#gvg/roster`, { waitUntil: "networkidle" });
  await expect(page.getByText(/Some saved Guild War data could not be loaded/i)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"))).toBe("{");
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1__recovery_backup_v1"))).toBe("{");

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["#pve/gear", "#arena/matchups", "#training-terrace/overview", "#gvg/roster", `#shared-build=${token}`]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await noOverflow(page);
  }
  await expect(page.getByTestId("shared-build-landing")).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  const report = {
    success: true,
    verifiedAt: new Date().toISOString(),
    productionUrl: base,
    expectedSha,
    productionCommit: buildInfo.commit,
    exactShaMatch: buildInfo.commit === expectedSha,
    productionBranch: buildInfo.branch,
    browserSmoke: { pve: true, arena: true, trainingTerrace: true, trainingRoute: true, trainingInput: true, trainingDelta: true, trainingReloadPersistence: true, arenaTrainingIsolation: true, guildWar: true, library: true, pageErrors, consoleErrors },
    mobile390: { pveGear: true, arenaMatchup: true, trainingTerrace: true, guildWarRoster: true, libraryShared: true, noHorizontalOverflow: true },
    migrationSmoke: { guildWarCorruptStorageRecovered: true, originalPreservedBeforeEdit: true, backupPreserved: true },
    securitySmoke: { versionedReadOnlyLibraryShare: true },
  };
  fs.writeFileSync("V1_PRODUCTION_SMOKE.json", JSON.stringify(report, null, 2), "utf8");
  await page.screenshot({ path: "v1-production-mobile-smoke.png", fullPage: true });
});
