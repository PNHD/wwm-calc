import fs from "node:fs";
import { callNamed, declarationsNamed, enclosingFunction, hasLiteralFalseAncestor, isDescendantOf, parseTsx, ts } from "./source-invariant-ast.mjs";

const path = "src/App.tsx";
let app = fs.readFileSync(path, "utf8");

const normalizeToLf = (value) => value.replace(/\r\n/g, "\n");
const codeOnly = (value) => value
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/[^\n]*/g, "");
const count = (value, pattern) => [...value.matchAll(pattern)].length;
const hasReachableOwnedTrustHelper = (source) => {
  const sourceFile = parseTsx(source);
  const helpers = declarationsNamed(sourceFile, "bestBuildTrustSummary");
  if (helpers.length !== 1 || !ts.isArrowFunction(helpers[0].initializer) || hasLiteralFalseAncestor(helpers[0])) return false;
  const owner = enclosingFunction(helpers[0]);
  if (!owner || hasLiteralFalseAncestor(owner)) return false;
  let uses = 0;
  ts.forEachChild(owner.body, function walk(node) {
    if (callNamed(node, "bestBuildTrustSummary") && isDescendantOf(node, owner) && !hasLiteralFalseAncestor(node)) uses += 1;
    ts.forEachChild(node, walk);
  });
  return uses >= 2;
};

const replaceRequired = (from, to, label) => {
  const normalizedApp = normalizeToLf(app);
  const normalizedFrom = normalizeToLf(from);
  const normalizedTo = normalizeToLf(to);
  if (normalizedApp.includes(normalizedTo)) return;

  const matchCount = normalizedApp.split(normalizedFrom).length - 1;
  if (matchCount !== 1) throw new Error(`[bamboocut-best-trust] Missing or ambiguous anchor: ${label}`);

  const replaced = normalizedApp.replace(normalizedFrom, normalizedTo);
  app = app.includes("\r\n") ? replaced.replace(/\n/g, "\r\n") : replaced;
};

const helperAnchor = `                          const pathMaturity = PATH_MODEL_MATURITY[selectedBuild];
                          // Best Build recommendation confidence`;
const helperBlock = `                          const pathMaturity = PATH_MODEL_MATURITY[selectedBuild];
                          const bestBuildTrustSummary = (entry: { gear: GearItem[]; rate: number }) => {
                            const dps = entry.rate / 100 * baselineScore / modeledDurationOrZero(selectedBuild);
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

if (!normalizeToLf(app).includes(`bestBuildEntries.slice(1, 3).map((r, idx) => (`)) {
  replaceRequired(
    `bestBuildResult.slice(1, 6).map((r, idx) => (`,
    `bestBuildEntries.slice(1, 3).map((r, idx) => (`,
    "Top 3 result limit",
  );
}

const alternativeName = `<span className="text-slate-300 truncate flex-1 px-2" title={r.gear.map(g => g.name).join(", ")}>{r.gear.map(g => g.name).join(" · ")}</span>`;
const alternativeNameTrust = `<span className="text-slate-300 truncate flex-1 px-2" title={r.gear.map(g => g.name).join(", ")}>{r.gear.map(g => g.name).join(" · ")}<small className="block text-[9.5px] text-slate-500">{(() => { const meta = bestBuildTrustSummary(r); return \`Sets: \${meta.setLabel} · Attunements: \${meta.attunements} · Tradeoffs: \${meta.tradeoffs}\`; })()}</small></span>`;
replaceRequired(alternativeName, alternativeNameTrust, "alternative set/attunement/tradeoff details");

const alternativeDps = `<span className="font-mono font-bold text-[#f0b400] mr-2">{Math.round(r.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild)).toLocaleString()} DPS</span>`;
const alternativeDpsTrust = `<span className="font-mono font-bold text-[#f0b400] mr-2">{Math.round(bestBuildTrustSummary(r).dps).toLocaleString()} DPS<small className="block text-[9.5px] text-slate-500 font-sans">{(() => { const meta = bestBuildTrustSummary(r); return \`\${meta.deltaPct >= 0 ? "+" : ""}\${meta.deltaPct.toFixed(2)}% · \${meta.confidence.label}\`; })()}</small></span>`;
replaceRequired(alternativeDps, alternativeDpsTrust, "alternative DPS/confidence details");

const executable = codeOnly(normalizeToLf(app));
if (!hasReachableOwnedTrustHelper(normalizeToLf(app))) throw new Error("[bamboocut-best-trust] trust helper must be uniquely owned by the live Best Build scope");
if (count(executable, /\bconst\s+bestBuildTrustSummary\s*=/g) !== 1) throw new Error("[bamboocut-best-trust] missing or duplicate Top 3 trust helper");
const helperStart = executable.indexOf("const bestBuildTrustSummary");
const helperEnd = executable.indexOf("const bestTrust =", helperStart);
const helper = executable.slice(helperStart, helperEnd);
for (const predicate of ["modeledDurationOrZero(selectedBuild)", "recommendationConfidence(", "detectSet4pc(entry.gear)", "entry.gear.map(attunementSummary)", "PANEL_COMPARE_FIELDS.map(", "dps, deltaPct, confidence, setLabel, attunements", "tradeoffs:"]) {
  if (!helper.includes(predicate)) throw new Error(`[bamboocut-best-trust] incomplete trust helper: ${predicate}`);
}
if (helper.includes("getRotationTimeForBuild(selectedBuild)")) throw new Error("[bamboocut-best-trust] obsolete duration capability in trust helper");
if (count(executable, /bestBuildEntries\.slice\(1,\s*3\)\.map\(/g) !== 1 || executable.includes("bestBuildResult.slice(")) throw new Error("[bamboocut-best-trust] invalid Top 3 result ownership or bound");
for (const predicate of ["bestTrust.deltaPct", "bestTrust.confidence.label", "bestTrust.setLabel", "bestTrust.attunements", "bestTrust.tradeoffs", "bestBuildTrustSummary(r).dps", "meta.deltaPct", "meta.confidence.label", "meta.setLabel", "meta.attunements", "meta.tradeoffs"]) {
  if (!executable.includes(predicate)) throw new Error(`[bamboocut-best-trust] missing trust presentation: ${predicate}`);
}

if (fs.readFileSync(path, "utf8") !== app) fs.writeFileSync(path, app, "utf8");
console.log("[bamboocut-best-trust] PASS — semantic Top 3 trust predicates verified.");
