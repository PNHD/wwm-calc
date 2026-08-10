import fs from "node:fs";

const path = "src/App.tsx";
let app = fs.readFileSync(path, "utf8");
const stale = "const value = parseVal(sub.val);";
const fixed = 'const value = Number.parseFloat(String(sub.val ?? "").replace("%", ""));';

if (!app.includes(fixed)) {
  if (!app.includes(stale)) {
    throw new Error("[bamboocut-attunement-runtime] Attunement parse anchor missing");
  }
  app = app.replace(stale, fixed);
}

if (app.includes(stale)) {
  throw new Error("[bamboocut-attunement-runtime] undefined parseVal dependency remains in generated App");
}

fs.writeFileSync(path, app, "utf8");
console.log("[bamboocut-attunement-runtime] PASS — Attunement uses a local numeric parse and cannot crash observed-load on undefined parseVal.");
