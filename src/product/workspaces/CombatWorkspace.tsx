import { useState } from "react";
import { Activity, Crosshair, Sparkles, Target, Timer, TrendingUp } from "lucide-react";

interface RankedOption {
  name: string;
  value: number;
  detail: string;
  active?: boolean;
  verified?: boolean;
}

interface CombatWorkspaceProps {
  ceiling: number;
  modeled: number;
  totalDamage: number;
  graduation: number;
  duration: number;
  efficiency: number;
  food: boolean;
  foodMin?: number;
  foodMax?: number;
  enemy: { name: string; defense: number; physicalResistance: number; attributeResistance: number };
  stats: { label: string; menu: string; combat: string; derived?: boolean }[];
  skills: { name: string; count: number; damage: number; share: number }[];
  innerWays: RankedOption[];
  sets: RankedOption[];
  rings: RankedOption[];
  priorities: RankedOption[];
  onEfficiencyChange: (value: number) => void;
  onFoodChange: (value: boolean) => void;
  onConfigure: () => void;
}

export default function CombatWorkspace(props: CombatWorkspaceProps) {
  const [tab, setTab] = useState<"overview" | "attributes" | "skills">("overview");
  const [recorded, setRecorded] = useState("");
  const parsed = Number(recorded) || 0;
  const foodMin = props.foodMin ?? 120;
  const foodMax = props.foodMax ?? 240;
  const parseProjection = props.modeled;

  return (
    <main className="combat-workspace product-combat-workspace" id="main-content">
      <header className="product-page-heading">
        <div><span className="product-kicker">Combat</span><h1>Damage model</h1><p>Panel-derived rotation output, active conditions and optional parse comparison.</p></div>
      </header>

      <section className="combat-metrics" aria-label="Damage estimates">
        <div className="is-primary"><span><Crosshair size={16} aria-hidden="true" /> Modeled rotation DPS</span><strong>{Math.round(props.ceiling).toLocaleString()}<small>/s</small></strong><p>This unscaled value drives Gear Compare, Stat Priority and Best Build.</p></div>
        <div><span><Activity size={16} aria-hidden="true" /> Parse projection</span><strong>{Math.round(parseProjection).toLocaleString()}<small>/s</small></strong><p>Presentation only: modeled DPS × {Math.round(props.efficiency * 100)}% execution scaling.</p></div>
        <div><span><Timer size={16} aria-hidden="true" /> Recorded parse</span><label><input inputMode="numeric" value={recorded} onChange={(event) => setRecorded(event.target.value.replace(/\D/g, ""))} placeholder="Enter DPS" /><small>/s</small></label><p>{parsed ? `${Math.round((parsed / Math.max(1, props.ceiling)) * 100)}% of modeled rotation DPS` : "Optional comparison; never changes the optimizer."}</p></div>
      </section>

      <section className="combat-assumptions product-assumption-panel">
        <div className="product-section-heading"><div><h2>Active combat assumptions</h2><p>Only game-state inputs belong in the primary model.</p></div><button type="button" className="product-secondary-button" onClick={props.onConfigure}>Configure build</button></div>
        <div className="combat-assumption-grid is-compact">
          <label className="product-switch"><input type="checkbox" checked={props.food} onChange={(event) => props.onFoodChange(event.target.checked)} /><span aria-hidden="true" /><strong>Attack-Boosting Food<small>+{foodMin} Min / +{foodMax} Max Physical Attack</small></strong></label>
          <div className="combat-enemy"><span>Target profile</span><strong>{props.enemy.name}</strong><small>DEF {props.enemy.defense} / Physical RES {props.enemy.physicalResistance}% / Attribute RES {props.enemy.attributeResistance}%</small></div>
          <div className="combat-rotation"><span>Reference window</span><strong>{props.duration}s</strong><small>{Math.round(props.totalDamage).toLocaleString()} modeled damage</small></div>
        </div>
        <details className="parse-projection-control">
          <summary>Advanced parse projection <strong>{Math.round(props.efficiency * 100)}%</strong></summary>
          <div>
            <p>Execution scaling approximates missed inputs, movement and imperfect uptime in a personal parse. It is not an in-game stat and is excluded from panel calculation, gear ranking and optimization.</p>
            <label><span>Execution scaling</span><input type="range" min="50" max="100" step="1" value={Math.round(props.efficiency * 100)} onChange={(event) => props.onEfficiencyChange(Number(event.target.value) / 100)} /></label>
          </div>
        </details>
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
            <div><h2>Read this result</h2><dl><dt>Modeled rotation DPS</dt><dd>Uses the panel, verified coefficients, set/Inner Way conditions and selected cast mix. This is the optimizer reference.</dd><dt>Parse projection</dt><dd>Applies only the optional execution scale for presentation.</dd><dt>Recorded parse</dt><dd>Your in-game result for comparison. It never reverse-calibrates or changes gear ranking.</dd></dl></div>
          </div>
        )}
        {tab === "attributes" && <div className="combat-stat-table"><div><strong>Attribute</strong><strong>Menu</strong><strong>Combat</strong></div>{props.stats.map((stat) => <div key={stat.label} className={stat.derived ? "is-derived" : ""}><span>{stat.label}</span><span>{stat.menu}</span><strong>{stat.combat}</strong></div>)}</div>}
        {tab === "skills" && <div className="combat-skill-table"><div><strong>Skill</strong><strong>Casts</strong><strong>Damage</strong><strong>Share</strong></div>{props.skills.map((skill, index) => <div key={`${skill.name}-${index}`}><span>{skill.name}</span><span>{skill.count}</span><span>{Math.round(skill.damage).toLocaleString()}</span><strong>{skill.share.toFixed(1)}%</strong></div>)}</div>}
      </section>

      <section className="details-dashboard" aria-label="Build optimization summary">
        <article>
          <header><Sparkles size={18} aria-hidden="true" /><div><h2>Inner Ways</h2><p>Measured contribution from active attribute effects.</p></div><button type="button" onClick={props.onConfigure}>Configure</button></header>
          <div className="details-ranked-list">
            {props.innerWays.length ? props.innerWays.map((item) => <span key={item.name}><strong>{item.name}</strong><small>{item.detail}</small><b>{item.value >= 0 ? "+" : ""}{Math.round(item.value).toLocaleString()} DPS</b></span>) : <em>No Inner Ways selected.</em>}
          </div>
        </article>
        <article>
          <header><Target size={18} aria-hidden="true" /><div><h2>Set and ring choices</h2><p>Current build compared with available modeled options.</p></div><button type="button" onClick={props.onConfigure}>Configure</button></header>
          <div className="details-choice-group"><small>Weapon set</small>{props.sets.slice(0, 5).map((item) => <span key={item.name} className={item.active ? "is-active" : ""}><strong>{item.name}{item.active ? " (current)" : ""}</strong><b>{Math.round(item.value).toLocaleString()} DPS</b><em>{item.detail}</em></span>)}</div>
          <div className="details-choice-group"><small>Ring</small>{props.rings.map((item) => <span key={item.name} className={item.active ? "is-active" : ""}><strong>{item.name}{item.active ? " (current)" : ""}</strong><b>{Math.round(item.value).toLocaleString()} DPS</b></span>)}</div>
        </article>
        <article>
          <header><TrendingUp size={18} aria-hidden="true" /><div><h2>Stat priority</h2><p>Damage gained from one additional Global max roll.</p></div></header>
          <div className="details-priority-list">
            {props.priorities.slice(0, 10).map((item, index) => <span key={item.name}><i>{index + 1}</i><strong>{item.name}</strong><small>{item.detail}</small><b>+{Math.round(item.value).toLocaleString()}</b></span>)}
          </div>
        </article>
      </section>
    </main>
  );
}