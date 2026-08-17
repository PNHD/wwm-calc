import fs from "node:fs";
import { test, expect } from "@playwright/test";

const BASE = "http://127.0.0.1:4173/";
const qaDir = "visual-qa";
fs.mkdirSync(qaDir, { recursive: true });

async function switchWorkspace(page, name) {
  const switcher = page.getByRole("navigation", { name: "Product workspaces" });
  await expect(switcher).toBeVisible();
  await switcher.getByRole("button", { name: new RegExp(`^${name}`) }).click();
}

async function pve(page, name) {
  await page.getByLabel("PvE navigation").getByRole("button", { name: new RegExp(`^${name}`) }).click();
}

async function gvg(page, name) {
  await page.getByLabel("Guild War navigation").getByRole("button", { name: new RegExp(`^${name}`) }).click();
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport + 1);
}

test("Workspace IA separates PvE and Guild War, preserves context and keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = await page.goto(BASE, { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();

  await expect(page.getByTestId("pve-overview")).toBeVisible();
  const pveNav = page.getByLabel("PvE navigation");
  await expect(pveNav.getByRole("button", { name: /^Gear/ })).toBeVisible();
  await expect(pveNav.getByRole("button", { name: /^Compare/ })).toBeVisible();
  await expect(pveNav.getByRole("button", { name: /^Roster/ })).toHaveCount(0);

  await pve(page, "Build");
  await expect(pveNav.getByRole("button", { name: /^Build/ })).toHaveAttribute("aria-current", "page");
  expect(new URL(page.url()).hash).toBe("#pve/build");
  await expect(page.locator('aside[aria-label="Context inspector"]')).toBeVisible();

  await switchWorkspace(page, "Guild War");
  await expect(page.getByTestId("gvg-overview")).toBeVisible();
  const gvgNav = page.getByLabel("Guild War navigation");
  await expect(gvgNav.getByRole("button", { name: /^Roster/ })).toBeVisible();
  await expect(gvgNav.getByRole("button", { name: /^Strategy/ })).toBeVisible();
  await expect(gvgNav.getByRole("button", { name: /^Compare/ })).toHaveCount(0);

  await switchWorkspace(page, "PvE");
  await expect(pveNav.getByRole("button", { name: /^Build/ })).toHaveAttribute("aria-current", "page");
  expect(new URL(page.url()).hash).toBe("#pve/build");

  const pveSwitch = page.getByRole("navigation", { name: "Product workspaces" }).getByRole("button", { name: /^PvE/ });
  await pveSwitch.focus();
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement)) return null;
    const style = getComputedStyle(el);
    return { tag: el.tagName, outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle };
  });
  expect(focus?.tag).toBe("BUTTON");
  expect(focus?.outlineStyle).not.toBe("none");
  expect(focus?.outlineWidth).not.toBe("0px");

  // Unknown legacy hashes are intentionally left untouched rather than migrated destructively.
  await page.goto(`${BASE}#legacy-share=preserve-me`, { waitUntil: "networkidle" });
  expect(new URL(page.url()).hash).toBe("#legacy-share=preserve-me");
});

test("Responsive and visual QA covers required workspace surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(BASE, { waitUntil: "networkidle" });

  await expect(page.getByTestId("pve-overview")).toBeVisible();
  await page.screenshot({ path: `${qaDir}/1440-pve-overview.png`, fullPage: true });

  await pve(page, "Gear");
  await expect(page.getByText("Inventory", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: `${qaDir}/1440-pve-gear.png`, fullPage: true });

  await pve(page, "Compare");
  await expect(page.getByText("Current vs Candidate", { exact: true })).toBeVisible();
  await page.screenshot({ path: `${qaDir}/1440-pve-compare.png`, fullPage: true });

  await pve(page, "Best Build");
  await expect(page.getByText(/Best build/i).first()).toBeVisible();
  await page.screenshot({ path: `${qaDir}/1440-pve-best-build.png`, fullPage: true });

  await switchWorkspace(page, "Guild War");
  await expect(page.getByTestId("gvg-overview")).toBeVisible();
  await page.screenshot({ path: `${qaDir}/1440-gvg-overview.png`, fullPage: true });

  await gvg(page, "Roster");
  const roster = page.getByTestId("gvg-roster");
  await expect(roster).toBeVisible();
  await roster.getByRole("button", { name: /Seed sample/i }).click();
  const addMember = roster.getByRole("button", { name: /Add member/i });
  for (let i = 0; i < 18; i += 1) await addMember.click();
  await expect(roster.getByLabel("Player name")).toHaveCount(30);
  await expect(addMember).toBeDisabled();
  await page.screenshot({ path: `${qaDir}/1440-gvg-roster-30.png`, fullPage: true });

  await gvg(page, "Strategy");
  const strategy = page.getByTestId("gvg-strategy-board");
  await expect(strategy).toBeVisible();
  const map = strategy.locator(".gvg-battle-map");
  await expect(map).toBeVisible();
  const mapBox = await map.boundingBox();
  expect(mapBox?.width ?? 0).toBeGreaterThan(500);
  expect(mapBox?.height ?? 0).toBeGreaterThan(500);
  await page.screenshot({ path: `${qaDir}/1440-gvg-strategy.png`, fullPage: true });

  await gvg(page, "Timeline");
  await expect(page.getByTestId("gvg-timeline-simulator")).toBeVisible();
  await page.screenshot({ path: `${qaDir}/1440-gvg-timeline.png`, fullPage: true });

  // Tablet: compact rail + large usable center surface.
  await page.setViewportSize({ width: 1024, height: 900 });
  await switchWorkspace(page, "PvE");
  await page.getByRole("button", { name: "Open workspace overview" }).click();
  await expect(page.getByTestId("pve-overview")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${qaDir}/1024-pve-overview.png`, fullPage: true });

  await switchWorkspace(page, "Guild War");
  await expect(page.getByTestId("gvg-overview")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${qaDir}/1024-gvg-overview.png`, fullPage: true });

  // Mobile: dedicated bottom navigation; desktop rail does not simply shrink.
  await page.setViewportSize({ width: 390, height: 844 });
  await switchWorkspace(page, "PvE");
  await page.getByRole("button", { name: "Open workspace overview" }).click();
  await expect(page.getByRole("navigation", { name: "PvE mobile navigation" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${qaDir}/390-pve-overview.png`, fullPage: true });

  await switchWorkspace(page, "Guild War");
  await expect(page.getByRole("navigation", { name: "Guild War mobile navigation" })).toBeVisible();
  await expect(page.getByTestId("gvg-overview")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${qaDir}/390-gvg-overview.png`, fullPage: true });
});
