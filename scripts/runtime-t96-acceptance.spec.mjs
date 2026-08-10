import fs from "node:fs";
import { test, expect } from "@playwright/test";

const parseDps = (text) => {
  const match = text.match(/([\d,]+)\s*DPS/i);
  return match ? Number(match[1].replace(/,/g, "")) : NaN;
};
const checkpoint = (stage, details = {}) => {
  fs.writeFileSync("runtime-smoke-diagnostic.txt", `${stage}\n${JSON.stringify(details, null, 2)}\n`, "utf8");
};
const nav = async (page, label) => {
  const result = await page.evaluate((wanted) => {
    const buttons = [...document.querySelectorAll(".product-navigation button")];
    const button = buttons.find((node) => (node.textContent || "").trim().startsWith(wanted));
    if (!(button instanceof HTMLButtonElement)) return { found: false, labels: buttons.map((node) => (node.textContent || "").trim()) };
    button.click();
    return { found: true, disabled: button.disabled, labels: buttons.map((node) => (node.textContent || "").trim()) };
  }, label);
  expect(result.found, `missing product nav ${label}: ${JSON.stringify(result)}`).toBeTruthy();
  expect(result.disabled, `product nav ${label} must be enabled`).toBeFalsy();
};

test("Global T96 observed build can reach panel, scenario and Gear Compare", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));

  const response = await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("navigation", { name: "Product workspaces" })).toBeVisible();

  const loadObserved = page.getByRole("button", { name: /Load observed T96/i });
  await expect(loadObserved).toBeVisible();
  await loadObserved.click();
  await page.waitForTimeout(150);

  const context = page.getByRole("region", { name: "Current build context" });
  const contextText = await context.innerText();
  checkpoint("observed-loaded", { contextText, workspace: await page.locator(".app-root").getAttribute("data-workspace"), pageErrors });
  expect(contextText).toContain("Bamboocut-Dust");
  expect(contextText).toContain("4/4");

  await nav(page, "Combat");
  await page.waitForTimeout(200);
  const combatDiagnostic = {
    workspace: await page.locator(".app-root").getAttribute("data-workspace"),
    combatCount: await page.locator(".product-combat-workspace").count(),
    headingCount: await page.getByRole("heading", { name: "Damage model" }).count(),
    pageErrors,
  };
  checkpoint("combat-opened", combatDiagnostic);
  expect(combatDiagnostic.workspace).toBe("simulation");
  expect(pageErrors).toEqual([]);
  await expect(page.getByRole("heading", { name: "Damage model" })).toBeVisible();

  const modeledDpsStrong = page.locator(".combat-metrics .is-primary strong").first();
  const current1106Dps = parseDps(await modeledDpsStrong.innerText());
  expect(current1106Dps).toBeGreaterThan(0);

  await page.getByRole("button", { name: /^Attributes$/i }).click();
  const statTableText = await page.locator(".combat-stat-table").innerText();
  for (const expected of [/1,?614/, /2,?777/, /122\.1/, /132\.5/, /17\.8/]) expect(statTableText).toMatch(expected);
  await page.getByRole("button", { name: /^Overview$/i }).click();

  const cinder = page.locator("label.product-switch").filter({ hasText: "Cinder Ash" }).locator('input[type="checkbox"]');
  await expect(cinder).toBeChecked();
  await cinder.uncheck();
  await page.waitForTimeout(100);
  const noCinderDps = parseDps(await modeledDpsStrong.innerText());
  expect(noCinderDps).not.toBe(current1106Dps);
  await cinder.check();

  const distance = page.locator("label.combat-enemy").filter({ hasText: "Starweave distance" }).locator("select");
  await distance.selectOption("far");
  await page.waitForTimeout(100);
  const starweaveFarDps = parseDps(await modeledDpsStrong.innerText());
  expect(starweaveFarDps).not.toBe(current1106Dps);
  await distance.selectOption("near");

  await nav(page, "Compare");
  await page.waitForTimeout(150);
  const chest = page.locator(".compare-slot-tabs button").filter({ hasText: /^Chest/ }).first();
  if (await chest.count()) await chest.click();
  const candidate = page.locator("article").filter({ hasText: "Nightfarer Armor 1129" }).first();
  await expect(candidate).toBeVisible();
  const candidateText = await candidate.innerText();
  expect(candidateText).toContain("MENU PANEL DELTA");
  expect(candidateText).toContain("Why:");
  const candidate1129Dps = parseDps(candidateText);
  const deltaMatch = candidateText.match(/([+-][\d,]+)\s*DPS\s*\(([+-][\d.]+)%\)/i);
  expect(candidate1129Dps).toBeGreaterThan(0);
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
