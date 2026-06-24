# wwm-gate Worker

Validates a WWM Player ID (resolves it to a character name via wwmmap's public
`characterface` endpoint) and logs every check-in to a D1 database. The
calculator blocks until a valid Player ID is entered.

## One-time setup (operator — needs your Cloudflare account)

```bash
cd worker
npm install
wrangler login                                 # if not already logged in
wrangler d1 create wwm_gate_db                 # copy the database_id into wrangler.toml
wrangler d1 execute wwm_gate_db --file=schema.sql --remote
wrangler secret put ADMIN_KEY                  # paste a long random string; save it
wrangler deploy                                # note the deployed URL
```

Then put the deployed Worker URL into `src/config/gate.ts` (`GATE_API`) in the
app and push `main`.

## Admin

Visit `https://<worker-url>/api/admin?key=<ADMIN_KEY>` to see the user table
(UID · Name · Server · First seen · Last seen · Visits, newest first).

## Local dev

```bash
wrangler d1 execute wwm_gate_db --file=schema.sql --local
wrangler dev
# test:
curl -s -X POST http://localhost:8787/api/checkin -H 'Content-Type: application/json' -d '{"uid":"4062314033"}'
# → {"ok":true,"name":"Wonton　馄饨"}
```

To test `/api/admin` locally, temporarily add `[vars]\nADMIN_KEY="testkey"` to
wrangler.toml (the `secret` is remote-only).

## Whitelist (future)

`allowUid()` in `src/index.ts` currently returns `true`. To restrict access to
approved UIDs, make it check an allowlist (a D1 table or KV) — nothing else
changes.
