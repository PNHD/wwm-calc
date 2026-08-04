import fs from "node:fs";

const files = {
  ocr: "src/components/OcrScanner.tsx",
  select: "src/components/SearchableSelect.tsx",
  parser: "src/utils/ocrParser.ts",
  app: "src/App.tsx",
  scorer: "src/utils/globalT96Gear.ts",
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[global-t96-ocr] Missing patch anchor: ${label}`);
  return source.replace(from, to);
}

// ── Batch OCR UI -------------------------------------------------------------
let ocr = read(files.ocr);
ocr = replaceRequired(
  ocr,
  'const OCR_STAT_OPTIONS: { value: string; label: string; group?: string }[] = [\n  { value: "Other", label: "Select Stat / Empty" },',
  `const OCR_SLOT_OPTIONS = [
  { value: "Auto", label: "Auto-detect slot" },
  { value: "Umbrella", label: "Weapon 1" },
  { value: "Rope Dart", label: "Weapon 2" },
  { value: "Disc", label: "Disc / Relic 1" },
  { value: "Pendant", label: "Pendant / Relic 2" },
  { value: "Helmet", label: "Helmet" },
  { value: "Chest", label: "Chest" },
  { value: "Greaves", label: "Greaves" },
  { value: "Bracers", label: "Bracers" },
] as const;

const inferOcrSlot = (text: string): string => {
  const value = text.toLowerCase();
  if (value.includes("pendant") || value.includes("necklace") || value.includes("项链")) return "Pendant";
  if (value.includes("disc") || value.includes("charm") || value.includes("唱片")) return "Disc";
  if (value.includes("helmet") || value.includes("helm") || value.includes("headgear") || value.includes("头盔")) return "Helmet";
  if (value.includes("bracers") || value.includes("bracer") || value.includes("护腕")) return "Bracers";
  if (value.includes("greaves") || value.includes("leg armor") || value.includes("boots") || value.includes("腿甲")) return "Greaves";
  if (value.includes("chest") || value.includes("armor") || value.includes("胸甲")) return "Chest";
  if (value.includes("rope dart") || value.includes("rope_dart") || value.includes("绳镖")) return "Rope Dart";
  if (value.includes("umbrella") || value.includes("伞")) return "Umbrella";
  return "Auto";
};

const isWeaponOcrSlot = (slot: string): boolean => slot === "Umbrella" || slot === "Rope Dart";

const OCR_STAT_OPTIONS: { value: string; label: string; group?: string }[] = [
  { value: "Other", label: "Select Stat / Empty" },
  { value: "Max Void Atk", label: "Max Void Attack", group: "T96 Weapon · Void" },
  { value: "Min Void Atk", label: "Min Void Attack", group: "T96 Weapon · Void" },`,
  "T96 OCR slot and Void stat catalog",
);
ocr = ocr.replaceAll('group: "Inner"', 'group: "Relic / Armor · Path"');
ocr = replaceRequired(
  ocr,
  '  rawText: string;\n}',
  '  rawText: string;\n  slot: string;\n}',
  "OCR queue slot",
);
ocr = replaceRequired(
  ocr,
  '      rawText: ""\n    }));',
  '      rawText: "",\n      slot: "Auto"\n    }));',
  "OCR queue default slot",
);
ocr = replaceRequired(
  ocr,
  '  const handleToggleSelect = (id: string) => {\n    setQueue((prev) =>\n      prev.map((it) => (it.id === id ? { ...it, isSelected: !it.isSelected } : it))\n    );\n  };',
  `  const handleToggleSelect = (id: string) => {
    setQueue((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isSelected: !it.isSelected } : it))
    );
  };

  const handleSlotEdit = (id: string, slot: string) => {
    setQueue((prev) => prev.map((it) => (it.id === id ? { ...it, slot } : it)));
  };`,
  "OCR slot editor",
);
ocr = replaceRequired(
  ocr,
  '                  rawText: reconstructedText\n                }',
  '                  rawText: reconstructedText,\n                  slot: item.slot === "Auto" ? inferOcrSlot(reconstructedText) : item.slot\n                }',
  "OCR inferred slot",
);
ocr = replaceRequired(
  ocr,
  '                  {hasSubs && (\n                    <div className="bg-[#0b0a09]/50 p-2.5 rounded border border-slate-950 text-[10px] space-y-2">',
  `                  {hasSubs && (
                    <div className="bg-[#0b0a09]/50 p-3 rounded border border-slate-950 text-[10px] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-[145px_minmax(0,1fr)] gap-2 items-center rounded-md border border-slate-800 bg-slate-950/60 p-2.5">
                        <label className="text-[10px] uppercase tracking-wide text-slate-500 font-bold font-mono">Gear slot / stat pool</label>
                        <select
                          value={item.slot}
                          onChange={(event) => handleSlotEdit(item.id, event.target.value)}
                          className="min-w-0 rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-[12px] font-semibold text-slate-100 outline-none focus:border-amber-500"
                        >
                          {OCR_SLOT_OPTIONS.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
                        </select>
                        <div className="sm:col-start-2 text-[10px] leading-relaxed text-slate-500">
                          {isWeaponOcrSlot(item.slot)
                            ? "Global T96 weapon attribute lines use Void Attack. Legacy/path labels remain available for older screenshots."
                            : item.slot === "Auto"
                              ? "Auto shows every stat. Choose a slot if OCR cannot distinguish weapon Void stats from Path stats."
                              : "Relic and armor pieces keep Bamboocut, Silkbind, Bellstrike, or Stonesplit labels by Path."}
                        </div>
                      </div>`,
  "OCR slot selector UI",
);
ocr = replaceRequired(
  ocr,
  '<div key={sidx} className="flex gap-2 items-center bg-slate-900/40 px-1.5 py-1 rounded border border-slate-900/20">\n                            <span className="text-slate-400 text-[9px] min-w-[12px]">#{sidx + 1}</span>',
  '<div key={sidx} className="grid grid-cols-[24px_minmax(190px,1fr)_82px_66px] gap-2 items-center bg-slate-900/40 px-2 py-2 rounded border border-slate-800/60">\n                            <span className="text-slate-400 text-[10px]">#{sidx + 1}</span>',
  "visible OCR stat row",
);
ocr = replaceRequired(
  ocr,
  '                              options={OCR_STAT_OPTIONS}\n                              placeholder="Search stat..."\n                            />',
  '                              options={item.slot !== "Auto" && !isWeaponOcrSlot(item.slot)\n                                ? OCR_STAT_OPTIONS.filter((option) => option.group !== "T96 Weapon · Void")\n                                : OCR_STAT_OPTIONS}\n                              placeholder="Search stat..."\n                              className="min-w-[190px]"\n                            />',
  "slot-aware OCR stat options",
);
ocr = replaceRequired(
  ocr,
  '                              className="w-16 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px] py-0.5"',
  '                              className="w-full min-w-[72px] bg-slate-950 text-slate-100 border border-slate-800 text-right px-2 rounded text-[11px] py-2"',
  "visible OCR value field",
);
ocr = replaceRequired(
  ocr,
  '                      let lines: string[] = [];\n                      if (it.mastery) {',
  '                      let lines: string[] = ["Equipped"];\n                      if (it.slot !== "Auto") lines.push(`Slot: ${it.slot}`);\n                      if (it.mastery) {',
  "preserve OCR slot on import",
);
write(files.ocr, ocr);

// ── Searchable select viewport/readability -----------------------------------
let select = read(files.select);
select = replaceRequired(
  select,
  '      setPos({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 280) });',
  `      const viewportPadding = 8;
      const desiredWidth = Math.max(r.width, 360);
      const width = Math.min(desiredWidth, Math.max(240, window.innerWidth - viewportPadding * 2));
      const left = Math.min(
        Math.max(viewportPadding, r.left),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
      );
      setPos({ top: r.bottom + 2, left, width });`,
  "select viewport position",
);
select = replaceRequired(
  select,
  '        placeholder={placeholder}\n        onChange={e => setSearch(e.target.value)}',
  '        placeholder={placeholder}\n        title={selectedLabel || placeholder}\n        onChange={e => setSearch(e.target.value)}',
  "select full-label title",
);
select = replaceRequired(
  select,
  "          fontSize: 11,\n          background: '#0f172a',",
  "          fontSize: 12,\n          fontWeight: 600,\n          textOverflow: 'ellipsis',\n          background: '#0f172a',",
  "select visible label",
);
write(files.select, select);

// ── OCR text parser ----------------------------------------------------------
let parser = read(files.parser);
parser = replaceRequired(
  parser,
  '  // ── Boss / Group / Single Target ──',
  `  // ── Global T96 weapon attribute lines ──
  // Weapons use the universal Void Attack label. Relics/armor retain their
  // Bamboocut/Silkbind/Bellstrike/Stonesplit labels and are matched below.
  {
    type: "Max Void Atk",
    patterns: [["max", "void"], ["maximum", "void"], ["void", "max"], ["最大", "无相"]],
  },
  {
    type: "Min Void Atk",
    patterns: [["min", "void"], ["minimum", "void"], ["void", "min"], ["最小", "无相"]],
  },
  // ── Boss / Group / Single Target ──`,
  "Void Attack OCR patterns",
);
write(files.parser, parser);

// ── App stat mapping and legacy batch parser ---------------------------------
let app = read(files.app);
app = replaceRequired(
  app,
  '  "Precision": "prec",\n  "Max Bamboocut Atk": "maxPz",',
  '  "Precision": "prec",\n  "Max Void Atk": "maxPz",\n  "Min Void Atk": "minPz",\n  "Max Bamboocut Atk": "maxPz",',
  "Void stat panel mapping",
);
app = replaceRequired(
  app,
  '    if (k === "All Martial Arts") group = "Weapon";\n    if (!group) {',
  `    if (k === "All Martial Arts") group = "Weapon";
    if (["Max Void Atk", "Min Void Atk"].includes(k)) group = "T96 Weapon · Void";
    if (/^(Max|Min) (Bamboocut|Silkbind|Bellstrike|Stonesplit) Atk$/.test(k) || /^(Bamboocut|Silkbind|Bellstrike|Stonesplit) (Pen|DMG%)$/.test(k)) group = "Relic / Armor · Path";
    if (!group) {`,
  "manual stat option groups",
);
app = replaceRequired(
  app,
  '        let matchedType = "";\n        \n        if (\n          (lcLine.includes("破防")',
  `        let matchedType = "";
        const directCanonicalType = Object.keys(SUB_MAP).find((key) => lcLine.includes(key.toLowerCase()));

        if (directCanonicalType) {
          matchedType = directCanonicalType;
        }
        else if (
          (lcLine.includes("max") || lcLine.includes("maximum") || lcLine.includes("最大")) &&
          (lcLine.includes("void") || lcLine.includes("无相"))
        ) {
          matchedType = "Max Void Atk";
        }
        else if (
          (lcLine.includes("min") || lcLine.includes("minimum") || lcLine.includes("最小")) &&
          (lcLine.includes("void") || lcLine.includes("无相"))
        ) {
          matchedType = "Min Void Atk";
        }
        else if (
          (lcLine.includes("破防")`,
  "canonical batch OCR types and Void matching",
);
app = app.replaceAll('matchedType = "Physical Penetration";', 'matchedType = "Phys Pen";');
app = app.replaceAll('matchedType = "Max Physical Attack";', 'matchedType = "Max Phys Atk";');
app = app.replaceAll('matchedType = "Min Physical Attack";', 'matchedType = "Min Phys Atk";');
app = app.replaceAll('matchedType = "Crit Damage";', 'matchedType = "Crit DMG";');
app = app.replaceAll('matchedType = "Affinity Damage";', 'matchedType = "Affinity DMG";');
app = app.replaceAll('matchedType = "Bamboocut Penetration";', 'matchedType = "Bamboocut Pen";');
app = app.replaceAll('matchedType = "Bamboocut DMG";', 'matchedType = "Bamboocut DMG%";');
app = app.replaceAll('matchedType = "Precision Rate";', 'matchedType = "Precision";');
app = replaceRequired(
  app,
  '                  <div style={{ marginBottom: \'8px\' }}>\n                    <h3 style={{ margin: 0 }}>Sub Stats</h3>\n                  </div>',
  `                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ margin: 0 }}>Sub Stats</h3>
                    <p style={{ margin: '5px 0 0', fontSize: 11, color: '#8b949e', lineHeight: 1.45 }}>
                      {selectedSlot === "Umbrella" || selectedSlot === "Rope Dart"
                        ? "Global T96 weapons use Max/Min Void Attack for universal attribute rolls. Path-specific labels remain for legacy items."
                        : "Relic and armor attribute rolls remain labeled by Path: Bamboocut, Silkbind, Bellstrike, or Stonesplit."}
                    </p>
                  </div>`,
  "gear form Void/path hint",
);
write(files.app, app);

// ── Explainable T96 gear score -----------------------------------------------
let scorer = read(files.scorer);
scorer = replaceRequired(
  scorer,
  '  if (key.includes("formlesspen") || key.includes("attrpen") || key.includes("elementpen")) return "elementPen";\n  if (key.includes("critrate")',
  '  if (key.includes("formlesspen") || key.includes("attrpen") || key.includes("elementpen")) return "elementPen";\n  if (key.includes("maxvoidatk") || key.includes("maximumvoidattack")) return "maxElement";\n  if (key.includes("minvoidatk") || key.includes("minimumvoidattack")) return "minElement";\n  if (key.includes("critrate")',
  "Void Attack gear scoring",
);
write(files.scorer, scorer);

console.log("[global-t96-ocr] Slot-aware OCR, visible stat controls, and Void Attack support applied.");
