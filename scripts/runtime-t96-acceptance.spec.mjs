import fs from "node:fs";
import { test, expect } from "@playwright/test";

const near = (value, expected, tolerance = 0.15) => Math.abs(Number(value) - expected) <= tolerance;

test("Global T96 observed runtime state exposes panel, complete-build comparison and trust diagnostics", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const response = await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("navigation", { name: "Product workspaces" })).toBeVisible();
  await expect(page.getByTestId("pve-overview")).toBeVisible();

  // Workspace V2 intentionally starts at a decision-oriented PvE overview.
  // Enter Gear before exercising the unchanged T96 runtime fixture.
  await page.getByLabel("PvE navigation").getByRole("button", { name: /^Gear/ }).click();
  const loadObserved = page.getByRole("button", { name: "Load observed T96", exact: true });
  await expect(loadObserved).toBeVisible();
  await loadObserved.click();
  await page.waitForTimeout(500);

  const hookReady = await page.evaluate(() => Boolean(window.__WWM_T96_RUNTIME_ACCEPTANCE__));
  if (!hookReady) {
    const diagnostic = {
      pageErrors,
      consoleErrors,
      context: await page.getByRole("region", { name: "Current build context" }).innerText(),
      activeRole: await page.getByRole("combobox", { name: "Current role" }).inputValue(),
      loadButtonEnabled: await loadObserved.isEnabled(),
    };
    fs.writeFileSync("runtime-smoke-diagnostic.txt", `observed-load-failed\n${JSON.stringify(diagnostic, null, 2)}\n`, "utf8");
    await page.screenshot({ path: "runtime-smoke.png", fullPage: true });
    throw new Error(`Observed T96 load did not reach runtime acceptance state: ${JSON.stringify(diagnostic)}`);
  }

  const contextText = await page.getByRole("region", { name: "Current build context" }).innerText();
  expect(contextText).toContain("Bamboocut-Dust");
  expect(contextText).toContain("4/4");

  const report = await page.evaluate(() => window.__WWM_T96_RUNTIME_ACCEPTANCE__);
  expect(report.fixture).toBe("1106-vs-1129");
  expect(report.current1106Dps).toBeGreaterThan(0);
  expect(report.candidate1129?.modeledDps).toBeGreaterThan(0);
  expect(Number.isFinite(report.candidate1129?.deltaDps)).toBeTruthy();
  expect(Number.isFinite(report.candidate1129?.deltaPct)).toBeTruthy();
  expect(report.candidate1129?.confidence).toBeTruthy();
  expect(Array.isArray(report.candidate1129?.factorDeltas)).toBeTruthy();
  expect(report.candidate1129.factorDeltas.length).toBeGreaterThan(5);

  const p = report.currentMenuPanel;
  expect(near(p.minOuter, 1614, 1)).toBeTruthy();
  expect(near(p.maxOuter, 2777, 1)).toBeTruthy();
  expect(near(p.minPz, 327, 1)).toBeTruthy();
  expect(near(p.maxPz, 835, 1)).toBeTruthy();
  expect(near(p.prec, 122.1)).toBeTruthy();
  expect(near(p.crit, 132.5)).toBeTruthy();
  expect(near(p.aff, 17.8)).toBeTruthy();
  expect(near(p.dcrit, 4.6)).toBeTruthy();
  expect(near(p.outerPen, 43.5)).toBeTruthy();
  expect(near(p.critDmg, 54.0)).toBeTruthy();
  expect(near(p.allArts, 5.6)).toBeTruthy();
  expect(near(p.umbMartial, 5.8)).toBeTruthy();
  expect(near(p.attunedBonus, 20.0)).toBeTruthy();

  const deltas = Object.fromEntries((report.candidate1129.panelDelta || []).map((row) => [row.label, row.delta]));
  const candidate = {
    minOuter: p.minOuter + (deltas["Min Physical ATK"] || 0),
    maxOuter: p.maxOuter + (deltas["Max Physical ATK"] || 0),
    minPz: p.minPz + (deltas["Min Attribute ATK"] || 0),
    maxPz: p.maxPz + (deltas["Max Attribute ATK"] || 0),
    prec: p.prec + (deltas.Precision || 0),
    crit: p.crit + (deltas.Critical || 0),
    aff: p.aff + (deltas.Affinity || 0),
    umbMartial: p.umbMartial + (deltas["Specified Weapon Martial"] || 0),
    attunedBonus: p.attunedBonus + (deltas["Everspring Attunement"] || 0),
  };
  expect(near(candidate.minOuter, 1719, 1)).toBeTruthy();
  expect(near(candidate.maxOuter, 2784, 1)).toBeTruthy();
  expect(near(candidate.minPz, 363, 1)).toBeTruthy();
  expect(near(candidate.maxPz, 800, 1)).toBeTruthy();
  expect(near(candidate.prec, 115.5)).toBeTruthy();
  expect(near(candidate.crit, 131.1)).toBeTruthy();
  expect(near(candidate.aff, 17.8)).toBeTruthy();
  expect(near(candidate.umbMartial, 5.8)).toBeTruthy();
  expect(near(candidate.attunedBonus, 20.2)).toBeTruthy();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  const acceptance = { ...report, candidateMenuPanel: candidate };
  fs.writeFileSync("runtime-smoke-report.json", `${JSON.stringify(acceptance, null, 2)}\n`, "utf8");
  fs.writeFileSync("runtime-smoke-diagnostic.txt", `completed\n${JSON.stringify(acceptance, null, 2)}\n`, "utf8");
  await page.screenshot({ path: "runtime-smoke.png", fullPage: true });
});


test("Every visible PvE Path survives selection and a saved-path refresh", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4173/#pve/build", { waitUntil: "networkidle" });
  const paths = await page.locator(".build-path-list button strong").allTextContents();
  expect(paths.length).toBeGreaterThanOrEqual(8);
  for (const path of paths) {
    await page.locator(".build-path-list button").filter({ hasText: path }).click();
    await expect(page.locator(".build-summary-band strong")).toHaveText(path);
  }
  await page.locator(".build-path-list button").filter({ hasText: "Silkbind-Jade" }).click();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".build-summary-band strong")).toHaveText("Silkbind-Jade");
  await expect(page.locator("body")).not.toContainText("NaN");
  expect(errors).toEqual([]);
});


test("Advanced PvE tools remain reachable with current roll units and historical count units", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4173/#pve/gear", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Load observed T96", exact: true }).click();
  await page.locator(".workspace-advanced-nav summary").click();
  await page.getByRole("button", { name: /^Stat Priority/ }).click();
  await expect(page.getByRole("heading", { name: /Stat Priority — Modeled Impact/ })).toBeVisible();
  await expect(page.locator(".analysis-workspace-detail")).toContainText("percentage points");
  const critGain = page.locator(".analysis-workspace-detail div.flex").filter({ has: page.locator("span", { hasText: /^Crit Rate$/ }) }).first();
  await expect(critGain).toContainText("+9%");
  const penGain = page.locator(".analysis-workspace-detail div.flex").filter({ has: page.locator("span", { hasText: /^Formless Pen$/ }) }).first();
  await expect(penGain).toContainText("+13");
  for (const [route, heading] of [["cultivate", /Cultivation Summary/], ["transmute", /Transmute/], ["bis", /Best-in-Slot|BiS Gear|Build Reference/i]]) {
    await page.goto(`http://127.0.0.1:4173/#pve/${route}`, { waitUntil: "networkidle" });
    await expect(page.locator(".analysis-workspace-detail")).toBeVisible();
    await expect(page.locator(".analysis-workspace-detail")).toContainText(heading);
  }
  await page.goto("http://127.0.0.1:4173/#pve/cultivate", { waitUntil: "networkidle" });
  await expect(page.locator(".analysis-workspace-detail")).toContainText("95下 max-roll units");
  const expectedCount = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("wwm_chars_v3"));
    const character = data.chars.find((item) => item.id === data.activeCharId);
    const gear = character.schemes.find((item) => item.id === data.activeSchemeId).gear;
    return (gear.filter((item) => item.isEquipped).flatMap((item) => item.subs).filter((sub) => sub.type === "Max Phys Atk").reduce((sum, sub) => sum + parseFloat(sub.val), 0) / 63.8).toFixed(2);
  });
  const maxAttackTile = page.locator(".analysis-workspace-detail div.border.rounded-xl.p-5").filter({ has: page.locator("span", { hasText: /^Max Phys Atk$/ }) });
  await expect(maxAttackTile).toContainText(expectedCount + " rolls");

  expect(errors).toEqual([]);
});


test("Invalid shell storage and routes fall back without losing build data", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4173/#pve/gear", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Load observed T96", exact: true }).click();
  const builds = await page.evaluate(() => localStorage.getItem("wwm_chars_v3"));
  for (const raw of ["null", "[]", JSON.stringify({ workspace: "missing", pveView: "missing", gvgView: "missing" })]) {
    await page.evaluate((raw) => localStorage.setItem("wwm_product_shell_v2", raw), raw);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("navigation", { name: "Product workspaces" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("wwm_chars_v3"))).toBe(builds);
  }
  for (const route of ["#pve/missing-tool", "#gvg/missing-tool"]) {
    await page.goto("http://127.0.0.1:4173/" + route, { waitUntil: "networkidle" });
    await expect(page.getByTestId(route.startsWith("#pve") ? "pve-overview" : "gvg-overview")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
