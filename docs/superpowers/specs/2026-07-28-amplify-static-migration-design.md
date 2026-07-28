# Design: Static AWS Amplify Migration for `temple-www`

**Date:** 2026-07-28
**Status:** Approved (pending spec review)

## Goal

Deploy the **Temple of Inanna's Light** site (repo: `temple-www`, package name `recoverysky-blog`) to **AWS Amplify Hosting as a pure static site** — with no always-on backend and no Docker/Swarm/ECR/Forgejo pipeline — while preserving per-page SEO through build-time prerendering.

### Motivation

- **Simpler CI/CD & hosting:** get off the Forgejo → ECR → Docker Swarm pipeline; let Amplify handle git-push-to-deploy, TLS, and CDN.
- **Less infra / cost:** stop running and paying for the EC2 swarm host and self-hosted runners.

### Key enabling fact

Directus (`content.rso` / `apps_directus`, internal private network behind a private CA) is **not currently serving live content**. This removes the only hard blocker to a zero-backend deploy: there is no need for Amplify compute to reach a private-network CMS. The blog/CMS code is kept as a **dead scaffold** (not deleted, not wired to anything).

## Non-Goals

- Reviving the blog/CMS or exposing Directus publicly.
- Renaming `recoverysky-blog` → Temple across the codebase.
- Any redesign of pages or components.

## Architecture

### Current state (being replaced for production)

`server/index.js` is a single Express process that: (1) proxies Directus with a server-side token, (2) server-renders React per request via Vite SSR, (3) pre-fetches per-route Directus data, (4) proxies analytics to Umami with a secret key, (5) serves a dynamic sitemap. It ships as a Docker container to Docker Swarm via ECR/Forgejo CI.

### Target state

**Pure static site on Amplify.** No runtime backend. React routes are prerendered to static HTML at build time and hydrated on the client. Analytics goes browser-direct to the (already public) Umami server. The Express server is retained **for local development only**.

```
Production:
  Browser → Amplify CDN (static HTML/JS/CSS)
              ├─ /            → prerendered index.html
              ├─ /app         → prerendered app/index.html
              ├─ /support     → prerendered support/index.html
              ├─ /resources   → prerendered resources/index.html
              ├─ /sitemap.xml → static file
              └─ * (SPA 200-rewrite → /index.html, client-rendered)

  Browser → umami.recoverysky.app/api/send   (analytics, public website ID)

Local dev (unchanged):
  Browser → Express (3001) + Vite SSR middleware (hot reload; Directus proxy dormant)
```

## Components

### 1. Build-time prerender (SSG)

**New file:** `scripts/prerender.mjs`, run after the existing Vite build.

- Reuses the existing `render(url, ssrData)` exported from `dist/server/entry-server.js` — **no new render logic**.
- Reads `dist/client/index.html` as the template (produced by `pnpm build:client`).
- For each **real** route, renders and writes a static file with the correct Helmet `<head>` substituted into `<!--ssr-head-->` and the markup into `<!--ssr-outlet-->`:

  | Route | Output file |
  |---|---|
  | `/` | `dist/client/index.html` |
  | `/app` | `dist/client/app/index.html` |
  | `/support` | `dist/client/support/index.html` |
  | `/resources` | `dist/client/resources/index.html` |

- `window.__SSR_DATA__` is serialized as `{}` (no Directus data required at build).
- Route list is a hardcoded constant in the script (the four self-contained marketing routes).

**Dead scaffold routes** (`/blog`, `/post/:id`, `/post/:id/:slug`, `/content/:collection/:name`) are intentionally **not** prerendered. They resolve via the SPA 200-rewrite and render client-side; their `fetch('/api/blog')` calls fail into the existing empty/error UI state. This is acceptable and expected.

### 2. Amplify build config

**New file:** `amplify.yml` at repo root.

- **preBuild:** `corepack enable && corepack prepare pnpm@10.14.0 --activate && pnpm install --frozen-lockfile`
- **build:** `pnpm build && pnpm prerender`
- **artifacts.baseDirectory:** `dist/client`
- **artifacts.files:** `**/*`

**New package.json script:** `"prerender": "node scripts/prerender.mjs"`.

**Amplify rewrite/redirect rule** (configured in `amplify.yml` `customHeaders`/redirects or the Amplify console; documented in the spec for the implementer): serve static files where they exist; otherwise **200-rewrite to `/index.html`** so client-side routes and deep links work. Standard SPA fallback pattern:
`</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|xml)$)([^.]+$)/>  →  /index.html  (200 rewrite)`

### 3. Analytics → browser-direct Umami

**Edit:** `src/lib/analytics.ts`.

- Replace POSTs to `/api/track` with POSTs directly to `${VITE_UMAMI_URL}/api/send`.
- Payload matches Umami's standard tracker shape: `{ type: 'event', payload: { website: <VITE_UMAMI_WEBSITE_ID>, hostname, url, referrer, title, screen, language, [name], [data] } }`.
- Uses the **public website ID only** (`1701310e-bc12-4c48-b034-9aab2951892b`). **No API key in the client.**
- Keep the `navigator.sendBeacon` path with `fetch(..., {keepalive:true})` fallback.

**Client env vars** (Vite-exposed, safe): `VITE_UMAMI_URL=https://umami.recoverysky.app`, `VITE_UMAMI_WEBSITE_ID=1701310e-bc12-4c48-b034-9aab2951892b`. Set these in the Amplify console environment and in `.env` for local dev. Update `.env.example`.

**Security note:** `UMAMI_X_API_KEY` is removed from the app. That key has been exposed in conversation and **should be rotated** in Umami. It is no longer referenced anywhere in the client or build.

### 4. Sitemap & robots

- Generate `dist/client/sitemap.xml` during prerender (same homepage-only content the current dynamic route emits, base URL `https://templeofinannaslight.org`). Emitted by `scripts/prerender.mjs`.
- `public/robots.txt` already exists and is copied to `dist/client` by Vite. No change.

### 5. Retire old infra (archive, do not delete)

Move into a new `_archive/` folder (recoverable, out of the way):

- `Dockerfile` → `_archive/Dockerfile`
- `compose.yml` → `_archive/compose.yml`
- `.forgejo/` → `_archive/.forgejo/`

### 6. Local dev retained

`server/index.js` stays **unchanged** and remains the target of `pnpm dev` (Express + Vite SSR middleware, hot reload). The dormant Directus proxy code stays with it. No production role.

## Data Flow

- **Production first paint:** Amplify serves a prerendered HTML file with SEO `<head>` already present → `entry-client.tsx` hydrates → `window.__SSR_DATA__ = {}` (pages that read SSR data find nothing and fall through to client behavior, which for the four static routes need no data).
- **Analytics:** `PageviewTracker` in `App.tsx` (unchanged) → `trackPageview()` → browser POST to Umami `/api/send`.
- **Dead blog routes:** SPA render → client `fetch('/api/blog')` → 404/network fail → existing empty state.

## Error Handling

- Prerender script fails the build if any static route throws during render (fail-fast; no half-built deploy).
- Analytics failures are swallowed (`.catch(() => {})`), matching current behavior — never block the page.
- Missing `VITE_UMAMI_*` env vars → analytics becomes a no-op (guard in `analytics.ts`), matching the current silent-204 behavior in dev.

## Testing / Verification

No automated test suite exists in this repo. Verification is manual:

1. `pnpm build && pnpm prerender` succeeds locally; inspect `dist/client/{index,app/index,support/index,resources/index}.html` — each contains route-specific `<title>`/meta in `<head>` and rendered markup in `#root`.
2. Serve `dist/client` statically (e.g. `npx serve dist/client`) and confirm: static routes load with correct SEO tags without JS; client hydration works; deep-linking `/support` directly returns the prerendered page; `/blog` falls back to SPA and shows its empty state.
3. In the browser network tab, confirm a pageview POST hits `umami.recoverysky.app/api/send` with the public website ID and **no** API key.
4. `pnpm dev` still runs the Express SSR server on 3001 with hot reload.

## Rollout

1. Land the changes on a branch; verify locally per above.
2. Connect the repo/branch in the AWS Amplify console; set `VITE_UMAMI_URL` and `VITE_UMAMI_WEBSITE_ID` env vars; add the SPA rewrite rule.
3. Confirm the Amplify build (uses `amplify.yml`) produces a working static deploy on the Amplify preview URL.
4. Point DNS (`templeofinannaslight.org`) at Amplify once verified.
5. Decommission the Swarm service / Forgejo workflow (archived, not deleted).
6. Rotate `UMAMI_X_API_KEY`.

## Open Questions

None. All decisions resolved during brainstorming.
