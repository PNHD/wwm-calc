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
  const loadObserved = page.getByRole("button", { name: /Load observed T96/i });
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
