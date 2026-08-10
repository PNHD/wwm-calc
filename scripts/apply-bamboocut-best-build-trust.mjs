import fs from "node:fs";

const path = "src/App.tsx";
let app = fs.readFileSync(path, "utf8");

const replaceRequired = (from, to, label) => {
  if (app.includes(to)) return;
  if (!app.includes(from)) throw new Error(`[bamboocut-best-trust] Missing anchor: ${label}`);
  app = app.replace(from, to);
};

const helperAnchor = `                          const pathMaturity = PATH_MODEL_MATURITY[selectedBuild];
                          // Best Build recommendation confidence`;
const helperBlock = `                          const pathMaturity = PATH_MODEL_MATURITY[selectedBuild];
                          const bestBuildTrustSummary = (entry: { gear: GearItem[]; rate: number }) => {
                            const dps = entry.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild);
                            const deltaPct = rotationStats.dps > 0 ? (dps - rotationStats.dps) / rotationStats.dps * 100 : 0;
                            const confidence = recommendationConfidence({ pathKey: selectedBuild, deltaPct, panelCalibrated: selectedBuild === "bamboocut-dust" || Boolean(activeScheme?.baseOverride), materialUnknowns: selectedBuild === "bamboocut-dust" ? BAMBOOCUT_MODEL_UNKNOWNS : [] });
                            const sets = detectSet4pc(entry.gear);
                            const setLabel = \`Weapon \${getSetName(sets.weaponSet)} · Armor \${getSetName(sets.armorSet)}\`;
                            const attunements = entry.gear.map(attunementSummary).filter((value) => value !== "None");
                            const candidatePanel = menuPanelForCombo(entry.gear);
                            const tradeoffs = PANEL_COMPARE_FIELDS.map(({ key, label }) => ({ label, delta: Number(candidatePanel[key] || 0) - Number(currentMenuPanel[key] || 0) }))
                              .filter((row) => Math.abs(row.delta) >= 0.05)
                              .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                              .slice(0, 2)
                              .map((row) => \`\${row.label} \${row.delta >= 0 ? "+" : ""}\${row.delta.toFixed(1)}\`)
                              .join(" · ");
                            return { dps, deltaPct, confidence, setLabel, attunements: attunements.length ? attunements.join("; ") : "None", tradeoffs: tradeoffs || "No material menu-panel delta" };
                          };
                          const bestTrust = bestBuildTrustSummary(best);
                          // Best Build recommendation confidence`;
replaceRequired(helperAnchor, helperBlock, "Top 3 trust helper");

replaceRequired(
  `<div className="text-[11px] text-slate-500 mt-1">Delta vs current: {bestDeltaPct >= 0 ? "+" : ""}{bestDeltaPct.toFixed(2)}% · Confidence: <strong>{bestConfidence.label}</strong>{pathMaturity ? <> · {pathMaturity.ownership} · {pathMaturity.maturity}</> : null}</div>`,
  `<div className="text-[11px] text-slate-500 mt-1">Delta vs current: {bestTrust.deltaPct >= 0 ? "+" : ""}{bestTrust.deltaPct.toFixed(2)}% · Confidence: <strong>{bestTrust.confidence.label}</strong>{pathMaturity ? <> · {pathMaturity.ownership} · {pathMaturity.maturity}</> : null}</div>
                              <div className="text-[10.5px] text-slate-500 mt-1">Sets: {bestTrust.setLabel} · Attunements: {bestTrust.attunements}</div>
                              <div className="text-[10.5px] text-slate-500 mt-1">Key tradeoffs: {bestTrust.tradeoffs}</div>`,
  "winner trust details",
);

replaceRequired(
  `bestBuildResult.slice(1, 6).map((r, idx) => (`,
  `bestBuildResult.slice(1, 3).map((r, idx) => (`,
  "Top 3 result limit",
);

const alternativeName = `<span className="text-slate-300 truncate flex-1 px-2" title={r.gear.map(g => g.name).join(", ")}>{r.gear.map(g => g.name).join(" · ")}</span>`;
const alternativeNameTrust = `<span className="text-slate-300 truncate flex-1 px-2" title={r.gear.map(g => g.name).join(", ")}>{r.gear.map(g => g.name).join(" · ")}<small className="block text-[9.5px] text-slate-500">{(() => { const meta = bestBuildTrustSummary(r); return \`Sets: \${meta.setLabel} · Attunements: \${meta.attunements} · Tradeoffs: \${meta.tradeoffs}\`; })()}</small></span>`;
replaceRequired(alternativeName, alternativeNameTrust, "alternative set/attunement/tradeoff details");

const alternativeDps = `<span className="font-mono font-bold text-[#f0b400] mr-2">{Math.round(r.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild)).toLocaleString()} DPS</span>`;
const alternativeDpsTrust = `<span className="font-mono font-bold text-[#f0b400] mr-2">{Math.round(bestBuildTrustSummary(r).dps).toLocaleString()} DPS<small className="block text-[9.5px] text-slate-500 font-sans">{(() => { const meta = bestBuildTrustSummary(r); return \`\${meta.deltaPct >= 0 ? "+" : ""}\${meta.deltaPct.toFixed(2)}% · \${meta.confidence.label}\`; })()}</small></span>`;
replaceRequired(alternativeDps, alternativeDpsTrust, "alternative DPS/confidence details");

if (!app.includes("bestBuildResult.slice(1, 3)")) throw new Error("[bamboocut-best-trust] Top 3 limit missing");
if (!app.includes("Key tradeoffs: {bestTrust.tradeoffs}")) throw new Error("[bamboocut-best-trust] winner tradeoffs missing");
if (!app.includes("meta.confidence.label")) throw new Error("[bamboocut-best-trust] alternative confidence missing");

fs.writeFileSync(path, app, "utf8");
console.log("[bamboocut-best-trust] PASS — Top 3 expose DPS delta, confidence, sets, Attunements and tradeoffs.");
