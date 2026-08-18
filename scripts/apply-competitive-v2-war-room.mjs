import fs from "node:fs";

const path = "src/product/GuildWarWorkspace.tsx";
let source = fs.readFileSync(path, "utf8");
const marker = "COMPETITIVE_V2_BATTLEFIELD_MAP";
if (!source.includes(marker)) {
  const objectivesAnchor = `const objectives = ["TOP_OUTPOST","BOTTOM_OUTPOST","JUNGLE","BULWARK","GOOSE","FORTUNE_TREE","FALLBACK"];`;
  if (!source.includes(objectivesAnchor)) throw new Error("Competitive V2 battlefield: Strategy objectives anchor missing");
  source = source.replace(objectivesAnchor, `${objectivesAnchor} const [selectedObjective, setSelectedObjective] = useState("TOP_OUTPOST"); const objectivePositions: Record<string,{x:number;y:number}> = { TOP_OUTPOST:{x:22,y:18}, BOTTOM_OUTPOST:{x:22,y:78}, JUNGLE:{x:43,y:52}, BULWARK:{x:62,y:50}, GOOSE:{x:78,y:50}, FORTUNE_TREE:{x:88,y:72}, FALLBACK:{x:8,y:50} }; const selectedSquad = assignments[selectedObjective] || "UNASSIGNED"; const selectedEx = [...new Set(roster.filter((member) => selectedSquad !== "UNASSIGNED" && member.team === selectedSquad && member.exTechnique).map((member) => member.exTechnique))]; // COMPETITIVE_V2_BATTLEFIELD_MAP`);

  const boardAnchor = `</article></div><div className="gvg-grid gvg-grid-2">{objectives.map((id) => <article className="gvg-card" data-objective-id={id} key={id}>`;
  if (!source.includes(boardAnchor)) throw new Error("Competitive V2 battlefield: board insertion anchor missing");
  const battlefield = `</article></div><div className="gvg-battlefield" data-testid="gvg-objective-map" aria-label="Guild War battlefield objective map"><div className="gvg-battlefield-grid" aria-hidden="true"/>{objectives.map((id) => <button type="button" key={id} data-objective-id={id} className={selectedObjective === id ? "is-selected" : ""} style={{ left: \`${'${'}objectivePositions[id].x}%\`, top: \`${'${'}objectivePositions[id].y}%\` }} onClick={() => setSelectedObjective(id)}><span>{id.replaceAll("_", " ")}</span></button>)}</div><article className="gvg-card gvg-objective-inspector" data-testid="gvg-objective-inspector"><div className="gvg-card-head"><div><span className="gvg-kind">SELECTED OBJECTIVE</span><h3>{selectedObjective.replaceAll("_", " ")}</h3></div><EvidenceBadge value={selectedObjective === "TOP_OUTPOST" || selectedObjective === "BOTTOM_OUTPOST" ? EVIDENCE_STATE.CONFIRMED_OFFICIAL : EVIDENCE_STATE.UNKNOWN}/></div><div className="gvg-stat-grid"><Stat label="Current phase" value={phase.replaceAll("_", " ")}/><Stat label="Assigned squad" value={selectedSquad}/><Stat label="EX coverage" value={selectedEx.length ? selectedEx.join(" · ") : "UNASSIGNED"}/><Stat label="Next command" value="UNKNOWN" detail="current cost/CD client-gated"/></div>{(selectedObjective === "BULWARK" || selectedObjective === "GOOSE") && <Unknown>Exact proximity DR-per-stack remains unresolved; the objective simulator requires a manual Advanced value.</Unknown>}<p className="gvg-footnote">Map, assignment cards and objective timeline use the same objective IDs and persisted assignment state.</p></article><div className="gvg-grid gvg-grid-2">{objectives.map((id) => <article className="gvg-card" data-objective-id={id} key={id}>`;
  source = source.replace(boardAnchor, battlefield);

  const timelineAnchor = `</div><article className="gvg-card"><label>Advanced · Halftime trigger (seconds)`;
  if (!source.includes(timelineAnchor)) throw new Error("Competitive V2 battlefield: Timeline anchor missing");
  const timelineShared = `</div><article className="gvg-card" data-testid="gvg-objective-timeline"><span className="gvg-kind">OBJECTIVE TIMELINE · SHARED IDS</span>{["TOP_OUTPOST","BOTTOM_OUTPOST","JUNGLE","BULWARK","GOOSE","FORTUNE_TREE","FALLBACK"].map((id) => <div className="gvg-inspector-row" data-objective-id={id} key={id}><strong>{id.replaceAll("_", " ")}</strong><span>{id === "TOP_OUTPOST" || id === "BOTTOM_OUTPOST" ? "3:00" : "UNKNOWN/config"}</span><small>{loadGvgAssignmentsV2()[id] || "UNASSIGNED"}</small></div>)}</article><article className="gvg-card"><label>Advanced · Halftime trigger (seconds)`;
  source = source.replace(timelineAnchor, timelineShared);
  fs.writeFileSync(path, source, "utf8");
}

const cssPath = "src/product/guild-war.css";
let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes(".gvg-battlefield{")) {
  css += `\n.gvg-battlefield{position:relative;min-height:340px;border:1px solid rgba(255,255,255,.09);border-radius:18px;overflow:hidden;background:linear-gradient(135deg,rgba(46,70,54,.28),rgba(20,24,28,.96));margin:16px 0}.gvg-battlefield-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:40px 40px}.gvg-battlefield button{position:absolute;transform:translate(-50%,-50%);max-width:120px;padding:8px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:#111820;color:inherit;z-index:1;font-size:11px;font-weight:700}.gvg-battlefield button.is-selected{outline:2px solid currentColor;outline-offset:2px}.gvg-objective-inspector{margin-bottom:16px}.gvg-inspector-row{display:grid;grid-template-columns:minmax(140px,1fr) 120px minmax(140px,1fr);gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}@media(max-width:640px){.gvg-battlefield{min-height:300px}.gvg-battlefield button{font-size:9px;max-width:90px}.gvg-inspector-row{grid-template-columns:1fr;gap:2px}}\n`;
  fs.writeFileSync(cssPath, css, "utf8");
}

const testPath = "scripts/runtime-gvg-acceptance.spec.mjs";
let test = fs.readFileSync(testPath, "utf8");
const testMarker = `await expect(page.getByTestId("gvg-objective-map")).toBeVisible();`;
if (!test.includes(testMarker)) {
  const testAnchor = `  await expect(page.locator('[data-objective-id="FORTUNE_TREE"]')).toBeVisible();`;
  if (!test.includes(testAnchor)) throw new Error("Competitive V2 battlefield: GvG runtime test anchor missing");
  test = test.replace(testAnchor, `${testAnchor}\n  ${testMarker}\n  await page.getByTestId("gvg-objective-map").locator('[data-objective-id="GOOSE"]').click();\n  await expect(page.getByTestId("gvg-objective-inspector")).toContainText("GOOSE");\n  await expect(page.getByTestId("gvg-objective-inspector")).toContainText(/Exact proximity DR-per-stack remains unresolved/i);\n  await page.goto(\`${'${'}base}#gvg/timeline\`, { waitUntil: "networkidle" });\n  await expect(page.getByTestId("gvg-objective-timeline").locator('[data-objective-id="TOP_OUTPOST"]')).toContainText("3:00");`);
  fs.writeFileSync(testPath, test, "utf8");
}

console.log("Competitive V2 battlefield map/shared objective-state contract applied deterministically.");
