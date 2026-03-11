# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mikki's Mess** is a blog frontend built with Vite + React and TypeScript, with an Express API proxy server that connects to a Directus CMS instance at `https://content.rso`.

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

1. **Express Proxy Server** (`server/index.js` on port 3001):
   - Proxies `/api/:collection` requests to Directus `/items/:collection`
   - Injects `Authorization: Bearer` token for authenticated Directus access
   - Keeps Directus token server-side only (not exposed to browser)
   - Health check at `/health`

2. **Vite React Client** (`src/` on port 5173):
   - React SPA with Tailwind CSS 4
   - In dev, Vite proxies `/api` requests to Express (see `vite.config.ts`)
   - Fetches from `/api/Mikkis_Mess` collection

### Request Flow (Development)
```
Browser → Vite (5173) → /api proxy → Express (3001) → Directus CMS
```

### Key Files

- `server/index.js` - Express proxy with Directus authentication
- `src/App.tsx` - Main blog component, fetches and displays posts
- `src/components/ui/` - shadcn/ui components (Card)
- `vite.config.ts` - Path aliases (`@/`) and dev proxy config

## Environment Variables

| Variable | Server/Client | Description |
|----------|---------------|-------------|
| `DIRECTUS_URL` | Server | Directus CMS base URL |
| `DIRECTUS_TOKEN` | Server | Directus API bearer token |
| `PORT` | Server | Express port (default: 3001) |
| `CORS_ORIGIN` | Server | Allowed frontend origin |
| `VITE_API_URL` | Client | API base path (default: `/api`) |

## Directus Collection Schema

The `Mikkis_Mess` collection has:
- `id`, `title`, `content`, `date_created`, `date_updated`, `status`

Filter for published posts: `filter[status][_eq]=published`

## Tailwind CSS 4

Uses `@tailwindcss/postcss` plugin (not the v3 `tailwindcss` plugin). PostCSS config is in `postcss.config.js`.

## Docker

Single container serves both API and static files in production:

```bash
docker compose up -d              # Start container
docker compose up -d --build      # Rebuild and start
docker compose logs -f            # View logs
```

In production, Express serves the built Vite static files and handles `/api` routes.
