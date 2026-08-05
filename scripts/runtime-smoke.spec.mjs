import { test, expect } from "@playwright/test";

test("production build renders the application shell and current T96 assumptions", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.stack || error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const response = await page.goto("http://127.0.0.1:4173/", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(500);

  const root = page.locator("#root");
  const rootHtml = await root.innerHTML();
  const rootText = (await root.innerText()).trim();

  console.log(`[runtime-smoke] HTTP ${response?.status() ?? "no-response"}`);
  console.log(`[runtime-smoke] root HTML length: ${rootHtml.length}`);
  console.log(`[runtime-smoke] root text preview: ${rootText.slice(0, 300)}`);

  expect(response?.ok(), "preview server must return a successful document response").toBeTruthy();
  expect(rootHtml.length, "#root must contain the rendered application").toBeGreaterThan(100);
  expect(rootText.length, "the application shell must expose visible text").toBeGreaterThan(20);

  const legacyLayout = page.locator(".app-layout").first();
  if (await legacyLayout.count()) {
    await expect(legacyLayout, "legacy simulator must not bleed into product workspaces").toBeHidden();
  }

  await page.getByRole("button", { name: /Details/i }).click();
  await expect(page.getByRole("heading", { name: "Damage model" })).toBeVisible();
  await expect(page.getByText(/Attack-Boosting Food/).first()).toBeVisible();
  await expect(page.getByText(/\+120 Min \/ \+240 Max Physical Attack/).first()).toBeVisible();
  await expect(page.getByText(/Advanced parse projection/)).toBeVisible();
  await expect(page.getByText(/Execution efficiency/)).toHaveCount(0);
  await expect(page.getByText(/\+90 min \/ \+180 max/i)).toHaveCount(0);

  await page.screenshot({ path: "runtime-smoke.png", fullPage: true });

  if (consoleErrors.length) {
    console.log(`[runtime-smoke] console errors:\n${consoleErrors.join("\n---\n")}`);
  }
  if (pageErrors.length) {
    console.log(`[runtime-smoke] page errors:\n${pageErrors.join("\n---\n")}`);
  }

  expect(pageErrors, "the production bundle must not throw during initial render or navigation").toEqual([]);
});
