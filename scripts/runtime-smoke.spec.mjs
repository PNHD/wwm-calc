import { test, expect } from "@playwright/test";

const parseFirstDps = (text) => {
  const match = text.match(/([\d,]+)\s*DPS/i);
  return match ? Number(match[1].replace(/,/g, "")) : NaN;
};

test("production build renders and completes the observed T96 decision flow", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.stack || error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const response = await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const root = page.locator("#root");
  const rootHtml = await root.innerHTML();
  const rootText = (await root.innerText()).trim();

  console.log(`[runtime-smoke] HTTP ${response?.status() ?? "no-response"}`);
  console.log(`[runtime-smoke] root HTML length: ${rootHtml.length}`);
  console.log(`[runtime-smoke] root text preview: ${rootText.slice(0, 300)}`);

  expect(response?.ok(), "preview server must return a successful document response").toBeTruthy();
  expect(rootHtml.length, "#root must contain the rendered application").toBeGreaterThan(100);
  expect(rootText.length, "the application shell must expose visible text").toBeGreaterThan(20);

  const legacyLayout = page.locator(".app-layout").first();
  if (await legacyLayout.count()) {
    await expect(legacyLayout, "legacy simulator must not bleed into product workspaces").toBeHidden();
  }

  await expect(page.getByRole("button", { name: /^Build\b/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Gear\b/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Compare\b/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Best Build\b/i })).toBeVisible();

  // The committed 1106 fixture must be directly loadable: no owner re-entry and
  // no manual OCR acceptance are required for this product acceptance pass.
  const loadObserved = page.getByRole("button", { name: /Load observed T96/i });
  await expect(loadObserved).toBeVisible();
  await loadObserved.click();
  await page.waitForTimeout(150);

  await page.getByRole("button", { name: /^Combat\b/i }).click();
  await expect(page.getByRole("heading", { name: "Damage model" })).toBeVisible();
  await expect(page.getByText(/Attack-Boosting Food/).first()).toBeVisible();
  await expect(page.getByText(/\+120 Min \/ \+240 Max Physical Attack/).first()).toBeVisible();
  await expect(page.getByText(/Advanced parse projection/)).toBeVisible();
  await expect(page.getByText(/Execution efficiency/)).toHaveCount(0);
  await expect(page.getByText(/\+90 min \/ \+180 max/i)).toHaveCount(0);
  await expect(page.getByText(/Boss attacks OFF · Controlled OFF/)).toBeVisible();
  await expect(page.getByText(/Party buffs OFF/)).toBeVisible();

  const modeledDpsStrong = page.locator(".combat-metrics .is-primary strong").first();
  const baselineDps = parseFirstDps(await modeledDpsStrong.innerText());
  expect(Number.isFinite(baselineDps) && baselineDps > 0, "observed 1106 fixture must produce modeled DPS").toBeTruthy();
  console.log(`[runtime-smoke] observed 1106 modeled DPS: ${baselineDps}`);

  // MENU PANEL must reproduce the supplied 1106 snapshot; food lives only in the
  // COMBAT column and therefore cannot alter these menu values.
  await page.getByRole("button", { name: /^Attributes$/i }).click();
  const statTableText = await page.locator(".combat-stat-table").innerText();
  expect(statTableText).toMatch(/1,?614/);
  expect(statTableText).toMatch(/2,?777/);
  expect(statTableText).toMatch(/122\.1/);
  expect(statTableText).toMatch(/132\.5/);
  expect(statTableText).toMatch(/17\.8/);
  console.log(`[runtime-smoke] observed 1106 menu panel verified: 1614–2777 / Prec 122.1 / Crit 132.5 / Aff 17.8`);
  await page.getByRole("button", { name: /^Overview$/i }).click();

  // Scenario inputs must affect the same modeled-DPS path used by Compare/Best Build.
  const cinderLabel = page.locator("label.product-switch").filter({ hasText: "Cinder Ash" });
  const cinderCheckbox = cinderLabel.locator('input[type="checkbox"]');
  await expect(cinderCheckbox).toBeChecked();
  await cinderCheckbox.uncheck();
  await page.waitForTimeout(100);
  const noCinderDps = parseFirstDps(await modeledDpsStrong.innerText());
  expect(noCinderDps).not.toBe(baselineDps);
  await cinderCheckbox.check();

  const distanceSelect = page.locator("label.combat-enemy").filter({ hasText: "Starweave distance" }).locator("select");
  await expect(distanceSelect).toHaveValue("near");
  await distanceSelect.selectOption("far");
  await page.waitForTimeout(100);
  const farDps = parseFirstDps(await modeledDpsStrong.innerText());
  expect(farDps).not.toBe(baselineDps);
  console.log(`[runtime-smoke] scenario DPS: no-Cinder=${noCinderDps}; Starweave-far=${farDps}`);
  await distanceSelect.selectOption("near");
  await page.waitForTimeout(100);

  // Complete-build Gear Compare acceptance: same 1106 build, replace Chest only
  // with the committed 1129 candidate and expose modeled result + deterministic why.
  await page.getByRole("button", { name: /^Compare\b/i }).click();
  const chestTab = page.getByRole("button", { name: /^Chest\b/i });
  if (await chestTab.count()) await chestTab.first().click();
  const candidate1129 = page.locator("article").filter({ hasText: "Nightfarer Armor 1129" }).first();
  await expect(candidate1129).toBeVisible();
  await expect(candidate1129.getByText(/MENU PANEL DELTA/)).toBeVisible();
  await expect(candidate1129.getByText(/Why:/)).toBeVisible();
  const candidateText = await candidate1129.innerText();
  const candidateDps = parseFirstDps(candidateText);
  const deltaMatch = candidateText.match(/([+-][\d,]+)\s*DPS\s*\(([+-][\d.]+)%\)/i);
  expect(Number.isFinite(candidateDps) && candidateDps > 0, "1129 candidate must have modeled DPS").toBeTruthy();
  expect(deltaMatch, "1129 candidate must expose absolute and percentage DPS delta").toBeTruthy();
  console.log(`[runtime-smoke] observed 1129 compare card: ${candidateText.replace(/\s+/g, " ").slice(0, 1200)}`);
  console.log(JSON.stringify({
    fixture: "1106-vs-1129",
    current1106Dps: baselineDps,
    candidate1129Dps: candidateDps,
    deltaDps: Number(deltaMatch[1].replace(/,/g, "")),
    deltaPct: Number(deltaMatch[2]),
  }));

  await page.screenshot({ path: "runtime-smoke.png", fullPage: true });

  if (consoleErrors.length) console.log(`[runtime-smoke] console errors:\n${consoleErrors.join("\n---\n")}`);
  if (pageErrors.length) console.log(`[runtime-smoke] page errors:\n${pageErrors.join("\n---\n")}`);
  expect(pageErrors, "the production bundle must not throw during render, scenario changes, or Gear Compare").toEqual([]);
});
