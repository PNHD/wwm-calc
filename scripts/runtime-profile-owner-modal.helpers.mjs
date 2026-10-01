import { expect } from "@playwright/test";

// Shared candidate and exact-SHA production assertions; fixtures stay browser-local.
export async function verifyProfileOwnership(page, base, width) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(base + "#pve/combat", { waitUntil: "networkidle" });
  const tools = async () => { const closed = page.locator(".workspace-tools:not([open]) > summary"); if (await closed.count()) await closed.click(); };
  await tools(); await page.getByRole("button", { name: "Load observed T96", exact: true }).click();
  const fixture = await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem("wwm_chars_v3"));
    const original = root.chars.find(char => char.id === root.activeCharId);
    const scheme = original.schemes.find(item => item.id === root.activeSchemeId);
    const a = { ...original, name: "Owner A", schemes: [structuredClone(scheme)] };
    const b = { ...structuredClone(a), id: "owner-b", name: "Owner B" };
    b.schemes[0].combatConfig = { ...b.schemes[0].combatConfig, food: false, tierKey: "custom", customDef: 777, customRes: .8 };
    const attack = b.schemes[0].gear.find(item => item.isEquipped && item.subs.some(sub => sub.type === "Max Phys Atk")).subs.find(sub => sub.type === "Max Phys Atk");
    attack.val = String(Number(attack.val) - 10);
    const twin = { ...structuredClone(a), id: "owner-twin", name: "Owner Twin" };
    return { root: { ...root, chars: [a, b, twin], activeCharId: a.id, activeSchemeId: scheme.id }, aId: a.id, schemeId: scheme.id, aConfig: structuredClone(scheme.combatConfig), aPanel: structuredClone(scheme.panel) };
  });
  await tools(); await page.getByRole("button", { name: "Data", exact: true }).click();
  const dataDialog = page.getByRole("dialog", { name: "Export / Import Data", exact: true });
  await dataDialog.getByLabel("Data Content:", { exact: true }).fill(JSON.stringify(fixture.root));
  await Promise.all([page.waitForEvent("load"), dataDialog.getByRole("button", { name: "Import", exact: true }).click()]);
  const selectRole = async id => {
    await tools(); await page.getByRole("combobox", { name: "Current role", exact: true }).selectOption(id);
    const open = page.locator(".workspace-tools[open] > summary"); if (await open.count()) await open.click();
  };
  const config = async id => page.evaluate(id => JSON.parse(localStorage.getItem("wwm_chars_v3")).chars.find(char => char.id === id).schemes[0].combatConfig, id);
  const dps = async () => page.evaluate(() => window.__WWM_SCENARIO_DIAGNOSTIC__.headlineDps);
  const food = page.getByRole("checkbox", { name: /Attack-Boosting Food/ });
  const aDps = await dps();
  await selectRole("owner-b");
  await expect(food).not.toBeChecked();
  expect(await config("owner-b")).toMatchObject({ food: false, tierKey: "custom", customDef: 777 });
  const panel = async id => page.evaluate(id => JSON.parse(localStorage.getItem("wwm_chars_v3")).chars.find(char => char.id === id).schemes[0].panel, id);
  const bPanel = await panel("owner-b");
  expect(bPanel.maxOuter).toBeCloseTo(fixture.aPanel.maxOuter - 10, 8);
  expect(await panel(fixture.aId)).toEqual(fixture.aPanel);
  const bDps = await dps(); expect(bDps).not.toBe(aDps);
  await food.check();
  await expect.poll(async () => (await config("owner-b")).food).toBe(true);
  expect(await config("owner-b")).toMatchObject({ customDef: 777, tierKey: "custom" });
  expect(await config(fixture.aId)).toEqual(fixture.aConfig);
  const bChangedDps = await dps();
  await page.reload({ waitUntil: "networkidle" });
  await expect(food).toBeChecked();
  expect(await dps()).toBeCloseTo(bChangedDps, 8);
  await selectRole(fixture.aId);
  expect(await dps()).toBeCloseTo(aDps, 8);
  expect(await config(fixture.aId)).toEqual(fixture.aConfig);
  expect(await panel(fixture.aId)).toEqual(fixture.aPanel);
  await selectRole("owner-b");
  expect(await dps()).toBeCloseTo(bChangedDps, 8);
  expect(await panel("owner-b")).toEqual(bPanel);
  await page.goto(base + "#pve/team", { waitUntil: "networkidle" });
  await page.getByLabel("Member 1 profile", { exact: true }).selectOption(`${fixture.aId}:${fixture.schemeId}`);
  await page.getByLabel("Member 2 profile", { exact: true }).selectOption(`owner-b:${fixture.schemeId}`);
  await expect.poll(async () => Number((await page.getByTestId("team-dps").innerText()).replace(/[^0-9]/g, ""))).toBe(Math.round(aDps + bChangedDps));
  await selectRole(fixture.aId);
  await expect.poll(async () => Number((await page.getByTestId("team-dps").innerText()).replace(/[^0-9]/g, ""))).toBe(Math.round(aDps + bChangedDps));
  return { width, duplicateSchemeIdsPreserved: true, savedContextIsolated: true, immediateReload: true, teamParity: true, aDps, bDps, bChangedDps };
}

export async function verifyProfileModalFocus(page, base, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(base + "#pve/combat", { waitUntil: "networkidle" });
  for (const [action, dialogName, closeName] of [["Data", "Export / Import Data", "Close data"], ["Import game", /Import Equipped Gear from Game/, "Close game import"]]) {
    await page.locator(".workspace-tools > summary").click();
    await page.getByRole("button", { name: action, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: dialogName, exact: typeof dialogName === "string" });
    await expect(dialog).toBeVisible();
    const close = dialog.getByRole("button", { name: closeName, exact: true });
    await close.focus(); await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    for (let step = 0; step < 16; step++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".workspace-tools > summary")).toBeFocused();
    expect(await page.locator(".workspace-tools > summary").evaluate(el => Boolean(el.closest("[inert]")))).toBe(false);
    await page.locator(".workspace-tools > summary").press("Enter");
    await expect(page.getByRole("button", { name: action, exact: true })).toBeVisible();
    await page.getByRole("button", { name: action, exact: true }).click();
    await dialog.getByRole("button", { name: closeName, exact: true }).click();
    await expect(page.locator(".workspace-tools > summary")).toBeFocused();
  }
  return { width, dataFocusContained: true, gameFocusContained: true, escapeAndButtonClosure: true, visibleToolsFocusRestored: true };
}
