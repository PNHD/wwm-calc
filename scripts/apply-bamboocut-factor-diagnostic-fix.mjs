import fs from "node:fs";

const path = "src/App.tsx";
let app = fs.readFileSync(path, "utf8");

const replaceRequired = (from, to, label) => {
  if (app.includes(to)) return;
  if (!app.includes(from)) throw new Error(`[bamboocut-factor-diagnostic] Missing anchor: ${label}`);
  app = app.replace(from, to);
};

// comboInCombat starts from the residual+gear panel and simulateTimeline then adds
// static Inner Way rows. Gear Compare's visible currentMenuPanel already includes
// those static rows. A diagnostic override therefore has to convert the visible
// menu value back to pre-Inner-Way coordinates or it double-counts the static IW
// contribution and wildly overstates marginal DPS.
replaceRequired(
  'panelOverride: { [field.key]: Number(currentMenuPanel[field.key] || 0) }',
  'panelOverride: { [field.key]: Number(currentMenuPanel[field.key] || 0) - Number((iwStats as any)[field.key] || 0) }',
  "single-field resolved-panel coordinate conversion",
);
replaceRequired(
  'panelOverride: { prec: currentMenuPanel.prec, crit: currentMenuPanel.crit, aff: currentMenuPanel.aff }',
  'panelOverride: { prec: currentMenuPanel.prec - iwStats.prec, crit: currentMenuPanel.crit - iwStats.crit, aff: currentMenuPanel.aff - iwStats.aff }',
  "joint outcome resolved-panel coordinate conversion",
);

// Legacy observed fixtures may use the semantic label "Attuned Bonus" without a
// normalized role/displayName. Keep the comparison explanation truthful when the
// same Attunement improves from 5.0 to 5.2.
replaceRequired(
  '/martial art skill dmg boost|attunement/i.test((sub as any).displayName || sub.type)',
  '/martial art skill dmg boost|attunement|attuned bonus/i.test((sub as any).displayName || sub.type)',
  "legacy Attuned Bonus comparison label",
);

if (app.includes('panelOverride: { [field.key]: Number(currentMenuPanel[field.key] || 0) }')) {
  throw new Error("[bamboocut-factor-diagnostic] visible-menu value is still being injected into pre-IW coordinates");
}
if (!app.includes('currentMenuPanel.prec - iwStats.prec')) {
  throw new Error("[bamboocut-factor-diagnostic] outcome coordinate conversion missing");
}

fs.writeFileSync(path, app, "utf8");
console.log("[bamboocut-factor-diagnostic] PASS — marginal diagnostics use pre-IW coordinates and Attunement value changes remain visible.");
