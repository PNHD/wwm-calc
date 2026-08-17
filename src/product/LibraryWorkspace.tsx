import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  Clipboard,
  Copy,
  ExternalLink,
  Filter,
  GitCompareArrows,
  Library,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  CURRENT_GAME_PATCH,
  type LibraryDocument,
  type LibraryEntry,
  type LibraryWorkspaceKind,
  compareRoleScores,
  createSharedBuildEnvelope,
  decodeSharedBuild,
  encodeSharedBuild,
  isSafeExternalUrl,
  patchFreshness,
  trackLibraryEvent,
  validateLibraryDocument,
} from "../library/model";
import "./library.css";

type LibrarySection = "featured" | "pve" | "gvg-builds" | "gvg-plans" | "recent" | "saved";
type RouteState =
  | { kind: "landing"; section: LibrarySection }
  | { kind: "detail"; id: string }
  | { kind: "compare"; a: string; b: string }
  | { kind: "shared"; payload: string };

type CurrentBuildContext = { tier: string; build: string; scheme: string; innerWays: number; estimate: string };

interface LibraryWorkspaceProps {
  context: CurrentBuildContext;
  onOpenPve: (view: "overview" | "build" | "gear" | "compare" | "best-build" | "profile") => void;
  onOpenGvg: (view: "overview" | "roster" | "builds" | "strategy" | "share") => void;
  onExit: () => void;
}

const FAVORITES_KEY = "wwm_library_favorites_v1";
const RECENT_KEY = "wwm_library_recent_v1";
const GVG_CLONES_KEY = "wwm_library_gvg_clones_v1";
const CLONE_DESCRIPTOR_KEY = "wwm_library_clone_descriptor_v1";
const MAX_RECENT = 8;

const maturityLabel = (value: string) => value.replaceAll("_", " ");
const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};
const formatDps = (value?: number) => value == null ? "—" : Math.round(value).toLocaleString();

function parseRoute(): RouteState {
  const hash = window.location.hash;
  if (hash.startsWith("#shared-build=")) return { kind: "shared", payload: hash.slice("#shared-build=".length) };
  const compare = hash.match(/^#library\/compare\/([^/]+)\/([^/]+)/);
  if (compare) return { kind: "compare", a: decodeURIComponent(compare[1]), b: decodeURIComponent(compare[2]) };
  const detail = hash.match(/^#library\/build\/([^/]+)/);
  if (detail) return { kind: "detail", id: decodeURIComponent(detail[1]) };
  if (hash === "#library/pve") return { kind: "landing", section: "pve" };
  if (hash === "#library/gvg-builds") return { kind: "landing", section: "gvg-builds" };
  if (hash === "#library/gvg-plans") return { kind: "landing", section: "gvg-plans" };
  if (hash === "#library/recent") return { kind: "landing", section: "recent" };
  if (hash === "#library/saved") return { kind: "landing", section: "saved" };
  return { kind: "landing", section: "featured" };
}

function writeHash(hash: string) {
  if (window.location.hash === hash) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
}

function readStringArray(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 100) : [];
  } catch {
    return [];
  }
}

function getCurrentLocalBuild(context: CurrentBuildContext) {
  const result: {
    title: string;
    buildKey: string;
    modeledDps: number | null;
    panel: Record<string, number | string>;
    sets: string[];
    gear: Array<{ slot: string; name: string }>;
    innerWays: number;
  } = {
    title: context.build,
    buildKey: localStorage.getItem("wwm_selected_build") || context.build,
    modeledDps: Number(String(context.estimate).replaceAll(",", "")) || null,
    panel: {},
    sets: [],
    gear: [],
    innerWays: context.innerWays,
  };
  try {
    const chars = JSON.parse(localStorage.getItem("wwm_chars_v3") || "{}");
    const character = Array.isArray(chars?.chars) ? chars.chars.find((item: any) => item?.id === chars.activeCharId) ?? chars.chars[0] : null;
    const scheme = Array.isArray(character?.schemes) ? character.schemes.find((item: any) => item?.id === chars.activeSchemeId) ?? character.schemes[0] : null;
    if (scheme?.panel && typeof scheme.panel === "object") {
      const allowed = ["minOuter", "maxOuter", "outerPen", "prec", "crit", "aff", "attunedBonus", "set", "armorSet"];
      result.panel = Object.fromEntries(allowed.filter((key) => typeof scheme.panel[key] === "number" || typeof scheme.panel[key] === "string").map((key) => [key, scheme.panel[key]]));
      result.sets = [scheme.panel.set, scheme.panel.armorSet].filter((value: unknown): value is string => typeof value === "string" && Boolean(value));
    }
    if (Array.isArray(scheme?.gear)) {
      result.gear = scheme.gear.slice(0, 16).map((item: any, index: number) => ({ slot: String(item?.slot || item?.type || `Slot ${index + 1}`).slice(0, 60), name: String(item?.name || item?.id || "Gear item").slice(0, 120) }));
    }
  } catch {
    // The current build summary remains usable even if legacy local storage is malformed.
  }
  return result;
}

function uniqueName(base: string, existing: string[]) {
  if (!existing.includes(base)) return base;
  const first = `${base} — Copy`;
  if (!existing.includes(first)) return first;
  for (let index = 2; index < 100; index += 1) {
    const next = `${base} — Copy ${index}`;
    if (!existing.includes(next)) return next;
  }
  return `${base} — Copy ${Date.now()}`;
}

function clonePveEntry(entry: LibraryEntry): { ok: boolean; name?: string; message: string } {
  try {
    const raw = JSON.parse(localStorage.getItem("wwm_chars_v3") || "{}");
    if (!Array.isArray(raw?.chars) || raw.chars.length === 0) return { ok: false, message: "Open My Build once before cloning this reference." };
    const charIndex = Math.max(0, raw.chars.findIndex((item: any) => item?.id === raw.activeCharId));
    const character = raw.chars[charIndex];
    if (!Array.isArray(character?.schemes) || character.schemes.length === 0) return { ok: false, message: "The active character has no scheme to clone safely." };
    const sourceIndex = Math.max(0, character.schemes.findIndex((item: any) => item?.id === raw.activeSchemeId));
    const source = character.schemes[sourceIndex];
    const existingNames = character.schemes.map((item: any) => String(item?.name || ""));
    const name = uniqueName(entry.title, existingNames);
    const id = `lib-${entry.id}-${Date.now()}`.slice(0, 120);
    const copy = JSON.parse(JSON.stringify(source));
    copy.id = id;
    copy.name = name;
    copy.libraryReference = {
      id: entry.id,
      schemaVersion: entry.buildSchemaVersion,
      source: entry.source.label,
      clonedAt: new Date().toISOString(),
      maturity: entry.maturity,
    };
    if (entry.build.panel && copy.panel && typeof copy.panel === "object") {
      for (const [key, value] of Object.entries(entry.build.panel)) {
        if (typeof value === "number" || typeof value === "string") copy.panel[key] = value;
      }
    }
    character.schemes = [...character.schemes, copy];
    raw.chars[charIndex] = character;
    raw.activeCharId = character.id;
    raw.activeSchemeId = id;
    localStorage.setItem("wwm_chars_v3", JSON.stringify(raw));
    if (entry.build.buildKey) localStorage.setItem("wwm_selected_build", entry.build.buildKey);
    localStorage.setItem(CLONE_DESCRIPTOR_KEY, JSON.stringify({ entryId: entry.id, title: name, workspace: "PVE", build: entry.build, clonedAt: new Date().toISOString() }));
    return { ok: true, name, message: `${name} was created as a separate local scheme. Your previous scheme and inventory were preserved.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Clone failed." };
  }
}

function cloneGvgEntry(entry: LibraryEntry): { ok: boolean; name?: string; message: string } {
  try {
    const existing = JSON.parse(localStorage.getItem(GVG_CLONES_KEY) || "[]");
    const clones = Array.isArray(existing) ? existing.slice(0, 49) : [];
    const names = clones.map((item: any) => String(item?.name || ""));
    const name = uniqueName(entry.title, names);
    clones.unshift({ id: `gvg-lib-${Date.now()}`, name, sourceEntryId: entry.id, schemaVersion: entry.buildSchemaVersion, createdAt: new Date().toISOString(), build: entry.build });
    localStorage.setItem(GVG_CLONES_KEY, JSON.stringify(clones));
    return { ok: true, name, message: `${name} was saved as a separate local Guild War copy. The active roster and strategy were not replaced.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Clone failed." };
  }
}

function MaturityChips({ entry, currentPatch }: { entry: LibraryEntry; currentPatch: string }) {
  const freshness = patchFreshness(entry, currentPatch);
  return <div className="library-chips" aria-label="Maturity and freshness">
    {freshness === "OUTDATED_REFERENCE" && <span className="library-chip is-outdated">OUTDATED REFERENCE</span>}
    {entry.maturity.map((item) => <span key={item} className={`library-chip is-${item.toLowerCase().replaceAll("_", "-")}`}>{maturityLabel(item)}</span>)}
  </div>;
}

function BuildCard({ entry, currentPatch, favorite, onFavorite, onView, onCompare, onClone }: {
  entry: LibraryEntry;
  currentPatch: string;
  favorite: boolean;
  onFavorite: () => void;
  onView: () => void;
  onCompare: () => void;
  onClone: () => void;
}) {
  return <article className="library-card" data-library-id={entry.id}>
    <div className="library-card-topline">
      <span>{entry.workspace === "PVE" ? "PvE" : "Guild War"} · {entry.type.replaceAll("_", " ")}</span>
      <button type="button" className="library-icon-action" aria-label={favorite ? `Remove ${entry.title} from Saved` : `Save ${entry.title}`} onClick={onFavorite}>{favorite ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button>
    </div>
    <h3>{entry.title}</h3>
    {entry.subtitle && <p className="library-card-subtitle">{entry.subtitle}</p>}
    {entry.weapons?.length ? <div className="library-weapons">{entry.weapons.map((weapon) => <span key={weapon}>{weapon}</span>)}</div> : null}
    <div className="library-card-meta"><span>{entry.region}</span><span>{entry.tier}</span><span>Patch {entry.patch}</span></div>
    {entry.build.modeledDps != null && <div className="library-card-metric"><small>Modeled DPS</small><strong>{formatDps(entry.build.modeledDps)}</strong></div>}
    <MaturityChips entry={entry} currentPatch={currentPatch} />
    <small className="library-reviewed">Last reviewed {formatDate(entry.lastReviewedDate)}</small>
    <div className="library-card-actions"><button type="button" onClick={onView}>View</button><button type="button" onClick={onCompare}>Compare</button><button type="button" className="is-primary" onClick={onClone}>Clone</button></div>
  </article>;
}

function SourceBlock({ entry }: { entry: LibraryEntry }) {
  return <section className="library-source-block">
    <span className="library-eyebrow">SOURCE & TRUST</span>
    <h3>{entry.source.label}</h3>
    <p>{entry.source.note || "Source metadata retained with this curated reference."}</p>
    <div className="library-source-meta"><span>{entry.region}</span><span>Patch {entry.patch}</span><span>{entry.tier}</span><span>Reviewed {formatDate(entry.lastReviewedDate)}</span><span>Schema v{entry.buildSchemaVersion}</span></div>
    {entry.source.url && isSafeExternalUrl(entry.source.url) && <a href={entry.source.url} target="_blank" rel="noreferrer">Open source <ExternalLink size={14} /></a>}
  </section>;
}

function DetailSections({ entry }: { entry: LibraryEntry }) {
  const panel = Object.entries(entry.build.panel ?? {});
  return <div className="library-detail-sections">
    <section><span className="library-eyebrow">GEAR</span>{entry.build.gear?.length ? <div className="library-detail-list">{entry.build.gear.map((item, index) => <div key={`${item.slot}-${index}`}><strong>{item.slot}</strong><span>{item.name}</span>{item.note && <small>{item.note}</small>}</div>)}</div> : <p>No item-level gear lines are asserted for this reference.</p>}</section>
    {panel.length > 0 && <section><span className="library-eyebrow">PANEL</span><div className="library-panel-grid">{panel.map(([key, value]) => <div key={key}><small>{key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</small><strong>{typeof value === "number" ? value.toLocaleString() : value}</strong></div>)}</div></section>}
    <section><span className="library-eyebrow">INNER WAYS</span><ul>{(entry.build.innerWays ?? ["No Inner Way claim stored for this reference."]).map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section><span className="library-eyebrow">SETS</span><ul>{(entry.build.sets ?? ["No set claim stored for this reference."]).map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section><span className="library-eyebrow">ATTUNEMENTS</span><ul>{(entry.build.attunements ?? ["No attunement claim stored for this reference."]).map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section className="library-wide"><span className="library-eyebrow">WHY</span><ul>{(entry.build.why ?? []).map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section><span className="library-eyebrow">ASSUMPTIONS</span><ul>{(entry.build.assumptions ?? []).map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section><span className="library-eyebrow">EVIDENCE</span><ul>{(entry.build.evidence ?? []).map((item) => <li key={item}>{item}</li>)}</ul></section>
    {entry.build.strategy && <section className="library-wide"><span className="library-eyebrow">STRATEGY</span><h3>{entry.build.strategy.name}</h3><p>{entry.build.strategy.doctrine}</p><ol>{entry.build.strategy.phases?.map((item) => <li key={item}>{item}</li>)}</ol></section>}
    {entry.build.roster && <section className="library-wide"><span className="library-eyebrow">ROSTER TEMPLATE</span><div className="library-roster-grid">{entry.build.roster.map((member) => <div key={member.id}><strong>{member.name}</strong><span>{member.role.replaceAll("_", " ")}</span><small>{member.team}</small></div>)}</div></section>}
  </div>;
}

function ComparisonView({ a, b, context, onBack }: { a: LibraryEntry | "MY_BUILD"; b: LibraryEntry | "MY_BUILD"; context: CurrentBuildContext; onBack: () => void }) {
  const current = useMemo(() => getCurrentLocalBuild(context), [context]);
  const isGvg = a !== "MY_BUILD" ? a.workspace === "GVG" : b !== "MY_BUILD" ? b.workspace === "GVG" : false;
  const title = (entry: LibraryEntry | "MY_BUILD") => entry === "MY_BUILD" ? `My Build · ${current.title}` : entry.title;
  const dps = (entry: LibraryEntry | "MY_BUILD") => entry === "MY_BUILD" ? current.modeledDps : entry.build.modeledDps ?? null;
  const panel = (entry: LibraryEntry | "MY_BUILD") => entry === "MY_BUILD" ? current.panel : entry.build.panel ?? {};
  const sets = (entry: LibraryEntry | "MY_BUILD") => entry === "MY_BUILD" ? current.sets : entry.build.sets ?? [];
  const innerWays = (entry: LibraryEntry | "MY_BUILD") => entry === "MY_BUILD" ? [`${current.innerWays}/4 configured`] : entry.build.innerWays ?? [];
  const attunements = (entry: LibraryEntry | "MY_BUILD") => entry === "MY_BUILD" ? [String(current.panel.attunedBonus ?? "Current scheme")] : entry.build.attunements ?? [];
  const pa = panel(a), pb = panel(b);
  const deltaKeys = Array.from(new Set([...Object.keys(pa), ...Object.keys(pb)])).filter((key) => typeof pa[key] === "number" || typeof pb[key] === "number");
  const roleRows = isGvg ? compareRoleScores(a === "MY_BUILD" ? undefined : a.build.roleScores, b === "MY_BUILD" ? undefined : b.build.roleScores) : [];
  const da = dps(a), db = dps(b);
  const delta = da != null && db != null ? db - da : null;
  return <main className="library-page library-compare" data-testid="library-compare">
    <button type="button" className="library-back" onClick={onBack}><ArrowLeft size={16} /> Back</button>
    <header className="library-detail-header"><div><span className="library-eyebrow">BUILD TO BUILD COMPARISON</span><h1>{title(a)} <span>vs</span> {title(b)}</h1><p>{isGvg ? "Role suitability is contextual. A higher score for one role is not a universal GvG winner." : "Compare complete build intent, modeled output and human-readable differences."}</p></div></header>
    {!isGvg && <section className="library-compare-hero"><div><small>Build A modeled DPS</small><strong>{da == null ? "—" : formatDps(da)}</strong></div><div><small>Build B modeled DPS</small><strong>{db == null ? "—" : formatDps(db)}</strong></div><div><small>Delta B − A</small><strong>{delta == null ? "—" : `${delta >= 0 ? "+" : ""}${Math.round(delta).toLocaleString()}`}</strong></div></section>}
    {isGvg ? <section className="library-diff"><span className="library-eyebrow">ROLE SUITABILITY DELTAS</span>{roleRows.length ? roleRows.map((row) => <div key={row.role}><strong>{row.role.replaceAll("_", " ")}</strong><span>{row.a ?? "—"} → {row.b ?? "—"}</span><b>{row.a == null || row.b == null ? "context required" : `${row.delta >= 0 ? "+" : ""}${row.delta}`}</b></div>) : <p>One side does not expose role scores. Compare inside the Guild War Builds surface for role-specific evidence.</p>}</section> : <section className="library-diff"><span className="library-eyebrow">CHANGED · MENU PANEL</span>{deltaKeys.length ? deltaKeys.map((key) => {
      const av = typeof pa[key] === "number" ? Number(pa[key]) : null; const bv = typeof pb[key] === "number" ? Number(pb[key]) : null; const diff = av != null && bv != null ? bv - av : null;
      return <div key={key}><strong>{key.replace(/([A-Z])/g, " $1")}</strong><span>{av ?? "—"} → {bv ?? "—"}</span><b>{diff == null ? "—" : `${diff >= 0 ? "+" : ""}${Number(diff.toFixed(2))}`}</b></div>;
    }) : <p>No comparable panel fields are available.</p>}</section>}
    <div className="library-compare-columns">
      {[a, b].map((entry, index) => <section key={index}><span className="library-eyebrow">BUILD {index === 0 ? "A" : "B"}</span><h2>{title(entry)}</h2><dl><dt>Sets</dt><dd>{sets(entry).join(" · ") || "—"}</dd><dt>Attunements</dt><dd>{attunements(entry).join(" · ") || "—"}</dd><dt>Inner Ways</dt><dd>{innerWays(entry).join(" · ") || "—"}</dd><dt>Confidence</dt><dd>{entry === "MY_BUILD" ? "Current local modeled state" : entry.build.confidence || "—"}</dd><dt>Scenario</dt><dd>{entry === "MY_BUILD" ? context.tier : entry.build.scenario || entry.objective || "—"}</dd></dl>{entry !== "MY_BUILD" && <><h3>Why</h3><ul>{entry.build.why?.map((item) => <li key={item}>{item}</li>)}</ul></>}</section>)}
    </div>
  </main>;
}

export default function LibraryWorkspace({ context, onOpenPve, onOpenGvg, onExit }: LibraryWorkspaceProps) {
  const [route, setRoute] = useState<RouteState>(() => parseRoute());
  const [document, setDocument] = useState<LibraryDocument | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [pathFilter, setPathFilter] = useState("");
  const [maturityFilter, setMaturityFilter] = useState("");
  const [patchFilter, setPatchFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => readStringArray(FAVORITES_KEY));
  const [recent, setRecent] = useState<string[]>(() => readStringArray(RECENT_KEY));
  const [status, setStatus] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState("Outdated");

  useEffect(() => {
    let active = true;
    fetch("/data/library-v1.json", { cache: "no-cache" })
      .then((response) => { if (!response.ok) throw new Error(`Library data returned ${response.status}.`); return response.json(); })
      .then((value) => {
        const validation = validateLibraryDocument(value);
        if (!validation.valid) throw new Error(`Curated Library validation failed: ${validation.errors[0]}`);
        if (active) setDocument(value as LibraryDocument);
      })
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : "Library data could not be loaded."); });
    trackLibraryEvent("library_opened");
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handler = () => setRoute(parseRoute());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (next: RouteState, hash: string) => { writeHash(hash); setRoute(next); };
  const items = document?.items ?? [];
  const currentPatch = document?.currentPatch || CURRENT_GAME_PATCH;

  const openEntry = (entry: LibraryEntry) => {
    const nextRecent = [entry.id, ...recent.filter((id) => id !== entry.id)].slice(0, MAX_RECENT);
    setRecent(nextRecent); localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent));
    trackLibraryEvent("library_build_viewed", { itemId: entry.id, workspace: entry.workspace });
    navigate({ kind: "detail", id: entry.id }, `#library/build/${encodeURIComponent(entry.id)}`);
  };

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [id, ...favorites].slice(0, 100);
    setFavorites(next); localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  const clone = (entry: LibraryEntry, shared = false) => {
    const result = entry.workspace === "PVE" ? clonePveEntry(entry) : cloneGvgEntry(entry);
    setStatus(result.message);
    if (result.ok) {
      trackLibraryEvent(shared ? "shared_build_cloned" : "build_cloned", { itemId: entry.id, workspace: entry.workspace });
      if (entry.workspace === "PVE") {
        window.setTimeout(() => { onOpenPve("build"); window.location.reload(); }, 250);
      }
    }
  };

  const compareWithMyBuild = (entry: LibraryEntry) => {
    trackLibraryEvent("reference_compared", { itemId: entry.id, workspace: entry.workspace });
    navigate({ kind: "compare", a: entry.id, b: "my" }, `#library/compare/${encodeURIComponent(entry.id)}/my`);
  };

  const share = async (entry: LibraryEntry) => {
    try {
      const envelope = createSharedBuildEnvelope(entry, entry.workspace === "GVG" ? { playerNamesRedacted: true, notesRedacted: true } : undefined);
      const link = `${window.location.origin}${window.location.pathname}#shared-build=${encodeSharedBuild(envelope)}`;
      await navigator.clipboard.writeText(link);
      setStatus("Read-only share link copied. It contains only the curated build payload and share metadata.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Share link could not be created.");
    }
  };

  const sectionFor = (entry: LibraryEntry, section: LibrarySection) => {
    if (section === "featured") return Boolean(entry.featured);
    if (section === "pve") return entry.workspace === "PVE";
    if (section === "gvg-builds") return entry.workspace === "GVG" && (entry.type === "GVG_BUILD" || entry.type === "COMMUNITY_BUILD" || entry.type === "REFERENCE_BUILD");
    if (section === "gvg-plans") return entry.type === "GUILD_WAR_ROSTER" || entry.type === "GUILD_WAR_STRATEGY";
    if (section === "recent") return recent.includes(entry.id);
    return favorites.includes(entry.id);
  };

  const filtered = useMemo(() => {
    const section = route.kind === "landing" ? route.section : "featured";
    const q = search.trim().toLowerCase();
    const result = items.filter((entry) => {
      if (!sectionFor(entry, section)) return false;
      const haystack = [entry.title, entry.subtitle, entry.path, entry.role, entry.objective, entry.source.label, ...(entry.weapons ?? []), ...(entry.tags ?? [])].filter(Boolean).join(" ").toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (pathFilter && entry.path !== pathFilter) return false;
      if (maturityFilter && !entry.maturity.includes(maturityFilter as any)) return false;
      if (patchFilter && entry.patch !== patchFilter) return false;
      if (roleFilter && entry.role !== roleFilter) return false;
      if (sourceFilter === "community" && entry.source.kind !== "COMMUNITY_GUIDE" && !entry.maturity.includes("COMMUNITY_REFERENCE")) return false;
      if (sourceFilter === "reference" && entry.source.kind === "COMMUNITY_GUIDE") return false;
      return true;
    });
    if (section === "recent") result.sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));
    else result.sort((a, b) => b.lastReviewedDate.localeCompare(a.lastReviewedDate));
    return result;
  }, [items, route, search, pathFilter, maturityFilter, patchFilter, roleFilter, sourceFilter, recent, favorites]);

  const clearFilters = () => { setSearch(""); setPathFilter(""); setMaturityFilter(""); setPatchFilter(""); setRoleFilter(""); setSourceFilter(""); };

  if (loadError) return <main className="library-page library-error" data-testid="library-error"><AlertTriangle size={30} /><h1>Library could not be loaded</h1><p>{loadError}</p><button type="button" onClick={onExit}>Return to workspace</button></main>;
  if (!document) return <main className="library-page library-loading" data-testid="library-loading"><Library size={24} /><p>Loading curated Library…</p></main>;

  if (route.kind === "shared") {
    const decoded = decodeSharedBuild(route.payload);
    if (!decoded.valid || !decoded.envelope) return <main className="library-page library-error" data-testid="shared-build-invalid"><AlertTriangle size={30} /><span className="library-eyebrow">SHARED BUILD</span><h1>This shared build can no longer be loaded.</h1><p>{decoded.error || "The payload is invalid or unsupported."}</p><button type="button" onClick={() => navigate({ kind: "landing", section: "featured" }, "#library")}>Open Library</button></main>;
    const entry = decoded.envelope.entry;
    trackLibraryEvent("shared_build_opened", { itemId: entry.id, workspace: entry.workspace });
    return <main className="library-page library-shared" data-testid="shared-build-landing">
      <button type="button" className="library-back" onClick={() => navigate({ kind: "landing", section: "featured" }, "#library")}><ArrowLeft size={16} /> Library</button>
      <section className="library-shared-hero"><span className="library-eyebrow">{entry.workspace === "PVE" ? "SHARED PVE BUILD" : "SHARED GUILD WAR PLAN"}</span><h1>{entry.title}</h1><p>{entry.region} {entry.patch} · {entry.tier}</p><MaturityChips entry={entry} currentPatch={currentPatch} /><div className="library-shared-metrics"><div><small>Source</small><strong>{decoded.envelope.source === "LIBRARY" ? entry.source.label : "Shared by another player"}</strong></div>{entry.build.modeledDps != null && <div><small>Modeled DPS</small><strong>{formatDps(entry.build.modeledDps)}</strong></div>}<div><small>Confidence</small><strong>{entry.build.confidence || "Reference"}</strong></div></div>{decoded.migrated && <p className="library-notice">This legacy share was safely migrated to the current read-only schema.</p>}{decoded.envelope.privacy && <p className="library-notice">Privacy: player names {decoded.envelope.privacy.playerNamesRedacted ? "redacted" : "included"}; notes {decoded.envelope.privacy.notesRedacted ? "redacted" : "included"}.</p>}<div className="library-detail-actions"><button type="button" onClick={() => navigate({ kind: "detail", id: entry.id }, `#library/build/${encodeURIComponent(entry.id)}`)}>View Build</button><button type="button" className="is-primary" onClick={() => clone(entry, true)}>Clone to My Workspace</button><button type="button" onClick={() => compareWithMyBuild(entry)}>Compare with My Build</button></div></section>
      <SourceBlock entry={entry} /><DetailSections entry={entry} />{status && <div className="library-toast" role="status">{status}</div>}
    </main>;
  }

  if (route.kind === "compare") {
    const a = route.a === "my" ? "MY_BUILD" : items.find((item) => item.id === route.a);
    const b = route.b === "my" ? "MY_BUILD" : items.find((item) => item.id === route.b);
    if (!a || !b) return <main className="library-page library-error"><h1>Comparison unavailable</h1><p>One of the builds no longer exists in the curated Library.</p><button type="button" onClick={() => navigate({ kind: "landing", section: "featured" }, "#library")}>Back to Library</button></main>;
    return <ComparisonView a={a} b={b} context={context} onBack={() => a === "MY_BUILD" ? navigate({ kind: "landing", section: "featured" }, "#library") : openEntry(a)} />;
  }

  if (route.kind === "detail") {
    const entry = items.find((item) => item.id === route.id);
    if (!entry) return <main className="library-page library-error"><h1>Reference not found</h1><p>This curated entry may have been removed or renamed.</p><button type="button" onClick={() => navigate({ kind: "landing", section: "featured" }, "#library")}>Back to Library</button></main>;
    const report = `WWM Calc Library data issue\nEntry: ${entry.title} (${entry.id})\nCategory: ${reportCategory}\nPatch: ${entry.patch}\nReviewed: ${entry.lastReviewedDate}\nSource: ${entry.source.label}\n\nIssue details:\n`;
    const issueUrl = `https://github.com/PNHD/wwm-calc/issues/new?title=${encodeURIComponent(`[Library] ${reportCategory}: ${entry.title}`)}&body=${encodeURIComponent(report)}`;
    return <main className="library-page library-detail" data-testid="library-build-detail">
      <button type="button" className="library-back" onClick={() => navigate({ kind: "landing", section: entry.workspace === "PVE" ? "pve" : entry.type === "GUILD_WAR_ROSTER" || entry.type === "GUILD_WAR_STRATEGY" ? "gvg-plans" : "gvg-builds" }, entry.workspace === "PVE" ? "#library/pve" : entry.type === "GUILD_WAR_ROSTER" || entry.type === "GUILD_WAR_STRATEGY" ? "#library/gvg-plans" : "#library/gvg-builds")}><ArrowLeft size={16} /> Library</button>
      <header className="library-detail-header"><div><span className="library-eyebrow">{entry.type.replaceAll("_", " ")}</span><h1>{entry.title}</h1><p>{entry.subtitle}</p><div className="library-card-meta"><span>{entry.path || entry.role}</span>{entry.weapons?.map((weapon) => <span key={weapon}>{weapon}</span>)}<span>{entry.region} · {entry.tier}</span></div><MaturityChips entry={entry} currentPatch={currentPatch} /></div><div className="library-detail-primary-metric"><small>{entry.workspace === "PVE" ? "Modeled DPS" : "Objective"}</small><strong>{entry.workspace === "PVE" ? formatDps(entry.build.modeledDps) : entry.objective || entry.role || "Reference plan"}</strong><span>{entry.build.confidence || "Reference"}</span></div></header>
      <div className="library-detail-actions"><button type="button" className="is-primary" onClick={() => clone(entry)}>Clone to My Workspace</button><button type="button" onClick={() => compareWithMyBuild(entry)}><GitCompareArrows size={15} /> Compare with My Build</button><button type="button" onClick={() => share(entry)}><Share2 size={15} /> Share</button><button type="button" onClick={() => setReportOpen(true)}>Report Data Issue</button></div>
      {patchFreshness(entry, currentPatch) === "OUTDATED_REFERENCE" && <div className="library-warning"><AlertTriangle size={18} /><div><strong>OUTDATED REFERENCE</strong><p>This item targets patch {entry.patch}; the app is on patch {currentPatch}. Historical mechanic assumptions were not silently migrated into current truth.</p></div></div>}
      <SourceBlock entry={entry} /><DetailSections entry={entry} />
      {entry.workspace === "PVE" && <section className="library-run-next"><Sparkles size={22} /><div><strong>Personalize before optimizing</strong><p>Clone creates a separate local scheme. Then edit gear or run Best Build against your own inventory and scenario.</p></div><button type="button" onClick={() => onOpenPve("best-build")}>Run Best Build</button></section>}
      {entry.workspace === "GVG" && <section className="library-run-next"><ShieldCheck size={22} /><div><strong>Keep the live Guild War plan independent</strong><p>Clone saves a separate local template copy. Open Guild War only when you are ready to apply a plan to the active workspace.</p></div><button type="button" onClick={() => onOpenGvg(entry.type === "GUILD_WAR_ROSTER" ? "roster" : entry.type === "GUILD_WAR_STRATEGY" ? "strategy" : "builds")}>Open Guild War</button></section>}
      {reportOpen && <div className="library-modal-backdrop" role="presentation" onMouseDown={() => setReportOpen(false)}><section className="library-modal" role="dialog" aria-modal="true" aria-label="Report Data Issue" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="library-modal-close" aria-label="Close report" onClick={() => setReportOpen(false)}><X size={18} /></button><span className="library-eyebrow">REPORT DATA ISSUE</span><h2>{entry.title}</h2><label>Category<select value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}><option>Outdated</option><option>Panel mismatch</option><option>Gear data incorrect</option><option>Mechanic incorrect</option><option>Source issue</option><option>Other</option></select></label><textarea readOnly value={report} aria-label="Structured issue report" /><p>No report is submitted automatically. Copy it or open a prefilled GitHub issue.</p><div><button type="button" onClick={async () => { await navigator.clipboard.writeText(report); setStatus("Structured issue report copied."); }}><Clipboard size={15} /> Copy report</button><a href={issueUrl} target="_blank" rel="noreferrer">Open GitHub issue <ExternalLink size={14} /></a></div></section></div>}
      {status && <div className="library-toast" role="status">{status}</div>}
    </main>;
  }

  const section = route.section;
  const paths = Array.from(new Set(items.map((item) => item.path).filter((value): value is string => Boolean(value)))).sort();
  const patches = Array.from(new Set(items.map((item) => item.patch))).sort();
  const roles = Array.from(new Set(items.map((item) => item.role).filter((value): value is string => Boolean(value)))).sort();
  const nav: Array<{ id: LibrarySection; label: string; hash: string }> = [
    { id: "featured", label: "Featured", hash: "#library" },
    { id: "pve", label: "PvE Builds", hash: "#library/pve" },
    { id: "gvg-builds", label: "Guild War Builds", hash: "#library/gvg-builds" },
    { id: "gvg-plans", label: "Guild War Plans", hash: "#library/gvg-plans" },
    { id: "recent", label: "Recently Updated", hash: "#library/recent" },
    { id: "saved", label: `Saved${favorites.length ? ` ${favorites.length}` : ""}`, hash: "#library/saved" },
  ];
  return <main className="library-page library-landing" data-testid="library-landing">
    <header className="library-landing-header"><div><span className="library-eyebrow">CURATED COMMUNITY LIBRARY</span><h1>Start from evidence, not from zero.</h1><p>Discover reference builds and Guild War templates, understand their provenance, compare them with your build, then clone a safe local copy.</p></div><button type="button" className="library-exit" onClick={onExit}><X size={16} /> Close Library</button></header>
    <nav className="library-section-nav" aria-label="Library sections">{nav.map((item) => <button type="button" key={item.id} className={section === item.id ? "is-active" : ""} aria-current={section === item.id ? "page" : undefined} onClick={() => navigate({ kind: "landing", section: item.id }, item.hash)}>{item.label}</button>)}</nav>
    <section className="library-discovery"><div className="library-search"><Search size={17} aria-hidden="true" /><input aria-label="Search Library" placeholder="Search build, Path, weapon, author or source" value={search} onChange={(event) => setSearch(event.target.value)} /></div><button type="button" className={filtersOpen ? "is-active" : ""} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}><Filter size={16} /> Filters</button></section>
    {filtersOpen && <section className="library-filters" aria-label="Library filters"><label>Path<select value={pathFilter} onChange={(event) => { setPathFilter(event.target.value); trackLibraryEvent("library_filter_used", { filter: "path" }); }}><option value="">All Paths</option>{paths.map((value) => <option key={value}>{value}</option>)}</select></label><label>Patch<select value={patchFilter} onChange={(event) => setPatchFilter(event.target.value)}><option value="">All patches</option>{patches.map((value) => <option key={value}>{value}</option>)}</select></label><label>Maturity<select value={maturityFilter} onChange={(event) => setMaturityFilter(event.target.value)}><option value="">All maturity</option><option>CALIBRATED</option><option>CLIENT_VERIFIED</option><option>OFFICIAL_REFERENCE</option><option>COMMUNITY_REFERENCE</option><option>MODELED</option><option>EXPERIMENTAL</option><option>OUTDATED</option></select></label><button type="button" className="library-more-filter" aria-expanded={moreFiltersOpen} onClick={() => setMoreFiltersOpen((value) => !value)}><SlidersHorizontal size={15} /> More filters</button>{moreFiltersOpen && <><label>Role<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All roles</option>{roles.map((value) => <option key={value}>{value}</option>)}</select></label><label>Source<select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="">Community + Reference</option><option value="community">Community</option><option value="reference">Reference</option></select></label></>} {(search || pathFilter || patchFilter || maturityFilter || roleFilter || sourceFilter) && <button type="button" className="library-clear" onClick={clearFilters}>Clear filters</button>}</section>}
    {filtered.length ? <section className="library-card-grid" aria-live="polite">{filtered.map((entry) => <BuildCard key={entry.id} entry={entry} currentPatch={currentPatch} favorite={favorites.includes(entry.id)} onFavorite={() => toggleFavorite(entry.id)} onView={() => openEntry(entry)} onCompare={() => compareWithMyBuild(entry)} onClone={() => clone(entry)} />)}</section> : <section className="library-empty"><Search size={24} /><h2>No builds match these filters.</h2><p>Try a broader workspace or remove one of the active filters.</p><button type="button" onClick={clearFilters}>Clear Filters</button></section>}
    <footer className="library-footnote"><ShieldCheck size={17} /><p><strong>Featured means curated.</strong> The Library does not invent views, likes, ratings, “Top Meta”, S-tier or universal Best Build claims.</p></footer>
    {status && <div className="library-toast" role="status">{status}</div>}
  </main>;
}
