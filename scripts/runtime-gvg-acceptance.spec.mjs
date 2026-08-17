import fs from "node:fs";
import { test, expect } from "@playwright/test";

test("Global Guild War workspace exposes planning, simulator, roster and sharing surfaces", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  const response = await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();
  const switcher = page.getByRole("navigation", { name: "Product workspaces" });
  await expect(switcher).toBeVisible();
  await switcher.getByRole("button", { name: /Guild War/i }).click();
  await expect(page.getByTestId("gvg-overview")).toBeVisible();
  await expect(page.getByText("Command center", { exact: true })).toBeVisible();

  const nav = page.getByLabel("Guild War navigation");
  await nav.getByRole("button", { name: /^Builds/ }).click();
  const workspace = page.getByTestId("guild-war-workspace");
  await expect(workspace).toBeVisible();
  await expect(workspace.getByText("Outposts").first()).toBeVisible();
  await expect(workspace.getByText("Qi damage taken").first()).toBeVisible();

  const lab = page.getByTestId("gvg-build-lab");
  await expect(lab).toBeVisible();
  await expect(lab.getByText("Bamboocut-Dust", { exact: true })).toBeVisible();
  await expect(lab.getByText("ANTI-HEAL / ZONE PRESSURE", { exact: true })).toBeVisible();
  await expect(lab.getByText("65%", { exact: true })).toBeVisible();
  await expect(lab.getByText("12m", { exact: true })).toBeVisible();

  await nav.getByRole("button", { name: /^Roster/ }).click();
  const roster = page.getByTestId("gvg-roster");
  await expect(roster).toBeVisible();
  const seed = roster.getByRole("button", { name: /Seed sample/i });
  await seed.click();
  await expect(roster.getByLabel("Player name").first()).toBeVisible();
  await roster.getByLabel("Secondary role").first().selectOption("HEALER");
  await expect(roster.getByLabel("Secondary role").first()).toHaveValue("HEALER");

  await nav.getByRole("button", { name: /^Strategy/ }).click();
  await expect(page.getByTestId("gvg-strategy-board")).toBeVisible();
  await expect(page.getByText("Bulwark", { exact: true })).toBeVisible();
  await expect(page.getByText("Fortune Tree", { exact: true })).toBeVisible();

  await nav.getByRole("button", { name: /^Timeline/ }).click();
  const sim = page.getByTestId("gvg-timeline-simulator");
  await expect(sim).toBeVisible();
  await expect(sim.getByText("3:00", { exact: true }).first()).toBeVisible();
  await expect(sim.getByText("Needs manual DR", { exact: true })).toBeVisible();
  const drInput = sim.getByLabel("DR per stack");
  await drInput.fill("0.01");
  await expect(sim.getByText("Needs manual DR", { exact: true })).toHaveCount(0);
  await expect(sim.getByText("100 → 50")).toBeVisible();
  await sim.getByLabel("Zhang Bao base (sec)").fill("900");
  await expect(sim.getByText("14:00–16:00", { exact: true })).toBeVisible();

  await nav.getByRole("button", { name: /^Match Log/ }).click();
  const logs = page.getByTestId("gvg-match-log");
  await expect(logs).toBeVisible();
  await logs.getByLabel("Date").fill("2026-08-17");
  await logs.getByLabel("Top outpost capture (sec)").fill("240");
  await logs.getByLabel("Bottom outpost capture (sec)").fill("300");
  await logs.getByLabel("Zhang Bao event (sec)").fill("840");
  await logs.getByLabel("Zhuxie Gule event (sec)").fill("960");
  await logs.getByLabel("Tree delivery (sec)").fill("1200");
  await logs.getByLabel("Tree delivered").check();
  await logs.getByRole("button", { name: /Save structured match/i }).click();
  await expect(logs.getByText("Recorded matches (1)")).toBeVisible();
  await expect(logs.getByText(/Outposts 2 · Bosses 2 · Tree delivered/)).toBeVisible();

  await page.getByText("More & Advanced", { exact: true }).click();
  await nav.getByRole("button", { name: /^Share Plan/ }).click();
  const share = page.getByTestId("gvg-share-privacy");
  await expect(share).toBeVisible();
  await expect(share.getByText("PUBLIC DATA INCLUDED", { exact: true })).toBeVisible();
  await expect(share.getByLabel(/Redact player names/i)).toBeChecked();
  await expect(share.getByRole("button", { name: /Generate share link/i })).toBeVisible();
  await expect(share.getByRole("button", { name: /Copy versioned JSON/i })).toBeVisible();

  const report = {
    pageErrors,
    consoleErrors,
    rosterMembers: await page.getByLabel("Player name").count(),
    hasStrategy: await page.getByTestId("gvg-strategy-board").count(),
    hasShare: await share.count(),
  };
  fs.writeFileSync("runtime-gvg-smoke-report.json", JSON.stringify(report, null, 2), "utf8");
  await page.screenshot({ path: "runtime-gvg-smoke.png", fullPage: true });
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});