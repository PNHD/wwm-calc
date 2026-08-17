import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BookOpen,
  Clock3,
  Coins,
  Copy,
  Crosshair,
  Download,
  HeartPulse,
  Map,
  Plus,
  Redo2,
  Save,
  Share2,
  Shield,
  Swords,
  Trash2,
  Undo2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  ARCHETYPES,
  COMMUNITY_PRESETS,
  EVIDENCE,
  EX_COOLDOWN_RULE,
  EX_TECHNIQUES,
  GVG_ROLES,
  LEAGUE_SCALING,
  OFFICIAL_GVG,
  SHARE_KINDS,
  applyGuildWarQiDamage,
  compareBuildsByRole,
  computeFunCoinCurve,
  createMatchLog,
  createShareEnvelope,
  defaultWorkspace,
  getBamboocutDustProfile,
  migrateWorkspace,
  neutralBossWindow,
  objectiveSimulationCacheKey,
  proximitySensitivity,
  rosterDiagnostics,
  rosterSignature,
  scoreAllRoles,
  simulateObjective,
  validateRoster,
  validateShareEnvelope,
} from "../gvg/model.js";
import "./guild-war.css";

type GvgTab = "lab" | "roster" | "strategy" | "timeline" | "commander" | "support" | "logs" | "share";

type RosterMember = {
  id: string;
  name: string;
  path: string;
  weapons: string[];
  roles: string[];
  team: string;
  buildReference: string;
  exTechnique: string;
  exLevel: number;
  normalProfile: string;
  arenaProfile: string;
  gvgSelectedProfile: "NORMAL" | "ARENA";
  availability: boolean;
  notes: string;
  antiHeal?: boolean;
  aoeCc?: boolean;
};

const STORAGE_KEY = "wwm_gvg_workspace_v1";
const TAB_ITEMS: Array<{ key: GvgTab; label: string; icon: typeof Activity }> = [
  { key: "lab", label: "Build Lab", icon: Activity },
  { key: "roster", label: "Roster 30", icon: Users },
  { key: "strategy", label: "Strategy", icon: Map },
  { key: "timeline", label: "Timeline & Sim", icon: Clock3 },
  { key: "commander", label: "Commander", icon: Coins },
  { key: "support", label: "Duelist & Healer", icon: HeartPulse },
  { key: "logs", label: "Match Log", icon: BookOpen },
  { key: "share", label: "Share", icon: Share2 },
];

const roleShort: Record<string, string> = {
  MAIN_BALL: "Main Ball",
  FRONTLINE_TANK: "Frontline",
  HEALER: "Healer",
  FLEX_ASSASSIN: "Flex",
  JUNGLER_OBJECTIVE: "Jungle",
  DUELIST: "Duelist",
  ESCORT: "Escort",
  ANTI_ESCORT: "Anti-escort",
};

const evidenceClass = (value: string) => `evidence evidence-${String(value || "UNKNOWN").toLowerCase().replaceAll("_", "-")}`;

function parseStoredWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWorkspace();
    return migrateWorkspace(JSON.parse(raw));
  } catch {
    return defaultWorkspace();
  }
}

function encodeShare(value: unknown) {
  const text = JSON.stringify(value);
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeShare(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function formatTime(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return "—";
  const total = Math.max(0, Math.round(Number(seconds)));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function emptyMember(index: number): RosterMember {
  return {
    id: `gvg-${Date.now()}-${index}`,
    name: `Player ${String(index).padStart(2, "0")}`,
    path: "Bamboocut - Dust",
    weapons: ["Everspring Umbrella", "Unfettered Rope Dart"],
    roles: ["ANTI_ESCORT"],
    team: "Main Ball",
    buildReference: "",
    exTechnique: "Everspring Umbrella: EX",
    exLevel: 3,
    normalProfile: "PvE / Normal",
    arenaProfile: "Arena",
    gvgSelectedProfile: "ARENA",
    availability: true,
    notes: "",
    antiHeal: true,
    aoeCc: true,
  };
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="gvg-metric">
      <span>{label}</span>
      <div><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
      <strong>{Math.round(value)}</strong>
    </div>
  );
}

function EvidenceBadge({ value }: { value: string }) {
  return <span className={evidenceClass(value)}>{value}</span>;
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <div className="gvg-stat-card"><small>{label}</small><strong>{value}</strong>{detail && <span>{detail}</span>}</div>;
}

export default function GuildWarWorkspace({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<GvgTab>("lab");
  const [workspace, setWorkspace] = useState<any>(() => parseStoredWorkspace());
  const [exLevel, setExLevel] = useState(3);
  const [buildAId, setBuildAId] = useState("bamboocut-dust-zone");
  const [buildBId, setBuildBId] = useState("stonesplit-frontline-reference");
  const [selectedStrategyMember, setSelectedStrategyMember] = useState<string | null>(null);
  const [strategyHistory, setStrategyHistory] = useState<any[]>([]);
  const [strategyFuture, setStrategyFuture] = useState<any[]>([]);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [shareKind, setShareKind] = useState("FULL_GUILD_WAR_PLAN");
  const [redactNames, setRedactNames] = useState(true);
  const [shareText, setShareText] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [simParams, setSimParams] = useState({ objective: "BULWARK", objectiveHp: 1000000, teamObjectiveDps: 30000, nearbyPlayers: 10, manualDrPerStack: "", league: "STANDARD" });
  const [coinDraft, setCoinDraft] = useState({ timeSeconds: 300, amount: 100, label: "Jungle income" });
  const [commandDraft, setCommandDraft] = useState({ timeSeconds: 420, amount: -100, label: "Command spend", cooldownSeconds: "" });
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    const hash = window.location.hash;
    const marker = "gvg-share=";
    const index = hash.indexOf(marker);
    if (index < 0) return;
    try {
      const envelope = decodeShare(hash.slice(index + marker.length));
      const validation = validateShareEnvelope(envelope);
      if (validation.valid) {
        setShareText(JSON.stringify(envelope, null, 2));
        setShareStatus("Shared plan detected. Review it in Share, then clone if desired.");
      }
    } catch {
      setShareStatus("The GvG share link could not be decoded.");
    }
  }, []);

  const bamboocut = useMemo(() => getBamboocutDustProfile(exLevel), [exLevel]);
  const archetypes = useMemo(() => ARCHETYPES.map((item: any) => item.id === "bamboocut-dust-zone" ? bamboocut : { ...item, roleScores: scoreAllRoles(item.dimensions) }), [bamboocut]);
  const buildA = archetypes.find((item: any) => item.id === buildAId) ?? archetypes[0];
  const buildB = archetypes.find((item: any) => item.id === buildBId) ?? archetypes[1];
  const buildComparison = useMemo(() => compareBuildsByRole(buildA, buildB), [buildA, buildB]);
  const roster = (workspace.roster ?? []) as RosterMember[];
  const diagnostics = useMemo(() => rosterDiagnostics(roster), [roster]);
  const rosterValidation = useMemo(() => validateRoster(roster), [roster]);
  const simResult = useMemo(() => simulateObjective({ ...simParams, rosterSignature: rosterSignature(roster), role: "JUNGLER_OBJECTIVE", build: buildA.id, timeline: JSON.stringify(workspace.timeline ?? []) }), [simParams, roster, buildA.id, workspace.timeline]);
  const sensitivity = useMemo(() => proximitySensitivity(simParams.objective, simParams.manualDrPerStack), [simParams.objective, simParams.manualDrPerStack]);
  const coinCurve = useMemo(() => computeFunCoinCurve(workspace.commander?.events ?? [], workspace.commander?.startingCoins ?? 0), [workspace.commander]);
  const selectedMember = roster.find((member) => member.id === selectedStrategyMember) ?? null;

  const patchWorkspace = (patch: any) => setWorkspace((current: any) => ({ ...current, ...patch }));
  const patchRoster = (next: RosterMember[]) => patchWorkspace({ roster: next });
  const patchStrategy = (next: any, record = true) => {
    if (record) {
      setStrategyHistory((history) => [...history.slice(-29), workspace.strategy]);
      setStrategyFuture([]);
    }
    patchWorkspace({ strategy: next });
  };

  const addMember = () => {
    if (roster.length >= 30) return;
    patchRoster([...roster, emptyMember(roster.length + 1)]);
  };

  const updateMember = (id: string, patch: Partial<RosterMember>) => patchRoster(roster.map((member) => member.id === id ? { ...member, ...patch } : member));
  const removeMember = (id: string) => {
    patchRoster(roster.filter((member) => member.id !== id));
    const positions = { ...(workspace.strategy?.positions ?? {}) };
    delete positions[id];
    patchStrategy({ ...workspace.strategy, positions }, false);
  };

  const seedRoster = () => {
    if (roster.length) return;
    const roles = ["FRONTLINE_TANK", "MAIN_BALL", "HEALER", "FLEX_ASSASSIN", "JUNGLER_OBJECTIVE", "DUELIST", "ESCORT", "ANTI_ESCORT"];
    const seeded = Array.from({ length: 12 }, (_, i) => {
      const member = emptyMember(i + 1);
      member.roles = [roles[i % roles.length]];
      member.team = i < 6 ? "Main Ball" : i < 9 ? "Flex A" : "Flex B";
      if (member.roles[0] === "HEALER") {
        member.path = "Silkbind - Deluge";
        member.weapons = ["Panacea Fan", "Soulshade Umbrella"];
        member.exTechnique = "Soulshade Umbrella: EX";
        member.antiHeal = false;
      }
      if (member.roles[0] === "FRONTLINE_TANK") {
        member.path = "Stonesplit - Might";
        member.weapons = ["Thundercry Blade", "Stormbreaker Spear"];
        member.exTechnique = "Stormbreaker Spear: EX";
        member.antiHeal = false;
      }
      return member;
    });
    patchRoster(seeded);
  };

  const strategyDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (!id || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((event.clientY - rect.top) / rect.height) * 100));
    patchStrategy({ ...workspace.strategy, positions: { ...(workspace.strategy?.positions ?? {}), [id]: { x, y } } });
  };

  const strategyClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current || (event.target as HTMLElement).closest("button")) return;
    const rect = mapRef.current.getBoundingClientRect();
    const point = { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
    if (!arrowStart) {
      setArrowStart(point);
      return;
    }
    patchStrategy({ ...workspace.strategy, arrows: [...(workspace.strategy?.arrows ?? []), { from: arrowStart, to: point }] });
    setArrowStart(null);
  };

  const addRallyPoint = () => patchStrategy({ ...workspace.strategy, rallyPoints: [...(workspace.strategy?.rallyPoints ?? []), { x: 50, y: 50, label: `R${(workspace.strategy?.rallyPoints?.length ?? 0) + 1}` }] });
  const undoStrategy = () => {
    if (!strategyHistory.length) return;
    const previous = strategyHistory[strategyHistory.length - 1];
    setStrategyFuture((future) => [workspace.strategy, ...future].slice(0, 30));
    setStrategyHistory((history) => history.slice(0, -1));
    patchStrategy(previous, false);
  };
  const redoStrategy = () => {
    if (!strategyFuture.length) return;
    const next = strategyFuture[0];
    setStrategyHistory((history) => [...history, workspace.strategy].slice(-30));
    setStrategyFuture((future) => future.slice(1));
    patchStrategy(next, false);
  };

  const buildSharePayload = () => {
    if (shareKind === "INDIVIDUAL_BUILD") return buildA;
    if (shareKind === "GVG_ROLE_BUILD") return { build: buildA, roleScores: scoreAllRoles(buildA.dimensions), attunementProfiles: workspace.attunementProfiles };
    if (shareKind === "ROSTER") return { roster, doctrine: workspace.doctrine };
    if (shareKind === "STRATEGY") return { roster, strategy: workspace.strategy };
    return workspace;
  };

  const exportShare = () => {
    const envelope = createShareEnvelope(shareKind, buildSharePayload(), { redactPlayerNames: redactNames });
    setShareText(JSON.stringify(envelope, null, 2));
    downloadJson(`wwm-gvg-${shareKind.toLowerCase()}-v1.json`, envelope);
    setShareStatus("Versioned JSON exported.");
  };

  const copyShareLink = async () => {
    const envelope = createShareEnvelope(shareKind, buildSharePayload(), { redactPlayerNames: redactNames });
    const link = `${window.location.origin}${window.location.pathname}#gvg-share=${encodeShare(envelope)}`;
    await navigator.clipboard.writeText(link);
    setShareText(JSON.stringify(envelope, null, 2));
    setShareStatus("Share link copied.");
  };

  const cloneShare = () => {
    try {
      const envelope = JSON.parse(shareText);
      const validation = validateShareEnvelope(envelope);
      if (!validation.valid) throw new Error(validation.error);
      if (envelope.kind === "FULL_GUILD_WAR_PLAN") setWorkspace(migrateWorkspace(envelope.payload));
      else if (envelope.kind === "ROSTER") patchWorkspace({ roster: envelope.payload.roster ?? [], doctrine: envelope.payload.doctrine ?? "CUSTOM" });
      else if (envelope.kind === "STRATEGY") patchWorkspace({ roster: envelope.payload.roster ?? roster, strategy: envelope.payload.strategy ?? workspace.strategy });
      else patchWorkspace({ importedBuildReference: envelope.payload });
      setShareStatus("Cloned into my local GvG workspace. Existing PvE data was not modified.");
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : "Import failed.");
    }
  };

  const importShareFile = async (file: File | null) => {
    if (!file) return;
    setShareText(await file.text());
    setShareStatus("JSON loaded. Validate and clone when ready.");
  };

  const addTimelineEvent = (label: string, timeSeconds: number | null, type = "PLAN") => {
    if (timeSeconds == null || !Number.isFinite(Number(timeSeconds))) return;
    patchWorkspace({ timeline: [...(workspace.timeline ?? []), { id: `event-${Date.now()}`, label, timeSeconds: Number(timeSeconds), type }].sort((a, b) => a.timeSeconds - b.timeSeconds) });
  };

  const addCoinEvent = (draft: { timeSeconds: number | string; amount: number | string; label: string }) => {
    patchWorkspace({ commander: { ...workspace.commander, events: [...(workspace.commander?.events ?? []), { id: `coin-${Date.now()}`, timeSeconds: Number(draft.timeSeconds) || 0, amount: Number(draft.amount) || 0, label: draft.label }] } });
  };

  const saveMatch = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const log = createMatchLog({
      date: data.get("date"), patch: data.get("patch"), league: data.get("league"), opponent: data.get("opponent"), result: data.get("result"),
      roster, kills: data.get("kills"), deaths: data.get("deaths"), damage: data.get("damage"), healing: data.get("healing"), objectiveDamage: data.get("objectiveDamage"),
      duelOutcome: data.get("duelOutcome"), bulwarkBreakSeconds: data.get("bulwarkBreakSeconds") || null, gooseBreakSeconds: data.get("gooseBreakSeconds") || null,
      tree: { pickupSeconds: data.get("treePickupSeconds") || null, distance: data.get("treeDistance") || null, delivered: data.get("treeDelivered") === "on" },
      funCoinUsage: workspace.commander?.events ?? [],
    });
    patchWorkspace({ matchLogs: [...(workspace.matchLogs ?? []), log] });
    form.reset();
  };

  return (
    <div className="gvg-overlay" data-testid="guild-war-workspace">
      <header className="gvg-header">
        <div>
          <span className="gvg-kicker">GLOBAL GUILD WAR LAB</span>
          <h1>Plan the fight, not just the DPS.</h1>
          <p>30-player composition, GvG role builds, strategy map, discrete-event objectives, commander economy and versioned sharing.</p>
        </div>
        <div className="gvg-header-actions">
          <EvidenceBadge value={EVIDENCE.CONFIRMED_OFFICIAL} />
          <button type="button" className="gvg-button" onClick={() => setTab("share")}><Share2 size={16} /> Share</button>
          <button type="button" className="gvg-icon-button" aria-label="Close Guild War Lab" onClick={onClose}><X size={20} /></button>
        </div>
      </header>

      <div className="gvg-official-strip">
        <span><strong>Outposts</strong> 3:00</span>
        <span><strong>Ownership lock</strong> 60s</span>
        <span><strong>Resurrection lock</strong> 60s</span>
        <span><strong>Bulwark stacks</strong> 0–15</span>
        <span><strong>Goose stacks</strong> 0–30</span>
        <span><strong>Qi damage taken</strong> ×0.5</span>
        <span><strong>Halftime</strong> configurable</span>
      </div>

      <nav className="gvg-tabs" aria-label="Guild War workspaces">
        {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
          <button type="button" key={key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
            <Icon size={17} /><span>{label}</span>
          </button>
        ))}
      </nav>

      <main className="gvg-main">
        {tab === "lab" && (
          <section className="gvg-section" data-testid="gvg-build-lab">
            <div className="gvg-section-title"><div><span>Role model</span><h2>GvG Build Lab</h2></div><p>No universal score. Every number is a role-weighted view over visible dimensions.</p></div>
            <div className="gvg-grid gvg-grid-2">
              <article className="gvg-card gvg-feature-card">
                <div className="gvg-card-head"><div><span className="gvg-kind">MY BUILD</span><h3>Bamboocut-Dust</h3><p>Everspring Umbrella + Unfettered Rope Dart</p></div><div><label>EX level<select value={exLevel} onChange={(event) => setExLevel(Number(event.target.value))}><option value={1}>Lv1</option><option value={2}>Lv2</option><option value={3}>Lv3</option></select></label></div></div>
                <div className="gvg-callout"><Shield size={18} /><div><strong>ANTI-HEAL / ZONE PRESSURE</strong><p>Experimental GvG profile — not asserted as meta.</p></div></div>
                <div className="gvg-stat-grid">
                  <StatCard label="Everspring EX anti-heal" value={`${bamboocut.antiHealPct}%`} detail="official" />
                  <StatCard label="Unfettered EX radius" value={`${bamboocut.unfetteredRadiusMeters}m`} detail="official" />
                  <StatCard label="Post-death CC" value="None" detail="Aug 2 bug fixed" />
                  <StatCard label="PvE 60s ranking" value="Unchanged" detail="separate engine" />
                </div>
                <div className="gvg-metrics">
                  {Object.entries(bamboocut.dimensions).map(([key, value]) => <MetricBar key={key} label={key} value={Number(value)} />)}
                </div>
                <div className="gvg-role-chips">{bamboocut.roleScores.slice(0, 5).map((score: any) => <span key={score.role}><strong>{roleShort[score.role]}</strong>{score.score}</span>)}</div>
              </article>

              <article className="gvg-card">
                <div className="gvg-card-head"><div><span className="gvg-kind">BUILD VS BUILD</span><h3>Compare by role</h3></div></div>
                <div className="gvg-compare-selects">
                  <label>Build A<select value={buildAId} onChange={(event) => setBuildAId(event.target.value)}>{archetypes.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label>Build B<select value={buildBId} onChange={(event) => setBuildBId(event.target.value)}>{archetypes.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                </div>
                <div className="gvg-compare-table">
                  <div className="gvg-compare-row gvg-compare-header"><span>Role</span><span>A</span><span>B</span><span>Why</span></div>
                  {buildComparison.map((row: any) => (
                    <div className="gvg-compare-row" key={row.role}>
                      <strong>{roleShort[row.role]}</strong><span>{row.a}</span><span>{row.b}</span><small>{row.winner === "TIE" ? "Role tie" : `${row.winner} leads`} · {row.winner === "B" ? row.whyB : row.whyA}</small>
                    </div>
                  ))}
                </div>
                <p className="gvg-footnote">Scores are <strong>MODELED</strong> role suitability. They do not overwrite PvE DPS, Arena output, or verified T91/T96 formulas.</p>
              </article>
            </div>
            <article className="gvg-card">
              <div className="gvg-card-head"><div><span className="gvg-kind">ATTUNEMENT PROFILES</span><h3>Normal and Arena are separate</h3></div><EvidenceBadge value={EVIDENCE.CONFIRMED_OFFICIAL} /></div>
              <div className="gvg-profile-row">
                <label>PvE attunement profile<input value={workspace.attunementProfiles?.normal?.name ?? ""} onChange={(event) => patchWorkspace({ attunementProfiles: { ...workspace.attunementProfiles, normal: { ...workspace.attunementProfiles.normal, name: event.target.value } } })} /></label>
                <label>Arena attunement profile<input value={workspace.attunementProfiles?.arena?.name ?? ""} onChange={(event) => patchWorkspace({ attunementProfiles: { ...workspace.attunementProfiles, arena: { ...workspace.attunementProfiles.arena, name: event.target.value } } })} /></label>
                <label>GvG selected profile<select value={workspace.attunementProfiles?.gvgSelected ?? "ARENA"} onChange={(event) => patchWorkspace({ attunementProfiles: { ...workspace.attunementProfiles, gvgSelected: event.target.value } })}><option value="NORMAL">Normal</option><option value="ARENA">Arena</option></select></label>
              </div>
              <p className="gvg-footnote">Selection is exclusive; profiles never stack. Legacy PvE workspace data is referenced, not migrated into GvG coefficients.</p>
            </article>
          </section>
        )}

        {tab === "roster" && (
          <section className="gvg-section" data-testid="gvg-roster">
            <div className="gvg-section-title"><div><span>Max 30 members</span><h2>Roster Composer</h2></div><div className="gvg-inline-actions"><select value={workspace.doctrine ?? "CUSTOM"} onChange={(event) => patchWorkspace({ doctrine: event.target.value })}>{Object.entries(COMMUNITY_PRESETS).map(([key, preset]: any) => <option key={key} value={key}>{preset.label}</option>)}</select><button type="button" className="gvg-button" onClick={seedRoster}>Seed sample</button><button type="button" className="gvg-button primary" disabled={roster.length >= 30} onClick={addMember}><Plus size={16} /> Add member</button></div></div>
            <div className="gvg-diagnostics">
              <StatCard label="Available" value={`${diagnostics.members}/30`} />
              <StatCard label="Healing coverage" value={diagnostics.healingCoverage} />
              <StatCard label="Frontline coverage" value={diagnostics.frontlineCoverage} />
              <StatCard label="Anti-heal coverage" value={diagnostics.antiHealCoverage} />
              <StatCard label="AoE / CC coverage" value={diagnostics.aoeCcCoverage} />
              <StatCard label="Flex mobility" value={diagnostics.flexMobility} />
              <StatCard label="Duelist ready" value={diagnostics.duelistReadiness} />
              <StatCard label="Objective roles" value={diagnostics.objectiveDamageCoverage} />
              <StatCard label="EX diversity" value={diagnostics.exDiversity} />
              <StatCard label="Revive capacity" value={diagnostics.reviveCapacity} />
            </div>
            <div className="gvg-preset-note"><EvidenceBadge value={(COMMUNITY_PRESETS as any)[workspace.doctrine ?? "CUSTOM"]?.evidence ?? EVIDENCE.MODELED} /><span>{(COMMUNITY_PRESETS as any)[workspace.doctrine ?? "CUSTOM"]?.note}</span></div>
            {!rosterValidation.valid && <div className="gvg-warning">{rosterValidation.errors.join(" ")}</div>}
            <div className="gvg-roster-table">
              {roster.map((member, index) => (
                <article className="gvg-roster-row" key={member.id}>
                  <span className="gvg-index">{index + 1}</span>
                  <div className="gvg-roster-core"><input aria-label="Player name" value={member.name} onChange={(event) => updateMember(member.id, { name: event.target.value })} /><input aria-label="Path" value={member.path} onChange={(event) => updateMember(member.id, { path: event.target.value })} /><input aria-label="Weapons" value={member.weapons.join(" + ")} onChange={(event) => updateMember(member.id, { weapons: event.target.value.split("+").map((x) => x.trim()).filter(Boolean) })} /></div>
                  <div className="gvg-roster-meta"><select value={member.roles[0] ?? "MAIN_BALL"} onChange={(event) => updateMember(member.id, { roles: [event.target.value] })}>{GVG_ROLES.map((role: string) => <option key={role} value={role}>{roleShort[role]}</option>)}</select><input value={member.team} aria-label="Team/group" onChange={(event) => updateMember(member.id, { team: event.target.value })} /><select value={member.exTechnique} onChange={(event) => updateMember(member.id, { exTechnique: event.target.value })}>{EX_TECHNIQUES.map((technique: any) => <option key={technique.id}>{technique.name}</option>)}</select><select value={member.exLevel} onChange={(event) => updateMember(member.id, { exLevel: Number(event.target.value) })}><option value={1}>EX Lv1</option><option value={2}>EX Lv2</option><option value={3}>EX Lv3</option></select></div>
                  <div className="gvg-roster-meta"><input placeholder="Build reference" value={member.buildReference} onChange={(event) => updateMember(member.id, { buildReference: event.target.value })} /><input placeholder="Normal profile" value={member.normalProfile} onChange={(event) => updateMember(member.id, { normalProfile: event.target.value })} /><input placeholder="Arena profile" value={member.arenaProfile} onChange={(event) => updateMember(member.id, { arenaProfile: event.target.value })} /><select value={member.gvgSelectedProfile} onChange={(event) => updateMember(member.id, { gvgSelectedProfile: event.target.value as "NORMAL" | "ARENA" })}><option value="NORMAL">GvG: Normal</option><option value="ARENA">GvG: Arena</option></select></div>
                  <div className="gvg-roster-actions"><label className="gvg-check"><input type="checkbox" checked={member.availability} onChange={(event) => updateMember(member.id, { availability: event.target.checked })} /> Available</label><button type="button" className="gvg-icon-button" aria-label={`Remove ${member.name}`} onClick={() => removeMember(member.id)}><Trash2 size={16} /></button></div>
                </article>
              ))}
              {!roster.length && <div className="gvg-empty">No members yet. Add manually or seed a sample roster. Doctrine targets remain advisory.</div>}
            </div>
          </section>
        )}

        {tab === "strategy" && (
          <section className="gvg-section" data-testid="gvg-strategy-board">
            <div className="gvg-section-title"><div><span>Drag · draw · annotate</span><h2>Battle Strategy Board</h2></div><div className="gvg-inline-actions"><button type="button" className="gvg-button" onClick={addRallyPoint}><Crosshair size={16} /> Rally point</button><button type="button" className={`gvg-button ${arrowStart ? "primary" : ""}`} onClick={() => setArrowStart(null)}>Arrow: {arrowStart ? "choose end" : "click map twice"}</button><button type="button" className="gvg-icon-button" onClick={undoStrategy} disabled={!strategyHistory.length}><Undo2 size={17} /></button><button type="button" className="gvg-icon-button" onClick={redoStrategy} disabled={!strategyFuture.length}><Redo2 size={17} /></button></div></div>
            <div className="gvg-strategy-layout">
              <aside className="gvg-strategy-roster"><h3>Roster</h3>{roster.map((member) => <button key={member.id} draggable type="button" onDragStart={(event) => event.dataTransfer.setData("text/plain", member.id)} onClick={() => setSelectedStrategyMember(member.id)}><strong>{member.name}</strong><span>{member.team} · {roleShort[member.roles[0]]}</span></button>)}</aside>
              <div className="gvg-battle-map" ref={mapRef} onDragOver={(event) => event.preventDefault()} onDrop={strategyDrop} onClick={strategyClick}>
                <div className="gvg-lane lane-top"><span>TOP</span></div><div className="gvg-lane lane-mid"><span>MID</span></div><div className="gvg-lane lane-bottom"><span>BOTTOM</span></div><div className="gvg-jungle"><span>JUNGLE</span></div>
                <span className="gvg-objective obj-top">Outpost T 3:00</span><span className="gvg-objective obj-bottom">Outpost B 3:00</span><span className="gvg-objective obj-bulwark">Bulwark</span><span className="gvg-objective obj-goose">Goose</span><span className="gvg-objective obj-tree">Fortune Tree</span><span className="gvg-objective obj-boss-a">Zhang Bao</span><span className="gvg-objective obj-boss-b">Zhuxie Gule</span>
                <svg className="gvg-arrows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" /></marker></defs>{(workspace.strategy?.arrows ?? []).map((arrow: any, index: number) => <line key={index} x1={arrow.from.x} y1={arrow.from.y} x2={arrow.to.x} y2={arrow.to.y} markerEnd="url(#arrowhead)" />)}</svg>
                {(workspace.strategy?.rallyPoints ?? []).map((point: any, index: number) => <button type="button" className="gvg-rally" key={index} style={{ left: `${point.x}%`, top: `${point.y}%` }}>{point.label}</button>)}
                {Object.entries(workspace.strategy?.positions ?? {}).map(([id, position]: any) => { const member = roster.find((item) => item.id === id); if (!member) return null; return <button type="button" key={id} className={`gvg-player-pin ${selectedStrategyMember === id ? "is-selected" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={(event) => { event.stopPropagation(); setSelectedStrategyMember(id); }}><strong>{member.name}</strong><span>{roleShort[member.roles[0]]}</span></button>; })}
              </div>
              <aside className="gvg-strategy-detail"><h3>Selection</h3>{selectedMember ? <><strong>{selectedMember.name}</strong><p>{selectedMember.path}</p><p>{selectedMember.weapons.join(" + ")}</p><dl><dt>Role</dt><dd>{selectedMember.roles.map((role) => roleShort[role]).join(", ")}</dd><dt>EX</dt><dd>{selectedMember.exTechnique} · Lv{selectedMember.exLevel}</dd><dt>Build</dt><dd>{selectedMember.buildReference || "No linked build"}</dd><dt>Attunement</dt><dd>{selectedMember.gvgSelectedProfile}</dd></dl></> : <p>Select a roster member or map pin.</p>}<label>Board notes<textarea value={workspace.strategy?.notes ?? ""} onChange={(event) => patchStrategy({ ...workspace.strategy, notes: event.target.value }, false)} /></label></aside>
            </div>
            <p className="gvg-footnote">Public community map tools informed the workflow only; objective timing/mechanics shown here use the evidence model above.</p>
          </section>
        )}

        {tab === "timeline" && (
          <section className="gvg-section" data-testid="gvg-timeline-simulator">
            <div className="gvg-section-title"><div><span>Discrete-event model</span><h2>Timeline & Objective Simulator</h2></div><EvidenceBadge value={EVIDENCE.MODELED} /></div>
            <div className="gvg-grid gvg-grid-2">
              <article className="gvg-card">
                <h3>Event timeline</h3>
                <div className="gvg-fixed-event"><strong>3:00</strong><span>Xuanyuan Cult top/bottom outposts spawn</span><EvidenceBadge value={EVIDENCE.CONFIRMED_OFFICIAL} /></div>
                <div className="gvg-form-grid">
                  <label>Halftime (sec)<input type="number" placeholder="Configurable" value={workspace.halftime?.timeSeconds ?? ""} onChange={(event) => patchWorkspace({ halftime: { ...workspace.halftime, timeSeconds: event.target.value === "" ? null : Number(event.target.value) } })} /></label>
                  <label>Halftime reward<input placeholder="Configurable / unknown" value={workspace.halftime?.reward ?? ""} onChange={(event) => patchWorkspace({ halftime: { ...workspace.halftime, reward: event.target.value } })} /></label>
                  <label>Zhang Bao base (sec)<input type="number" value={workspace.objectiveParams?.zhangBaoBaseSeconds ?? ""} onChange={(event) => patchWorkspace({ objectiveParams: { ...workspace.objectiveParams, zhangBaoBaseSeconds: event.target.value === "" ? null : Number(event.target.value) } })} /></label>
                  <label>Zhuxie Gule base (sec)<input type="number" value={workspace.objectiveParams?.zhuxieGuleBaseSeconds ?? ""} onChange={(event) => patchWorkspace({ objectiveParams: { ...workspace.objectiveParams, zhuxieGuleBaseSeconds: event.target.value === "" ? null : Number(event.target.value) } })} /></label>
                </div>
                <div className="gvg-window-grid"><StatCard label="Zhang Bao window" value={neutralBossWindow(workspace.objectiveParams?.zhangBaoBaseSeconds) ? `${formatTime(neutralBossWindow(workspace.objectiveParams.zhhangBaoBaseSeconds)?.earliest)}–${formatTime(neutralBossWindow(workspace.objectiveParams.zhangBaoBaseSeconds)?.latest)}` : "Base unknown"} detail="±1m official" /><StatCard label="Zhuxie Gule window" value={neutralBossWindow(workspace.objectiveParams?.zhuxieGuleBaseSeconds) ? `${formatTime(neutralBossWindow(workspace.objectiveParams.zhuxieGuleBaseSeconds)?.earliest)}–${formatTime(neutralBossWindow(workspace.objectiveParams.zhuxieGuleBaseSeconds)?.latest)}` : "Base unknown"} detail="±1m official" /></div>
                <div className="gvg-inline-actions"><button type="button" className="gvg-button" disabled={workspace.halftime?.timeSeconds == null} onClick={() => addTimelineEvent("Halftime", workspace.halftime.timeSeconds, "CONFIGURABLE")}>Add halftime</button><button type="button" className="gvg-button" onClick={() => addTimelineEvent("Main Ball push", 360)}>Add 6:00 push</button><button type="button" className="gvg-button" onClick={() => addTimelineEvent("Tree escort phase", 900)}>Add escort plan</button></div>
                <div className="gvg-timeline-list"><div><strong>3:00</strong><span>Outposts spawn</span><small>ownership lock 60s</small></div>{(workspace.timeline ?? []).map((event: any) => <div key={event.id}><strong>{formatTime(event.timeSeconds)}</strong><span>{event.label}</span><small>{event.type}</small><button type="button" onClick={() => patchWorkspace({ timeline: workspace.timeline.filter((item: any) => item.id !== event.id) })}><X size={14} /></button></div>)}</div>
              </article>

              <article className="gvg-card">
                <h3>Bulwark / Goose scenario</h3>
                <div className="gvg-form-grid">
                  <label>Objective<select value={simParams.objective} onChange={(event) => setSimParams({ ...simParams, objective: event.target.value })}><option value="BULWARK">Bulwark</option><option value="GOOSE">Goose</option></select></label>
                  <label>League<select value={simParams.league} onChange={(event) => setSimParams({ ...simParams, league: event.target.value })}>{Object.entries(LEAGUE_SCALING).map(([key, row]: any) => <option key={key} value={key}>{row.label}</option>)}</select></label>
                  <label>Base objective HP<input type="number" value={simParams.objectiveHp} onChange={(event) => setSimParams({ ...simParams, objectiveHp: Number(event.target.value) })} /></label>
                  <label>Team objective DPS<input type="number" value={simParams.teamObjectiveDps} onChange={(event) => setSimParams({ ...simParams, teamObjectiveDps: Number(event.target.value) })} /></label>
                  <label>Nearby players<input type="number" min={0} max={30} value={simParams.nearbyPlayers} onChange={(event) => setSimParams({ ...simParams, nearbyPlayers: Number(event.target.value) })} /></label>
                  <label>DR per stack<input type="number" step="0.01" min={0} max={1} placeholder="UNKNOWN — manual" value={simParams.manualDrPerStack} onChange={(event) => setSimParams({ ...simParams, manualDrPerStack: event.target.value })} /></label>
                </div>
                <div className="gvg-stat-grid"><StatCard label="Proximity stacks" value={simResult.stacks} detail={`cap ${simParams.objective === "GOOSE" ? 30 : 15}`} /><StatCard label="Scaled HP" value={Math.round(simResult.scaledHp).toLocaleString()} detail={simResult.leagueEvidence} /><StatCard label="Effective DPS" value={simResult.effectiveDps == null ? "DR unknown" : Math.round(simResult.effectiveDps).toLocaleString()} /><StatCard label="Estimated break" value={simResult.breakTimeSeconds == null ? "Needs manual DR" : formatTime(simResult.breakTimeSeconds)} detail="scenario estimate" /></div>
                <div className="gvg-warning subtle">No win probability is generated. Exact objective HP and DR/stack remain scenario inputs until current Global evidence exists.</div>
                <h4>Sensitivity: nearby players</h4>
                <div className="gvg-sensitivity">{sensitivity.map((row: any) => <div key={row.nearbyPlayers}><strong>{row.nearbyPlayers}</strong><span>{row.stacks} stacks</span><small>{row.damageMultiplier == null ? "DR unknown" : `×${row.damageMultiplier.toFixed(2)} damage`}</small></div>)}</div>
                <div className="gvg-qi-check"><span>Guild War Qi example</span><strong>100 → {applyGuildWarQiDamage(100)}</strong><EvidenceBadge value={EVIDENCE.CONFIRMED_OFFICIAL} /></div>
                <small className="gvg-cache-key">cache: {objectiveSimulationCacheKey({ ...simParams, rosterSignature: rosterSignature(roster), role: "JUNGLER_OBJECTIVE", build: buildA.id }).slice(0, 120)}…</small>
              </article>
            </div>
            <article className="gvg-card"><div className="gvg-card-head"><div><h3>Guild War EX techniques</h3><p>Current May Guild War effects; later Path/Arena patches remain separate evidence.</p></div><EvidenceBadge value={EVIDENCE.CONFIRMED_OFFICIAL} /></div><div className="gvg-ex-grid">{EX_TECHNIQUES.map((technique: any) => <div key={technique.id}><strong>{technique.name}</strong><p>{technique.current}</p></div>)}</div><p className="gvg-footnote">Cooldown family: {EX_COOLDOWN_RULE.mappings.map((item: any) => `${item.from}s→${item.to}s`).join("; ")}. Exact technique-to-bucket assignment is not fabricated.</p></article>
          </section>
        )}

        {tab === "commander" && (
          <section className="gvg-section" data-testid="gvg-commander-planner">
            <div className="gvg-section-title"><div><span>Fun Coins + cooldown planning</span><h2>Commander Planner</h2></div><EvidenceBadge value={EVIDENCE.UNKNOWN} /></div>
            <div className="gvg-grid gvg-grid-2">
              <article className="gvg-card"><h3>Resource plan</h3><label>Starting Fun Coins<input type="number" value={workspace.commander?.startingCoins ?? 0} onChange={(event) => patchWorkspace({ commander: { ...workspace.commander, startingCoins: Number(event.target.value) } })} /></label><div className="gvg-inline-form"><input type="number" value={coinDraft.timeSeconds} onChange={(event) => setCoinDraft({ ...coinDraft, timeSeconds: Number(event.target.value) })} /><input type="number" value={coinDraft.amount} onChange={(event) => setCoinDraft({ ...coinDraft, amount: Number(event.target.value) })} /><input value={coinDraft.label} onChange={(event) => setCoinDraft({ ...coinDraft, label: event.target.value })} /><button type="button" className="gvg-button" onClick={() => addCoinEvent(coinDraft)}><Plus size={15} /> Income</button></div><div className="gvg-inline-form"><input type="number" value={commandDraft.timeSeconds} onChange={(event) => setCommandDraft({ ...commandDraft, timeSeconds: Number(event.target.value) })} /><input type="number" value={commandDraft.amount} onChange={(event) => setCommandDraft({ ...commandDraft, amount: Number(event.target.value) })} /><input value={commandDraft.label} onChange={(event) => setCommandDraft({ ...commandDraft, label: event.target.value })} /><input placeholder="CD sec (manual)" value={commandDraft.cooldownSeconds} onChange={(event) => setCommandDraft({ ...commandDraft, cooldownSeconds: event.target.value })} /><button type="button" className="gvg-button" onClick={() => addCoinEvent(commandDraft)}><Plus size={15} /> Spend</button></div><p className="gvg-footnote">May 28 confirms Command Skill costs/CDs changed but does not publish the exact current table. Inputs are manual until verified.</p></article>
              <article className="gvg-card"><h3>Fun Coin curve</h3><div className="gvg-coin-curve">{coinCurve.map((event: any) => <div key={event.id}><strong>{formatTime(event.timeSeconds)}</strong><span>{event.label}</span><em className={event.amount >= 0 ? "positive" : "negative"}>{event.amount >= 0 ? "+" : ""}{event.amount}</em><b>{event.balance}</b></div>)}{!coinCurve.length && <div className="gvg-empty">Add jungle/boss income and command spends to build the resource curve.</div>}</div></article>
            </div>
            <article className="gvg-card"><h3>Known commander constraints</h3><div className="gvg-fact-list"><div><strong>Neutral jungle</strong><span>1 monster/camp; increased attributes and Fun Coin reward.</span><EvidenceBadge value={EVIDENCE.CONFIRMED_OFFICIAL} /></div><div><strong>Boss timing</strong><span>Randomized ±1 minute from base timer.</span><EvidenceBadge value={EVIDENCE.CONFIRMED_OFFICIAL} /></div><div><strong>Ignore Interception</strong><span>Can breach wind-wall blockade.</span><EvidenceBadge value={EVIDENCE.CONFIRMED_OFFICIAL} /></div><div><strong>Exact command table</strong><span>Manual/configurable; old January values are not current truth.</span><EvidenceBadge value={EVIDENCE.UNKNOWN} /></div></div></article>
          </section>
        )}

        {tab === "support" && (
          <section className="gvg-section" data-testid="gvg-support-lab">
            <div className="gvg-grid gvg-grid-2">
              <article className="gvg-card"><div className="gvg-card-head"><div><span className="gvg-kind">HALFTIME</span><h3>Duelist selection</h3></div><EvidenceBadge value={EVIDENCE.COMMUNITY_CONFLICTING} /></div><p>Uses an Arena-like evaluation: burst, survival, control escape, mobility, Arena Attunement and matchup archetype. Halftime timestamp/reward remain configurable.</p>{(["primary", "backup1", "backup2"] as const).map((slot) => <label key={slot}>{slot === "primary" ? "Primary" : slot === "backup1" ? "Backup 1" : "Backup 2"}<select value={workspace.duelist?.[slot] ?? ""} onChange={(event) => patchWorkspace({ duelist: { ...workspace.duelist, [slot]: event.target.value || null } })}><option value="">Unassigned</option>{roster.map((member) => <option key={member.id} value={member.id}>{member.name} — {member.path}</option>)}</select></label>)}<div className="gvg-fact-list"><div><strong>Burst</strong><span>Role-scored, not PvE DPS rank.</span><EvidenceBadge value={EVIDENCE.MODELED} /></div><div><strong>Arena profile</strong><span>Selected independently from Normal Attunement.</span><EvidenceBadge value={EVIDENCE.CONFIRMED_OFFICIAL} /></div></div></article>
              <article className="gvg-card"><div className="gvg-card-head"><div><span className="gvg-kind">HEALING DUMMY</span><h3>GvG healer calibration</h3></div><EvidenceBadge value={EVIDENCE.MODELED} /></div><div className="gvg-form-grid">{[["hps","HPS"],["burstHealing","Burst healing"],["sustainedHealing","Sustained healing"],["reviveUtility","Revive utility"],["enduranceSupport","Endurance support"],["antiHealExposure","Anti-heal exposure"],["survivability","Survivability"]].map(([key,label]) => <label key={key}>{label}<input type="number" value={workspace.healerCalibration?.[key] ?? ""} placeholder="Future dummy data" onChange={(event) => patchWorkspace({ healerCalibration: { ...workspace.healerCalibration, [key]: event.target.value === "" ? null : Number(event.target.value) } })} /></label>)}</div><p className="gvg-footnote">Calibration fields accept future Guild War Healing Dummy screenshots/data. They do not auto-learn formulas from one observation.</p></article>
            </div>
          </section>
        )}

        {tab === "logs" && (
          <section className="gvg-section" data-testid="gvg-match-log">
            <div className="gvg-section-title"><div><span>Empirical evidence, no auto-learning</span><h2>Guild War Match Log</h2></div><button type="button" className="gvg-button" onClick={() => downloadJson("wwm-gvg-match-logs-v1.json", workspace.matchLogs ?? [])}><Download size={16} /> Export logs</button></div>
            <div className="gvg-grid gvg-grid-2">
              <form className="gvg-card" onSubmit={(event) => { event.preventDefault(); saveMatch(event.currentTarget); }}><h3>Record match</h3><div className="gvg-form-grid"><label>Date<input name="date" type="date" required /></label><label>Patch<input name="patch" placeholder="2.0 / 2026-08-07" /></label><label>League<input name="league" /></label><label>Opponent<input name="opponent" /></label><label>Result<select name="result"><option value="WIN">Win</option><option value="LOSS">Loss</option><option value="DRAW">Draw/other</option></select></label><label>Duel outcome<input name="duelOutcome" /></label><label>Kills<input name="kills" type="number" /></label><label>Deaths<input name="deaths" type="number" /></label><label>Damage<input name="damage" type="number" /></label><label>Healing<input name="healing" type="number" /></label><label>Objective damage<input name="objectiveDamage" type="number" /></label><label>Bulwark break (sec)<input name="bulwarkBreakSeconds" type="number" /></label><label>Goose break (sec)<input name="gooseBreakSeconds" type="number" /></label><label>Tree pickup (sec)<input name="treePickupSeconds" type="number" /></label><label>Tree distance<input name="treeDistance" type="number" /></label><label className="gvg-check"><input name="treeDelivered" type="checkbox" /> Tree delivered</label></div><button type="submit" className="gvg-button primary"><Save size={16} /> Save structured match</button></form>
              <article className="gvg-card"><h3>Recorded matches ({workspace.matchLogs?.length ?? 0})</h3><div className="gvg-log-list">{(workspace.matchLogs ?? []).map((log: any) => <div key={log.id}><div><strong>{log.date} · {log.opponent || "Unknown opponent"}</strong><span>{log.patch || "Patch unset"} · {log.league || "League unset"}</span></div><b>{log.result}</b><small>K/D {log.kills}/{log.deaths} · Heal {Number(log.healing).toLocaleString()} · Obj {Number(log.objectiveDamage).toLocaleString()}</small><EvidenceBadge value={EVIDENCE.CONFIRMED_CLIENT} /></div>)}{!(workspace.matchLogs?.length) && <div className="gvg-empty">No match logs. Future formula calibration must use explicit, versioned analysis over a defensible sample.</div>}</div></article>
            </div>
          </section>
        )}

        {tab === "share" && (
          <section className="gvg-section" data-testid="gvg-sharing">
            <div className="gvg-section-title"><div><span>Versioned schema v1</span><h2>Sharing & Community</h2></div><div className="gvg-kind-row"><span>MY BUILD</span><span>COMMUNITY BUILD</span><span>REFERENCE BUILD</span><span>GUILD STRATEGY</span></div></div>
            <div className="gvg-grid gvg-grid-2">
              <article className="gvg-card"><h3>Publish / export</h3><label>Share scope<select value={shareKind} onChange={(event) => setShareKind(event.target.value)}>{SHARE_KINDS.map((kind: string) => <option key={kind}>{kind}</option>)}</select></label><label className="gvg-check"><input type="checkbox" checked={redactNames} onChange={(event) => setRedactNames(event.target.checked)} /> Redact player names before public sharing</label><div className="gvg-inline-actions"><button type="button" className="gvg-button primary" onClick={copyShareLink}><Copy size={16} /> Copy link</button><button type="button" className="gvg-button" onClick={exportShare}><Download size={16} /> Export JSON</button><label className="gvg-button file-button"><Upload size={16} /> Import JSON<input type="file" accept="application/json,.json" onChange={(event) => importShareFile(event.target.files?.[0] ?? null)} /></label></div><p className="gvg-footnote">Public links contain a versioned payload in the URL hash. Redaction pseudonymizes roster/player names before serialization.</p></article>
              <article className="gvg-card"><h3>Clone to my workspace</h3><textarea className="gvg-share-text" placeholder="Paste or import a WWM GvG share JSON payload…" value={shareText} onChange={(event) => setShareText(event.target.value)} /><button type="button" className="gvg-button primary" onClick={cloneShare}><Copy size={16} /> Clone to my workspace</button>{shareStatus && <p className="gvg-share-status">{shareStatus}</p>}</article>
            </div>
            <article className="gvg-card"><h3>Schema guarantees</h3><div className="gvg-fact-list"><div><strong>v1 envelope</strong><span>Kind, version, creation time, privacy metadata, payload.</span><EvidenceBadge value={EVIDENCE.CONFIRMED_CLIENT} /></div><div><strong>Round-trip</strong><span>Roster, strategy and full plan clone without mutating legacy PvE state.</span><EvidenceBadge value={EVIDENCE.CONFIRMED_CLIENT} /></div><div><strong>Privacy</strong><span>Optional deterministic Player 01/02/… redaction before sharing.</span><EvidenceBadge value={EVIDENCE.CONFIRMED_CLIENT} /></div></div></article>
          </section>
        )}
      </main>
    </div>
  );
}
