import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Copy, Eye, Shield, Users } from "lucide-react";
import { validateShareEnvelope } from "../gvg/model.js";
import "./library.css";

const MAX_GVG_SHARE_CHARS = 96 * 1024;
const GVG_CLONES_KEY = "wwm_library_gvg_clones_v1";

function decodeBase64Url(value: string) {
  if (!value || value.length > MAX_GVG_SHARE_CHARS || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("This shared Guild War payload is invalid or too large.");
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  if (binary.length > 64 * 1024) throw new Error("This shared Guild War payload is too large.");
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function boundedText(value: unknown, max = 160) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function inspectPayload(envelope: any) {
  const validation = validateShareEnvelope(envelope);
  if (!validation.valid) throw new Error(validation.error || "Invalid Guild War share.");
  if (!envelope.payload || typeof envelope.payload !== "object" || Array.isArray(envelope.payload)) throw new Error("Shared Guild War payload is missing.");
  const payload = envelope.payload;
  const roster = Array.isArray(payload.roster) ? payload.roster : Array.isArray(payload?.workspace?.roster) ? payload.workspace.roster : [];
  if (roster.length > 30) throw new Error("Shared roster exceeds the 30-player limit.");
  if (roster.some((member: any) => member && typeof member === "object" && typeof member.name === "string" && member.name.length > 80)) throw new Error("Shared roster contains an invalid player name.");
  const strategy = payload.strategy ?? payload?.workspace?.strategy ?? null;
  const ready = roster.filter((member: any) => member?.availability !== false).length;
  const title = boundedText(payload.name || payload.title || strategy?.name || "Shared Guild War Plan", 120) || "Shared Guild War Plan";
  const strategyName = boundedText(strategy?.name || strategy?.label || "Strategy reference", 120) || "Strategy reference";
  return { envelope, payload, roster, ready, title, strategyName };
}

function uniqueName(base: string, existing: string[]) {
  if (!existing.includes(base)) return base;
  if (!existing.includes(`${base} — Copy`)) return `${base} — Copy`;
  for (let index = 2; index < 100; index += 1) if (!existing.includes(`${base} — Copy ${index}`)) return `${base} — Copy ${index}`;
  return `${base} — Copy ${Date.now()}`;
}

export default function GvgSharedLanding({ payload, onView, onBack }: { payload: string; onView: () => void; onBack: () => void }) {
  const decoded = useMemo(() => {
    try { return { ok: true as const, data: inspectPayload(decodeBase64Url(payload)) }; }
    catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "This shared plan can no longer be loaded." }; }
  }, [payload]);
  const [status, setStatus] = useState("");

  if (!decoded.ok) return <main className="library-page library-error" data-testid="gvg-shared-invalid"><AlertTriangle size={30} /><span className="library-eyebrow">SHARED GUILD WAR PLAN</span><h1>This shared plan can no longer be loaded.</h1><p>{decoded.error}</p><button type="button" onClick={onBack}>Return to Guild War</button></main>;

  const { envelope, roster, ready, title, strategyName } = decoded.data;
  const privacy = envelope.privacy ?? {};
  const clone = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(GVG_CLONES_KEY) || "[]");
      const clones = Array.isArray(raw) ? raw.slice(0, 49) : [];
      const name = uniqueName(title, clones.map((item: any) => boundedText(item?.name, 120)));
      clones.unshift({ id: `gvg-share-${Date.now()}`, name, source: "USER_SHARED", schemaVersion: Number(envelope.version) || 1, createdAt: new Date().toISOString(), envelope });
      localStorage.setItem(GVG_CLONES_KEY, JSON.stringify(clones));
      setStatus(`${name} was saved as a separate local copy. Your active roster and strategy were not overwritten.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The shared plan could not be cloned.");
    }
  };

  return <main className="library-page library-shared" data-testid="gvg-shared-landing">
    <button type="button" className="library-back" onClick={onBack}><ArrowLeft size={16} /> Guild War</button>
    <section className="library-shared-hero">
      <span className="library-eyebrow">SHARED GUILD WAR PLAN</span>
      <h1>{title}</h1>
      <p>Source: Shared by another player · Schema v{Number(envelope.version) || 1}</p>
      <div className="library-shared-metrics">
        <div><small>Roster</small><strong>{roster.length} / 30</strong></div>
        <div><small>Ready</small><strong>{ready} available</strong></div>
        <div><small>Strategy</small><strong>{strategyName}</strong></div>
      </div>
      <div className="library-warning" style={{ marginTop: 12 }}><Shield size={18} /><div><strong>PUBLIC DATA INCLUDED</strong><p>Player names: {privacy.playerNamesRedacted ? "redacted" : "included"}. Notes: {privacy.notesRedacted ? "redacted" : "may be included by this legacy schema"}. Review before opening the editable Guild War workspace.</p></div></div>
      <div className="library-detail-actions">
        <button type="button" onClick={onView}><Eye size={15} /> View Plan</button>
        <button type="button" className="is-primary" onClick={clone}><Copy size={15} /> Clone to My Workspace</button>
      </div>
    </section>
    <section className="library-source-block"><span className="library-eyebrow">READ-ONLY FIRST</span><h3>Nothing has been applied to your live Guild War workspace.</h3><p>The shared envelope is validated before display. Clone stores a separate local copy; View opens the existing Share surface so you can inspect/import deliberately.</p></section>
    {roster.length > 0 && <section className="library-source-block"><span className="library-eyebrow">ROSTER PREVIEW</span><h3><Users size={15} style={{ verticalAlign: -3, marginRight: 6 }} />{roster.length} roster entries</h3><p>{privacy.playerNamesRedacted ? "This share was generated with player-name redaction." : "Player names are public data in this link unless the sender used redaction."}</p></section>}
    {status && <div className="library-toast" role="status">{status}</div>}
  </main>;
}
