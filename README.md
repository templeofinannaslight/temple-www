# Temple of Inanna's Light — `temple-www`

The marketing / temple site for **Temple of Inanna's Light**, live at
**[templeofinannaslight.org](https://templeofinannaslight.org)**.

It's a Vite + React + TypeScript app. In **production** it ships as a **pure
static site on GitHub Pages** (build-time prerendered, no backend). In **local
development** it runs through a small Express server that does true SSR with Vite
middleware, so dev mirrors the prerendered output.

> **Note on the `package.json` name.** It still says `recoverysky-blog`. This
> repo was forked from the RecoverySky blog scaffold and repurposed for the
> Temple. The blog/CMS parts are dormant dead scaffold (see below).

## Tech stack

- **Build:** Vite 6, TypeScript 5
- **UI:** React 18, `react-router` 7, `react-helmet-async` (per-page `<head>`)
- **Styling:** Tailwind CSS 4 (`@tailwindcss/postcss`), `lucide-react` icons
- **Rendering:** true SSR in dev (Express + Vite middleware); build-time
  prerender (SSG) for production
- **Analytics:** Umami, called directly from the browser
- **Hosting:** GitHub Pages via GitHub Actions
- **Package manager:** pnpm 10.14.0 (Node 22)

## Quick start

```bash
pnpm install
pnpm dev          # Express SSR + Vite on http://localhost:3001  (NOT 5173)
```

Then open **http://localhost:3001**.

To reproduce the production build locally:

```bash
pnpm build        # tsc + client bundle + SSR bundle
pnpm prerender    # render / /app /support /resources → static HTML + 404.html + sitemap.xml
npx serve dist/client   # serve the static output exactly as GitHub Pages would
```

## How it works

There are two rendering paths from the **same** React app and `render()`
function (`src/entry-server.tsx`):

- **Dev (`pnpm dev`)** — `server/index.js` runs Express with Vite SSR
  middleware and renders each request on the fly (hot reload). It also contains
  a **dormant** Directus proxy (`/api/*`) and an Umami proxy (`/api/track`) that
  are **not used in production**.
- **Prod (GitHub Pages)** — `scripts/prerender.mjs` runs after `pnpm build` and
  writes static HTML for the four self-contained marketing routes, plus a
  `404.html` SPA shell for everything else. No server runs in production.

Client hydration happens via `src/entry-client.tsx`. `<head>` tags flow through
`react-helmet-async` and are substituted into the `<!--ssr-head-->` /
`<!--ssr-outlet-->` placeholders in `index.html`.

### Routes

| Route | Page | Prerendered? |
|---|---|---|
| `/` | `HomePage` | ✅ static HTML |
| `/app` | `AppPage` | ✅ static HTML |
| `/support` | `SupportPage` | ✅ static HTML |
| `/resources` | `ResourcesPage` | ✅ static HTML |
| `/blog`, `/post/:id`, `/content/:collection/:name` | blog scaffold | ❌ dormant (see below) |
| anything else | `NotFoundPage` | served via `404.html` SPA shell |

### Dormant blog / Directus scaffold

The `/blog`, `/post/:id`, and `/content/...` routes and the whole Directus
integration are **dead scaffold** — kept in the codebase but **not wired to a
live CMS**. On the static site those routes fall through to `404.html`, boot the
SPA, and render their empty state (their `/api/blog` fetches simply fail). If the
Temple ever wants a live blog, this is where you'd revive it.

## Project structure

```
src/
  entry-client.tsx     # hydration entry (BrowserRouter, base-path aware)
  entry-server.tsx     # render(url, ssrData) — shared by dev SSR and prerender
  App.tsx              # routes
  pages/               # HomePage, AppPage, SupportPage, ResourcesPage, + dormant blog pages
  components/layout/   # Header, Footer, RootLayout (background image)
  lib/
    analytics.ts       # browser → Umami /api/send
    asset.ts           # base-path-aware public asset URLs
    ...                # (dormant: api.ts, constants.ts, types.ts for the blog)
  index.css            # Tailwind 4 @theme tokens (brand magenta / accent blue / neon)
scripts/prerender.mjs  # build-time SSG + sitemap.xml + 404.html
server/index.js        # LOCAL DEV ONLY: Express SSR + dormant Directus/Umami proxies
public/                # static assets, CNAME, robots.txt, app screenshots
.github/workflows/pages.yml  # build + prerender + deploy to GitHub Pages
docs/github-pages-setup.md   # repo settings, env vars, DNS
_archive/              # retired Docker/Swarm/Forgejo deploy pipeline (reference only)
```

Path alias: `@/` → `./src/`.

## Deployment (GitHub Pages)

Push to the **`prod`** branch (or run the workflow manually) → GitHub Actions
(`.github/workflows/pages.yml`) runs `pnpm build && pnpm prerender` and publishes
`dist/client`. See **[`docs/github-pages-setup.md`](docs/github-pages-setup.md)**
for the full setup (repo settings, env vars, DNS records).

- **Custom domain:** `templeofinannaslight.org` (apex), set via `public/CNAME`.
- **Base path:** Vite `base` comes from the `BASE_PATH` env var and defaults to
  `/` (correct for the apex domain). It's driven in CI by the optional
  `BASE_PATH` **repo variable** — only set that (to `/<repo>/`) when serving from
  a GitHub Pages *project* page instead of a root domain. `src/lib/asset.ts` and
  the router basenames make every asset/route base-aware.
- **Analytics:** the public Umami URL + website ID are passed inline in the
  workflow's build step (they're public — no secrets).

## Environment variables

Client vars must be `VITE_`-prefixed (see `envPrefix` in `vite.config.ts`).

| Variable | Where | Purpose |
|---|---|---|
| `VITE_UMAMI_URL` | client (build) | Umami server, e.g. `https://umami.recoverysky.app` |
| `VITE_UMAMI_WEBSITE_ID` | client (build) | Public Umami website ID (safe to expose) |
| `BASE_PATH` | build | Vite base path; defaults to `/`. Set to `/<repo>/` only for project-page hosting |

For **local dev**, put `VITE_UMAMI_*` in a git-ignored `.env` (see
`.env.example`). The old server-side `DIRECTUS_*` / `UMAMI_X_API_KEY` /
`SITE_URL` vars in `.env.example` are only read by `server/index.js` in dev and
are irrelevant to the production static build.

## Where things stand (for the next dev)

- **Live** at `templeofinannaslight.org`, served from GitHub Pages, repo
  **`templeofinannaslight/temple-www`** (transferred from `jenova-marie`).
- **Remotes:** `github` → `git@github.com:templeofinannaslight/temple-www.git`
  (the deploy remote); `origin` → the old Forgejo mirror (`git.rso`), no longer
  used for deploys.
- **HTTPS:** the Let's Encrypt cert provisions automatically once DNS resolves.
  When it's issued, enable **Settings → Pages → Enforce HTTPS** (an admin on the
  `templeofinannaslight` account).
- **Auth0 was removed** — it was unused scaffold that crashed the app on
  non-HTTPS origins. Re-add a provider only if you build an actual member area.

### Known follow-ups (non-blocking)

- `sitemap.xml` now lists all four marketing routes; revisit if more public
  routes are added.
- `pnpm actions` (in `package.json`) still references the archived Forgejo
  actions — safe to delete.
- Consider adding a `packageManager` field to `package.json` to pin pnpm for
  local dev (CI already pins it).
- The `package.json` `name` (`recoverysky-blog`) could be renamed to match the
  Temple, if desired.

## More detail

See **[`CLAUDE.md`](CLAUDE.md)** for the deeper architecture notes (SSR data
flow, the dormant Directus integration, styling tokens, and the deploy model).
