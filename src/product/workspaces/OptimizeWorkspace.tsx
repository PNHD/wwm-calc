import { ArrowRight, BarChart3, FlaskConical, Hammer, Layers3, Scale, Sparkles, Users } from "lucide-react";

const TOOLS = [
  { id: "priority", label: "Stat priority", detail: "Rank the next substat roll by damage gain.", group: "Improve", icon: BarChart3 },
  { id: "compare", label: "Compare gear", detail: "Find the weakest equipped slot.", group: "Improve", icon: Scale },
  { id: "cultivate", label: "Cultivate", detail: "Review substats and tuned lines.", group: "Improve", icon: Sparkles },
  { id: "best-build", label: "Best build", detail: "Search every saved gear combination.", group: "Plan", icon: Layers3 },
  { id: "transmute", label: "Transmute", detail: "Test a replacement substat.", group: "Plan", icon: Hammer },
  { id: "bis", label: "BiS reference", detail: "Inspect ideal stats by slot.", group: "Plan", icon: Layers3 },
  { id: "rotations", label: "Rotation lab", detail: "Advanced cast-count theorycrafting.", group: "Advanced", icon: FlaskConical },
  { id: "skill-editor", label: "Skill editor", detail: "Preview coefficient changes only.", group: "Advanced", icon: FlaskConical },
  { id: "team", label: "Team compare", detail: "Compare saved profiles.", group: "Advanced", icon: Users },
] as const;

interface OptimizeWorkspaceProps {
  graduation: number;
  modeledDps: number;
  equipped: number;
  innerWays: number;
  calibrated: boolean;
  detailOpen: boolean;
  activeTool: string;
  onToolOpen: (id: string) => void;
}

export default function OptimizeWorkspace(props: OptimizeWorkspaceProps) {
  return (
    <main className={`optimize-workspace ${props.detailOpen ? "has-detail" : ""}`} id="main-content">
      <header className="product-page-heading">
        <div><span className="product-kicker">Optimize</span><h1>Graduation workshop</h1><p>Choose one decision at a time; every tool uses the current build context.</p></div>
      </header>
      <div className="optimize-layout">
        <nav className="optimize-tool-nav" aria-label="Optimization tools">
          {["Improve", "Plan", "Advanced"].map((group) => <div key={group}><h2>{group}</h2>{TOOLS.filter((tool) => tool.group === group).map(({ id, label, detail, icon: Icon }) => <button type="button" key={id} className={props.detailOpen && props.activeTool === id ? "is-active" : ""} onClick={() => props.onToolOpen(id)}><Icon size={17} aria-hidden="true" /><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={14} aria-hidden="true" /></button>)}</div>)}
        </nav>
        {!props.detailOpen && <div className="optimize-overview">
          <section className="optimize-score"><span>Current graduation</span><strong>{props.graduation.toFixed(2)}%</strong><p>Relative to the selected Global tier baseline.</p></section>
          <section className="optimize-readiness"><div className="product-section-heading"><div><h2>Build readiness</h2><p>Inputs required for useful recommendations</p></div></div><div><span className={props.equipped === 8 ? "is-ready" : ""}><b>{props.equipped}/8</b><small>Gear equipped</small></span><span className={props.innerWays === 4 ? "is-ready" : ""}><b>{props.innerWays}/4</b><small>Inner Ways</small></span><span className={props.calibrated ? "is-ready" : ""}><b>{props.calibrated ? "Yes" : "No"}</b><small>Panel calibrated</small></span><span className="is-ready"><b>{Math.round(props.modeledDps).toLocaleString()}</b><small>Modeled DPS</small></span></div></section>
          <section className="optimize-next"><div className="product-section-heading"><div><h2>Recommended next step</h2></div></div><strong>{!props.calibrated ? "Calibrate the panel before ranking upgrades." : props.innerWays < 4 ? "Complete the four Inner Way slots." : "Run Compare gear to identify the weakest slot."}</strong><p>Recommendations are only as reliable as the active gear, path, tier, and conditional effects shown in the context bar.</p><button type="button" onClick={() => props.onToolOpen(!props.calibrated ? "manual" : props.innerWays < 4 ? "cultivate" : "compare")}>Open recommended tool <ArrowRight size={15} aria-hidden="true" /></button></section>
        </div>}
      </div>
    </main>
  );
}
