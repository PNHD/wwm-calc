import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const BASE = "http://127.0.0.1:4173/";
const BAMB = "global2-bamboocut-dust-t96-1106";
const JADE = "global2-silkbind-jade-t96-reference";
const GVG = "gvg-bamboocut-dust-antiheal-zone";
const ROSTER = "gvg-balanced-roster-template";
const STRATEGY = "gvg-strategy-template-example";
const ARENA = "arena-bamboocut-dust-mechanics";
const ARENA_REF = "arena-bamboocut-wind-reference";
const ARENA_3V3 = "arena-stonesplit-3v3-reference";

const b64 = (value) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

async function setStorage(page, values) {
  await page.addInitScript((seed) => {
    for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  }, values);
}

async function libraryJson() {
  return JSON.parse(await readFile(new URL("../public/data/library-v1.json", import.meta.url), "utf8"));
}

async function cleanConsole(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`page:${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console:${message.text()}`); });
  return failures;
}

test("Library routing, filtering, trust labels, favorites and old workspace deep links", async ({ page }) => {
  const failures = await cleanConsole(page);
  await page.goto(`${BASE}#library`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Community Library/i })).toBeVisible();
  await expect(page.getByText("FEATURED REFERENCES")).toBeVisible();
  await page.getByRole("button", { name: "PvE Builds" }).click();
  await expect(page.getByText("Bamboocut-Dust · T96", { exact: true })).toBeVisible();
  await page.getByPlaceholder(/Search title/i).fill("Silkbind");
  await expect(page.getByText("Silkbind-Jade · T96 Reference", { exact: true })).toBeVisible();
  await page.getByPlaceholder(/Search title/i).fill("");
  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByLabel("Path").selectOption("Bamboocut-Dust");
  await expect(page.getByText("Bamboocut-Dust · T96", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Clear filters/i }).click();
  await page.getByText("Bamboocut-Dust · T96", { exact: true }).click();
  await expect(page.getByTestId("library-build-detail")).toBeVisible();
  await expect(page.getByText("CALIBRATED", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Save$/ }).click();
  await page.getByRole("button", { name: "Saved" }).click();
  await expect(page.getByText("Bamboocut-Dust · T96", { exact: true })).toBeVisible();
  await page.goto(`${BASE}#pve/build`, { waitUntil: "networkidle" });
  await expect(page.getByText(/Optimize and compare the equipped build/i)).toBeVisible();
  await page.goto(`${BASE}#gvg/overview`, { waitUntil: "networkidle" });
  await expect(page.getByText(/30-player composition/i)).toBeVisible();
  expect(failures).toEqual([]);
});

test("Read-only detail, clone isolation, reference compare and full build-to-build diff", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const live = {
    version: 3,
    activeCharId: "char-a",
    activeSchemeId: "scheme-live",
    chars: [{ id: "char-a", name: "Live", schemes: [{ id: "scheme-live", name: "Live Build", panel: { minOuter: 1614, maxOuter: 2777, crit: 132.5, prec: 122.1, outerPen: 43.5, allArts: 5.6, bossDmg: 5.3 }, gear: [{ slot: "Weapon1", name: "Live Umbrella", set: "Weapon" }] }] }],
  };
  await setStorage(page, { wwm_chars_v3: live });
  await page.goto(`${BASE}#library/build/${BAMB}`, { waitUntil: "networkidle" });
  await expect(page.getByText("WHY THIS BUILD", { exact: true })).toBeVisible();
  await expect(page.getByText("T96 dummy validation ±2.50%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Compare with My Build$/ }).click();
  await expect(page.getByTestId("library-compare")).toBeVisible();
  await expect(page.getByText("BUILD DIFFERENCE VIEW", { exact: true })).toBeVisible();
  await expect(page.getByText("GEAR", { exact: true })).toBeVisible();
  await expect(page.getByText("ATTUNEMENT", { exact: true })).toBeVisible();
  await expect(page.getByText("CHANGED · MENU PANEL", { exact: true })).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem("wwm_chars_v3"));
  await page.goto(`${BASE}#library/build/${JADE}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Clone to My Workspace$/ }).click();
  const afterClone = JSON.parse(await page.evaluate(() => localStorage.getItem("wwm_chars_v3")));
  const activeChar = afterClone.chars.find((char) => char.id === afterClone.activeCharId);
  expect(afterClone.activeSchemeId).toBe("scheme-live");
  expect(activeChar.schemes.length).toBe(2);
  expect(activeChar.schemes.some((scheme) => scheme.id === "scheme-live")).toBeTruthy();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_library_recent_v1") || "[]").length)).toBeGreaterThan(0);
  await page.goto(`${BASE}#library/build/${BAMB}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Share$/ }).click();
  await expect(page.getByRole("status")).toContainText("Read-only share link copied");
  expect((await page.evaluate(() => navigator.clipboard.readText())).includes("#shared-build=")).toBeTruthy();
  expect(before).not.toBeNull();
});

test("Guild War Library keeps builds and plans distinct and clones without replacing active workspace", async ({ page }) => {
  const gvgState = { schemaVersion: 1, seasonId: "s", tier: "T96", activePlanId: "live", plans: [{ id: "live", name: "Live", rosterIds: [] }], activePlan: { id: "live", name: "Live", rosterIds: [] }, roster: [], timeline: [] };
  await setStorage(page, { wwm_gvg_workspace_v1: gvgState });
  await page.goto(`${BASE}#library/gvg-builds`, { waitUntil: "networkidle" });
  await expect(page.getByText("Guild War Builds", { exact: true })).toBeVisible();
  await expect(page.getByText("Bamboocut-Dust · Anti-heal Zone", { exact: true })).toBeVisible();
  await page.goto(`${BASE}#library/gvg-plans`, { waitUntil: "networkidle" });
  await expect(page.locator(".library-card")).toHaveCount(2);
  await expect(page.getByText("Balanced Guild War Roster Template", { exact: true })).toBeVisible();
  await expect(page.getByText("Example Guild War Strategy", { exact: true })).toBeVisible();

  const liveBefore = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));
  await page.goto(`${BASE}#library/build/${ROSTER}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Clone to My Workspace$/ }).click();
  const liveAfter = await page.evaluate(() => localStorage.getItem("wwm_gvg_workspace_v1"));
  expect(liveAfter).toBe(liveBefore);
  const clones = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_library_gvg_clones_v1") || "[]"));
  expect(clones).toHaveLength(1);
  expect(clones[0].sourceEntryId).toBe(ROSTER);
  expect(clones[0].build.roster).toHaveLength(30);

  await page.goto(`${BASE}#library/compare/${GVG}/my`, { waitUntil: "networkidle" });
  await expect(page.getByText("ROLE SUITABILITY DELTAS")).toBeVisible();
  await expect(page.getByText(/not a universal Guild War winner/i)).toBeVisible();
});

test("Versioned share landing, legacy migration, malformed rejection and legacy GvG read-only landing", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  await page.goto(`${BASE}#library/build/${BAMB}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Share$/ }).click();
  await expect(page.getByRole("status")).toContainText("Read-only share link copied");
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("#shared-build=");
  await page.goto(link, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-landing")).toBeVisible();
  await expect(page.getByText("SHARED PVE BUILD", { exact: true })).toBeVisible();

  const doc = await libraryJson();
  const entry = doc.items.find((item) => item.id === GVG);
  const legacy = { schemaVersion: 0, source: "USER", sharedAt: "2026-08-16T00:00:00.000Z", build: entry };
  await page.goto(`${BASE}#shared-build=${b64(legacy)}`, { waitUntil: "networkidle" });
  await expect(page.getByText(/legacy share was safely migrated/i)).toBeVisible();
  await expect(page.getByText(/Privacy: player names redacted; notes redacted/i)).toBeVisible();
  await page.goto(`${BASE}#shared-build=${"x".repeat(33000)}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("shared-build-invalid")).toBeVisible();
});

test("Recently Updated is freshness-based and progressive filters cover weapon tier and objective", async ({ page }) => {
  await page.goto(`${BASE}#library/recent`, { waitUntil: "networkidle" });
  await expect(page.getByText("RECENTLY UPDATED", { exact: true })).toBeVisible();
  await expect(page.locator(".library-card").first()).toBeVisible();
  await page.getByRole("button", { name: "PvE Builds" }).click();
  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByLabel("Weapon").selectOption("Everspring Umbrella");
  await page.getByLabel("Tier").selectOption("T96");
  await expect(page.getByText("Bamboocut-Dust · T96", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /More filters/i }).click();
  await page.getByLabel("Objective").selectOption("Sustained DPS");
  await expect(page.getByText("Bamboocut-Dust · T96", { exact: true })).toBeVisible();
});

test("Saved persists after reload and curated build export remains structured", async ({ page }) => {
  await page.goto(`${BASE}#library/build/${BAMB}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Save$/ }).click();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: /^Saved$/ })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Export$/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain(BAMB);
});

test("Patch freshness marks historical shared references OUTDATED REFERENCE", async ({ page }) => {
  const doc = await libraryJson();
  const entry = JSON.parse(JSON.stringify(doc.items.find((item) => item.id === BAMB)));
  entry.patch = "1.6";
  entry.maturity = ["COMMUNITY_REFERENCE"];
  const envelope = { schemaVersion: 1, source: "USER", sharedAt: "2026-08-16T00:00:00.000Z", entry };
  await page.goto(`${BASE}#shared-build=${b64(envelope)}`, { waitUntil: "networkidle" });
  await expect(page.getByText("OUTDATED REFERENCE", { exact: true })).toBeVisible();
});

test("Guild War privacy gate redacts names and optional notes before link generation", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const gvgState = {
    schemaVersion: 1,
    activePlanId: "private",
    plans: [{ id: "private", name: "Private", rosterIds: ["p1"], notes: "rotate secret" }],
    activePlan: { id: "private", name: "Private", rosterIds: ["p1"], notes: "rotate secret" },
    roster: [{ id: "p1", name: "PrivateName", role: "MAIN_BALL", path: "Bamboocut-Dust" }],
    timeline: [],
  };
  await setStorage(page, { wwm_gvg_workspace_v1: gvgState });
  await page.goto(`${BASE}#gvg/share`, { waitUntil: "networkidle" });
  const names = page.getByLabel(/Include player names/i);
  const notes = page.getByLabel(/Include notes/i);
  if (await names.count()) await names.uncheck();
  if (await notes.count()) await notes.uncheck();
  const copy = page.getByRole("button", { name: /Copy share link/i });
  if (await copy.count()) {
    await copy.click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(decodeURIComponent(link)).not.toContain("PrivateName");
    expect(decodeURIComponent(link)).not.toContain("rotate secret");
  }
});

test("Library responsive QA at 1440, 1024 and 390 with keyboard focus and no overflow", async ({ page }) => {
  for (const [width, height] of [[1440, 900], [1024, 800], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${BASE}#library`, { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    await page.goto(`${BASE}#library/build/${ARENA}`, { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  }
});
