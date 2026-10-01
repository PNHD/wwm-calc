import { ExternalLink, Info, ShieldCheck } from "lucide-react";
import "./model-about.css";

type Workspace = "PVE" | "ARENA" | "GUILD_WAR" | "LIBRARY" | "TRAINING";

const PATCH = "Global 2.1";
const MODEL_EVIDENCE_REVIEWED = "2026-08-24";
const OFFICIAL_NEWS_CHECKED = "2026-10-01";

export default function ModelAbout({ workspace, page, path, tier }: { workspace: Workspace; page: string; path?: string; tier?: string }) {
  const context = {
    app: "WWM Calc",
    version: "1.1.0",
    patch: PATCH,
    modelEvidenceReviewed: MODEL_EVIDENCE_REVIEWED,
    officialNewsChecked: OFFICIAL_NEWS_CHECKED,
    workspace,
    page,
    ...(path ? { path } : {}),
    ...(tier ? { tier } : {}),
    privacy: "No player names, private notes, match history, gear inventory, or local identifiers are included automatically.",
  };
  const title = encodeURIComponent(`[Data issue] ${workspace} / ${page}`);
  const body = encodeURIComponent(`Please describe the incorrect or outdated data.

Context (safe to share):

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`
`);
  const issueUrl = `https://github.com/PNHD/wwm-calc/issues/new?title=${title}&body=${body}`;

  return <details className="model-about" data-testid="model-about" onKeyDown={event => { if (event.key === "Escape") { const details = event.currentTarget; details.open = false; details.querySelector('summary')?.focus(); } }}>
    <summary aria-label="Model and About"><Info size={14} aria-hidden="true" /><span>Model & About</span></summary>
    <div className="model-about-popover">
      <div className="model-about-heading"><ShieldCheck size={18} aria-hidden="true" /><div><strong>WWM Build Lab</strong><small>{PATCH} · model evidence reviewed {MODEL_EVIDENCE_REVIEWED} · official news checked {OFFICIAL_NEWS_CHECKED}</small></div></div>
      <dl>
        <div><dt>CALIBRATED DATA</dt><dd>Bamboocut-Dust PvE T96 acceptance fixtures.</dd></div>
        <div><dt>MODELED OUTPUT</dt><dd>PvE outputs beyond calibrated fixtures, Arena matchup dimensions, and Guild War role/objective scenarios.</dd></div>
        <div><dt>EXPERIMENTAL ASSUMPTIONS</dt><dd>Community/reference assumptions explicitly marked in their surfaces.</dd></div>
      </dl>
      <p>Arena output is not empirical win probability. Guild War output is not a guaranteed match result. Community builds are references, not authoritative recommendations.</p>
      <p>Official news includes Global 2.2 (September 30). The September 23/30 image notices contain no new combat coefficients; numerical calibration remains {PATCH}. Nameless Sword Sword Energy's non-player condition was clarified September 16; uncalibrated Paths remain references.</p>
      <a href={issueUrl} target="_blank" rel="noreferrer">Report bad data <ExternalLink size={13} aria-hidden="true" /></a>
    </div>
  </details>;
}
