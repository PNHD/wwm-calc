import fs from "node:fs";

const app = fs.readFileSync("src/App.tsx", "utf8");
const expected = 'const value = Number.parseFloat(String(sub.val ?? "").replace("%", ""));';

if (!app.includes(expected)) {
  throw new Error("[bamboocut-attunement-runtime-audit] local Attunement numeric parse missing");
}
if (app.includes("const value = parseVal(sub.val);")) {
  throw new Error("[bamboocut-attunement-runtime-audit] undefined parseVal runtime dependency remains");
}
if (!app.includes('(sub as any).role === "attunement"') || !app.includes("next.attunedBonus = Number(gearSum.attunedBonus)")) {
  throw new Error("[bamboocut-attunement-runtime-audit] Attunement semantic boundary regressed");
}

console.log("[bamboocut-attunement-runtime-audit] PASS — observed load cannot call undefined parseVal from Attunement aggregation.");
