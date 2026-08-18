import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { defaultArenaState } from "../src/arena/arena-core.mjs";

const base = "http://127.0.0.1:4173/";
const visualDir = "visual-qa/arena-v2";

async function seedArena(page) {
  const state = defaultArenaState();
  state.onboardingComplete = true;
  await page.addInitScript((value) => {
    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(value));
    localStorage.removeItem("wwm_arena_mode_v2");
    localStorage.removeItem("wwm_arena_history_v1");
  }, state);
}
async function noOverflow(page) { const row = await page.evaluate(() => ({ inner: innerWidth, scroll: document.documentElement.scrollWidth })); expect(row.scroll).toBeLessThanOrEqual(row.inner + 1); }

 test("Competitive Arena V2 is mode-first, mechanics-accurate and uncertainty-guarded", async ({ page }) => {
  fs.mkdirSync(visualDir, { recursive: true });
  const pageErrors = []; const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await seedArena(page);

  await page.goto(`${base}#pve/overview`, { waitUntil: "networkidle" });
  const switcher = page.getByRole("navigation", { name: "Product workspaces" });
  await switcher.getByRole("button", { name: /Arena/i }).click();
  await expect(page).toHaveURL(/#arena\/overview$/);
  await expect(page.getByTestId("arena-overview")).toBeVisible();

  const arenaModeLabels = ["1v1","3v3","Group Strategy","5v5 Arena","Perception Forest","Training Terrace"];
  const modes = page.getByLabel("Arena mode").first();
  for (const label of arenaModeLabels) {
    const button = modes.getByRole("button", { name: label, exact: true });
    await expect(button).toBeVisible();
    await button.click();
    await expect(button).toHaveClass(/is-active/);
    await expect(page.getByTestId("arena-mode-truth").getByRole("heading", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Training Terrace is not ranked truth", { exact: true })).toBeVisible();
  await page.goto(`${base}#arena/attunement`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-attunement")).toBeVisible();
  await expect(page.getByTestId("arena-attunement").getByRole("heading", { name: "Training Terrace", exact: true })).toBeVisible();
  await expect(page.getByTestId("arena-attunement")).toContainText("UNKNOWN");

  await page.goto(`${base}#arena/overview`, { waitUntil: "networkidle" });
  await expect(page.getByText(/Choose the ruleset before the build/i)).toBeVisible();
  await page.getByLabel("Arena mode").first().getByRole("button", { name: "1v1", exact: true }).click();
  await expect(page.getByText("24/7", { exact: true }).first()).toBeVisible();

  await page.getByLabel("Arena mode").first().getByRole("button", { name: "3v3", exact: true }).click();
  await expect(page.getByTestId("arena-3v3-composition")).toBeVisible();
  await expect(page.getByText(/One revive opportunity · 10m range · 15s window/i)).toBeVisible();
  await expect(page.getByText(/Same Martial Art ≤ 2 per team/i)).toBeVisible();
  await page.getByLabel("Same Martial Art count").fill("3");
  await expect(page.getByText(/at most twice/i)).toBeVisible();
  await page.getByText("Team has healer").locator("input").check();
  await expect(page.getByText(/Panacea Fan Resurrection restriction applies/i)).toBeVisible();
  await page.getByText(/Royal Remedy T6 exception observed/i).locator("input").check();

  await page.goto(`${base}#arena/build`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-build")).toBeVisible();
  await expect(page.getByText("Optimizer locked", { exact: true })).toBeVisible();
  await expect(page.getByText(/NEEDS CURRENT CLIENT DATA/i).first()).toBeVisible();
  await expect(page.getByText(/NO UNIVERSAL WINNER/i)).toBeVisible();
  await expect(page.getByText(/Normal \+ Arena stacking = OFF/i)).toBeVisible();
  expect((await page.locator("body").innerText()).includes("PvE modeled DPS is" )).toBe(false);

  await page.goto(`${base}#arena/matchups`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-matchup-result")).toBeVisible();
  await page.getByLabel("Opponent Path").selectOption({ label: "Stonesplit-Might" });
  for (const label of ["ADVANTAGES","RISKS","KEY INTERACTIONS","PUNISH WINDOWS","DEFENSIVE ANSWERS","UNKNOWN / PLAYER-SKILL-SENSITIVE"]) await expect(page.getByText(label, { exact: true })).toBeVisible();
  await expect(page.getByText(/not an empirical win probability/i)).toBeVisible();
  const matchupText = await page.getByTestId("arena-matchup-result").innerText();
  expect(matchupText).not.toMatch(/\d+(\.\d+)?% win/i);
  expect(matchupText).not.toMatch(/modeled tool delta/i);

  await page.goto(`${base}#arena/skills`, { waitUntil: "networkidle" });
  await expect(page.getByText(/Burn and Bury:/)).toContainText(/unblockable/i);
  await expect(page.getByText(/Tenacity starts after/)).toContainText("0.5s");
  await expect(page.getByText(/Phantom Rally\/Resonance must not interrupt Tenacity/i)).toBeVisible();
  await expect(page.getByText(/Dreamwrought \+20% is non-player-only/i)).toBeVisible();

  await page.goto(`${base}#arena/simulation`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-simulation")).toBeVisible();
  await expect(page.getByText("GET_UP_PROTECTION", { exact: true })).toBeVisible();
  await expect(page.getByText("TENACITY", { exact: true })).toBeVisible();
  await expect(page.getByText("CONTROL_IMMUNITY", { exact: true })).toBeVisible();
  await expect(page.getByText("SUPER_ARMOR", { exact: true })).toBeVisible();
  await expect(page.getByText(/Qi Damage ignored during applicable Execute knockdown/i)).toBeVisible();
  await expect(page.getByText(/latency damage coefficient = none/i)).toBeVisible();

  await page.goto(`${base}#arena/attunement`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-attunement")).toBeVisible();
  await expect(page.getByText(/stacking = OFF/i)).toBeVisible();
  await expect(page.getByText(/Stonesplit-Might/i).first()).toBeVisible();

  await page.goto(`${base}#arena/overview`, { waitUntil: "networkidle" });
  await page.getByLabel("Arena mode").first().getByRole("button", { name: "Perception Forest", exact: true }).click();
  await expect(page.getByTestId("perception-forest-rules")).toBeVisible();
  await expect(page.getByText("-50%", { exact: true })).toBeVisible();
  await expect(page.getByText("30%", { exact: true })).toBeVisible();
  await expect(page.getByText(/cannot leak into 1v1\/3v3\/Group Strategy\/Guild War\/PvE/i)).toBeVisible();

  await page.goto(`${base}#arena/evidence`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-evidence")).toBeVisible();
  await expect(page.getByText(/Minimum client capture/i)).toBeVisible();

  await page.goto(`${base}#arena/transfer`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Generate read-only share/i }).click();
  const shareLink = await page.getByLabel("Arena share token").inputValue();
  expect(shareLink).toContain("#arena/shared/");
  const activeBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}").activeProfileId);
  await page.goto(shareLink, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-shared-landing")).toBeVisible();
  await page.getByRole("button", { name: "CLONE TO MY WORKSPACE", exact: true }).click();
  const activeAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("wwm_arena_state_v1") || "{}").activeProfileId);
  expect(activeAfter).toBe(activeBefore);

  await page.goto(`${base}#arena/history`, { waitUntil: "networkidle" });
  await page.getByLabel("Result").selectOption("WIN");
  await page.getByLabel("Notes").fill("Observed Arena V2 fixture");
  await page.getByRole("button", { name: /Save local match/i }).click();
  await expect(page.getByText(/n=1; descriptive record only/i)).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Observed Arena V2 fixture", { exact: true })).toBeVisible();

  for (const [width, height] of [[1440,960],[1024,900],[390,844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}#arena/overview`, { waitUntil: "networkidle" });
    await noOverflow(page);
    await page.screenshot({ path: `${visualDir}/${width}-overview.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("navigation", { name: "Arena mobile navigation" })).toBeVisible();

  fs.writeFileSync("runtime-arena-smoke-report.json", JSON.stringify({ success: pageErrors.length === 0 && consoleErrors.length === 0, arenaModes: 6, qualitativeMatchup: true, levelAdjustmentGuard: true, attunementGuard: true, perceptionForestIsolated: true, pageErrors, consoleErrors }, null, 2));
  await page.screenshot({ path: "runtime-arena-smoke.png", fullPage: true });
  expect(pageErrors).toEqual([]); expect(consoleErrors).toEqual([]);
});
