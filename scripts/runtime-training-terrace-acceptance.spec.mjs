import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { defaultArenaState } from "../src/arena/arena-core.mjs";

const BASE = "http://127.0.0.1:4173/";
const TRAINING_KEY = "wwm_training_terrace_state_v1";
const TRAINING_BACKUP_KEY = `${TRAINING_KEY}__recovery_backup_v1`;
const ARENA_KEY = "wwm_arena_state_v1";
const GVG_PHASE_KEY = "wwm_gvg_phase_v2";
const GVG_PHASE_BACKUP_KEY = `${GVG_PHASE_KEY}__recovery_backup_v1`;

async function noOverflow(page) { const size = await page.evaluate(() => ({ width: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth })); expect(size.html).toBeLessThanOrEqual(size.width + 1); expect(size.body).toBeLessThanOrEqual(size.width + 1); }
const storage = (page, key) => page.evaluate((storageKey) => localStorage.getItem(storageKey), key);

test("Training Terrace is a recoverable, separate calibration domain", async ({ page }) => {
  const pageErrors = []; const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  const arena = defaultArenaState(); arena.onboardingComplete = true;
  await page.addInitScript((seed) => { if (sessionStorage.getItem("training-terrace-seeded") !== "1") { localStorage.setItem("wwm_arena_state_v1", JSON.stringify(seed)); sessionStorage.setItem("training-terrace-seeded", "1"); } }, arena);

  await page.goto(`${BASE}#pve/overview`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Open Training Terrace workspace").click();
  await expect(page.getByTestId("training-terrace-workspace")).toBeVisible();
  const headerVisual = await page.getByTestId("training-terrace-header").evaluate((header) => {
    const title = header.querySelector("h1");
    if (!title) throw new Error("Training Terrace title missing");
    return {
      display: getComputedStyle(header).display,
      background: getComputedStyle(header).backgroundColor,
      titleColor: getComputedStyle(title).color,
      titleBefore: getComputedStyle(title, "::before").content,
    };
  });
  expect(headerVisual.display).toBe("block");
  expect(headerVisual.background).toBe("rgb(17, 22, 27)");
  expect(headerVisual.titleColor).toBe("rgb(233, 230, 223)");
  expect(["none", "normal", '""']).toContain(headerVisual.titleBefore);
  await page.getByRole("button", { name: "Arena" }).click();
  await expect(page.getByTestId("arena-workspace")).toBeVisible();
  await page.goto(`${BASE}#training-terrace/overview`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Controlled observations, not ranked Arena truth/i)).toBeVisible();

  await page.getByLabel("Training Terrace session name").fill("Current-client calibration");
  await page.getByLabel("Target or dummy label").fill("Current-client dummy");
  await page.getByLabel("Target/context type").selectOption("ARENA_TRAINING");
  await page.getByLabel("Arena context being investigated").fill("Perception Forest calibration");
  await page.getByLabel("Observed Attunement state").selectOption("OBSERVED_ACTIVE");
  await page.getByLabel("HP baseline").fill("100"); await page.getByLabel("HP after").fill("125");
  await expect(page.getByText("+25 (+25.00%)")).toBeVisible(); await expect(page.getByText("CHANGED_OBSERVED")).toBeVisible();
  await page.getByLabel("Physical Attack baseline").fill("20"); await page.getByLabel("Physical Attack after").fill("20");
  await expect(page.getByText("UNCHANGED_OBSERVED")).toBeVisible(); await expect(page.locator(".terrace-row b").filter({ hasText: "NOT_MEASURED" }).first()).toBeVisible();
  await page.getByLabel("Precision baseline").fill("0"); await page.getByLabel("Precision after").fill("5");
  await expect(page.getByText("+5 (relative UNKNOWN)")).toBeVisible();
  await expect(page.getByText(/Attunement is categorical: OBSERVED_ACTIVE/i)).toBeVisible(); await expect(page.getByText(/does not prove cross-mode applicability/i)).toBeVisible();
  await expect(page.getByTestId("training-terrace-summary")).toContainText("Next measure:");
  await page.getByRole("button", { name: "Record calibration snapshot" }).click();
  await expect(page.getByTestId("training-terrace-latest-snapshot")).toContainText("Current-client dummy");
  const snapshotState = JSON.parse(await storage(page, TRAINING_KEY));
  expect(snapshotState.snapshots[0].recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(snapshotState.snapshots[0].name).toBe("Current-client calibration");
  expect(snapshotState.snapshots[0].target).toBe("Current-client dummy");
  expect(snapshotState.snapshots[0].contextType).toBe("ARENA_TRAINING");
  expect(snapshotState.snapshots[0].arenaContext).toBe("Perception Forest calibration");
  expect(snapshotState.snapshots[0].attunement).toBe("OBSERVED_ACTIVE");
  expect(snapshotState.snapshots[0].before.hp).toBe(100);
  expect(snapshotState.snapshots[0].after.hp).toBe(125);
  fs.mkdirSync("visual-qa", { recursive: true });
  await page.screenshot({ path: "visual-qa/training-terrace-desktop.png", fullPage: true });
  const trainingBeforeArena = await storage(page, TRAINING_KEY); const arenaBeforeTraining = await storage(page, ARENA_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Target or dummy label")).toHaveValue("Current-client dummy"); await expect(page.getByText("1 local snapshots")).toBeVisible();
  expect(await storage(page, ARENA_KEY)).toBe(arenaBeforeTraining);

  await page.goto(`${BASE}#arena/matchups`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Opponent Path").selectOption({ index: 1 });
  await page.getByLabel("Arena mode").getByRole("button", { name: "Perception Forest" }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  const arenaAfter = JSON.parse(await storage(page, ARENA_KEY));
  expect(arenaAfter.activeModeV2).toBe("PERCEPTION_FOREST"); expect(arenaAfter.opponentPath).toBeTruthy();
  expect(await storage(page, TRAINING_KEY)).toBe(trainingBeforeArena);

  const validBackup = JSON.stringify({ ...JSON.parse(trainingBeforeArena), target: "Recovered dummy" });
  await page.evaluate(({ primary, backup, value }) => { localStorage.setItem(primary, "{"); localStorage.setItem(backup, value); }, { primary: TRAINING_KEY, backup: TRAINING_BACKUP_KEY, value: validBackup });
  await page.goto(`${BASE}#training-terrace/overview`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/explicit recovery choice/i)).toBeVisible(); expect(await storage(page, TRAINING_KEY)).toBe("{"); expect(await storage(page, TRAINING_BACKUP_KEY)).toBe(validBackup);
  await page.getByRole("button", { name: "Recover backup" }).click(); await expect(page.getByLabel("Target or dummy label")).toHaveValue("Recovered dummy");
  expect(JSON.parse(await storage(page, TRAINING_KEY)).target).toBe("Recovered dummy");

  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ schemaVersion: 2 })), TRAINING_KEY);
  await page.goto(`${BASE}#training-terrace/overview`, { waitUntil: "domcontentloaded" });
  expect(JSON.parse(await storage(page, TRAINING_KEY)).schemaVersion).toBe(2);
  await page.getByRole("button", { name: "Replace with blank" }).click();
  expect(JSON.parse(await storage(page, TRAINING_KEY)).schemaVersion).toBe(1);

  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, name: "Sanitizer fixture", target: "Null fixture", contextType: "INVALID_CONTEXT", attunement: "INVALID_ATTUNEMENT", before: { hp: null }, after: { hp: 5 }, snapshots: [] })), TRAINING_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("HP baseline")).toHaveValue("");
  await expect(page.getByLabel("Target/context type")).toHaveValue("TRAINING_DUMMY");
  await expect(page.getByLabel("Observed Attunement state")).toHaveValue("UNKNOWN / NOT_MEASURED");
  await expect(page.getByLabel("HP baseline").locator("..").getByText("NOT_MEASURED", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 }); await noOverflow(page); await page.screenshot({ path: "visual-qa/training-terrace-result.png", fullPage: true }); await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page); await page.screenshot({ path: "visual-qa/training-terrace-mobile-390.png", fullPage: true });

  await page.evaluate((key) => localStorage.setItem(key, "BROKEN"), GVG_PHASE_KEY);
  await page.goto(`${BASE}#gvg/overview`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("gvg-secondary-recovery")).toBeVisible();
  await expect(page.getByLabel("Guild War current phase")).toHaveValue("PREPARATION");
  expect(await storage(page, GVG_PHASE_KEY)).toBe("BROKEN");
  expect(await storage(page, GVG_PHASE_BACKUP_KEY)).toBe("BROKEN");
  await page.getByRole("button", { name: "Acknowledge secondary recovery" }).click();
  await expect(page.getByTestId("gvg-secondary-recovery")).toHaveCount(0);

  expect(pageErrors).toEqual([]); expect(consoleErrors).toEqual([]);
});
