# Static AWS Amplify Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `temple-www` from a Docker/Swarm-deployed Express SSR app into a pure static site deployable to AWS Amplify, preserving per-page SEO via build-time prerendering.

**Architecture:** Reuse the existing `render()` from the SSR build to prerender the four self-contained marketing routes to static HTML at build time; hydrate on the client. Analytics moves from a server proxy to browser-direct Umami calls. The Directus/blog code stays as a dormant dead scaffold. The Express server is retained for local dev only; the old Docker/Forgejo infra is archived.

**Tech Stack:** Vite 6, React 18, react-router 7, react-helmet-async, TypeScript, pnpm 10.14.0, Node 22, AWS Amplify Hosting (static).

## Testing Note

This repo has **no test runner** and no test suite, and the approved spec deliberately chose **manual verification** (build + inspect + browser check). Adding a test framework is out of scope. Accordingly, each task's verification is a build/inspect/commit cycle, not a red-green unit test. Verification steps below are concrete and checkable — run them exactly as written.

## Global Constraints

- Node version: **22** (matches retired Dockerfile `node:22-alpine`).
- Package manager: **pnpm@10.14.0** via corepack. Always `--frozen-lockfile`.
- Vite `envPrefix` is `['VITE_', 'AUTH0_']` — client-exposed env vars **must** start with `VITE_` (or `AUTH0_`). Defined in `vite.config.ts:10`.
- **No secret keys in client code.** `UMAMI_X_API_KEY` must never appear in `src/` or in any `VITE_`-prefixed var.
- Site base URL for SEO/sitemap: `https://templeofinannaslight.org`.
- Public Umami website ID (safe to expose): `1701310e-bc12-4c48-b034-9aab2951892b`; Umami server: `https://umami.recoverysky.app`.
- Prerendered marketing routes (the ONLY routes prerendered): `/`, `/app`, `/support`, `/resources`.
- Dead-scaffold routes (NOT prerendered, client-only): `/blog`, `/post/:id`, `/post/:id/:slug`, `/content/:collection/:name`.
- Do not modify `server/index.js` (retained unchanged for local dev), except it is no longer part of production.
- All work happens on branch `amplify-static-migration` (already created).

---

### Task 1: Browser-direct Umami analytics

Replace the server-proxied analytics with a direct browser → Umami call using the public website ID only.

**Files:**
- Modify: `src/lib/analytics.ts` (full rewrite of the file)
- Modify: `.env` (add two client vars)
- Modify: `.env.example` (document the two client vars; remove the stale server-proxy note)

**Interfaces:**
- Consumes: `import.meta.env.VITE_UMAMI_URL`, `import.meta.env.VITE_UMAMI_WEBSITE_ID`.
- Produces: `trackPageview(): void` and `trackEvent(name: string, data?: Record<string, unknown>): void` — same signatures the rest of the app already imports (`src/App.tsx` uses `trackPageview`). Do not rename them.

- [ ] **Step 1: Add client env vars to `.env`**

Append these lines to `.env` (the server-side `UMAMI_URL` / `UMAMI_WEBSITE_ID` / `UMAMI_X_API_KEY` lines stay as-is — leave them; they're now only read by the dev Express server and are harmless):

```dotenv
# Client-side Umami (exposed to browser via Vite; public website ID is safe)
VITE_UMAMI_URL=https://umami.recoverysky.app
VITE_UMAMI_WEBSITE_ID=1701310e-bc12-4c48-b034-9aab2951892b
```

- [ ] **Step 2: Rewrite `src/lib/analytics.ts`**

Replace the entire file with:

```ts
const UMAMI_URL = (import.meta.env.VITE_UMAMI_URL || "").replace(/\/$/, "");
const UMAMI_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID || "";

// Posts a single event directly to Umami's public /api/send endpoint.
// Uses the public website ID only — no secret key. Umami infers pageview
// vs. custom event from the presence of `name` in the payload.
function send(fields: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!UMAMI_URL || !UMAMI_WEBSITE_ID) return; // no-op if unconfigured (e.g. some dev envs)

  const body = JSON.stringify({
    type: "event",
    payload: {
      website: UMAMI_WEBSITE_ID,
      hostname: window.location.hostname,
      ...fields,
    },
  });

  const endpoint = `${UMAMI_URL}/api/send`;

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function basePayload() {
  return {
    url: window.location.pathname + window.location.search,
    referrer: document.referrer || "",
    title: document.title,
    language: navigator.language || "",
    screen: `${window.screen.width}x${window.screen.height}`,
  };
}

export function trackEvent(name: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  send({ ...basePayload(), name, ...(data ? { data } : {}) });
}

export function trackPageview() {
  if (typeof window === "undefined") return;
  send(basePayload());
}
```

- [ ] **Step 3: Update `.env.example`**

Open `.env.example`. Under the CLIENT-SIDE section, replace the `VITE_API_URL` block's surrounding guidance so the client analytics vars are documented. Concretely, add these lines to the CLIENT-SIDE section:

```dotenv
# Client-side Umami analytics (browser posts directly to Umami /api/send)
# The website ID is a public identifier — safe to expose. Do NOT put the
# Umami API key here; the browser tracker does not use it.
VITE_UMAMI_URL=https://umami.recoverysky.app
VITE_UMAMI_WEBSITE_ID=your_public_website_id_here
```

Leave the existing server-side section (DIRECTUS_*, UMAMI_X_API_KEY, etc.) intact — it still documents the dev Express server.

- [ ] **Step 4: Verify no secret key or `/api/track` remains in client code**

Run:

```bash
grep -rn "api/track\|UMAMI_X_API_KEY\|X_API_KEY" src/ ; echo "exit: $?"
```

Expected: **no matches** in `src/` (grep prints nothing; the `echo` reports a non-zero exit from grep, which confirms "not found"). If any `src/` line matches, remove it.

- [ ] **Step 5: Typecheck and build the client**

Run:

```bash
pnpm build:client
```

Expected: build completes with no TypeScript errors referencing `analytics.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/analytics.ts .env.example
git commit -m "feat: send analytics directly to Umami from the browser

Drop the server-side /api/track proxy dependency; post pageviews and
events straight to Umami /api/send using the public website ID via
VITE_UMAMI_* env vars. No secret key in the client."
```

(Note: `.env` is gitignored — it is intentionally NOT staged. Set `VITE_UMAMI_*` in the Amplify console for production, per Task 3.)

---

### Task 2: Build-time prerender script (SSG + sitemap)

Create a post-build script that renders the four marketing routes to static HTML and emits a static sitemap.

**Files:**
- Create: `scripts/prerender.mjs`
- Modify: `package.json` (add a `prerender` script)

**Interfaces:**
- Consumes: `render(url: string, ssrData?: object): { html: string; head: string }` exported from `dist/server/entry-server.js` (built by `pnpm build:server`; see `src/entry-server.tsx:7`). Also consumes `dist/client/index.html` (built by `pnpm build:client`) as the HTML template containing `<!--ssr-head-->` and `<!--ssr-outlet-->` placeholders.
- Produces: static files under `dist/client/`: `index.html`, `app/index.html`, `support/index.html`, `resources/index.html`, and `sitemap.xml`.

- [ ] **Step 1: Create `scripts/prerender.mjs`**

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const clientDir = path.join(rootDir, "dist", "client");
const serverEntry = path.join(rootDir, "dist", "server", "entry-server.js");

// Routes that are fully self-contained (need no live backend) and get
// prerendered to static HTML with baked-in SEO <head>.
const ROUTES = ["/", "/app", "/support", "/resources"];
const SITE_URL = process.env.SITE_URL || "https://templeofinannaslight.org";

// Mirror the server's escaping so an empty __SSR_DATA__ script is safe.
function safeJsonStringify(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

async function main() {
  const template = fs.readFileSync(path.join(clientDir, "index.html"), "utf-8");
  const { render } = await import(serverEntry);

  for (const route of ROUTES) {
    const { html, head } = render(route, {});
    const page = template
      .replace("<!--ssr-head-->", head)
      .replace("<!--ssr-outlet-->", html)
      .replace(
        "</head>",
        `<script>window.__SSR_DATA__=${safeJsonStringify({})}</script>\n</head>`
      );

    const outPath =
      route === "/"
        ? path.join(clientDir, "index.html")
        : path.join(clientDir, route.replace(/^\//, ""), "index.html");

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, page, "utf-8");
    console.log(`✓ prerendered ${route} → ${path.relative(clientDir, outPath)}`);
  }

  // Static sitemap — homepage only, matching the current dynamic route's output.
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
  </url>
</urlset>`;
  fs.writeFileSync(path.join(clientDir, "sitemap.xml"), sitemap, "utf-8");
  console.log("✓ wrote sitemap.xml");
}

main().catch((err) => {
  console.error("✗ prerender failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the `prerender` script to `package.json`**

In the `"scripts"` block, add a `prerender` entry (place it after `build:server`):

```json
    "prerender": "node scripts/prerender.mjs",
```

- [ ] **Step 3: Run a full build then prerender**

Run:

```bash
pnpm build && pnpm prerender
```

Expected output includes five lines:
```
✓ prerendered / → index.html
✓ prerendered /app → app/index.html
✓ prerendered /support → support/index.html
✓ prerendered /resources → resources/index.html
✓ wrote sitemap.xml
```

- [ ] **Step 4: Verify each page baked in its own SEO `<head>` and markup**

Run:

```bash
test -f dist/client/app/index.html && test -f dist/client/support/index.html && test -f dist/client/resources/index.html && test -f dist/client/sitemap.xml && echo "files OK"
grep -c "window.__SSR_DATA__" dist/client/app/index.html
grep -o "<title>[^<]*</title>" dist/client/index.html | head -1
grep -o "<title>[^<]*</title>" dist/client/support/index.html | head -1
```

Expected: `files OK`; the `__SSR_DATA__` count is `1`; and the two `<title>` lines are **present** (each page renders a title). Confirm `#root` is non-empty by:

```bash
grep -o '<div id="root">.\{1,40\}' dist/client/resources/index.html
```

Expected: shows `<div id="root">` followed by rendered markup (not immediately `</div>`).

- [ ] **Step 5: Smoke-test the static output as a real static server**

Run (serves the built output with no backend):

```bash
npx --yes serve dist/client -l 4173 &
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/support
curl -s http://localhost:4173/support | grep -o "<title>[^<]*</title>" | head -1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/sitemap.xml
kill %1
```

Expected: `/support` returns `200` and a `<title>`; `/sitemap.xml` returns `200`. (This confirms the prerendered files serve statically without JS.)

- [ ] **Step 6: Commit**

```bash
git add scripts/prerender.mjs package.json
git commit -m "feat: prerender marketing routes to static HTML at build time

Add scripts/prerender.mjs which reuses the SSR render() to emit static
index.html for /, /app, /support, /resources plus a static sitemap.xml
into dist/client. Enables zero-backend static hosting with per-page SEO."
```

---

### Task 3: Amplify build config + routing rules

Add the Amplify build spec and document the rewrite rules so prerendered routes serve their own HTML while unknown paths fall back to the SPA.

**Files:**
- Create: `amplify.yml` (repo root)
- Create: `.nvmrc` (repo root)
- Create: `docs/amplify-setup.md` (console settings the implementer must apply)

**Interfaces:**
- Consumes: the `build` and `prerender` package scripts from Task 2; `VITE_UMAMI_*` env vars from Task 1.
- Produces: `dist/client` as the Amplify artifact `baseDirectory`.

- [ ] **Step 1: Create `.nvmrc`**

```
22
```

- [ ] **Step 2: Create `amplify.yml`**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm use 22 || nvm install 22
        - corepack enable
        - corepack prepare pnpm@10.14.0 --activate
        - pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm build
        - pnpm prerender
  artifacts:
    baseDirectory: dist/client
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

- [ ] **Step 3: Create `docs/amplify-setup.md`**

```markdown
# AWS Amplify Hosting setup for temple-www

This app deploys as a **pure static site**. No backend/compute.

## 1. Connect the repo
Amplify Console → New app → Host web app → connect this repository and the
deploy branch. Amplify auto-detects `amplify.yml` at the repo root.

## 2. Environment variables (App settings → Environment variables)
These are inlined at BUILD time by Vite, so they must be set before a build:

| Key | Value |
|---|---|
| `VITE_UMAMI_URL` | `https://umami.recoverysky.app` |
| `VITE_UMAMI_WEBSITE_ID` | `1701310e-bc12-4c48-b034-9aab2951892b` |

Do NOT set any Umami API key here — the browser tracker does not use it.

## 3. Rewrites and redirects (App settings → Rewrites and redirects)
Order matters. Add these rules top-to-bottom. The explicit rules serve the
prerendered pages; the final catch-all sends everything else to the SPA so
client-only routes (dead blog scaffold, deep links) still load.

| Source address | Target address | Type |
|---|---|---|
| `/app` | `/app/index.html` | 200 (Rewrite) |
| `/support` | `/support/index.html` | 200 (Rewrite) |
| `/resources` | `/resources/index.html` | 200 (Rewrite) |
| `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|xml)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

The last row is AWS's standard SPA rewrite: it matches any path with no file
extension (or a non-asset extension) and serves the root SPA. Requests for
real files (JS/CSS/images/`sitemap.xml`) are served directly and never hit it.

## 4. Custom domain
App settings → Custom domains → add `templeofinannaslight.org` and follow the
DNS verification steps. Amplify provisions TLS automatically.

## 5. Decommission old infra (after verifying the Amplify deploy)
- Stop the Swarm service for this app.
- Disable/remove the Forgejo workflow (archived under `_archive/.forgejo`).
- Rotate `UMAMI_X_API_KEY` in Umami (it was previously embedded server-side).
```

- [ ] **Step 4: Validate `amplify.yml` is well-formed YAML**

Run:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('amplify.yml','utf8');if(!/baseDirectory:\s*dist\/client/.test(s))throw new Error('baseDirectory missing');if(!/pnpm prerender/.test(s))throw new Error('prerender step missing');console.log('amplify.yml OK')"
```

Expected: `amplify.yml OK`.

- [ ] **Step 5: Commit**

```bash
git add amplify.yml .nvmrc docs/amplify-setup.md
git commit -m "feat: add Amplify static build config and setup docs

amplify.yml builds + prerenders to dist/client; .nvmrc pins Node 22;
docs/amplify-setup.md documents env vars, SPA rewrite rules, custom
domain, and old-infra decommission steps."
```

---

### Task 4: Archive retired Docker/Forgejo infra

Move the now-unused deploy files out of the way (recoverable, not deleted).

**Files:**
- Move: `Dockerfile` → `_archive/Dockerfile`
- Move: `compose.yml` → `_archive/compose.yml`
- Move: `.forgejo/` → `_archive/.forgejo/`
- Create: `_archive/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by other tasks. Purely organizational.

- [ ] **Step 1: Move the files with git**

```bash
mkdir -p _archive
git mv Dockerfile _archive/Dockerfile
git mv compose.yml _archive/compose.yml
git mv .forgejo _archive/.forgejo
```

- [ ] **Step 2: Create `_archive/README.md`**

```markdown
# Archived infrastructure

These files supported the previous deploy path: a Docker image built and
pushed to AWS ECR by Forgejo CI (`.forgejo/workflows/make.yml`) and run on
Docker Swarm (`compose.yml`). The site now deploys as a pure static site to
AWS Amplify (see `amplify.yml` and `docs/amplify-setup.md`).

Kept for reference / rollback. Nothing here is used by the current build or
by local development. Note: `server/index.js` (the Express SSR server) is NOT
archived — it is still used for local dev via `pnpm dev`.
```

- [ ] **Step 3: Verify the working tree still builds and the moves are clean**

Run:

```bash
test ! -e Dockerfile && test ! -e compose.yml && test ! -d .forgejo && test -f _archive/Dockerfile && echo "moved OK"
pnpm build && pnpm prerender >/dev/null && echo "build OK"
```

Expected: `moved OK` then `build OK` (the build does not depend on the archived files).

- [ ] **Step 4: Commit**

```bash
git add _archive
git commit -m "chore: archive Docker/Swarm/Forgejo deploy infra

Move Dockerfile, compose.yml, and .forgejo/ into _archive/ now that the
site deploys as a static app on Amplify. server/index.js stays for local
dev. Files kept for reference/rollback, not used by the build."
```

---

### Task 5: Update CLAUDE.md deployment section

The repo's `CLAUDE.md` documents the Docker/Swarm/Forgejo deploy as current. Update the Docker/Deploy section to reflect the Amplify static target so future contributors aren't misled.

**Files:**
- Modify: `CLAUDE.md` (the `## Docker / Deploy` section and the `pnpm build` command notes)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. Documentation only.

- [ ] **Step 1: Replace the `## Docker / Deploy` section in `CLAUDE.md`**

Find the section that currently begins with `## Docker / Deploy` and describes `docker compose up`, ECR, and the `prod` branch. Replace that entire section with:

```markdown
## Deploy (AWS Amplify — static)

The production site deploys as a **pure static site** on AWS Amplify Hosting.
`amplify.yml` runs `pnpm build && pnpm prerender`, publishing `dist/client`.
There is **no runtime backend** in production: the four marketing routes
(`/`, `/app`, `/support`, `/resources`) are prerendered to static HTML by
`scripts/prerender.mjs`, and analytics posts directly from the browser to
Umami. See `docs/amplify-setup.md` for console env vars and rewrite rules.

The blog/Directus code is a dormant **dead scaffold** (not wired to a live
CMS). `server/index.js` (Express SSR + Directus proxy) is retained for
**local dev only** (`pnpm dev`); it is not used in production.

The previous Docker/Swarm/ECR/Forgejo pipeline is archived under `_archive/`.
```

- [ ] **Step 2: Add the `prerender` command to the Commands section**

In the `## Commands` code block, add this line after the `pnpm build` lines:

```bash
pnpm prerender   # Render / /app /support /resources to static HTML in dist/client (run after build)
```

- [ ] **Step 3: Verify no stale "docker compose up" instruction remains as current**

Run:

```bash
grep -n "docker compose up" CLAUDE.md ; echo "exit: $?"
```

Expected: **no matches** in `CLAUDE.md` (grep exits non-zero). If a match remains outside a clearly-archival note, remove it.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md deploy section for Amplify static target"
```

---

## Self-Review

**Spec coverage:**
- Rendering → build-time SSG → **Task 2** (prerender `/`, `/app`, `/support`, `/resources`). ✅
- Amplify build config (`amplify.yml`, preBuild/build/artifacts) → **Task 3**. ✅
- SPA 200-rewrite + per-route serving → **Task 3** (`docs/amplify-setup.md` rewrite table). ✅
- Analytics browser-direct to Umami, public ID only, no key → **Task 1**. ✅
- `VITE_` env vars + `.env.example` → **Task 1** (vars) + **Task 3** (Amplify console). ✅
- Static sitemap generation → **Task 2** (Step 1 emits `sitemap.xml`). ✅
- `robots.txt` already in `public/` → no task needed (Vite copies it). ✅
- Retire old infra to `_archive/` → **Task 4**. ✅
- Local dev Express retained unchanged → honored (no task modifies `server/index.js`; noted in Task 4/5). ✅
- Security: drop `UMAMI_X_API_KEY` from app, flag rotation → **Task 1** (drop) + **Task 3** docs (rotate). ✅
- Not-in-scope (rename, blog revival) → not planned. ✅
- Doc drift in `CLAUDE.md` (spec's "improve code you're working in" spirit) → **Task 5**. ✅

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N". All code blocks are complete and literal. ✅

**Type consistency:** `render(url, ssrData)` signature matches `src/entry-server.tsx:7` and the way `server/index.js` already imports it. `trackPageview()`/`trackEvent(name, data?)` names preserved from the original `analytics.ts` and match `App.tsx`'s import. `safeJsonStringify` mirrors the server's implementation. Route list identical across Tasks 2 and 3 and the Global Constraints. ✅
