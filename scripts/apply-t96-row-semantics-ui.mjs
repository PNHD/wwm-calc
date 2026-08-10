import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

const replaceOnce = (from, to, label) => {
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`[t96-row-semantics-ui] Missing anchor: ${label}`);
  source = source.replace(from, to);
};

// Prior migrations can leave one or more modal resets in their original shape.
source = source.replace(
  /setFormSubs\(Array\(6\)\.fill\(null\)\.map\(\(\) => \(\{ type: "Max Phys Atk", val: "", isTuned: false \}\)\)\);/g,
  "setFormSubs(toGearFormRows([]) as GearSub[]);",
);

replaceOnce(
  `                        <SearchableSelect\n                          value={sub.type}\n                          onChange={val => {\n                            const next = [...formSubs];\n                            next[sidx].type = val;\n                            setFormSubs(next);\n                          }}\n                          options={SUB_STAT_OPTIONS}\n                          placeholder="Search stat..."\n                        />`,
  `                        <SearchableSelect\n                          value={sub.role === "attunement" ? (sub.attunementId ?? "") : sub.type}\n                          onChange={val => {\n                            const next = [...formSubs];\n                            if (sub.role === "attunement") {\n                              const definition = getWeaponAttunementById(val);\n                              next[sidx] = definition ? {\n                                ...next[sidx],\n                                type: definition.statKey,\n                                role: "attunement",\n                                attunementId: definition.id,\n                                displayName: definition.displayName,\n                                isRetuned: false,\n                                isTuned: false,\n                              } : {\n                                ...next[sidx],\n                                type: "Other",\n                                role: "attunement",\n                                attunementId: undefined,\n                                displayName: undefined,\n                                isRetuned: false,\n                                isTuned: false,\n                              };\n                            } else {\n                              next[sidx].type = val;\n                            }\n                            setFormSubs(next);\n                          }}\n                          options={sub.role === "attunement"\n                            ? [{ value: "", label: "Select Attunement / Empty" }, ...ATTUNEMENT_SELECT_OPTIONS]\n                            : SUB_STAT_OPTIONS.filter((option) => !isAttunementStatKey(option.value))}\n                          placeholder={sub.role === "attunement" ? "Search weapon Attunement..." : "Search stat..."}\n                        />`,
  "manual Attunement selector",
);

replaceOnce(
  `                        <label\n                          className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap"\n                          style={{ minWidth: '65px' }}\n                          title="Attuned / Tuned (Dingyin) — boosts this substat's effect by 15% (x1.15)"\n                        >`,
  `                        <label\n                          className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap"\n                          style={{ minWidth: '72px', display: sub.role === "attunement" ? 'none' : 'flex' }}\n                          title="Retuned ([Turn]) — marks the ordinary roll that was explicitly Retuned"\n                        >`,
  "hide Retuned checkbox on Attunement",
);

replaceOnce(
  `                            checked={!!sub.isTuned}\n                            onChange={e => {\n                              const next = [...formSubs];\n                              if (e.target.checked) {\n                                next.forEach((s, idx) => {\n                                  s.isTuned = idx === sidx;\n                                });\n                              } else {\n                                next[sidx].isTuned = false;\n                              }\n                              setFormSubs(next);\n                            }}`,
  `                            checked={!!(sub.isRetuned ?? sub.isTuned)}\n                            onChange={e => {\n                              const next = [...formSubs];\n                              if (e.target.checked) {\n                                next.forEach((s, idx) => {\n                                  const retuned = idx === sidx && s.role !== "attunement";\n                                  s.isRetuned = retuned;\n                                  s.isTuned = retuned;\n                                });\n                              } else {\n                                next[sidx].isRetuned = false;\n                                next[sidx].isTuned = false;\n                              }\n                              setFormSubs(next);\n                            }}`,
  "ordinary Retuned checkbox behavior",
);

replaceOnce(
  `>Tuned ✦</span>`,
  `>Retuned ✦</span>`,
  "Retuned terminology",
);

fs.writeFileSync(path, source, "utf8");
console.log("[t96-row-semantics-ui] PASS — Add Gear uses repository-backed Attunement choices and exposes Retuned only on ordinary rolls.");
