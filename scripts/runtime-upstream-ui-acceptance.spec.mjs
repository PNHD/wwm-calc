import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { buildSync, transformSync } from "esbuild";
import { test, expect } from "@playwright/test";

const base = process.env.PRODUCTION_URL || "http://127.0.0.1:4173/";
const dir = process.env.UI_EVIDENCE_DIR || ".local-evidence/upstream-20261001/ui-resume";
fs.mkdirSync(dir, { recursive: true });
buildSync({ entryPoints: ["src/utils/damageSimulation.ts"], bundle: true, format: "esm", platform: "node", outfile: `${dir}/samples.mjs` });
const { simulateDamage } = await import(pathToFileURL(`${process.cwd()}/${dir}/samples.mjs`).href);
const oldApp = execFileSync("git", ["show", "4debf129fe9353c058020129dae0712b6befe29e:src/App.tsx"], { encoding: "utf8", maxBuffer: 4e6 });
const literals = ["INITIAL_PANEL", "DEFAULT_GEAR"].map(name => oldApp.match(new RegExp(`const ${name}[^=]*=[\\s\\S]*?^\\s*[}\\]];`, "m"))[0]).join("\n");
const historical = new Function(transformSync(literals, { loader: "ts" }).code + ";return { panel: INITIAL_PANEL, gear: DEFAULT_GEAR }; ")();
const tools = async page => { const summary = page.locator('.workspace-tools:not([open]) > summary'); if (await summary.count()) await summary.click(); };
const observed = async page => { await tools(page); await page.getByRole("button", { name: "Load observed T96", exact: true }).click(); };
const hook = page => page.evaluate(() => window.__WWM_SCENARIO_DIAGNOSTIC__);

for (const width of [390, 1440]) test(`Data import validates before replacement, restores same-ID context and closes by Escape at ${width}`, async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.goto(base + "#pve/simulation", { waitUntil: "networkidle" });
  await observed(page);
  const before = await page.evaluate(() => localStorage.getItem("wwm_chars_v3"));
  const open = async () => { await tools(page); await page.getByRole("button", { name: "Data", exact: true }).click(); };
  await open();
  const dialog = page.getByRole("dialog", { name: "Export / Import Data", exact: true });
  const input = page.getByLabel("Data Content:", { exact: true });
  await expect(input).toBeFocused();
  const broken = JSON.parse(before); broken.chars[0].schemes[0].gear = [{}];
  const duplicate = JSON.parse(before); duplicate.chars.push(duplicate.chars[0]);
  const badBase = JSON.parse(before); badBase.chars[0].schemes[0].baseOverride = { maxOuter: "invalid" };
  const badContext = JSON.parse(before); badContext.chars[0].schemes[0].combatConfig.selectedBuild = "constructor";
  for (const raw of ["{", '{"chars":[]}', JSON.stringify(broken), JSON.stringify(duplicate), JSON.stringify(badBase), JSON.stringify(badContext), '{"chars":[],"__proto__":{"polluted":true}}', " ".repeat(512 * 1024 + 1)]) {
    await input.fill(raw);
    await dialog.getByRole("button", { name: "Import", exact: true }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("wwm_chars_v3"))).toBe(before);
  }
  await page.screenshot({ path: `${dir}/import-error-${width}.png`, fullPage: false });
  await input.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".workspace-tools > summary")).toBeFocused();
  await open();
  const imported = JSON.parse(before);
  const char = imported.chars.find(c => c.id === imported.activeCharId);
  const scheme = char.schemes.find(s => s.id === imported.activeSchemeId);
  char.name = "Imported same-ID profile";
  scheme.combatConfig.starweaveDistance = "far";
  scheme.combatConfig.food = false;
  await input.fill(JSON.stringify(imported));
  await Promise.all([page.waitForEvent("load"), dialog.getByRole("button", { name: "Import", exact: true }).click()]);
  await expect(dialog).toHaveCount(0);
  await tools(page);
  await expect(page.getByRole("combobox", { name: "Current role", exact: true })).toContainText(char.name);
  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_chars_v3")));
  expect(stored.chars.find(c => c.id === stored.activeCharId).schemes.find(s => s.id === stored.activeSchemeId).combatConfig).toEqual(scheme.combatConfig);
  expect(await page.evaluate(() => localStorage.getItem("wwm_chars_v3__recovery_backup_v1"))).toBe(before);
  await open();
  await Promise.all([page.waitForEvent("load"), dialog.getByText("Upload File", { exact: true }).locator("input").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(before) })]);
  await expect(dialog).toHaveCount(0);
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_chars_v3")));
  expect(stored.chars.find(c => c.id === stored.activeCharId).name).not.toBe(char.name);
  expect(await page.evaluate(() => ({}).polluted)).toBeUndefined();
  expect(errors).toEqual([]);
});

test("leaving PvE unmounts and closes its gear editor", async ({ page }) => {
  await page.goto(base + "#pve/gear", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add gear", exact: true }).click();
  await expect(page.getByPlaceholder("Enter gear name")).toBeVisible();
  await page.evaluate(() => { location.hash = "#library/pve"; });
  await expect(page.locator(".library-page")).toBeVisible();
  await expect(page.getByPlaceholder("Enter gear name")).toHaveCount(0);
  await expect(page.locator(".arsenal-workspace")).toHaveCount(0);
  await page.evaluate(() => { location.hash = "#pve/gear"; });
  await expect(page.locator(".arsenal-workspace")).toBeVisible();
  await expect(page.getByPlaceholder("Enter gear name")).toHaveCount(0);
});

test("shared Tools open their dialogs from Guild War and Library without mounting PvE", async ({ page }) => {
  for (const route of ["gvg/overview", "library/pve"]) {
    await page.goto(base + "#" + route, { waitUntil: "networkidle" });
    for (const name of ["Help", "Import game", "Scan gear", "Data"]) {
      await tools(page);
      await page.getByRole("button", { name, exact: true }).click();
      const modal = page.locator(".modal-content:visible");
      await expect(modal).toHaveCount(1);
      await expect(page.locator(".arsenal-workspace")).toHaveCount(0);
      const close = modal.getByRole("button", { name: /^Close / }).first();
      await close.click({ trial: true });
      await close.focus(); await close.press("Enter");
      await expect(modal).toHaveCount(0);
    }
  }
});

test("legacy default and current set/rotation share analytic expectation and seeded sampling error", async ({ page }) => {
  await page.addInitScript(value => {
    localStorage.setItem("wwm_chars_v3", JSON.stringify({ chars: [{ id: "legacy", name: "Legacy Main Hero", schemes: [{ id: "legacy-scheme", name: "Scheme 1", ...value }] }], activeCharId: "legacy", activeSchemeId: "legacy-scheme" }));
    localStorage.setItem("wwm_selected_inner_ways", "[]");
  }, historical);
  await page.goto(base + "#pve/combat", { waitUntil: "networkidle" });
  const reports = [];
  for (const distance of ["near", "far"]) {
    await page.getByLabel("Starweave distance").selectOption(distance);
    const current = await hook(page);
    expect(current.currentSetDps).toBeCloseTo(current.headlineDps, 9);
    expect(current.rotationLabDps).toBeCloseTo(current.headlineDps, 9);
    const job = { generation: 1, fingerprint: distance, seed: 17, runs: 2000, ...current.evaluation, expected: current.evaluation.total };
    const sample = simulateDamage(job);
    expect(sample.analyticDps).toBeCloseTo(current.headlineDps, 9);
    expect(Math.abs(sample.avgDps - sample.expectedDps)).toBeLessThan(6 * sample.meanStdErrorDps);
    expect(simulateDamage(job)).toEqual(sample);
    expect(() => simulateDamage({ ...job, expected: job.expected * 1.08 })).toThrow(/expectation/);
    reports.push({ distance, headline: current.headlineDps, currentSet: current.currentSetDps, rotation: current.rotationLabDps, sample });
  }
  fs.writeFileSync(`${dir}/analytic-monte-carlo.json`, JSON.stringify(reports, null, 2));
});

test("new empty, clone and blank-build preserve historical profiles and explicit observed references", async ({ page }) => {
  await page.goto(base, { waitUntil: "networkidle" });
  await expect(page.getByTestId("pve-overview")).toContainText("—");
  await page.getByRole("button", { name: /Blank Build/ }).click();
  let data = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_chars_v3")));
  expect(data.chars.find(c => c.id === data.activeCharId).schemes[0].gear).toEqual([]);
  await expect(page.locator('.build-workspace')).toBeVisible();
  await observed(page);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_chars_v3")));
  const active = before.chars.find(c => c.id === before.activeCharId);
  const observedDps = (await hook(page)).headlineDps;
  await tools(page);
  page.once("dialog", dialog => dialog.accept("Explicit clone"));
  await page.getByRole("button", { name: "Clone current", exact: true }).click();
  data = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_chars_v3")));
  expect(data.chars.find(c => c.id === data.activeCharId).schemes[0].gear).toEqual(active.schemes[0].gear);
  await page.reload({ waitUntil: "networkidle" });
  expect((await hook(page)).headlineDps).toBeCloseTo(observedDps, 8);
  await tools(page);
  page.once("dialog", dialog => dialog.accept("Empty from observed"));
  await page.getByRole("button", { name: "New profile", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  data = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_chars_v3")));
  const blank = data.chars.find(c => c.id === data.activeCharId);
  expect(blank.schemes[0].gear).toEqual([]);
  expect(blank.schemes[0].panelModelSource).toBe("EMPTY");
  expect(data.chars.find(c => c.id === active.id)).toEqual(active);
  await page.goto(base + "#pve/gear", { waitUntil: "networkidle" });
  await expect(page.getByLabel("Empty gear inventory")).toBeVisible();
  await expect(page.getByLabel("Current build context")).toContainText("—");
});

test("empty build manual gear, compare actual equip, complete search, simulation and rotation reload", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto(base + '#pve/overview', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Blank Build/ }).click();
  await page.goto(base + '#pve/gear', { waitUntil: 'networkidle' });
  const add = async (name, value, slot) => {
    await page.getByRole('button', { name: 'Add gear', exact: true }).click();
    const modal = page.locator('.modal').filter({ has: page.getByPlaceholder('Enter gear name') });
    if (slot) await modal.locator('select').first().selectOption(slot);
    await page.getByPlaceholder('Enter gear name').fill(name);
    await page.getByPlaceholder('Search stat...', { exact: true }).first().fill('Max Phys Atk');
    await expect(page.getByRole('option', { name: 'Max Phys Atk', exact: true })).toBeVisible();
    const stat = page.getByPlaceholder('Search stat...', { exact: true }).first();
    await stat.press('Enter');
    await stat.click(); await expect(page.getByRole('listbox')).toBeVisible();
    await stat.press('Escape'); await expect(stat).toBeFocused();
    await page.getByPlaceholder('e.g. 59.2 or 7.4%').first().fill(String(value));
    await page.getByRole('button', { name: 'Save Gear', exact: true }).click();
  };
  // Authored attack must exceed boss defense to exercise a priced upgrade.
  await add('My authored weapon', 1000);
  await expect(page.locator('.arsenal-gear-card').filter({ hasText: 'My authored weapon' }).getByRole('button', { name: 'Equipped', exact: true })).toBeVisible();
  await page.goto(base + '#pve/compare', { waitUntil: 'networkidle' });
  await expect(page.getByText('No replacement candidate', { exact: true })).toBeVisible();
  await expect(page.locator('.compare-grid')).not.toContainText('CLOSE CALL');
  await page.goto(base + '#pve/gear', { waitUntil: 'networkidle' });
  await add('My stronger weapon', 2000, 'Umbrella');
  await page.goto(base + '#pve/compare', { waitUntil: 'networkidle' });
  const before = await hook(page);
  const candidate = page.locator('.compare-grid article').filter({ hasText: 'My stronger weapon' });
  const prediction = Number((await candidate.locator('.compare-primary-result > div').first().locator('strong').innerText()).replace(/[^0-9]/g, ''));
  await candidate.getByRole('button', { name: 'Swap gear', exact: true }).click();
  await expect.poll(async () => (await hook(page)).headlineDps).toBeGreaterThan(before.headlineDps);
  const after = await hook(page);
  expect(after.headlineDps).toBeGreaterThan(before.headlineDps);
  expect(Math.abs(after.headlineDps - prediction)).toBeLessThanOrEqual(1);
  await page.goto(base + '#pve/gear', { waitUntil: 'networkidle' });
  for (const slot of ['Rope Dart', 'Disc', 'Pendant', 'Helmet', 'Chest', 'Bracers', 'Greaves']) await add(`My ${slot}`, 100, slot);
  await page.goto(base + '#pve/best-build', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Find best build', exact: true }).click();
  await expect(page.getByText('Best combination', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Equip this build', exact: true }).click();
  await page.goto(base + '#pve/combat', { waitUntil: 'networkidle' });
  expect((await hook(page)).headlineDps).toBeGreaterThan(0);
  await page.goto(base + '#pve/simulation', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Run Simulation/ }).click();
  await expect(page.getByRole('region', { name: 'Damage simulation', exact: true })).toContainText('Analytic expectation');
  await page.goto(base + '#pve/rotations', { waitUntil: 'networkidle' });
  const manage = page.getByLabel('Manage rotation');
  await manage.getByRole('button', { name: 'Create custom rotation' }).click();
  await page.locator('tbody tr input[type=number]').last().fill('3');
  page.once('dialog', dialog => dialog.accept('My saved rotation'));
  await manage.getByRole('button', { name: 'Save preset', exact: true }).click();
  const presets = await page.evaluate(() => localStorage.getItem('wwm_rotation_presets'));
  await page.reload({ waitUntil: 'networkidle' });
  expect(await page.evaluate(() => localStorage.getItem('wwm_rotation_presets'))).toBe(presets);
  await expect(page.locator('tbody tr input[type=number]').last()).toHaveValue('3');
  fs.writeFileSync(`${dir}/empty-build-e2e.json`, JSON.stringify({ before, prediction, after, presets }, null, 2));
});

for (const [width, height] of [[390, 844], [1024, 768], [1363, 936], [1440, 900]]) {
  test(`workspace audit, accessible controls and ancestor bounds at ${width}`, async ({ page }) => {
    // Mobile audits individually scroll and trial-click hundreds of table controls.
    test.setTimeout(180000);
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + "#pve/build", { waitUntil: "networkidle" });
    await observed(page);
    await page.getByTestId("model-about").locator('summary').click();
    const toolsSummary = page.locator('.workspace-tools > summary');
    await toolsSummary.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('combobox', { name: 'Current role', exact: true })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(toolsSummary).toBeFocused();
    const reportLink = page.getByRole("link", { name: "Report bad data" });
    await expect(reportLink).toBeVisible();
    await reportLink.click({ trial: true });
    await page.screenshot({ path: `${dir}/model-${width}.png`, fullPage: true });
    await page.getByTestId("model-about").locator('summary').click();
    const routes = ["overview", "build", "gear", "compare", "best-build", "combat", "simulation", "rotations", "priority", "cultivate", "transmute", "bis", "skill-editor", "team", "manual", "dps-compare"];
    for (const route of routes) {
      await page.goto(base + `#pve/${route}`, { waitUntil: "networkidle" });
      const main = page.locator('[data-testid="pve-overview"], .analysis-workspace-detail, .build-workspace, .arsenal-workspace, .compare-workspace, .combat-workspace').filter({ visible: true });
      await expect(main).toHaveCount(1);
      await expect(page.locator('.analysis-sheet-sidebar')).toHaveCount(0);
      if (route !== "gear") expect(await page.locator('.arsenal-workspace').count()).toBe(0);
      const bounds = await main.evaluate(el => { const r = el.getBoundingClientRect(); const nav = document.querySelector('.workspace-context-nav'); const inspector = document.querySelector('.workspace-inspector'); return { left: r.left, right: r.right, navRight: nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().right : 0, inspectorLeft: inspector && getComputedStyle(inspector).display !== 'none' ? inspector.getBoundingClientRect().left : innerWidth, width: innerWidth }; });
      expect(bounds.left).toBeGreaterThanOrEqual(bounds.navRight);
      expect(bounds.right).toBeLessThanOrEqual(bounds.inspectorLeft + 1);
      const control = main.locator('button:visible, select:visible, input:visible').first();
      await control.scrollIntoViewIfNeeded();
      await control.click({ trial: true });
      const controls = main.locator('button:visible, select:visible, input:visible');
      const clipped = await controls.evaluateAll(controls => controls.flatMap((el, index) => {
        const r = el.getBoundingClientRect();
        let scrollable = false;
        for (let parent = el.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent), p = parent.getBoundingClientRect();
          if (['auto', 'scroll'].includes(style.overflowX) && parent.scrollWidth > parent.clientWidth) scrollable = true;
          if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && (r.left < p.left - 1 || r.right > p.right + 1)) return [{ index, scrollable, control: el.getAttribute('aria-label') || el.textContent?.slice(0, 70), ancestor: parent.className }];
        }
        return [];
      }));
      expect(clipped.filter(item => !item.scrollable), route).toEqual([]);
      if (route === "rotations") {
        const contrast = await main.locator('.rotation-table input').first().evaluate(el => {
          const style = getComputedStyle(el);
          const luminance = colour => colour.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
          const values = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => a - b);
          return (values[1] + .05) / (values[0] + .05);
        });
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
      // A native scrolling table is acceptable only when its named controls can actually be reached.
      for (const item of clipped.filter(item => item.scrollable)) {
        const target = controls.nth(item.index);
        await target.scrollIntoViewIfNeeded();
        if (await target.isEnabled()) await target.click({ trial: true });
        const rect = await target.boundingBox();
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(Math.min(width, bounds.inspectorLeft) + 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await page.evaluate(() => { document.querySelectorAll('.rotation-table').forEach(el => el.scrollLeft = 0); document.body.scrollTop = 0; document.documentElement.scrollTop = 0; window.scrollTo(0, 0); });
      await page.screenshot({ path: `${dir}/${route}-${width}.png`, fullPage: false });
    }
    for (const workspace of ["pve/gear", "pve/simulation", "gvg/overview", "arena/overview", "training-terrace/overview"]) {
      await page.goto(base + "#" + workspace, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Library", exact: true }).click();
      await expect(page.locator('.library-page')).toBeVisible();
      await expect(page.locator('.arsenal-workspace, .arena-main, .workspace-gvg-host, .combat-workspace, .advanced-workspace')).toHaveCount(0);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator('.arsenal-workspace')).toHaveCount(0);
      await page.screenshot({ path: `${dir}/library-${width}.png`, fullPage: false });
      await page.getByRole("button", { name: "Close Library", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${workspace}$`));
      await expect(page.locator('.library-page')).toHaveCount(0);
    }
    await page.goto(base + '#gvg/overview', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('gvg-overview')).toBeVisible();
    await expect(page.locator('.arsenal-workspace, .arena-main')).toHaveCount(0);
    await page.screenshot({ path: `${dir}/gvg-${width}.png`, fullPage: false });
    await page.goto(base + "#arena/overview", { waitUntil: "networkidle" });
    await expect(page.getByLabel("Arena mode", { exact: true })).toHaveCount(1);
    await expect(page.locator('.workspace-header')).toHaveCount(1);
    await page.screenshot({ path: `${dir}/arena-${width}.png`, fullPage: false });
    await page.goto(base + "#training-terrace/overview", { waitUntil: "networkidle" });
    await expect(page.getByText("Before", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("After", { exact: true }).first()).toBeVisible();
    expect(await page.locator('.training-terrace').evaluate(el => [el, ...el.querySelectorAll('h2, label, input')].every(node => getComputedStyle(node).fontFamily.startsWith('system-ui')))).toBe(true);
    await expect(page.locator('.workspace-header')).toHaveCount(1);
    await page.screenshot({ path: `${dir}/training-${width}.png`, fullPage: false });
    expect(errors).toEqual([]);
  });
}
