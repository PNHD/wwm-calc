import fs from "node:fs";

const app = fs.readFileSync("src/App.tsx", "utf8");

if (!app.includes('Number(currentMenuPanel[field.key] || 0) - Number((iwStats as any)[field.key] || 0)')) {
  throw new Error("[bamboocut-factor-diagnostic-audit] single-field diagnostic is not converted to pre-Inner-Way coordinates");
}
if (!app.includes('currentMenuPanel.prec - iwStats.prec') || !app.includes('currentMenuPanel.crit - iwStats.crit') || !app.includes('currentMenuPanel.aff - iwStats.aff')) {
  throw new Error("[bamboocut-factor-diagnostic-audit] joint outcome diagnostic is not converted to pre-Inner-Way coordinates");
}
if (!app.includes('attunement|attuned bonus')) {
  throw new Error("[bamboocut-factor-diagnostic-audit] legacy Attuned Bonus value comparison is not recognized");
}
if (app.includes('panelOverride: { [field.key]: Number(currentMenuPanel[field.key] || 0) }')) {
  throw new Error("[bamboocut-factor-diagnostic-audit] stale double-counting marginal override remains");
}

console.log("[bamboocut-factor-diagnostic-audit] PASS — factor attribution and Attunement comparison coordinates are guarded.");
