# Static GitHub Pages Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Filename note:** this plan keeps its original `amplify-static-migration` basename so the in-flight SDD workspace/ledger stay intact. The target host is **GitHub Pages** (pivoted from AWS Amplify on 2026-07-28). Tasks 1 and 2 were completed before the pivot and are host-agnostic; the pivot only reshapes Task 3 and rewords Tasks 4–5.

**Goal:** Convert `temple-www` from a Docker/Swarm-deployed Express SSR app into a pure static site deployable to GitHub Pages, preserving per-page SEO via build-time prerendering.

**Architecture:** Reuse the existing `render()` from the SSR build to prerender the four self-contained marketing routes to static HTML at build time (plus a `404.html` SPA shell for everything else); hydrate on the client. Analytics moves from a server proxy to browser-direct Umami calls. A GitHub Actions workflow builds and publishes `dist/client` to Pages. The Directus/blog code stays as a dormant dead scaffold. The Express server is retained for local dev only; the old Docker/Forgejo infra is archived.

**Tech Stack:** Vite 6, React 18, react-router 7, react-helmet-async, TypeScript, pnpm 10.14.0, Node 22, GitHub Actions + GitHub Pages (static, apex custom domain).

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
- Dead-scaffold routes (NOT prerendered, client-only): `/blog`, `/post/:id`, `/post/:id/:slug`, `/content/:collection/:name`. On GitHub Pages these resolve via `404.html` (SPA shell).
- **Host: GitHub Pages**, served from an **apex custom domain** (`templeofinannaslight.org`). Vite `base` stays `/` — do NOT change it.
- Deploy is a **GitHub Actions** workflow (build + prerender + publish `dist/client`). Node is provided by the workflow via `.nvmrc`; corepack/pnpm are set up by the workflow actions.
- Do not modify `server/index.js` (retained unchanged for local dev), except it is no longer part of production.
- All work happens on branch `amplify-static-migration` (already created).

---

### Task 1: Browser-direct Umami analytics  ✅ COMPLETE (commit 61f84c6)

Replace the server-proxied analytics with a direct browser → Umami call using the public website ID only.

**Files:**
- Modify: `src/lib/analytics.ts` (full rewrite of the file)
- Modify: `.env` (add two client vars — gitignored, not committed)
- Modify: `.env.example` (document the two client vars)

**Interfaces:**
- Consumes: `import.meta.env.VITE_UMAMI_URL`, `import.meta.env.VITE_UMAMI_WEBSITE_ID`.
- Produces: `trackPageview(): void` and `trackEvent(name: string, data?: Record<string, unknown>): void` — same signatures the app already imports (`src/App.tsx`). Do not rename them.

Done before the host pivot; host-agnostic (analytics posts straight to the public Umami server regardless of where the static files are hosted). No changes required. See `src/lib/analytics.ts` at commit `61f84c6`.

---

### Task 2: Build-time prerender script (SSG + sitemap)  ✅ COMPLETE (commit 75a56bf)

Create a post-build script that renders the four marketing routes to static HTML and emits a static sitemap.

**Files:**
- Create: `scripts/prerender.mjs`
- Modify: `package.json` (add a `prerender` script)

**Interfaces:**
- Consumes: `render(url: string, ssrData?: object): { html: string; head: string }` from `dist/server/entry-server.js`; `dist/client/index.html` as template.
- Produces: `dist/client/{index,app/index,support/index,resources/index}.html` and `dist/client/sitemap.xml`.

Done before the host pivot. The script is host-agnostic. **Task 3 amends it** to also emit a `404.html` SPA shell for GitHub Pages. See `scripts/prerender.mjs` at commit `75a56bf`.

---

### Task 3: GitHub Pages deploy (Actions workflow, 404 SPA shell, custom domain)

Emit a `404.html` SPA fallback, add the GitHub Actions Pages workflow, the custom-domain `CNAME`, the Node pin, and setup docs. This is the host-specific task that replaces the former Amplify config.

**Files:**
- Modify: `scripts/prerender.mjs` (add `404.html` emission)
- Create: `.nvmrc` (repo root)
- Create: `public/CNAME`
- Create: `.github/workflows/pages.yml`
- Create: `docs/github-pages-setup.md`

**Interfaces:**
- Consumes: the `build` and `prerender` package scripts (Task 2); `VITE_UMAMI_*` env vars (Task 1).
- Produces: `dist/client` (now including `404.html` and `CNAME`) as the GitHub Pages artifact.

- [ ] **Step 1: Amend `scripts/prerender.mjs` to emit `404.html`**

In `scripts/prerender.mjs`, find the sitemap block that ends with this line inside `main()`:

```js
  fs.writeFileSync(path.join(clientDir, "sitemap.xml"), sitemap, "utf-8");
  console.log("✓ wrote sitemap.xml");
```

Immediately **after** that `console.log("✓ wrote sitemap.xml");` line (still inside `main()`, before its closing `}`), insert:

```js

  // SPA fallback for GitHub Pages. Pages serves this file for any path that
  // has no static file (dead blog scaffold, deep links). Empty #root and
  // empty head so the client boots fresh — no prerendered markup means no
  // hydration mismatch — and BrowserRouter renders the route for the real URL.
  const notFound = template
    .replace("<!--ssr-head-->", "")
    .replace("<!--ssr-outlet-->", "")
    .replace(
      "</head>",
      `<script>window.__SSR_DATA__=${safeJsonStringify({})}</script>\n</head>`
    );
  fs.writeFileSync(path.join(clientDir, "404.html"), notFound, "utf-8");
  console.log("✓ wrote 404.html");
```

(This reuses the `template` and `safeJsonStringify` already defined in the file — no new imports.)

- [ ] **Step 2: Create `.nvmrc`**

```
22
```

- [ ] **Step 3: Create `public/CNAME`**

Vite copies `public/` into `dist/client/`, so this file lands at `dist/client/CNAME` and sets the Pages custom domain. Contents (single line, no trailing blank line beyond the newline):

```
templeofinannaslight.org
```

- [ ] **Step 4: Create `.github/workflows/pages.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [prod]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.14.0
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Build and prerender
        run: pnpm build && pnpm prerender
        env:
          VITE_UMAMI_URL: https://umami.recoverysky.app
          VITE_UMAMI_WEBSITE_ID: 1701310e-bc12-4c48-b034-9aab2951892b
      - run: touch dist/client/.nojekyll
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/client

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Create `docs/github-pages-setup.md`**

```markdown
# GitHub Pages setup for temple-www

This site deploys as a **pure static site** to GitHub Pages via GitHub Actions.
No backend/compute.

## 1. Repository
Push this repo to GitHub. In **Settings → Pages → Build and deployment**, set
**Source = GitHub Actions**. The workflow `.github/workflows/pages.yml` handles
build + deploy; no branch source is needed.

## 2. Deploy trigger
The workflow runs on push to `prod` and on manual **workflow_dispatch**
(Actions tab → "Deploy to GitHub Pages" → Run workflow).

## 3. Build environment variables
The public Umami values are passed inline in the workflow `env:` block
(`VITE_UMAMI_URL`, `VITE_UMAMI_WEBSITE_ID`). They are public (website ID +
server URL) — no secrets. Do NOT add the Umami API key.

## 4. Custom domain
`public/CNAME` sets the custom domain to `templeofinannaslight.org` (Vite copies
it into the published output). At your DNS registrar, create the apex records
pointing at GitHub Pages:

- Four A records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
  `185.199.111.153` (GitHub Pages apex IPs); or an ALIAS/ANAME to
  `<user-or-org>.github.io`.
- Optional `www` CNAME → `<user-or-org>.github.io`.

Then in **Settings → Pages**, confirm the custom domain and enable
**Enforce HTTPS** once the certificate is provisioned.

## 5. Routing
Pages serves the prerendered files for `/`, `/app`, `/support`, `/resources`
directly (full SEO). Any other path (dead blog scaffold, deep links) is served
`404.html` — a SPA shell that boots the app and client-routes to the requested
URL. The HTTP 404 status on those unpublished routes is expected.

## 6. Decommission old infra (after verifying the Pages deploy)
- Stop the Swarm service for this app.
- The Forgejo workflow is archived under `_archive/.forgejo/`.
- Rotate `UMAMI_X_API_KEY` in Umami (it was previously embedded server-side).
```

- [ ] **Step 6: Build, prerender, and verify the artifacts**

Run:

```bash
pnpm build && pnpm prerender
test -f dist/client/404.html && test -f dist/client/CNAME && echo "artifacts OK"
cat dist/client/CNAME
grep -o '<div id="root"></div>' dist/client/404.html && echo "404 root empty OK"
```

Expected: the prerender output now includes `✓ wrote 404.html` (after `✓ wrote sitemap.xml`); `artifacts OK`; `CNAME` prints `templeofinannaslight.org`; and `404 root empty OK` (the 404 shell has an empty `#root`, confirming no prerendered markup was left in).

- [ ] **Step 7: Validate the workflow file**

Run:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/pages.yml','utf8');for(const t of ['upload-pages-artifact','deploy-pages','pnpm prerender']){if(!s.includes(t))throw new Error('missing: '+t)}if(!/path:\s*dist\/client/.test(s))throw new Error('artifact path wrong');console.log('workflow OK')"
```

Expected: `workflow OK`.

- [ ] **Step 8: Smoke-test the 404 fallback as a static server**

Run:

```bash
npx --yes serve dist/client -l 4173 &
sleep 1
curl -s -o /dev/null -w "prerendered /support: %{http_code}\n" http://localhost:4173/support
curl -s -o /dev/null -w "dead route /blog: %{http_code}\n" http://localhost:4173/blog
curl -s http://localhost:4173/blog | grep -o '<div id="root"></div>' && echo "dead route served SPA shell OK"
kill %1
```

Expected: `/support` returns `200`; `/blog` returns `404` **and** its body is the SPA shell (`<div id="root"></div>` present) — confirming `serve` (like GitHub Pages) falls back to `404.html`, which the client router will then render. (`serve` uses `404.html` as its fallback the same way Pages does.)

- [ ] **Step 9: Commit**

```bash
git add scripts/prerender.mjs .nvmrc public/CNAME .github/workflows/pages.yml docs/github-pages-setup.md
git commit -m "feat: deploy to GitHub Pages via Actions

Add .github/workflows/pages.yml (build + prerender + deploy dist/client),
public/CNAME for the apex custom domain, .nvmrc (Node 22), and a 404.html
SPA fallback emitted by the prerender script so non-prerendered routes
client-route on Pages. Docs in docs/github-pages-setup.md."
```

---

### Task 4: Archive retired Docker/Forgejo infra

Move the now-unused deploy files out of the way (recoverable, not deleted). GitHub Actions (`.github/workflows/pages.yml`) replaces the Forgejo workflow.

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
**GitHub Pages** via GitHub Actions (see `.github/workflows/pages.yml` and
`docs/github-pages-setup.md`).

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
site deploys as a static app on GitHub Pages via Actions. server/index.js
stays for local dev. Files kept for reference/rollback, not used by build."
```

---

### Task 5: Update CLAUDE.md deployment section

The repo's `CLAUDE.md` documents the Docker/Swarm/Forgejo deploy as current. Update the Docker/Deploy section to reflect the GitHub Pages static target so future contributors aren't misled.

**Files:**
- Modify: `CLAUDE.md` (the `## Docker / Deploy` section and the `pnpm build` command notes)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. Documentation only.

- [ ] **Step 1: Replace the `## Docker / Deploy` section in `CLAUDE.md`**

Find the section that currently begins with `## Docker / Deploy` and describes `docker compose up`, ECR, and the `prod` branch. Replace that entire section with:

```markdown
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
```

- [ ] **Step 2: Add the `prerender` command to the Commands section**

In the `## Commands` code block, add this line after the `pnpm build` lines:

```bash
pnpm prerender   # Render / /app /support /resources to static HTML (+ 404.html SPA shell) in dist/client; run after build
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
git commit -m "docs: update CLAUDE.md deploy section for GitHub Pages target"
```

---

## Self-Review

**Spec coverage:**
- Rendering → build-time SSG → **Task 2** (prerender `/`, `/app`, `/support`, `/resources`). ✅
- 404.html SPA shell for non-prerendered routes → **Task 3 Step 1**. ✅
- GitHub Actions Pages workflow (build/prerender/upload/deploy) → **Task 3 Step 4**. ✅
- Apex custom domain / `CNAME` / base path `/` → **Task 3 Step 3** + Global Constraints (no `base` change). ✅
- Node pin via `.nvmrc`, workflow reads it → **Task 3 Steps 2 & 4**. ✅
- Analytics browser-direct to Umami, public ID only, no key; build-time `VITE_` vars passed by the workflow → **Task 1** (code) + **Task 3 Step 4** (workflow env). ✅
- Static sitemap generation → **Task 2** (`sitemap.xml`). ✅ *(Known deferred minor: homepage-only.)*
- `robots.txt` already in `public/` → Vite copies it; no task needed. ✅
- `.nojekyll` insurance → **Task 3 Step 4** (`touch dist/client/.nojekyll`). ✅
- Retire old infra to `_archive/` → **Task 4**. ✅
- Local dev Express retained unchanged → honored (no task modifies `server/index.js`; noted in Tasks 4/5). ✅
- Security: drop `UMAMI_X_API_KEY` from app, flag rotation → **Task 1** (drop) + **Task 3/`docs`** (rotate). ✅
- Not-in-scope (rename, blog revival) → not planned. ✅
- Doc drift in `CLAUDE.md` → **Task 5**. ✅

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N". All code blocks are complete and literal. ✅

**Type consistency:** `render(url, ssrData)` matches `src/entry-server.tsx:7` and how `server/index.js` imports it. The 404 amendment reuses the file's existing `template` and `safeJsonStringify` — no new symbols. `trackPageview()`/`trackEvent(name, data?)` preserved. Route list identical across Global Constraints and Task 2. Workflow artifact path (`dist/client`) matches the prerender output dir and the CNAME/404 locations. ✅
