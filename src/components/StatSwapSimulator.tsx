import React, { useState } from "react";
import { PanelStats, TierConstants } from "../types";
import { calcSkill, getRotationForBuild } from "../utils/calc";
import { TrendingUp, RefreshCw } from "lucide-react";

interface Props {
  adjustedPanel: PanelStats;
  activeTier: TierConstants;
  datang: boolean;
  yishui: boolean;
  selectedBuild: string;
}

const STAT_KEYS: { key: keyof PanelStats; label: string; step: number; unit: string }[] = [
  { key: "maxOuter",  label: "Max Phys ATK",    step: 50,  unit: "" },
  { key: "minOuter",  label: "Min Phys ATK",    step: 50,  unit: "" },
  { key: "outerPen",  label: "Phys Pen",        step: 5,   unit: "%" },
  { key: "crit",      label: "Crit Rate",       step: 5,   unit: "%" },
  { key: "critDmg",   label: "Crit DMG",        step: 5,   unit: "%" },
  { key: "aff",       label: "Affinity Rate",   step: 5,   unit: "%" },
  { key: "affDmg",    label: "Affinity DMG",    step: 5,   unit: "%" },
  { key: "prec",      label: "Precision Rate",  step: 5,   unit: "%" },
  { key: "maxPz",     label: "Max Bamboocut ATK", step: 30, unit: "" },
  { key: "pzPen",     label: "Bamboocut Pen",   step: 5,   unit: "%" },
  { key: "umbAll",     label: "Art of Umbrella Boost", step: 2, unit: "%" },
  { key: "umbMartial", label: "Umb Martial Art Skill DMG Boost", step: 2, unit: "%" },
  { key: "ropeAll",    label: "Art of Rope Dart Boost", step: 2, unit: "%" },
  { key: "ropeMartial", label: "Rope Dart Martial Art Skill DMG Boost", step: 2, unit: "%" },
  { key: "swordAll",   label: "Art of Sword Boost", step: 2, unit: "%" },
  { key: "swordMartial", label: "Sword Martial Art Skill DMG Boost", step: 2, unit: "%" },
  { key: "spearAll",   label: "Art of Spear Boost", step: 2, unit: "%" },
  { key: "spearMartial", label: "Spear Martial Art Skill DMG Boost", step: 2, unit: "%" },
  { key: "fanAll",     label: "Art of Fan Boost", step: 2, unit: "%" },
  { key: "fanMartial", label: "Fan Martial Art Skill DMG Boost", step: 2, unit: "%" },
  { key: "twinbladesAll", label: "Art of Dual Blades Boost", step: 2, unit: "%" },
  { key: "twinbladesMartial", label: "Dual Blades Martial Art Skill DMG Boost", step: 2, unit: "%" },
  { key: "modaoAll",   label: "Art of Mo Blade Boost", step: 2, unit: "%" },
  { key: "modaoMartial", label: "Mo Blade Martial Art Skill DMG Boost", step: 2, unit: "%" },
  { key: "hengdaoAll", label: "Art of Heng Blade Boost", step: 2, unit: "%" },
  { key: "hengdaoMartial", label: "Heng Blade Martial Art Skill DMG Boost", step: 2, unit: "%" },
  { key: "gauntletsAll", label: "Art of Gauntlets Boost", step: 2, unit: "%" },
  { key: "gauntletsMartial", label: "Gauntlets Martial Art Skill DMG Boost", step: 2, unit: "%" },
  { key: "allArts",   label: "All Martial Art Skill DMG Boost", step: 2,  unit: "%" },
  { key: "bossDmg",   label: "Boss DMG",        step: 2,   unit: "%" },
  { key: "outerDmg",  label: "Phys DMG%",       step: 2,   unit: "%" },
  { key: "dcrit",     label: "Direct Crit Rate", step: 5,  unit: "%" },
];

// Build display weapon -> panel-stat key prefix (umbAll/umbMartial/...).
const WEAPON_NAME_TO_PREFIX: Record<string, string> = {
  "Umbrella": "umb", "Rope Dart": "rope", "Sword": "sword", "Spear": "spear",
  "Fan": "fan", "Dual Blades": "twinblades", "Modao": "modao", "Mo Blade": "modao",
  "Hengdao": "hengdao", "Heng Blade": "hengdao", "Gauntlets": "gauntlets",
};
const BUILD_WEAPON_TYPES: Record<string, [string, string]> = {
  "bamboocut-dust": ["Umbrella", "Rope Dart"], "bellstrike-umbra": ["Sword", "Spear"],
  "bellstrike-splendor": ["Sword", "Spear"], "bamboocut-wind": ["Dual Blades", "Rope Dart"],
  "stonesplit-might": ["Hengdao", "Modao"], "silkbind-jade": ["Umbrella", "Fan"],
  "silkbind-deluge": ["Umbrella", "Fan"], "bamboocut-kite": ["Gauntlets", "Rope Dart"],
  "stonesplit-awe": ["Modao", "Spear"], "stonesplit-pure-datang": ["Hengdao", "Modao"],
};
const WEAPON_STAT_KEY_RE = /^(umb|rope|sword|spear|fan|twinblades|modao|hengdao|gauntlets)(All|Martial|Special|Charged)$/;

function computeTotalDmg(
  p: PanelStats,
  tier: TierConstants,
  opts: { datang?: boolean; yishui?: boolean; buildKey?: string }
) {
  let total = 0;
  getRotationForBuild(opts.buildKey).forEach(item => {
    const { total: dmg } = calcSkill(item, p, tier, {
      set: p.set || "stars",
      datang: opts.datang,
      yishui: opts.yishui,
      buildKey: opts.buildKey,
    });
    total += dmg;
  });
  return total;
}

export default function StatSwapSimulator({ adjustedPanel, activeTier, datang, yishui, selectedBuild }: Props) {
  const [swaps, setSwaps] = useState<Record<string, number>>({});

  // Only show weapon-specific boosts for THIS build's two weapons; keep all universal stats.
  const buildPrefixes = (BUILD_WEAPON_TYPES[selectedBuild] || [])
    .map(n => WEAPON_NAME_TO_PREFIX[n]).filter(Boolean);
  const statKeys = STAT_KEYS.filter(({ key }) => {
    const m = (key as string).match(WEAPON_STAT_KEY_RE);
    if (!m) return true;
    return buildPrefixes.includes(m[1]);
  });

  const buildSwappedPanel = (): PanelStats => {
    const p = { ...adjustedPanel };
    statKeys.forEach(({ key, step }) => {
      const delta = (swaps[key as string] || 0) * step;
      (p[key] as number) += delta;
    });
    return p;
  };

  const basePanel  = adjustedPanel;
  const swapPanel  = buildSwappedPanel();
  const baseDmg    = computeTotalDmg(basePanel, activeTier, { datang, yishui, buildKey: selectedBuild });
  const swapDmg    = computeTotalDmg(swapPanel, activeTier, { datang, yishui, buildKey: selectedBuild });
  const deltaAbs   = swapDmg - baseDmg;
  const deltaPct   = baseDmg > 0 ? (deltaAbs / baseDmg) * 100 : 0;

  const opts = { datang, yishui, buildKey: selectedBuild };

  // Per-stat marginal gain table (show top gains)
  const gains = statKeys.map(({ key, label, step, unit }) => {
    const p = { ...adjustedPanel };
    (p[key] as number) += step;
    const newDmg = computeTotalDmg(p, activeTier, opts);
    const pct = baseDmg > 0 ? ((newDmg - baseDmg) / baseDmg) * 100 : 0;
    return { key, label, step, unit, pct };
  }).sort((a, b) => b.pct - a.pct);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-[#ffd700]" />
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-serif">Stat Swap Simulator</h2>
          <p className="text-xs text-slate-400">Add or remove stat chunks to compare DPS impact</p>
        </div>
      </div>

      {/* Swap Controls Grid */}
      <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#ffd700] font-mono uppercase tracking-wider">Stat Adjustments</span>
          <button
            onClick={() => setSwaps({})}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reset All
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {statKeys.map(({ key, label, step, unit }) => {
            const val = swaps[key as string] || 0;
            return (
              <div key={key} className="bg-[#1a1a1d]/60 border border-[#3d3d45] rounded-lg p-2">
                <div className="text-[9px] text-slate-400 font-mono mb-1">{label}</div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSwaps(prev => ({ ...prev, [key]: (prev[key as string] || 0) - 1 }))}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0"
                  >−</button>
                  <div className="flex-1 text-center">
                    <span className={`text-xs font-mono font-bold ${val > 0 ? "text-emerald-400" : val < 0 ? "text-rose-400" : "text-slate-400"}`}>
                      {val > 0 ? "+" : ""}{val * step}{unit}
                    </span>
                  </div>
                  <button
                    onClick={() => setSwaps(prev => ({ ...prev, [key]: (prev[key as string] || 0) + 1 }))}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0"
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DPS Impact Summary */}
      <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-4 shadow-md">
        <h3 className="text-xs font-semibold text-[#ffd700] font-mono uppercase tracking-wider mb-3">Rotation DPS Impact</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-[9px] text-slate-500 font-mono mb-1">BASE DMG</div>
            <div className="text-sm font-bold font-mono text-slate-200">{Math.round(baseDmg).toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 font-mono mb-1">SWAPPED DMG</div>
            <div className={`text-sm font-bold font-mono ${swapDmg > baseDmg ? "text-emerald-400" : swapDmg < baseDmg ? "text-rose-400" : "text-slate-200"}`}>
              {Math.round(swapDmg).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 font-mono mb-1">DELTA</div>
            <div className={`text-sm font-bold font-mono ${deltaPct > 0 ? "text-emerald-400" : deltaPct < 0 ? "text-rose-400" : "text-slate-400"}`}>
              {deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Marginal Gain Rankings */}
      <div className="bg-[#2d2d35] border border-[#3d3d45] rounded-xl p-4 shadow-md">
        <h3 className="text-xs font-semibold text-[#ffd700] font-mono uppercase tracking-wider mb-3">
          Marginal Gain per Stat Chunk (Current Panel)
        </h3>
        <div className="space-y-1.5">
          {gains.map(({ key, label, step, unit, pct }, idx) => {
            const maxPct = gains[0].pct;
            const fillPct = maxPct > 0 ? (pct / maxPct) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-2 text-[10px]">
                <span className="w-4 text-slate-600 font-mono text-right">{idx + 1}</span>
                <span className="w-28 text-slate-300 font-medium truncate">{label}</span>
                <span className="w-14 text-slate-500 font-mono text-right">+{step}{unit}</span>
                <div className="flex-1 h-1.5 bg-[#2d2d35] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${idx === 0 ? "bg-[#ffd700]" : idx <= 2 ? "bg-emerald-500" : "bg-slate-500"}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <span className={`w-12 font-mono text-right font-bold ${pct > 0 ? "text-[#ffd700]" : "text-slate-500"}`}>
                  +{pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
