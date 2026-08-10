import React from "react";

interface Props {
  result: any;
  objective: string;
  onObjectiveChange: (value: string) => void;
  scenario: any;
  onScenarioChange: (patch: Record<string, unknown>) => void;
  advice: string[];
  priorities?: { name: string; dps: number }[];
}

const metric = (label: string, value: React.ReactNode, note?: string) => (
  <div className="rounded-lg border border-[#2a2e35] bg-[#111317] px-3 py-2">
    <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    <div className="mt-0.5 text-sm font-bold text-slate-100">{value}</div>
    {note && <div className="mt-0.5 text-[10px] text-slate-500">{note}</div>}
  </div>
);

export default function JadeHealthPanel({ result, objective, onObjectiveChange, scenario, onScenarioChange, advice, priorities = [] }: Props) {
  if (!result) return null;
  const d = result.diagnostics;
  return (
    <section className="mb-4 rounded-xl border border-teal-900/60 bg-[#141719] p-4" data-testid="jade-health-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-400">Silkbind-Jade · Global 2.0</div>
          <h3 className="mt-1 text-base font-extrabold text-slate-100">Jade Health</h3>
          <p className="mt-1 max-w-2xl text-[11px] text-slate-500">State/resource priority planner. Damage events are priced by the shared product outcome engine; community targets are advisory only.</p>
        </div>
        <label className="text-[10px] uppercase tracking-wider text-slate-500">
          Objective
          <select className="ml-2 rounded-md border border-[#30343b] bg-[#0f1114] px-2 py-1.5 text-xs normal-case text-slate-200" value={objective} onChange={(e) => onObjectiveChange(e.target.value)}>
            <option value="expected-dps">Expected DPS</option>
            <option value="short-fight-burst">Short-fight Burst</option>
            <option value="speedrun-ceiling">Speedrun Ceiling · community</option>
            <option value="team-dps">Team DPS / Bitter Duty</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        {metric("Precision", `${d.precision.toFixed(1)} / 100%`, d.precisionGap > 0 ? `${d.precisionGap.toFixed(1)}% below target` : "effective cap")}
        {metric("Effective Crit", `${d.effectiveCrit.toFixed(1)} / 80%`)}
        {metric("Direct Crit", `${d.directCrit.toFixed(1)}%`, scenario.blossomDirectCritPct > 0 ? "includes Jade override" : "Blossom numeric unresolved")}
        {metric("Affinity", `${d.affinity.toFixed(1)}%`, `rate budget ${d.rateBudget.toFixed(1)}%`)}
        {metric("Max Physical", Math.round(d.maxPhysical).toLocaleString())}
        {metric("Modeled DPS", Math.round(result.dps).toLocaleString(), result.objectiveLabel)}
        {metric("Drone uptime", `${d.droneUptimePct.toFixed(1)}%`, `${d.dronesPer60.toFixed(1)} drones / 60s`)}
        {metric("Avg redrone gap", `${d.averageDroneDowntime.toFixed(2)}s`)}
        {metric("Combo uptime", `${d.comboUptimePct.toFixed(1)}%`)}
        {metric("Jadebreak uptime", `${d.jadebreakUptimePct.toFixed(1)}%`)}
        {metric("Lingering Bone", `${d.lingeringBoneCoveragePct.toFixed(1)}%`, "Drone coverage")}
        {metric("Qi-break Drone", `${d.qiBreakDroneUptimePct.toFixed(1)}%`, `+${d.qiBreakDroneExtensionSec.toFixed(1)}s modeled extension`)}
        {metric("Petal waste", d.petalsWasted.toFixed(2), `${d.refundedBlossoms} Blossoms refunded`)}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-[#262a31] bg-[#101215] p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Why this build</div>
          <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
            {advice.slice(0, 5).map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
        <div className="rounded-lg border border-[#262a31] bg-[#101215] p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dynamic stat priority</div>
          <div className="mt-2 space-y-1 text-[11px] text-slate-300">
            {priorities.slice(0, 5).map((p) => <div key={p.name} className="flex justify-between gap-3"><span>{p.name}</span><b>{p.dps >= 0 ? "+" : ""}{Math.round(p.dps).toLocaleString()} DPS / roll</b></div>)}
          </div>
        </div>
      </div>

      <details className="mt-3 rounded-lg border border-[#262a31] bg-[#101215] p-3">
        <summary className="cursor-pointer text-xs font-bold text-slate-300">Jade Advanced / scenario</summary>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="text-[10px] text-slate-500">Fight duration<input className="mt-1 w-full rounded border border-[#30343b] bg-[#0d0f12] p-1.5 text-xs text-slate-200" type="number" min={10} max={300} value={scenario.duration} onChange={(e)=>onScenarioChange({duration:Number(e.target.value)})}/></label>
          <label className="text-[10px] text-slate-500">First Qi break<input className="mt-1 w-full rounded border border-[#30343b] bg-[#0d0f12] p-1.5 text-xs text-slate-200" type="number" min={0} max={300} value={scenario.firstQiBreakTime} onChange={(e)=>onScenarioChange({firstQiBreakTime:Number(e.target.value)})}/></label>
          <label className="text-[10px] text-slate-500">Qi break duration<input className="mt-1 w-full rounded border border-[#30343b] bg-[#0d0f12] p-1.5 text-xs text-slate-200" type="number" min={0} max={60} value={scenario.qiBreakDuration} onChange={(e)=>onScenarioChange({qiBreakDuration:Number(e.target.value)})}/></label>
          <label className="text-[10px] text-slate-500">Blossom Direct Crit %<input className="mt-1 w-full rounded border border-[#30343b] bg-[#0d0f12] p-1.5 text-xs text-slate-200" type="number" min={0} max={30} step={0.1} value={scenario.blossomDirectCritPct} onChange={(e)=>onScenarioChange({blossomDirectCritPct:Number(e.target.value)})}/><span className="mt-1 block text-[9px] text-amber-500">UNKNOWN by default; enter current client tooltip only.</span></label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={scenario.perfectDodge} onChange={(e)=>onScenarioChange({perfectDodge:e.target.checked})}/> Perfect Dodge skilled</label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={scenario.bitterSuppliedByTeammate} onChange={(e)=>onScenarioChange({bitterSuppliedByTeammate:e.target.checked})}/> Bitter supplied by teammate</label>
          <label className="text-[10px] text-slate-500">Jade count<select className="mt-1 w-full rounded border border-[#30343b] bg-[#0d0f12] p-1.5 text-xs text-slate-200" value={scenario.jadeCount} onChange={(e)=>onScenarioChange({jadeCount:Number(e.target.value)})}><option value={1}>1 / solo</option><option value={2}>2+</option></select></label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={scenario.lingerBridging} disabled={scenario.jadeCount < 2} onChange={(e)=>onScenarioChange({lingerBridging:e.target.checked})}/> Multi-Jade Linger bridging</label>
        </div>
        <div className="mt-3 text-[10px] text-slate-500">Flute distance bonus: <b>UNRESOLVED / disabled</b>. White Body uses event-level Qi-break extension; the guide's ~2.5× observation is not hard-coded.</div>
      </details>
    </section>
  );
}
