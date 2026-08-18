import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { defaultWorkspace } from "../src/gvg/model.js";

const base = "http://127.0.0.1:4173/";

async function seed(page) {
  const workspace = defaultWorkspace();
  await page.addInitScript((value) => {
    localStorage.setItem("wwm_gvg_workspace_v1", JSON.stringify(value));
    localStorage.removeItem("wwm_gvg_phase_v2");
    localStorage.removeItem("wwm_gvg_v2_manual");
  }, workspace);
}
async function noOverflow(page) { const row = await page.evaluate(() => ({ inner: innerWidth, scroll: document.documentElement.scrollWidth })); expect(row.scroll).toBeLessThanOrEqual(row.inner + 1); }

test("Guild War V2 is phase-first, capability-based and UNKNOWN-safe", async ({ page }) => {
  const pageErrors = []; const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await seed(page);

  await page.goto(`${base}#gvg/overview`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("guild-war-workspace")).toBeVisible();
  await expect(page.getByTestId("gvg-overview")).toBeVisible();
  await expect(page.getByTestId("gvg-phase-context")).toBeVisible();
  await expect(page.getByText(/Guild War Attunement = UNKNOWN/i)).toBeVisible();
  await expect(page.getByText(/No universal GvG score/i)).toBeVisible();
  await expect(page.getByText("3:00", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("60s", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("×0.5", { exact: true }).first()).toBeVisible();

  await page.goto(`${base}#gvg/roster`, { waitUntil: "networkidle" });
  const roster = page.getByTestId("gvg-roster");
  await roster.getByRole("button", { name: /Seed 30-player sample/i }).click();
  await expect(roster.getByLabel("Player name")).toHaveCount(30);
  await expect(roster.getByRole("button", { name: /Add member/i })).toBeDisabled();

  await page.goto(`${base}#gvg/builds`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-builds")).toBeVisible();
  await expect(page.getByText("45%", { exact: true })).toBeVisible();
  await expect(page.getByText("12m", { exact: true })).toBeVisible();
  await expect(page.getByText(/Post-death Immobilize/i)).toBeVisible();
  await expect(page.getByText(/Do not select “Guild War: Arena” or “Guild War: Normal” automatically/i)).toBeVisible();
  await expect(page.getByText(/Nameless Sword EX/i)).toBeVisible();
  await expect(page.getByText(/Everspring Umbrella EX/i)).toBeVisible();
  const buildText = await page.getByTestId("gvg-builds").innerText();
  expect(buildText).not.toMatch(/\b\d{1,3}\/100\b/);
  expect(buildText).not.toMatch(/universal.*score/i);

  await page.goto(`${base}#gvg/timeline`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-timeline")).toBeVisible();
  await expect(page.getByText("OUTPOST PHASE", { exact: true })).toBeVisible();
  await expect(page.getByText("3:00", { exact: true })).toBeVisible();
  await expect(page.getByText(/At entry = 0%; \+30% every 30 seconds/i)).toBeVisible();
  await expect(page.getByLabel("Halftime trigger override")).toHaveAttribute("placeholder", "UNKNOWN");

  await page.goto(`${base}#gvg/objectives`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-objectives")).toBeVisible();
  await expect(page.getByText(/Exact BULWARK DR-per-stack is not published/i)).toBeVisible();
  const killRows = await page.getByTestId("gvg-objectives").innerText();
  expect(killRows).toMatch(/UNKNOWN/);
  await page.getByLabel("Objective base HP").fill("1000000");
  await page.getByLabel("Team objective DPS").fill("25000");
  await page.getByLabel("DR per stack").fill("0.01");
  await expect(page.getByText(/modeled/).first()).toBeVisible();

  await page.goto(`${base}#gvg/commander`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-commander")).toBeVisible();
  await expect(page.getByText(/Fun Coins/i).first()).toBeVisible();
  await expect(page.getByText("Quick Operation", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Command cost override")).toHaveAttribute("placeholder", "UNKNOWN");
  await expect(page.getByLabel("Command cooldown override")).toHaveAttribute("placeholder", "UNKNOWN");

  await page.goto(`${base}#gvg/strategy`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-strategy")).toBeVisible();
  await expect(page.locator('[data-objective-id="BULWARK"]')).toBeVisible();
  await expect(page.locator('[data-objective-id="GOOSE"]')).toBeVisible();
  await expect(page.locator('[data-objective-id="FORTUNE_TREE"]')).toBeVisible();

  await page.goto(`${base}#gvg/support`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-support")).toBeVisible();
  await expect(page.getByText(/Healer coefficients are not invented/i)).toBeVisible();
  await expect(page.getByText(/Breaking Army/i)).toBeVisible();

  await page.goto(`${base}#gvg/matches`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-matches")).toBeVisible();
  await page.getByText("Notes").locator("textarea").fill("Observed Guild War V2 fixture");
  await page.getByRole("button", { name: /Save match/i }).click();
  await expect(page.getByText("Observed Guild War V2 fixture", { exact: true })).toBeVisible();

  await page.goto(`${base}#gvg/share`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("gvg-share")).toBeVisible();
  await page.getByRole("button", { name: /Prepare JSON/i }).click();
  await expect(page.getByRole("status")).toContainText(/redacted/i);

  for (const [width, height] of [[1440,960],[1024,900],[390,844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}#gvg/overview`, { waitUntil: "networkidle" });
    await noOverflow(page);
  }

  fs.writeFileSync("runtime-gvg-smoke-report.json", JSON.stringify({ success: pageErrors.length === 0 && consoleErrors.length === 0, phaseModel: true, attunementUnknownGuard: true, noUniversalScore: true, halftimeTriggerUnknown: true, objectiveDrSensitivity: true, commanderUnknownGuard: true, roster30: true, pageErrors, consoleErrors }, null, 2));
  await page.screenshot({ path: "runtime-gvg-smoke.png", fullPage: true });
  expect(pageErrors).toEqual([]); expect(consoleErrors).toEqual([]);
});
