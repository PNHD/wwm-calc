import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");
const normalizeEol = (value) => value.replace(/\r\n/g, "\n");

const replaceRegexOnce = (regex, replacement, label) => {
  const normalized = normalizeEol(source);
  if (label === "manual Attunement selector" && normalized.includes('value={sub.role === "attunement" ? (sub.attunementId ?? "") : sub.type}')) return;
  if (typeof replacement === "string" && normalized.includes(replacement)) return;
  const matches = normalized.match(regex);
  if (!matches) throw new Error(`[t96-row-semantics-ui] Missing structural match: ${label}`);
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  source = normalized.replace(regex, replacement).replace(/\n/g, eol);
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

source = source.replaceAll("Attunement · Weapon Martial Art Skill DMG Boost", "Normal Attunement");
source = source.replaceAll("Search weapon Attunement...", "Search Attunement...");
source = source.replace('...ATTUNEMENT_SELECT_OPTIONS]', `...ATTUNEMENT_SELECT_OPTIONS,
                                ...(sub.attunementId && !ATTUNEMENT_SELECT_OPTIONS.some((option) => option.value === sub.attunementId)
                                  ? [{ value: sub.attunementId, label: sub.displayName || sub.type, group: "Saved legacy — confirm client" }] : [])]`);
source = source.replace('subStatOptionsForSlot(selectedSlot).filter((option) => !isAttunementStatKey(option.value))', 'subStatOptionsForSlot(selectedSlot)');
source = source.replace('SUB_STAT_OPTIONS.filter((option) => !isAttunementStatKey(option.value))', 'subStatOptionsForSlot(selectedSlot)');

// Keep model coverage next to the section heading, outside the input row.
source = source.replace(/\n\s*\{sub\.role === "attunement" && sub\.attunementId && <small style=\{\{ flex: 1 \}\}>[\s\S]*?<\/small>\}/, "");
if (!source.includes('Attunement effect:')) {
  source = source.replace('>Normal Attunement</div>}', '>Normal Attunement</div>}\n                        {sub.role === "attunement" && sub.attunementId && <small>Attunement effect: {getAttunementContribution(sub, selectedBuild) || (selectedBuild === "silkbind-jade" && resolveJadeAttunementFamily(sub.attunementId)) ? "included for this Path" : "stored; no modeled effect for this Path"}. Confirm the client tooltip; reference entries are not verified current rolls.</small>}');
}
fs.writeFileSync(path, source, "utf8");
console.log("[t96-row-semantics-ui] PASS — Add Gear uses repository-backed Attunement choices and exposes Retuned only on ordinary rolls.");
