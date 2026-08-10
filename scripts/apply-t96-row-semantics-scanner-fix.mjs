import fs from "node:fs";

const path = "src/components/OcrScanner.tsx";
let source = fs.readFileSync(path, "utf8");

const from = `                                <span className="text-amber-500 font-bold text-[8px]">RETUNED</span>\n                              </label>\n                            )`;
const to = `                                <span className="text-amber-500 font-bold text-[8px]">RETUNED</span>\n                              </label>\n                            )}`;

if (!source.includes(to)) {
  if (!source.includes(from)) throw new Error("[t96-row-semantics-scanner-fix] Missing Retuned conditional close anchor");
  source = source.replace(from, to);
}

fs.writeFileSync(path, source, "utf8");
console.log("[t96-row-semantics-scanner-fix] PASS — batch Attunement/Retuned conditional JSX is closed correctly.");
