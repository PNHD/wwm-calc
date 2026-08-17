import { useMemo, useState } from "react";
import { AlertTriangle, Clipboard, Copy, Link2, ShieldCheck } from "lucide-react";
import { validateShareEnvelope } from "../gvg/model.js";
import "./library.css";
import "./share-privacy.css";

const STORAGE_KEY = "wwm_gvg_workspace_v1";
const MAX_SHARE_BYTES = 64 * 1024;
const MAX_ROSTER = 30;
const PRIVATE_KEYS = /^(?:accountId|account_id|userId|user_id|email|deviceId|device_id|localMetadata|auth|token|accessToken|refreshToken)$/i;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeWorkspace(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Guild War workspace is invalid.");
  const value = cloneJson(raw as Record<string, unknown>) as any;
  if (Array.isArray(value.roster) && value.roster.length > MAX_ROSTER) throw new Error("Guild War roster exceeds 30 players.");
  const text = JSON.stringify(value);
  if (new TextEncoder().encode(text).byteLength > MAX_SHARE_BYTES) throw new Error("Guild War plan is too large to share safely.");
  return value;
}

function stripPrivateMetadata(value: any) {
  const result = cloneJson(value);
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    for (const key of Object.keys(node)) {
      if (PRIVATE_KEYS.test(key)) delete node[key];
      else walk(node[key]);
    }
  };
  walk(result);
  return result;
}

function redactPlayerNames(value: any) {
  const result = cloneJson(value);
  const names = new Map<string, string>();
  let counter = 1;
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node.name === "string" && ("roles" in node || "availability" in node || "playerId" in node)) {
      if (!names.has(node.name)) names.set(node.name, `Player ${String(counter++).padStart(2, "0")}`);
      node.name = names.get(node.name);
    }
    Object.values(node).forEach(walk);
  };
  walk(result);
  return result;
}

function redactNotes(value: any) {
  const result = cloneJson(value);
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    for (const key of Object.keys(node)) {
      if (/^(note|notes|comment|comments)$/i.test(key)) {
        if (Array.isArray(node[key])) node[key] = [];
        else if (typeof node[key] === "string") node[key] = "[redacted]";
        else node[key] = null;
      } else walk(node[key]);
    }
  };
  walk(result);
  return result;
}

function encodeShare(value: unknown) {
  const text = JSON.stringify(value);
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength > MAX_SHARE_BYTES) throw new Error("Guild War share payload is too large.");
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function readWorkspace() {
  try { return sanitizeWorkspace(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); }
  catch (error) { throw error instanceof Error ? error : new Error("Guild War workspace could not be loaded."); }
}

function summary(workspace: any) {
  const roster = Array.isArray(workspace.roster) ? workspace.roster : [];
  const notes = JSON.stringify(workspace).match(/"(?:note|notes|comment|comments)"/gi)?.length ?? 0;
  return { roster: roster.length, available: roster.filter((member: any) => member?.availability !== false).length, noteFields: notes };
}

export default function GvgSharePrivacyPanel({ onBack }: { onBack: () => void }) {
  const [redactNames, setRedactNames] = useState(true);
  const [redactPlanNotes, setRedactPlanNotes] = useState(false);
  const [status, setStatus] = useState("");
  const [incoming, setIncoming] = useState("");
  const workspace = useMemo(() => {
    try { return { ok: true as const, value: readWorkspace() }; }
    catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "Guild War workspace could not be loaded." }; }
  }, []);

  if (!workspace.ok) return <main className="library-page library-error"><AlertTriangle size={30} /><h1>Guild War sharing is unavailable</h1><p>{workspace.error}</p><button type="button" onClick={onBack}>Back to Guild War</button></main>;

  const counts = summary(workspace.value);
  const buildEnvelope = () => {
    let payload = stripPrivateMetadata(sanitizeWorkspace(workspace.value));
    if (redactNames) payload = redactPlayerNames(payload);
    if (redactPlanNotes) payload = redactNotes(payload);
    const envelope = {
      schema: "wwm-gvg-share",
      version: 1,
      kind: "FULL_GUILD_WAR_PLAN",
      createdAt: new Date().toISOString(),
      privacy: { playerNamesRedacted: redactNames, notesRedacted: redactPlanNotes },
      payload: { workspace: payload },
    };
    const validation = validateShareEnvelope(envelope);
    if (!validation.valid) {
      const validationError = "error" in validation && typeof validation.error === "string" ? validation.error : "Guild War share validation failed.";
      throw new Error(validationError);
    }
    return envelope;
  };

  const copyLink = async () => {
    try {
      const encoded = encodeShare(buildEnvelope());
      const link = `${window.location.origin}${window.location.pathname}#gvg-share=${encoded}`;
      await navigator.clipboard.writeText(link);
      setStatus("Share link copied. It will open read-only first.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Share link could not be generated.");
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildEnvelope(), null, 2));
      setStatus("Versioned Guild War share JSON copied.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Share JSON could not be copied.");
    }
  };

  const openIncoming = () => {
    try {
      const trimmed = incoming.trim();
      if (!trimmed) throw new Error("Paste a Guild War share link first.");
      const marker = "gvg-share=";
      const index = trimmed.indexOf(marker);
      const encoded = index >= 0 ? trimmed.slice(index + marker.length).split(/[&#?]/)[0] : trimmed.replace(/^#?gvg-share=/, "");
      if (!/^[A-Za-z0-9_-]+$/.test(encoded) || encoded.length > 96 * 1024) throw new Error("That shared plan link is malformed or too large.");
      window.location.hash = `gvg-share=${encoded}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Shared plan could not be opened.");
    }
  };

  return <main className="library-page library-detail" data-testid="gvg-share-privacy">
    <button type="button" className="library-back" onClick={onBack}>Back to Guild War</button>
    <header className="library-detail-header">
      <div><span className="library-eyebrow">GUILD WAR · SHARE PLAN</span><h1>Review public data before sharing.</h1><p>Share links are versioned and open read-only first. Your active roster and strategy remain local until someone deliberately imports or applies them.</p></div>
      <div className="library-detail-primary-metric"><small>Roster</small><strong>{counts.roster} / 30</strong><span>{counts.available} available</span></div>
    </header>

    <section className="library-source-block" style={{ marginTop: 10 }}>
      <span className="library-eyebrow">PUBLIC DATA INCLUDED</span>
      <h3>Full Guild War plan</h3>
      <p>The share can include role assignments, strategy positions, timeline data, commander configuration and match-planning fields. Private account identifiers and local-only metadata are stripped before serialization.</p>
      <div className="library-share-privacy-options">
        <label><input type="checkbox" checked={redactNames} onChange={(event) => setRedactNames(event.target.checked)} /><span><strong>Redact player names</strong><small>Replaces roster names with Player 01, Player 02… before serialization.</small></span></label>
        <label><input type="checkbox" checked={redactPlanNotes} onChange={(event) => setRedactPlanNotes(event.target.checked)} /><span><strong>Redact notes</strong><small>Removes note/comment fields recursively from the public payload. {counts.noteFields} note-like field{counts.noteFields === 1 ? "" : "s"} detected.</small></span></label>
      </div>
      <div className="library-detail-actions" style={{ marginInline: 0, marginBottom: 0 }}><button type="button" className="is-primary" onClick={copyLink}><Link2 size={15} /> Generate share link</button><button type="button" onClick={copyJson}><Copy size={15} /> Copy versioned JSON</button></div>
    </section>

    <section className="library-source-block">
      <span className="library-eyebrow">OPEN SHARED PLAN</span>
      <h3>Inspect before applying.</h3>
      <p>Paste a historical or current `gvg-share` link. It will be validated and routed through the read-only Shared Guild War Plan landing.</p>
      <div className="library-share-import"><input aria-label="Guild War shared link" value={incoming} onChange={(event) => setIncoming(event.target.value)} placeholder="Paste gvg-share link or payload" /><button type="button" onClick={openIncoming}><Clipboard size={15} /> Open shared plan</button></div>
    </section>

    <section className="library-footnote"><ShieldCheck size={17} /><p><strong>No anonymous publishing backend is used.</strong> A share link is self-contained public state. Redaction and private-metadata stripping happen before the payload is encoded.</p></section>
    {status && <div className="library-toast" role="status">{status}</div>}
  </main>;
}
