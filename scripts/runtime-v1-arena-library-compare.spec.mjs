import { test, expect } from "@playwright/test";
import { defaultArenaState } from "../src/arena/arena-core.mjs";

const BASE = "http://127.0.0.1:4173/";

test("Arena Library Compare loads the selected reference without cloning or active-state overwrite", async ({ page }) => {
  const arena = defaultArenaState();
  arena.onboardingComplete = true;
  arena.profiles[0].name = "Active Arena Build";
  await page.addInitScript((state) => localStorage.setItem("wwm_arena_state_v1", JSON.stringify(state)), arena);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  await page.goto(`${BASE}#library/arena`, { waitUntil: "networkidle" });
  const card = page.locator('[data-library-id="bamboocut-dust-arena-control-pressure"]');
  await expect(card).toBeVisible();
  const arenaBefore = await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"));
  await card.getByRole("button", { name: /^Compare$/ }).click();

  await expect(page.getByTestId("arena-compare")).toBeVisible();
  await expect(page.getByText(/Community Library reference loaded for comparison only/i)).toBeVisible();
  const buildB = page.getByLabel("BUILD B");
  await expect(buildB.locator("option:checked")).toContainText("Community Reference");
  await expect(page.getByText(/PvE modeled DPS is intentionally excluded from Arena comparison/i)).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("wwm_arena_library_compare_v1"))).toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem("wwm_arena_library_compare_v1"))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("wwm_arena_state_v1"))).toBe(arenaBefore);
  expect(errors).toEqual([]);
});

test("malformed Arena Library comparison descriptor fails closed", async ({ page }) => {
  const arena = defaultArenaState();
  arena.onboardingComplete = true;
  await page.addInitScript((state) => {
    localStorage.setItem("wwm_arena_state_v1", JSON.stringify(state));
    sessionStorage.setItem("wwm_arena_library_compare_v1", '{"__proto__":{"polluted":true},"path":"Bamboocut-Dust","mode":"1v1"}');
  }, arena);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  await page.goto(`${BASE}#arena/compare`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("arena-compare")).toBeVisible();
  await expect(page.getByText(/Community Library reference loaded for comparison only/i)).toHaveCount(0);
  expect(await page.evaluate(() => ({}).polluted)).toBeUndefined();
  expect(errors).toEqual([]);
});
