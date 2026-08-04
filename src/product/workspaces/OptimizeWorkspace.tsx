import { ArrowRight, BarChart3, FlaskConical, Hammer, Layers3, Scale, Sparkles, Users } from "lucide-react";

const TOOLS = [
  { id: "priority", label: "Stat marginal gain", detail: "Rank the next stat by full-rotation damage gain.", group: "Improve", icon: BarChart3 },
  { id: "compare", label: "Compare gear", detail: "Replace one slot and rerun the complete build.", group: "Improve", icon: Scale },
  { id: "cultivate", label: "Cultivate", detail: "Review entered values and tuned lines.", group: "Improve", icon: Sparkles },
  { id: "best-build", label: "Best build", detail: "Search saved combinations by resulting panel and DPS.", group: "Plan", icon: Layers3 },
  { id: "transmute", label: "Transmute", detail: "Test a replacement stat against the current panel.", group: "Plan", icon: Hammer },
  { id: "bis", label: "Build reference", detail: "Inspect slot guidance without overriding the DPS model.", group: "Plan", icon: Layers3 },
  { id: "rotations", label: "Rotation lab", detail: "Model cast counts, buffs, debuffs, and phase timing.", group: "Advanced", icon: FlaskConical },
  { id: "skill-editor", label: "Skill editor", detail: "Preview coefficient changes only.", group: "Advanced", icon: FlaskConical },
  { id: "team", label: "Team compare", detail: "Compare saved profiles and team conditions.", group: "Advanced", icon: Users },
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
        <div><span className="product-kicker">Optimize</span><h1>Panel-first build optimizer</h1><p>Gear is ranked by the character panel and selected rotation it produces—not by proximity to a roll cap.</p></div>
      </header>
      <div className="optimize-layout">
        <nav className="optimize-tool-nav" aria-label="Optimization tools">
          {["Improve", "Plan", "Advanced"].map((group) => <div key={group}><h2>{group}</h2>{TOOLS.filter((tool) => tool.group === group).map(({ id, label, detail, icon: Icon }) => <button type="button" key={id} className={props.detailOpen && props.activeTool === id ? "is-active" : ""} onClick={() => props.onToolOpen(id)}><Icon size={17} aria-hidden="true" /><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={14} aria-hidden="true" /></button>)}</div>)}
        </nav>
        {!props.detailOpen && <div className="optimize-overview">
          <section className="optimize-score"><span>Current modeled rotation</span><strong>{Math.round(props.modeledDps).toLocaleString()} DPS</strong><p>{props.calibrated ? "Derived from the calibrated menu panel, combat conditions, and selected rotation." : "Provisional until the calculated menu panel is calibrated against the in-game Combat Attributes screen."}</p></section>
          <section className="optimize-readiness"><div className="product-section-heading"><div><h2>Model readiness</h2><p>Inputs required before trusting a recommendation</p></div></div><div><span className={props.equipped === 8 ? "is-ready" : ""}><b>{props.equipped}/8</b><small>Gear equipped</small></span><span className={props.innerWays === 4 ? "is-ready" : ""}><b>{props.innerWays}/4</b><small>Inner Ways</small></span><span className={props.calibrated ? "is-ready" : ""}><b>{props.calibrated ? "Matched" : "Required"}</b><small>In-game panel</small></span><span><b>{props.graduation.toFixed(1)}%</b><small>Legacy baseline reference</small></span></div></section>
          <section className="optimize-next"><div className="product-section-heading"><div><h2>Recommended next step</h2></div></div><strong>{!props.calibrated ? "Calibrate the calculated menu panel against the game first." : props.equipped < 8 ? "Equip one item in every modeled slot." : props.innerWays < 4 ? "Complete the four Inner Way slots and their conditions." : "Run Best Build, then verify the top replacement in Gear Compare."}</strong><p>Best Build evaluates complete gear combinations. Gear Compare replaces one slot, rebuilds the panel, applies set effects, and reruns the selected rotation.</p><button type="button" onClick={() => props.onToolOpen(!props.calibrated ? "manual" : props.equipped < 8 ? "cultivate" : props.innerWays < 4 ? "cultivate" : "best-build")}>Open recommended tool <ArrowRight size={15} aria-hidden="true" /></button></section>
        </div>}
      </div>
    </main>
  );
}
