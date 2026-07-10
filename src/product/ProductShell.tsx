import type { ReactNode } from "react";
import { BarChart3, Boxes, FlaskConical, SlidersHorizontal } from "lucide-react";

export type ProductWorkspace = "gear" | "build" | "simulation" | "analysis";

const NAV = [
  { key: "gear", label: "Arsenal", detail: "Gear and inventory", icon: Boxes },
  { key: "build", label: "Build", detail: "Loadout and Inner Ways", icon: SlidersHorizontal },
  { key: "simulation", label: "Combat", detail: "Model and attributes", icon: FlaskConical },
  { key: "analysis", label: "Optimize", detail: "Compare and graduate", icon: BarChart3 },
] as const;

interface ProductShellProps {
  active: Exclude<ProductWorkspace, "analysis">;
  onNavigate: (workspace: ProductWorkspace) => void;
  roleControl: ReactNode;
  actions: ReactNode;
  context: { tier: string; build: string; scheme: string; innerWays: number; estimate: string };
}

export default function ProductShell({ active, onNavigate, roleControl, actions, context }: ProductShellProps) {
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
        {NAV.map(({ key, label, detail, icon: Icon }) => (
          <button key={key} type="button" className={active === key ? "is-active" : ""}
            aria-current={active === key ? "page" : undefined} onClick={() => onNavigate(key)}>
            <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
            <span><strong>{label}</strong><small>{detail}</small></span>
          </button>
        ))}
      </nav>
      <section className="product-context" aria-label="Current build context">
        <span><small>Tier</small><strong>{context.tier}</strong></span>
        <span><small>Build</small><strong>{context.build}</strong></span>
        <span><small>Scheme</small><strong>{context.scheme}</strong></span>
        <span><small>Inner Ways</small><strong>{context.innerWays}/4</strong></span>
        <span className="product-context-metric"><small>Modeled estimate</small><strong>{context.estimate}/s</strong></span>
      </section>
    </>
  );
}
