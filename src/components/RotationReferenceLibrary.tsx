import { useState } from "react";
import references from "../data/umbraReferences.json";
import { normalizeReference, type RotationPreset, type RotationReference } from "../utils/rotationPresets";

export default function RotationReferenceLibrary({ saved, onSave, onExport }: { saved: RotationPreset[]; onSave: (reference: RotationReference) => void; onExport: (reference: RotationReference) => void }) {
  const library = [...references, ...saved.flatMap(p => { const ref = normalizeReference(p.reference); return ref ? [ref] : []; })];
  const [selected, setSelected] = useState(library[0].id);
  const ref = library.find(r => r.id === selected) ?? library[0];
  const unsupported = [...new Set(ref.steps.map(step => step.skillId))];
  return <details data-testid="umbra-reference-library">
    <summary>Umbra upstream rotation references · 5 authored sequences</summary>
    <label>Authored reference <select value={ref.id} onChange={e => setSelected(e.target.value)}>{library.map((r, i) => <option key={`${r.id}:${i}`} value={r.id}>{r.name} · {r.fixedWindowSec}s</option>)}</select></label>
    <p>{ref.maturity} · {ref.classId} · {ref.source.repository}@{ref.source.sha.slice(0, 8)} · {ref.source.license}. {ref.source.anchor}</p>
    <p>Qi break {ref.qiBreak.startSec}s for {ref.qiBreak.durationSec}s; low-Qi lead {ref.qiBreak.lowQiLeadSec}s. Opening stacks: {JSON.stringify(ref.openingStacks)}.</p>
    <p role="status">Numerical use unavailable: {unsupported.length} skill IDs lack verified Global timing/effect mapping. Saving a reference preserves the current build and cast-count edits.</p>
    <button type="button" onClick={() => onSave(ref)}>Save as reference</button>
    <button type="button" onClick={() => onExport(ref)}>Export reference JSON</button>
    <details><summary>Inspect ordered steps and unsupported IDs ({ref.steps.length} steps)</summary><ol>{ref.steps.map((step, i) => <li key={i}><code style={{ overflowWrap: "anywhere" }}>{step.skillId}</code> · unsupported</li>)}</ol></details>
  </details>;
}
