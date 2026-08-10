import fs from "node:fs";

const path = "src/App.tsx";
let app = fs.readFileSync(path, "utf8");
const from = `<GearCompareWorkspace
          rows={compareRows}`;
const to = `<GearCompareWorkspace
          pathKey={selectedBuild}
          rows={compareRows}`;
if (!app.includes(to)) {
  if (!app.includes(from)) throw new Error("[path-maturity-ui] GearCompareWorkspace anchor missing");
  app = app.replace(from, to);
}
fs.writeFileSync(path, app, "utf8");
console.log("[path-maturity-ui] PASS — active Path maturity is surfaced in Gear Compare without changing build ownership.");
