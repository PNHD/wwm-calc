import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowLeftRight, BookOpen, ChevronRight, Clock3, Crosshair, Database, Download,
  Gauge, History, Info, Library, ListChecks, MoreHorizontal, Play, Save, Shield, ShieldCheck,
  Sparkles, Swords, Upload, Users, Zap,
} from "lucide-react";
import "./arena.css";
import {
  ARENA_ATTUNEMENTS, ARENA_HISTORY_KEY, ARENA_MODES, ARENA_PATCH, ARENA_REFERENCE_PRESETS,
  ARENA_STORAGE_KEY, BATTLEGROUPS, BAMBOOCUT_DUST_RULES, EVIDENCE, PATH_PROFILES,
  REACTION_PRESETS, applyArenaEvent, compareArenaBuilds, createCombatState, decodeArenaShare,
  defaultArenaState, encodeArenaShare, loadArenaHistory, loadArenaState, matchupCompare,
  rankArenaCandidates, readPveInventorySnapshot, saveArenaHistory, saveArenaState,
  simulateTeamArena, simulateTimeline, summarizeHistory, validate3v3Composition,
} from "./arena-core.mjs";
import evidenceCatalog from "./arena-evidence.json";

type Route = "overview" | "build" | "matchups" | "compare" | "simulation" | "history" | "attunement" | "skills" | "evidence" | "reference" | "transfer";
type ArenaState = ReturnType<typeof defaultArenaState>;

const PRIMARY: Array<{ id: Route; label: string; icon: typeof Activity }> = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "build", label: "Build", icon: Shield },
  { id: "matchups", label: "Matchups", icon: Crosshair },
  { id: "compare", label: "Compare", icon: ArrowLeftRight },
  { id: "simulation", label: "Simulation", icon: Play },
  { id: "history", label: "History", icon: History },
];
const SECONDARY: Array<{ id: Route; label: string }> = [
  { id: "attunement", label: "Arena Attunement" },
  { id: "skills", label: "Skills & Mystic Skills" },
  { id: "evidence", label: "Evidence" },
  { id: "reference", label: "Reference Builds" },
  { id: "transfer", label: "Import / Export" },
];
const PATHS = Object.keys(PATH_PROFILES);
const DIMENSIONS: Array<[string, string]> = [
  ["burst", "BURST PRESSURE"], ["sustain", "SUSTAINED PRESSURE"], ["survival", "SURVIVABILITY"],
  ["control", "CONTROL"], ["mobility", "MOBILITY"], ["qi", "QI PRESSURE"], ["recovery", "RECOVERY"], ["antiHeal", "ANTI-HEAL"],
];

const routeFromHash = (): Route => {
  const segment = (location.hash.match(/^#arena\/([^/?]+)/)?.[1] || "overview").toLowerCase();
  return [...PRIMARY, ...SECONDARY].some((item) => item.id === segment) ? segment as Route : "overview";
};
const sharedTokenFromHash = () => location.hash.match(/^#arena\/shared\/([^/?]+)/)?.[1] || null;
const go = (route: Route) => { location.hash = `#arena/${route}`; };

const evidenceLabel = (value: string) => value === EVIDENCE.CONFIRMED_OFFICIAL ? "Official" : value === EVIDENCE.CONFIRMED_CLIENT ? "Client verified" : value === EVIDENCE.COMMUNITY_CORROBORATED ? "Community" : value === EVIDENCE.MODELED ? "Modeled" : "Unknown";
const labelFor = (value: number) => value >= 4.35 ? "Excellent" : value >= 3.75 ? "Strong" : value >= 3.15 ? "Balanced" : value >= 2.55 ? "Limited" : "Low";

function WorkspaceSwitcher() {
  return <nav className="arena-global-switcher" aria-label="Product workspaces">
    <button type="button" onClick={() => { location.hash = "#pve/overview"; }}>PvE<small>Boss Lab</small></button>
    <button type="button" className="is-active" aria-current="page">Arena<small>PvP Lab</small></button>
    <button type="button" onClick={() => { location.hash = "#gvg/overview"; }}>Guild War<small>Grand Battles</small></button>
  </nav>;
}

function TrustChip({ kind }: { kind: string }) {
  return <span className={`arena-chip trust-${kind.toLowerCase().replace(/_/g, "-")}`}>{evidenceLabel(kind)}</span>;
}

function SectionHeader({ eyebrow, title, copy, actions }: { eyebrow?: string; title: string; copy?: string; actions?: React.ReactNode }) {
  return <div className="arena-section-heading">
    <div>{eyebrow && <span className="arena-eyebrow">{eyebrow}</span>}<h2>{title}</h2>{copy && <p>{copy}</p>}</div>
    {actions && <div className="arena-heading-actions">{actions}</div>}
  </div>;
}

function DimensionBars({ path }: { path: string }) {
  const profile = PATH_PROFILES[path] || PATH_PROFILES["Bamboocut-Dust"];
  return <div className="arena-dimension-grid" data-testid="arena-dimensions">
    {DIMENSIONS.map(([key, label]) => {
      const value = profile.dimensions[key];
      return <article className="arena-dimension" key={key}>
        <div><span>{label}</span><strong>{labelFor(value)}</strong></div>
        <div className="arena-meter" aria-label={`${label}: ${labelFor(value)}`}><span style={{ width: `${value * 20}%` }} /></div>
      </article>;
    })}
  </div>;
}

function Overview({ state, profile, setState }: { state: ArenaState; profile: any; setState: (s: ArenaState) => void }) {
  const matchup = matchupCompare(profile.path, state.opponentPath, profile.mode);
  const weakest = matchup.dimensions.slice().sort((a: any, b: any) => a.delta - b.delta)[0];
  return <div data-testid="arena-overview">
    <SectionHeader eyebrow="Arena / Overview" title="Plan the matchup, not a PvE rotation" copy="Your active Arena profile is isolated from PvE and Guild War. Every recommendation is tied to a mode, opponent context and evidence maturity." />
    <article className="arena-hero-card">
      <div className="arena-hero-copy">
        <span className="arena-kicker">MY ARENA BUILD</span>
        <h3>{profile.name}</h3>
        <p>{profile.path} · {profile.weapons.join(" + ")}</p>
        <div className="arena-chip-row"><span className="arena-chip accent">{profile.mode}</span><span className="arena-chip">{profile.battlegroup}</span><TrustChip kind={EVIDENCE.MODELED} /></div>
      </div>
      <div className="arena-mode-picker" aria-label="Arena mode">
        {ARENA_MODES.map((mode: string) => <button key={mode} type="button" className={profile.mode === mode ? "is-active" : ""} onClick={() => setState(updateProfile(state, { mode }))}>{mode === "5v5" ? "5v5 / Group" : mode}</button>)}
      </div>
    </article>
    <DimensionBars path={profile.path} />
    <div className="arena-three-col">
      <article className="arena-card"><span className="arena-kicker">STRENGTHS</span><ul>{(PATH_PROFILES[profile.path]?.strengths || ["Mode-specific tool coverage"]).map((v: string) => <li key={v}>{v}</li>)}</ul></article>
      <article className="arena-card risk"><span className="arena-kicker">RISKS</span><ul>{(PATH_PROFILES[profile.path]?.risks || ["Matchup evidence remains modeled"]).map((v: string) => <li key={v}>{v}</li>)}</ul></article>
      <article className="arena-card action"><span className="arena-kicker">NEXT ACTION</span><h4>{weakest ? `Improve ${weakest.label}` : "Run a matchup"}</h4><p>{weakest ? `Current comparison vs ${state.opponentPath} is ${weakest.result.toLowerCase()}.` : "Choose an opponent to expose your weakest tool dimension."}</p><button type="button" onClick={() => go("matchups")}>Open Matchup Lab <ChevronRight size={15} /></button></article>
    </div>
  </div>;
}

function updateProfile(state: ArenaState, patch: Record<string, any>): ArenaState {
  return { ...state, profiles: state.profiles.map((p: any) => p.id === state.activeProfileId ? { ...p, ...patch } : p) } as ArenaState;
}

function Build({ state, profile, setState }: { state: ArenaState; profile: any; setState: (s: ArenaState) => void }) {
  const [objective, setObjective] = useState(state.objective || "1V1_GENERAL");
  const [ranked, setRanked] = useState<any[]>([]);
  const inventory = profile.gearSnapshot;
  const importPve = () => {
    const snapshot = readPveInventorySnapshot();
    setState(updateProfile(state, { gearSnapshot: snapshot }));
  };
  const runBest = () => {
    const candidates = state.profiles.map((p: any) => ({ ...p, name: p.name || p.path }));
    if (candidates.length === 1) {
      candidates.push({ ...profile, id: `${profile.id}-survival`, name: `${profile.name} · survival variant`, arenaDimensions: { ...profile.arenaDimensions, survival: .35, burst: -.12 } });
      candidates.push({ ...profile, id: `${profile.id}-pressure`, name: `${profile.name} · pressure variant`, arenaDimensions: { ...profile.arenaDimensions, burst: .28, qi: .18, survival: -.1 } });
    }
    setRanked(rankArenaCandidates(candidates, objective, state.opponentPath));
  };
  return <div data-testid="arena-build">
    <SectionHeader eyebrow="Arena / Build" title="Arena build profile" copy="Reuse inventory as a read-only snapshot. Arena mode, Attunement, Mystic Skills and matchup objectives live in their own state." actions={<button className="arena-secondary-btn" type="button" onClick={importPve}><Download size={15} /> Use My Current Gear</button>} />
    <div className="arena-two-col wide-left">
      <article className="arena-card arena-form-card">
        <label>Build name<input value={profile.name} onChange={(e) => setState(updateProfile(state, { name: e.target.value }))} maxLength={80} /></label>
        <label>Path<select value={profile.path} onChange={(e) => { const path = e.target.value; setState(updateProfile(state, { path, weapons: PATH_PROFILES[path].weapons })); }}>{PATHS.map((p) => <option key={p}>{p}</option>)}</select></label>
        <div className="arena-field"><span>Weapons</span><strong>{profile.weapons.join(" · ")}</strong></div>
        <label>Mode<select value={profile.mode} onChange={(e) => setState(updateProfile(state, { mode: e.target.value }))}>{ARENA_MODES.map((m: string) => <option key={m} value={m}>{m === "5v5" ? "5v5 / Group Strategy" : m}</option>)}</select></label>
        <label>Battlegroup<select value={profile.battlegroup} onChange={(e) => setState(updateProfile(state, { battlegroup: e.target.value }))}>{BATTLEGROUPS.map((b: any) => <option value={b.id} key={b.id}>{b.id} · {b.region}</option>)}</select></label>
        <label>Latency context<select value={profile.latency} onChange={(e) => setState(updateProfile(state, { latency: e.target.value }))}><option>Low latency</option><option>Moderate latency</option><option>High latency</option></select></label>
      </article>
      <article className="arena-card">
        <span className="arena-kicker">GEAR SNAPSHOT</span>
        {inventory ? <><h4>{inventory.schemeName || "Imported PvE scheme"}</h4><p className="arena-muted">Read-only copy from PvE inventory. Switching workspaces will not write this back.</p><div className="arena-gear-list">{(inventory.gear || []).slice(0, 10).map((item: any, i: number) => <div key={item.id || i}><span>{item.slot || `Slot ${i + 1}`}</span><strong>{item.name || "Gear item"}</strong></div>)}</div></> : <div className="arena-empty"><Database size={24} /><h4>No Arena gear snapshot yet</h4><p>Import your current PvE gear once, or use a mechanic-only Arena reference. Normal Attunement is never stacked into Arena Attunement automatically.</p></div>}
      </article>
    </div>
    <article className="arena-card arena-optimizer" data-testid="arena-best-build">
      <div><span className="arena-kicker">BEST ARENA BUILD · EXPLICIT RUN</span><h3>Objective-specific optimizer</h3><p>Runs only when requested and ranks by Arena dimensions. PvE DPS is not an input.</p></div>
      <div className="arena-inline-controls"><select aria-label="Arena optimizer objective" value={objective} onChange={(e) => setObjective(e.target.value)}><option value="1V1_GENERAL">1V1 GENERAL</option><option value="VS_BURST">VS BURST</option><option value="VS_RANGED">VS RANGED</option><option value="VS_TANK">VS TANK</option><option value="3V3_BURST">3V3 BURST</option><option value="3V3_SUPPORT">3V3 SUPPORT</option></select><button type="button" onClick={runBest}><Sparkles size={15} /> Run Top 3</button></div>
      {ranked.length > 0 && <div className="arena-ranked-list">{ranked.map((r, i) => <div key={r.id}><span>#{i + 1}</span><div><strong>{r.name}</strong><small>{objective} · {r.rankingConfidence || "MODELED"}</small></div><span className="arena-chip">{r.path}</span></div>)}</div>}
    </article>
  </div>;
}

function Matchups({ state, profile, setState }: { state: ArenaState; profile: any; setState: (s: ArenaState) => void }) {
  const result = useMemo(() => matchupCompare(profile.path, state.opponentPath, profile.mode), [profile.path, profile.mode, state.opponentPath]);
  const [team, setTeam] = useState([
    { name: "You", martialArts: [profile.weapons[0], profile.weapons[1]] },
    { name: "Ally 2", martialArts: ["Nameless Sword", "Nameless Spear"] },
    { name: "Ally 3", martialArts: ["Vernal Umbrella", "Inkwell Fan"] },
  ]);
  const teamValidation = validate3v3Composition(team);
  return <div data-testid="arena-matchups">
    <SectionHeader eyebrow="Arena / Matchups" title="Matchup Lab" copy="Compare available tools: HP pressure, Qi pressure, control, resource economy and defensive answers. No fabricated win probability." />
    <article className="arena-matchup-picker">
      <div><span>MY BUILD</span><strong>{profile.path}</strong><small>{profile.weapons.join(" + ")}</small></div><Swords size={24} />
      <label>OPPONENT PATH<select aria-label="Opponent Path" value={state.opponentPath} onChange={(e) => setState({ ...state, opponentPath: e.target.value } as ArenaState)}>{PATHS.map((p) => <option key={p}>{p}</option>)}</select></label>
    </article>
    <article className="arena-card arena-result" data-testid="arena-matchup-result">
      <div className="arena-result-head"><div><span className="arena-kicker">{profile.path} vs {state.opponentPath}</span><h3>{result.verdict}</h3></div><span className="arena-chip accent">{result.confidence}</span></div>
      <div className="arena-matchup-dimensions">{result.dimensions.map((d: any) => <div key={d.key}><span>{d.label}</span><strong className={d.result.toLowerCase()}>{d.result}</strong><small>{d.delta > 0 ? "+" : ""}{d.delta.toFixed(2)} modeled tool delta</small></div>)}</div>
      <div className="arena-why"><strong>WHY</strong>{result.why.map((text: string) => <p key={text}>{text}</p>)}</div>
    </article>
    {profile.mode === "3v3" && <article className="arena-card" data-testid="arena-3v3-composition">
      <SectionHeader title="3v3 composition" copy="Team-event abstraction: focus, peel, sustain, control coverage, anti-heal and revive utility." />
      <div className="arena-team-grid">{team.map((member, index) => <label key={index}>{member.name}<select aria-label={`Player ${index + 1} primary Martial Art`} value={member.martialArts[0]} onChange={(e) => setTeam(team.map((m, i) => i === index ? { ...m, martialArts: [e.target.value, m.martialArts[1]] } : m))}>{[...new Set(PATHS.flatMap((p) => PATH_PROFILES[p].weapons))].map((a) => <option key={a}>{a}</option>)}</select></label>)}</div>
      <div className={`arena-validation ${teamValidation.valid ? "ok" : "bad"}`}><ShieldCheck size={17} /><span>{teamValidation.valid ? "Composition valid: same Martial Art ≤ 2." : teamValidation.violations.join(" ")}</span></div><p className="arena-muted">{teamValidation.revive}</p>
    </article>}
    {profile.mode === "5v5" && <TeamStrategy />}
  </div>;
}

function TeamStrategy() {
  const teamModel = simulateTeamArena({ mode: "5v5" });
  return <article className="arena-card" data-testid="arena-team-strategy"><span className="arena-kicker">5V5 / GROUP STRATEGY</span><h3>Lighter team context</h3><p>{teamModel.note}</p><div className="arena-chip-row">{teamModel.dimensions.map((d: string) => <span className="arena-chip" key={d}>{d}</span>)}</div></article>;
}

function Compare({ state, profile }: { state: ArenaState; profile: any }) {
  const [aId, setA] = useState(profile.id);
  const [bId, setB] = useState(state.profiles[1]?.id || profile.id);
  const [objective, setObjective] = useState("1V1_GENERAL");
  const a = state.profiles.find((p: any) => p.id === aId) || profile;
  const bBase = state.profiles.find((p: any) => p.id === bId) || profile;
  const b = aId === bId ? { ...bBase, name: `${bBase.name} · defense-leaning scenario`, arenaDimensions: { ...bBase.arenaDimensions, survival: .25, burst: -.08 } } : bBase;
  const result = compareArenaBuilds(a, b, { objective });
  return <div data-testid="arena-compare">
    <SectionHeader eyebrow="Arena / Compare" title="Arena Build Compare" copy="A vs B is evaluated for a selected Arena objective. Existing 1106/1129 PvE ordering is intentionally not imported as Arena truth." />
    <div className="arena-compare-pickers"><label>BUILD A<select value={aId} onChange={(e) => setA(e.target.value)}>{state.profiles.map((p: any) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><ArrowLeftRight size={22} /><label>BUILD B<select value={bId} onChange={(e) => setB(e.target.value)}>{state.profiles.map((p: any) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>OBJECTIVE<select value={objective} onChange={(e) => setObjective(e.target.value)}><option>1V1_GENERAL</option><option>VS_BURST</option><option>VS_RANGED</option><option>VS_TANK</option><option>3V3_BURST</option><option>3V3_SUPPORT</option></select></label></div>
    <article className="arena-card"><div className="arena-result-head"><h3>{result.verdict}</h3><span className="arena-chip accent">{objective}</span></div><p>{result.explanation}</p><div className="arena-compare-grid">{result.dimensions.map((d: any) => <div key={d.key}><span>{d.label}</span><strong>{d.delta > 0 ? "+" : ""}{d.delta.toFixed(2)}</strong><small>A {d.a.toFixed(2)} · B {d.b.toFixed(2)}</small></div>)}</div>{result.arenaAttunementChanged && <div className="arena-validation"><Info size={16} /> Arena Attunement changed between builds and is called out separately.</div>}</article>
  </div>;
}

function Simulation() {
  const [horizon, setHorizon] = useState(15);
  const [reaction, setReaction] = useState("average");
  const timeline = simulateTimeline({ horizon, reaction });
  let combat = createCombatState({ hp: 82, qi: 68 });
  combat = applyArenaEvent(combat, { t: 5, type: "HIT_STAGGER" });
  combat = applyArenaEvent(combat, { t: 5.1, type: "GUARDING_QI_CORE", hpRestore: 0, qiRestore: 0 });
  combat = applyArenaEvent(combat, { t: 10, type: "EXECUTE_KNOCKDOWN" });
  combat = applyArenaEvent(combat, { t: 11, type: "QI_DAMAGE", amount: 25 });
  combat = applyArenaEvent(combat, { t: 12, type: "GET_UP_AFTER_EXECUTE" });
  return <div data-testid="arena-simulation">
    <SectionHeader eyebrow="Arena / Simulation" title="PvP state & resource simulator" copy="Bounded discrete events, not full physics. Network and animation mechanics are modeled as state/timing/reliability rules rather than fake DPS coefficients." />
    <article className="arena-card arena-sim-controls"><label>Horizon<select aria-label="Simulation horizon" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}><option value={15}>15s</option><option value={30}>30s</option><option value={60}>60s custom</option></select></label><label>Reaction assumption<select aria-label="Reaction assumption" value={reaction} onChange={(e) => setReaction(e.target.value)}>{Object.entries(REACTION_PRESETS).map(([id, r]: any) => <option value={id} key={id}>{r.label}</option>)}</select></label><p>{timeline.reactionAssumption}</p></article>
    <div className="arena-resource-strip"><div><span>HP</span><strong>{combat.hp}</strong></div><div><span>QI</span><strong>{combat.qi}</strong></div><div><span>ENDURANCE</span><strong>{combat.endurance}</strong></div><div><span>VITALITY</span><strong>{combat.vitality}</strong></div><div><span>STATE</span><strong>{combat.state}</strong></div></div>
    <article className="arena-card arena-timeline"><span className="arena-kicker">MATCHUP TIMELINE</span>{timeline.events.map((event: any) => <div className="arena-event" key={`${event.t}-${event.type}`}><time>{event.t.toFixed(1)}s</time><span /><div><strong>{event.label}</strong><small>{event.type}</small></div></div>)}<p className="arena-muted">{timeline.note}</p></article>
    <article className="arena-card"><span className="arena-kicker">STATE TRACE</span>{combat.log.map((row: any, i: number) => <div className="arena-log-row" key={i}><time>{row.t.toFixed(1)}s</time><strong>{row.event}</strong><span>{row.note}</span></div>)}</article>
  </div>;
}

function HistoryView({ profile }: { profile: any }) {
  const [rows, setRows] = useState(() => loadArenaHistory());
  const [form, setForm] = useState<any>({ date: new Date().toISOString().slice(0, 10), patch: ARENA_PATCH, mode: profile.mode, battlegroup: profile.battlegroup, opponentPath: "Bamboocut-Wind", result: "UNKNOWN", durationSeconds: "", notes: "" });
  const summaries = summarizeHistory(rows);
  const save = () => {
    const next = [{ ...form, id: `arena-match-${Date.now()}`, myBuildRef: profile.id, arenaAttunementRef: profile.arenaAttunementIds.join(",") }, ...rows];
    setRows(saveArenaHistory(next));
  };
  return <div data-testid="arena-history">
    <SectionHeader eyebrow="Arena / History" title="Local Match History" copy="History is local, optional and calibration-ready. It never changes formulas automatically and is never included in a share payload without an explicit future action." />
    <div className="arena-two-col">
      <article className="arena-card arena-form-card">
        <label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Arena mode<select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>{ARENA_MODES.map((m: string) => <option key={m}>{m}</option>)}</select></label><label>Battlegroup<input value={form.battlegroup} maxLength={40} onChange={(e) => setForm({ ...form, battlegroup: e.target.value })} /></label><label>Opponent Path<select value={form.opponentPath} onChange={(e) => setForm({ ...form, opponentPath: e.target.value })}>{PATHS.map((p) => <option key={p}>{p}</option>)}</select></label><label>Result<select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}><option>UNKNOWN</option><option>WIN</option><option>LOSS</option><option>DRAW</option></select></label><label>Match duration (sec)<input type="number" min="0" max="7200" value={form.durationSeconds} onChange={(e) => setForm({ ...form, durationSeconds: e.target.value })} /></label><label>Notes<textarea value={form.notes} maxLength={1000} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><button type="button" onClick={save}><Save size={15} /> Save local match</button>
      </article>
      <article className="arena-card"><span className="arena-kicker">DESCRIPTIVE SUMMARY</span>{summaries.length ? summaries.map((g: any) => <div className="arena-history-summary" key={`${g.mode}-${g.opponentPath}`}><strong>VS {g.opponentPath}</strong><span>{g.wins}–{g.losses}{g.draws ? `–${g.draws}` : ""}</span><small>{g.mode} · {g.disclosure}</small></div>) : <div className="arena-empty"><Clock3 size={24} /><h4>No matches recorded</h4><p>Add only data you actually observe. Damage/healing/Qi-break metrics remain optional.</p></div>}</article>
    </div>
    <div className="arena-history-list">{rows.map((row: any) => <article className="arena-card" key={row.id}><div><strong>{row.result}</strong><span>{row.date}</span></div><h4>{row.mode} vs {row.opponentPath}</h4><p>{row.durationSeconds ? `${row.durationSeconds}s · ` : ""}{row.battlegroup || "No battlegroup"}</p>{row.notes && <small>{row.notes}</small>}</article>)}</div>
  </div>;
}

function Attunement({ state, profile, setState }: { state: ArenaState; profile: any; setState: (s: ArenaState) => void }) {
  const toggle = (id: string) => {
    const has = profile.arenaAttunementIds.includes(id);
    const next = has ? profile.arenaAttunementIds.filter((x: string) => x !== id) : [...profile.arenaAttunementIds, id];
    setState(updateProfile(state, { arenaAttunementIds: next }));
  };
  return <div data-testid="arena-attunement"><SectionHeader eyebrow="Arena / More" title="Arena Attunement" copy="A first-class profile. Normal Attunement is displayed as a separate concept and is never stacked into Arena effects unless a future client-verified rule explicitly permits it." />
    <div className="arena-validation ok"><ShieldCheck size={17} /><span>Isolation guard active: Normal Attunement + Arena Attunement stacking = OFF.</span></div>
    <div className="arena-attunement-grid">{ARENA_ATTUNEMENTS.filter((a: any) => a.eligible.includes("ALL") || a.eligible.includes(profile.path)).map((a: any) => <article className={`arena-card ${profile.arenaAttunementIds.includes(a.id) ? "selected" : ""}`} key={a.id}><div className="arena-result-head"><span className="arena-chip">{a.slot}</span><TrustChip kind={a.evidence} /></div><h4>{a.effectCategory}</h4><p>{a.effect}</p><dl><div><dt>Trigger</dt><dd>{a.trigger}</dd></div><div><dt>Duration</dt><dd>{a.duration == null ? "Rule-defined / not fabricated" : `${a.duration}s`}</dd></div><div><dt>Patch</dt><dd>{a.patch}</dd></div></dl><button type="button" onClick={() => toggle(a.id)}>{profile.arenaAttunementIds.includes(a.id) ? "Remove from Arena profile" : "Use in Arena profile"}</button></article>)}</div>
  </div>;
}

function SkillsView() {
  return <div data-testid="arena-skills"><SectionHeader eyebrow="Arena / More" title="Skills & Mystic Skills" copy="Mechanics are represented by state, timing, availability and control reliability. Animation estimates are not promoted to verified facts." />
    <div className="arena-two-col"><article className="arena-card"><span className="arena-kicker">BAMBOOCUT-DUST · OFFICIAL V2.0</span><h3>Unfettered Rope Dart</h3><ul><li><strong>Burn and Bury:</strong> unblockable; golden-flash warning.</li><li><strong>Piercing Dart:</strong> Tenacity starts 0.5s after entering Charging Stance.</li><li><strong>Soul Loss / Soulbreak:</strong> pressure resource kept separate from raw HP damage.</li></ul></article><article className="arena-card"><span className="arena-kicker">EVERSRING UMBRELLA</span><h3>Scarlet Spin</h3><ul><li>Non-Perfect Catch stagger increased in Version 2.0.</li><li>Arena Attunement uses successful Hit Stagger / Controlled trigger semantics.</li><li>Phantom Rally Resonance no longer interrupts some Tenacity effects.</li></ul></article></div>
  </div>;
}

function EvidenceView() {
  const records = (evidenceCatalog as any).records || [];
  return <div data-testid="arena-evidence"><SectionHeader eyebrow="Arena / More" title="Evidence matrix" copy="Decision first; provenance second. Official, client, community, modeled and unknown facts stay distinct." />
    <div className="arena-chip-row"><span className="arena-chip">Latest reviewed: {(evidenceCatalog as any).latestApplicableOfficial}</span><span className="arena-chip">Reviewed 2026-08-18</span></div>
    <div className="arena-evidence-list">{records.map((r: any) => <article className="arena-card" key={r.id}><div className="arena-result-head"><h4>{r.mechanic}</h4><TrustChip kind={r.category} /></div><p>{typeof r.value === "string" ? r.value : JSON.stringify(r.value)}</p><small>{r.patch} · {(r.modes || []).join(" / ")}{r.note ? ` · ${r.note}` : ""}</small></article>)}</div>
  </div>;
}

function ReferenceBuilds({ state, setState }: { state: ArenaState; setState: (s: ArenaState) => void }) {
  const clone = (ref: any) => {
    const id = `arena-ref-clone-${Date.now()}`;
    const next = { id, name: `${ref.path} Arena Reference`, path: ref.path, weapons: ref.weapons, mode: ref.arenaMode, normalAttunementProfile: null, arenaAttunementIds: [], mysticSkills: [], innerWays: [], gearSnapshot: null, battlegroup: "Jiangzhu", latency: "Moderate latency" };
    setState({ ...state, profiles: [...state.profiles, next] } as ArenaState);
  };
  return <div data-testid="arena-reference-builds"><SectionHeader eyebrow="Arena / More" title="Arena Reference Builds" copy="Small mechanic/reference presets only. No fabricated gear, no rank-1 claims, no tier letters." actions={<button className="arena-secondary-btn" type="button" onClick={() => { location.hash = "#library"; }}><Library size={15} /> Community Library</button>} />
    <div className="arena-reference-grid">{ARENA_REFERENCE_PRESETS.map((ref: any) => <article className="arena-card" key={ref.id}><div className="arena-result-head"><span className="arena-chip accent">ARENA_BUILD</span><span className="arena-chip">{ref.arenaMode}</span></div><h3>{ref.path}</h3><p>{ref.weapons.join(" + ")}</p><dl><div><dt>Role</dt><dd>{ref.role}</dd></div><div><dt>Patch</dt><dd>{ref.patch}</dd></div><div><dt>Maturity</dt><dd>{ref.maturity}</dd></div></dl><p className="arena-muted">Exact gear unavailable by design: this preset is a mechanic/reference profile.</p><button type="button" onClick={() => clone(ref)}>Clone to my workspace</button></article>)}</div>
  </div>;
}

function Transfer({ state, profile }: { state: ArenaState; profile: any }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const exportShare = () => {
    const payload = { schemaVersion: 1, type: "ARENA_BUILD", name: profile.name, path: profile.path, mode: profile.mode, arenaAttunementIds: profile.arenaAttunementIds, strengths: PATH_PROFILES[profile.path]?.strengths || [], risks: PATH_PROFILES[profile.path]?.risks || [], maturity: "MODELED + OFFICIAL MECHANICS", patch: ARENA_PATCH };
    const encoded = encodeArenaShare(payload); setToken(`${location.origin}${location.pathname}#arena/shared/${encoded}`); setStatus("Read-only Arena share created.");
  };
  const validateImport = () => {
    try { const encoded = token.includes("#arena/shared/") ? token.split("#arena/shared/")[1] : token; const decoded = decodeArenaShare(encoded); setStatus(`Valid ${decoded.type}: ${decoded.name} · ${decoded.path}. Open the shared route to review before cloning.`); }
    catch (error: any) { setStatus(`Rejected: ${error.message}`); }
  };
  return <div data-testid="arena-transfer"><SectionHeader eyebrow="Arena / More" title="Import / Export" copy="Arena share payloads are untrusted input: schema, Path, mode, Attunement IDs, sizes and prototype keys are validated. Local Match History is excluded." />
    <article className="arena-card arena-form-card"><button type="button" onClick={exportShare}><Upload size={15} /> Generate read-only share</button><label>Share link / token<textarea aria-label="Arena share token" value={token} maxLength={32000} onChange={(e) => setToken(e.target.value)} /></label><button type="button" className="arena-secondary-btn" onClick={validateImport}><Download size={15} /> Validate import</button>{status && <div className="arena-validation"><Info size={16} />{status}</div>}<small>Current profile count: {state.profiles.length}. Import validation does not overwrite the active profile.</small></article>
    <ReportIssue profile={profile} />
  </div>;
}

function ReportIssue({ profile }: { profile: any }) {
  const [type, setType] = useState("Arena Attunement wrong");
  return <article className="arena-card"><span className="arena-kicker">REPORT DATA ISSUE</span><h3>Mechanic feedback payload</h3><label>Issue type<select value={type} onChange={(e) => setType(e.target.value)}><option>Arena Attunement wrong</option><option>Skill behavior wrong</option><option>Control timing wrong</option><option>Damage/Qi behavior wrong</option><option>Patch outdated</option><option>Matchup recommendation questionable</option><option>Other</option></select></label><pre>{JSON.stringify({ issueType: type, app: "WWM Calc", patch: ARENA_PATCH, arenaMode: profile.mode, path: profile.path, mechanicIds: profile.arenaAttunementIds, privateHistoryIncluded: false }, null, 2)}</pre></article>;
}

function SharedLanding({ token, state, setState }: { token: string; state: ArenaState; setState: (s: ArenaState) => void }) {
  let shared: any = null; let error = "";
  try { shared = decodeArenaShare(token); } catch (e: any) { error = e.message; }
  if (!shared) return <main className="arena-shared"><div className="arena-card"><h2>Invalid Arena share</h2><p>{error}</p><button type="button" onClick={() => go("overview")}>Back to Arena</button></div></main>;
  const clone = () => {
    const id = `arena-shared-${Date.now()}`;
    const profile = { id, name: shared.name, path: shared.path, weapons: shared.weapons, mode: shared.mode, normalAttunementProfile: null, arenaAttunementIds: shared.arenaAttunementIds, mysticSkills: [], innerWays: [], gearSnapshot: null, battlegroup: "Jiangzhu", latency: "Moderate latency" };
    setState({ ...state, profiles: [...state.profiles, profile] } as ArenaState);
  };
  return <main className="arena-shared" data-testid="arena-shared-landing"><article className="arena-card"><span className="arena-kicker">READ-ONLY ARENA BUILD</span><h1>{shared.name}</h1><p>{shared.path} · {shared.weapons.join(" + ")}</p><div className="arena-chip-row"><span className="arena-chip accent">{shared.mode}</span><span className="arena-chip">{shared.patch}</span><span className="arena-chip">{shared.maturity}</span></div><div className="arena-two-col"><div><strong>Strengths</strong><ul>{shared.strengths.map((v: string) => <li key={v}>{v}</li>)}</ul></div><div><strong>Risks</strong><ul>{shared.risks.map((v: string) => <li key={v}>{v}</li>)}</ul></div></div><div className="arena-inline-controls"><button type="button" onClick={() => go("overview")}>VIEW</button><button type="button" className="arena-secondary-btn" onClick={() => { state.opponentPath = shared.path; saveArenaState(state); go("compare"); }}>COMPARE WITH MY ARENA BUILD</button><button type="button" className="arena-secondary-btn" onClick={clone}>CLONE TO MY WORKSPACE</button></div><p className="arena-muted">Clone saves a new profile; it does not replace or activate your current Arena build.</p></article></main>;
}

function Onboarding({ state, setState }: { state: ArenaState; setState: (s: ArenaState) => void }) {
  const profile = state.profiles.find((p: any) => p.id === state.activeProfileId) || state.profiles[0];
  const finish = (action: string) => {
    let next: ArenaState = { ...state, onboardingComplete: true } as ArenaState;
    if (action === "gear") next = updateProfile(next, { gearSnapshot: readPveInventorySnapshot() });
    setState(next);
    if (action === "reference") go("reference"); if (action === "import") go("transfer");
  };
  return <div className="arena-onboarding" role="dialog" aria-modal="true" aria-label="Arena setup"><article>
    <span className="arena-kicker">FIRST ARENA ENTRY</span><h2>What are you planning?</h2><div className="arena-choice-row">{[{id:"1v1",label:"1v1"},{id:"3v3",label:"3v3"},{id:"5v5",label:"Team Arena"}].map((m) => <button className={profile.mode === m.id ? "is-active" : ""} key={m.id} type="button" onClick={() => setState(updateProfile(state, { mode: m.id }))}>{m.label}</button>)}</div><h3>Start from</h3><div className="arena-start-grid"><button type="button" onClick={() => finish("gear")}><Download size={18} />Use My Current Gear</button><button type="button" onClick={() => finish("reference")}><BookOpen size={18} />Arena Reference</button><button type="button" onClick={() => finish("import")}><Upload size={18} />Import</button><button type="button" onClick={() => finish("import")}><Swords size={18} />Shared Arena Build</button></div>
  </article></div>;
}

function Inspector({ route, profile, state }: { route: Route; profile: any; state: ArenaState }) {
  const matchup = matchupCompare(profile.path, state.opponentPath, profile.mode);
  return <aside className="arena-inspector" aria-label="Arena context inspector"><span className="arena-kicker">CONTEXT</span><h3>{profile.name}</h3><div className="arena-inspector-row"><span>Mode</span><strong>{profile.mode}</strong></div><div className="arena-inspector-row"><span>Path</span><strong>{profile.path}</strong></div><div className="arena-inspector-row"><span>Opponent</span><strong>{route === "matchups" || route === "compare" ? state.opponentPath : "Not locked"}</strong></div><div className="arena-inspector-row"><span>Arena Attunement</span><strong>{profile.arenaAttunementIds.length} active</strong></div><div className="arena-inspector-row"><span>Confidence</span><strong>{matchup.confidence}</strong></div><hr /><small>Patch {ARENA_PATCH}</small><small>{profile.latency}</small></aside>;
}

export default function ArenaWorkspace() {
  const [route, setRoute] = useState<Route>(() => routeFromHash());
  const [state, setStateRaw] = useState<ArenaState>(() => loadArenaState());
  const [moreOpen, setMoreOpen] = useState(false);
  const sharedToken = sharedTokenFromHash();
  const setState = (next: ArenaState) => { setStateRaw(saveArenaState(next)); };
  useEffect(() => { const onHash = () => { setRoute(routeFromHash()); setMoreOpen(false); }; addEventListener("hashchange", onHash); return () => removeEventListener("hashchange", onHash); }, []);
  const profile = state.profiles.find((p: any) => p.id === state.activeProfileId) || state.profiles[0];
  if (sharedToken) return <SharedLanding token={sharedToken} state={state} setState={setState} />;
  const content: Record<Route, React.ReactNode> = {
    overview: <Overview state={state} profile={profile} setState={setState} />, build: <Build state={state} profile={profile} setState={setState} />,
    matchups: <Matchups state={state} profile={profile} setState={setState} />, compare: <Compare state={state} profile={profile} />,
    simulation: <Simulation />, history: <HistoryView profile={profile} />, attunement: <Attunement state={state} profile={profile} setState={setState} />,
    skills: <SkillsView />, evidence: <EvidenceView />, reference: <ReferenceBuilds state={state} setState={setState} />, transfer: <Transfer state={state} profile={profile} />,
  };
  return <div className="arena-root" data-testid="arena-workspace">
    {!state.onboardingComplete && <Onboarding state={state} setState={setState} />}
    <header className="arena-topbar"><button className="arena-brand" type="button" onClick={() => go("overview")}><span>WWM</span><div><strong>WWM Calc</strong><small>Arena workspace</small></div></button><WorkspaceSwitcher /><div className="arena-patch"><span>GLOBAL</span><strong>2.0</strong></div></header>
    <div className="arena-layout">
      <aside className="arena-rail"><nav aria-label="Arena navigation">{PRIMARY.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={route === id ? "is-active" : ""} onClick={() => go(id)}><Icon size={17} /><span>{label}</span></button>)}</nav><div className="arena-more"><span>MORE</span>{SECONDARY.map((item) => <button type="button" key={item.id} className={route === item.id ? "is-active" : ""} onClick={() => go(item.id)}>{item.label}</button>)}</div></aside>
      <main className="arena-main">{content[route]}</main><Inspector route={route} profile={profile} state={state} />
    </div>
    <nav className="arena-mobile-nav" aria-label="Arena mobile navigation"><button className={route === "build" ? "is-active" : ""} onClick={() => go("build")}><Shield size={18} />Build</button><button className={route === "matchups" ? "is-active" : ""} onClick={() => go("matchups")}><Crosshair size={18} />Matchups</button><button className={route === "compare" ? "is-active" : ""} onClick={() => go("compare")}><ArrowLeftRight size={18} />Compare</button><button className={route === "history" ? "is-active" : ""} onClick={() => go("history")}><History size={18} />History</button><button className={moreOpen ? "is-active" : ""} onClick={() => setMoreOpen(!moreOpen)}><MoreHorizontal size={18} />More</button></nav>
    {moreOpen && <div className="arena-mobile-more" role="dialog" aria-label="Arena more navigation"><button type="button" onClick={() => go("overview")}><Activity size={16} />Overview</button><button type="button" onClick={() => go("simulation")}><Play size={16} />Simulation</button>{SECONDARY.map((item) => <button key={item.id} type="button" onClick={() => go(item.id)}><ChevronRight size={15} />{item.label}</button>)}</div>}
  </div>;
}
