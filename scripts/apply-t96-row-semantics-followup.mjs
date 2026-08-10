import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

const replaceRequired = (from, to, label) => {
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`[t96-row-semantics-followup] Missing anchor: ${label}`);
  source = source.replace(from, to);
};

replaceRequired(
  "  getDefaultWeaponAttunementForStatKey,\n",
  "",
  "remove guessed default weapon import",
);
replaceRequired(
  '                            ? (sub.attunementId ?? getDefaultWeaponAttunementForStatKey(sub.type)?.id ?? "")',
  '                            ? (sub.attunementId ?? "")',
  "legacy family key must not guess weapon identity",
);

fs.writeFileSync(path, source, "utf8");
console.log("[t96-row-semantics-followup] PASS — legacy family-level Attunement keys remain unassigned to a specific weapon until OCR/manual input provides one.");
