import fs from "node:fs";
import { test, expect } from "@playwright/test";

const base = process.env.PRODUCTION_URL || "https://wonton-wwm.pages.dev/";
const targetSha = process.env.EXPECTED_SHA || process.env.TARGET_SHA || "";

async function noOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport + 1);
}

async function buildInfo(request) {
  const response = await request.get(`${base}build-info.json?final-extra=${Date.now()}`, { timeout: 15000 });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

const liveGvgWorkspace = {
  roster: [{ id: "live-1", name: "Live Player", roles: ["MAIN_BALL"], availability: true }],
  strategy: { positions: { "live-1": { x: 50, y: 50 } }, arrows: [], rallyPoints: [] },
  timeline: [],
  commander: { startingCoins: 12, events: [] },
  matchLogs: [],
};

test("Competitive Modes V2 final production coverage", async ({ page, request }) => {
  test.setTimeout(8 * 60 * 1000);
  if (!targetSha) throw new Error("EXPECTED_SHA/TARGET_SHA is required");

  const info = await buildInfo(request);
  expect(info.commit).toBe(targetSha);
  expect(info.branch).toBe("main");

  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  const checks = {
    pve: false,
    arenaModeSelector390: false,
    guildWarOverview: false,
    guildWarRoster: false,
    guildWarStrategy: false,
    guildWarTimeline: false,
    guildWarObjectives: false,
    guildWarCommander: false,
    guildWarPhaseModel: false,
    guildWarUnknownGuards: false,
    guildWarNoPostDeathImmobilize: false,
    libraryArenaReference: false,
    libraryGvgReferences: false,
    libraryReadOnlyCloneIsolation: false,
    mobile390: false,
    workspaceSwitch390: false,
    noHorizontalOverflow: false,
    noFixedNavInterception: false,
  };

  await page.goto(`${base}#pve/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("pve-overview")).toBeVisible();
  checks.pve = true;

  await page.goto(`${base}#gvg/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("guild-war-workspace")).toBeVisible();
  await expect(page.getByTestId("gvg-overview")).toBeVisible();
  await expect(page.getByTestId("gvg-phase-context")).toBeVisible();
  await expect(page.getByText(/Guild War Attunement = UNKNOWN/i)).toBeVisible();
  await expect(page.getByText(/No universal GvG score/i)).toBeVisible();
  checks.guildWarOverview = true;
  checks.guildWarPhaseModel = true;

  await page.goto(`${base}#gvg/roster`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-roster")).toBeVisible();
  checks.guildWarRoster = true;

  await page.goto(`${base}#gvg/strategy`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-strategy")).toBeVisible();
  await expect(page.locator('[data-objective-id="BULWARK"]')).toBeVisible();
  await expect(page.locator('[data-objective-id="GOOSE"]')).toBeVisible();
  checks.guildWarStrategy = true;

  await page.goto(`${base}#gvg/timeline`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-timeline")).toBeVisible();
  await expect(page.getByLabel("Halftime trigger override")).toHaveAttribute("placeholder", "UNKNOWN");
  checks.guildWarTimeline = true;

  await page.goto(`${base}#gvg/objectives`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-objectives")).toBeVisible();
  await expect(page.getByText(/Exact BULWARK DR-per-stack is not published/i)).toBeVisible();
  checks.guildWarObjectives = true;

  await page.goto(`${base}#gvg/commander`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-commander")).toBeVisible();
  await expect(page.getByLabel("Command cost override")).toHaveAttribute("placeholder", "UNKNOWN");
  await expect(page.getByLabel("Command cooldown override")).toHaveAttribute("placeholder", "UNKNOWN");
  checks.guildWarCommander = true;
  checks.guildWarUnknownGuards = true;

  await page.goto(`${base}#gvg/builds`, { waitUntil: "networkidle" });
  const builds = page.getByTestId("gvg-builds");
  await expect(builds).toBeVisible();
  await expect(builds.getByText(/Post-death Immobilize/i)).toBeVisible();
  await expect(builds.getByText("NO", { exact: true })).toBeVisible();
  await expect(builds.getByText(/Do not select “Guild War: Arena” or “Guild War: Normal” automatically/i)).toBeVisible();
  checks.guildWarNoPostDeathImmobilize = true;

  await page.goto(`${base}#library/arena`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await expect(page.locator('[data-library-id="bamboocut-dust-arena-control-pressure"]')).toBeVisible();
  checks.libraryArenaReference = true;

  await page.goto(`${base}#library/gvg-builds`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await expect(page.getByText("Bamboocut-Dust GvG", { exact: true })).toBeVisible();
  await page.goto(`${base}#library/gvg-plans`, { waitUntil: "networkidle" });
  await expect(page.getByText("Balanced Guild War Roster Template", { exact: true })).toBeVisible();
  await expect(page.getByText("Example Guild War Strategy", { exact: true })).toBeVisible();
  checks.libraryGvgReferences = true;

  await page.evaluate((workspace) => {
    localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify(workspace));
    localStorage.removeItem("wwm_library_gvg_clones_v1");
  }, liveGvgWorkspace);
  const liveBefore = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));
  await page.goto(`${base}#library/build/balanced-guild-war-roster-template`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-build-detail")).toBeVisible();
  await expect(page.getByText(/read-only/i).first()).toBeVisible();
  await page.getByRole("button", { name: /^Clone to My Workspace$/ }).click();
  const liveAfter = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));
  expect(liveAfter).toBe(liveBefore);
  const clones = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_library_gvg_clones_v1") || "[]"));
  expect(clones.length).toBeGreaterThanOrEqual(1);
  expect(clones.some((clone) => clone.sourceEntryId === "balanced-guild-war-roster-template")).toBeTruthy();
  checks.libraryReadOnlyCloneIsolation = true;

  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(`${base}#pve/overview`, { waitUntil: "networkidle" });
  await expect(page.getByRole("navigation", { name: "PvE mobile navigation" })).toBeVisible();
  await noOverflow(page);

  await page.goto(`${base}#arena/overview`, { waitUntil: "networkidle" });
  const arenaMobile = page.getByRole("navigation", { name: "Arena mobile navigation" });
  await expect(arenaMobile).toBeVisible();
  const modePicker = page.getByLabel("Arena mode").first();
  await expect(modePicker).toBeVisible();
  await modePicker.getByRole("button", { name: "Perception Forest", exact: true }).click();
  await expect(page.getByTestId("perception-forest-rules")).toBeVisible();
  await expect(page.getByText(/Mode-specific effects are isolated/i)).toBeVisible();
  checks.arenaModeSelector390 = true;
  await noOverflow(page);

  // Click the fixed bottom navigation at mobile width. If it intercepts or is
  // covered by another layer, Playwright's actionability checks fail here.
  await arenaMobile.getByRole("button", { name: /Matchups/i }).click();
  await expect(page.getByTestId("arena-matchup-result")).toBeVisible();
  expect(new URL(page.url()).hash).toBe("#arena/matchups");

  // Exercise the actual product workspace switch at 390px from Arena → GvG,
  // then the ProductShell switch GvG → PvE.
  const arenaWorkspaceSwitcher = page.getByRole("navigation", { name: "Product workspaces" });
  await expect(arenaWorkspaceSwitcher).toBeVisible();
  await arenaWorkspaceSwitcher.getByRole("button", { name: /^Guild War/ }).click();
  await expect(page.getByTestId("gvg-overview")).toBeVisible();
  const gvgWorkspaceSwitcher = page.getByRole("navigation", { name: "Product workspaces" });
  await expect(gvgWorkspaceSwitcher).toBeVisible();
  await gvgWorkspaceSwitcher.getByRole("button", { name: /^PvE/ }).click();
  await expect(page.getByTestId("pve-overview")).toBeVisible();
  checks.workspaceSwitch390 = true;

  await page.goto(`${base}#gvg/overview`, { waitUntil: "networkidle" });
  const gvgMobile = page.getByRole("navigation", { name: "Guild War mobile navigation" });
  await expect(gvgMobile).toBeVisible();
  await gvgMobile.getByRole("button", { name: /^Roster$/ }).click();
  await expect(page.getByTestId("gvg-roster")).toBeVisible();
  expect(new URL(page.url()).hash).toBe("#gvg/roster");
  await noOverflow(page);

  await page.goto(`${base}#library`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await noOverflow(page);

  checks.mobile390 = true;
  checks.noHorizontalOverflow = true;
  checks.noFixedNavInterception = true;

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  const success = Object.values(checks).every(Boolean) && pageErrors.length === 0 && consoleErrors.length === 0;
  const report = {
    success,
    verifiedAt: new Date().toISOString(),
    productionUrl: base,
    expectedSha: targetSha,
    productionCommit: info.commit,
    productionBranch: info.branch,
    exactShaMatch: info.commit === targetSha,
    checks,
    pageErrors,
    consoleErrors,
  };
  fs.writeFileSync("FINAL_EXTRA_PRODUCTION_SMOKE.json", JSON.stringify(report, null, 2), "utf8");
  await page.screenshot({ path: "final-extra-production-mobile-390.png", fullPage: true });
  expect(success).toBeTruthy();
});
