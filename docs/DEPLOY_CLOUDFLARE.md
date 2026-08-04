# Cloudflare deployment runbook

The public URL is expected to be served by the Cloudflare Pages project `wonton-wwm`.

## Preferred production setup: Git integration

In Cloudflare Dashboard:

1. Open **Workers & Pages → wonton-wwm**.
2. Open **Settings → Builds & deployments**.
3. Confirm:
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Automatic production deployments are enabled
4. Open **Deployments** and verify that the latest successful production deployment points to the current `main` commit.

A push or merge to `main` should then trigger a production build automatically.

## Verify the live build

Every build writes:

```text
/build-info.json
```

For the public Pages URL, open:

```text
https://wonton-wwm.pages.dev/build-info.json
```

Verify these fields:

- `dataVersion` is `Global 2.0 · Tier 96 · 100上 calibration`
- `shortCommit` matches the expected `main` commit
- `branch` is `main` for the production deployment
- `builtAt` is recent

This is more reliable than judging the deployment only from cached HTML or the browser tab title.

## Direct upload fallback

The repository exposes:

```bash
npm run deploy:pages
```

which runs:

```bash
npm run build
wrangler pages deploy dist --project-name wonton-wwm
```

Use this only when the Cloudflare project supports Direct Upload and Wrangler is authenticated to the correct Cloudflare account. A Pages project created through Git integration may require the Git deployment flow instead of being switched casually to Direct Upload.

## Workers command is separate

```bash
npm run deploy:worker
```

runs `wrangler deploy` through the Cloudflare Vite plugin. That is a Workers deployment path and must not be assumed to update the existing `wonton-wwm.pages.dev` Pages project.

## Required evidence when deployment does not update

Capture these screens from Cloudflare:

- `wonton-wwm → Settings → Builds & deployments`
- the latest production deployment status
- the failed deployment log, when applicable
- the production branch/build command/output directory

Do not reset the project or create a second production project until those values are checked. The common failure modes are a wrong production branch, a missing Git integration, an incorrect output directory, or deployment to Workers instead of Pages.
