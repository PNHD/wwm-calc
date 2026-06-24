# UID Gate + Tracking — Design Spec

**Date:** 2026-06-24
**Author:** Wonton (with Claude)
**Status:** Approved design — ready for implementation plan

## 1. Goal

Require every visitor to enter a **valid WWM Player ID (UID)** before using the
calculator. "Valid" = the UID resolves to a real character name via a public
lookup. Invalid / non-existent UIDs are **blocked** (cannot use the app).

Each successful check-in is **logged** (UID, name, server, timestamps, visit
count) so the operator (Wonton) can see who is using the app.

A **whitelist** (only approved UIDs may enter) is an explicit *future* layer —
not built now, but the code leaves a single hook for it.

### Non-goals
- No gear fetch by UID (the official gear API needs the user's own login token;
  gear continues to come from the existing "Import from Game" bookmarklet).
- No hard cryptographic gate. The app is static; a technical user can bypass the
  client check. That is accepted — the goal is "valid UID required for normal
  use + usage tracking", not DRM.
- No per-user accounts/auth beyond the UID itself.

## 2. Key finding (validation is feasible)

The official endpoints that return a player's name/combat-stats are **behind
login** and protected by anti-bot signatures (`block-signature`, `block-nonce`,
`mofang-client-info`). They cannot be queried by arbitrary UID without a session.

However, the third-party site **wwmmap.pages.dev** exposes a public, no-login
endpoint that DOES resolve a UID to a name:

```
GET https://wwmmap.pages.dev/service/characterface?q=<uid>&server=<global|china>
```

Verified responses:
- Real UID `4062314033` →
  `{"result":{"player_name":"Wonton　馄饨","player_id":"4062314033","hostnum":10406,"source":"player","server":"global"}}`
- Fake UID `123456789` → `{"result":null,"error":"Không tìm thấy dữ liệu dung mạo"}`

So: **real UID → name, fake UID → null.** This is exactly the validation signal
needed.

**Risk:** this endpoint is third-party infrastructure (wwmmap), not ours. They
may change or disable it. Mitigations (built in): cache the resolved name in our
own D1 so repeat visitors don't depend on it, and only call it for UIDs we
haven't seen before.

## 3. Architecture

```
App (static, wonton-wwm.pages.dev)
  └─ on load, read localStorage "wwm_uid"
       • missing → <UidGateModal/> blocks the whole app
       • present → render app directly
  └─ modal: POST /api/checkin {uid, server}
       • ok + name → store {uid,name,server} in localStorage, close
       • not found / upstream error → stay blocked, show error

Cloudflare Worker "wwm-gate" (separate worker/ dir, own wrangler deploy)
  /api/checkin  (POST, CORS)
  /api/admin    (GET ?key=SECRET → HTML table)

D1 "wwm_gate_db"
  users(uid, name, server, first_seen, last_seen, visits)
  visits(id, uid, ts, ua)
```

The Worker is an isolated unit: separate folder, separate `wrangler deploy`, NOT
part of the Pages build. The app knows only one constant: the Worker URL.

## 4. Worker detail

### Files
```
worker/
  src/index.ts     – fetch handler (checkin + admin)
  wrangler.toml    – name=wwm-gate, D1 binding, ADMIN_KEY secret, CORS origins
  schema.sql       – CREATE TABLE users / visits
```

### `POST /api/checkin` — body `{ uid }` (server fixed to `global`)
1. **Sanitize** `uid`: digits only, length 6–15. Else → `{ ok:false, reason:"format" }`.
2. **`allowUid(uid)`** — whitelist hook. *Now: always returns `true`.* Future:
   check an allowlist table/KV.
3. **Cache hit** (uid already in `users`):
   - `UPDATE users SET last_seen=now, visits=visits+1`; `INSERT INTO visits`.
   - Return `{ ok:true, name: <cached>, cached:true }`. **Does not call wwmmap.**
4. **Cache miss** → `GET characterface?q=uid&server=global`:
   - `result == null` → `{ ok:false, reason:"notfound" }` (app blocks).
   - has `player_name` → `INSERT users` + `INSERT visits`; return `{ ok:true, name }`.
5. **Upstream failure** (timeout >3s, 5xx) → `{ ok:false, reason:"upstream" }`.
   **Fail closed:** a never-seen UID is NOT let in when validation can't run.
   (Already-validated UIDs pass at step 3 without touching wwmmap.)

### `GET /api/admin?key=SECRET`
- Wrong/missing key → 401.
- Reads D1, returns a single self-contained HTML page: table of
  `UID · Name · Server · First seen · Last seen · Visits`, sorted by `last_seen` desc.
- ponytail: HTML built with a template string in the Worker — no framework.

### CORS
- Allow only `https://wonton-wwm.pages.dev` and `http://localhost:*` (dev).
- Other origins rejected (prevents spam check-ins from other sites).

### D1 schema
```sql
CREATE TABLE users (
  uid        TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  server     TEXT NOT NULL,
  first_seen INTEGER NOT NULL,   -- epoch ms
  last_seen  INTEGER NOT NULL,
  visits     INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE visits (
  id  INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL,
  ts  INTEGER NOT NULL,
  ua  TEXT
);
CREATE INDEX idx_visits_uid ON visits(uid);
```

## 5. Frontend detail

### `src/components/UidGateModal.tsx` (new)
- Inputs: UID text field + "Continue". **Server is hard-coded to `global`** (no
  selector — this app is Global-only). China is out of scope.
- States: idle → checking (spinner) → result.
  - ok → `Welcome, <name> 👋`, store localStorage, call `onPass`.
  - `notfound` → "UID not found. Check your Player ID and server."
  - `format`  → "Player ID looks invalid (numbers only)."
  - `upstream`→ "Couldn't verify right now — please try again."
- No close/skip button — cannot dismiss until a valid UID passes.
- All copy in English (locked decision #9).

### `App.tsx` integration
```tsx
const [uidGate, setUidGate] = useState(() => {
  try { return JSON.parse(localStorage.getItem("wwm_uid") || "null"); }
  catch { return null; }
});
if (!uidGate) return <UidGateModal onPass={setUidGate} />;
// ...existing app render unchanged...
```
- Single guard at the top of the render — no wrapper/HOC.
- `wwm_uid` present on later visits → straight in, no prompt.

### Config
- `GATE_API` constant (Worker URL) in a small config file — one place to change.

### Accepted limitations
- UID lives in `localStorage`; clearing cache re-prompts (acceptable).
- Shared browser = shared stored UID; can't distinguish users on one browser.
  Fine for current tracking goal.

## 6. Operator tasks (manual, cannot be automated by the agent)

These require the user's Cloudflare account and cannot be done by Claude:
1. Create the D1 database (`wrangler d1 create wwm_gate_db`) and run `schema.sql`.
2. Set the `ADMIN_KEY` secret (`wrangler secret put ADMIN_KEY`).
3. `wrangler deploy` the Worker; note its URL.
4. Put that URL into the app's `GATE_API` config and deploy the app (push main).

## 7. Future extension (out of scope now)
- **Whitelist:** flip `allowUid()` to check an allowlist (D1 table or KV). The
  admin page gains an "approve" toggle. No architecture change.
- **Stats:** D1 already stores per-visit rows, so daily/active-user counts are a
  query away.
