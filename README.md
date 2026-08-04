# WWM Build Lab

Where Winds Meet Global gear and combat calculator, calibrated for **Global 2.0 · Tier 96**.

## Current data status

The active Tier 96 profile uses the workbook's Lv100 Upper (`100上`) constants, cross-checked against the current English Global client:

- Judgment Resistance: 65%
- Attribute Penetration: 22
- Attribute DMG Bonus: 11%
- Food: +120 to +240 Physical Attack
- Native Tier 96 weapon attribute lines: Void Attack
- Relaid weapons: retain their historical Path-specific attribute types

The current Bamboocut-Dust calibration also includes:

- Tier 6 Phantom Rally, Morale Chant, Towline Sweep, and Song of Tang
- a 60-second Level 96 Sword Trial Boss fixture
- base Critical capped before Direct Critical is added
- Precision, Affinity, and per-skill outcome eligibility kept separate

See:

- `docs/GLOBAL_2_T96_UPDATE.md`
- `docs/GLOBAL_V2_INNERWAYS_DUMMY.md`
- `docs/DEPLOY_CLOUDFLARE.md`

## Evidence policy

Data is labeled and applied in this order:

1. Current English Global client screenshots
2. Official Global patch notes
3. Workbook `100上` constants
4. Observed player/dummy fixtures
5. Community or CN references, never applied automatically when they conflict with Global

A complete current Global T96 **Relaid Modulating cap table** has not been verified. Relaid items therefore show roll quality as **N/A** instead of being compared against standard T96 caps.

## Commands

```bash
npm ci
npm run lint
npm run audit:global-v2
npm run build
npm run dev
```

Deployment commands are explicit:

```bash
npm run deploy:pages   # Cloudflare Pages project: wonton-wwm
npm run deploy:worker  # Cloudflare Workers deployment
```

Every production build emits `/build-info.json` with its commit, branch, build time, and data version. Use it to confirm that the live site is serving the expected build.
