import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

const replaceRegexOnce = (regex, replacement, label) => {
  if (typeof replacement === "string" && source.includes(replacement)) return;
  const matches = source.match(regex);
  if (!matches) throw new Error(`[t96-row-semantics-ui] Missing structural match: ${label}`);
  source = source.replace(regex, replacement);
};

// `apply-global-v2-finalize` makes the initial row type slot-aware. The semantic
// form instead always starts with five unresolved normal rolls + one unresolved
// Attunement row; slot compatibility is still enforced by the ordinary selector.
source = source.replace(
  /\s*const defaultSubStat = slot === "Umbrella" \|\| slot === "Rope Dart" \? "Max Void Atk" : "Max Phys Atk";\s*setFormSubs\(Array\(6\)\.fill\(null\)\.map\(\(\) => \(\{ type: defaultSubStat, val: "", isTuned: false \}\)\)\);/g,
  "\n    setFormSubs(toGearFormRows([]) as GearSub[]);",
);
source = source.replace(
  /setFormSubs\(Array\(6\)\.fill\(null\)\.map\(\(\) => \(\{\s*type:\s*"Max Phys Atk",\s*val:\s*"",\s*isTuned:\s*false\s*\}\)\)\);/g,
  "setFormSubs(toGearFormRows([]) as GearSub[]);",
);

// Match the Add Gear selector after all earlier migrations, regardless of which
// ordinary slot-filter helper they installed.
replaceRegexOnce(
  /<SearchableSelect\s+value=\{sub\.type\}[\s\S]*?placeholder="Search stat\.\.\."[\s\S]*?\/>/,
  `<SearchableSelect
                          value={sub.role === "attunement" ? (sub.attunementId ?? "") : sub.type}
                          onChange={val => {
                            const next = [...formSubs];
                            if (sub.role === "attunement") {
                              const definition = getWeaponAttunementById(val);
                              next[sidx] = definition ? {
                                ...next[sidx],
                                type: definition.statKey,
                                role: "attunement",
                                attunementId: definition.id,
                                displayName: definition.displayName,
                                isRetuned: false,
                                isTuned: false,
                              } : {
                                ...next[sidx],
                                type: "Other",
                                role: "attunement",
                                attunementId: undefined,
                                displayName: undefined,
                                isRetuned: false,
                                isTuned: false,
                              };
                            } else {
                              next[sidx].type = val;
                            }
                            setFormSubs(next);
                          }}
                          options={sub.role === "attunement"
                            ? [{ value: "", label: "Select Attunement / Empty" }, ...ATTUNEMENT_SELECT_OPTIONS]
                            : subStatOptionsForSlot(selectedSlot).filter((option) => !isAttunementStatKey(option.value))}
                          placeholder={sub.role === "attunement" ? "Search weapon Attunement..." : "Search stat..."}
                        />`,
  "manual Attunement selector",
);

replaceRegexOnce(
  /style=\{\{\s*minWidth:\s*'65px'\s*\}\}\s*title="Attuned \/ Tuned \(Dingyin\) — boosts this substat's effect by 15% \(x1\.15\)"/,
  `style={{ minWidth: '72px', display: sub.role === "attunement" ? 'none' : 'flex' }}
                          title="Retuned ([Turn]) — marks the ordinary roll that was explicitly Retuned"`,
  "hide Retuned checkbox on Attunement",
);

replaceRegexOnce(
  /checked=\{!!sub\.isTuned\}\s*onChange=\{e => \{\s*const next = \[\.\.\.formSubs\];\s*if \(e\.target\.checked\) \{\s*next\.forEach\(\(s, idx\) => \{\s*s\.isTuned = idx === sidx;\s*\}\);\s*\} else \{\s*next\[sidx\]\.isTuned = false;\s*\}\s*setFormSubs\(next\);\s*\}\}/,
  `checked={!!(sub.isRetuned ?? sub.isTuned)}
                            onChange={e => {
                              const next = [...formSubs];
                              if (e.target.checked) {
                                next.forEach((s, idx) => {
                                  const retuned = idx === sidx && s.role !== "attunement";
                                  s.isRetuned = retuned;
                                  s.isTuned = retuned;
                                });
                              } else {
                                next[sidx].isRetuned = false;
                                next[sidx].isTuned = false;
                              }
                              setFormSubs(next);
                            }}`,
  "ordinary Retuned checkbox behavior",
);

replaceRegexOnce(
  />Tuned ✦<\/span>/,
  ">Retuned ✦</span>",
  "Retuned terminology",
);

fs.writeFileSync(path, source, "utf8");
console.log("[t96-row-semantics-ui] PASS — Add Gear uses repository-backed Attunement choices and exposes Retuned only on ordinary rolls.");
