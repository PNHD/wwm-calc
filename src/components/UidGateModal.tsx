import { useState } from "react";
import { GATE_API } from "../config/gate";

type Stored = { uid: string; name: string; server: "global" };

export default function UidGateModal({ onPass }: { onPass: (v: Stored) => void }) {
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState<"idle" | "checking">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6,15}$/.test(uid.trim())) {
      setError("Player ID looks invalid (numbers only).");
      return;
    }
    setStatus("checking");
    try {
      const r = await fetch(`${GATE_API}/api/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: uid.trim() }),
      });
      const data = (await r.json()) as { ok: boolean; name?: string; reason?: string };
      if (data.ok && data.name) {
        const stored: Stored = { uid: uid.trim(), name: data.name, server: "global" };
        localStorage.setItem("wwm_uid", JSON.stringify(stored));
        onPass(stored);
        return;
      }
      setError(
        data.reason === "notfound"
          ? "UID not found. Check your Player ID (Global server)."
          : data.reason === "format"
          ? "Player ID looks invalid (numbers only)."
          : "Couldn't verify right now — please try again.",
      );
    } catch {
      setError("Couldn't verify right now — please try again.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <form onSubmit={submit} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: 28, width: 360, maxWidth: "90vw", color: "#e6edf3" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Enter your Player ID</h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#8b949e" }}>
          Enter your WWM Player ID (Global) to use the calculator. Find it on your in-game profile.
        </p>
        <input
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          inputMode="numeric"
          placeholder="e.g. 4062314033"
          autoFocus
          style={{ width: "100%", padding: "9px 11px", fontSize: 14, borderRadius: 8, border: "1px solid #30363d", background: "#0d1117", color: "#e6edf3", boxSizing: "border-box" }}
        />
        {error && <div style={{ color: "#ff7b72", fontSize: 12.5, marginTop: 8 }}>{error}</div>}
        <button
          type="submit"
          disabled={status === "checking"}
          style={{ marginTop: 16, width: "100%", padding: "10px", fontSize: 14, fontWeight: 700, borderRadius: 8, border: "none", background: "#f0b400", color: "#161b22", cursor: status === "checking" ? "default" : "pointer", opacity: status === "checking" ? 0.7 : 1 }}
        >
          {status === "checking" ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
