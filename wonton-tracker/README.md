# Wonton Tracker

Standalone English Silent Voice reforge tracker for **Where Winds Meet**.

Production target: https://wonton-tracker.pages.dev

## What it includes

- Five reforge slots
- Independent Gold pity tracking for Slots 1–4, hard pity 90
- Manual state editor for copying real in-game pity
- Lock-aware Taiyi Stone cost: 1 / 2 / 5 / 10
- Activation progress model
- Saved plans
- Local browser persistence
- TXT export
- Responsive mobile/desktop UI

This is an independent English remake inspired by the WWMReforge 1.3 community calculator by Chowiemon / 琅劳斯. It is not affiliated with Everstone Studio or NetEase Games.


## Practice simulator

Path: `/simulator/`

The simulator is intentionally isolated from the real tracker:

- real tracker storage remains unchanged
- simulator state uses `wontonSimulatorState.v1`
- simulator setup baseline uses `wontonSimulatorBaseline.v1`
- Official mode uses 82% Blue / 15% Purple / 3% Gold with hard pity 90
- Community mode models the WWMReforge-style 3% / 4% / 5% soft-rate tiers and is labeled unofficial
- seeded RNG makes practice runs replayable
- batch runs support 2/3/4 Gold and matching Set goals
- batch auto-lock strategy can be compared with a no-auto-lock strategy

Core test:

```bash
node wonton-tracker/simulator/simulator.test.js
```

The simulator is a practice/statistics tool only and does not predict server RNG.
