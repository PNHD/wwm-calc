# WWM Build Lab

Where Winds Meet Global gear and combat calculator.

## Current update branch

`update/global-v2-t96` updates the calculator for Global 2.0 and Tier 96.

The current Global T96 stat model is mapped to the repository's Lv100 Upper (`100上`) constants, verified from an in-game panel showing 65% Judgment Resistance, 17.8% base Affinity, 22 Attribute Penetration, and 11% Attribute DMG Bonus.

See `docs/GLOBAL_2_T96_UPDATE.md` for the audit, observed gear values, remaining Inner Way work, and boss-dummy calibration requirements.

## Commands

```bash
npm ci
npm run lint
npm run build
npm run dev
```

The build/dev pre-scripts apply the audited Global 2.0 migrations before Vite runs.
