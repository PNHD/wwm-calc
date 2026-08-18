import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { defaultArenaState } from "../src/arena/arena-core.mjs";
import { defaultWorkspace } from "../src/gvg/model.js";

const BASE = "http://127.0.0.1:4173/";
const QA = "visual-qa/v1";
fs.mkdirSync(QA, { recursive: true });
test.describe.configure({ mode: "serial" });

function runtimeWatch(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  return { pageErrors, consoleErrors };
}

async function assertClean(runtime) {
  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
}

async function assertNoOverflow(page) {
  const size = await page.evaluate(() => ({ width: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(size.html).toBeLessThanOrEqual(size.width + 1);
  expect(size.body).toBeLessThanOrEqual(size.width + 1);
}

function arenaSeed() {
  const state = defaultArenaState();
  state.onboardingComplete = true;
  state.profiles[0].name = "V1 Arena Sentinel";
  return state;
}

function gvgSeed(count = 30) {
  const workspace = defaultWorkspace();
  const roles = ["MAIN_BALL", "FRONTLINE_TANK", "HEALER", "FLEX_ASSASSIN", "JUNGLER_OBJECTIVE", "DUELIST", "ESCORT", "ANTI_ESCORT"];
  workspace.roster = Array.from({ length: count }, (_, index) => ({
    id: `v1-member-${index + 1}`, name: `Player ${String(index + 1).padStart(2, "0")}`, path: "Bamboocut - Dust",
    weapons: ["Everspring Umbrella", "Unfettered Rope Dart"], roles: [roles[index % roles.length]], team: index < 12 ? "Main Ball" : index < 21 ? "Flex A" : "Flex B",
    buildReference: "", exTechnique: "Everspring Umbrella: EX", exLevel: 3, normalProfile: "PvE / Normal", arenaProfile: "Arena", gvgSelectedProfile: "ARENA",
    availability: true, notes: "", antiHeal: true, aoeCc: index % 3 === 0,
  }));
  workspace.strategy.positions = Object.fromEntries(workspace.roster.map((member, index) => [member.id, { x: 8 + (index % 6) * 16, y: 10 + Math.floor(index / 6) * 17 }]));
  workspace.strategy.rallyPoints = [{ x: 50, y: 50, label: "Main rally" }];
  workspace.timeline = Array.from({ length: 24 }, (_, index) => ({ id: `v1-event-${index}`, label: `Plan ${index + 1}`, timeSeconds: 180 + index * 30, type: "PLAN" }));
  workspace.commander = { startingCoins: 100, events: Array.from({ length: 12 }, (_, index) => ({ id: `v1-coin-${index}`, timeSeconds: 240 + index * 45, amount: index % 2 ? -25 : 50, label: `Coin ${index + 1}` })) };
  workspace.duelist = { primary: workspace.roster[3]?.id ?? null, backup1: workspace.roster[7]?.id ?? null, backup2: workspace.roster[11]?.id ?? null };
  return workspace;
}

async function seed(page) {
  await page.addInitScript(({ arena, gvg }) => {
    if (sessionStorage.getItem("wwm_v1_seeded") === "1") return;
    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(arena));
    localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify(gvg));
    localStorage.setItem("wwm_library_favorites_v1", JSON.stringify(["bamboocut-dust-global-t96-calibrated"]));
    sessionStorage.setItem("wwm_v1_seeded", "1");
  }, { arena: arenaSeed(), gvg: gvgSeed() });
}

async function capture(page, route, name, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await assertNoOverflow(page);
  await page.screenshot({ path: `${QA}/${name}.png`, fullPage: true });
}

test("V1 state isolation survives workspace switches, deep links, refresh, history and clones", async ({ page }) => {
  const runtime = runtimeWatch(page);
  await seed(page);
  await page.goto(`${BASE}#pve/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("pve-overview")).toBeVisible();
  const pveBefore = await page.evaluate(() => localStorage.getItem("wwm_chars_v3"));
  expect(pveBefore).toBeTruthy();

  await page.goto(`${BASE}#arena/overview`, { waitUntil: "networkidle" });
  const arenaBefore = await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"));
  await expect(page.getByTestId("arena-overview")).toBeVisible();

  await page.goto(`${BASE}#gvg/roster`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-roster")).toBeVisible();
  await expect(page.getByLabel("Player name")).toHaveCount(30);
  const gvgBefore = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));

  await page.goto(`${BASE}#library/pve`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await page.goto(`${BASE}#pve/gear`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByLabel("PvE navigation").getByRole("button", { name: /^Gear/ })).toHaveAttribute("aria-current", "page");
  expect(await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"))).toBe(arenaBefore);
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"))).toBe(gvgBefore);

  await page.goto(`${BASE}#arena/matchups`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-matchup-result")).toBeVisible();
  await page.goBack({ waitUntil: "networkidle" });
  await expect(page.getByLabel("PvE navigation").getByRole("button", { name: /^Gear/ })).toHaveAttribute("aria-current", "page");
  await page.goForward({ waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-matchup-result")).toBeVisible();

  const pveBeforeArenaClone = await page.evaluate(() => localStorage.getItem("wwm_chars_v3"));
  await page.goto(`${BASE}#arena/reference`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Clone to my workspace/i }).first().click();
  expect(await page.evaluate(() => localStorage.getItem("wwm_chars_v3"))).toBe(pveBeforeArenaClone);

  const arenaBeforePveClone = await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"));
  const gvgBeforePveClone = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));
  await page.goto(`${BASE}#library/build/bamboocut-dust-global-t96-calibrated`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Clone to My Workspace$/ }).click();
  expect(await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"))).toBe(arenaBeforePveClone);
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"))).toBe(gvgBeforePveClone);

  const livePlan = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));
  await page.goto(`${BASE}#library/build/balanced-guild-war-roster-template`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Clone to My Workspace$/ }).click();
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"))).toBe(livePlan);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_library_gvg_clones_v1") || "[]").length)).toBeGreaterThan(0);
  await assertClean(runtime);
});

test("V1 corrupt/future storage recovers per domain and preserves a bounded backup", async ({ page }) => {
  const runtime = runtimeWatch(page);
  const arena = arenaSeed();
  await page.addInitScript((arena) => {
    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(arena));
    localStorage.setItem("wwm_gvg_workspace_v1", "{");
    localStorage.setItem("wwm_library_favorites_v1", "not-json");
  }, arena);
  await page.goto(`${BASE}#gvg/roster`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-roster")).toBeVisible();
  await expect(page.getByText(/Some saved Guild War data could not be loaded/i)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"))).toBe("{");
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1__recovery_backup_v1"))).toBe("{");
  await page.getByRole("button", { name: /Seed sample/i }).click();
  await expect(page.getByLabel("Player name").first()).toBeVisible();
  await page.waitForTimeout(30);
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_gvg_workspace_v1") || "{}").schema))).toBe("wwm-gvg-workspace");
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}").profiles[0].name))).toBe("V1 Arena Sentinel");

  await page.goto(`${BASE}#library/saved`, { waitUntil: "networkidle" });
  await expect(page.locator(".library-card")).toHaveCount(0);

  const future = arenaSeed(); future.schemaVersion = 99;
  await page.evaluate((future) => { localStorage.setItem("wwm_arena_state_v1", JSON.stringify(future)); sessionStorage.clear(); }, future);
  await page.goto(`${BASE}#arena/overview`, { waitUntil: "networkidle" });
  await expect(page.getByText(/Some saved Arena data could not be loaded/i)).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}").schemaVersion)).toBe(99);
  expect(await page.evaluate(() => Boolean(localStorage.getItem("wwm_arena_state_v1__recovery_backup_v1")))).toBeTruthy();
  await assertClean(runtime);
});

test("V1 public payloads fail closed and supplied strings stay text", async ({ page, request }) => {
  const runtime = runtimeWatch(page);
  const b64 = (value) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  const badGvg = JSON.parse('{"schema":"wwm-gvg-share","version":1,"kind":"ROSTER","privacy":{"playerNamesRedacted":true},"payload":{"__proto__":{"polluted":true},"roster":[]}}');
  await page.goto(`${BASE}#gvg-share=${b64(badGvg)}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-shared-invalid")).toBeVisible();
  await page.goto(`${BASE}#arena/shared/${"A".repeat(33000)}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Invalid Arena share/i)).toBeVisible();

  const response = await request.get(`${BASE}data/library-v1.json`);
  const document = await response.json();
  const entry = structuredClone(document.items[0]);
  entry.title = '<img src=x onerror="window.__V1_XSS__=1">';
  const envelope = { schemaVersion: 2, kind: "PVE_BUILD", sharedAt: new Date().toISOString(), source: "USER_SHARED", entry };
  await page.goto(`${BASE}#shared-build=${b64(envelope)}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-landing")).toBeVisible();
  expect(await page.locator('img[src="x"]').count()).toBe(0);
  expect(await page.evaluate(() => window.__V1_XSS__)).toBeUndefined();
  expect((await page.locator("body").innerText()).includes("<img src=x")).toBeTruthy();
  await assertClean(runtime);
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
    await expect(about).toBeVisible();
    await about.locator("summary").click();
    await expect(about.getByText("WWM Calc V1", { exact: true })).toBeVisible();
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
    await page.evaluate((count) => {
      const root = JSON.parse(localStorage.getItem("wwm_chars_v3") || "{}");
      const char = root.chars?.find((item) => item.id === root.activeCharId) ?? root.chars?.[0];
      const scheme = char?.schemes?.find((item) => item.id === root.activeSchemeId) ?? char?.schemes?.[0];
      if (!scheme?.gear?.length) return;
      const base = scheme.gear.map((item) => ({ ...item }));
      scheme.gear = Array.from({ length: count }, (_, index) => ({ ...base[index % base.length], id: `perf-${count}-${index}`, name: `Perf Gear ${index + 1}` }));
      localStorage.setItem("wwm_chars_v3", JSON.stringify(root));
    }, count);
    const start = Date.now();
    await page.reload({ waitUntil: "networkidle" });
    timings.pveInventory[count] = Date.now() - start;
    await assertNoOverflow(page);
  }

  const arena = arenaSeed();
  arena.profiles = Array.from({ length: 12 }, (_, index) => ({ ...arena.profiles[0], id: `perf-arena-${index}`, name: `Arena Candidate ${index + 1}`, arenaDimensions: { burst: (index % 4) * .08, survival: (index % 3) * .06 } }));
  arena.activeProfileId = arena.profiles[0].id;
  await page.evaluate((state) => localStorage.setItem("wwm_arena_state_v1", JSON.stringify(state)), arena);
  await page.goto(`${BASE}#arena/build`, { waitUntil: "networkidle" });
  let start = Date.now();
  await page.getByRole("button", { name: /Run Top 3/i }).click();
  await expect(page.locator(".arena-ranked-list > div")).toHaveCount(3);
  timings.arenaBestBuildMs = Date.now() - start;

  await page.evaluate((workspace) => localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify(workspace)), gvgSeed());
  start = Date.now();
  await page.goto(`${BASE}#gvg/roster`, { waitUntil: "networkidle" });
  await expect(page.getByLabel("Player name")).toHaveCount(30);
  timings.gvgRosterRenderMs = Date.now() - start;
  start = Date.now();
  await page.goto(`${BASE}#gvg/strategy`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-strategy-board")).toBeVisible();
  timings.gvgStrategyMs = Date.now() - start;

  await page.route("**/data/library-v1.json", async (route) => {
    const response = await route.fetch();
    const document = await response.json();
    const source = document.items[0];
    document.items = Array.from({ length: 80 }, (_, index) => ({ ...structuredClone(source), id: `synthetic-${index}`, title: `Synthetic Reference ${index + 1}` }));
    await route.fulfill({ response, json: document });
  });
  await page.goto(`${BASE}#library/pve`, { waitUntil: "networkidle" });
  await expect(page.locator(".library-card")).toHaveCount(80);
  start = Date.now();
  await page.getByLabel("Search Library").fill("Synthetic Reference 79");
  await expect(page.locator(".library-card")).toHaveCount(1);
  timings.libraryFilterMs = Date.now() - start;
  fs.writeFileSync("V1_PERFORMANCE_REPORT.json", JSON.stringify({ success: true, timings, scale: { pveInventory: [50,100,250], arenaProfiles: 12, gvgRoster: 30, libraryEntries: 80 } }, null, 2));
  await assertClean(runtime);
});
