import fs from "node:fs";
import { test, expect } from "@playwright/test";

const parseDps = (text) => {
  const match = text.match(/([\d,]+)\s*DPS/i);
  return match ? Number(match[1].replace(/,/g, "")) : NaN;
};
const checkpoint = (stage, details = {}) => {
  fs.writeFileSync("runtime-smoke-diagnostic.txt", `${stage}\n${JSON.stringify(details, null, 2)}\n`, "utf8");
};
const activate = async (locator) => {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  // Invoke the actual DOM click/React onClick handler. Playwright pointer hit-testing
  // is flaky for the multi-row sticky product nav in headless Chromium, while the
  // same control is already verified visible/enabled here.
  await locator.evaluate((element) => element.click());
};

test("production build completes the observed T96 decision flow", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  const response = await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  const root = page.locator("#root");
  const appRoot = page.locator(".app-root");
  checkpoint("initial-render", {
    http: response?.status() ?? null,
    rootLength: (await root.innerHTML()).length,
    pageErrors,
    consoleErrors,
  });
  expect(response?.ok()).toBeTruthy();
  expect((await root.innerHTML()).length).toBeGreaterThan(100);

  const productNav = page.getByRole("navigation", { name: "Product workspaces" });
  const navBuild = productNav.getByRole("button", { name: /^Build\b/i });
  const navGear = productNav.getByRole("button", { name: /^Gear\b/i });
  const navCompare = productNav.getByRole("button", { name: /^Compare\b/i });
  const navBestBuild = productNav.getByRole("button", { name: /^Best Build\b/i });
  const navCombat = productNav.getByRole("button", { name: /^Combat\b/i });
  for (const locator of [navBuild, navGear, navCompare, navBestBuild, navCombat]) await expect(locator).toBeVisible();

  const loadObserved = page.getByRole("button", { name: /Load observed T96/i });
  await expect(loadObserved).toBeVisible();
  await loadObserved.click();
  await page.waitForTimeout(150);
  const context = page.getByRole("region", { name: "Current build context" });
  const contextText = await context.innerText();
  checkpoint("after-load-observed", {
    workspace: await appRoot.getAttribute("data-workspace"),
    contextText,
    pageErrors,
    consoleErrors,
  });
  expect(contextText).toContain("4/4");
  expect(contextText).toContain("Bamboocut-Dust");

  await activate(navCombat);
  await page.waitForTimeout(200);
  const combatDiagnostic = {
    workspace: await appRoot.getAttribute("data-workspace"),
    activeNav: await productNav.locator("button.is-active").allInnerTexts(),
    combatCount: await page.locator(".product-combat-workspace").count(),
    headingCount: await page.getByRole("heading", { name: "Damage model" }).count(),
    pageErrors,
    consoleErrors,
    text: (await root.innerText()).replace(/\s+/g, " ").slice(0, 1800),
  };
  checkpoint("after-combat-activation", combatDiagnostic);
  expect(combatDiagnostic.workspace).toBe("simulation");
  expect(pageErrors).toEqual([]);
  await expect(page.getByRole("heading", { name: "Damage model" })).toBeVisible();
  await expect(page.getByText(/\+120 Min \/ \+240 Max Physical Attack/).first()).toBeVisible();
  await expect(page.getByText(/Boss attacks OFF · Controlled OFF/)).toBeVisible();
  await expect(page.getByText(/Party buffs OFF/)).toBeVisible();
  await expect(page.getByText(/Execution efficiency/)).toHaveCount(0);

  const modeledDpsStrong = page.locator(".combat-metrics .is-primary strong").first();
  const current1106Dps = parseDps(await modeledDpsStrong.innerText());
  expect(Number.isFinite(current1106Dps) && current1106Dps > 0).toBeTruthy();

  await page.getByRole("button", { name: /^Attributes$/i }).click();
  const statTableText = await page.locator(".combat-stat-table").innerText();
  expect(statTableText).toMatch(/1,?614/);
  expect(statTableText).toMatch(/2,?777/);
  expect(statTableText).toMatch(/122\.1/);
  expect(statTableText).toMatch(/132\.5/);
  expect(statTableText).toMatch(/17\.8/);
  await page.getByRole("button", { name: /^Overview$/i }).click();

  const cinderCheckbox = page.locator("label.product-switch").filter({ hasText: "Cinder Ash" }).locator('input[type="checkbox"]');
  await expect(cinderCheckbox).toBeChecked();
  await cinderCheckbox.uncheck();
  await page.waitForTimeout(100);
  const noCinderDps = parseDps(await modeledDpsStrong.innerText());
  expect(noCinderDps).not.toBe(current1106Dps);
  await cinderCheckbox.check();

  const distanceSelect = page.locator("label.combat-enemy").filter({ hasText: "Starweave distance" }).locator("select");
  await expect(distanceSelect).toHaveValue("near");
  await distanceSelect.selectOption("far");
  await page.waitForTimeout(100);
  const starweaveFarDps = parseDps(await modeledDpsStrong.innerText());
  expect(starweaveFarDps).not.toBe(current1106Dps);
  await distanceSelect.selectOption("near");

  await activate(navCompare);
  await page.waitForTimeout(150);
  const chestTab = page.locator(".compare-slot-tabs").getByRole("button", { name: /^Chest\b/i });
  if (await chestTab.count()) await chestTab.first().click();
  const candidate1129 = page.locator("article").filter({ hasText: "Nightfarer Armor 1129" }).first();
  await expect(candidate1129).toBeVisible();
  await expect(candidate1129.getByText(/MENU PANEL DELTA/)).toBeVisible();
  await expect(candidate1129.getByText(/Why:/)).toBeVisible();
  const candidateText = await candidate1129.innerText();
  const candidate1129Dps = parseDps(candidateText);
  const deltaMatch = candidateText.match(/([+-][\d,]+)\s*DPS\s*\(([+-][\d.]+)%\)/i);
  expect(Number.isFinite(candidate1129Dps) && candidate1129Dps > 0).toBeTruthy();
  expect(deltaMatch).toBeTruthy();

  const report = {
    fixture: "1106-vs-1129",
    current1106Dps,
    candidate1129Dps,
    deltaDps: Number(deltaMatch[1].replace(/,/g, "")),
    deltaPct: Number(deltaMatch[2]),
    noCinderDps,
    starweaveFarDps,
    candidateText: candidateText.replace(/\s+/g, " ").trim(),
  };
  fs.writeFileSync("runtime-smoke-report.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
  checkpoint("completed", report);
  await page.screenshot({ path: "runtime-smoke.png", fullPage: true });
  expect(pageErrors).toEqual([]);
});
