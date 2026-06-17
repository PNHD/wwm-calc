import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createWorker } from "tesseract.js";
import { runDualPassOcr, type OcrSub } from "../utils/ocrParser";
import SearchableSelect from "./SearchableSelect";
import {
  FileUp,
  Loader2,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
  Image
} from "lucide-react";

const OCR_STAT_OPTIONS: { value: string; label: string; group?: string }[] = [
  { value: "Other", label: "Select Stat / Empty" },
  { value: "Max Phys Atk", label: "Max Phys Atk", group: "Physical" },
  { value: "Min Phys Atk", label: "Min Phys Atk", group: "Physical" },
  { value: "Phys Pen", label: "Phys Pen", group: "Physical" },
  { value: "Phys DMG%", label: "Phys DMG%", group: "Physical" },
  { value: "Max Silkbind Atk", label: "Max Silkbind Atk", group: "Inner" },
  { value: "Min Silkbind Atk", label: "Min Silkbind Atk", group: "Inner" },
  { value: "Silkbind Pen", label: "Silkbind Pen", group: "Inner" },
  { value: "Silkbind DMG%", label: "Silkbind DMG%", group: "Inner" },
  { value: "Max Bamboocut Atk", label: "Max Bamboocut Atk", group: "Inner" },
  { value: "Min Bamboocut Atk", label: "Min Bamboocut Atk", group: "Inner" },
  { value: "Bamboocut Pen", label: "Bamboocut Pen", group: "Inner" },
  { value: "Bamboocut DMG%", label: "Bamboocut DMG%", group: "Inner" },
  { value: "Max Bellstrike Atk", label: "Max Bellstrike Atk", group: "Inner" },
  { value: "Min Bellstrike Atk", label: "Min Bellstrike Atk", group: "Inner" },
  { value: "Bellstrike Pen", label: "Bellstrike Pen", group: "Inner" },
  { value: "Bellstrike DMG%", label: "Bellstrike DMG%", group: "Inner" },
  { value: "Max Stonesplit Atk", label: "Max Stonesplit Atk", group: "Inner" },
  { value: "Min Stonesplit Atk", label: "Min Stonesplit Atk", group: "Inner" },
  { value: "Stonesplit Pen", label: "Stonesplit Pen", group: "Inner" },
  { value: "Stonesplit DMG%", label: "Stonesplit DMG%", group: "Inner" },
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
  onImportGears?: (items: { rawText: string; fileName: string }[]) => void;
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

  const handleStatEdit = (id: string, index: number, key: 'type' | 'val' | 'isTuned', val: any) => {
    setQueue((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const nextSubs = [...it.subs];
          if (key === 'isTuned' && val === true) {
            // Uncheck other tuned
            nextSubs.forEach((sub, sidx) => {
              sub.isTuned = sidx === index;
            });
          } else {
            nextSubs[index] = {
              ...nextSubs[index],
              [key]: val
            };
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
                  rawText: reconstructedText
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
          Tải lên một hoặc <strong>nhiều ảnh chụp trang bị từ máy của bạn</strong>. Công cụ sẽ nhận dạng tất cả 6 dòng chỉ số và tự động thêm vào kho đồ.
        </p>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Ctrl+V</kbd>
          <span>— Nhấn Ctrl+V ở bất kỳ đâu trên bảng này để dán trực tiếp ảnh chụp màn hình từ khay nhớ tạm</span>
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
          Chọn ảnh trang bị từ thiết bị của bạn
        </p>
        <p className="text-xs text-slate-500">
          Hỗ trợ nhận dạng hàng loạt nhiều trang bị cùng lúc.
        </p>
      </div>

      {queue.length > 0 && (
        <div className="mt-5 border-t border-slate-900 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="text-xs font-mono text-slate-400">
              Danh sách hàng đợi: <strong className="text-amber-500">{queue.length} ảnh</strong>
              {isProcessing && ` (Đang xử lý ảnh thứ #${currentFileIndex + 1})`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={startOcrProcessing}
                disabled={isProcessing}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang quét OCR...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Bắt đầu quét OCR
                  </>
                )}
              </button>
              <button
                onClick={clearAllQueue}
                disabled={isProcessing}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa hàng đợi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.map((item) => {
              const hasSubs = item.subs && item.subs.length > 0;
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
                    <div className="bg-[#0b0a09]/50 p-2.5 rounded border border-slate-950 text-[10px] space-y-2">
                      <div className="text-slate-500 uppercase font-bold font-mono pb-1 border-b border-slate-900">
                        Chỉ số nhận diện (nhấp vào để sửa nếu sai):
                      </div>
                      <div className="flex flex-col gap-1.5 font-mono text-slate-300">
                        {item.subs.map((sub, sidx) => (
                          <div key={sidx} className="flex gap-2 items-center bg-slate-900/40 px-1.5 py-1 rounded border border-slate-900/20">
                            <span className="text-slate-400 text-[9px] min-w-[12px]">#{sidx + 1}</span>
                            <SearchableSelect
                              value={sub.type}
                              onChange={(val) => handleStatEdit(item.id, sidx, 'type', val)}
                              options={OCR_STAT_OPTIONS}
                              placeholder="Search stat..."
                            />
                            <input
                              type="text"
                              value={sub.val}
                              onChange={(e) => handleStatEdit(item.id, sidx, 'val', e.target.value)}
                              className="w-16 bg-slate-950 text-slate-100 border-none text-right px-1 rounded text-[10px] py-0.5"
                              placeholder="0"
                            />
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!sub.isTuned}
                                onChange={(e) => handleStatEdit(item.id, sidx, 'isTuned', e.target.checked)}
                                className="accent-amber-500 w-3 h-3"
                              />
                              <span className="text-amber-500 font-bold text-[8px]">Đ.ÂM</span>
                            </label>
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
                Nhấp vào nút bên cạnh để thêm trực tiếp tất cả các trang bị đã quét thành công vào kho đồ của nhân vật hiện tại.
              </p>
            </div>

            <div className="flex gap-2">
              {onImportGears && (
                <button
                  onClick={() => {
                    const activeItems = queue.filter((it) => it.isSelected && it.status === "success");
                    // Custom raw text reconstruct to make it compatible with parent parser
                    const scanned = activeItems.map(it => {
                      // Reconstruct the text in linear raw style to pass values to parser
                      let lines: string[] = [];
                      if (it.mastery) {
                        lines.push(`Mastery: ${it.mastery}`);
                      }
                      it.subs.forEach(s => {
                        if (s.type !== "Other" && s.val) {
                          lines.push(`${s.type}: ${s.val} ${s.isTuned ? "[turn]" : ""}`);
                        }
                      });
                      return {
                        rawText: lines.join("\n"),
                        fileName: it.fileName
                      };
                    });
                    onImportGears(scanned);
                  }}
                  disabled={queue.filter((it) => it.isSelected && it.status === "success").length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-lg cursor-pointer"
                >
                  📥 Thêm vào kho đồ
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
