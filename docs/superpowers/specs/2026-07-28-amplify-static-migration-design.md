# Design: Static GitHub Pages Migration for `temple-www`

**Date:** 2026-07-28
**Status:** Approved (revised — host pivoted from AWS Amplify to GitHub Pages on 2026-07-28)

> **Filename note:** this file (and the plan) keep their original `amplify-static-migration` basename so the in-flight SDD workspace/ledger stay intact. The target host is **GitHub Pages**; ignore the filename's "amplify".

## Goal

Deploy the **Temple of Inanna's Light** site (repo: `temple-www`, package name `recoverysky-blog`) to **GitHub Pages as a pure static site** — with no always-on backend and no Docker/Swarm/ECR/Forgejo pipeline — while preserving per-page SEO through build-time prerendering.

### Motivation

- **Simpler CI/CD & hosting:** get off the Forgejo → ECR → Docker Swarm pipeline; let a GitHub Actions workflow build and publish to Pages on push, with GitHub-managed TLS and CDN.
- **Less infra / cost:** stop running and paying for the EC2 swarm host and self-hosted runners. GitHub Pages hosting is free.

### Key enabling fact

Directus (`content.rso` / `apps_directus`, internal private network behind a private CA) is **not currently serving live content**. This removes the only hard blocker to a zero-backend deploy: there is no CMS for the host to reach. The blog/CMS code is kept as a **dead scaffold** (not deleted, not wired to anything).

## Non-Goals

- Reviving the blog/CMS or exposing Directus publicly.
- Renaming `recoverysky-blog` → Temple across the codebase.
- Any redesign of pages or components.

## Architecture

### Current state (being replaced for production)

`server/index.js` is a single Express process that: (1) proxies Directus with a server-side token, (2) server-renders React per request via Vite SSR, (3) pre-fetches per-route Directus data, (4) proxies analytics to Umami with a secret key, (5) serves a dynamic sitemap. It ships as a Docker container to Docker Swarm via ECR/Forgejo CI.

### Target state

**Pure static site on GitHub Pages.** No runtime backend. A GitHub Actions workflow builds the site and prerenders the four self-contained marketing routes to static HTML; the artifact is published to Pages. Analytics goes browser-direct to the (already public) Umami server. The Express server is retained **for local development only**.

```
Production (GitHub Pages, apex domain templeofinannaslight.org):
  push → GitHub Actions (pnpm build && pnpm prerender) → upload dist/client → deploy Pages

  Browser → GitHub Pages CDN (static HTML/JS/CSS)
              ├─ /            → prerendered index.html
              ├─ /app         → prerendered app/index.html
              ├─ /support     → prerendered support/index.html
              ├─ /resources   → prerendered resources/index.html
              ├─ /sitemap.xml → static file
              └─ any other path (no file) → 404.html (SPA shell) → client router renders it
                                             (covers dead blog scaffold + deep links)

  Browser → umami.recoverysky.app/api/send   (analytics, public website ID)

Local dev (unchanged):
  Browser → Express (3001) + Vite SSR middleware (hot reload; Directus proxy dormant)
```

**Why 404.html instead of rewrites:** GitHub Pages has no server-side rewrite rules. It serves a real file when one exists (so prerendered routes keep full SEO) and falls back to `404.html` for everything else. Making `404.html` a clean SPA shell lets the client-side router render any non-prerendered path. The browser URL is preserved on the 404 fallback, so `BrowserRouter` sees the real path. The HTTP 404 status on dead scaffold routes is acceptable (they are intentionally unpublished).

**Base path:** the site serves from an apex custom domain, so Vite `base` stays `/` — no path changes. (A `github.io/<repo>` project page would have required `base: '/temple-www/'`; the apex domain avoids that.)

## Components

### 1. Build-time prerender (SSG) + 404 SPA shell

**File:** `scripts/prerender.mjs` (created in Task 2; extended for 404.html in Task 3), run after the Vite build.

- Reuses the existing `render(url, ssrData)` exported from `dist/server/entry-server.js` — no new render logic.
- Reads `dist/client/index.html` as the template.
- For each **real** route, renders and writes a static file with the correct Helmet `<head>` in `<!--ssr-head-->` and markup in `<!--ssr-outlet-->`:

  | Route | Output file |
  |---|---|
  | `/` | `dist/client/index.html` |
  | `/app` | `dist/client/app/index.html` |
  | `/support` | `dist/client/support/index.html` |
  | `/resources` | `dist/client/resources/index.html` |

- `window.__SSR_DATA__` is serialized as `{}`.
- **Also writes `dist/client/404.html`**: the same template with an **empty** `<!--ssr-outlet-->` (no prerendered markup, to avoid a hydration mismatch) and empty `__SSR_DATA__`. This is the SPA fallback served by GitHub Pages for any path without a file.

**Dead scaffold routes** (`/blog`, `/post/:id`, `/post/:id/:slug`, `/content/:collection/:name`) are **not** prerendered. They resolve via `404.html` → client render; their `fetch('/api/blog')` calls fail gracefully into the existing empty state.

### 2. GitHub Actions Pages workflow

**File:** `.github/workflows/pages.yml`.

- Triggers on push to `prod` (the live branch) and manual `workflow_dispatch`.
- Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency group `pages`, cancel-in-progress.
- **build job:** checkout → `pnpm/action-setup` (10.14.0) → `actions/setup-node` (Node from `.nvmrc`, pnpm cache) → `pnpm install --frozen-lockfile` → `pnpm build && pnpm prerender` (with `VITE_UMAMI_URL` and `VITE_UMAMI_WEBSITE_ID` in `env`) → `touch dist/client/.nojekyll` → `actions/upload-pages-artifact` with `path: dist/client`.
- **deploy job:** `needs: build`, `github-pages` environment, `actions/deploy-pages`.

**Supporting files:**
- `public/CNAME` containing `templeofinannaslight.org` (Vite copies it to `dist/client/CNAME`; sets the Pages custom domain).
- `.nvmrc` containing `22` (read by the workflow and useful for local dev).

**Build env vars** are the public Umami values, passed inline in the workflow `env` (no secrets). `UMAMI_X_API_KEY` is never referenced.

### 3. Analytics → browser-direct Umami

**File:** `src/lib/analytics.ts` (done in Task 1).

- POSTs directly to `${VITE_UMAMI_URL}/api/send` with Umami's standard payload shape, using the **public website ID only** (`1701310e-…`). No `/api/track`, no secret key in the client.
- `navigator.sendBeacon` with `fetch(..., {keepalive:true})` fallback.
- Client env vars (`VITE_UMAMI_URL`, `VITE_UMAMI_WEBSITE_ID`) are provided at build time by the GitHub Actions workflow (and in local `.env`).

**Security note:** `UMAMI_X_API_KEY` is removed from the app. That key was exposed in conversation and **should be rotated** in Umami.

### 4. Sitemap & robots

- `dist/client/sitemap.xml` is generated during prerender (homepage-only, base URL `https://templeofinannaslight.org`). *(Known follow-up: could list `/app`, `/support`, `/resources` too — deferred.)*
- `public/robots.txt` already exists and is copied to `dist/client` by Vite.

### 5. Retire old infra (archive, do not delete)

Move into `_archive/` (recoverable):
- `Dockerfile` → `_archive/Dockerfile`
- `compose.yml` → `_archive/compose.yml`
- `.forgejo/` → `_archive/.forgejo/` (replaced by `.github/workflows/pages.yml`)

### 6. Local dev retained

`server/index.js` stays **unchanged** and remains the target of `pnpm dev` (Express + Vite SSR middleware, hot reload). The dormant Directus proxy code stays with it. No production role.

## Data Flow

- **Production first paint (prerendered route):** GitHub Pages serves a prerendered HTML file with SEO `<head>` present → `entry-client.tsx` hydrates → `window.__SSR_DATA__ = {}`.
- **Production (non-prerendered path):** GitHub Pages serves `404.html` (empty shell) → client boots → `BrowserRouter` reads the real URL → renders the matching route (dead blog routes show their empty state).
- **Analytics:** `PageviewTracker` in `App.tsx` → `trackPageview()` → browser POST to Umami `/api/send`.

## Error Handling

- The prerender script fails the build (`process.exit(1)`) if any static route throws — no half-built deploy.
- Analytics failures are swallowed (`.catch(() => {})`) — never block the page.
- Missing `VITE_UMAMI_*` env vars → analytics is a no-op (guard in `analytics.ts`).

## Testing / Verification

No automated test suite exists and none is wanted (simple static site). Verification is manual:

1. `pnpm build && pnpm prerender` succeeds locally; inspect `dist/client/{index,app/index,support/index,resources/index}.html` for route-specific `<head>` + rendered markup, and confirm `dist/client/404.html` exists with an **empty** `#root`.
2. Serve `dist/client` statically (`npx serve dist/client`) and confirm: prerendered routes load with correct SEO without JS; a non-existent path (e.g. `/blog`) is served the SPA shell and client-renders; `sitemap.xml` and `CNAME` are present.
3. In the browser network tab, confirm a pageview POST hits `umami.recoverysky.app/api/send` with the public website ID and **no** API key.
4. `pnpm dev` still runs the Express SSR server on 3001 with hot reload.
5. On GitHub: the Actions workflow runs on push to `prod`, the Pages deployment succeeds, and the custom domain resolves.

## Rollout

1. Land the changes on a branch; verify locally per above.
2. Ensure the repo is on GitHub. In repo Settings → Pages, set Source = **GitHub Actions**.
3. Merge to `prod`; the workflow builds and deploys. Verify the `*.github.io` Pages URL first.
4. Add the custom domain `templeofinannaslight.org` (the `public/CNAME` file sets it); create the apex DNS records (A/ALIAS to GitHub Pages IPs, or CNAME for a `www` variant) at the registrar; enable "Enforce HTTPS".
5. Decommission the Swarm service / Forgejo workflow (archived under `_archive/`).
6. Rotate `UMAMI_X_API_KEY` in Umami.

## Open Questions

None. All decisions resolved during brainstorming and the GitHub Pages pivot.
