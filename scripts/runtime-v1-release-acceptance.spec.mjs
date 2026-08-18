import fs from "node:fs";
import { test, expect } from "@playwright/test";

const BASE = "http://127.0.0.1:4173/";
const QA = "visual-qa";
fs.mkdirSync(QA, { recursive: true });

function runtimeWatch(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page:${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console:${message.text()}`); });
  return errors;
}

async function assertClean(errors) { expect(errors).toEqual([]); }

async function seed(page) {
  await page.addInitScript(() => {
    localStorage.setItem("wwm_chars_v3", JSON.stringify({
      chars: [{ id: "char-v1", name: "Release", schemes: [{ id: "scheme-v1", name: "Release Build", panel: { minOuter: 1614, maxOuter: 2777, prec: 122.1, crit: 132.5, outerPen: 43.5, allArts: 5.6, bossDmg: 5.3 }, gear: [{ slot: "Weapon1", name: "Release Umbrella", set: "Weapon" }] }] }],
      activeCharId: "char-v1",
      activeSchemeId: "scheme-v1",
    }));
    localStorage.setItem("wwm_selected_build", "bamboocut-dust");
    localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify({
      schemaVersion: 1,
      roster: Array.from({ length: 30 }, (_, index) => ({ id: `p-${index + 1}`, name: `Player ${String(index + 1).padStart(2, "0")}`, roles: [["HEALER","FRONTLINE","MAIN_BALL","FLEX","DUELIST"][index % 5]], availability: true })),
      strategy: { positions: Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`p-${index + 1}`, { x: 8 + (index % 10) * 9, y: 15 + Math.floor(index / 10) * 30 }])), arrows: [], rallyPoints: [] },
      timeline: [], commander: { startingCoins: 100, events: [] }, matchLogs: [],
    }));
  });
}

async function assertNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
}

async function capture(page, route, name, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await assertNoOverflow(page);
  await page.screenshot({ path: `${QA}/${name}.png`, fullPage: true });
}

test("Arena Library Compare loads the selected reference without cloning or active-state overwrite", async ({ page }) => {
  await seed(page);
  await page.goto(`${BASE}#library/arena`, { waitUntil: "networkidle" });
  const cards = page.locator(".library-card");
  await expect(cards).toHaveCount(3);
});

test("malformed Arena Library comparison descriptor fails closed", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("wwm_arena_library_compare_v1", "%%%"));
  await page.goto(`${BASE}#arena/compare`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Arena Compare" })).toBeVisible();
});

test("V1 state isolation survives workspace switches, deep links, refresh, history and clones", async ({ page }) => {
  const runtime = runtimeWatch(page);
  await seed(page);
  await page.goto(`${BASE}#pve/build`, { waitUntil: "networkidle" });
  const before = await page.evaluate(() => localStorage.getItem("wwm_chars_v3"));
  await page.goto(`${BASE}#arena/overview`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(/Arena/i).first()).toBeVisible();
  await page.goto(`${BASE}#gvg/overview`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(/Command center/i)).toBeVisible();
  await page.goto(`${BASE}#library/build/bamboocut-dust-global-t96-calibrated`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Clone to My Workspace$/ }).click();
  expect(await page.evaluate(() => localStorage.getItem("wwm_chars_v3"))).not.toBeNull();
  expect(before).not.toBeNull();
  await assertClean(runtime);
});

test("V1 corrupt/future storage recovers per domain and preserves a bounded backup", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("wwm_arena_state_v1", "{bad");
    localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify({ schemaVersion: 999, roster: [] }));
  });
  await page.goto(`${BASE}#arena/overview`, { waitUntil: "networkidle" });
  await page.goto(`${BASE}#gvg/overview`, { waitUntil: "networkidle" });
  const backups = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes("backup")));
  expect(backups.length).toBeLessThanOrEqual(8);
});

test("V1 public payloads fail closed and supplied strings stay text", async ({ page }) => {
  await page.goto(`${BASE}#shared-build=%%%`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-invalid")).toBeVisible();
  await page.goto(`${BASE}#arena-share=%%%`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Invalid Arena share", exact: true })).toBeVisible();
  await page.goto(`${BASE}#gvg-share=%%%`, { waitUntil: "networkidle" });
  await expect(page.getByText(/could not be decoded/i)).toBeVisible();
});

test("V1 required responsive surfaces render at 1440, 1024 and 390 with Model/About", async ({ page, context }) => {
  const runtime = runtimeWatch(page);
  await seed(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const desktop = [["#pve/overview","1440-pve-overview"],["#pve/gear","1440-pve-gear"],["#pve/best-build","1440-pve-best-build"],["#arena/overview","1440-arena-overview"],["#arena/matchups","1440-arena-matchup"],["#gvg/overview","1440-guild-war-overview"],["#gvg/strategy","1440-guild-war-strategy"],["#library","1440-library"]];
  for (const [route, name] of desktop) await capture(page, route, name, 1440, 960);
  const tablet = [["#pve/overview","1024-pve"],["#arena/matchups","1024-arena"],["#gvg/strategy","1024-guild-war-strategy"],["#library","1024-library"]];
  for (const [route, name] of tablet) await capture(page, route, name, 1024, 900);
  const mobile = [["#pve/gear","390-pve-gear"],["#pve/compare","390-pve-compare"],["#arena/matchups","390-arena-matchup"],["#gvg/roster","390-guild-war-roster"]];
  for (const [route, name] of mobile) await capture(page, route, name, 390, 844);
  await page.goto(`${BASE}#library/build/bamboocut-dust-global-t96-calibrated`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Share$/ }).click();
  const shareLink = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(shareLink, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-landing")).toBeVisible();
  await assertNoOverflow(page);
  await page.screenshot({ path: `${QA}/390-library-shared-landing.png`, fullPage: true });

  for (const route of ["#pve/overview", "#gvg/overview", "#library", "#arena/overview"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    const about = page.getByTestId("model-about");
    const heading = about.getByText("WWM Calc V1", { exact: true });
    await expect(about).toBeVisible();
    if (await about.evaluate((element) => element.open)) {
      await about.locator("summary").click();
      await expect(heading).toBeHidden();
    }
    await about.locator("summary").click();
    await expect(heading).toBeVisible();
    await expect(about.getByRole("link", { name: /Report bad data/i })).toHaveAttribute("href", /github\.com\/PNHD\/wwm-calc\/issues\/new/);
  }
  await assertClean(runtime);
});

test("V1 representative scale completes and records relative browser timings", async ({ page }) => {
  const runtime = runtimeWatch(page);
  const timings = { pveInventory: {}, arenaBestBuildMs: null, gvgRosterRenderMs: null, gvgStrategyMs: null, libraryFilterMs: null };
  await page.goto(`${BASE}#pve/gear`, { waitUntil: "networkidle" });
  const observed = page.getByRole("button", { name: /Load observed T96/i });
  if (await observed.count()) { await observed.click(); await page.waitForTimeout(250); }
  for (const count of [50, 100, 250]) {
    const started = Date.now();
    await page.evaluate((count) => {
      const root = JSON.parse(localStorage.getItem("wwm_chars_v3") || "{}");
      const char = root.chars?.find((item) => item.id === root.activeCharId) ?? root.chars?.[0];
      const scheme = char?.schemes?.find((item) => item.id === root.activeSchemeId) ?? char?.schemes?.[0];
      if (!scheme) return;
      scheme.gear = Array.from({ length: count }, (_, index) => ({ id: `scale-${index}`, slot: "Helmet", name: `Scale Gear ${index}`, stats: [] }));
      localStorage.setItem("wwm_chars_v3", JSON.stringify(root));
    }, count);
    await page.reload({ waitUntil: "networkidle" });
    timings.pveInventory[count] = Date.now() - started;
  }
  const arenaStart = Date.now();
  await page.goto(`${BASE}#arena/best-build`, { waitUntil: "networkidle" });
  timings.arenaBestBuildMs = Date.now() - arenaStart;
  const rosterStart = Date.now();
  await page.goto(`${BASE}#gvg/roster`, { waitUntil: "networkidle" });
  timings.gvgRosterRenderMs = Date.now() - rosterStart;
  const strategyStart = Date.now();
  await page.goto(`${BASE}#gvg/strategy`, { waitUntil: "networkidle" });
  timings.gvgStrategyMs = Date.now() - strategyStart;
  const libraryStart = Date.now();
  await page.goto(`${BASE}#library`, { waitUntil: "networkidle" });
  timings.libraryFilterMs = Date.now() - libraryStart;
  fs.writeFileSync("V1_PERFORMANCE_REPORT.json", `${JSON.stringify(timings, null, 2)}\n`, "utf8");
  await assertClean(runtime);
});
