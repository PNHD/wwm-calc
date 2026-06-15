import React, { useState, useRef, useEffect, useCallback } from "react";
import { createWorker } from "tesseract.js";
import {
  Camera,
  FileUp,
  Loader2,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Trash2,
  Check,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Sliders,
  Image
} from "lucide-react";
import { PanelStats } from "../types";

interface OcrScannerProps {
  onOcrResult: (stats: Partial<PanelStats>) => void;
}

interface QueuedOcrItem {
  id: string;
  fileName: string;
  objectUrl: string;
  status: "pending" | "processing" | "success" | "error";
  progress: string;
  stats: Partial<PanelStats>;
  isSelected: boolean;
  rawText: string;
}

export default function OcrScanner({ onOcrResult }: OcrScannerProps) {
  const [queue, setQueue] = useState<QueuedOcrItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [mergeStrategy, setMergeStrategy] = useState<"sum" | "max">("sum");
  const [pasteToast, setPasteToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse Yanyun screenshot text (Panel range or single gear substats)
  const parseYanyunStats = (text: string): Partial<PanelStats> => {
    const stats: Partial<PanelStats> = {};
    const lines = text.split("\n");

    const cleanNum = (str: string) => {
      const parsed = parseFloat(str.replace(/[^0-9.]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    lines.forEach((line) => {
      const lcLine = line.toLowerCase();

      // Priority 1: Range match (Typically from Full Character Panel screenshots)
      const rangeMatch = line.match(/(\d{3,4})\s*[-~至]\s*(\d{3,4})/);
      if (rangeMatch) {
        // Physical Attack Range
        const isOuterAtkLine = 
          lcLine.includes("攻击") || 
          lcLine.includes("ngoại công") || 
          lcLine.includes("tấn công") || 
          lcLine.includes("outer") || 
          lcLine.includes("atk") || 
          lcLine.includes("phys");

        if (isOuterAtkLine) {
          const minVal = parseInt(rangeMatch[1], 10);
          const maxVal = parseInt(rangeMatch[2], 10);
          if (minVal > 300 && maxVal > minVal) {
            stats.minOuter = minVal;
            stats.maxOuter = maxVal;
          }
        }

        // Bamboocut Attack Range
        const isPzRangeLine = 
          lcLine.includes("破竹") || 
          lcLine.includes("phá trúc") || 
          lcLine.includes("bamboo") || 
          lcLine.includes("pz");

        if (isPzRangeLine && !lcLine.includes("破防") && !lcLine.includes("pen") && !lcLine.includes("伤害") && !lcLine.includes("dmg")) {
          const minVal = parseInt(rangeMatch[1], 10);
          const maxVal = parseInt(rangeMatch[2], 10);
          if (minVal > 10 && maxVal > minVal) {
            stats.minPz = minVal;
            stats.maxPz = maxVal;
          }
        }
        return; // Proceed to next line
      }

      // Priority 2: Single-line values (Typically from Individual Gear Slot screenshots)
      const valueMatch = line.match(/([+-]?\s*\d+(?:\.\d+)?)\s*%?/);
      if (valueMatch) {
        const val = cleanNum(valueMatch[1]);
        if (val === 0) return;

        // 1. Physical Penetration
        if (
          (lcLine.includes("破防") || lcLine.includes("破甲") || lcLine.includes("xuyên") || lcLine.includes("phá giáp") || lcLine.includes("pen") || lcLine.includes("vật lý")) &&
          !(lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc"))
        ) {
          stats.outerPen = val;
        }

        // 2. Max Physical Atk
        else if (
          (lcLine.includes("tối đa") || lcLine.includes("max") || lcLine.includes("最大")) &&
          (lcLine.includes("ngoại") || lcLine.includes("tấn công") || lcLine.includes("atk") || lcLine.includes("phys") || lcLine.includes("công")) &&
          !(lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc"))
        ) {
          stats.maxOuter = val;
        }

        // 3. Min Physical Atk
        else if (
          (lcLine.includes("tối thiểu") || lcLine.includes("min") || lcLine.includes("最小")) &&
          (lcLine.includes("ngoại") || lcLine.includes("tấn công") || lcLine.includes("atk") || lcLine.includes("phys") || lcLine.includes("công")) &&
          !(lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc"))
        ) {
          stats.minOuter = val;
        }

        // 4. Crit Rate
        else if (
          (lcLine.includes("hội tâm") || lcLine.includes("crit") || lcLine.includes("会心")) &&
          !(lcLine.includes("伤害") || lcLine.includes("sát thương") || lcLine.includes("dmg") || lcLine.includes("damage") || lcLine.includes("hội thương") || lcLine.includes("加成"))
        ) {
          stats.crit = val;
        }

        // 5. Crit DMG
        else if (
          lcLine.includes("hội thương") ||
          (lcLine.includes("hội tâm") && (lcLine.includes("sát thương") || lcLine.includes("伤害") || lcLine.includes("加成"))) ||
          lcLine.includes("crit dmg") ||
          lcLine.includes("crit_dmg") ||
          lcLine.includes("会心伤害")
        ) {
          stats.critDmg = val;
        }

        // 5b. Affinity Rate
        else if (
          (lcLine.includes("thức phá") || lcLine.includes("affinity") || lcLine.includes("aff") || lcLine.includes("识破")) &&
          !(lcLine.includes("sát thương") || lcLine.includes("dmg") || lcLine.includes("damage") || lcLine.includes("伤害") || lcLine.includes("加成"))
        ) {
          stats.aff = val;
        }

        // 5c. Affinity Damage
        else if (
          (lcLine.includes("thức phá") && (lcLine.includes("sát thương") || lcLine.includes("伤害") || lcLine.includes("加成"))) ||
          lcLine.includes("affinity dmg") ||
          lcLine.includes("aff_dmg") ||
          lcLine.includes("识破伤害")
        ) {
          stats.affDmg = val;
        }

        // 6. Bamboocut Penetration (Pz Pen)
        else if (
          (lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc")) &&
          (lcLine.includes("破防") || lcLine.includes("xuyên") || lcLine.includes("pen"))
        ) {
          stats.pzPen = val;
        }

        // 7. Bamboocut Break DMG % (Pz Dmg)
        else if (
          (lcLine.includes("破竹") || lcLine.includes("bamboo") || lcLine.includes("phá trúc")) &&
          (lcLine.includes("伤害") || lcLine.includes("sát thương") || lcLine.includes("dmg") || lcLine.includes("damage"))
        ) {
          stats.pzDmg = val;
        }
      }
    });

    return stats;
  };

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
      stats: {},
      isSelected: true,
      rawText: ""
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

  const handleStatEdit = (id: string, key: keyof PanelStats, val: number) => {
    setQueue((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            stats: {
              ...it.stats,
              [key]: val
            }
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

    const worker: any = await createWorker();
    // Multi language support (Simplified Chinese + English)
    if (typeof worker.loadLanguage === "function") {
      await worker.loadLanguage("chi_sim+eng");
    }
    if (typeof worker.initialize === "function") {
      await worker.initialize("chi_sim+eng");
    }

    for (let i = 0; i < pendingItems.length; i++) {
      const { it, idx } = pendingItems[i];
      setCurrentFileIndex(idx);

      setQueue((prev) =>
        prev.map((item) =>
          item.id === it.id
            ? { ...item, status: "processing", progress: "Initializing OCR Engine..." }
            : item
        )
      );

      try {
        const response = await fetch(it.objectUrl);
        const blob = await response.blob();
        
        const { data: { text } } = await worker.recognize(blob);

        const parsedStats = parseYanyunStats(text);

        setQueue((prev) =>
          prev.map((item) =>
            item.id === it.id
              ? {
                  ...item,
                  status: "success",
                  progress: "Analyzed successfully!",
                  stats: parsedStats,
                  rawText: text
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

  const handleMergeAndSync = () => {
    const activeItems = queue.filter((it) => it.isSelected && it.status === "success");
    if (activeItems.length === 0) return;

    const merged: Partial<PanelStats> = {};

    activeItems.forEach((item) => {
      Object.entries(item.stats).forEach(([k, v]) => {
        const key = k as keyof PanelStats;
        if (v === undefined || typeof v !== "number") return;

        if (merged[key] === undefined) {
          (merged as any)[key] = v;
        } else {
          if (mergeStrategy === "sum") {
            // Addition: summing up substats
            (merged as any)[key] = (merged[key] as number) + v;
          } else {
            // Maximum: keeping the maximum overview value
            (merged as any)[key] = Math.max(merged[key] as number, v);
          }
        }
      });
    });

    onOcrResult(merged);
    alert("Stats merged and synchronized successfully to the calculator panel!");
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files) as File[];
      addFilesToQueue(droppedFiles);
    }
  };

  const clearAllQueue = () => {
    queue.forEach((it) => URL.revokeObjectURL(it.objectUrl));
    setQueue([]);
  };

  return (
    <div className="bg-[#141210] border border-amber-900/10 rounded-xl p-5 mb-6">
      {/* Paste Toast Notification */}
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
          Upload one or <strong>multiple screenshots from your photo library</strong>. The engine will extract gear substats and physical panel metrics and merge them into your setup.
        </p>
        {/* Ctrl+V hint */}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Ctrl+V</kbd>
          <span>— Press anywhere on this tab to paste a screenshot directly from clipboard</span>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
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
          Choose screenshots from Photo Library / Album / Folder
        </p>
        <p className="text-xs text-slate-500">
          Supports individual gear pieces or total character attribute screens. You can select multiple images at once.
        </p>
      </div>

      {/* Queue Processing Controls */}
      {queue.length > 0 && (
        <div className="mt-5 border-t border-slate-900 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="text-xs font-mono text-slate-400">
              Queue Status: <strong className="text-amber-500">{queue.length} images</strong>
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
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running OCR Parser...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Start OCR Scan
                  </>
                )}
              </button>
              <button
                onClick={clearAllQueue}
                disabled={isProcessing}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Queue
              </button>
            </div>
          </div>

          {/* Queue items cards list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.map((item, qIdx) => {
              const hasStats = Object.keys(item.stats).length > 0;
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
                    {/* Select box for merge */}
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

                    {/* Thumbnail */}
                    <img
                      src={item.objectUrl}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded object-cover border border-slate-800 shrink-0"
                    />

                    {/* Meta info */}
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

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scanned/Editable Stats */}
                  {hasStats && (
                    <div className="bg-[#0b0a09]/50 p-2.5 rounded border border-slate-950 text-[10px] space-y-2">
                      <div className="text-slate-500 uppercase font-bold font-mono pb-1 border-b border-slate-900">
                        Extracted Stats (Click to edit if wrong):
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-slate-300">
                        {item.stats.maxOuter !== undefined && (
                          <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-900/20">
                            <span>Max Atk:</span>
                            <input
                              type="number"
                              value={item.stats.maxOuter}
                              onChange={(e) =>
                                handleStatEdit(item.id, "maxOuter", parseInt(e.target.value) || 0)
                              }
                              className="w-12 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px] font-bold"
                            />
                          </div>
                        )}
                        {item.stats.minOuter !== undefined && (
                          <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-900/20">
                            <span>Min Atk:</span>
                            <input
                              type="number"
                              value={item.stats.minOuter}
                              onChange={(e) =>
                                handleStatEdit(item.id, "minOuter", parseInt(e.target.value) || 0)
                              }
                              className="w-12 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px]"
                            />
                          </div>
                        )}
                        {item.stats.outerPen !== undefined && (
                          <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-900/20">
                            <span>Phys Pen %:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={item.stats.outerPen}
                              onChange={(e) =>
                                handleStatEdit(item.id, "outerPen", parseFloat(e.target.value) || 0)
                              }
                              className="w-12 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px]"
                            />
                          </div>
                        )}
                        {item.stats.crit !== undefined && (
                          <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-900/20">
                            <span>Crit %:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={item.stats.crit}
                              onChange={(e) =>
                                handleStatEdit(item.id, "crit", parseFloat(e.target.value) || 0)
                              }
                              className="w-12 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px]"
                            />
                          </div>
                        )}
                        {item.stats.prec !== undefined && (
                          <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-900/20">
                            <span>Precision %:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={item.stats.prec}
                              onChange={(e) =>
                                handleStatEdit(item.id, "prec", parseFloat(e.target.value) || 0)
                              }
                              className="w-12 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px]"
                            />
                          </div>
                        )}
                        {item.stats.critDmg !== undefined && (
                          <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-900/20">
                            <span>CritDmg %:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={item.stats.critDmg}
                              onChange={(e) =>
                                handleStatEdit(item.id, "critDmg", parseFloat(e.target.value) || 0)
                              }
                              className="w-12 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px]"
                            />
                          </div>
                        )}
                        {item.stats.aff !== undefined && (
                          <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-900/20">
                            <span>Affinity %:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={item.stats.aff}
                              onChange={(e) =>
                                handleStatEdit(item.id, "aff", parseFloat(e.target.value) || 0)
                              }
                              className="w-12 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px]"
                            />
                          </div>
                        )}
                        {item.stats.affDmg !== undefined && (
                          <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-900/20">
                            <span>AffDmg %:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={item.stats.affDmg}
                              onChange={(e) =>
                                handleStatEdit(item.id, "affDmg", parseFloat(e.target.value) || 0)
                              }
                              className="w-12 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px]"
                            />
                          </div>
                        )}
                        {item.stats.maxPz !== undefined && (
                          <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-900/20 col-span-2">
                            <span>Bamboocut (Min/Max):</span>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                value={item.stats.minPz || 0}
                                onChange={(e) =>
                                  handleStatEdit(item.id, "minPz", parseInt(e.target.value) || 0)
                                }
                                className="w-10 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px]"
                              />
                              <span>-</span>
                              <input
                                type="number"
                                value={item.stats.maxPz}
                                onChange={(e) =>
                                  handleStatEdit(item.id, "maxPz", parseInt(e.target.value) || 0)
                                }
                                className="w-10 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Merge Operations Box */}
          <div className="mt-5 bg-amber-950/10 border border-amber-900/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-xs font-semibold text-amber-200 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> Batch Merge Settings
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xl">
                Choose whether to combine stats across multiple items (such as individual gear pieces) or take the maximum value (such as multiple Full Character Panel screenshots).
              </p>
              
              <div className="flex gap-4 mt-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={mergeStrategy === "sum"}
                    onChange={() => setMergeStrategy("sum")}
                    className="accent-amber-500 w-3.5 h-3.5"
                  />
                  <span>Sum sub-stats (Gear Sub-stats Sum)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={mergeStrategy === "max"}
                    onChange={() => setMergeStrategy("max")}
                    className="accent-amber-500 w-3.5 h-3.5"
                  />
                  <span>Select highest value (Character Panel Max)</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleMergeAndSync}
              disabled={queue.filter((it) => it.isSelected && it.status === "success").length === 0}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-lg cursor-pointer font-serif"
            >
              <Sparkles className="w-4 h-4 text-slate-900" /> Sync to Calculator Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
