import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { runDualPassOcr, type OcrSub } from "../utils/ocrParser";
import { isAttunementStatKey } from "../data/gearAttunement";
import SearchableSelect from "./SearchableSelect";
import { filterGlobalT96StatOptions, validateGlobalT96GearLines } from "../data/globalT96GearCompatibility";
import {
  FileUp,
  Loader2,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
  Image
} from "lucide-react";

const OCR_SLOT_OPTIONS = [
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
  // Weapon names also appear in Attunement lines on armor/relics. Never use
  // that line alone to infer a weapon slot; a false negative (Auto) is safer
  // than importing an armor piece into Weapon 1.
  const hasWeaponSkillLine = value.includes("martial art skill dmg")
    || value.includes("special skill dmg")
    || value.includes("charged skill dmg");
  if (!hasWeaponSkillLine && (value.includes("rope dart") || value.includes("rope_dart") || value.includes("绳镖"))) return "Rope Dart";
  if (!hasWeaponSkillLine && (value.includes("umbrella") || value.includes("伞"))) return "Umbrella";
  return "Auto";
};

const isWeaponOcrSlot = (slot: string): boolean => slot === "Umbrella" || slot === "Rope Dart";

const OCR_STAT_OPTIONS: { value: string; label: string; group?: string }[] = [
  { value: "Other", label: "Select Stat / Empty" },
  { value: "Max Void Atk", label: "Max Void Attack", group: "T96 Weapon · Void" },
  { value: "Min Void Atk", label: "Min Void Attack", group: "T96 Weapon · Void" },
  { value: "Max Void Atk", label: "Max Void Attack", group: "T96 Weapon · Void" },
  { value: "Min Void Atk", label: "Min Void Attack", group: "T96 Weapon · Void" },
  { value: "Max Phys Atk", label: "Max Phys Atk", group: "Physical" },
  { value: "Min Phys Atk", label: "Min Phys Atk", group: "Physical" },
  { value: "Phys Pen", label: "Phys Pen", group: "Physical" },
  { value: "Phys DMG%", label: "Phys DMG%", group: "Physical" },
  { value: "Max Silkbind Atk", label: "Max Silkbind Atk", group: "Relic / Armor · Path" },
  { value: "Min Silkbind Atk", label: "Min Silkbind Atk", group: "Relic / Armor · Path" },
  { value: "Silkbind Pen", label: "Silkbind Pen", group: "Relic / Armor · Path" },
  { value: "Silkbind DMG%", label: "Silkbind DMG%", group: "Relic / Armor · Path" },
  { value: "Max Bamboocut Atk", label: "Max Bamboocut Atk", group: "Relic / Armor · Path" },
  { value: "Min Bamboocut Atk", label: "Min Bamboocut Atk", group: "Relic / Armor · Path" },
  { value: "Bamboocut Pen", label: "Bamboocut Pen", group: "Relic / Armor · Path" },
  { value: "Bamboocut DMG%", label: "Bamboocut DMG%", group: "Relic / Armor · Path" },
  { value: "Max Bellstrike Atk", label: "Max Bellstrike Atk", group: "Relic / Armor · Path" },
  { value: "Min Bellstrike Atk", label: "Min Bellstrike Atk", group: "Relic / Armor · Path" },
  { value: "Bellstrike Pen", label: "Bellstrike Pen", group: "Relic / Armor · Path" },
  { value: "Bellstrike DMG%", label: "Bellstrike DMG%", group: "Relic / Armor · Path" },
  { value: "Max Stonesplit Atk", label: "Max Stonesplit Atk", group: "Relic / Armor · Path" },
  { value: "Min Stonesplit Atk", label: "Min Stonesplit Atk", group: "Relic / Armor · Path" },
  { value: "Stonesplit Pen", label: "Stonesplit Pen", group: "Relic / Armor · Path" },
  { value: "Stonesplit DMG%", label: "Stonesplit DMG%", group: "Relic / Armor · Path" },
  { value: "Crit Rate", label: "Crit Rate", group: "Rate" },
  { value: "Crit DMG", label: "Crit DMG", group: "Rate" },
  { value: "Affinity Rate", label: "Affinity Rate", group: "Rate" },
  { value: "Affinity DMG", label: "Affinity DMG", group: "Rate" },
  { value: "Precision", label: "Precision", group: "Rate" },
  { value: "Agility", label: "Agility", group: "Base" },
  { value: "Power", label: "Power", group: "Base" },
  { value: "Momentum", label: "Momentum", group: "Base" },
  { value: "HP", label: "HP (Constitution)", group: "Base" },
  { value: "Defense", label: "Defense", group: "Base" },
  { value: "Strength", label: "Strength", group: "Base" },
  { value: "All Martial Arts", label: "All Martial Arts", group: "Bonus" },
  { value: "Boss DMG%", label: "Boss DMG%", group: "Bonus" },
  { value: "Group DMG", label: "Group DMG", group: "Bonus" },
  { value: "Single Target DMG", label: "Single Target DMG", group: "Bonus" },
  { value: "Art of Umbrella Boost", label: "Art of Umbrella Boost", group: "Weapon Art" },
  { value: "Art of Rope Dart Boost", label: "Art of Rope Dart Boost", group: "Weapon Art" },
  { value: "Art of Sword Boost", label: "Art of Sword Boost", group: "Weapon Art" },
  { value: "Art of Spear Boost", label: "Art of Spear Boost", group: "Weapon Art" },
  { value: "Art of Fan Boost", label: "Art of Fan Boost", group: "Weapon Art" },
  { value: "Art of Dual Blades Boost", label: "Art of Dual Blades Boost", group: "Weapon Art" },
  { value: "Art of Mo Blade Boost", label: "Art of Mo Blade Boost", group: "Weapon Art" },
  { value: "Art of Heng Blade Boost", label: "Art of Heng Blade Boost", group: "Weapon Art" },
  { value: "Art of Gauntlets Boost", label: "Art of Gauntlets Boost", group: "Weapon Art" },
  { value: "Umb Martial Art Skill DMG Boost", label: "Umb Martial Art Skill DMG Boost", group: "Martial Skill" },
  { value: "Rope Dart Martial Art Skill DMG Boost", label: "Rope Dart Martial Art Skill DMG Boost", group: "Martial Skill" },
  { value: "Sword Martial Art Skill DMG Boost", label: "Sword Martial Art Skill DMG Boost", group: "Martial Skill" },
  { value: "Spear Martial Art Skill DMG Boost", label: "Spear Martial Art Skill DMG Boost", group: "Martial Skill" },
  { value: "Fan Martial Art Skill DMG Boost", label: "Fan Martial Art Skill DMG Boost", group: "Martial Skill" },
  { value: "Dual Blades Martial Art Skill DMG Boost", label: "Dual Blades Martial Art Skill DMG Boost", group: "Martial Skill" },
  { value: "Mo Blade Martial Art Skill DMG Boost", label: "Mo Blade Martial Art Skill DMG Boost", group: "Martial Skill" },
  { value: "Heng Blade Martial Art Skill DMG Boost", label: "Heng Blade Martial Art Skill DMG Boost", group: "Martial Skill" },
  { value: "Gauntlets Martial Art Skill DMG Boost", label: "Gauntlets Martial Art Skill DMG Boost", group: "Martial Skill" },
  { value: "Umb Special Skill DMG Boost", label: "Umb Special Skill DMG Boost", group: "Special Skill" },
  { value: "Rope Dart Special Skill DMG Boost", label: "Rope Dart Special Skill DMG Boost", group: "Special Skill" },
  { value: "Sword Special Skill DMG Boost", label: "Sword Special Skill DMG Boost", group: "Special Skill" },
  { value: "Spear Special Skill DMG Boost", label: "Spear Special Skill DMG Boost", group: "Special Skill" },
  { value: "Fan Special Skill DMG Boost", label: "Fan Special Skill DMG Boost", group: "Special Skill" },
  { value: "Dual Blades Special Skill DMG Boost", label: "Dual Blades Special Skill DMG Boost", group: "Special Skill" },
  { value: "Mo Blade Special Skill DMG Boost", label: "Mo Blade Special Skill DMG Boost", group: "Special Skill" },
  { value: "Heng Blade Special Skill DMG Boost", label: "Heng Blade Special Skill DMG Boost", group: "Special Skill" },
  { value: "Gauntlets Special Skill DMG Boost", label: "Gauntlets Special Skill DMG Boost", group: "Special Skill" },
  { value: "Umb Charged Skill DMG Boost", label: "Umb Charged Skill DMG Boost", group: "Charged Skill" },
  { value: "Rope Dart Charged Skill DMG Boost", label: "Rope Dart Charged Skill DMG Boost", group: "Charged Skill" },
  { value: "Sword Charged Skill DMG Boost", label: "Sword Charged Skill DMG Boost", group: "Charged Skill" },
  { value: "Spear Charged Skill DMG Boost", label: "Spear Charged Skill DMG Boost", group: "Charged Skill" },
  { value: "Fan Charged Skill DMG Boost", label: "Fan Charged Skill DMG Boost", group: "Charged Skill" },
  { value: "Dual Blades Charged Skill DMG Boost", label: "Dual Blades Charged Skill DMG Boost", group: "Charged Skill" },
  { value: "Mo Blade Charged Skill DMG Boost", label: "Mo Blade Charged Skill DMG Boost", group: "Charged Skill" },
  { value: "Heng Blade Charged Skill DMG Boost", label: "Heng Blade Charged Skill DMG Boost", group: "Charged Skill" },
  { value: "Gauntlets Charged Skill DMG Boost", label: "Gauntlets Charged Skill DMG Boost", group: "Charged Skill" },
  { value: "Phys Resist", label: "Phys Resist", group: "Defense" },
  { value: "Phys DMG Reduction", label: "Phys DMG Reduction", group: "Defense" },
];

interface OcrScannerProps {
  onOcrResult: (stats: any) => void;
  onImportGears?: (items: {
    rawText: string;
    fileName: string;
    slot: string;
    mastery?: number;
    subs: OcrSub[];
  }[]) => void;
}

interface QueuedOcrItem {
  id: string;
  fileName: string;
  objectUrl: string;
  status: "pending" | "processing" | "success" | "error";
  progress: string;
  subs: OcrSub[];
  mastery?: number;
  isSelected: boolean;
  rawText: string;
  slot: string;
}

export default function OcrScanner({ onImportGears }: OcrScannerProps) {
  const [queue, setQueue] = useState<QueuedOcrItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [pasteToast, setPasteToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      addFilesToQueue(files);
    }
  };

  const addFilesToQueue = useCallback((files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    const newItems: QueuedOcrItem[] = validFiles.map((file) => ({
      id: Math.random().toString(),
      fileName: file.name,
      objectUrl: URL.createObjectURL(file),
      status: "pending",
      progress: "In Queue",
      subs: [],
      isSelected: true,
      rawText: "",
      slot: "Auto"
    }));

    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  // Global Ctrl+V paste listener — captures screenshot from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          const named = new File([file], `screenshot_${Date.now()}.png`, { type: file.type });
          addFilesToQueue([named]);

          // Show toast
          setPasteToast("📋 Screenshot pasted! Click \"Start OCR Scan\" to process.");
          setTimeout(() => setPasteToast(null), 4000);
          return;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addFilesToQueue]);

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.objectUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  const handleToggleSelect = (id: string) => {
    setQueue((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isSelected: !it.isSelected } : it))
    );
  };

  const handleSlotEdit = (id: string, slot: string) => {
    setQueue((prev) => prev.map((it) => (it.id === id ? { ...it, slot } : it)));
  };

  const handleStatEdit = (id: string, index: number, key: 'type' | 'val' | 'isTuned', val: any) => {
    setQueue((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const nextSubs = [...it.subs];
          if (key === 'isTuned' && val === true) {
            nextSubs.forEach((sub, sidx) => {
              const isAttunement = sub.role === "attunement" || isAttunementStatKey(sub.type);
              sub.isTuned = !isAttunement && sidx === index;
              sub.isRetuned = sub.isTuned;
            });
          } else {
            nextSubs[index] = { ...nextSubs[index], [key]: val };
            if (key === "type") {
              const isAttunement = isAttunementStatKey(String(val));
              nextSubs[index].role = isAttunement ? "attunement" : nextSubs[index].role === "attunement" ? "additional" : nextSubs[index].role;
              if (isAttunement) { nextSubs[index].isTuned = false; nextSubs[index].isRetuned = false; }
            } else if (key === "isTuned") {
              nextSubs[index].isRetuned = Boolean(val);
            }
          }
          return {
            ...it,
            subs: nextSubs
          };
        }
        return it;
      })
    );
  };

  const startOcrProcessing = async () => {
    if (queue.length === 0 || isProcessing) return;
    setIsProcessing(true);

    const pendingItems = queue.map((it, idx) => ({ it, idx })).filter(({ it }) => it.status === "pending" || it.status === "error");
    if (pendingItems.length === 0) {
      setIsProcessing(false);
      return;
    }

    const { createWorker } = await import("tesseract.js");
    const worker: any = await createWorker();
    if (typeof worker.loadLanguage === "function") {
      await worker.loadLanguage("chi_sim+eng");
    }
    if (typeof worker.initialize === "function") {
      await worker.initialize("chi_sim+eng");
    }

    for (let i = 0; i < pendingItems.length; i++) {
      const { it, idx } = pendingItems[i];
      setCurrentFileIndex(idx);

      try {
        const { subs: parsedSubs, mastery: masteryStr, bestText } = await runDualPassOcr(
          worker,
          it.objectUrl,
          (msg) => setQueue((prev) =>
            prev.map((item) =>
              item.id === it.id
                ? { ...item, status: "processing", progress: msg }
                : item
            )
          )
        );
        const parsedMastery = masteryStr ? parseInt(masteryStr, 10) : undefined;
        const reconstructedText = bestText;
        
        setQueue((prev) =>
          prev.map((item) =>
            item.id === it.id
              ? {
                  ...item,
                  status: "success",
                  progress: "Analyzed successfully!",
                  subs: parsedSubs,
                  mastery: parsedMastery,
                  rawText: reconstructedText,
                  slot: item.slot === "Auto" ? inferOcrSlot(reconstructedText) : item.slot
                }
              : item
          )
        );
      } catch (err: any) {
        console.error("OCR parse fail:", err);
        setQueue((prev) =>
          prev.map((item) =>
            item.id === it.id
              ? { ...item, status: "error", progress: err?.message || "Parsing Error" }
              : item
          )
        );
      }
    }

    await worker.terminate();
    setIsProcessing(false);
    setCurrentFileIndex(-1);
  };

  const clearAllQueue = () => {
    queue.forEach((it) => URL.revokeObjectURL(it.objectUrl));
    setQueue([]);
  };

  return (
    <div className="bg-[#141210] border border-amber-900/10 rounded-xl p-5 mb-6">
      {pasteToast && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-pulse">
          {pasteToast}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-sm font-semibold font-serif text-amber-500 tracking-wider uppercase flex items-center gap-2">
          <Image className="w-4 h-4 text-amber-400" /> BATCH OCR LIBRARY SCANNER
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Upload one or <strong>several gear screenshots from your device</strong>. The tool reads all 6 substats and adds them straight to your inventory.
        </p>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Ctrl+V</kbd>
          <span>— Press Ctrl+V anywhere on this panel to paste a screenshot directly from your clipboard</span>
        </div>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed border-amber-900/40 hover:border-amber-500/50 rounded-xl p-7 text-center cursor-pointer bg-slate-950/60 transition-all flex flex-col items-center justify-center gap-2"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelection}
          multiple={true}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
        />
        <FileUp className="w-10 h-10 text-amber-500/80 mb-1 hover:scale-110 transition-transform" />
        <p className="text-sm font-medium text-slate-200">
          Choose gear screenshots from your device
        </p>
        <p className="text-xs text-slate-500">
          Supports batch scanning of multiple gear pieces at once.
        </p>
      </div>

      {queue.length > 0 && (
        <div className="mt-5 border-t border-slate-900 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="text-xs font-mono text-slate-400">
              Queue: <strong className="text-amber-500">{queue.length} image(s)</strong>
              {isProcessing && ` (Processing image #${currentFileIndex + 1})`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={startOcrProcessing}
                disabled={isProcessing}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning OCR...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Start OCR scan
                  </>
                )}
              </button>
              <button
                onClick={clearAllQueue}
                disabled={isProcessing}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear queue
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.map((item) => {
              const hasSubs = item.subs && item.subs.length > 0;
              const validation = validateGlobalT96GearLines(item.slot, item.subs);
              return (
                <div
                  key={item.id}
                  className={`border rounded-xl p-3 bg-slate-900/60 flex flex-col justify-between gap-3 transition-colors ${
                    item.status === "processing"
                      ? "border-amber-500/60 ring-1 ring-amber-500/20"
                      : item.status === "success"
                      ? "border-slate-800"
                      : "border-slate-900"
                  }`}
                >
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => handleToggleSelect(item.id)}
                      className="text-slate-500 hover:text-amber-500 transition-colors shrink-0"
                    >
                      {item.isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>

                    <img
                      src={item.objectUrl}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded object-cover border border-slate-800 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate pr-4">
                        {item.fileName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.status === "success" && (
                          <span className="bg-emerald-950/50 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded border border-emerald-900 font-bold font-mono">
                            SUCCESS
                          </span>
                        )}
                        {item.status === "processing" && (
                          <span className="bg-amber-950/50 text-amber-400 text-[9px] px-1.5 py-0.5 rounded border border-amber-900 animate-pulse font-medium font-mono flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> SCANNING
                          </span>
                        )}
                        {item.status === "pending" && (
                          <span className="bg-slate-950 text-slate-500 text-[9px] px-1.5 py-0.5 rounded border border-slate-800 font-medium font-mono">
                            PENDING
                          </span>
                        )}
                        {item.status === "error" && (
                          <span className="bg-rose-950 text-rose-400 text-[9px] px-1.5 py-0.5 rounded border border-rose-900 font-medium font-mono">
                            ERROR
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 truncate">{item.progress}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {hasSubs && (
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
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-2 py-1 text-[10px] font-bold font-mono ${validation.errors.length ? "border-rose-900 bg-rose-950/50 text-rose-300" : validation.origin === "relaid" ? "border-violet-900 bg-violet-950/40 text-violet-300" : "border-emerald-900 bg-emerald-950/40 text-emerald-300"}`}>
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
                      </div>
                      <div className="flex flex-col gap-1.5 font-mono text-slate-300">
                        {item.subs.map((sub, sidx) => (
                          <div key={sidx} className="grid grid-cols-[24px_minmax(190px,1fr)_82px_66px] gap-2 items-center bg-slate-900/40 px-2 py-2 rounded border border-slate-800/60">
                            <span className="text-slate-400 text-[10px]">#{sidx + 1}</span>
                            <SearchableSelect
                              value={sub.type}
                              onChange={(val) => handleStatEdit(item.id, sidx, 'type', val)}
                              options={filterGlobalT96StatOptions(OCR_STAT_OPTIONS, item.slot)}
                              placeholder="Search stat..."
                              className="min-w-[190px]"
                            />
                            <input
                              type="text"
                              value={sub.val}
                              onChange={(e) => handleStatEdit(item.id, sidx, 'val', e.target.value)}
                              className="w-full min-w-[72px] bg-slate-950 text-slate-100 border border-slate-800 text-right px-2 rounded text-[11px] py-2"
                              placeholder="0"
                            />
                            {(sub.role === "attunement" || isAttunementStatKey(sub.type)) ? (
                              <div className="min-w-[66px] text-right">
                                <div className="text-emerald-400 font-bold text-[8px]">ATTUNEMENT</div>
                                {sub.displayName && <div className="mt-0.5 max-w-[220px] text-[8px] leading-tight text-slate-500">{sub.displayName}</div>}
                              </div>
                            ) : (
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!(sub.isRetuned ?? sub.isTuned)}
                                  onChange={(e) => handleStatEdit(item.id, sidx, 'isTuned', e.target.checked)}
                                  className="accent-amber-500 w-3 h-3"
                                />
                                <span className="text-amber-500 font-bold text-[8px]">RETUNED</span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Merge Operations Box */}
          <div className="mt-5 bg-amber-950/10 border border-amber-900/20 rounded-xl p-4 flex flex-row justify-between items-center gap-4">
            <div>
              <p className="text-[11px] text-slate-400">
                Click the button to add all successfully scanned gear straight into your current character's inventory.
              </p>
            </div>

            <div className="flex gap-2">
              {onImportGears && (
                <button
                  onClick={() => {
                    const activeItems = queue.filter((it) => it.isSelected && it.status === "success");
                    const invalidItems = activeItems.filter((it) => it.slot === "Auto" || validateGlobalT96GearLines(it.slot, it.subs).errors.length > 0);
                    if (invalidItems.length > 0) {
                      alert(`Fix slot/stat errors on ${invalidItems.length} selected image(s) before importing.`);
                      return;
                    }
                    // Custom raw text reconstruct to make it compatible with parent parser
                    const scanned = activeItems.map(it => {
                      // Reconstruct the text in linear raw style to pass values to parser
                      let lines: string[] = ["Equipped"];
                      if (it.slot !== "Auto") lines.push(`Slot: ${it.slot}`);
                      if (it.mastery) {
                        lines.push(`Mastery: ${it.mastery}`);
                      }
                      it.subs.forEach(s => {
                        if (s.type !== "Other" && s.val) {
                          lines.push(`${s.type}: ${s.val} ${s.isTuned ? "[turn]" : ""}`);
                        }
                      });
                      return {
                        // Keep the original OCR text for diagnostics/fallback,
                        // but the parent receives the already-reviewed structured rows.
                        rawText: it.rawText || lines.join("\n"),
                        fileName: it.fileName,
                        slot: it.slot,
                        mastery: it.mastery,
                        subs: it.subs.filter((sub) => sub.type !== "Other" && sub.val).map((sub) => ({ ...sub })),
                      };
                    });
                    onImportGears(scanned);
                  }}
                  disabled={queue.filter((it) => it.isSelected && it.status === "success" && it.slot !== "Auto" && validateGlobalT96GearLines(it.slot, it.subs).errors.length === 0).length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-lg cursor-pointer"
                >
                  📥 Add to inventory
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
