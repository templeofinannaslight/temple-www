# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RecoverySky Blog** — a corporate blog built with Vite + React + TypeScript, backed by an Express API proxy to a Directus CMS at `https://content.rso`.

## Commands

```bash
pnpm dev              # Start both Express server (3001) and Vite dev server (5173)
pnpm dev:server       # Start Express API proxy only
pnpm dev:client       # Start Vite dev server only
pnpm build            # TypeScript compile + Vite production build
pnpm start            # Start Express server (production)
pnpm lint             # Run ESLint
```

## Architecture

### Two-Server Pattern

**Express Proxy** (`server/index.js`, port 3001) sits between the browser and Directus. It injects the Bearer token server-side and rewrites Directus asset URLs to `/api/assets/`. Routes:
- `GET /api/:collection` — list items
- `GET /api/:collection/:id` — single item (numeric ID)
- `GET /api/assets/:id` — proxied Directus files with image transforms
- `GET /health` — health check

**Vite React Client** (`src/`, port 5173) is an SPA with React Router. In dev, Vite proxies `/api` to Express (`vite.config.ts`). In production, Express serves the built static files from `dist/` with SPA fallback.

```
Browser → Vite (5173) → /api proxy → Express (3001) → Directus CMS
```

### Client Architecture

**Routing** (`src/App.tsx`): React Router with `RootLayout` wrapper.
- `/` — `HomePage` (blog listing with search, tags, pagination, sort)
- `/post/:id` and `/post/:id/:slug` — `PostPage` (individual article)
- `*` — `NotFoundPage`

**Data flow**: `src/lib/api.ts` contains all fetch functions (`fetchPosts`, `fetchPost`, `fetchAllTags`). The collection name and API URL are in `src/lib/constants.ts`. Custom hooks (`src/hooks/usePosts.ts`, `src/hooks/useTags.ts`) wrap API calls with React state.

**Tag filtering is client-side** — Directus doesn't support JSON array queries, so when filtering by tag, all posts are fetched and filtered in the browser.

### Directus Collection

Collection: `RecoverySky_Blog` (defined in `src/lib/constants.ts`)

Post fields: `id`, `status`, `title`, `slug`, `content` (WYSIWYG), `excerpt`, `featured_image` (file UUID), `tags` (JSON array), `author`, `written_date`, `date_created`, `date_updated`

TypeScript interface: `src/lib/types.ts`

Filter for published posts: `filter[status][_eq]=published`

## Brand & Styling

**Tailwind CSS 4** with `@tailwindcss/postcss` plugin (not v3). Brand colors defined via `@theme` in `src/index.css`:
- `brand` / `brand-light` / `brand-dark` — magenta (#c30a68)
- `accent` / `accent-light` / `accent-dark` — blue (#26619c)

Use `bg-brand`, `text-brand-light`, `border-accent`, etc. in Tailwind classes.

Dark theme: `bg-gray-950` base, `border-gray-800` borders, `text-gray-100/300/500` text hierarchy.

**shadcn/ui** components in `src/components/ui/` with `cn()` utility from `src/lib/utils.ts`. Icons from `lucide-react`.

## Environment Variables

| Variable | Scope | Description |
|---|---|---|
| `DIRECTUS_URL` | Server | Directus CMS base URL |
| `DIRECTUS_TOKEN` | Server | Directus API bearer token |
| `PORT` | Server | Express port (default: 3001) |
| `CORS_ORIGIN` | Server | Allowed frontend origin |

## Docker

```bash
docker compose up -d              # Start container
docker compose up -d --build      # Rebuild and start
```

Single container serves both API and static files. Service name: `recoverysky-blog`. Deployed via Forgejo CI to AWS ECR.

## Path Alias

`@/` maps to `./src/` — configured in both `vite.config.ts` and `tsconfig.json`.
