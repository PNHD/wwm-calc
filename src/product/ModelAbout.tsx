import { useState } from "react";
import { ExternalLink, Info, ShieldCheck } from "lucide-react";
import "./model-about.css";

type Workspace = "PVE" | "ARENA" | "GUILD_WAR" | "LIBRARY";

const PATCH = "Global 2.0";
const REVIEWED = "2026-08-18";

export default function ModelAbout({ workspace, page, path, tier }: { workspace: Workspace; page: string; path?: string; tier?: string }) {
  const [open, setOpen] = useState(false);
  const context = {
    app: "WWM Calc",
    version: "1.0.0",
    patch: PATCH,
    reviewed: REVIEWED,
    workspace,
    page,
    ...(path ? { path } : {}),
    ...(tier ? { tier } : {}),
    privacy: "No player names, private notes, match history, gear inventory, or local identifiers are included automatically.",
  };
  const title = encodeURIComponent(`[Data issue] ${workspace} / ${page}`);
  const body = encodeURIComponent(`Please describe the incorrect or outdated data.\n\nContext (safe to share):\n\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`\n`);
  const issueUrl = `https://github.com/PNHD/wwm-calc/issues/new?title=${title}&body=${body}`;

  return <details className="model-about" data-testid="model-about" open={open} onToggle={(event) => {
    if (event.currentTarget.open !== open) setOpen(event.currentTarget.open);
  }}>
    <summary onClick={(event) => {
      event.preventDefault();
      setOpen((value) => !value);
    }}><Info size={14} aria-hidden="true" /><span>Model & About</span></summary>
    <div className="model-about-popover">
      <div className="model-about-heading"><ShieldCheck size={18} aria-hidden="true" /><div><strong>WWM Calc V1</strong><small>{PATCH} · reviewed {REVIEWED}</small></div></div>
      <dl>
        <div><dt>CALIBRATED DATA</dt><dd>Bamboocut-Dust PvE T96 acceptance fixtures.</dd></div>
        <div><dt>MODELED OUTPUT</dt><dd>PvE outputs beyond calibrated fixtures, Arena matchup dimensions, and Guild War role/objective scenarios.</dd></div>
        <div><dt>EXPERIMENTAL ASSUMPTIONS</dt><dd>Community/reference assumptions explicitly marked in their surfaces.</dd></div>
      </dl>
      <p>Arena output is not empirical win probability. Guild War output is not a guaranteed match result. Community builds are references, not authoritative recommendations.</p>
      <a href={issueUrl} target="_blank" rel="noreferrer">Report bad data <ExternalLink size={13} aria-hidden="true" /></a>
    </div>
  </details>;
}
