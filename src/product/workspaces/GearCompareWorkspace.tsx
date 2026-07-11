import { ArrowRightLeft, Check, Pencil, Search } from "lucide-react";
import { useState } from "react";

export interface GearCompareRow {
  id: string;
  slot: string;
  slotLabel: string;
  name: string;
  image: string;
  setName: string;
  subs: { type: string; value: string; tuned: boolean }[];
  score: number;
  delta: number;
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

export default function GearCompareWorkspace({ rows, slots, activeSlot, onSlotChange, onEquip, onEdit }: Props) {
  const [query, setQuery] = useState("");
  const candidates = rows.filter((row) => (activeSlot === "ALL" || row.slot === activeSlot) && `${row.name} ${row.setName}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.score - a.score);
  const current = candidates.find((row) => row.equipped) ?? rows.find((row) => row.slot === activeSlot && row.equipped);

  return <main className="compare-workspace" id="main-content">
    <header className="product-page-heading"><div><span className="product-kicker">Gear Compare</span><h1>Compare replacements</h1><p>Review every candidate against the equipped item, then swap with one action.</p></div></header>
    <nav className="compare-slot-tabs" aria-label="Compare gear slots">{slots.filter((slot) => slot.key !== "ALL").map((slot) => <button type="button" key={slot.key} className={activeSlot === slot.key ? "is-active" : ""} onClick={() => onSlotChange(slot.key)}>{slot.label}<small>{rows.filter((row) => row.slot === slot.key).length}</small></button>)}</nav>
    <section className="compare-summary"><div><small>Current equipped</small><strong>{current?.name ?? "No gear selected"}</strong></div><ArrowRightLeft size={20} aria-hidden="true" /><div><small>Showing</small><strong>{candidates.length} candidates</strong></div><label><Search size={16} aria-hidden="true" /><input type="search" placeholder="Filter candidates" value={query} onChange={(event) => setQuery(event.target.value)} /></label></section>
    <section className="compare-grid" aria-label="Gear comparison candidates">{candidates.map((row) => <article key={row.id} className={row.equipped ? "is-current" : ""}><header><img src={row.image} alt="" /><div><strong>{row.name}</strong><small>{row.slotLabel} / {row.setName}</small></div><b>{row.score.toFixed(2)}%</b></header><div className="compare-lines">{row.subs.slice(0, 6).map((sub, index) => <span key={`${sub.type}-${index}`}><strong>{sub.type}{sub.tuned ? " (tuned)" : ""}</strong><b>{sub.value}</b></span>)}</div><footer><span>{row.equipped ? <><Check size={14} aria-hidden="true" /> Current</> : `${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(2)}% graduation vs current`}</span><button type="button" onClick={() => onEdit(row.id)} aria-label={`Edit ${row.name}`}><Pencil size={15} /></button>{!row.equipped && <button type="button" className="is-primary" onClick={() => onEquip(row.id)}>Swap gear</button>}</footer></article>)}</section>
  </main>;
}
