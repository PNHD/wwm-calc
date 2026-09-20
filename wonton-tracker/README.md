# Wonton Reforge Lab v2

One dependency-free static app for **Where Winds Meet** Silent Voice reforging.

- `/wonton-tracker/` opens Live Tracker by default.
- `?mode=practice` opens seeded Practice.
- `/wonton-tracker/simulator/` redirects to Practice for bookmark compatibility.

Live Tracker records deterministic counters and user-observed results only. It never generates an in-game outcome. Practice owns seeded RNG, official/community quality models, goals, and batches up to 10,000 runs.

Both modes share slot rendering, appearance data, pricing, targets, backup/restore, and the saved-plan implementation while retaining separate state and plan collections.

Run all standalone checks:

```bash
node --test wonton-tracker/tests/*.test.js
```

Production target: https://wonton-tracker.pages.dev
