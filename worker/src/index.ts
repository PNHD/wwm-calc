export interface Env {
  DB: D1Database;
  ADMIN_KEY: string;
}

const ALLOWED_ORIGINS = ["https://wonton-wwm.pages.dev"];
// localhost:* is also allowed (dev).
function corsHeaders(origin: string | null): Record<string, string> {
  const ok =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? (origin as string) : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(body: unknown, origin: string | null, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

// Whitelist hook — always true for now (see spec §7). Flip this to gate by an
// allowlist later without touching anything else.
function allowUid(_uid: string): boolean {
  return true;
}

async function checkin(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let uid = "";
  try {
    const body = (await req.json()) as { uid?: string };
    uid = String(body.uid ?? "").trim();
  } catch {
    return json({ ok: false, reason: "format" }, origin, 400);
  }
  if (!/^\d{6,15}$/.test(uid)) return json({ ok: false, reason: "format" }, origin, 400);
  if (!allowUid(uid)) return json({ ok: false, reason: "notfound" }, origin, 403);

  const now = Date.now();
  const ua = req.headers.get("User-Agent") ?? "";

  // Cache hit: a UID we've validated before. Log the visit and let it in WITHOUT
  // calling wwmmap — so repeat users keep working even if wwmmap is down.
  const existing = await env.DB.prepare("SELECT name FROM users WHERE uid = ?")
    .bind(uid)
    .first<{ name: string }>();
  if (existing) {
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET last_seen = ?, visits = visits + 1 WHERE uid = ?").bind(now, uid),
      env.DB.prepare("INSERT INTO visits (uid, ts, ua) VALUES (?, ?, ?)").bind(uid, now, ua),
    ]);
    return json({ ok: true, name: existing.name, cached: true }, origin);
  }

  // Cache miss: validate against wwmmap's public lookup. Fail CLOSED — a UID we
  // can't verify is NOT let in (the gate requires a real Player ID).
  let name: string | null = null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch(
      `https://wwmmap.pages.dev/service/characterface?q=${encodeURIComponent(uid)}&server=global`,
      { signal: ctrl.signal },
    );
    clearTimeout(t);
    if (!r.ok) return json({ ok: false, reason: "upstream" }, origin, 502);
    const data = (await r.json()) as { result?: { player_name?: string } | null };
    name = data?.result?.player_name ?? null;
  } catch {
    return json({ ok: false, reason: "upstream" }, origin, 502);
  }
  if (!name) return json({ ok: false, reason: "notfound" }, origin, 404);

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO users (uid, name, server, first_seen, last_seen, visits) VALUES (?, ?, 'global', ?, ?, 1)",
    ).bind(uid, name, now, now),
    env.DB.prepare("INSERT INTO visits (uid, ts, ua) VALUES (?, ?, ?)").bind(uid, now, ua),
  ]);
  return json({ ok: true, name }, origin);
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

function fmtTime(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16).replace("T", " ");
}

async function admin(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== env.ADMIN_KEY) {
    return new Response("unauthorized", { status: 401 });
  }
  const { results } = await env.DB.prepare(
    "SELECT uid, name, server, first_seen, last_seen, visits FROM users ORDER BY last_seen DESC",
  ).all<{ uid: string; name: string; server: string; first_seen: number; last_seen: number; visits: number }>();
  const rows = (results ?? [])
    .map(
      (u) =>
        `<tr><td>${esc(u.uid)}</td><td>${esc(u.name)}</td><td>${esc(u.server)}</td>` +
        `<td>${fmtTime(u.first_seen)}</td><td>${fmtTime(u.last_seen)}</td><td>${u.visits}</td></tr>`,
    )
    .join("");
  const html =
    `<!doctype html><meta charset="utf-8"><title>wwm-gate users</title>` +
    `<style>body{font:14px system-ui;background:#0d1117;color:#e6edf3;padding:24px}` +
    `table{border-collapse:collapse;width:100%}th,td{border:1px solid #30363d;padding:6px 10px;text-align:left}` +
    `th{background:#161b22}</style>` +
    `<h1>wwm-gate — ${(results ?? []).length} users</h1>` +
    `<table><tr><th>UID</th><th>Name</th><th>Server</th><th>First seen</th><th>Last seen</th><th>Visits</th></tr>${rows}</table>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin");
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });
    if (url.pathname === "/api/checkin" && req.method === "POST") return checkin(req, env);
    if (url.pathname === "/api/admin" && req.method === "GET") return admin(req, env);
    return new Response("not found", { status: 404 });
  },
};
