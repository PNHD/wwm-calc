import fs from "node:fs";

const app = fs.readFileSync("src/App.tsx", "utf8");

if (!app.includes("const comparePanelForDiagnostics = (combo: GearItem[])")) {
  throw new Error("[bamboocut-factor-diagnostic-audit] exact pre-timeline panel helper missing");
}
if (!app.includes("const currentDiagnosticPanel = comparePanelForDiagnostics(equippedGear)")) {
  throw new Error("[bamboocut-factor-diagnostic-audit] current exact diagnostic panel missing");
}
if (!app.includes("Number(currentDiagnosticPanel[field.key] || 0)")) {
  throw new Error("[bamboocut-factor-diagnostic-audit] single-field diagnostic is not reverted in exact combat-panel coordinates");
}
if (!app.includes("prec: currentDiagnosticPanel.prec") || !app.includes("crit: currentDiagnosticPanel.crit") || !app.includes("aff: currentDiagnosticPanel.aff")) {
  throw new Error("[bamboocut-factor-diagnostic-audit] joint outcome diagnostic is not reverted in exact combat-panel coordinates");
}
if (!app.includes("attunement|attuned bonus")) {
  throw new Error("[bamboocut-factor-diagnostic-audit] legacy Attuned Bonus value comparison is not recognized");
}
if (app.includes("panelOverride: { [field.key]: Number(currentMenuPanel[field.key] || 0) }") || app.includes("currentMenuPanel.prec - iwStats.prec")) {
  throw new Error("[bamboocut-factor-diagnostic-audit] stale UI-derived diagnostic coordinate remains");
}

console.log("[bamboocut-factor-diagnostic-audit] PASS — marginal attribution uses exact pre-timeline combat-panel coordinates and Attunement comparison is guarded.");
