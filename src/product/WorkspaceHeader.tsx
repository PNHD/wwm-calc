import { useRef, type ReactNode } from "react";
import ModelAbout from "./ModelAbout";
import "./workspace-redesign.css";

// One header for every workspace; tools remain native, keyboard-accessible controls.
export default function WorkspaceHeader({ workspace, page, path, tier, role, actions, onWorkspace, onLibrary, onShare, onOverview }: {
  workspace: "pve" | "arena" | "training" | "gvg" | "library";
  page: string; path?: string; tier?: string; role?: ReactNode; actions?: ReactNode;
  onWorkspace?: (workspace: "pve" | "gvg") => void;
  onLibrary?: () => void; onShare?: () => void; onOverview?: () => void;
}) {
  const tools = useRef<HTMLDetailsElement>(null);
  return <header className="workspace-header">
    <button type="button" className="workspace-brand" aria-label="Open workspace overview" onClick={onOverview ?? (() => { location.hash = `#${workspace === "training" ? "training-terrace" : workspace}/overview`; })}><b aria-hidden="true">W</b><span><strong>WWM Build Lab</strong><small>{tier ?? "Global 2.1 · model context"}</small></span></button>
    <nav className="workspace-switcher" aria-label="Product workspaces">
      {([['pve', 'PvE'], ['arena', 'Arena'], ['training', 'Training'], ['gvg', 'Guild War']] as const).map(([id, label]) => <button type="button" key={id} aria-label={id === "training" ? "Open Training Terrace workspace" : id === "arena" ? "Open Arena workspace" : undefined} className={workspace === id ? "is-active" : ""} aria-pressed={workspace === id} onClick={() => id === "pve" || id === "gvg" ? onWorkspace ? onWorkspace(id) : (location.hash = `#${id}/overview`) : (location.hash = `#${id === "training" ? "training-terrace" : id}/overview`)}>{label}</button>)}
    </nav>
    <div className="workspace-header-actions">
      <button type="button" className="product-library-button" onClick={() => { const returnHash = location.hash; if (onLibrary) onLibrary(); else location.hash = "#library"; if (workspace !== "library") history.replaceState({ ...history.state, libraryReturnHash: returnHash }, ""); }}>Library</button>
      {onShare && <button type="button" onClick={onShare}>{workspace === "gvg" ? "Share Plan" : "Share / Import"}</button>}
      <ModelAbout workspace={workspace === "arena" ? "ARENA" : workspace === "gvg" ? "GUILD_WAR" : workspace === "library" ? "LIBRARY" : workspace === "training" ? "TRAINING" : "PVE"} page={page} path={path} tier={tier} />
      {(role || actions) && <details ref={tools} className="workspace-tools" onKeyDown={event => { if (event.key === "Escape" && tools.current) { tools.current.open = false; tools.current.querySelector('summary')?.focus(); } }}><summary>Tools</summary><div className="workspace-tools-panel">{role && <label>Current profile{role}</label>}<div onClick={event => { if ((event.target as HTMLElement).closest('button') && tools.current) tools.current.open = false; }}>{actions}</div></div></details>}
    </div>
  </header>;
}
