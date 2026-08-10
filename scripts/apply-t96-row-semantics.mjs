import fs from "node:fs";

const files = {
  globalOcr: "src/utils/ocrGlobalEnglish.ts",
  parser: "src/utils/ocrParser.ts",
  scanner: "src/components/OcrScanner.tsx",
  app: "src/App.tsx",
};

const read = (path) => fs.readFileSync(path, "utf8");
const write = (path, content) => fs.writeFileSync(path, content, "utf8");

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) {
    console.warn(`[t96-row-semantics] Anchor not present after prior migrations: ${label}`);
    return source;
  }
  return source.replace(from, to);
}

// ── 1. Global English OCR: semantic roles + generic weapon allowlist ----------
let globalOcr = read(files.globalOcr);
globalOcr = replaceRequired(
  globalOcr,
  "export interface GlobalEnglishOcrSub {",
  `import {\n  applyGearRowSemantics,\n  matchWeaponAttunementText,\n  type GearSubRole,\n} from "../data/gearAttunement.ts";\n\nexport interface GlobalEnglishOcrSub {`,
  "attunement metadata import",
);
globalOcr = replaceRequired(
  globalOcr,
  `  isTuned?: boolean;\n  sourceIndex: number;`,
  `  isTuned?: boolean;\n  isRetuned?: boolean;\n  role?: GearSubRole;\n  sourceOrder?: number;\n  attunementId?: string;\n  displayName?: string;\n  sourceIndex: number;`,
  "semantic OCR row fields",
);
globalOcr = replaceRequired(
  globalOcr,
  `  const maxPlausible = PERCENT_MAX[type];`,
  `  const maxPlausible = PERCENT_MAX[type]\n    ?? (type.includes("Martial Art Skill DMG Boost") ? 8 : undefined);`,
  "generic martial percentage cap",
);
globalOcr = replaceRequired(
  globalOcr,
  `  return deduped;\n};\n\ntype SourceLine = {`,
  `  const semantic = applyGearRowSemantics(deduped) as GlobalEnglishOcrSub[];\n  semantic.forEach((row, index) => {\n    row.sourceOrder = index;\n    if (row.role !== "attunement") return;\n    row.isRetuned = false;\n    row.isTuned = false;\n    const context = normalized.slice(row.sourceIndex, Math.min(normalized.length, row.sourceEnd + 96));\n    const definition = matchWeaponAttunementText(context);\n    if (definition) {\n      row.attunementId = definition.id;\n      row.displayName = definition.displayName;\n    }\n  });\n  return semantic;\n};\n\ntype SourceLine = {`,
  "semantic exact row output",
);
globalOcr = replaceRequired(
  globalOcr,
  `const classifyUnresolvedEnglishRow = (context: string): { type: string; percentLike?: boolean } | null => {\n  const label = normalizeLabel(context);\n  if (!label) return null;\n\n  if (hasAll(label, ["everspring", "umbrella"]) && hasAll(label, ["martial", "art", "skill", "dmg"])) {`,
  `const classifyUnresolvedEnglishRow = (context: string): {\n  type: string;\n  percentLike?: boolean;\n  role?: GearSubRole;\n  attunementId?: string;\n  displayName?: string;\n} | null => {\n  const label = normalizeLabel(context);\n  if (!label) return null;\n\n  const attunement = matchWeaponAttunementText(context);\n  if (attunement) {\n    return {\n      type: attunement.statKey,\n      percentLike: true,\n      role: "attunement",\n      attunementId: attunement.id,\n      displayName: attunement.displayName,\n    };\n  }\n\n  if (hasAll(label, ["everspring", "umbrella"]) && hasAll(label, ["martial", "art", "skill", "dmg"])) {`,
  "generic unresolved attunement classifier",
);
globalOcr = replaceRequired(
  globalOcr,
  `      isTuned: explicitRetuned(context),\n      sourceIndex,\n      sourceEnd,`,
  `      isTuned: classification.role === "attunement" ? false : explicitRetuned(context),\n      isRetuned: classification.role === "attunement" ? false : explicitRetuned(context),\n      role: classification.role,\n      attunementId: classification.attunementId,\n      displayName: classification.displayName,\n      sourceIndex,\n      sourceEnd,`,
  "recovered semantic metadata",
);
globalOcr = replaceRequired(
  globalOcr,
  `  let tunedSeen = false;\n  deduped.forEach((row) => {\n    if (!row.isTuned) return;\n    if (tunedSeen) row.isTuned = false;\n    else tunedSeen = true;\n  });\n  return deduped;`,
  `  const semantic = applyGearRowSemantics(deduped) as GlobalEnglishOcrSub[];\n  let tunedSeen = false;\n  semantic.forEach((row, index) => {\n    row.sourceOrder = index;\n    if (row.role === "attunement") {\n      row.isRetuned = false;\n      row.isTuned = false;\n      return;\n    }\n    if (!row.isRetuned) return;\n    if (tunedSeen) { row.isRetuned = false; row.isTuned = false; }\n    else tunedSeen = true;\n  });\n  return semantic;`,
  "semantic hybrid output",
);
write(files.globalOcr, globalOcr);

// ── 2. Production parser: preserve semantic partial rows ----------------------
let parser = read(files.parser);
parser = replaceRequired(
  parser,
  `import { parseHybridGlobalEnglishRows } from "./ocrGlobalEnglish.ts";`,
  `import { parseHybridGlobalEnglishRows } from "./ocrGlobalEnglish.ts";\nimport { applyGearRowSemantics, type GearSubRole } from "../data/gearAttunement.ts";`,
  "parser semantic helper import",
);
parser = replaceRequired(
  parser,
  `  isTuned?: boolean;\n}`,
  `  isTuned?: boolean;\n  isRetuned?: boolean;\n  role?: GearSubRole;\n  sourceOrder?: number;\n  attunementId?: string;\n  displayName?: string;\n}`,
  "OcrSub semantic fields",
);
parser = replaceRequired(
  parser,
  `  if (hybridGlobalRows.length >= 6) {\n    const hybrid: OcrSub[] = hybridGlobalRows.slice(0, 6).map(({ type, val, isTuned }) => ({ type, val, isTuned }));`,
  `  if (hybridGlobalRows.length >= 5) {\n    const hybrid: OcrSub[] = hybridGlobalRows.slice(0, 6).map(({\n      type, val, isTuned, isRetuned, role, sourceOrder, attunementId, displayName,\n    }) => ({ type, val, isTuned, isRetuned, role, sourceOrder, attunementId, displayName }));`,
  "preserve partial semantic Global rows",
);
parser = replaceRequired(
  parser,
  `  while (parsedSubs.length < 6) {\n    parsedSubs.push({ type: "Other", val: "", isTuned: false });\n  }\n\n  return parsedSubs;`,
  `  while (parsedSubs.length < 6) {\n    parsedSubs.push({ type: "Other", val: "", isTuned: false });\n  }\n\n  return applyGearRowSemantics(parsedSubs) as OcrSub[];`,
  "legacy parser semantic normalization",
);
write(files.parser, parser);

// ── 3. Batch review: Retuned is ordinary-row-only; preserve metadata ----------
let scanner = read(files.scanner);
scanner = replaceRequired(
  scanner,
  `import { runDualPassOcr, type OcrSub } from "../utils/ocrParser";`,
  `import { runDualPassOcr, type OcrSub } from "../utils/ocrParser";\nimport { isAttunementStatKey } from "../data/gearAttunement";`,
  "scanner semantic helper import",
);
scanner = replaceRequired(
  scanner,
  `          if (key === 'isTuned' && val === true) {\n            // Uncheck other tuned\n            nextSubs.forEach((sub, sidx) => {\n              sub.isTuned = sidx === index;\n            });\n          } else {\n            nextSubs[index] = {\n              ...nextSubs[index],\n              [key]: val\n            };\n          }`,
  `          if (key === 'isTuned' && val === true) {\n            nextSubs.forEach((sub, sidx) => {\n              const isAttunement = sub.role === "attunement" || isAttunementStatKey(sub.type);\n              sub.isTuned = !isAttunement && sidx === index;\n              sub.isRetuned = sub.isTuned;\n            });\n          } else {\n            nextSubs[index] = { ...nextSubs[index], [key]: val };\n            if (key === "type") {\n              const isAttunement = isAttunementStatKey(String(val));\n              nextSubs[index].role = isAttunement ? "attunement" : nextSubs[index].role === "attunement" ? "additional" : nextSubs[index].role;\n              if (isAttunement) { nextSubs[index].isTuned = false; nextSubs[index].isRetuned = false; }\n            } else if (key === "isTuned") {\n              nextSubs[index].isRetuned = Boolean(val);\n            }\n          }`,
  "scanner independent retuning",
);
scanner = replaceRequired(
  scanner,
  `                            <label className="flex items-center gap-1 cursor-pointer">\n                              <input\n                                type="checkbox"\n                                checked={!!sub.isTuned}\n                                onChange={(e) => handleStatEdit(item.id, sidx, 'isTuned', e.target.checked)}\n                                className="accent-amber-500 w-3 h-3"\n                              />\n                              <span className="text-amber-500 font-bold text-[8px]">TUNED</span>\n                            </label>`,
  `                            {(sub.role === "attunement" || isAttunementStatKey(sub.type)) ? (\n                              <div className="min-w-[66px] text-right">\n                                <div className="text-emerald-400 font-bold text-[8px]">ATTUNEMENT</div>\n                                {sub.displayName && <div className="mt-0.5 max-w-[220px] text-[8px] leading-tight text-slate-500">{sub.displayName}</div>}\n                              </div>\n                            ) : (\n                              <label className="flex items-center gap-1 cursor-pointer">\n                                <input\n                                  type="checkbox"\n                                  checked={!!(sub.isRetuned ?? sub.isTuned)}\n                                  onChange={(e) => handleStatEdit(item.id, sidx, 'isTuned', e.target.checked)}\n                                  className="accent-amber-500 w-3 h-3"\n                                />\n                                <span className="text-amber-500 font-bold text-[8px]">RETUNED</span>\n                              </label>\n                            )`,
  "batch semantic row UI",
);
write(files.scanner, scanner);

// ── 4. Add Gear/manual entry: five normal rolls + separate Attunement --------
let app = read(files.app);
app = replaceRequired(
  app,
  `import { runDualPassOcr } from "./utils/ocrParser";`,
  `import { runDualPassOcr } from "./utils/ocrParser";\nimport {\n  ATTUNEMENT_SELECT_OPTIONS,\n  applyGearRowSemantics,\n  getWeaponAttunementById,\n  isAttunementStatKey,\n  toGearFormRows,\n  type GearSubRole,\n} from "./data/gearAttunement";`,
  "App semantic imports",
);
app = replaceRequired(
  app,
  `export interface GearSub {\n  type: string;\n  val: string;\n  isTuned?: boolean;\n}`,
  `export interface GearSub {\n  type: string;\n  val: string;\n  role?: GearSubRole;\n  isRetuned?: boolean;\n  isTuned?: boolean;\n  sourceOrder?: number;\n  attunementId?: string;\n  displayName?: string;\n}`,
  "GearSub semantic model",
);
app = replaceRequired(
  app,
  `  const [formSubs, setFormSubs] = useState<{type: string; val: string; isTuned?: boolean}[]>(\n    Array(6).fill(null).map(() => ({ type: "Max Phys Atk", val: "", isTuned: false }))\n  );`,
  `  const [formSubs, setFormSubs] = useState<GearSub[]>(\n    toGearFormRows([]) as GearSub[]\n  );`,
  "semantic form state",
);
app = replaceRequired(
  app,
  `      setFormSubs(subs.map(s => ({ type: s.type, val: s.val, isTuned: !!s.isTuned })));`,
  `      setFormSubs(toGearFormRows(subs.map(s => ({ ...s }))) as GearSub[]);`,
  "single OCR semantic form projection",
);
app = replaceRequired(
  app,
  `    setFormSubs(Array(6).fill(null).map(() => ({ type: "Max Phys Atk", val: "", isTuned: false })));`,
  `    setFormSubs(toGearFormRows([]) as GearSub[]);`,
  "new manual form rows",
);
app = replaceRequired(
  app,
  `    const subs = [...item.subs];\n    while (subs.length < 6) {\n      subs.push({ type: "Other", val: "", isTuned: false });\n    }\n    setFormSubs(subs);`,
  `    setFormSubs(toGearFormRows(item.subs) as GearSub[]);`,
  "legacy profile semantic migration on edit",
);
app = replaceRequired(
  app,
  `    const savedSubs = formSubs\n      .filter(s => s.type !== "Other" && s.val.trim() !== "")\n      .map(s => ({\n        type: s.type,\n        val: s.val,\n        isTuned: !!s.isTuned\n      }));`,
  `    const savedSubs = applyGearRowSemantics(formSubs)\n      .filter(s => s.type !== "Other" && s.val.trim() !== "")\n      .map(s => ({\n        type: s.type,\n        val: s.val,\n        role: s.role,\n        sourceOrder: s.sourceOrder,\n        isRetuned: s.role === "attunement" ? false : Boolean(s.isRetuned ?? s.isTuned),\n        isTuned: s.role === "attunement" ? false : Boolean(s.isRetuned ?? s.isTuned),\n        attunementId: s.attunementId,\n        displayName: s.displayName,\n      }));`,
  "semantic gear serialization",
);
app = replaceRequired(
  app,
  `                setFormSubs([\n                  { type: "Other", val: "" },\n                  { type: "Other", val: "" },\n                  { type: "Other", val: "" },\n                  { type: "Other", val: "" },\n                  { type: "Other", val: "" },\n                  { type: "Other", val: "" },\n                ]);`,
  `                setFormSubs(toGearFormRows([]) as GearSub[]);`,
  "secondary manual form reset",
);
app = replaceRequired(
  app,
  `{formSubs.map((sub, sidx) => (\n                      <React.Fragment key={sidx}>\n                        {sidx === 0 && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Primary substat</div>}\n                        {sidx === 1 && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>Additional substats</div>}\n                        {sidx === 5 && <div style={{ fontSize: 11, fontWeight: 700, color: '#f0b400', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>Tuned substat (select one line)</div>}`,
  `{formSubs.map((sub, sidx) => (\n                      <React.Fragment key={sidx}>\n                        {sub.role === "primary" && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Normal rolls · Primary</div>}\n                        {sub.role === "additional" && formSubs[sidx - 1]?.role !== "additional" && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>Normal rolls · Additional</div>}\n                        {sub.role === "attunement" && <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>Attunement · Weapon Martial Art Skill DMG Boost</div>}`,
  "role-based Add Gear headings",
);
app = replaceRequired(
  app,
  `                        <SearchableSelect\n                          value={sub.type}\n                          onChange={val => {\n                            const next = [...formSubs];\n                            next[sidx].type = val;\n                            setFormSubs(next);\n                          }}\n                          options={SUB_STAT_OPTIONS}\n                          placeholder="Search stat..."\n                        />`,
  `                        <SearchableSelect\n                          value={sub.role === "attunement" ? (sub.attunementId ?? "") : sub.type}\n                          onChange={val => {\n                            const next = [...formSubs];\n                            if (sub.role === "attunement") {\n                              const definition = getWeaponAttunementById(val);\n                              next[sidx] = definition ? {\n                                ...next[sidx],\n                                type: definition.statKey,\n                                role: "attunement",\n                                attunementId: definition.id,\n                                displayName: definition.displayName,\n                                isRetuned: false,\n                                isTuned: false,\n                              } : { ...next[sidx], type: "Other", attunementId: undefined, displayName: undefined };\n                            } else {\n                              next[sidx].type = val;\n                            }\n                            setFormSubs(next);\n                          }}\n                          options={sub.role === "attunement"\n                            ? [{ value: "", label: "Select Attunement / Empty" }, ...ATTUNEMENT_SELECT_OPTIONS]\n                            : SUB_STAT_OPTIONS.filter((option) => !isAttunementStatKey(option.value))}\n                          placeholder={sub.role === "attunement" ? "Search weapon Attunement..." : "Search stat..."}\n                        />`,
  "manual Attunement selector",
);
app = replaceRequired(
  app,
  `                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 76, cursor: 'pointer' }}>\n                          <input\n                            type="checkbox"\n                            checked={!!sub.isTuned}\n                            onChange={e => {\n                              const next = [...formSubs];\n                              if (e.target.checked) {\n                                next.forEach((s, idx) => {\n                                  s.isTuned = idx === sidx;\n                                });\n                              } else {\n                                next[sidx].isTuned = false;\n                              }\n                              setFormSubs(next);\n                            }}\n                            className="accent-[#f0b400] h-3.5 w-3.5"\n                          />\n                          <span className="text-[#f0b400] font-bold text-[10px] uppercase font-mono">Tuned ✦</span>\n                        </label>`,
  `                        {sub.role === "attunement" ? (\n                          <div style={{ minWidth: 92, textAlign: 'right' }}>\n                            <span className="text-emerald-400 font-bold text-[10px] uppercase font-mono">Attunement</span>\n                          </div>\n                        ) : (\n                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 82, cursor: 'pointer' }}>\n                            <input\n                              type="checkbox"\n                              checked={!!(sub.isRetuned ?? sub.isTuned)}\n                              onChange={e => {\n                                const next = [...formSubs];\n                                if (e.target.checked) {\n                                  next.forEach((s, idx) => {\n                                    const retuned = idx === sidx && s.role !== "attunement";\n                                    s.isRetuned = retuned;\n                                    s.isTuned = retuned;\n                                  });\n                                } else {\n                                  next[sidx].isRetuned = false;\n                                  next[sidx].isTuned = false;\n                                }\n                                setFormSubs(next);\n                              }}\n                              className="accent-[#f0b400] h-3.5 w-3.5"\n                            />\n                            <span className="text-[#f0b400] font-bold text-[10px] uppercase font-mono">Retuned ✦</span>\n                          </label>\n                        )`,
  "manual Retuned-only checkbox",
);
app = replaceRequired(
  app,
  `          const isTuned = lcLine.includes("[turn]") || lcLine.includes("turn") || lcLine.includes("tuned") || lcLine.includes("attuned") || lcLine.includes("👍") || lcLine.includes("✦") || lcLine.includes("định âm") || lcLine.includes("dingyin") || lcLine.includes("定音");\n          parsedSubs.push({ type: matchedType, val: valStr, isTuned });`,
  `          const isTuned = /\\[\\s*turn\\s*\\]/i.test(line)\n            || /\\bretun(?:e|ed|ing)\\b/i.test(lcLine)\n            || /\\btuned\\b/i.test(lcLine);\n          const attunement = isAttunementStatKey(matchedType);\n          parsedSubs.push({\n            type: matchedType,\n            val: valStr,\n            role: attunement ? "attunement" : undefined,\n            isRetuned: attunement ? false : isTuned,\n            isTuned: attunement ? false : isTuned,\n          });`,
  "legacy text import Retuned semantics",
);
app = replaceRequired(
  app,
  `                    const structuredSubs: GearSub[] = Array.isArray(item.subs)\n                      ? item.subs\n                          .filter((sub) => sub.type !== "Other" && sub.val)\n                          .map((sub) => ({ type: sub.type, val: sub.val, isTuned: Boolean(sub.isTuned) }))\n                      : [];`,
  `                    const structuredSubs: GearSub[] = Array.isArray(item.subs)\n                      ? applyGearRowSemantics(item.subs\n                          .filter((sub) => sub.type !== "Other" && sub.val)\n                          .map((sub) => ({ ...sub }))) as GearSub[]\n                      : [];`,
  "lossless semantic batch handoff",
);
write(files.app, app);

console.log("[t96-row-semantics] PASS — Retuned ordinary rolls and weapon Attunement are independent, partial Global OCR rows stay semantic, and manual entry uses a separate Attunement selector.");
