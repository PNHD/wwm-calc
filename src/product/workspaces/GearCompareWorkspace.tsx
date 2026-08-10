import { ArrowRightLeft, Check, Pencil, Search } from "lucide-react";
import { useState } from "react";

export interface GearComparePanelDelta {
  label: string;
  current: number;
  candidate: number;
  delta: number;
}

export interface GearCompareFactorDelta {
  label: string;
  dpsDelta: number;
  evidence?: string;
  note?: string;
}

export interface GearCompareRow {
  id: string;
  slot: string;
  slotLabel: string;
  name: string;
  image: string;
  setName: string;
  subs: { type: string; value: string; tuned: boolean }[];
  /** Full rotation DPS after replacing the current item in this slot. */
  modeledDps?: number;
  /** Absolute DPS change against the currently equipped complete build. */
  deltaDps?: number;
  /** Percentage DPS change against the currently equipped complete build. */
  deltaPct?: number;
  /** Deterministic menu-panel fields most affected by this replacement. */
  panelDelta?: GearComparePanelDelta[];
  /** Leave-one-factor-out marginal DPS effects; interactions are intentionally not disguised as additive weights. */
  factorDeltas?: GearCompareFactorDelta[];
  /** Deterministic evidence-based recommendation category, never a statistical percentage. */
  confidence?: "HIGH" | "MEDIUM" | "CLOSE CALL" | "EXPERIMENTAL";
  confidenceWhy?: string;
  unknowns?: readonly string[];
  /** Set ownership change caused by the replacement, if any. */
  setChange?: string;
  /** Attunement change caused by the replacement, if any. */
  attunementChange?: string;
  /** Human-readable modeled reason for the result. */
  reason?: string;
  /** Legacy pre-migration values, accepted only so source lint can run before build migrations. */
  score?: number;
  delta?: number;
  equipped: boolean;
}

interface Props {
  rows: GearCompareRow[];
  slots: { key: string; label: string }[];
  activeSlot: string;
  onSlotChange: (slot: string) => void;
  onEquip: (id: string) => void;
  onEdit: (id: string) => void;
}

const candidateDps = (row: GearCompareRow): number => row.modeledDps ?? row.score ?? 0;
const candidateDeltaPct = (row: GearCompareRow): number => row.deltaPct ?? row.delta ?? 0;
const candidateDeltaDps = (row: GearCompareRow): number => row.deltaDps ?? 0;
const formatDelta = (value: number, digits = 1) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;

export default function GearCompareWorkspace({ rows, slots, activeSlot, onSlotChange, onEquip, onEdit }: Props) {
  const [query, setQuery] = useState("");
  const candidates = rows
    .filter((row) => (activeSlot === "ALL" || row.slot === activeSlot) && `${row.name} ${row.setName}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => candidateDps(b) - candidateDps(a));
  const current = candidates.find((row) => row.equipped) ?? rows.find((row) => row.slot === activeSlot && row.equipped);

  return <main className="compare-workspace" id="main-content">
    <header className="product-page-heading"><div><span className="product-kicker">Gear Compare</span><h1>Current → Candidate</h1><p>BUILD → GEAR → COMPARE → BEST BUILD. Each candidate rebuilds the menu panel, set/attunement ownership and the same combat timeline before ranking.</p></div></header>
    <nav className="compare-slot-tabs" aria-label="Compare gear slots">{slots.filter((slot) => slot.key !== "ALL").map((slot) => <button type="button" key={slot.key} className={activeSlot === slot.key ? "is-active" : ""} onClick={() => onSlotChange(slot.key)}>{slot.label}<small>{rows.filter((row) => row.slot === slot.key).length}</small></button>)}</nav>
    <section className="compare-summary"><div><small>Current</small><strong>{current?.name ?? "No gear selected"}</strong></div><ArrowRightLeft size={20} aria-hidden="true" /><div><small>Combat evaluation</small><strong>Menu panel → eligibility → timeline → DPS</strong></div><label><Search size={16} aria-hidden="true" /><input type="search" placeholder="Filter candidates" value={query} onChange={(event) => setQuery(event.target.value)} /></label></section>
    <section className="compare-grid" aria-label="Gear comparison candidates">{candidates.map((row) => {
      const modeledDps = candidateDps(row);
      const deltaDps = candidateDeltaDps(row);
      const deltaPct = candidateDeltaPct(row);
      const positives = (row.factorDeltas ?? []).filter((factor) => factor.dpsDelta > 0).sort((a, b) => b.dpsDelta - a.dpsDelta).slice(0, 3);
      const negatives = (row.factorDeltas ?? []).filter((factor) => factor.dpsDelta < 0).sort((a, b) => a.dpsDelta - b.dpsDelta).slice(0, 3);
      return <article key={row.id} className={row.equipped ? "is-current" : ""}>
        <header><img src={row.image} alt="" /><div><strong>{row.name}</strong><small>{row.slotLabel} / {row.setName}</small></div><b>{Math.round(modeledDps).toLocaleString()} DPS</b></header>
        <div className="compare-lines">{row.subs.slice(0, 6).map((sub, index) => <span key={`${sub.type}-${index}`}><strong>{sub.type}{sub.tuned ? " (Retuned)" : ""}</strong><b>{sub.value}</b></span>)}</div>
        {!!row.panelDelta?.length && <div className="compare-panel-delta"><small>MENU PANEL DELTA</small>{row.panelDelta.slice(0, 8).map((stat) => <span key={stat.label}><strong>{stat.label}</strong><em>{stat.current.toFixed(1)} → {stat.candidate.toFixed(1)}</em><b>{formatDelta(stat.delta)}</b></span>)}</div>}
        {!!row.factorDeltas?.length && <div className="compare-panel-delta"><small>COMBAT DELTA · MARGINAL DPS</small>{row.factorDeltas.slice(0, 10).map((factor) => <span key={factor.label} title={factor.note}><strong>{factor.label}</strong><em>{factor.evidence ?? "MODELED"}</em><b>{formatDelta(factor.dpsDelta, 0)} DPS</b></span>)}</div>}
        {(positives.length > 0 || negatives.length > 0 || row.reason) && <div className="compare-explanation"><p><strong>WHY</strong></p>{positives.length > 0 && <p><strong>Top positive:</strong> {positives.map((x) => `${x.label} ${formatDelta(x.dpsDelta, 0)}`).join(" · ")}</p>}{negatives.length > 0 && <p><strong>Top negative:</strong> {negatives.map((x) => `${x.label} ${formatDelta(x.dpsDelta, 0)}`).join(" · ")}</p>}{row.reason && <p>{row.reason}</p>}</div>}
        {(row.setChange || row.attunementChange) && <div className="compare-explanation">{row.setChange && <p><strong>Set:</strong> {row.setChange}</p>}{row.attunementChange && <p><strong>Attunement:</strong> {row.attunementChange}</p>}</div>}
        {row.confidence && <div className="compare-explanation"><p><strong>CONFIDENCE: {row.confidence}</strong></p>{row.confidenceWhy && <p>{row.confidenceWhy}</p>}{!!row.unknowns?.length && <p><strong>Could reverse ranking:</strong> {row.unknowns.slice(0, 2).join(" · ")}</p>}</div>}
        <footer><span>{row.equipped ? <><Check size={14} aria-hidden="true" /> Current complete build</> : <>Modeled delta {deltaDps >= 0 ? "+" : ""}{Math.round(deltaDps).toLocaleString()} DPS ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(2)}%)</>}</span><button type="button" onClick={() => onEdit(row.id)} aria-label={`Edit ${row.name}`}><Pencil size={15} /></button>{!row.equipped && <button type="button" className="is-primary" onClick={() => onEquip(row.id)}>Swap gear</button>}</footer>
      </article>;
    })}</section>
  </main>;
}
