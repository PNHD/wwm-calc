import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coins,
  Dice5,
  FileText,
  FlaskConical,
  HeartPulse,
  Home,
  Layers3,
  Library as LibraryIcon,
  Link2,
  Map as MapIcon,
  Menu,
  Repeat2,
  Settings,
  Share2,
  Shield,
  SlidersHorizontal,
  Target,
  Upload,
  Users,
  X,
} from "lucide-react";
import GuildWarWorkspace from "./GuildWarWorkspace";
import GvgSharePrivacyPanel from "./GvgSharePrivacyPanel";
import GvgSharedLanding from "./GvgSharedLanding";
import LibraryWorkspace from "./LibraryWorkspace";
import "./model-assumptions.css";
import "./workspace-redesign.css";
import "./workspaces/compare-v2.css";

export type ProductTab = "details" | "gear-analyzer" | "gear-compare" | "inventory-optimizer" | "simulation" | "team" | "rotations" | "skill-editor" | "settings" | "profile";
type BaseWorkspace = "pve" | "gvg";
type ProductWorkspace = BaseWorkspace | "library";
type PveView = "overview" | "build" | "gear" | "compare" | "best-build" | "combat" | "simulation" | "rotations" | "skill-editor" | "team" | "profile";
type GvgView = "overview" | "roster" | "builds" | "strategy" | "timeline" | "objectives" | "matches" | "commander" | "support" | "share";

type NavItem<T extends string> = { key: T; label: string; hint: string; icon: typeof Home };

const PVE_PRIMARY: NavItem<PveView>[] = [
  { key: "overview", label: "Overview", hint: "Build health & next step", icon: Home },
  { key: "build", label: "Build", hint: "Path & configuration", icon: Settings },
  { key: "gear", label: "Gear", hint: "Equipped & inventory", icon: Boxes },
  { key: "compare", label: "Compare", hint: "Current vs candidate", icon: SlidersHorizontal },
  { key: "best-build", label: "Best Build", hint: "Recommended combination", icon: Layers3 },
  { key: "combat", label: "Combat", hint: "Menu vs combat panel", icon: BarChart3 },
  { key: "simulation", label: "Simulation", hint: "Timeline & contribution", icon: Dice5 },
];

const PVE_SECONDARY: NavItem<PveView>[] = [
  { key: "rotations", label: "Rotations", hint: "Execution lab", icon: Repeat2 },
  { key: "skill-editor", label: "Skill Editor", hint: "Advanced theorycraft", icon: FlaskConical },
  { key: "team", label: "Team", hint: "Party context", icon: Users },
  { key: "profile", label: "Import / Export", hint: "Data & reference access", icon: FileText },
];

const GVG_PRIMARY: NavItem<GvgView>[] = [
  { key: "overview", label: "Overview", hint: "Readiness command center", icon: Home },
  { key: "roster", label: "Roster", hint: "30-player management", icon: Users },
  { key: "builds", label: "Builds", hint: "Role suitability", icon: Activity },
  { key: "strategy", label: "Strategy", hint: "Map-first battle plan", icon: MapIcon },
  { key: "timeline", label: "Timeline", hint: "Chronological plan", icon: Clock3 },
  { key: "objectives", label: "Objectives", hint: "Bulwark, Goose & bosses", icon: Target },
  { key: "matches", label: "Match Log", hint: "History & evidence", icon: BookOpen },
];

const GVG_SECONDARY: NavItem<GvgView>[] = [
  { key: "commander", label: "Commander / Fun Coin", hint: "Resource planning", icon: Coins },
  { key: "support", label: "Duelists / Healer Lab", hint: "Specialized tools", icon: HeartPulse },
  { key: "share", label: "Share Plan", hint: "Export, clone & privacy", icon: Share2 },
];

const TAB_FOR_PVE: Partial<Record<PveView, ProductTab>> = {
  build: "settings",
  gear: "gear-analyzer",
  compare: "gear-compare",
  "best-build": "inventory-optimizer",
  combat: "details",
  simulation: "simulation",
  rotations: "rotations",
  "skill-editor": "skill-editor",
  team: "team",
  profile: "profile",
};

const PVE_FOR_TAB: Record<ProductTab, PveView> = {
  details: "combat",
  "gear-analyzer": "gear",
  "gear-compare": "compare",
  "inventory-optimizer": "best-build",
  simulation: "simulation",
  team: "team",
  rotations: "rotations",
  "skill-editor": "skill-editor",
  settings: "build",
  profile: "profile",
};

const GVG_INTERNAL_LABEL: Partial<Record<GvgView, string>> = {
  builds: "Build Lab",
  roster: "Roster 30",
  strategy: "Strategy",
  timeline: "Timeline & Sim",
  objectives: "Timeline & Sim",
  commander: "Commander",
  support: "Duelist & Healer",
  matches: "Match Log",
  share: "Share",
};

const SHELL_STORAGE_KEY = "wwm_product_shell_v2";
const GVG_STORAGE_KEY = "wwm_gvg_workspace_v1";

interface ProductShellProps {
  active: ProductTab;
  onNavigate: (tab: ProductTab) => void;
  roleControl: ReactNode;
  actions: ReactNode;
  context: { tier: string; build: string; scheme: string; innerWays: number; estimate: string };
}

interface StoredShellState {
  workspace?: ProductWorkspace;
  lastWorkspace?: BaseWorkspace;
  pveView?: PveView;
  gvgView?: GvgView;
  inspectorCollapsed?: boolean;
  onboarded?: boolean;
}

function readStoredShell(): StoredShellState {
  try {
    return JSON.parse(localStorage.getItem(SHELL_STORAGE_KEY) || "{}") as StoredShellState;
  } catch {
    return {};
  }
}

function explicitRoute() {
  const hash = window.location.hash;
  if (hash.startsWith("#library") || hash.startsWith("#shared-build=")) return { workspace: "library" as const };
  if (hash.includes("gvg-share=")) return { workspace: "gvg" as const, gvgView: "share" as const };
  const match = hash.match(/^#(pve|gvg)\/([a-z-]+)/);
  if (!match) return null;
  return match[1] === "pve"
    ? { workspace: "pve" as const, pveView: match[2] as PveView }
    : { workspace: "gvg" as const, gvgView: match[2] as GvgView };
}

function updateRoute(workspace: BaseWorkspace, view: PveView | GvgView) {
  const hash = window.location.hash;
  if (hash.includes("gvg-share=") && workspace === "gvg") return;
  if (hash && !/^#(pve|gvg)\//.test(hash)) return;
  const next = `#${workspace}/${view}`;
  if (hash !== next) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${next}`);
}

function readGvgSummary() {
  try {
    const raw = JSON.parse(localStorage.getItem(GVG_STORAGE_KEY) || "{}") as any;
    const roster = Array.isArray(raw.roster) ? raw.roster : [];
    const ready = roster.filter((member: any) => member?.availability !== false).length;
    const roleCounts = new Map<string, number>();
    roster.forEach((member: any) => (member?.roles || []).forEach((role: string) => roleCounts.set(role, (roleCounts.get(role) || 0) + 1)));
    const timeline = Array.isArray(raw.timeline) ? [...raw.timeline].sort((a: any, b: any) => Number(a?.timeSeconds || 0) - Number(b?.timeSeconds || 0)) : [];
    const strategyAssignments = Object.keys(raw.strategy?.positions || {}).length;
    const matches = Array.isArray(raw.matchLogs) ? raw.matchLogs.length : 0;
    const startingCoins = Number(raw.commander?.startingCoins || 0);
    return { roster, ready, roleCounts, timeline, strategyAssignments, matches, startingCoins };
  } catch {
    return { roster: [], ready: 0, roleCounts: new Map<string, number>(), timeline: [], strategyAssignments: 0, matches: 0, startingCoins: 0 };
  }
}

const roleCount = (summary: ReturnType<typeof readGvgSummary>, role: string) => summary.roleCounts.get(role) || 0;
const gvgSharePayload = () => {
  const marker = "gvg-share=";
  const index = window.location.hash.indexOf(marker);
  return index < 0 ? "" : window.location.hash.slice(index + marker.length);
};

function WorkspaceSwitcher({ workspace, onChange }: { workspace: ProductWorkspace; onChange: (workspace: BaseWorkspace) => void }) {
  return (
    <nav className="workspace-switcher" aria-label="Product workspaces">
      <button type="button" className={workspace === "pve" ? "is-active" : ""} aria-pressed={workspace === "pve"} onClick={() => onChange("pve")}>
        <BarChart3 size={15} aria-hidden="true" /><span>PvE</span>
      </button>
      <button type="button" aria-label="Open Arena workspace" onClick={() => { location.hash = "#arena/overview"; }}><Target size={15} aria-hidden="true" /><span>Arena</span></button>
      <button type="button" aria-label="Open Training Terrace workspace" onClick={() => { location.hash = "#training-terrace/overview"; }}><FlaskConical size={15} aria-hidden="true" /><span>Training Terrace</span></button>
      <button type="button" className={workspace === "gvg" ? "is-active" : ""} aria-pressed={workspace === "gvg"} onClick={() => onChange("gvg")}>
        <Shield size={15} aria-hidden="true" /><span>Guild War</span>
      </button>
    </nav>
  );
}

function ContextNavigation<T extends string>({
  label,
  primary,
  secondary,
  active,
  onNavigate,
}: {
  label: string;
  primary: NavItem<T>[];
  secondary: NavItem<T>[];
  active: T;
  onNavigate: (key: T) => void;
}) {
  const renderButton = ({ key, label: itemLabel, hint, icon: Icon }: NavItem<T>) => (
    <button key={key} type="button" className={active === key ? "is-active" : ""} aria-current={active === key ? "page" : undefined} onClick={() => onNavigate(key)}>
      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      <span><strong>{itemLabel}</strong><small>{hint}</small></span>
    </button>
  );

  return (
    <aside className="workspace-context-nav" aria-label={`${label} navigation`}>
      <div className="workspace-context-nav-label">{label}</div>
      <nav>{primary.map(renderButton)}</nav>
      <details className="workspace-advanced-nav" open={secondary.some((item) => item.key === active)}>
        <summary><Menu size={15} aria-hidden="true" /><span>More & Advanced</span><ChevronDown size={14} aria-hidden="true" /></summary>
        <nav>{secondary.map(renderButton)}</nav>
      </details>
    </aside>
  );
}

function PveOverview({ context, onNavigate, showOnboarding, onOpenLibrary }: {
  context: ProductShellProps["context"];
  onNavigate: (view: PveView) => void;
  showOnboarding: boolean;
  onOpenLibrary: (hash?: string) => void;
}) {
  const completeInnerWays = context.innerWays >= 4;
  return (
    <main className="workspace-overview workspace-overview-pve" data-testid="pve-overview" id="main-content">
      <header className="workspace-overview-heading">
        <div><span className="workspace-eyebrow">PvE / Overview</span><h1>Your build, at a glance</h1><p>See the recommendation first. Open detailed model evidence only when you need it.</p></div>
        <button type="button" className="workspace-primary-action" onClick={() => onNavigate("compare")}>Compare gear <ChevronRight size={16} aria-hidden="true" /></button>
      </header>

      {showOnboarding && <section className="workspace-onboarding workspace-onboarding-start" aria-label="First use PvE start options">
        <div><span className="workspace-eyebrow">Start from</span><h2>Choose a safe starting point</h2><p>Reference and shared builds stay read-only until you explicitly clone them.</p></div>
        <button type="button" onClick={() => onNavigate("build")}><BarChart3 size={20} aria-hidden="true" /><span><strong>Blank Build</strong><small>Configure your own Path and gear.</small></span><ChevronRight size={16} /></button>
        <button type="button" onClick={() => onOpenLibrary("#library/pve")}><LibraryIcon size={20} aria-hidden="true" /><span><strong>Reference Build</strong><small>Browse curated, sourced presets.</small></span><ChevronRight size={16} /></button>
        <button type="button" onClick={() => onNavigate("profile")}><Upload size={20} aria-hidden="true" /><span><strong>Import</strong><small>Load your existing calculator data.</small></span><ChevronRight size={16} /></button>
        <button type="button" onClick={() => onOpenLibrary("#library")}><Link2 size={20} aria-hidden="true" /><span><strong>Shared Link</strong><small>Open a read-only shared build link.</small></span><ChevronRight size={16} /></button>
      </section>}

      <div className="workspace-overview-grid">
        <section className="workspace-hero-card">
          <div className="workspace-card-heading"><span>MY BUILD</span><b className="workspace-status-chip is-modeled">MODELED</b></div>
          <h2>{context.build}</h2>
          <p>{context.scheme}</p>
          <div className="workspace-primary-metric"><small>Modeled DPS</small><strong>{context.estimate}<em>/s</em></strong></div>
          <div className="workspace-inline-meta"><span>{context.tier}</span><span>{context.innerWays}/4 Inner Ways</span></div>
          <button type="button" className="workspace-text-action" onClick={() => onNavigate("build")}>Edit build configuration <ChevronRight size={14} /></button>
        </section>

        <section className="workspace-summary-card">
          <div className="workspace-card-heading"><span>MENU PANEL</span><button type="button" onClick={() => onNavigate("combat")}>View values</button></div>
          <p className="workspace-card-intro">The important static stats stay separate from conditional combat values.</p>
          <div className="workspace-stat-keywords"><span>Physical Attack</span><span>Precision</span><span>Crit</span><span>Affinity</span><span>Physical Pen</span></div>
        </section>

        <section className="workspace-summary-card">
          <div className="workspace-card-heading"><span>BUILD HEALTH</span><b className={`workspace-status-chip ${completeInnerWays ? "is-ready" : "is-attention"}`}>{completeInnerWays ? "READY" : "NEEDS INPUT"}</b></div>
          <div className="workspace-health-list">
            <span><strong>{context.innerWays}/4</strong><small>Inner Ways configured</small></span>
            <span><strong>{context.tier}</strong><small>Current data tier</small></span>
            <span><strong>{context.scheme}</strong><small>Active gear scheme</small></span>
          </div>
          <button type="button" className="workspace-text-action" onClick={() => onNavigate("gear")}>Review equipped gear <ChevronRight size={14} /></button>
        </section>

        <section className="workspace-next-card">
          <div className="workspace-card-heading"><span>NEXT ACTIONS</span></div>
          <button type="button" onClick={() => onOpenLibrary("#library/pve")}><span><strong>Compare with Reference</strong><small>Open a sourced build without changing My Build.</small></span><ChevronRight size={16} /></button>
          <button type="button" onClick={() => onNavigate("compare")}><span><strong>Compare a gear piece</strong><small>See the winner and why it wins.</small></span><ChevronRight size={16} /></button>
          <button type="button" onClick={() => onNavigate("best-build")}><span><strong>Run Best Build</strong><small>Search complete combinations by modeled DPS.</small></span><ChevronRight size={16} /></button>
          <button type="button" onClick={() => onNavigate("gear")}><span><strong>Review weak slots</strong><small>Manage equipped gear and inventory.</small></span><ChevronRight size={16} /></button>
        </section>
      </div>
    </main>
  );
}

function GvgOverview({ onNavigate, onOpenLibrary }: { onNavigate: (view: GvgView) => void; onOpenLibrary: (hash?: string) => void }) {
  const summary = readGvgSummary();
  const nextEvent = summary.timeline[0];
  const missing = [
    roleCount(summary, "HEALER") ? null : "Healer",
    roleCount(summary, "FRONTLINE_TANK") ? null : "Frontline",
    roleCount(summary, "MAIN_BALL") ? null : "Main Ball",
  ].filter(Boolean) as string[];

  return (
    <main className="workspace-overview workspace-overview-gvg" data-testid="gvg-overview" id="main-content">
      <header className="workspace-overview-heading">
        <div><span className="workspace-eyebrow">Guild War / Overview</span><h1>Command center</h1><p>Roster readiness, strategy and the next objective without PvE calculator noise.</p></div>
        <div className="workspace-heading-actions"><button type="button" className="workspace-secondary-action" onClick={() => onOpenLibrary("#library/gvg-plans")}>Templates</button><button type="button" className="workspace-primary-action" onClick={() => onNavigate("strategy")}>Open Strategy <ChevronRight size={16} /></button></div>
      </header>

      {!summary.roster.length && <section className="workspace-empty-state workspace-gvg-start">
        <Users size={25} aria-hidden="true" /><div><h2>No Guild War roster yet</h2><p>Start blank, use a template, import a plan or inspect a shared plan. PvE data stays untouched.</p></div>
        <button type="button" onClick={() => onNavigate("roster")}>Blank Roster</button>
        <button type="button" className="is-secondary" onClick={() => onOpenLibrary("#library/gvg-plans")}>Roster Template</button>
        <button type="button" className="is-secondary" onClick={() => onNavigate("share")}>Import Plan</button>
        <button type="button" className="is-secondary" onClick={() => onNavigate("share")}>Shared Plan</button>
      </section>}

      <div className="workspace-overview-grid gvg-command-grid">
        <section className="workspace-hero-card">
          <div className="workspace-card-heading"><span>ROSTER</span><b className={`workspace-status-chip ${summary.ready >= 30 ? "is-ready" : "is-attention"}`}>{summary.ready >= 30 ? "READY" : "IN PROGRESS"}</b></div>
          <div className="workspace-primary-metric"><small>Available players</small><strong>{summary.ready}<em> / 30</em></strong></div>
          <p>{summary.roster.length ? `${summary.roster.length} roster entries · ${summary.strategyAssignments} placed on strategy.` : "Build the 30-player roster before locking strategy."}</p>
          <button type="button" className="workspace-text-action" onClick={() => onNavigate("roster")}>Manage roster <ChevronRight size={14} /></button>
        </section>

        <section className="workspace-summary-card">
          <div className="workspace-card-heading"><span>ROLE COVERAGE</span></div>
          <div className="workspace-role-grid"><span><strong>{roleCount(summary, "HEALER")}</strong><small>Healer</small></span><span><strong>{roleCount(summary, "FRONTLINE_TANK")}</strong><small>Frontline</small></span><span><strong>{roleCount(summary, "MAIN_BALL")}</strong><small>Main Ball</small></span><span><strong>{roleCount(summary, "FLEX_ASSASSIN")}</strong><small>Flex</small></span><span><strong>{roleCount(summary, "DUELIST")}</strong><small>Duelist</small></span></div>
          <p>{missing.length ? `Needs coverage: ${missing.join(", ")}.` : "Core roles have at least one assignment."}</p>
        </section>

        <section className="workspace-summary-card">
          <div className="workspace-card-heading"><span>STRATEGY</span><b className="workspace-status-chip is-modeled">PLAN</b></div>
          <h3>{summary.strategyAssignments ? `${summary.strategyAssignments} map assignments` : "No map assignments"}</h3>
          <p>Use the battlefield as the primary planning surface, then inspect individual assignments.</p>
          <button type="button" className="workspace-text-action" onClick={() => onNavigate("strategy")}>Open strategy board <ChevronRight size={14} /></button>
        </section>

        <section className="workspace-summary-card">
          <div className="workspace-card-heading"><span>TIMELINE</span></div>
          <h3>{nextEvent ? `${Math.floor(Number(nextEvent.timeSeconds || 0) / 60)}:${String(Math.round(Number(nextEvent.timeSeconds || 0) % 60)).padStart(2, "0")} · ${nextEvent.label || "Planned event"}` : "3:00 · Outposts spawn"}</h3>
          <p>{nextEvent ? "Next configured event in this plan." : "Official fixed event is available; add configurable events as needed."}</p>
          <button type="button" className="workspace-text-action" onClick={() => onNavigate("timeline")}>Review timeline <ChevronRight size={14} /></button>
        </section>

        <section className="workspace-summary-card">
          <div className="workspace-card-heading"><span>COMMAND RESOURCES</span></div>
          <div className="workspace-primary-metric is-small"><small>Starting Fun Coin</small><strong>{summary.startingCoins.toLocaleString()}</strong></div>
          <button type="button" className="workspace-text-action" onClick={() => onNavigate("commander")}>Open commander planner <ChevronRight size={14} /></button>
        </section>

        <section className="workspace-next-card">
          <div className="workspace-card-heading"><span>READINESS</span></div>
          <div className="workspace-readiness-lines"><span><strong>{summary.ready}/30</strong><small>Available</small></span><span><strong>{summary.strategyAssignments}</strong><small>Placed on map</small></span><span><strong>{summary.matches}</strong><small>Match logs</small></span></div>
          <button type="button" onClick={() => onOpenLibrary("#library/gvg-plans")}><span><strong>Roster & strategy templates</strong><small>Browse curated plans and clone only when ready.</small></span><ChevronRight size={16} /></button>
          <button type="button" onClick={() => onNavigate("share")}><span><strong>Check shareability</strong><small>Export a roster, strategy or full plan with privacy controls.</small></span><ChevronRight size={16} /></button>
        </section>
      </div>
    </main>
  );
}

function PveInspector({ context, page, collapsed, onToggle, onNavigate }: {
  context: ProductShellProps["context"];
  page: PveView;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: (view: PveView) => void;
}) {
  if (page === "overview") return null;
  const next: Record<PveView, { label: string; view: PveView }> = {
    overview: { label: "Open Build", view: "build" }, build: { label: "Manage Gear", view: "gear" }, gear: { label: "Compare Candidate", view: "compare" }, compare: { label: "Run Best Build", view: "best-build" }, "best-build": { label: "Review Combat", view: "combat" }, combat: { label: "Open Simulation", view: "simulation" }, simulation: { label: "Review Rotations", view: "rotations" }, rotations: { label: "Open Simulation", view: "simulation" }, "skill-editor": { label: "Review Combat", view: "combat" }, team: { label: "Review Combat", view: "combat" }, profile: { label: "Back to Overview", view: "overview" },
  };
  return (
    <aside className={`workspace-inspector ${collapsed ? "is-collapsed" : ""}`} aria-label="Context inspector">
      <button type="button" className="workspace-inspector-toggle" aria-label={collapsed ? "Expand context inspector" : "Collapse context inspector"} onClick={onToggle}>{collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}</button>
      {!collapsed && <>
        <div className="workspace-inspector-label">CURRENT BUILD</div>
        <h2>{context.build}</h2><p>{context.scheme}</p>
        <div className="workspace-inspector-metric"><small>Modeled DPS</small><strong>{context.estimate}<em>/s</em></strong><span className="workspace-status-chip is-modeled">MODELED</span></div>
        <dl><dt>Data</dt><dd>{context.tier}</dd><dt>Inner Ways</dt><dd>{context.innerWays}/4</dd><dt>Context</dt><dd>{page === "combat" ? "Menu + conditional combat" : page.replaceAll("-", " ")}</dd></dl>
        <button type="button" className="workspace-primary-action" onClick={() => onNavigate(next[page].view)}>{next[page].label}<ChevronRight size={14} /></button>
        <details className="workspace-inspector-details"><summary>Evidence & assumptions</summary><p>Model, calibration and provenance details remain available in the relevant tool instead of occupying the primary decision surface.</p></details>
      </>}
    </aside>
  );
}

export default function ProductShell({ active, onNavigate, roleControl, actions, context }: ProductShellProps) {
  const stored = useMemo(readStoredShell, []);
  const route = useMemo(explicitRoute, []);
  const initialBase = route?.workspace === "pve" || route?.workspace === "gvg" ? route.workspace : stored.lastWorkspace ?? (stored.workspace === "gvg" ? "gvg" : "pve");
  const [workspace, setWorkspace] = useState<ProductWorkspace>(route?.workspace ?? stored.workspace ?? "pve");
  const [lastWorkspace, setLastWorkspace] = useState<BaseWorkspace>(initialBase);
  const [pveView, setPveView] = useState<PveView>((route && "pveView" in route ? route.pveView : undefined) ?? stored.pveView ?? "overview");
  const [gvgView, setGvgView] = useState<GvgView>((route && "gvgView" in route ? route.gvgView : undefined) ?? stored.gvgView ?? "overview");
  const [inspectorCollapsed, setInspectorCollapsed] = useState(Boolean(stored.inspectorCollapsed));
  const [moreOpen, setMoreOpen] = useState(false);
  const [onboarded, setOnboarded] = useState(Boolean(stored.onboarded) || Boolean(route));
  const [previewLegacyGvgShare, setPreviewLegacyGvgShare] = useState(Boolean(gvgSharePayload()));
  const activeRef = useRef(active);
  const initializedRef = useRef(false);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".app-root");
    if (!root) return;
    root.dataset.productWorkspace = workspace;
    root.dataset.productPage = workspace === "pve" ? pveView : workspace === "gvg" ? gvgView : "library";
  }, [workspace, pveView, gvgView]);

  useEffect(() => {
    localStorage.setItem(SHELL_STORAGE_KEY, JSON.stringify({ workspace, lastWorkspace, pveView, gvgView, inspectorCollapsed, onboarded }));
  }, [workspace, lastWorkspace, pveView, gvgView, inspectorCollapsed, onboarded]);

  useEffect(() => {
    const handleHash = () => {
      const parsed = explicitRoute();
      if (!parsed) return;
      if (parsed.workspace === "library") {
        setWorkspace("library"); setMoreOpen(false); return;
      }
      if (parsed.workspace === "pve") {
        setWorkspace("pve"); setLastWorkspace("pve");
        if ("pveView" in parsed) setPveView(parsed.pveView);
      } else {
        setWorkspace("gvg"); setLastWorkspace("gvg");
        if ("gvgView" in parsed) setGvgView(parsed.gvgView);
        setPreviewLegacyGvgShare(Boolean(gvgSharePayload()));
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (workspace === "pve" && pveView !== "overview") {
      const tab = TAB_FOR_PVE[pveView];
      if (tab && tab !== active) onNavigate(tab);
    }
  }, [active, onNavigate, pveView, workspace]);

  useEffect(() => {
    if (activeRef.current === active) return;
    activeRef.current = active;
    if (workspace === "pve") setPveView(PVE_FOR_TAB[active]);
  }, [active, workspace]);

  useEffect(() => {
    if (workspace !== "gvg" || gvgView === "overview" || (gvgView === "share" && (!gvgSharePayload() || previewLegacyGvgShare))) return;
    const target = GVG_INTERNAL_LABEL[gvgView];
    if (!target) return;
    const timer = window.setTimeout(() => {
      const nav = document.querySelector<HTMLElement>('.workspace-gvg-host .gvg-tabs[aria-label="Guild War workspaces"]');
      if (!nav) return;
      const button = Array.from(nav.querySelectorAll<HTMLButtonElement>("button")).find((candidate) => candidate.textContent?.includes(target));
      if (button && !button.classList.contains("is-active")) button.click();
      if (gvgView === "objectives") {
        window.setTimeout(() => {
          const sim = document.querySelector<HTMLElement>('[data-testid="gvg-timeline-simulator"]');
          const objectiveCard = sim ? Array.from(sim.querySelectorAll<HTMLElement>(".gvg-card")).find((card) => /Bulwark|Goose|Objective/i.test(card.textContent || "")) : null;
          objectiveCard?.scrollIntoView({ block: "start", behavior: "smooth" });
        }, 30);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [workspace, gvgView, previewLegacyGvgShare]);

  const goPve = (view: PveView) => {
    setWorkspace("pve"); setLastWorkspace("pve"); setPveView(view); setMoreOpen(false); setOnboarded(true); updateRoute("pve", view);
    const tab = TAB_FOR_PVE[view];
    if (tab) onNavigate(tab);
  };

  const goGvg = (view: GvgView) => {
    setWorkspace("gvg"); setLastWorkspace("gvg"); setGvgView(view); setMoreOpen(false); setOnboarded(true); updateRoute("gvg", view);
  };

  const switchWorkspace = (next: BaseWorkspace) => {
    setWorkspace(next); setLastWorkspace(next); setMoreOpen(false); setOnboarded(true); setPreviewLegacyGvgShare(false);
    if (next === "pve") {
      if (!/^#pve\//.test(window.location.hash)) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#pve/${pveView}`);
      const tab = TAB_FOR_PVE[pveView];
      if (tab) onNavigate(tab);
    } else {
      if (!/^#gvg\//.test(window.location.hash)) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#gvg/${gvgView}`);
    }
  };

  const openLibrary = (hash = "#library") => {
    if (workspace === "pve" || workspace === "gvg") setLastWorkspace(workspace);
    setWorkspace("library"); setMoreOpen(false); setOnboarded(true);
    if (!window.location.hash.startsWith("#shared-build=")) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  };

  const closeLegacyGvgShare = () => {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#gvg/overview`);
    setPreviewLegacyGvgShare(false);
    goGvg("overview");
  };

  const pveTitle = [...PVE_PRIMARY, ...PVE_SECONDARY].find((item) => item.key === pveView)?.label ?? "Overview";
  const gvgTitle = [...GVG_PRIMARY, ...GVG_SECONDARY].find((item) => item.key === gvgView)?.label ?? "Overview";
  const mobilePve: PveView[] = ["build", "gear", "compare", "best-build"];
  const mobileGvg: GvgView[] = ["roster", "strategy", "timeline", "matches"];

  return (
    <div className="product-shell-root" data-shell-workspace={workspace} data-shell-page={workspace === "pve" ? pveView : workspace === "gvg" ? gvgView : "library"}>
      <header className="product-masthead product-masthead-v2">
        <button type="button" className="product-brand" onClick={() => workspace === "library" ? switchWorkspace(lastWorkspace) : workspace === "pve" ? goPve("overview") : goGvg("overview")} aria-label="Open workspace overview">
          <span className="product-seal" aria-hidden="true">W</span><span><strong>WWM Build Lab</strong><small>Global 2.0 · {context.tier}</small></span>
        </button>
        <WorkspaceSwitcher workspace={workspace} onChange={switchWorkspace} />
        <div className="product-role">{roleControl}</div>
        <div className="product-actions product-actions-v2">
          <button type="button" className={`product-library-button ${workspace === "library" ? "is-active" : ""}`} aria-current={workspace === "library" ? "page" : undefined} onClick={() => openLibrary()}><LibraryIcon size={14} /><span>Library</span></button>
          {workspace === "pve" ? <button type="button" onClick={() => goPve("profile")}><Share2 size={14} /> Share / Import</button> : workspace === "gvg" ? <button type="button" onClick={() => goGvg("share")}><Share2 size={14} /> Share Plan</button> : null}
          {actions}
        </div>
      </header>

      {workspace !== "library" && <div className="workspace-context-bar">
        <button type="button" className="workspace-mobile-switch" onClick={() => switchWorkspace(workspace === "pve" ? "gvg" : "pve")}><span>{workspace === "pve" ? "PvE" : "Guild War"}</span><ChevronDown size={14} /></button>
        <span>{workspace === "pve" ? "PvE" : "Guild War"} <b>/</b> {workspace === "pve" ? pveTitle : gvgTitle}</span>
        {workspace === "pve" && <section className="product-context" role="region" aria-label="Current build context"><span><small>Build</small><strong>{context.build}</strong></span><span><small>Inner Ways</small><strong>{context.innerWays}/4</strong></span><span className="product-context-metric"><small>Modeled DPS</small><strong>{context.estimate}/s</strong></span></section>}
      </div>}

      {workspace === "pve" && <ContextNavigation label="PvE" primary={PVE_PRIMARY} secondary={PVE_SECONDARY} active={pveView} onNavigate={goPve} />}
      {workspace === "gvg" && <ContextNavigation label="Guild War" primary={GVG_PRIMARY} secondary={GVG_SECONDARY} active={gvgView} onNavigate={goGvg} />}

      {workspace === "pve" && <PveInspector context={context} page={pveView} collapsed={inspectorCollapsed} onToggle={() => setInspectorCollapsed((value) => !value)} onNavigate={goPve} />}

      {workspace === "pve" && pveView === "overview" && <PveOverview context={context} onNavigate={goPve} showOnboarding={!onboarded} onOpenLibrary={openLibrary} />}
      {workspace === "gvg" && gvgView === "overview" && <GvgOverview onNavigate={goGvg} onOpenLibrary={openLibrary} />}
      {workspace === "gvg" && gvgView === "share" && !gvgSharePayload() && <GvgSharePrivacyPanel onBack={() => goGvg("overview")} />}
      {workspace === "gvg" && gvgView === "share" && previewLegacyGvgShare && gvgSharePayload() && <GvgSharedLanding payload={gvgSharePayload()} onView={() => setPreviewLegacyGvgShare(false)} onBack={closeLegacyGvgShare} />}
      {workspace === "gvg" && gvgView !== "overview" && (gvgView !== "share" || (Boolean(gvgSharePayload()) && !previewLegacyGvgShare)) && <div className={`workspace-gvg-host is-${gvgView}`}><GuildWarWorkspace onClose={() => goGvg("overview")} /></div>}
      {workspace === "library" && <LibraryWorkspace context={context} onOpenPve={goPve} onOpenGvg={goGvg} onExit={() => switchWorkspace(lastWorkspace)} />}

      {workspace !== "library" && <nav className="workspace-mobile-nav" aria-label={`${workspace === "pve" ? "PvE" : "Guild War"} mobile navigation`}>
        {workspace === "pve" ? mobilePve.map((key) => {
          const item = PVE_PRIMARY.find((candidate) => candidate.key === key)!; const Icon = item.icon;
          return <button type="button" key={key} className={pveView === key ? "is-active" : ""} aria-current={pveView === key ? "page" : undefined} onClick={() => goPve(key)}><Icon size={18} /><span>{item.label === "Best Build" ? "Best" : item.label}</span></button>;
        }) : mobileGvg.map((key) => {
          const item = GVG_PRIMARY.find((candidate) => candidate.key === key)!; const Icon = item.icon;
          return <button type="button" key={key} className={gvgView === key ? "is-active" : ""} aria-current={gvgView === key ? "page" : undefined} onClick={() => goGvg(key)}><Icon size={18} /><span>{item.label === "Match Log" ? "Matches" : item.label}</span></button>;
        })}
        <button type="button" className={moreOpen ? "is-active" : ""} aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}><Menu size={18} /><span>More</span></button>
      </nav>}

      {workspace !== "library" && moreOpen && <div className="workspace-mobile-drawer" role="dialog" aria-modal="true" aria-label="More navigation">
        <button type="button" className="workspace-mobile-drawer-close" aria-label="Close navigation" onClick={() => setMoreOpen(false)}><X size={18} /></button>
        <span className="workspace-eyebrow">{workspace === "pve" ? "PvE" : "Guild War"} · More</span><h2>Tools</h2>
        <nav>{(workspace === "pve" ? [PVE_PRIMARY[0], PVE_PRIMARY[5], PVE_PRIMARY[6], ...PVE_SECONDARY] : [GVG_PRIMARY[0], GVG_PRIMARY[2], GVG_PRIMARY[5], ...GVG_SECONDARY]).map((item: any) => {
          const Icon = item.icon; return <button type="button" key={item.key} onClick={() => workspace === "pve" ? goPve(item.key as PveView) : goGvg(item.key as GvgView)}><Icon size={18} /><span><strong>{item.label}</strong><small>{item.hint}</small></span><ChevronRight size={15} /></button>;
        })}</nav>
        <button type="button" onClick={() => openLibrary()}><LibraryIcon size={18} /><span><strong>Library</strong><small>Curated references & templates</small></span><ChevronRight size={15} /></button>
      </div>}
    </div>
  );
}
