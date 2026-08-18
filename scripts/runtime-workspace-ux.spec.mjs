import fs from "node:fs";
import { test, expect } from "@playwright/test";

const BASE = "http://127.0.0.1:4173/";
const qaDir = "visual-qa";
fs.mkdirSync(qaDir, { recursive: true });

async function switchWorkspace(page, name) { const switcher = page.getByRole("navigation", { name: "Product workspaces" }); await expect(switcher).toBeVisible(); await switcher.getByRole("button", { name: new RegExp(`^${name}`) }).click(); }
async function pve(page, name) { await page.getByLabel("PvE navigation").getByRole("button", { name: new RegExp(`^${name}`) }).click(); }
async function gvg(page, name) { await page.getByLabel("Guild War navigation").getByRole("button", { name: new RegExp(`^${name}`) }).click(); }
async function noOverflow(page) { const metrics = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth })); expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1); expect(metrics.body).toBeLessThanOrEqual(metrics.viewport + 1); }

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
  await pve(page, "Gear"); await expect(page.getByText("Inventory", { exact: true }).first()).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-pve-gear.png`, fullPage: true });
  await pve(page, "Compare"); await expect(page.getByText("Current vs Candidate", { exact: true })).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-pve-compare.png`, fullPage: true });
  await pve(page, "Best Build"); await expect(page.getByText(/Best build/i).first()).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-pve-best-build.png`, fullPage: true });

  await page.goto(`${BASE}#arena/overview`, { waitUntil: "networkidle" }); await expect(page.getByTestId("arena-overview")).toBeVisible(); await noOverflow(page); await page.screenshot({ path: `${qaDir}/1440-arena-v2-overview.png`, fullPage: true });
  await page.goto(`${BASE}#arena/matchups`, { waitUntil: "networkidle" }); await expect(page.getByTestId("arena-matchup-result")).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-arena-v2-matchup.png`, fullPage: true });

  await page.goto(`${BASE}#gvg/overview`, { waitUntil: "networkidle" }); await expect(page.getByTestId("gvg-overview")).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-gvg-v2-overview.png`, fullPage: true });
  await gvg(page, "Roster"); const roster = page.getByTestId("gvg-roster"); await roster.getByRole("button", { name: /Seed 30-player sample/i }).click(); await expect(roster.getByLabel("Player name")).toHaveCount(30); await expect(roster.getByRole("button", { name: /Add member/i })).toBeDisabled(); await page.screenshot({ path: `${qaDir}/1440-gvg-v2-roster-30.png`, fullPage: true });
  await gvg(page, "Strategy"); await expect(page.getByTestId("gvg-strategy")).toBeVisible(); await expect(page.locator('[data-objective-id="BULWARK"]')).toBeVisible(); await page.screenshot({ path: `${qaDir}/1440-gvg-v2-strategy.png`, fullPage: true });
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
