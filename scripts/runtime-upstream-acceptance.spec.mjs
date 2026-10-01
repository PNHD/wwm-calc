import fs from "node:fs";
import { test, expect } from "@playwright/test";

const base = "http://127.0.0.1:4173/";
const dir = ".local-evidence/upstream-20261001";
fs.mkdirSync(dir, { recursive: true });
const observed = async page => {
  await page.goto(base + "#pve/gear", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Load observed T96", exact: true }).click();
};
const hook = page => page.evaluate(() => window.__WWM_T96_RUNTIME_ACCEPTANCE__);

test("predicted equip equals actual complete-build equip, including coefficient overrides", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await observed(page);
  // Change an actual skill coefficient through the same persisted editor input.
  await page.goto(base + "#pve/rotations", { waitUntil: "networkidle" });
  const exported = await page.evaluate(() => {
    const input = [...document.querySelectorAll('.rotsim')];
    return input.length;
  });
  expect(exported).toBeGreaterThan(0);
  const defaultReport = await hook(page);
  const skillName = await page.locator('tbody tr td[title]').first().getAttribute('title');
  expect(skillName).toBeTruthy();
  await page.evaluate(name => localStorage.setItem("wwm_skill_overrides", JSON.stringify({ [name]: { outerRatio: 0, fixed: 0, eleRatio: 0 } })), skillName);
  await page.reload({ waitUntil: "networkidle" });
  const before = await hook(page);
  expect(before.current1106Dps).toBeLessThan(defaultReport.current1106Dps);
  await page.goto(base + "#pve/compare", { waitUntil: "networkidle" });
  await page.getByRole("navigation", { name: "Compare gear slots" }).getByRole("button", { name: /Armor|Chest/ }).click();
  const candidate = page.locator(".compare-grid article").filter({ hasText: "Nightfarer Armor 1129" });
  await candidate.getByRole("button", { name: "Swap gear", exact: true }).click();
  const after = await hook(page);
  expect(after.current1106Dps).toBeCloseTo(before.candidate1129.modeledDps, 8);
  expect(after.current1106Dps - before.current1106Dps).toBeCloseTo(before.candidate1129.deltaDps, 8);
  await page.goto(base + "#pve/combat", { waitUntil: "networkidle" });
  const displayed = Number((await page.locator('.combat-metrics .is-primary > strong').innerText()).replace(/[^0-9]/g, ''));
  expect(Math.abs(displayed - after.current1106Dps)).toBeLessThanOrEqual(1);
  await expect(page.getByLabel("Cinder Ash")).toBeDisabled();
  fs.writeFileSync(`${dir}/equip-parity.json`, JSON.stringify({ defaultReport, skillName, before, after, displayed }, null, 2));
  expect(errors).toEqual([]);
});

for (const [width, height] of [[390, 844], [1024, 900], [1440, 1000]]) {
  test(`rotation preview preserves edits, reference reload/export and routes at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await observed(page);
    await page.goto(base + "#pve/rotations", { waitUntil: "networkidle" });
    const library = page.getByTestId("umbra-reference-library");
    await library.locator('summary').first().click();
    await expect(library.getByRole("combobox")).toHaveCount(1);
    expect(await library.locator('select option').count()).toBe(5);
    await library.getByRole("combobox").selectOption("builtin-bellstrikeUmbra-nox-30s-dh");
    await expect(library).toContainText("Qi break 25s");
    await library.getByRole("button", { name: "Save as reference" }).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_rotation_presets"))["bellstrike-umbra"][0]);
    expect(saved.reference.fixedWindowSec).toBe(30);
    expect(saved.reference.steps).toHaveLength(29);
    const referenceDownloadPromise = page.waitForEvent("download");
    await library.getByRole("button", { name: "Export reference JSON" }).click();
    const referenceFile = await (await referenceDownloadPromise).path();
    expect(JSON.parse(fs.readFileSync(referenceFile, "utf8"))).toEqual(saved.reference);
    const manage = page.getByLabel("Manage rotation");
    const payload = { schemaVersion: 2, id: "import-test", name: "Unsupported preview", buildKey: "bamboocut-dust", rotation: [{ name: "missing-verified-skill", count: 4 }] };
    await manage.locator('input[type=file]').setInputFiles({ name: "rotation.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(payload)) });
    const preview = page.getByRole("region", { name: "Rotation import preview" });
    // Section has a named implicit region; unsupported IDs must appear before apply.
    await expect(preview).toContainText("missing-verified-skill");
    await expect(preview.getByRole("button", { name: "Apply counts" })).toBeDisabled();
    await preview.getByRole("button", { name: "Dismiss preview" }).click();
    await manage.getByRole("button", { name: "Create custom rotation" }).click();
    const count = page.locator('tbody tr input[type=number]').last();
    await expect(count).toBeVisible();
    await count.fill("3"); await count.blur();
    const downloadPromise = page.waitForEvent("download");
    await manage.getByRole("button", { name: "Export JSON" }).click();
    const download = await downloadPromise;
    const file = await download.path();
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(value.schemaVersion).toBe(2);
    expect(value.buildKey).toBe("bamboocut-dust");
    await manage.locator('input[type=file]').setInputFiles({ name: "roundtrip.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(value)) });
    await expect(preview.getByRole("button", { name: "Apply counts" })).toBeEnabled();
    await preview.getByRole("button", { name: "Save new preset" }).click();
    await page.reload({ waitUntil: "networkidle" });
    const reloaded = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_rotation_presets")));
    expect(reloaded["bellstrike-umbra"][0].reference).toEqual(saved.reference);
    expect(reloaded["bamboocut-dust"].at(-1).rotation).toEqual(value.rotation);
    await page.goto(base + "#pve/transmute", { waitUntil: "networkidle" });
    await expect(page.locator('.analysis-workspace-detail')).toContainText("attempt budget are unavailable");
    await page.goBack({ waitUntil: "networkidle" });
    expect(new URL(page.url()).hash).toBe("#pve/rotations");
    await page.goForward({ waitUntil: "networkidle" });
    expect(new URL(page.url()).hash).toBe("#pve/transmute");
    await page.goBack({ waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const sheetBounds = await page.locator('.analysis-workspace-detail').evaluate(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right }; });
    const railWidth = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--workspace-nav-width")));
    if (width > 760) expect(sheetBounds.left).toBeGreaterThan(railWidth + 8);
    if (width > 1180) expect(sheetBounds.right).toBeLessThan(width - 280);
    await page.screenshot({ path: `${dir}/rotation-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("seeded worker repeats and a superseded worker cannot return to the current tab", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await observed(page);
  await page.goto(base + "#pve/simulation", { waitUntil: "networkidle" });
  await page.getByLabel("Simulation seed").fill("17");
  await page.getByRole("button", { name: /Run Simulation/ }).click();
  await expect(page.locator('.modal-body')).toContainText("Seed 17");
  const first = await page.locator('.modal-body').innerText();
  await page.getByRole("button", { name: /Run Simulation/ }).click();
  await expect(page.locator('.modal-body')).toContainText("Seed 17");
  const second = await page.locator('.modal-body').innerText();
  expect(second).toEqual(first);
  await page.evaluate(() => {
    window.Worker = class {
      postMessage(job) { window.__lateWorker = () => this.onmessage({ data: { generation: job.generation, fingerprint: job.fingerprint, error: "STALE_WORKER_RETURNED" } }); }
      terminate() {}
    };
  });
  await page.getByRole("button", { name: /Run Simulation/ }).click();
  await expect(page.getByRole("button", { name: "Cancel simulation" })).toBeVisible();
  await page.getByLabel("Simulation seed").fill("18");
  await page.evaluate(() => window.__lateWorker());
  await expect(page.locator('body')).not.toContainText("STALE_WORKER_RETURNED");
  await expect(page.getByRole("button", { name: "Cancel simulation" })).toHaveCount(0);
  await page.getByRole("button", { name: /Run Simulation/ }).click();
  await page.getByRole("button", { name: "Cancel simulation" }).click();
  await page.evaluate(() => window.__lateWorker());
  await expect(page.locator('body')).not.toContainText("STALE_WORKER_RETURNED");
  fs.writeFileSync(`${dir}/worker-browser.txt`, first);
  expect(errors).toEqual([]);
});

test("Best Build cancellation and navigation invalidate an active inventory search", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await observed(page);
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem("wwm_chars_v3"));
    const char = root.chars.find(c => c.id === root.activeCharId);
    const scheme = char.schemes.find(s => s.id === root.activeSchemeId);
    const base = scheme.gear;
    // This is a cancellation fixture, not historical source validation. Use
    // positive physical-only lines so legality guards do not finish it early.
    scheme.gear = base.flatMap(item => Array.from({ length: 4 }, (_, i) => ({ ...item, id: `${item.id}:search-${i}`, subs: [{ type: "Max Physical ATK", val: String(100 + i), isTuned: false }], isEquipped: item.isEquipped && i === 0 })));
    localStorage.setItem("wwm_chars_v3", JSON.stringify(root));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.goto(base + "#pve/best-build", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Find best build", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel search" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel search" }).click();
  await expect(page.getByRole("button", { name: "Cancel search" })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText("Best combination");
  await page.getByRole("button", { name: "Find best build", exact: true }).click();
  await page.getByLabel("PvE navigation").getByRole("button", { name: /^Build/ }).click();
  await page.getByLabel("PvE navigation").getByRole("button", { name: /^Best Build/ }).click();
  await expect(page.getByRole("button", { name: "Cancel search" })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText("Best combination");
  expect(errors).toEqual([]);
});
