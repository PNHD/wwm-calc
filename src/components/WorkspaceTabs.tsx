import { BarChart3, Boxes, FlaskConical, Wrench } from "lucide-react";

export type WorkspaceKey = "gear" | "build" | "simulation" | "analysis";

const ITEMS: Array<{ key: WorkspaceKey; label: string; hint: string; icon: typeof Boxes }> = [
  { key: "gear", label: "Gear", hint: "Inventory", icon: Boxes },
  { key: "build", label: "Build", hint: "Loadout", icon: Wrench },
  { key: "simulation", label: "Simulate", hint: "DPS model", icon: FlaskConical },
  { key: "analysis", label: "Analyze", hint: "Optimize", icon: BarChart3 },
];

export default function WorkspaceTabs({ active, onChange }: { active: Exclude<WorkspaceKey, "analysis">; onChange: (key: WorkspaceKey) => void }) {
  return (
    <nav className="v2-tabs" aria-label="Calculator sections">
      {ITEMS.map(({ key, label, hint, icon: Icon }) => (
        <button key={key} type="button" className={active === key ? "is-active" : ""} aria-current={active === key ? "page" : undefined} onClick={() => onChange(key)}>
          <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
          <span><strong>{label}</strong><small>{hint}</small></span>
        </button>
      ))}
    </nav>
  );
}

