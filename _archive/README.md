# Archived infrastructure

These files supported the previous deploy path: a Docker image built and
pushed to AWS ECR by Forgejo CI (`.forgejo/workflows/make.yml`) and run on
Docker Swarm (`compose.yml`). The site now deploys as a pure static site to
**GitHub Pages** via GitHub Actions (see `.github/workflows/pages.yml` and
`docs/github-pages-setup.md`).

Kept for reference / rollback. Nothing here is used by the current build or
by local development. Note: `server/index.js` (the Express SSR server) is NOT
archived — it is still used for local dev via `pnpm dev`.
