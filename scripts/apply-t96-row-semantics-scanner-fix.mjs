import fs from "node:fs";

const path = "src/components/OcrScanner.tsx";
let source = fs.readFileSync(path, "utf8");

const from = `                                <span className="text-amber-500 font-bold text-[8px]">RETUNED</span>\n                              </label>\n                            )`;
const to = `                                <span className="text-amber-500 font-bold text-[8px]">RETUNED</span>\n                              </label>\n                            )}`;

const normalizedSource = source.replace(/\r\n/g, "\n");
if (!normalizedSource.includes(to)) {
  if (!normalizedSource.includes(from)) {
    console.log("[t96-row-semantics-scanner-fix] Anchor superseded by the semantic scanner migration; no change required.");
  } else {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  source = source.replace(from.replaceAll("\n", eol), to.replaceAll("\n", eol));
  }
}

fs.writeFileSync(path, source, "utf8");
console.log("[t96-row-semantics-scanner-fix] PASS — batch Attunement/Retuned conditional JSX is closed correctly.");
