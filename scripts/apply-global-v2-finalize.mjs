import fs from "node:fs";

const files = {
  ocr: "src/components/OcrScanner.tsx",
  select: "src/components/SearchableSelect.tsx",
  app: "src/App.tsx",
  scorer: "src/utils/globalT96Gear.ts",
  arsenal: "src/product/workspaces/ArsenalWorkspace.tsx",
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[global-v2-finalize] Missing patch anchor: ${label}`);
  return source.replace(from, to);
}

// ── Batch OCR validation ------------------------------------------------------
let ocr = read(files.ocr);
ocr = replaceRequired(
  ocr,
  'import SearchableSelect from "./SearchableSelect";',
  'import SearchableSelect from "./SearchableSelect";\nimport { filterGlobalT96StatOptions, validateGlobalT96GearLines } from "../data/globalT96GearCompatibility";',
  "OCR compatibility import",
);
ocr = replaceRequired(
  ocr,
  '            {queue.map((item) => {\n              const hasSubs = item.subs && item.subs.length > 0;',
  '            {queue.map((item) => {\n              const hasSubs = item.subs && item.subs.length > 0;\n              const validation = validateGlobalT96GearLines(item.slot, item.subs);',
  "OCR validation state",
);
ocr = replaceRequired(
  ocr,
  '                              options={item.slot !== "Auto" && !isWeaponOcrSlot(item.slot)\n                                ? OCR_STAT_OPTIONS.filter((option) => option.group !== "T96 Weapon · Void")\n                                : OCR_STAT_OPTIONS}',
  '                              options={filterGlobalT96StatOptions(OCR_STAT_OPTIONS, item.slot)}',
  "shared OCR stat filtering",
);
ocr = replaceRequired(
  ocr,
  '                      <div className="text-slate-500 uppercase font-bold font-mono pb-1 border-b border-slate-900">\n                        Detected stats (click to fix if wrong):\n                      </div>',
  `                      <div className="flex flex-wrap items-center gap-2">
                        <span className={\`rounded border px-2 py-1 text-[10px] font-bold font-mono \${validation.errors.length ? "border-rose-900 bg-rose-950/50 text-rose-300" : validation.origin === "relaid" ? "border-violet-900 bg-violet-950/40 text-violet-300" : "border-emerald-900 bg-emerald-950/40 text-emerald-300"}\`}>
                          {validation.label}
                        </span>
                        {validation.errors.length === 0 && <span className="text-[10px] text-slate-500">Ready for slot-aware import</span>}
                      </div>
                      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                        <div className="space-y-1 rounded border border-slate-800 bg-slate-950/70 p-2.5">
                          {validation.errors.map((message) => <div key={message} className="text-[10px] leading-relaxed text-rose-300">• {message}</div>)}
                          {validation.warnings.map((message) => <div key={message} className="text-[10px] leading-relaxed text-amber-300">• {message}</div>)}
                        </div>
                      )}
                      <div className="text-slate-500 uppercase font-bold font-mono pb-1 border-b border-slate-900">
                        Detected stats (click to fix if wrong):
                      </div>`,
  "OCR source and validation feedback",
);
ocr = replaceRequired(
  ocr,
  '                    const activeItems = queue.filter((it) => it.isSelected && it.status === "success");\n                    // Custom raw text reconstruct to make it compatible with parent parser',
  `                    const activeItems = queue.filter((it) => it.isSelected && it.status === "success");
                    const invalidItems = activeItems.filter((it) => validateGlobalT96GearLines(it.slot, it.subs).errors.length > 0);
                    if (invalidItems.length > 0) {
                      alert(\`Fix slot/stat errors on \${invalidItems.length} selected image(s) before importing.\`);
                      return;
                    }
                    // Custom raw text reconstruct to make it compatible with parent parser`,
  "block invalid OCR import",
);
ocr = replaceRequired(
  ocr,
  '                  disabled={queue.filter((it) => it.isSelected && it.status === "success").length === 0}',
  '                  disabled={queue.filter((it) => it.isSelected && it.status === "success" && validateGlobalT96GearLines(it.slot, it.subs).errors.length === 0).length === 0}',
  "disable invalid OCR import",
);
write(files.ocr, ocr);

// ── Searchable select: horizontal and vertical viewport safety ----------------
let select = read(files.select);
select = replaceRequired(
  select,
  '  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });',
  '  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });',
  "select position state",
);
select = replaceRequired(
  select,
  `      const viewportPadding = 8;
      const desiredWidth = Math.max(r.width, 360);
      const width = Math.min(desiredWidth, Math.max(240, window.innerWidth - viewportPadding * 2));
      const left = Math.min(
        Math.max(viewportPadding, r.left),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
      );
      setPos({ top: r.bottom + 2, left, width });`,
  `      const viewportPadding = 8;
      const desiredWidth = Math.max(r.width, 360);
      const width = Math.min(desiredWidth, Math.max(240, window.innerWidth - viewportPadding * 2));
      const left = Math.min(
        Math.max(viewportPadding, r.left),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
      );
      const spaceBelow = Math.max(0, window.innerHeight - r.bottom - viewportPadding);
      const spaceAbove = Math.max(0, r.top - viewportPadding);
      const openAbove = spaceBelow < 190 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(150, Math.min(320, openAbove ? spaceAbove : spaceBelow));
      const top = openAbove ? Math.max(viewportPadding, r.top - maxHeight - 2) : r.bottom + 2;
      setPos({ top, left, width, maxHeight });`,
  "select vertical viewport position",
);
select = replaceRequired(
  select,
  `    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);`,
  `    const reposition = () => updatePos();
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };`,
  "select scroll and resize handling",
);
select = replaceRequired(
  select,
  '        maxHeight: 320,',
  '        maxHeight: pos.maxHeight,',
  "select dynamic max height",
);
write(files.select, select);

// ── App: slot-aware manual editing and safe import defaults -------------------
let app = read(files.app);
app = replaceRequired(
  app,
  'import SearchableSelect from "./components/SearchableSelect";',
  'import SearchableSelect from "./components/SearchableSelect";\nimport { classifyGlobalT96GearOrigin, filterGlobalT96StatOptions, globalT96GearOriginLabel, validateGlobalT96GearLines } from "./data/globalT96GearCompatibility";',
  "app compatibility import",
);
app = replaceRequired(
  app,
  'const SUB_STAT_OPTIONS = buildSubStatOptions();',
  `const SUB_STAT_OPTIONS = buildSubStatOptions();
const subStatOptionsForSlot = (slot: string) => filterGlobalT96StatOptions(SUB_STAT_OPTIONS, slot);`,
  "manual slot-aware options",
);
app = app.replaceAll('options={SUB_STAT_OPTIONS}', 'options={subStatOptionsForSlot(selectedSlot)}');
app = replaceRequired(
  app,
  '    let masteryVal = 832;',
  '    let masteryVal: number | undefined = undefined;',
  "remove fabricated OCR mastery",
);
app = replaceRequired(
  app,
  `    // Default set based on slot
    let defaultSet = "none";
    if (detectedSlot !== "Umbrella" && detectedSlot !== "Rope Dart" && detectedSlot !== "Pendant") {
      defaultSet = detectedSlot === "Bow/Ring" ? "pursuing" : "stars";
    }`,
  `    // Default set based on the actual slot family. Weapons and accessories
    // use weapon sets; armor must never silently import as a weapon set.
    const weaponSetSlots = new Set(["Umbrella", "Rope Dart", "Pendant", "Disc"]);
    let defaultSet = detectedSlot === "Bow/Ring"
      ? "pursuing"
      : weaponSetSlots.has(detectedSlot)
        ? "stars"
        : "stormrain";`,
  "safe imported set family",
);
app = replaceRequired(
  app,
  '    setFormSubs(Array(6).fill(null).map(() => ({ type: "Max Phys Atk", val: "", isTuned: false })));',
  '    const defaultSubStat = slot === "Umbrella" || slot === "Rope Dart" ? "Max Void Atk" : "Max Phys Atk";\n    setFormSubs(Array(6).fill(null).map(() => ({ type: defaultSubStat, val: "", isTuned: false })));',
  "native T96 weapon default stat",
);
app = replaceRequired(
  app,
  `    const masteryVal = formMastery.trim() !== "" ? parseInt(formMastery, 10) : undefined;
    const activeGear = getActiveGear();`,
  `    const compatibility = validateGlobalT96GearLines(selectedSlot, savedSubs);
    if (compatibility.errors.length > 0) {
      alert(compatibility.errors.join("\\n"));
      return;
    }
    const masteryVal = formMastery.trim() !== "" ? parseInt(formMastery, 10) : undefined;
    const activeGear = getActiveGear();`,
  "manual gear validation",
);
app = replaceRequired(
  app,
  `                    <p style={{ margin: '5px 0 0', fontSize: 11, color: '#8b949e', lineHeight: 1.45 }}>
                      {selectedSlot === "Umbrella" || selectedSlot === "Rope Dart"
                        ? "Global T96 weapons use Max/Min Void Attack for universal attribute rolls. Path-specific labels remain for legacy items."
                        : "Relic and armor attribute rolls remain labeled by Path: Bamboocut, Silkbind, Bellstrike, or Stonesplit."}
                    </p>`,
  `                    <p style={{ margin: '5px 0 0', fontSize: 11, color: '#8b949e', lineHeight: 1.45 }}>
                      {selectedSlot === "Umbrella" || selectedSlot === "Rope Dart"
                        ? "Native Global T96 weapons use Max/Min Void Attack. Relaid weapons legitimately retain their historical Bamboocut, Silkbind, Bellstrike, or Stonesplit lines, but use a lower Modulating cap."
                        : "Relic and armor attribute rolls remain labeled by Path: Bamboocut, Silkbind, Bellstrike, or Stonesplit. Void Attack is invalid outside weapon slots."}
                    </p>
                    {(() => {
                      const compatibility = validateGlobalT96GearLines(selectedSlot, formSubs);
                      return (
                        <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <strong style={{ color: compatibility.errors.length ? '#fb7185' : compatibility.origin === 'relaid' ? '#c4b5fd' : '#86efac', fontSize: 11 }}>
                            {compatibility.label}
                          </strong>
                          {compatibility.errors.map(message => <span key={message} style={{ color: '#fda4af', fontSize: 10.5 }}>• {message}</span>)}
                          {compatibility.warnings.map(message => <span key={message} style={{ color: '#fcd34d', fontSize: 10.5 }}>• {message}</span>)}
                        </div>
                      );
                    })()}`,
  "manual gear compatibility feedback",
);
app = app.replaceAll(
  'scoreGlobalT96Gear(item.subs, selectedBuild, contribution)',
  'scoreGlobalT96Gear(item.subs, selectedBuild, contribution, item.slot)',
);
app = app.replaceAll(
  'scoreGlobalT96Gear(item.subs, selectedBuild, getGearItemCompareStats(item).totalGradDelta)',
  'scoreGlobalT96Gear(item.subs, selectedBuild, getGearItemCompareStats(item).totalGradDelta, item.slot)',
);
app = replaceRequired(
  app,
  '        warnings: quality.warnings,',
  '        warnings: quality.warnings,\n        gearOrigin: quality.gearOrigin,\n        rollQualityAvailable: quality.rollQualityAvailable,',
  "arsenal origin fields",
);
write(files.app, app);

// ── Honest native-vs-Relaid scoring ------------------------------------------
let scorer = read(files.scorer);
scorer = replaceRequired(
  scorer,
  'import { GLOBAL_T96_ROLL_CAPS } from "../data/globalT96Rules";',
  'import { GLOBAL_T96_ROLL_CAPS } from "../data/globalT96Rules";\nimport { classifyGlobalT96GearOrigin, globalT96GearOriginLabel, type GlobalT96GearOrigin } from "../data/globalT96GearCompatibility";',
  "scorer compatibility import",
);
scorer = replaceRequired(
  scorer,
  '  warnings: string[];\n}',
  '  warnings: string[];\n  gearOrigin: GlobalT96GearOrigin;\n  rollQualityAvailable: boolean;\n}',
  "scorer compatibility fields",
);
scorer = replaceRequired(
  scorer,
  `export function scoreGlobalT96Gear(
  lines: GlobalT96GearLine[],
  buildKey: string,
  modeledContributionPct = 0,
): GlobalT96GearScore {
  const scored = lines.map<GlobalT96LineScore>((line) => {`,
  `export function scoreGlobalT96Gear(
  lines: GlobalT96GearLine[],
  buildKey: string,
  modeledContributionPct = 0,
  slot = "",
): GlobalT96GearScore {
  const gearOrigin = classifyGlobalT96GearOrigin(slot, lines);
  const scored = lines.map<GlobalT96LineScore>((line) => {`,
  "scorer slot and origin",
);
scorer = replaceRequired(
  scorer,
  '    const cap = stat ? CAP_BY_STAT[stat] ?? null : null;',
  '    const standardCap = stat ? CAP_BY_STAT[stat] ?? null : null;\n    const cap = gearOrigin === "relaid" ? null : standardCap;',
  "Relaid cap handling",
);
scorer = replaceRequired(
  scorer,
  `    const reason = !stat
      ? "No verified T96 cap for this line"
      : wrongElement
        ? "Off-element line for the selected path"
        : useful
          ? "Matches the selected build priority"
          : "Recognized T96 line with low build value";`,
  `    const reason = !stat
      ? "No verified T96 cap for this line"
      : gearOrigin === "relaid"
        ? "Recognized line; Relaid Modulating cap is not verified"
        : wrongElement
          ? "Off-element line for the selected path"
          : useful
            ? "Matches the selected build priority"
            : "Recognized T96 line with low build value";`,
  "Relaid score reason",
);
scorer = replaceRequired(
  scorer,
  `  const recognized = scored.filter((line) => line.cap !== null);
  const rollQuality = recognized.length
    ? recognized.reduce((sum, line) => sum + Math.min(100, line.rollPct ?? 0), 0) / recognized.length
    : 0;`,
  `  const recognizedLineCount = lines.filter((line) => canonicalStat(line.type) !== null).length;
  const capScored = scored.filter((line) => line.cap !== null);
  const rollQualityAvailable = gearOrigin !== "relaid" && capScored.length > 0;
  const rollQuality = rollQualityAvailable
    ? capScored.reduce((sum, line) => sum + Math.min(100, line.rollPct ?? 0), 0) / capScored.length
    : 0;`,
  "honest roll quality availability",
);
scorer = replaceRequired(
  scorer,
  `  const overall = rollQuality * 0.5 + buildFit * 0.35 + modeledContribution * 0.15;
  const unknownLines = scored.filter((line) => line.cap === null).length;`,
  `  const overall = gearOrigin === "relaid"
    ? buildFit * 0.7 + modeledContribution * 0.3
    : rollQuality * 0.5 + buildFit * 0.35 + modeledContribution * 0.15;
  const unknownLines = Math.max(0, scored.length - recognizedLineCount);`,
  "Relaid score weighting",
);
scorer = replaceRequired(
  scorer,
  '  if (unknownLines) warnings.push(`${unknownLines} line(s) are excluded because no verified Global T96 cap is available.`);',
  '  if (unknownLines) warnings.push(`${unknownLines} line(s) are excluded because no verified Global T96 cap is available.`);\n  if (gearOrigin === "relaid") warnings.push("Relaid Modulating caps are lower than standard T96 caps and are not yet verified; roll quality is intentionally shown as N/A.");\n  if (gearOrigin === "mixed") warnings.push("This weapon mixes native Void and historical Path stat pools; review the OCR result before trusting its score.");',
  "Relaid score warnings",
);
scorer = replaceRequired(
  scorer,
  `    recognizedLines: recognized.length,
    usefulLines: scored.filter((line) => line.useful).length,
    unknownLines,
    sourceLabel: "Global T96 verified · 100上",
    lines: scored,
    warnings,`,
  `    recognizedLines: recognizedLineCount,
    usefulLines: scored.filter((line) => line.useful).length,
    unknownLines,
    sourceLabel: gearOrigin === "relaid" ? "Relaid gear · cap pending" : \`Global T96 verified · 100上 · \${globalT96GearOriginLabel(gearOrigin)}\`,
    lines: scored,
    warnings,
    gearOrigin,
    rollQualityAvailable,`,
  "scorer result source",
);
write(files.scorer, scorer);

// ── Arsenal explanation -------------------------------------------------------
let arsenal = read(files.arsenal);
arsenal = replaceRequired(
  arsenal,
  '  warnings?: string[];\n}',
  '  warnings?: string[];\n  gearOrigin?: string;\n  rollQualityAvailable?: boolean;\n}',
  "arsenal origin fields",
);
arsenal = replaceRequired(
  arsenal,
  'Roll quality {(selectedItem.rollQuality ?? 0).toFixed(1)}% · Build fit {(selectedItem.buildFit ?? 0).toFixed(1)}% · Modeled contribution {(selectedItem.modeledContribution ?? 0).toFixed(1)}%',
  '{selectedItem.rollQualityAvailable === false ? "Roll quality N/A (Relaid cap needed)" : `Roll quality ${(selectedItem.rollQuality ?? 0).toFixed(1)}%`} · Build fit {(selectedItem.buildFit ?? 0).toFixed(1)}% · Modeled contribution {(selectedItem.modeledContribution ?? 0).toFixed(1)}%',
  "arsenal relaid score explanation",
);
arsenal = replaceRequired(
  arsenal,
  '{row.mastery !== undefined && <span>MM {row.mastery}</span>}',
  '{row.sourceLabel && <span title={row.sourceLabel}>{row.gearOrigin === "relaid" ? "Relaid" : row.gearOrigin === "native-t96" ? "Native T96" : "T96"}</span>}\n                {row.mastery !== undefined && <span>MM {row.mastery}</span>}',
  "arsenal source badge",
);
write(files.arsenal, arsenal);

console.log("[global-v2-finalize] Slot compatibility, Relaid handling, validation, and viewport-safe selectors applied.");
