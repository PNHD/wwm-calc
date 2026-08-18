import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { defaultArenaState } from "../src/arena/arena-core.mjs";

const base = process.env.PRODUCTION_URL || "https://wonton-wwm.pages.dev/";
const expectedSha = process.env.EXPECTED_SHA || "";

async function waitForExactDeployment(request) {
  const deadline = Date.now() + 8 * 60 * 1000;
  let last = null;
  while (Date.now() < deadline) {
    try {
      const response = await request.get(`${base}build-info.json?verify=${Date.now()}`, { timeout: 15000 });
      if (response.ok()) {
        last = await response.json();
        if (last?.commit === expectedSha) return last;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Cloudflare Pages did not reach exact SHA ${expectedSha}; last observed=${last?.commit || "unavailable"}`);
}

async function seedArena(page) {
  const state = defaultArenaState();
  state.onboardingComplete = true;
  await page.addInitScript((value) => {
    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(value));
    localStorage.removeItem("wwm_arena_history_v1");
  }, state);
}

async function assertNoHorizontalOverflow(page) {
  const sizes = await page.evaluate(() => ({ inner: window.innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.inner + 1);
}

test("production is exact-main-SHA and critical Arena smoke passes", async ({ page, request }) => {
  test.setTimeout(10 * 60 * 1000);
  if (!expectedSha) throw new Error("EXPECTED_SHA is required for production verification");

  const buildInfo = await waitForExactDeployment(request);
  expect(buildInfo.commit).toBe(expectedSha);
  await seedArena(page);

  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto(`${base}#pve/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("pve-overview")).toBeVisible();

  await page.goto(`${base}#arena/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-overview")).toBeVisible();
  await expect(page.getByText("Bamboocut-Dust", { exact: true }).first()).toBeVisible();

  await page.goto(`${base}#arena/build`);
  await expect(page.getByTestId("arena-build")).toBeVisible();

  await page.goto(`${base}#arena/attunement`);
  await expect(page.getByTestId("arena-attunement")).toBeVisible();
  await expect(page.getByText(/stacking = OFF/i)).toBeVisible();

  await page.goto(`${base}#arena/matchups`);
  await expect(page.getByTestId("arena-matchup-result")).toBeVisible();
  await expect(page.getByText(/not an empirical win probability/i)).toBeVisible();

  await page.goto(`${base}#arena/simulation`);
  await expect(page.getByTestId("arena-simulation")).toBeVisible();
  await expect(page.getByText("GET_UP_PROTECTION", { exact: true })).toBeVisible();

  await page.goto(`${base}#arena/overview`);
  await page.getByRole("button", { name: "3v3", exact: true }).click();
  await page.goto(`${base}#arena/matchups`);
  await expect(page.getByTestId("arena-3v3-composition")).toBeVisible();
  await expect(page.getByText(/same Martial Art ≤ 2/i)).toBeVisible();

  await page.goto(`${base}#library/arena`, { waitUntil: "networkidle" });
  const card = page.locator('[data-library-id="bamboocut-dust-arena-control-pressure"]');
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "View", exact: true }).click();
  await expect(page.getByTestId("library-build-detail")).toBeVisible();
  const beforeClone = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}"));
  await page.getByRole("button", { name: /Clone to My Workspace/i }).click();
  const afterClone = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}"));
  expect(afterClone.activeProfileId).toBe(beforeClone.activeProfileId);
  expect(afterClone.profiles.length).toBe(beforeClone.profiles.length + 1);

  await page.goto(`${base}#arena/transfer`);
  await page.getByRole("button", { name: /Generate read-only share/i }).click();
  const shareLink = await page.getByLabel("Arena share token").inputValue();
  await page.goto(shareLink, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-shared-landing")).toBeVisible();

  await page.goto(`${base}#arena/history`);
  await page.getByLabel("Result").selectOption("WIN");
  await page.getByLabel("Notes").fill("Production verification fixture");
  await page.getByRole("button", { name: /Save local match/i }).click();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Production verification fixture", { exact: true })).toBeVisible();

  await page.goto(`${base}#gvg/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-overview")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}#arena/matchups`);
  await expect(page.getByRole("navigation", { name: "Arena mobile navigation" })).toBeVisible();
  await assertNoHorizontalOverflow(page);

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
    checks: {
      pveUnchanged: true,
      arenaOverview: true,
      arenaBuild: true,
      arenaAttunementSeparated: true,
      matchupComparison: true,
      stateSimulation: true,
      bamboocutProfile: true,
      team3v3Validation: true,
      arenaLibraryReadOnlyAndCloneIsolated: true,
      arenaShareLanding: true,
      historyPersistence: true,
      guildWarUnchanged: true,
      mobile390NoOverflow: true
    },
    pageErrors,
    consoleErrors
  };
  fs.writeFileSync("production-verification.json", JSON.stringify(report, null, 2), "utf8");
  await page.screenshot({ path: "production-arena-smoke.png", fullPage: true });
});
