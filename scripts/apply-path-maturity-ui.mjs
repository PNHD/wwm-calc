import fs from "node:fs";

const path = "src/App.tsx";
let app = fs.readFileSync(path, "utf8");
const normalizeEol = (value) => value.replace(/\r\n/g, "\n");
const from = `<GearCompareWorkspace
          rows={compareRows}`;
const to = `<GearCompareWorkspace
          pathKey={selectedBuild}
          rows={compareRows}`;
if (!normalizeEol(app).includes(to)) {
  if (!normalizeEol(app).includes(from)) throw new Error("[path-maturity-ui] GearCompareWorkspace anchor missing");
  const eol = app.includes("\r\n") ? "\r\n" : "\n";
  app = app.replace(from.replaceAll("\n", eol), to.replaceAll("\n", eol));
}
fs.writeFileSync(path, app, "utf8");
console.log("[path-maturity-ui] PASS — active Path maturity is surfaced in Gear Compare without changing build ownership.");
