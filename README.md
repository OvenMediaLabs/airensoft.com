# ovenmedialabs.com

Marketing site, blog, and product docs for OvenMedia Labs. Built with
[Docusaurus 3](https://docusaurus.io/) and deployed to GitHub Pages at
[ovenmedialabs.com](https://ovenmedialabs.com).

## Layout

```
src/pages/        Marketing pages (index, ome, ome-enterprise, latency, …) as MDX
src/components/   React components shared across pages
src/theme/        Swizzled Docusaurus components (navbar, footer, …)
blog/             Blog posts
docs/ome/         OvenMediaEngine manual              ← synced from upstream
docs/ome-enterprise/  OvenMediaEngine Enterprise manual ← synced from upstream
docs/ovenplayer/  OvenPlayer manual                   ← synced from upstream
scripts/          sync-docs.sh — pulls each upstream's docs into docs/<source>/
sidebars-*.ts     Per-product sidebar definitions
docusaurus.config.ts  Site config (broken-link policy is throw mode)
```

## Local development

```bash
npm ci
npm start            # http://localhost:3000
npm run build        # production build with full broken-link checks
npm run typecheck
```

For docs editing, prefer the upstream repo's `docs/preview.sh` — it boots this
site with only the product you're editing surfaced.

## How docs reach the site

The `docs/*` folders are mirrors. **Do not edit them here** — edits are
overwritten on the next sync. Real source lives in each upstream:

| Source       | Upstream repo                         | Source folder        |
| ------------ | ------------------------------------- | -------------------- |
| `ome`        | OvenMediaLabs/OvenMediaEngine           | `docs/`              |
| `ome-enterprise` | OvenMediaLabs/OvenMediaEngineEnterprise | `docs-enterprise/`   |
| `ovenplayer` | OvenMediaLabs/OvenPlayer                | `docs/`              |

Auto-sync pipeline:

```
upstream master push (touches docs*)
  └─ notify-docs-sync.yml (upstream)        repository_dispatch
       └─ sync-docs.yml (here)              git read-tree all three upstreams → main
            └─ deploy.yml (here)            Docusaurus build → GitHub Pages → Slack
```

`sync-docs.yml` coalesces bursts (`cancel-in-progress: true`) and resyncs every
upstream on each run, so the latest dispatch always lands the full end state.
`deploy.yml` queues instead of cancelling, because Pages deploy is atomic.

Manual re-sync: Actions → *Sync docs from upstream* → **Run workflow**.

## Where to edit what

| Change                          | Where                                                    |
| ------------------------------- | -------------------------------------------------------- |
| Marketing copy / new landing page | `src/pages/*.mdx`                                      |
| Header / footer / navbar        | `src/theme/Navbar/Content`, `src/theme/Footer/Layout`    |
| Sidebar order / grouping        | `sidebars-<product>.ts`                                  |
| OME manual page                 | OvenMediaEngine repo → `docs/`                           |
| OME-E manual page               | OvenMediaEngineEnterprise repo → `docs-enterprise/`      |
| OvenPlayer manual page          | OvenPlayer repo → `docs/`                                |
| Blog post                       | `blog/<date>-<slug>/index.md`                            |
| New broken-link redirect        | `docusaurus.config.ts` → `redirects` plugin              |

## Secrets

Configured under repo *Settings → Secrets and variables → Actions*:

- `OML_DOCS_SYNC_PAT` — fine-grained PAT (org-owned), R/W contents on the four
  repos. Used by upstream notifies and by this repo's checkout in `sync-docs.yml`
  to access private OME Enterprise.
- `SLACK_DEVREL_WEBHOOK_URL` — Slack incoming webhook for deploy notifications.

## Deployment

GitHub Pages serves the build artifact produced by `.github/workflows/deploy.yml`
on every push to `main`. Custom domain `ovenmedialabs.com` is configured via the
root `CNAME` file. Pages mode: **GitHub Actions** (not "Deploy from branch").

The deploy job posts start / success / failure messages to Slack via
`SLACK_DEVREL_WEBHOOK_URL`. If the secret isn't set the steps no-op silently.
