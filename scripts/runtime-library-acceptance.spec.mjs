import fs from "node:fs";
import { test, expect } from "@playwright/test";

const BASE = "http://127.0.0.1:4173/";
const qaDir = "visual-qa";
fs.mkdirSync(qaDir, { recursive: true });

const BAMB = "bamboocut-dust-global-t96-calibrated";
const JADE = "silkbind-jade-mun-patch-2-community";
const GVG = "bamboocut-dust-gvg-anti-heal-zone";
const ROSTER = "balanced-guild-war-roster-template";
const STRATEGY = "example-guild-war-strategy-template";

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport + 1);
}

async function openLibrary(page) {
  const button = page.getByRole("button", { name: /^Library$/ });
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.getByTestId("library-landing")).toBeVisible();
}

function base64url(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

test("Library routing, filtering, trust labels, favorites and old workspace deep links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await openLibrary(page);
  expect(new URL(page.url()).hash).toBe("#library");
  await expect(page.getByText("Start from evidence, not from zero.")).toBeVisible();
  await expect(page.locator(".library-card")).toHaveCount(4);

  await page.getByRole("button", { name: /^PvE Builds$/ }).click();
  expect(new URL(page.url()).hash).toBe("#library/pve");
  await expect(page.locator(".library-card")).toHaveCount(2);
  await page.getByLabel("Search Library").fill("Mun");
  await expect(page.locator(".library-card")).toHaveCount(1);
  await expect(page.getByText("Silkbind-Jade", { exact: true })).toBeVisible();
  await expect(page.getByText("COMMUNITY REFERENCE")).toBeVisible();
  await expect(page.getByText("MODELED", { exact: true })).toBeVisible();
  await page.getByLabel("Search Library").fill("");

  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByLabel("Path").selectOption({ label: "Bamboocut-Dust" });
  await expect(page.locator(".library-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".library-card")).toHaveCount(2);

  const save = page.getByRole("button", { name: /Save Bamboocut-Dust$/ });
  await save.click();
  const favorites = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_library_favorites_v1") || "[]"));
  expect(favorites).toContain(BAMB);
  await page.getByRole("button", { name: /^Saved 1$/ }).click();
  await expect(page.locator(".library-card")).toHaveCount(1);

  await page.goto(`${BASE}#pve/build`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByLabel("PvE navigation").getByRole("button", { name: /^Build/ })).toHaveAttribute("aria-current", "page");
  await page.goto(`${BASE}#gvg/roster`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByLabel("Guild War navigation").getByRole("button", { name: /^Roster/ })).toHaveAttribute("aria-current", "page");
});

test("Read-only detail, clone isolation, reference compare and full build-to-build diff", async ({ page }) => {
  await page.addInitScript(() => {
    const original = {
      chars: [{ id: "char-1", name: "Test Character", schemes: [{ id: "scheme-1", name: "My Original Build", panel: { minOuter: 1500, maxOuter: 2500, outerPen: 40, prec: 110, crit: 120, aff: 18, attunedBonus: 10, set: "original-set" }, gear: [{ id: "old-gear", slot: "Helmet", name: "Original Helmet" }] }] }],
      activeCharId: "char-1",
      activeSchemeId: "scheme-1",
    };
    localStorage.setItem("wwm_chars_v3", JSON.stringify(original));
    localStorage.setItem("wwm_selected_build", "bamboocut-dust");
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${BASE}#library/build/${BAMB}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-build-detail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bamboocut-Dust" })).toBeVisible();
  await expect(page.getByText("61,266", { exact: true })).toBeVisible();
  await expect(page.getByText("CALIBRATED", { exact: true })).toBeVisible();
  await expect(page.getByText("CLIENT VERIFIED", { exact: true })).toBeVisible();
  await expect(page.getByText("WWM Calc calibrated T96 fixture 1106")).toBeVisible();
  await page.screenshot({ path: `${qaDir}/1440-library-build-detail.png`, fullPage: true });

  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_chars_v3") || "{}"));
  await page.getByRole("button", { name: /Compare with My Build/ }).click();
  await expect(page.getByTestId("library-compare")).toBeVisible();
  await expect(page.getByText("BUILD TO BUILD COMPARISON")).toBeVisible();
  await expect(page.getByText("CHANGED · MENU PANEL")).toBeVisible();
  await expect(page.getByTestId("build-difference-view")).toBeVisible();
  await page.screenshot({ path: `${qaDir}/1440-library-reference-vs-my-build.png`, fullPage: true });

  await page.goto(`${BASE}#library/compare/${BAMB}/${JADE}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-compare")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bamboocut-Dust.*Silkbind-Jade/ })).toBeVisible();

  await page.goto(`${BASE}#library/build/${BAMB}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Clone to My Workspace$/ }).click();
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_chars_v3") || "{}"));
  expect(after.chars[0].schemes.length).toBe(before.chars[0].schemes.length + 1);
  expect(after.chars[0].schemes.some((scheme) => scheme.id === "scheme-1" && scheme.name === "My Original Build")).toBeTruthy();
  expect(after.chars[0].schemes.find((scheme) => scheme.id === "scheme-1").gear[0].name).toBe("Original Helmet");
  const clone = after.chars[0].schemes.find((scheme) => scheme.id !== "scheme-1");
  expect(clone.name).toMatch(/^Bamboocut-Dust/);
  expect(clone.libraryReference.id).toBe(BAMB);
  expect(clone.libraryBuild.buildKey).toBe("bamboocut-dust");
  expect(clone.panel.minOuter).toBe(1614);
  expect(clone.panel.maxOuter).toBe(2777);
});

test("Guild War Library keeps builds and plans distinct and clones without replacing active workspace", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify({ roster: [{ id: "live-1", name: "Live Player", roles: ["MAIN_BALL"], availability: true }], strategy: { positions: { "live-1": { x: 50, y: 50 } }, arrows: [], rallyPoints: [] }, timeline: [], commander: { startingCoins: 12, events: [] }, matchLogs: [] }));
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${BASE}#library/gvg-builds`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await expect(page.locator(".library-card")).toHaveCount(1);
  await expect(page.getByText("Bamboocut-Dust GvG", { exact: true })).toBeVisible();
  await expect(page.getByText("EXPERIMENTAL", { exact: true })).toBeVisible();

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
  await expect(page.getByText(/not a universal GvG winner/i)).toBeVisible();
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
  await expect(page.getByRole("button", { name: /Clone to My Workspace/ })).toBeVisible();
  await page.screenshot({ path: `${qaDir}/390-shared-build-landing-source.png`, fullPage: true });

  const data = await page.evaluate(async () => (await fetch("/data/library-v1.json")).json());
  const entry = data.items.find((item) => item.id === BAMB);
  const legacy = base64url({ schemaVersion: 1, sharedAt: "2026-08-17T00:00:00.000Z", entry });
  await page.goto(`${BASE}#shared-build=${legacy}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-landing")).toBeVisible();
  await expect(page.getByText(/legacy share was safely migrated/i)).toBeVisible();

  await page.goto(`${BASE}#shared-build=%%%`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-invalid")).toBeVisible();
  await expect(page.getByText(/can no longer be loaded/i)).toBeVisible();

  await page.goto(`${BASE}#shared-build=${"A".repeat(76000)}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("shared-build-invalid")).toBeVisible();
  await expect(page.getByText(/too large|unsupported|invalid/i)).toBeVisible();

  const gvgEnvelope = {
    schema: "wwm-gvg-share",
    version: 1,
    kind: "ROSTER",
    createdAt: "2026-08-17T00:00:00.000Z",
    privacy: { playerNamesRedacted: true },
    payload: { roster: [{ id: "one", name: "Player 01", roles: ["MAIN_BALL"], availability: true }], doctrine: "CUSTOM" },
  };
  await page.goto(`${BASE}#gvg-share=${base64url(gvgEnvelope)}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-shared-landing")).toBeVisible();
  await expect(page.getByText("SHARED GUILD WAR PLAN", { exact: true })).toBeVisible();
  await expect(page.getByText(/Player names: redacted/i)).toBeVisible();
  await expect(page.getByText(/Nothing has been applied/i)).toBeVisible();
});

test("Recently Updated is freshness-based and progressive filters cover weapon tier and objective", async ({ page }) => {
  await page.goto(`${BASE}#library/recent`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await expect(page.locator(".library-card")).toHaveCount(5);
  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByRole("button", { name: /More filters/ }).click();
  await page.getByLabel("Weapon").selectOption({ label: "Vernal Umbrella" });
  await expect(page.locator(".library-card")).toHaveCount(1);
  await expect(page.getByText("Silkbind-Jade", { exact: true })).toBeVisible();
  await page.getByLabel("Weapon").selectOption("");
  await page.getByLabel("Tier").selectOption({ label: "T96" });
  await expect(page.locator(".library-card")).toHaveCount(1);
  await page.getByLabel("Tier").selectOption("");
  await page.getByLabel("Objective").selectOption({ label: "Healing denial and zone control" });
  await expect(page.locator(".library-card")).toHaveCount(1);
});

test("Saved persists after reload and curated build export remains structured", async ({ page }) => {
  await page.goto(`${BASE}#library/pve`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Save Bamboocut-Dust$/ }).click();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Saved 1$/ }).click();
  await expect(page.locator(".library-card")).toHaveCount(1);
  await page.goto(`${BASE}#library/build/${BAMB}`, { waitUntil: "networkidle" });
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export JSON/ }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(`${BAMB}.json`);
  const stream = await download.createReadStream();
  let text = "";
  for await (const chunk of stream) text += chunk.toString("utf8");
  const exported = JSON.parse(text);
  expect(exported.entry.id).toBe(BAMB);
  expect(JSON.stringify(exported)).not.toMatch(/email|accountId|deviceId/i);
});

test("Patch freshness marks historical shared references OUTDATED REFERENCE", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const data = await page.evaluate(async () => (await fetch("/data/library-v1.json")).json());
  const entry = structuredClone(data.items.find((item) => item.id === BAMB));
  entry.id = "historical-bamboocut-reference";
  entry.patch = "1.9";
  entry.lastReviewedDate = "2026-07-01";
  const envelope = { schemaVersion: 2, kind: "PVE_BUILD", sharedAt: "2026-07-01T00:00:00.000Z", source: "USER_SHARED", entry, futureEnvelopeField: "safe" };
  await page.goto(`${BASE}#shared-build=${base64url(envelope)}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("shared-build-landing")).toBeVisible();
  await expect(page.getByText("OUTDATED REFERENCE", { exact: true })).toBeVisible();
});

test("Guild War privacy gate redacts names and optional notes before link generation", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  await page.addInitScript(() => localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify({
    roster: [{ id: "p1", name: "Alice", roles: ["MAIN_BALL"], availability: true, notes: "caller", email: "private@example.com" }, { id: "p2", name: "Bob", roles: ["HEALER"], availability: true, notes: "private note" }],
    strategy: { name: "Live Plan", positions: {}, arrows: [], rallyPoints: [], notes: "private commander note" }, timeline: [], commander: { startingCoins: 10, events: [] }, matchLogs: [], deviceId: "local-device"
  })));
  await page.goto(`${BASE}#gvg/share`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-share-privacy")).toBeVisible();
  await expect(page.getByText("PUBLIC DATA INCLUDED", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Redact player names/ })).toBeChecked();
  const notes = page.getByRole("checkbox", { name: /Redact notes/ });
  await notes.check();
  await page.getByRole("button", { name: /Generate share link/ }).click();
  await expect(page.getByRole("status")).toContainText("Share link copied");
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("#gvg-share=");
  const encoded = link.split("#gvg-share=")[1];
  const json = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  expect(JSON.stringify(json)).not.toContain("Alice");
  expect(JSON.stringify(json)).not.toContain("Bob");
  expect(JSON.stringify(json)).not.toContain("private@example.com");
  expect(JSON.stringify(json)).not.toContain("local-device");
  expect(JSON.stringify(json)).not.toContain("private commander note");
  await page.goto(link, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-shared-landing")).toBeVisible();
  await expect(page.getByText(/Player names: redacted\. Notes: redacted/i)).toBeVisible();
});

test("Library responsive QA at 1440, 1024 and 390 with keyboard focus and no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${BASE}#library`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${qaDir}/1440-library-landing.png`, fullPage: true });

  await page.goto(`${BASE}#library/pve`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${qaDir}/1440-library-pve-directory.png`, fullPage: true });
  await page.goto(`${BASE}#library/compare/${BAMB}/${JADE}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${qaDir}/1440-library-build-compare.png`, fullPage: true });
  await page.goto(`${BASE}#library/build/${STRATEGY}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${qaDir}/1440-library-gvg-plan-detail.png`, fullPage: true });

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(`${BASE}#library`, { waitUntil: "networkidle" });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${qaDir}/1024-library.png`, fullPage: true });
  await page.goto(`${BASE}#library/build/${BAMB}`, { waitUntil: "networkidle" });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${qaDir}/1024-library-build-detail.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}#library`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("library-landing")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${qaDir}/390-library.png`, fullPage: true });
  await page.goto(`${BASE}#library/build/${BAMB}`, { waitUntil: "networkidle" });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${qaDir}/390-library-build-detail.png`, fullPage: true });

  const libraryButton = page.getByRole("button", { name: /^Library$/ });
  await libraryButton.focus();
  const style = await libraryButton.evaluate((element) => {
    const computed = getComputedStyle(element);
    return { outline: computed.outlineStyle, width: computed.outlineWidth };
  });
  expect(style.outline).not.toBe("none");
  expect(style.width).not.toBe("0px");
});
