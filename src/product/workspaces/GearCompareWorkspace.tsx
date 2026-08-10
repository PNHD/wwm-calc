import { ArrowRightLeft, Check, Pencil, Search } from "lucide-react";
import { useState } from "react";

export interface GearComparePanelDelta {
  label: string;
  current: number;
  candidate: number;
  delta: number;
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
    <header className="product-page-heading"><div><span className="product-kicker">Gear Compare</span><h1>Compare complete-build replacements</h1><p>Each candidate replaces the equipped item, rebuilds the menu panel and set ownership, applies the same combat timeline, then reruns the selected rotation.</p></div></header>
    <nav className="compare-slot-tabs" aria-label="Compare gear slots">{slots.filter((slot) => slot.key !== "ALL").map((slot) => <button type="button" key={slot.key} className={activeSlot === slot.key ? "is-active" : ""} onClick={() => onSlotChange(slot.key)}>{slot.label}<small>{rows.filter((row) => row.slot === slot.key).length}</small></button>)}</nav>
    <section className="compare-summary"><div><small>Current equipped</small><strong>{current?.name ?? "No gear selected"}</strong></div><ArrowRightLeft size={20} aria-hidden="true" /><div><small>Evaluation</small><strong>Menu panel + combat timeline + rotation</strong></div><label><Search size={16} aria-hidden="true" /><input type="search" placeholder="Filter candidates" value={query} onChange={(event) => setQuery(event.target.value)} /></label></section>
    <section className="compare-grid" aria-label="Gear comparison candidates">{candidates.map((row) => {
      const modeledDps = candidateDps(row);
      const deltaDps = candidateDeltaDps(row);
      const deltaPct = candidateDeltaPct(row);
      return <article key={row.id} className={row.equipped ? "is-current" : ""}>
        <header><img src={row.image} alt="" /><div><strong>{row.name}</strong><small>{row.slotLabel} / {row.setName}</small></div><b>{Math.round(modeledDps).toLocaleString()} DPS</b></header>
        <div className="compare-lines">{row.subs.slice(0, 6).map((sub, index) => <span key={`${sub.type}-${index}`}><strong>{sub.type}{sub.tuned ? " (Retuned)" : ""}</strong><b>{sub.value}</b></span>)}</div>
        {!!row.panelDelta?.length && <div className="compare-panel-delta"><small>MENU PANEL DELTA</small>{row.panelDelta.slice(0, 6).map((stat) => <span key={stat.label}><strong>{stat.label}</strong><em>{stat.current.toFixed(1)} → {stat.candidate.toFixed(1)}</em><b>{formatDelta(stat.delta)}</b></span>)}</div>}
        {(row.setChange || row.attunementChange || row.reason) && <div className="compare-explanation">{row.setChange && <p><strong>Set:</strong> {row.setChange}</p>}{row.attunementChange && <p><strong>Attunement:</strong> {row.attunementChange}</p>}{row.reason && <p><strong>Why:</strong> {row.reason}</p>}</div>}
        <footer><span>{row.equipped ? <><Check size={14} aria-hidden="true" /> Current complete build</> : <>{deltaDps >= 0 ? "+" : ""}{Math.round(deltaDps).toLocaleString()} DPS ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(2)}%)</>}</span><button type="button" onClick={() => onEdit(row.id)} aria-label={`Edit ${row.name}`}><Pencil size={15} /></button>{!row.equipped && <button type="button" className="is-primary" onClick={() => onEquip(row.id)}>Swap gear</button>}</footer>
      </article>;
    })}</section>
  </main>;
}
