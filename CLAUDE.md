# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RecoverySky** marketing + blog site (`recoverysky.org`) — Vite + React + TypeScript with **server-side rendering**, served by an Express app that also proxies a Directus CMS at `https://content.rso`. Despite the `package.json` name `recoverysky-blog`, this is the full marketing site (home, app, support, resources, legal docs) plus the blog.

> The repo `README.md` describes a Next.js setup — it is stale and does not reflect the current Vite/Express architecture.

## Commands

```bash
pnpm dev        # Single Express server (SSR) on port 3001 with Vite middleware
pnpm build      # tsc + build:client + build:server
pnpm build:client  # Vite client bundle → dist/client (with ssrManifest)
pnpm build:server  # Vite SSR bundle of src/entry-server.tsx → dist/server
pnpm prerender   # Render / /app /support /resources to static HTML (+ 404.html SPA shell) in dist/client; run after build
pnpm start      # NODE_ENV=production node server/index.js
pnpm lint       # ESLint
pnpm actions    # Refresh shared Forgejo actions in .forgejo/actions
```

There are **no** `dev:server` / `dev:client` scripts and **no** test suite. Visit `http://localhost:3001` in dev (not 5173) — the old two-server pattern is gone.

## Architecture

### Single Express Server with SSR

`server/index.js` (port 3001) is the only process. It:

1. **Proxies Directus** (`/api/*`) — injects `DIRECTUS_TOKEN` server-side and rewrites Directus asset URLs (including bare `/assets/<uuid>`) to `/api/assets/`.
2. **Server-renders React** — in dev, loads `src/entry-server.tsx` via Vite SSR middleware; in prod, imports the prebuilt `dist/server/entry-server.js` and serves `dist/client/index.html` as the template.
3. **Pre-fetches per-route SSR data** — `getSSRData(url)` matches the request path and fetches Directus data before rendering. Currently handles `/blog`, `/post/:id`, and `/content/:collection/:name`. The result is rendered into the page **and** serialized into `window.__SSR_DATA__` for client hydration.
4. **Serves `static-site/`** as plain static files *before* the SSR fallback (so files there win over React routes).

```
Browser → Express (3001)
            ├─ /api/*           → Directus (with token + URL rewriting)
            ├─ /api/track       → Umami (server-side analytics proxy)
            ├─ /api/assets/:id  → Directus assets (binary passthrough)
            ├─ /sitemap.xml     → dynamic, includes all published posts
            ├─ static-site/*    → static HTML
            └─ * (SSR)          → renderToString(App) + __SSR_DATA__
```

### SSR Data Flow (critical)

- `server/index.js` `getSSRData(url)` returns a typed `SSRData` object (see `src/lib/SSRDataContext.tsx`).
- `src/entry-server.tsx` wraps `<App />` in `StaticRouter` + `HelmetProvider` + `SSRDataProvider`.
- `src/entry-client.tsx` reads `window.__SSR_DATA__` and provides it to the same `SSRDataProvider` for hydration.
- Pages call `useSSRData()` to seed their initial state, then fall through to `fetch()` on the client. **Always check SSR data first** in any new page that needs data on first paint, otherwise hydration will mismatch.
- `<head>` tags are managed via `react-helmet-async`; the server collects them through `helmetContext` and substitutes them into `<!--ssr-head-->` in `index.html`.

### Routing

`src/App.tsx`:

- `/` — `HomePage`
- `/app` — `AppPage`
- `/blog` — `BlogPage` (post listing with search, tags, pagination, sort)
- `/post/:id` and `/post/:id/:slug` — `PostPage`
- `/resources` — `ResourcesPage`
- `/support` — `SupportPage`
- `/content/:collection/:name` — `DocumentPage` (legal/policy docs from Directus, allow-listed)
- `*` — `NotFoundPage`

A `<PageviewTracker>` listens for route changes and fires Umami events via `src/lib/analytics.ts`.

### Directus Integration

- The client **always calls `/api/blog`** (route name in `src/lib/constants.ts`, `COLLECTION = "blog"`). The Express server maps that route to whatever `DIRECTUS_COLLECTION` env var resolves to (defaults to `Mikkis_Mess` in `server/index.js`, but `compose.yml` overrides to `RecoverySky_Blog` in production). Don't hardcode the upstream collection name in client code.
- Generic proxy `/api/:collection` exists, but `DocumentPage` data is gated through `ALLOWED_CONTENT_COLLECTIONS` (in both `server/index.js` and `src/lib/constants.ts`) to prevent arbitrary collection scraping. Currently only `RecoverySky_Content` is allowed.
- `Post` and `ContentDocument` types live in `src/lib/types.ts`. Posts: `id`, `status`, `title`, `slug`, `content` (WYSIWYG), `excerpt`, `featured_image` (UUID), `tags` (JSON array), `author`, `written_date`, `date_created`, `date_updated`. Filter for published: `filter[status][_eq]=published`.
- **Tag filtering is client-side** — Directus can't query JSON arrays, so when a tag filter is active `fetchPosts` requests `limit=-1` and slices in the browser. This is why pagination math in `src/lib/api.ts` branches on `needsClientFilter`.

### Analytics

- `src/lib/analytics.ts` posts to `/api/track` using `navigator.sendBeacon` (with `fetch` fallback).
- `server/index.js` `/api/track` forwards to Umami at `UMAMI_URL` using `UMAMI_X_API_KEY` + `UMAMI_WEBSITE_ID`. If those env vars are missing the endpoint silently 204s — useful in dev.

### Auth0

`src/entry-client.tsx` wraps the app in `<Auth0Provider>` with **hard-coded** `domain` and `clientId` (`meetingmaker.us.auth0.com`). SSR (`entry-server.tsx`) does **not** include the provider — anything that reads Auth0 state must be hydration-safe.

## Brand & Styling

**Tailwind CSS 4** via `@tailwindcss/postcss` (not v3). Theme tokens are declared with `@theme` in `src/index.css`:

- `brand` / `brand-light` / `brand-dark` — magenta (#c30a68)
- `accent` / `accent-light` / `accent-dark` — blue (#26619c)
- `neon` — #ff2d95

Use `bg-brand`, `text-brand-light`, `border-accent`, etc. `@tailwindcss/typography` is enabled for `prose` styling on rendered post HTML.

Dark theme: `bg-gray-950` base, `border-gray-800`, `text-gray-100/300/500`. shadcn/ui-style components live in `src/components/ui/` with `cn()` from `src/lib/utils.ts`. Icons from `lucide-react`.

## Environment Variables

| Variable | Scope | Description |
|---|---|---|
| `DIRECTUS_URL` | Server | Directus base URL (defaults to `http://apps_directus`) |
| `DIRECTUS_TOKEN` | Server | Bearer token; warns and falls back to public access if missing |
| `DIRECTUS_COLLECTION` | Server | Blog collection name; defaults to `Mikkis_Mess` in code, `RecoverySky_Blog` in compose |
| `PORT` | Server | Express port (default 3001) |
| `CORS_ORIGIN` | Server | Allowed origin (default `http://localhost:5173`) |
| `SITE_URL` | Server | Base URL used in `/sitemap.xml` (default `https://recoverysky.org`) |
| `UMAMI_URL` | Server | Umami base URL (default `https://umami.recoverysky.app`) |
| `UMAMI_X_API_KEY` | Server | Umami API key — without this `/api/track` is a no-op |
| `UMAMI_WEBSITE_ID` | Server | Umami website ID — without this `/api/track` is a no-op |
| `VITE_API_URL` | Client | Frontend API base (default `/api`); only relevant if you ever split hosts |

## Deploy (GitHub Pages — static)

The production site deploys as a **pure static site** on GitHub Pages via a
GitHub Actions workflow (`.github/workflows/pages.yml`), which runs
`pnpm build && pnpm prerender` and publishes `dist/client`. There is **no
runtime backend** in production: the four marketing routes (`/`, `/app`,
`/support`, `/resources`) are prerendered to static HTML by
`scripts/prerender.mjs`; any other path is served `404.html` (a SPA shell)
and client-routed; and analytics posts directly from the browser to Umami.
The apex custom domain (`templeofinannaslight.org`) is set via `public/CNAME`.
See `docs/github-pages-setup.md` for repo settings, env vars, and DNS.

The blog/Directus code is a dormant **dead scaffold** (not wired to a live
CMS). `server/index.js` (Express SSR + Directus proxy) is retained for
**local dev only** (`pnpm dev`); it is not used in production.

The previous Docker/Swarm/ECR/Forgejo pipeline is archived under `_archive/`.

## Path Alias

`@/` → `./src/` (configured in `vite.config.ts` and `tsconfig.json`).

## Scripts Directory

`scripts/` contains one-shot Python utilities (WordPress import, date/tag backfills) that talk directly to Directus. Not part of the app runtime — only run them deliberately.
