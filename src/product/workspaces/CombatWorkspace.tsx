import { useState } from "react";
import { Activity, Crosshair, Timer } from "lucide-react";

interface CombatWorkspaceProps {
  ceiling: number;
  modeled: number;
  totalDamage: number;
  graduation: number;
  duration: number;
  efficiency: number;
  food: boolean;
  enemy: { name: string; defense: number; physicalResistance: number; attributeResistance: number };
  stats: { label: string; menu: string; combat: string; derived?: boolean }[];
  skills: { name: string; count: number; damage: number; share: number }[];
  onEfficiencyChange: (value: number) => void;
  onFoodChange: (value: boolean) => void;
}

export default function CombatWorkspace(props: CombatWorkspaceProps) {
  const [tab, setTab] = useState<"overview" | "attributes" | "skills">("overview");
  const [recorded, setRecorded] = useState("");
  const parsed = Number(recorded) || 0;

  return (
    <main className="combat-workspace" id="main-content">
      <header className="product-page-heading">
        <div><span className="product-kicker">Combat</span><h1>Damage model</h1><p>Inspect the assumptions and output without changing the reference rotation.</p></div>
      </header>

      <section className="combat-metrics" aria-label="Damage estimates">
        <div><span><Crosshair size={16} aria-hidden="true" /> Formula ceiling</span><strong>{Math.round(props.ceiling).toLocaleString()}<small>/s</small></strong><p>Perfect reference rotation and full modeled uptime.</p></div>
        <div className="is-primary"><span><Activity size={16} aria-hidden="true" /> Modeled estimate</span><strong>{Math.round(props.modeled).toLocaleString()}<small>/s</small></strong><p>Formula ceiling at {Math.round(props.efficiency * 100)}% execution efficiency.</p></div>
        <div><span><Timer size={16} aria-hidden="true" /> Recorded parse</span><label><input inputMode="numeric" value={recorded} onChange={(event) => setRecorded(event.target.value.replace(/\D/g, ""))} placeholder="Enter DPS" /><small>/s</small></label><p>{parsed ? `${Math.round((parsed / props.modeled) * 100)}% of modeled estimate` : "Optional comparison; never changes the formula."}</p></div>
      </section>

      <section className="combat-assumptions">
        <div className="product-section-heading"><div><h2>Model assumptions</h2><p>Every active modifier is visible here.</p></div></div>
        <div className="combat-assumption-grid">
          <label className="product-switch"><input type="checkbox" checked={props.food} onChange={(event) => props.onFoodChange(event.target.checked)} /><span aria-hidden="true" /><strong>Food buff<small>+90 min / +180 max Physical ATK</small></strong></label>
          <label className="combat-efficiency"><span>Execution efficiency <strong>{Math.round(props.efficiency * 100)}%</strong></span><input type="range" min="50" max="100" step="1" value={Math.round(props.efficiency * 100)} onChange={(event) => props.onEfficiencyChange(Number(event.target.value) / 100)} /></label>
          <div className="combat-enemy"><span>Target profile</span><strong>{props.enemy.name}</strong><small>DEF {props.enemy.defense} / Physical RES {props.enemy.physicalResistance}% / Attribute RES {props.enemy.attributeResistance}%</small></div>
          <div className="combat-rotation"><span>Reference window</span><strong>{props.duration}s</strong><small>{Math.round(props.totalDamage).toLocaleString()} total damage / {props.graduation.toFixed(2)}% graduation</small></div>
        </div>
      </section>

      <section className="combat-results">
        <nav className="product-subtabs" aria-label="Combat result views">
          <button type="button" className={tab === "overview" ? "is-active" : ""} onClick={() => setTab("overview")}>Overview</button>
          <button type="button" className={tab === "attributes" ? "is-active" : ""} onClick={() => setTab("attributes")}>Attributes</button>
          <button type="button" className={tab === "skills" ? "is-active" : ""} onClick={() => setTab("skills")}>Skill contribution</button>
        </nav>
        {tab === "overview" && (
          <div className="combat-overview-grid">
            <div><h2>Damage distribution</h2>{props.skills.slice(0, 6).map((skill, index) => <span key={`${skill.name}-${index}`}><small>{skill.name}</small><i><b style={{ width: `${Math.max(2, skill.share)}%` }} /></i><strong>{skill.share.toFixed(1)}%</strong></span>)}</div>
            <div><h2>Read this result</h2><dl><dt>Ceiling</dt><dd>Uses the verified skill coefficients and reference cast mix.</dd><dt>Modeled</dt><dd>Applies only the execution slider to the ceiling.</dd><dt>Recorded</dt><dd>Your in-game parse for comparison only. It is not reverse-engineered into the formula.</dd></dl></div>
          </div>
        )}
        {tab === "attributes" && <div className="combat-stat-table"><div><strong>Attribute</strong><strong>Menu</strong><strong>Combat</strong></div>{props.stats.map((stat) => <div key={stat.label} className={stat.derived ? "is-derived" : ""}><span>{stat.label}</span><span>{stat.menu}</span><strong>{stat.combat}</strong></div>)}</div>}
        {tab === "skills" && <div className="combat-skill-table"><div><strong>Skill</strong><strong>Casts</strong><strong>Damage</strong><strong>Share</strong></div>{props.skills.map((skill, index) => <div key={`${skill.name}-${index}`}><span>{skill.name}</span><span>{skill.count}</span><span>{Math.round(skill.damage).toLocaleString()}</span><strong>{skill.share.toFixed(1)}%</strong></div>)}</div>}
      </section>
    </main>
  );
}
