import { useState, type ReactNode } from "react";
import { BarChart3, Boxes, Dice5, FileText, FlaskConical, Layers3, Repeat2, Settings, Shield, SlidersHorizontal, Users } from "lucide-react";
import GuildWarWorkspace from "./GuildWarWorkspace";
import "./model-assumptions.css";

export type ProductTab = "details" | "gear-analyzer" | "gear-compare" | "inventory-optimizer" | "simulation" | "team" | "rotations" | "skill-editor" | "settings" | "profile";
type ShellTab = ProductTab | "guild-war";

// Primary journey is intentionally ordered by the decision the product must help
// the player make: configure build -> enter gear -> compare -> optimize -> inspect
// combat details. GvG is an isolated product workspace so it cannot silently reuse
// the PvE DPS ranking as a Guild War ranking.
const NAV = [
  { key: "settings", label: "Build", hint: "Path & assumptions", icon: Settings },
  { key: "gear-analyzer", label: "Gear", hint: "Inventory", icon: Boxes },
  { key: "gear-compare", label: "Compare", hint: "Full-build swap", icon: SlidersHorizontal },
  { key: "inventory-optimizer", label: "Best Build", hint: "DPS ranking", icon: Layers3 },
  { key: "details", label: "Combat", hint: "Panel & DPS", icon: BarChart3 },
  { key: "simulation", label: "Simulation", hint: "Distribution", icon: Dice5 },
  { key: "rotations", label: "Rotations", hint: "Execution", icon: Repeat2 },
  { key: "skill-editor", label: "Skill Editor", hint: "Theorycraft", icon: FlaskConical },
  { key: "team", label: "Team", hint: "Party plan", icon: Users },
  { key: "guild-war", label: "Guild War", hint: "30-player GvG Lab", icon: Shield },
  { key: "profile", label: "Profile", hint: "Import & save", icon: FileText },
] as const satisfies ReadonlyArray<{ key: ShellTab; label: string; hint: string; icon: typeof Settings }>;

interface ProductShellProps {
  active: ProductTab;
  onNavigate: (tab: ProductTab) => void;
  roleControl: ReactNode;
  actions: ReactNode;
  context: { tier: string; build: string; scheme: string; innerWays: number; estimate: string };
}

export default function ProductShell({ active, onNavigate, roleControl, actions, context }: ProductShellProps) {
  const [gvgOpen, setGvgOpen] = useState(() => window.location.hash.includes("gvg-share="));

  const handleNavigate = (key: ShellTab) => {
    if (key === "guild-war") {
      setGvgOpen(true);
      return;
    }
    setGvgOpen(false);
    onNavigate(key);
  };

  return (
    <>
      <header className="product-masthead">
        <div className="product-brand">
          <span className="product-seal" aria-hidden="true">W</span>
          <div><strong>WWM Build Lab</strong><small>Global gear and combat optimizer</small></div>
        </div>
        <div className="product-role">{roleControl}</div>
        <div className="product-actions">{actions}</div>
      </header>
      <nav className="product-navigation" aria-label="Product workspaces">
        {NAV.map(({ key, label, hint, icon: Icon }) => {
          const selected = key === "guild-war" ? gvgOpen : !gvgOpen && active === key;
          return (
            <button key={key} type="button" className={selected ? "is-active" : ""}
              aria-current={selected ? "page" : undefined} onClick={() => handleNavigate(key)}>
              <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
              <span><strong>{label}</strong><small>{hint}</small></span>
            </button>
          );
        })}
      </nav>
      <section className="product-context" aria-label="Current build context">
        <span><small>Tier</small><strong>{context.tier}</strong></span>
        <span><small>Build</small><strong>{context.build}</strong></span>
        <span><small>Scheme</small><strong>{context.scheme}</strong></span>
        <span><small>Inner Ways</small><strong>{context.innerWays}/4</strong></span>
        <span className="product-context-metric"><small>Modeled rotation</small><strong>{context.estimate}/s</strong></span>
      </section>
      {gvgOpen && <GuildWarWorkspace onClose={() => setGvgOpen(false)} />}
    </>
  );
}
