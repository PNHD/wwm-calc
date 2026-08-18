import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { defaultArenaState } from "../src/arena/arena-core.mjs";
import { defaultWorkspace } from "../src/gvg/model.js";

const BASE = "http://127.0.0.1:4173/";
const QA = "visual-qa/v1";
fs.mkdirSync(QA, { recursive: true });

test.describe.configure({ mode: "serial" });

function watchRuntime(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  return { pageErrors, consoleErrors };
}

async function noOverflow(page) {
  const result = await page.evaluate(() => ({ width: innerWidth, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(result.doc).toBeLessThanOrEqual(result.width + 1);
  expect(result.body).toBeLessThanOrEqual(result.width + 1);
  return result;
}

async function screenshot(page, route, name, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(80);
  await noOverflow(page);
  await page.screenshot({ path: `${QA}/${name}.png`, fullPage: true });
}

function seededArena() {
  const state = defaultArenaState();
  state.onboardingComplete = true;
  state.profiles[0].name = "V1 Arena Sentinel";
  return state;
}

function member(index) {
  return {
    id: `v1-member-${index}`,
    name: `Player ${String(index).padStart(2, "0")}`,
    path: index % 5 === 0 ? "Stonesplit - Might" : "Bamboocut - Dust",
    weapons: index % 5 === 0 ? ["Thundercry Blade", "Stormbreaker Spear"] : ["Everspring Umbrella", "Unfettered Rope Dart"],
    roles: [index % 6 === 0 ? "HEALER" : index % 5 === 0 ? "FRONTLINE_TANK" : index % 4 === 0 ? "DUELIST" : "MAIN_BALL"],
    team: index <= 12 ? "Main Ball" : index <= 21 ? "Flex A" : "Flex B",
    buildReference: "",
    exTechnique: index % 5 === 0 ? "Stormbreaker Spear: EX" : "Everspring Umbrella: EX",
    exLevel: 3,
    normalProfile: "PvE / Normal",
    arenaProfile: "Arena",
    gvgSelectedProfile: "ARENA",
    availability: true,
    notes: "",
    antiHeal: index % 5 !== 0,
    aoeCc: index % 3 === 0,
  };
}

function seededGvg(count = 30) {
  const workspace = defaultWorkspace();
  workspace.roster = Array.from({ length: count }, (_, index) => member(index + 1));
  workspace.strategy.positions = Object.fromEntries(workspace.roster.map((item, index) => [item.id, { x: 8 + (index % 6) * 16, y: 12 + Math.floor(index / 6) * 16 }]));
  workspace.strategy.rallyPoints = [{ x: 50, y: 50, label: "Main rally" }];
  workspace.timeline = Array.from({ length: 24 }, (_, index) => ({ id: `v1-event-${index}`, label: `Plan ${index + 1}`, timeSeconds: 180 + index * 30, type: "PLAN" }));
  workspace.commander = { startingCoins: 100, events: Array.from({ length: 12 }, (_, index) => ({ id: `v1-coin-${index}`, timeSeconds: 240 + index * 45, amount: index % 2 ? -25 : 50, label: `Coin event ${index + 1}` })) };
  workspace.duelist = { primary: workspace.roster[3]?.id ?? null, backup1: workspace.roster[7]?.id ?? null, backup2: workspace.roster[11]?.id ?? null };
  return workspace;
}

async function seedReleaseState(page) {
  await page.addInitScript(({ arena, gvg }) => {
    if (sessionStorage.getItem("wwm_v1_release_seeded") === "1") return;
    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(arena));
    localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify(gvg));
    localStorage.setItem("wwm_library_favorites_v1", JSON.stringify(["bamboocut-dust-global-t96-calibrated"]));
    sessionStorage.setItem("wwm_v1_release_seeded", "1");
  }, { arena: seededArena(), gvg: seededGvg(30) });
}

test("V1 cross-workspace state isolation survives switching, refresh, history and Library clones", async ({ page, context }) => {
  const runtime = watchRuntime(page);
  await seedReleaseState(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });

  await page.goto(`${BASE}#pve/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("pve-overview")).toBeVisible();
  const pveInitial = await page.evaluate(() => localStorage.getItem("wwm_chars_v3"));
  expect(pveInitial).toBeTruthy();

  await page.goto(`${BASE}#arena/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-overview")).toBeVisible();
  const arenaInitial = await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"));

  await page.goto(`${BASE}#gvg/roster`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-roster")).toBeVisible();
  await expect(page.getByLabel("Player name")).toHaveCount(30);
  const gvgInitial = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));

  await page.goto(`${BASE}#library/pve`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Saved 1$/ })).toBeVisible();

  await page.goto(`${BASE}#pve/overview`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByTestId("pve-overview")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"))).toBe(arenaInitial);
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"))).toBe(gvgInitial);

  await page.goto(`${BASE}#pve/gear`, { waitUntil: "networkidle" });
  await expect(page.getByLabel("PvE navigation").getByRole("button", { name: /^Gear/ })).toHaveAttribute("aria-current", "page");
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
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}").profiles.length)).toBeGreaterThan(1);

  const arenaBeforePveClone = await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"));
  const gvgBeforePveClone = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));
  await page.goto(`${BASE}#library/build/bamboocut-dust-global-t96-calibrated`, { waitUntil: "networkidle" });
  const schemeCountBefore = await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("wwm_chars_v3") || "{}");
    const char = value.chars?.find((item) => item.id === value.activeCharId) ?? value.chars?.[0];
    return char?.schemes?.length ?? 0;
  });
  await page.getByRole("button", { name: /^Clone to My Workspace$/ }).click();
  const schemeCountAfter = await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("wwm_chars_v3") || "{}");
    const char = value.chars?.find((item) => item.id === value.activeCharId) ?? value.chars?.[0];
    return char?.schemes?.length ?? 0;
  });
  expect(schemeCountAfter).toBe(schemeCountBefore + 1);
  expect(await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"))).toBe(arenaBeforePveClone);
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"))).toBe(gvgBeforePveClone);

  const livePlanBefore = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));
  await page.goto(`${BASE}#library/build/balanced-guild-war-roster-template`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Clone to My Workspace$/ }).click();
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"))).toBe(livePlanBefore);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_library_gvg_clones_v1") || "[]").length)).toBeGreaterThan(0);

  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
});

test("V1 corrupt and future local data recover per-domain without blanking the app", async ({ page }) => {
  const runtime = watchRuntime(page);
  const arena = seededArena();
  await page.addInitScript(({ arena }) => {
    localStorage.setItem("wwm_selected_build", "bamboocut-dust");
    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(arena));
    localStorage.setItem("wwm_gvg_workspace_v1", "{");
    localStorage.setItem("wwm_library_favorites_v1", "not-json");
  }, { arena });
  await page.goto(`${BASE}#gvg/roster`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-roster")).toBeVisible();
  await expect(page.getByText(/Some saved Guild War data could not be loaded/i)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"))).toBe("{");
  expect(await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1__recovery_backup_v1"))).toBe("{");
  await page.getByRole("button", { name: /Seed sample/i }).click();
  await expect(page.getByLabel("Player name").first()).toBeVisible();
  await page.waitForTimeout(50);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_gvg_workspace_v1") || "{}"));
  expect(saved.schema).toBe("wwm-gvg-workspace");
  expect(Array.isArray(saved.roster)).toBeTruthy();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}").profiles[0].name)).toBe("V1 Arena Sentinel");

  await page.goto(`${BASE}#library/saved`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await expect(page.locator(".library-card")).toHaveCount(0);

  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
});

test("V1 Arena future schema is rejected visibly and preserved for recovery", async ({ page }) => {
  const runtime = watchRuntime(page);
  const future = seededArena();
  future.schemaVersion = 99;
  await page.addInitScript((future) => localStorage.setItem("wwm_arena_state_v1", JSON.stringify(future)), future);
  await page.goto(`${BASE}#arena/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-overview")).toBeVisible();
  await expect(page.getByText(/Some saved Arena data could not be loaded/i)).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}").schemaVersion)).toBe(99);
  expect(await page.evaluate(() => Boolean(localStorage.getItem("wwm_arena_state_v1__recovery_backup_v1")))).toBeTruthy();
  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
});

test("V1 malicious public payloads fail closed and text never becomes arbitrary HTML", async ({ page }) => {
  const runtime = watchRuntime(page);
  const b64 = (value) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

  const badGvg = JSON.parse('{"schema":"wwm-gvg-share","version":1,"kind":"ROSTER","privacy":{"playerNamesRedacted":true},"payload":{"__proto__":{"polluted":true},"roster":[]}}');
  await page.goto(`${BASE}#gvg-share=${b64(badGvg)}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-shared-invalid")).toBeVisible();

  await page.goto(`${BASE}#arena/shared/${"A".repeat(33000)}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Invalid Arena share/i)).toBeVisible();

  const response = await page.request.get(`${BASE}data/library-v1.json`);
  const doc = await response.json();
  const entry = structuredClone(doc.items[0]);
  entry.title = '<img src=x onerror="window.__V1_XSS__=1">';
  const envelope = { schemaVersion: 2, kind: "PVE_BUILD", sharedAt: new Date().toISOString(), source: "USER_SHARED", entry };
  await page.goto(`${BASE}#shared-build=${b64(envelope)}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-landing")).toBeVisible();
  expect(await page.locator('img[src="x"]').count()).toBe(0);
  expect(await page.evaluate(() => window.__V1_XSS__)).toBeUndefined();
  expect((await page.locator("body").innerText()).includes("<img src=x")).toBeTruthy();

  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
});

test("V1 responsive QA captures required 1440, 1024 and 390 surfaces", async ({ page, context }) => {
  const runtime = watchRuntime(page);
  await seedReleaseState(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });

  await page.goto(`${BASE}#pve/gear`, { waitUntil: "networkidle" });
  const observed = page.getByRole("button", { name: /Load observed T96/i });
  if (await observed.count()) { await observed.click(); await page.waitForTimeout(350); }

  for (const [route, name] of [
    ["#pve/overview", "1440-pve-overview"], ["#pve/gear", "1440-pve-gear"], ["#pve/best-build", "1440-pve-best-build"],
    ["#arena/overview", "1440-arena-overview"], ["#arena/matchups", "1440-arena-matchup"],
    ["#gvg/overview", "1440-guild-war-overview"], ["#gvg/strategy", "1440-guild-war-strategy"], ["#library", "1440-library"],
  ]) await screenshot(page, route, name, 1440, 960);

  for (const [route, name] of [
    ["#pve/overview", "1024-pve"], ["#arena/matchups", "1024-arena"], ["#gvg/strategy", "1024-guild-war-strategy"], ["#library", "1024-library"],
  ]) await screenshot(page, route, name, 1024, 900);

  await screenshot(page, "#pve/gear", "390-pve-gear", 390, 844);
  await expect(page.getByRole("navigation", { name: "PvE mobile navigation" })).toBeVisible();
  await screenshot(page, "#pve/compare", "390-pve-compare", 390, 844);
  await screenshot(page, "#arena/matchups", "390-arena-matchup", 390, 844);
  await expect(page.getByRole("navigation", { name: "Arena mobile navigation" })).toBeVisible();
  await screenshot(page, "#gvg/roster", "390-guild-war-roster", 390, 844);
  await expect(page.getByRole("navigation", { name: "Guild War mobile navigation" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}#library/build/bamboocut-dust-global-t96-calibrated`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Share$/ }).click();
  const shareLink = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(shareLink, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-landing")).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: `${QA}/390-library-shared-landing.png`, fullPage: true });

  for (const route of ["#pve/overview", "#arena/overview", "#gvg/overview", "#library"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    const about = page.getByTestId("model-about");
    await expect(about).toBeVisible();
    await about.locator("summary").click();
    await expect(page.getByText("WWM Calc V1", { exact: true })).toBeVisible();
    const report = about.getByRole("link", { name: /Report bad data/i });
    await expect(report).toHaveAttribute("href", /github\.com\/PNHD\/wwm-calc\/issues\/new/);
    await about.locator("summary").click();
  }

  await page.goto(`${BASE}#arena/overview`, { waitUntil: "networkidle" });
  const arenaAbout = page.getByTestId("model-about");
  await expect(arenaAbout).toBeVisible();
  await arenaAbout.locator("summary").click();
  await expect(arenaAbout.getByText(/Arena output is not empirical win probability/i)).toBeVisible();

  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
});

test("V1 representative scale remains bounded and records browser operation timings", async ({ page }) => {
  const runtime = watchRuntime(page);
  const timings = { pveInventory: {}, arenaBestBuildMs: null, gvgRosterRenderMs: null, gvgStrategyInteractionMs: null, libraryFilterMs: null };

  await page.goto(`${BASE}#pve/gear`, { waitUntil: "networkidle" });
  const observed = page.getByRole("button", { name: /Load observed T96/i });
  if (await observed.count()) { await observed.click(); await page.waitForTimeout(300); }
  for (const count of [50, 100, 250]) {
    await page.evaluate((count) => {
      const data = JSON.parse(localStorage.getItem("wwm_chars_v3") || "{}");
      const char = data.chars?.find((item) => item.id === data.activeCharId) ?? data.chars?.[0];
      const scheme = char?.schemes?.find((item) => item.id === data.activeSchemeId) ?? char?.schemes?.[0];
      if (!scheme || !Array.isArray(scheme.gear) || !scheme.gear.length) return;
      const baseGear = scheme.gear.map((item) => ({ ...item }));
      scheme.gear = Array.from({ length: count }, (_, index) => ({ ...baseGear[index % baseGear.length], id: `perf-gear-${count}-${index}`, name: `Perf Gear ${index + 1}` }));
      localStorage.setItem("wwm_chars_v3", JSON.stringify(data));
    }, count);
    const start = Date.now();
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByLabel("PvE navigation").getByRole("button", { name: /^Gear/ })).toHaveAttribute("aria-current", "page");
    timings.pveInventory[count] = Date.now() - start;
    await noOverflow(page);
  }

  const arena = seededArena();
  arena.profiles = Array.from({ length: 12 }, (_, index) => ({ ...arena.profiles[0], id: `perf-arena-${index}`, name: `Arena Candidate ${index + 1}`, arenaDimensions: { burst: (index % 4) * 0.08, survival: (index % 3) * 0.06 } }));
  arena.activeProfileId = arena.profiles[0].id;
  await page.evaluate((arena) => localStorage.setItem("wwm_arena_state_v1", JSON.stringify(arena)), arena);
  await page.goto(`${BASE}#arena/build`, { waitUntil: "networkidle" });
  let start = Date.now();
  await page.getByRole("button", { name: /Run Top 3/i }).click();
  await expect(page.locator(".arena-ranked-list > div")).toHaveCount(3);
  timings.arenaBestBuildMs = Date.now() - start;

  await page.evaluate((workspace) => localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify(workspace)), seededGvg(30));
  start = Date.now();
  await page.goto(`${BASE}#gvg/roster`, { waitUntil: "networkidle" });
  await expect(page.getByLabel("Player name")).toHaveCount(30);
  timings.gvgRosterRenderMs = Date.now() - start;
  start = Date.now();
  await page.goto(`${BASE}#gvg/strategy`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-strategy-board")).toBeVisible();
  await page.getByTestId("gvg-strategy-board").click({ position: { x: 140, y: 140 } });
  timings.gvgStrategyInteractionMs = Date.now() - start;

  await page.route("**/data/library-v1.json", async (route) => {
    const response = await route.fetch();
    const doc = await response.json();
    const source = doc.items[0];
    doc.items = Array.from({ length: 80 }, (_, index) => ({ ...structuredClone(source), id: `synthetic-v1-${index}`, title: `Synthetic Reference ${index + 1}`, createdDate: source.createdDate, lastReviewedDate: source.lastReviewedDate }));
    await route.fulfill({ response, json: doc });
  });
  await page.goto(`${BASE}#library/pve`, { waitUntil: "networkidle" });
  await expect(page.locator(".library-card")).toHaveCount(80);
  start = Date.now();
  await page.getByLabel("Search Library").fill("Synthetic Reference 79");
  await expect(page.locator(".library-card")).toHaveCount(1);
  timings.libraryFilterMs = Date.now() - start;

  fs.writeFileSync("V1_PERFORMANCE_REPORT.json", JSON.stringify({ success: true, timings, bounds: { pveInventory: [50, 100, 250], arenaCandidates: 12, arenaResults: 3, gvgRoster: 30, gvgTimeline: 24, librarySynthetic: 80 } }, null, 2));
  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
});
