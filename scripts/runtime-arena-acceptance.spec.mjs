import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { defaultArenaState } from "../src/arena/arena-core.mjs";

const base = "http://127.0.0.1:4173/";
const visualDir = "visual-qa/arena";

async function seedArena(page) {
  const state = defaultArenaState();
  state.onboardingComplete = true;
  await page.addInitScript((value) => {
    if (sessionStorage.getItem("wwm_arena_smoke_seeded") === "1") return;
    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(value));
    localStorage.removeItem("wwm_arena_history_v1");
    sessionStorage.setItem("wwm_arena_smoke_seeded", "1");
  }, state);
}

async function noHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({ width: window.innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.width + 1);
}

async function shot(page, name, width, height = 900) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(80);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: `${visualDir}/${name}.png`, fullPage: true });
}

test("Arena is a first-class isolated workspace with 1v1, 3v3, sharing, Library and History", async ({ page }) => {
  fs.mkdirSync(visualDir, { recursive: true });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await seedArena(page);

  let response = await page.goto(`${base}#pve/overview`, { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByTestId("pve-overview")).toBeVisible();
  const legacySwitcher = page.getByRole("navigation", { name: "Product workspaces" });
  await expect(legacySwitcher.getByRole("button", { name: /Arena/i })).toBeVisible();
  await legacySwitcher.getByRole("button", { name: /Arena/i }).click();

  await expect(page).toHaveURL(/#arena\/overview$/);
  await expect(page.getByTestId("arena-overview")).toBeVisible();
  const arenaSwitcher = page.getByRole("navigation", { name: "Product workspaces" });
  await expect(arenaSwitcher.getByRole("button", { name: /^PvE\b/i })).toBeVisible();
  await expect(arenaSwitcher.getByRole("button", { name: /^Arena\b/i })).toBeVisible();
  await expect(arenaSwitcher.getByRole("button", { name: /^Guild War\b/i })).toBeVisible();
  await expect(page.getByText("Bamboocut-Dust", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("BURST PRESSURE", { exact: true })).toBeVisible();
  await expect(page.getByText("NEXT ACTION", { exact: true })).toBeVisible();

  await page.goto(`${base}#arena/build`);
  await expect(page.getByTestId("arena-build")).toBeVisible();
  await expect(page.getByText(/read-only snapshot/i)).toBeVisible();
  await page.getByRole("button", { name: /Use My Current Gear/i }).click();
  const arenaBeforeAttune = await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"));
  const pveBeforeAttune = await page.evaluate(() => localStorage.getItem("wwm_chars_v3"));
  await page.goto(`${base}#arena/attunement`);
  await expect(page.getByTestId("arena-attunement")).toBeVisible();
  await expect(page.getByText(/Normal Attunement \+ Arena Attunement stacking = OFF/i)).toBeVisible();
  const pveAfterAttune = await page.evaluate(() => localStorage.getItem("wwm_chars_v3"));
  expect(pveAfterAttune).toBe(pveBeforeAttune);
  expect(arenaBeforeAttune).toBeTruthy();

  await page.goto(`${base}#arena/matchups`);
  await expect(page.getByTestId("arena-matchup-result")).toBeVisible();
  await page.getByLabel("Opponent Path").selectOption({ label: "Bamboocut-Wind" });
  await expect(page.getByText(/FAVORED TOOLS|DISADVANTAGED TOOLS|CLOSE MATCHUP/).first()).toBeVisible();
  await expect(page.getByText(/not an empirical win probability/i)).toBeVisible();
  expect((await page.locator("body").innerText()).includes("63.7% win chance")).toBe(false);

  await page.goto(`${base}#arena/skills`);
  await expect(page.getByText(/Burn and Bury:/)).toBeVisible();
  await expect(page.getByText(/unblockable; golden-flash warning/i)).toBeVisible();
  await expect(page.getByText(/Tenacity starts 0.5s/i)).toBeVisible();
  await expect(page.getByText(/Scarlet Spin/i).first()).toBeVisible();

  await page.goto(`${base}#arena/simulation`);
  await expect(page.getByTestId("arena-simulation")).toBeVisible();
  await expect(page.getByText("GET_UP_PROTECTION", { exact: true })).toBeVisible();
  await expect(page.getByText(/Qi Damage ignored during Execute knockdown/i)).toBeVisible();
  await page.getByLabel("Simulation horizon").selectOption("30");
  await page.getByLabel("Reaction assumption").selectOption("perfect");
  await expect(page.getByText(/not a player skill rating/i)).toBeVisible();

  await page.goto(`${base}#arena/overview`);
  await page.getByRole("button", { name: "3v3", exact: true }).click();
  await page.goto(`${base}#arena/matchups`);
  await expect(page.getByTestId("arena-3v3-composition")).toBeVisible();
  await expect(page.getByText(/same Martial Art ≤ 2/i)).toBeVisible();
  await expect(page.getByText(/one revive opportunity/i)).toBeVisible();
  const primary = page.getByLabel("Player 1 primary Martial Art");
  const duplicate = await primary.inputValue();
  await page.getByLabel("Player 2 primary Martial Art").selectOption(duplicate);
  await page.getByLabel("Player 3 primary Martial Art").selectOption(duplicate);
  await expect(page.getByText(/appears more than twice/i)).toBeVisible();

  await page.goto(`${base}#library/arena`, { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Arena Builds", exact: true })).toBeVisible();
  const arenaLibraryCard = page.locator('[data-library-id="bamboocut-dust-arena-control-pressure"]');
  await expect(arenaLibraryCard.getByText("Bamboocut-Dust Arena", { exact: true })).toBeVisible();
  await arenaLibraryCard.getByRole("button", { name: "View", exact: true }).click();
  await expect(page.getByTestId("library-build-detail")).toBeVisible();
  const beforeClone = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}"));
  await page.getByRole("button", { name: /Clone to My Workspace/i }).click();
  const afterClone = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}"));
  expect(afterClone.activeProfileId).toBe(beforeClone.activeProfileId);
  expect(afterClone.profiles.length).toBe(beforeClone.profiles.length + 1);

  await page.goto(`${base}#arena/transfer`);
  await page.getByRole("button", { name: /Generate read-only share/i }).click();
  const shareLink = await page.getByLabel("Arena share token").inputValue();
  expect(shareLink).toContain("#arena/shared/");
  await page.goto(shareLink);
  await expect(page.getByTestId("arena-shared-landing")).toBeVisible();
  await expect(page.getByText("READ-ONLY ARENA BUILD", { exact: true })).toBeVisible();
  const activeBeforeSharedClone = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}").activeProfileId);
  await page.getByRole("button", { name: "CLONE TO MY WORKSPACE", exact: true }).click();
  const activeAfterSharedClone = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}").activeProfileId);
  expect(activeAfterSharedClone).toBe(activeBeforeSharedClone);

  await page.goto(`${base}#arena/history`);
  await expect(page.getByTestId("arena-history")).toBeVisible();
  await page.getByLabel("Opponent Path").selectOption({ label: "Bamboocut-Wind" });
  await page.getByLabel("Result").selectOption("WIN");
  await page.getByLabel("Match duration (sec)").fill("73");
  await page.getByLabel("Notes").fill("Observed manual Arena result");
  await page.getByRole("button", { name: /Save local match/i }).click();
  await expect(page.getByText(/n=1; descriptive record only/i)).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Observed manual Arena result", { exact: true })).toBeVisible();

  await page.goto(`${base}#arena/overview`);
  await page.getByRole("navigation", { name: "Product workspaces" }).getByRole("button", { name: /Guild War/i }).click();
  await expect(page.getByTestId("gvg-overview")).toBeVisible();

  await page.goto(`${base}#arena/overview`);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");

  const views1440 = ["overview", "build", "matchups", "compare", "simulation", "history"];
  for (const view of views1440) {
    await page.goto(`${base}#arena/${view}`);
    await shot(page, `1440-${view}`, 1440, 960);
  }
  for (const view of ["overview", "matchups"]) {
    await page.goto(`${base}#arena/${view}`);
    await shot(page, `1024-${view}`, 1024, 900);
  }
  for (const view of ["overview", "build", "matchups", "history"]) {
    await page.goto(`${base}#arena/${view}`);
    await shot(page, `390-${view}`, 390, 844);
  }
  await expect(page.getByRole("navigation", { name: "Arena mobile navigation" })).toBeVisible();

  const report = {
    success: pageErrors.length === 0 && consoleErrors.length === 0,
    pageErrors,
    consoleErrors,
    arenaStateKey: "wwm_arena_state_v1",
    historyKey: "wwm_arena_history_v1",
    visualCaptures: 12,
    mobile390NoOverflow: true,
    pvePreserved: true,
    gvgPreserved: true,
    libraryArenaCloneIsolated: true,
    shareCloneIsolated: true,
  };
  fs.writeFileSync("runtime-arena-smoke-report.json", JSON.stringify(report, null, 2), "utf8");
  await page.screenshot({ path: "runtime-arena-smoke.png", fullPage: true });
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
