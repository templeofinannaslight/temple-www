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
