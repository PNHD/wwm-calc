import { verifyProfileOwnership } from "./runtime-profile-owner-modal.helpers.mjs";
import fs from "node:fs";
import { test, expect } from "@playwright/test";

const BASE = process.env.PRODUCTION_URL || "http://127.0.0.1:4173/";
const qaDir = "visual-qa";
fs.mkdirSync(qaDir, { recursive: true });

async function switchWorkspace(page, name) { const switcher = page.getByRole("navigation", { name: "Product workspaces" }); await expect(switcher).toBeVisible(); await switcher.getByRole("button", { name: new RegExp(name, "i") /* COMPETITIVE_V2_WORKSPACE_ACCESSIBLE_NAME */ }).click(); }
async function pve(page, name) { await page.getByLabel("PvE navigation").getByRole("button", { name: new RegExp(`^${name}`) }).click(); }
async function gvg(page, name) { await page.getByLabel("Guild War navigation").getByRole("button", { name: new RegExp(`^${name}`) }).click(); }
async function noOverflow(page) { const metrics = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth })); expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1); expect(metrics.body).toBeLessThanOrEqual(metrics.viewport + 1); }

for (const width of [390, 1440]) test(`Team preserves saved solo DPS and rejects missing context at ${width}`, async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(BASE + "#pve/combat", { waitUntil: "networkidle" });
  const tools = async () => { if (await page.locator('.workspace-tools:not([open]) > summary').count()) await page.locator('.workspace-tools > summary').click(); };
  await tools();
  await page.getByRole("button", { name: "Load observed T96", exact: true }).click();
  await page.goto(BASE + "#pve/rotations", { waitUntil: "networkidle" });
  const skillName = await page.locator('tbody tr td[title]').first().getAttribute("title");
  expect(skillName).toBeTruthy();
  const profiles = await page.evaluate(skillName => {
    const data = JSON.parse(localStorage.getItem("wwm_chars_v3"));
    const source = data.chars.find(c => c.id === data.activeCharId).schemes.find(s => s.id === data.activeSchemeId);
    const paths = ["bamboocut-dust", "bellstrike-umbra", "silkbind-jade"];
    const clones = paths.map((path, index) => {
      const scheme = structuredClone(source);
      scheme.id = `team-scheme-${index}`;
      scheme.combatConfig = { ...scheme.combatConfig, selectedBuild: path, food: index !== 1, bowSelect: index === 1 ? "aff" : "crit", selectedInnerWays: index === 2 ? ["blossom_barrage", "breaking_point"] : ["morale_chant", "breaking_point"], tierKey: index === 1 ? "custom" : "405|0.65b", customDef: 480, customRes: 0.8, starweaveDistance: "far", skillOverrides: {}, timingOverrides: {} };
      if (index === 0) scheme.combatConfig.skillOverrides[skillName] = { outerRatio: 0, eleRatio: 0, fixed: 0 };
      return { id: `team-char-${index}`, name: `Saved ${path}`, schemes: [scheme] };
    });
    const missing = structuredClone(clones[0]); missing.id = "team-missing"; missing.name = "Missing context"; delete missing.schemes[0].combatConfig;
    const empty = structuredClone(clones[0]); empty.id = "team-empty"; empty.name = "Empty profile"; empty.schemes[0].gear = [];
    const unknown = structuredClone(clones[0]); unknown.id = "team-unknown"; unknown.name = "Unknown target"; unknown.schemes[0].combatConfig.tierKey = "constructor";
    data.chars.push(...clones, missing, empty, unknown);
    localStorage.setItem("wwm_chars_v3", JSON.stringify(data));
    return clones.map(c => ({ charId: c.id, profileId: `${c.id}:${c.schemes[0].id}` }));
  }, skillName);
  await page.reload({ waitUntil: "networkidle" });
  const solos = [];
  for (const profile of profiles) {
    await tools();
    await page.getByRole("combobox", { name: "Current role", exact: true }).selectOption(profile.charId);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("wwm_chars_v3")).activeCharId)).toBe(profile.charId);
    await page.reload({ waitUntil: "networkidle" });
    solos.push(await page.evaluate(() => window.__WWM_SCENARIO_DIAGNOSTIC__.headlineDps));
  }
  expect(solos.every(dps => Number.isFinite(dps) && dps > 0)).toBe(true);
  await page.goto(BASE + "#pve/team", { waitUntil: "networkidle" });
  for (let i = 0; i < profiles.length; i++) {
    const profile = page.getByLabel(`Member ${i + 1} profile`, { exact: true });
    await profile.selectOption(profiles[i].profileId);
    const solo = await profile.locator("..").locator("span").last().innerText();
    expect(Number(solo.replace(/[^0-9]/g, ""))).toBe(Math.round(solos[i]));
  }
  const displayed = async () => Number((await page.getByTestId("team-dps").innerText()).replace(/[^0-9]/g, ""));
  await expect.poll(displayed).toBe(Math.round(solos.reduce((sum, dps) => sum + dps, 0)));
  const before = await displayed();
  const vulnerability = page.getByLabel(/Vulnerability \+8%/);
  expect((await vulnerability.boundingBox()).width).toBeLessThanOrEqual(20);
  await vulnerability.check();
  await expect.poll(displayed).toBe(Math.round(solos.reduce((sum, dps) => sum + dps, 0) * 1.08));
  await vulnerability.uncheck();
  // Change the active profile to one outside the team: saved members keep their contexts.
  await tools(); await page.getByRole("combobox", { name: "Current role", exact: true }).selectOption({ label: "Main Hero" });
  await page.locator('.workspace-tools > summary').click();
  await expect.poll(displayed).toBe(before);
  await page.getByLabel("Member 4 profile", { exact: true }).selectOption(profiles[0].profileId);
  await expect.poll(displayed).toBe(Math.round(solos.reduce((sum, dps) => sum + dps, solos[0])));
  await page.getByLabel("Member 4 profile", { exact: true }).selectOption("");
  await noOverflow(page);
  fs.writeFileSync(`${qaDir}/team-saved-${width}.json`, JSON.stringify({ profiles, solos, displayed: before }, null, 2));
  await page.screenshot({ path: `${qaDir}/team-saved-${width}.png` });
  await page.getByTestId("team-dps").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${qaDir}/team-metrics-${width}.png` });
  await page.getByLabel("Member 1 path", { exact: true }).selectOption("bamboocut-wind");
  await expect(page.getByTestId("team-dps")).toHaveText(/Unavailable/);
  await expect(page.getByRole("status").filter({ hasText: "Path differs" })).toBeVisible();
  await expect(page.locator(".team-timeline")).toHaveCount(0);
  await page.getByLabel("Member 1 path", { exact: true }).selectOption("bamboocut-dust");
  for (const [charId, message] of [["team-missing", "save its combat context"], ["team-empty", "No equipped gear"], ["team-unknown", "target tier is unavailable"]]) {
    await page.getByLabel("Member 4 profile", { exact: true }).selectOption(`${charId}:team-scheme-0`);
    await expect(page.getByTestId("team-dps")).toHaveText(/Unavailable/);
    await expect(page.getByRole("status").filter({ hasText: message })).toBeVisible();
  }
  await page.getByTestId("team-dps").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${qaDir}/team-unavailable-${width}.png` });
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test("Workspace IA separates PvE, Arena and Guild War V2 while preserving deep-link context", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(page.getByTestId("pve-overview")).toBeVisible();
  await expect(page.getByLabel("PvE navigation").getByRole("button", { name: /^Gear/ })).toBeVisible();
  await pve(page, "Build");
  expect(new URL(page.url()).hash).toBe("#pve/build");

  await switchWorkspace(page, "Arena");
  await expect(page.getByTestId("arena-overview")).toBeVisible();
  await expect(page.getByLabel("Arena mode").first()).toBeVisible();

  await switchWorkspace(page, "Guild War");
  await expect(page.getByTestId("gvg-overview")).toBeVisible();
  const gvgNav = page.getByLabel("Guild War navigation");
  await expect(gvgNav.getByRole("button", { name: /^Roster/ })).toBeVisible();
  await expect(gvgNav.getByRole("button", { name: /^Strategy/ })).toBeVisible();

  await switchWorkspace(page, "PvE");
  await expect(page.getByLabel("PvE navigation").getByRole("button", { name: /^Build/ })).toHaveAttribute("aria-current", "page");
  expect(new URL(page.url()).hash).toBe("#pve/build");

  const pveSwitch = page.getByRole("navigation", { name: "Product workspaces" }).getByRole("button", { name: /^PvE/ });
  await pveSwitch.focus(); await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BUTTON");

  await page.goto(`${BASE}#legacy-share=preserve-me`, { waitUntil: "networkidle" });
  expect(new URL(page.url()).hash).toBe("#legacy-share=preserve-me");
});

test("Responsive visual QA covers PvE, Arena V2 and Guild War V2", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(BASE, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${qaDir}/1440-pve-overview.png`, fullPage: true });
  await pve(page, "Gear"); await expect(page.getByLabel("Empty gear inventory")).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-pve-gear.png`, fullPage: true });
  await pve(page, "Compare"); await expect(page.getByText("Current vs Candidate", { exact: true })).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-pve-compare.png`, fullPage: true });
  await pve(page, "Best Build"); await expect(page.getByText(/Best build/i).first()).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-pve-best-build.png`, fullPage: true });

  await page.goto(`${BASE}#arena/overview`, { waitUntil: "networkidle" }); await expect(page.getByTestId("arena-overview")).toBeVisible(); await noOverflow(page); await page.screenshot({ path: `${qaDir}/1440-arena-v2-overview.png`, fullPage: true });
  await page.goto(`${BASE}#arena/matchups`, { waitUntil: "networkidle" }); await expect(page.getByTestId("arena-matchup-result")).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-arena-v2-matchup.png`, fullPage: true });

  await page.goto(`${BASE}#gvg/overview`, { waitUntil: "networkidle" }); await expect(page.getByTestId("gvg-overview")).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-gvg-v2-overview.png`, fullPage: true });
  await gvg(page, "Roster"); const roster = page.getByTestId("gvg-roster"); await roster.getByRole("button", { name: /Seed 30-player sample/i }).click(); await expect(roster.getByLabel("Player name")).toHaveCount(30); await expect(roster.getByRole("button", { name: /Add member/i })).toBeDisabled(); await page.screenshot({ path: `${qaDir}/1440-gvg-v2-roster-30.png`, fullPage: true });
  await gvg(page, "Strategy"); await expect(page.getByTestId("gvg-strategy")).toBeVisible(); await expect(page.getByTestId("gvg-objective-map" /* COMPETITIVE_V2_WORKSPACE_OBJECTIVE_MAP_SCOPE */).locator('button[data-objective-id="BULWARK"]')).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-gvg-v2-strategy.png`, fullPage: true });
  await gvg(page, "Timeline"); await expect(page.getByTestId("gvg-timeline")).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-gvg-v2-timeline.png`, fullPage: true });

  for (const [width, height] of [[1024,900],[390,844]]) {
    await page.setViewportSize({ width, height });
    for (const route of ["#pve/overview","#arena/overview","#gvg/overview"]) { await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" }); await noOverflow(page); }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}#pve/overview`); await expect(page.getByRole("navigation", { name: "PvE mobile navigation" })).toBeVisible();
  await page.goto(`${BASE}#arena/overview`); await expect(page.getByRole("navigation", { name: "Arena mobile navigation" })).toBeVisible();
  await page.goto(`${BASE}#gvg/overview`); await expect(page.getByRole("navigation", { name: "Guild War mobile navigation" })).toBeVisible();
});

for (const width of [390, 1440]) test(`character ownership survives equal scheme IDs, switching and refresh at ${width}`, async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await verifyProfileOwnership(page, BASE, width);
  expect(errors).toEqual([]);
});

test("changing character invalidates jobs even when its scheme is byte-identical", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(BASE + "#pve/combat", { waitUntil: "networkidle" });
  const tools = async () => { const closed = page.locator(".workspace-tools:not([open]) > summary"); if (await closed.count()) await closed.click(); };
  await tools(); await page.getByRole("button", { name: "Load observed T96", exact: true }).click();
  const fixture = await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem("wwm_chars_v3"));
    const a = structuredClone(root.chars.find(char => char.id === root.activeCharId));
    const scheme = a.schemes.find(item => item.id === root.activeSchemeId);
    scheme.gear = scheme.gear.flatMap(item => Array.from({ length: 4 }, (_, i) => ({ ...item, id: `${item.id}:job-${i}`, subs: [{ type: "Max Physical ATK", val: String(100 + i), isTuned: false }], isEquipped: item.isEquipped && i === 0 })));
    a.schemes = [scheme];
    const twin = { ...structuredClone(a), id: "job-twin", name: "Identical scheme owner" };
    return { root: { ...root, chars: [a, twin], activeCharId: a.id }, aId: a.id };
  });
  await tools(); await page.getByRole("button", { name: "Data", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export / Import Data", exact: true });
  await dialog.getByLabel("Data Content:", { exact: true }).fill(JSON.stringify(fixture.root));
  await Promise.all([page.waitForEvent("load"), dialog.getByRole("button", { name: "Import", exact: true }).click()]);
  await page.waitForLoadState("networkidle");
  const selectRole = async id => {
    await tools(); await page.getByRole("combobox", { name: "Current role", exact: true }).selectOption(id);
    const open = page.locator(".workspace-tools[open] > summary"); if (await open.count()) await open.click();
  };
  // The first load derives the new inventory panel. Copy that settled scheme so
  // the owner switch cannot be detected accidentally through a content difference.
  const settled = await page.evaluate(aId => {
    const root = JSON.parse(localStorage.getItem("wwm_chars_v3"));
    root.chars.find(char => char.id === "job-twin").schemes = structuredClone(root.chars.find(char => char.id === aId).schemes);
    return root;
  }, fixture.aId);
  await tools(); await page.getByRole("button", { name: "Data", exact: true }).click();
  await dialog.getByLabel("Data Content:", { exact: true }).fill(JSON.stringify(settled));
  await Promise.all([page.waitForEvent("load"), dialog.getByRole("button", { name: "Import", exact: true }).click()]);
  await page.waitForLoadState("networkidle");
  const persistedSchemes = await page.evaluate(aId => {
    const root = JSON.parse(localStorage.getItem("wwm_chars_v3"));
    return { owner: root.chars.find(char => char.id === aId).schemes, twin: root.chars.find(char => char.id === "job-twin").schemes };
  }, fixture.aId);
  // Report differing persisted fields if hydration fails, then require byte identity.
  expect(persistedSchemes.twin).toEqual(persistedSchemes.owner);
  expect(JSON.stringify(persistedSchemes.twin)).toBe(JSON.stringify(persistedSchemes.owner));
  await page.goto(BASE + "#pve/simulation", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.Worker = class {
      postMessage(job) { window.__lateOwnerWorker = () => this.onmessage({ data: { generation: job.generation, fingerprint: job.fingerprint, error: "WRONG_PROFILE_WORKER_RESULT" } }); }
      terminate() {}
    };
  });
  await page.getByRole("button", { name: /Run Simulation/ }).click();
  await expect(page.getByRole("button", { name: "Cancel simulation" })).toBeVisible();
  await selectRole("job-twin");
  await page.evaluate(() => window.__lateOwnerWorker());
  await expect(page.locator("body")).not.toContainText("WRONG_PROFILE_WORKER_RESULT");
  await expect(page.getByRole("button", { name: "Cancel simulation" })).toHaveCount(0);
  await selectRole(fixture.aId);
  await page.goto(BASE + "#pve/best-build", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Find best build", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel search" })).toBeVisible();
  await selectRole("job-twin");
  await expect(page.getByRole("button", { name: "Cancel search" })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Best combination");
  expect(errors).toEqual([]);
});
