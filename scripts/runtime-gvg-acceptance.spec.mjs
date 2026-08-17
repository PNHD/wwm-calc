import fs from "node:fs";
import { test, expect } from "@playwright/test";

test("Global Guild War Lab opens and exposes planning, simulator, roster and sharing surfaces", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  const response = await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();
  const nav = page.getByRole("navigation", { name: "Product workspaces" });
  await expect(nav).toBeVisible();
  await nav.getByRole("button", { name: /Guild War/i }).click();

  const workspace = page.getByTestId("guild-war-workspace");
  await expect(workspace).toBeVisible();
  await expect(workspace.getByText("GLOBAL GUILD WAR LAB")).toBeVisible();
  await expect(workspace.getByText("Outposts").first()).toBeVisible();
  await expect(workspace.getByText("Qi damage taken").first()).toBeVisible();

  const lab = page.getByTestId("gvg-build-lab");
  await expect(lab.getByText("Bamboocut-Dust", { exact: true })).toBeVisible();
  await expect(lab.getByText("ANTI-HEAL / ZONE PRESSURE", { exact: true })).toBeVisible();
  await expect(lab.getByText("65%", { exact: true })).toBeVisible();
  await expect(lab.getByText("12m", { exact: true })).toBeVisible();

  await workspace.getByRole("button", { name: /Roster 30/i }).click();
  const roster = page.getByTestId("gvg-roster");
  await expect(roster).toBeVisible();
  const seed = roster.getByRole("button", { name: /Seed sample/i });
  await seed.click();
  await expect(roster.getByLabel("Player name").first()).toBeVisible();

  await workspace.getByRole("button", { name: /Strategy/i }).click();
  await expect(page.getByTestId("gvg-strategy-board")).toBeVisible();
  await expect(page.getByText("Bulwark", { exact: true })).toBeVisible();
  await expect(page.getByText("Fortune Tree", { exact: true })).toBeVisible();

  await workspace.getByRole("button", { name: /Timeline & Sim/i }).click();
  const sim = page.getByTestId("gvg-timeline-simulator");
  await expect(sim).toBeVisible();
  await expect(sim.getByText("3:00", { exact: true }).first()).toBeVisible();
  await expect(sim.getByText("Needs manual DR", { exact: true })).toBeVisible();
  const drInput = sim.getByLabel("DR per stack");
  await drInput.fill("0.01");
  await expect(sim.getByText("Needs manual DR", { exact: true })).toHaveCount(0);
  await expect(sim.getByText("100 → 50")).toBeVisible();

  await workspace.getByRole("button", { name: /Share/i }).last().click();
  const share = page.getByTestId("gvg-sharing");
  await expect(share).toBeVisible();
  await expect(share.getByText("Versioned schema v1")).toBeVisible();
  await expect(share.getByLabel(/Redact player names/i)).toBeChecked();
  await expect(share.getByRole("button", { name: /Clone to my workspace/i })).toBeVisible();

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
