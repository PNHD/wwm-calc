import { test, expect } from "@playwright/test";

const origin = process.env.WWM_TEST_ORIGIN || "http://127.0.0.1:4173";
test("manual Bleed Attunement persists independently of ordinary Retuned rolls", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/#pve/gear`);
  await page.getByRole("button", { name: "Add gear", exact: true }).click();
  await page.getByPlaceholder("Enter gear name").fill("Bleed audit gear");
  const selector = page.getByPlaceholder("Search Attunement...");
  await selector.fill("bleed");
  await page.getByText("Strategic Sword — Bleed DMG Boost", { exact: true }).click();
  await page.getByPlaceholder("e.g. 59.2 or 7.4%").last().fill("5.2%");
  await expect(page.getByText(/stored; no modeled effect for this Path/)).toBeVisible();
  await page.getByRole("button", { name: "Save Gear", exact: true }).click();
  const readSaved = () => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("wwm_chars_v3"));
    return data.chars.flatMap((char) => char.schemes.flatMap((scheme) => scheme.gear || []))
      .find((gear) => gear.name === "Bleed audit gear");
  });
  const gear = await readSaved();
  expect(gear).toBeTruthy();
  const bleed = gear.subs.find((row) => row.attunementId === "strategic-sword-bleed");
  expect(bleed).toMatchObject({ role: "attunement", val: "5.2%", isTuned: false, isRetuned: false });
  await page.reload();
  expect(await readSaved()).toEqual(gear);
  expect(errors).toEqual([]);
});

test("catalog exposes Pen, Shield, Healing and Draught with reference labels", async ({ page }) => {
  await page.goto(`${origin}/#pve/gear`);
  await page.getByRole("button", { name: "Add gear", exact: true }).click();
  const selector = page.getByPlaceholder("Search Attunement...");
  for (const [query, label] of [
    ["Physical Penetration", "Physical Penetration"],
    ["Shield", "Thundercry Blade - Shield Boost"],
    ["Deepdaze", "Driftcleave - Deepdaze Skill DMG Boost"],
    ["Healing Skill", "Panacea Fan - Healing Skill Boost"],
  ]) {
    await selector.fill(query);
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByText(/Community \/ historical reference/)).toBeVisible();
});
