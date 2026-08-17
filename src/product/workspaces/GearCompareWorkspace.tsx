import { ArrowRightLeft, Check, ChevronDown, Pencil, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { PATH_MODEL_MATURITY } from "../../data/modelTrust";

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

export interface GearCompareFixtureDiagnostic {
  label: string;
  observedDps: number;
  modeledDps: number;
  panelRows: { label: string; predicted: number; observed: number }[];
}

export interface GearCompareRow {
  id: string;
  slot: string;
  slotLabel: string;
  name: string;
  image: string;
  setName: string;
  subs: { type: string; value: string; tuned: boolean }[];
  modeledDps?: number;
  deltaDps?: number;
  deltaPct?: number;
  panelDelta?: GearComparePanelDelta[];
  factorDeltas?: GearCompareFactorDelta[];
  confidence?: "HIGH" | "MEDIUM" | "CLOSE CALL" | "EXPERIMENTAL";
  confidenceWhy?: string;
  unknowns?: readonly string[];
  fixtureDiagnostic?: GearCompareFixtureDiagnostic;
  setChange?: string;
  attunementChange?: string;
  reason?: string;
  score?: number;
  delta?: number;
  equipped: boolean;
}

interface Props {
  rows: GearCompareRow[];
  slots: { key: string; label: string }[];
  activeSlot: string;
  pathKey?: string;
  onSlotChange: (slot: string) => void;
  onEquip: (id: string) => void;
  onEdit: (id: string) => void;
}

const candidateDps = (row: GearCompareRow): number => row.modeledDps ?? row.score ?? 0;
const candidateDeltaPct = (row: GearCompareRow): number => row.deltaPct ?? row.delta ?? 0;
const candidateDeltaDps = (row: GearCompareRow): number => row.deltaDps ?? 0;
const formatDelta = (value: number, digits = 1) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
const confidenceLabel = (value?: GearCompareRow["confidence"]) => value ?? "MODELED";

export default function GearCompareWorkspace({ rows, slots, activeSlot, pathKey, onSlotChange, onEquip, onEdit }: Props) {
  const [query, setQuery] = useState("");
  const maturity = pathKey ? PATH_MODEL_MATURITY[pathKey] : undefined;
  const candidates = rows
    .filter((row) => (activeSlot === "ALL" || row.slot === activeSlot) && `${row.name} ${row.setName}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => candidateDps(b) - candidateDps(a));
  const current = candidates.find((row) => row.equipped) ?? rows.find((row) => row.slot === activeSlot && row.equipped);

  return <main className="compare-workspace compare-workspace-v2" id="main-content">
    <header className="product-page-heading">
      <div><span className="product-kicker">PvE / Compare</span><h1>Current vs Candidate</h1><p>See the decision first. Panel deltas, combat factors, evidence and observed/model diagnostics stay available below it.</p></div>
    </header>

    <nav className="compare-slot-tabs" aria-label="Compare gear slots">
      {slots.filter((slot) => slot.key !== "ALL").map((slot) => <button type="button" key={slot.key} className={activeSlot === slot.key ? "is-active" : ""} onClick={() => onSlotChange(slot.key)}>{slot.label}<small>{rows.filter((row) => row.slot === slot.key).length}</small></button>)}
    </nav>

    <section className="compare-summary compare-summary-v2" aria-label="Current build comparison context">
      <div><small>CURRENT</small><strong>{current?.name ?? "No equipped item"}</strong><span>{current?.setName ?? "Select a slot to compare"}</span></div>
      <ArrowRightLeft size={18} aria-hidden="true" />
      <div><small>DECISION BASIS</small><strong>Complete-build modeled DPS</strong><span>Same menu panel → set / Attunement → combat timeline</span></div>
      <label><Search size={16} aria-hidden="true" /><input type="search" placeholder="Filter candidates" aria-label="Filter comparison candidates" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    </section>

    {maturity && <details className="compare-model-context">
      <summary>Model context · {maturity.label}</summary>
      <p><strong>{maturity.ownership} · {maturity.maturity}</strong> · Evidence: {maturity.evidence.join(" + ")}. {maturity.summary}</p>
    </details>}

    <section className="compare-grid compare-grid-v2" aria-label="Gear comparison candidates">
      {candidates.map((row, index) => {
        const modeledDps = candidateDps(row);
        const deltaDps = candidateDeltaDps(row);
        const deltaPct = candidateDeltaPct(row);
        const positives = (row.factorDeltas ?? []).filter((factor) => factor.dpsDelta > 0).sort((a, b) => b.dpsDelta - a.dpsDelta).slice(0, 3);
        const negatives = (row.factorDeltas ?? []).filter((factor) => factor.dpsDelta < 0).sort((a, b) => a.dpsDelta - b.dpsDelta).slice(0, 3);
        const isRecommended = !row.equipped && deltaDps > 0 && index === candidates.findIndex((candidate) => !candidate.equipped && candidateDeltaDps(candidate) > 0);
        const resultLabel = row.equipped ? "CURRENT" : deltaDps > 0 ? (isRecommended ? "BEST IN VIEW" : "BETTER") : deltaDps < 0 ? "LOWER" : "EVEN";

        return <article key={row.id} className={`${row.equipped ? "is-current" : ""} ${isRecommended ? "is-recommended" : ""}`}>
          <header className="compare-candidate-heading">
            <img src={row.image} alt="" />
            <div><span className="compare-result-label">{resultLabel}</span><strong>{row.name}</strong><small>{row.slotLabel} · {row.setName}</small></div>
            <button type="button" onClick={() => onEdit(row.id)} aria-label={`Edit ${row.name}`}><Pencil size={15} /></button>
          </header>

          <section className="compare-primary-result" aria-label={`${row.name} result`}>
            <div><small>MODELED DPS</small><strong>{Math.round(modeledDps).toLocaleString()}</strong></div>
            <div className={deltaDps > 0 ? "is-positive" : deltaDps < 0 ? "is-negative" : ""}>
              {deltaDps > 0 ? <TrendingUp size={17} aria-hidden="true" /> : deltaDps < 0 ? <TrendingDown size={17} aria-hidden="true" /> : <ArrowRightLeft size={17} aria-hidden="true" />}
              <span><small>VS CURRENT</small><strong>{row.equipped ? "Baseline" : `${formatDelta(deltaDps, 0)} DPS · ${formatDelta(deltaPct, 2)}%`}</strong></span>
            </div>
            <span className={`compare-confidence is-${confidenceLabel(row.confidence).toLowerCase().replaceAll(" ", "-")}`}>{confidenceLabel(row.confidence)}</span>
          </section>

          {!row.equipped && <section className="compare-why">
            <h3>{deltaDps >= 0 ? "Why it wins" : "Why it loses"}</h3>
            {row.reason && <p>{row.reason}</p>}
            <div className="compare-factor-columns">
              <div><small>POSITIVE</small>{positives.length ? positives.map((factor, factorIndex) => <span key={`${factor.label}-${factorIndex}`} title={factor.note}><strong>{factor.label}</strong><b>+{Math.round(factor.dpsDelta)} DPS</b></span>) : <span><em>No positive modeled factor isolated.</em></span>}</div>
              <div><small>NEGATIVE</small>{negatives.length ? negatives.map((factor, factorIndex) => <span key={`${factor.label}-${factorIndex}`} title={factor.note}><strong>{factor.label}</strong><b>{Math.round(factor.dpsDelta)} DPS</b></span>) : <span><em>No negative modeled factor isolated.</em></span>}</div>
            </div>
            {row.confidenceWhy && <p className="compare-confidence-why"><strong>{confidenceLabel(row.confidence)}:</strong> {row.confidenceWhy}</p>}
            {!!row.unknowns?.length && <p className="compare-unknowns"><strong>Could reverse the call:</strong> {row.unknowns.slice(0, 2).join(" · ")}</p>}
          </section>}

          <details className="compare-advanced">
            <summary><ChevronDown size={15} aria-hidden="true" /><span>Advanced comparison details</span></summary>
            <div className="compare-advanced-body">
              <section><h4>Item lines</h4><div className="compare-lines">{row.subs.slice(0, 8).map((sub, subIndex) => <span key={`${sub.type}-${subIndex}`}><strong>{sub.type}{sub.tuned ? " (Retuned)" : ""}</strong><b>{sub.value}</b></span>)}</div></section>
              {!!row.panelDelta?.length && <section><h4>Menu Panel Delta</h4><div className="compare-panel-delta">{row.panelDelta.slice(0, 10).map((stat) => <span key={stat.label}><strong>{stat.label}</strong><em>{stat.current.toFixed(1)} → {stat.candidate.toFixed(1)}</em><b>{formatDelta(stat.delta)}</b></span>)}</div></section>}
              {!!row.factorDeltas?.length && <section><h4>Combat Delta · Marginal DPS</h4><div className="compare-panel-delta">{row.factorDeltas.slice(0, 14).map((factor, factorIndex) => <span key={`${factor.label}-${factorIndex}`} title={factor.note}><strong>{factor.label}</strong><em>{factor.evidence ?? "MODELED"}</em><b>{formatDelta(factor.dpsDelta, 0)} DPS</b></span>)}</div></section>}
              {(row.setChange || row.attunementChange) && <section className="compare-change-notes"><h4>Ownership changes</h4>{row.setChange && <p><strong>Set:</strong> {row.setChange}</p>}{row.attunementChange && <p><strong>Attunement:</strong> {row.attunementChange}</p>}</section>}
              {row.fixtureDiagnostic && <section className="compare-fixture-diagnostic"><h4>Modeled vs Observed · {row.fixtureDiagnostic.label}</h4><p><strong>DPS:</strong> {Math.round(row.fixtureDiagnostic.modeledDps).toLocaleString()} modeled vs {row.fixtureDiagnostic.observedDps.toLocaleString()} observed parse. Parse is diagnostic only; no auto-calibration is applied.</p><div className="compare-panel-delta">{row.fixtureDiagnostic.panelRows.map((stat) => <span key={stat.label}><strong>{stat.label}</strong><em>{stat.predicted.toFixed(1)} predicted</em><b>{stat.observed.toFixed(1)} observed</b></span>)}</div></section>}
            </div>
          </details>

          <footer>
            <span>{row.equipped ? <><Check size={14} aria-hidden="true" /> Current complete build</> : <>Candidate changes the complete build, not only this item's local score.</>}</span>
            {!row.equipped && <button type="button" className="is-primary" onClick={() => onEquip(row.id)}>Swap gear</button>}
          </footer>
        </article>;
      })}
      {!candidates.length && <div className="compare-empty"><strong>No candidates match this filter.</strong><span>Clear the search or choose another gear slot.</span></div>}
    </section>
  </main>;
}
