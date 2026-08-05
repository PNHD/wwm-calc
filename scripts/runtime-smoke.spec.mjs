import { test, expect } from "@playwright/test";

test("production build renders the application shell", async ({ page }) => {
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
  await page.waitForTimeout(750);

  const root = page.locator("#root");
  const rootHtml = await root.innerHTML();
  const rootText = (await root.innerText()).trim();

  console.log(`[runtime-smoke] HTTP ${response?.status() ?? "no-response"}`);
  console.log(`[runtime-smoke] root HTML length: ${rootHtml.length}`);
  console.log(`[runtime-smoke] root text preview: ${rootText.slice(0, 300)}`);
  if (consoleErrors.length) {
    console.log(`[runtime-smoke] console errors:\n${consoleErrors.join("\n---\n")}`);
  }
  if (pageErrors.length) {
    console.log(`[runtime-smoke] page errors:\n${pageErrors.join("\n---\n")}`);
  }

  await page.screenshot({ path: "runtime-smoke.png", fullPage: true });

  expect(response?.ok(), "preview server must return a successful document response").toBeTruthy();
  expect(pageErrors, "the production bundle must not throw during initial render").toEqual([]);
  expect(rootHtml.length, "#root must contain the rendered application").toBeGreaterThan(100);
  expect(rootText.length, "the application shell must expose visible text").toBeGreaterThan(20);
});
