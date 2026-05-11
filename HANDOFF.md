# Handoff: OvenMediaLabs site rebuild (Docusaurus migration)

> Working notes for the next Claude session, picking up after the remote-server session disconnected. Read this top-to-bottom before changing anything.

## 1. The project in one paragraph

OvenMediaLabs (OML, formerly AirenSoft) is consolidating its web presence. Today the public marketing site lives at `ovenmedialabs.com` as hand-written static HTML, the engineering blog is on Medium (`medium.com/@OvenMediaEngine`), and the OvenMediaEngine manuals live on GitBook (`docs.ovenmediaengine.com/` for OSS, `docs.enterprise.ovenmediaengine.com/` for the Enterprise edition). The rebuild moves all three onto a single Docusaurus site served from GitHub Pages at `ovenmedialabs.com`, with `/blog/*` and `/docs/*` as subpaths. The branch is `hugo-migration` (legacy name from when Hugo was the candidate; the stack actually settled on Docusaurus — see section 3).

Repo: `https://github.com/OvenMediaLabs/airensoft.com`
Branch: `hugo-migration`
Production host: GitHub Pages (CNAME `ovenmedialabs.com`)

## 2. The original brief (verbatim, condensed)

- **Goal**: Pull Medium blog and GitBook docs into the OML domain so SEO and lead capture land on OML assets.
- **SSG decision history**: started Hugo, then evaluated Astro+Starlight / Next.js+Nextra / Hugo+Docusaurus hybrid / Docusaurus solo. Final pick: **Docusaurus solo, full stack**.
- **Blog URL**: `ovenmedialabs.com/blog/` subpath (not subdomain).
- **Hosting**: GitHub Pages, deployed via GitHub Actions.
- **Medium**: migrate all posts.
- **Docs**: migrate both OSS (markdown in `OvenMediaLabs/OvenMediaEngine` repo under `docs/`) and Enterprise (needs GitBook export — user must produce this).
- **Theme**: custom, no popular theme. Preserve existing marketing design "100%". After seeing LiveKit reference the user agreed that *LiveKit-level* visual consistency was sufficient — section-appropriate UX (docs sidebar, blog list) is acceptable as long as the brand feel is consistent.
- **Editorial constraint**: maintainer is non-developer but comfortable with HTML/Markdown and has Claude Code available. Devs will also contribute. Markdown-first workflow is OK.
- **Money**: OK to spend, but only if it pays off. So far no paid SaaS introduced.
- **Blog cadence**: 3-4 posts/month.
- **Docs cadence**: frequent (tracks feature additions).
- **GitBook satisfaction**: "별로야" (not great) — real motivation to move off, not just brand unification.
- **Content rule for blog posts**: do not use em-dash (—) or en-dash (–) as sentence punctuation. Use commas, periods, colons, or parentheses instead.

## 3. Why Docusaurus (concise re-derivation)

The conversation cycled through Hugo (fast but no built-in docs polish; would have to build sidebar/search/versioning by hand), Astro+Starlight (modern, content-friendly, but newer ecosystem), Next.js+Nextra (industry-standard for company sites like LiveKit/Mux, but Next.js is a general framework and overkill for a pure content site), and Hugo+Docusaurus split (two toolchains, design drift risk). The user kept refining priorities: GitBook escape + content-management ergonomics + LiveKit-level (not pixel-perfect) consistency. Docusaurus wins on:

- Built-in docs + blog + versioning + i18n; no DIY chrome.
- MDX inline React components (better than Hugo shortcodes for the API-heavy docs OME has).
- Daily.co (a direct peer in real-time streaming) uses it for its docs.
- Marketing pages absorbed as `src/pages/*.mdx` after the user accepted the "약간 부자연스러움" framing was overstated by the assistant.
- Single toolchain, single design system, simpler CI.

Trade-offs accepted: Node toolchain (npm + dependencies), slower dev-server first-boot vs Hugo, eventual React/MDX version migrations.

## 4. What's already done

### 4.1 Scaffold
- Docusaurus **3.10.1** + React 19 + `@docusaurus/faster` (RSpack) + TypeScript.
- `package.json`, `package-lock.json`, `tsconfig.json`, `docusaurus.config.ts`, `sidebars.ts` — all in repo root.
- Node 20+ required (`engines.node: ">=20.0"`).

### 4.2 Assets migrated to `static/`
- Legacy `assets/` → `static/assets/` (CSS, JS, downloads). URL unchanged: `/assets/...`.
- Legacy `images/` → `static/images/`. URL unchanged: `/images/...`.
- `CNAME`, `robots.txt`, `.htaccess` → `static/`. Domain config preserved.
- Legacy `index.html`, `ome.html`, `ome-enterprise.html`, `company.html`, `contact.html`, `latency.html`, `agplv3.html`, `eula.html`, `404.html` **kept at repo root as reference only**. They are not served (Docusaurus serves from `build/`).

### 4.3 CSS pipeline
- `src/css/custom.css` — Infima token overrides (primary color #ffb800, Inter font, `--ifm-navbar-height: 78px` mirroring legacy `--navbar-height`), full-bleed reset for `.marketing-page` wrapper class.
- `src/css/legacy-marketing.css` — verbatim copy of legacy `style.css` (2014 lines), with `url(../../images/...)` rewritten to `url(/images/...)` since the file moved under `src/`.
- Both passed to `customCss` as an array; legacy CSS loads **last** in the bundle so its selectors win over Infima where they collide.
- Bootstrap 5 CDN + Phosphor Icons CDN + Inter Google Font loaded via `headTags`.

### 4.4 Bootstrap dark theme
- Legacy CSS expects `<html data-bs-theme="dark">`. We set this with an **inline script in `headTags`** so it executes synchronously before first paint — no light-theme flash.
- A redundant clientModule (`src/clientModules/bootstrap-dark.ts`) also sets it; safe to keep both.

### 4.5 Theme swizzles (live under `src/theme/`)
- `Navbar/Content/index.tsx` — full custom navbar markup (Bootstrap `<nav class="navbar navbar-expand-lg navbar-custom">` structure). Menu items still come from `themeConfig.navbar.items`. Active-state detection via `useLocation()`. Brand block places `(Formerly AirenSoft)` `<p>` *inside* the `<picture>` to match legacy stacking (browsers tolerate the non-spec nesting).
- `Navbar/Layout/index.tsx` — wraps Docusaurus's outer nav element. Adds `navbar-expand-lg navbar-custom` classes so legacy CSS selectors apply.
- `Footer/Layout/index.tsx` — replaces Docusaurus's default footer with the legacy 5-column layout + Seoul address block + copyright line.

### 4.6 ClientModules (`src/clientModules/`)
- `bootstrap-dark.ts` — sets `data-bs-theme=dark` on hydration (belt-and-braces with the headTags inline script).
- `legacy-marketing.ts` — port of legacy `static/assets/js/main.js`:
  - SPA-aware: uses `onRouteDidUpdate` to re-attach on every route change.
  - Null-guards every DOM lookup.
  - Returns cleanup functions; observers and listeners are torn down on route change.
  - Ports: navbar scroll-effect (`scrolled` class above 20px), reveal-up IntersectionObserver, scroll-indicator click, scroll-to-top button.
  - Intentionally NOT ported: Medium RSS blog grid (we're moving to internal blog), legacy notice modal, EULA section observer.

### 4.7 Marketing pages (MDX)
- `src/pages/index.mdx` — homepage, all sections from legacy `index.html` (hero, Enterprise + open-source split, latency comparison, use-case grid, blog preview placeholder, company tagline). Uses `wrapperClassName: marketing-page` and `hide_table_of_contents: true`.
- `src/pages/ome.mdx` — OvenMediaEngine product page. Same structure, ~7 sections.

### 4.8 Blog
- `blog/` retains Docusaurus template posts (welcome, mdx-blog-post, long-blog-post). To be deleted/replaced when Medium migration runs.
- `blog/authors.yml`, `blog/tags.yml` — placeholders.
- RSS + Atom feeds enabled in config (`feedOptions: type: ['rss', 'atom']`).

### 4.9 Docs
- `docs/intro.mdx` with `slug: /` so `/docs` route serves it. Contains `:::info[Migration in progress]` admonition (v3 syntax — title in **brackets**, not space-separated like v2).
- `sidebars.ts` uses `{type: 'autogenerated', dirName: '.'}` so files dropped into `docs/` show up automatically.
- Docusaurus tutorial template files (`tutorial-basics/`, `tutorial-extras/`) **already deleted**.

### 4.10 CI / deploy
- `.github/workflows/deploy.yml` — on push to `main`, builds with Node 22 and deploys to GitHub Pages via `actions/deploy-pages@v4`.
- Concurrency group prevents overlapping deploys.
- `NODE_OPTIONS=--max-old-space-size=4096` allotted for the build step.

### 4.11 Verified rendering
- `npm run build` succeeds; only warnings are `onBrokenAnchors` for `/ome#ovenplayer`, `/ome#ovenlivekit` (legitimate — Docusaurus's anchor checker doesn't index `id` attributes on JSX `<div>`s, but they work at runtime).
- Headless-Chrome screenshot comparison (Puppeteer) used iteratively against `ovenmedialabs.com` (production legacy) to verify visual parity at viewport 1440×900 and 1600×900. Homepage and OME page match the legacy design.
- Known visible difference vs production: navbar items differ intentionally — production has external "OvenMediaBlog" Medium link; ours has internal "Docs" and "Blog". The blog grid section on the homepage shows a placeholder spinner because the Medium fetcher was removed (replaced by Docusaurus blog plugin, which is empty until posts are migrated).

## 5. What's NOT done (the work queue)

| Priority | Item | Notes |
|---|---|---|
| 1 | Port remaining marketing pages | `ome-enterprise.html` (54KB), `company.html` (32KB), `latency.html` (31KB), `contact.html` (19KB), `agplv3.html` (23KB), `eula.html` (96KB, mostly prose), `404.html` (13KB). Mechanical HTML→MDX. Use index.mdx and ome.mdx as templates. |
| 2 | Migrate Medium blog | User has not exported Medium yet. Options: (a) ask user for the Medium export ZIP, (b) use `rss2json.com` build-time fetcher, (c) use `medium-to-markdown` npm tool. Each post becomes `blog/YYYY-MM-DD-slug.mdx`. Re-host images to `static/blog/`. Add canonical link back to Medium until SEO transfers. |
| 3 | Migrate OSS docs | Source: `https://github.com/OvenMediaLabs/OvenMediaEngine/tree/master/docs` (GitBook flavor markdown). Need to clone or `gh api` fetch the directory tree, then convert GitBook syntax (`{% hint %}`, `{% tabs %}`, `{% page-ref %}`, `{% embed %}`, `{% file %}`) to Docusaurus admonitions and components. |
| 4 | Migrate Enterprise docs | User must produce a **GitBook export** first (no automated path — Enterprise docs are not in a public repo). After export, same conversion rules as OSS docs. |
| 5 | API docs tooling | If OME has an OpenAPI spec (likely yes, for REST control plane), install `docusaurus-plugin-openapi-docs` + `docusaurus-theme-openapi-docs`. Generates per-endpoint pages from `openapi.yaml`. Check spec location with user. |
| 6 | GTM + Cookiebot | Legacy `index.html` lines 46-77 carry `gtag` consent defaults, Cookiebot script, GTM-THBJMSZV container, GA4 G-YF1TS3WD9S, Google Ads AW-955539851. Move into `docusaurus.config.ts` `scripts` / `headTags` arrays. |
| 7 | 301 redirect map | Old Medium URLs → new `/blog/...`. Old GitBook URLs → new `/docs/...`. Place in legacy hosting or use Docusaurus `aliases` frontmatter for in-app redirects. |
| 8 | Visual review @ mobile breakpoint | Headless tests so far only run at 1440/1600 width. Mobile menu collapse, hamburger toggle, mobile blog-grid horizontal scroll need verification. |
| 9 | Replace blog placeholder posts | Delete the Docusaurus welcome template posts in `blog/` once real Medium posts arrive. |
| 10 | Rename branch `hugo-migration` → `docusaurus-migration` (or merge to `main` and delete) | Cosmetic but reduces confusion. |
| 11 | Domain cutover | Final step: merge branch to `main`, verify GH Pages deploy, point DNS if needed (CNAME already in `static/`). |

The session's last in-flight detail was a **dev server restart** to pick up the `clientModules` config change. On the Mac, just run `npm start` fresh — the restart happens by definition.

## 6. Mac setup

```bash
# Clone (skip if you already have the repo locally)
git clone https://github.com/OvenMediaLabs/airensoft.com.git
cd airensoft.com

# Switch to the rebuild branch
git fetch origin
git checkout hugo-migration

# Node 20+ required. Check version
node --version

# Install deps (~1 min, 1300+ packages)
npm install

# Dev server with hot reload
npm start
# opens http://localhost:3000

# Production build (~30s-1min)
npm run build
# output at build/

# Preview production build
npm run serve
# also serves at http://localhost:3000

# TypeScript check
npm run typecheck
```

The screenshot comparison harness used on the remote server lives in `/tmp/screenshot-tool/` (not in the repo). If you want to recreate it on Mac:

```bash
mkdir -p /tmp/screenshot-tool && cd /tmp/screenshot-tool
npm init -y
npm install puppeteer
```

Then write a capture script that hits `localhost:3000` and `https://ovenmedialabs.com/` at the same viewport and saves PNGs to compare. The previous session used `--no-sandbox` flags and force-activated `.reveal-up` elements before screenshotting (since the IntersectionObserver requires scroll/visibility).

## 7. File map (cheat sheet)

```
docusaurus.config.ts           ← site config: navbar, footer, headTags, customCss, clientModules
sidebars.ts                    ← docs sidebar (autogenerated from docs/)
package.json                   ← deps and scripts
tsconfig.json                  ← extends @docusaurus/tsconfig

src/
├── pages/
│   ├── index.mdx              ← homepage (DONE)
│   └── ome.mdx                ← OME page (DONE)
├── theme/                     ← swizzled Docusaurus components
│   ├── Navbar/
│   │   ├── Content/index.tsx  ← inner nav markup (eject)
│   │   └── Layout/index.tsx   ← outer nav wrapper (eject)
│   └── Footer/
│       └── Layout/index.tsx   ← custom footer (eject)
├── clientModules/
│   ├── bootstrap-dark.ts      ← data-bs-theme=dark
│   └── legacy-marketing.ts    ← scroll/reveal/scroll-top, SPA-aware
└── css/
    ├── custom.css             ← Infima overrides + navbar height var
    └── legacy-marketing.css   ← copy of legacy style.css (2014 lines)

docs/
└── intro.mdx                  ← /docs landing (slug: /)

blog/                          ← Docusaurus template posts (to replace)

static/
├── assets/                    ← legacy CSS/JS/downloads (URL: /assets/...)
├── images/                    ← legacy images (URL: /images/...)
├── CNAME                      ← domain
├── robots.txt
└── .htaccess                  ← preserved but inert on GH Pages

.github/workflows/
└── deploy.yml                 ← build + GH Pages deploy

Repo root *.html               ← legacy reference (NOT served, asset paths broken)
HANDOFF.md                     ← this document
```

## 8. Gotchas to remember

- **MDX page width**: Docusaurus auto-wraps MDX pages in `<main class="container">` which clamps to 1320px. For full-bleed marketing layouts you need `wrapperClassName: marketing-page` in frontmatter, and `.marketing-page main { max-width: none !important }` is already in `custom.css`. Apply this to every new marketing page.
- **Admonition syntax v3**: `:::info[Title]` (brackets), not `:::info Title` (space). Title goes in brackets; v2 syntax is broken in 3.x.
- **Legacy main.js**: do **not** load it via headTags `<script src=/assets/js/main.js>`. It assumes DOMContentLoaded fires after React hydration (false in SPA) and crashes with `null.classList`. Use `src/clientModules/legacy-marketing.ts` instead.
- **Bootstrap dark mode**: legacy CSS keys off `[data-bs-theme="dark"]`. We set it inline via a synchronous script in `headTags` plus a clientModule. Don't remove either.
- **Navbar height**: legacy uses `--navbar-height: 78px` (desktop) and 64px (≤996px). We mirror this into `--ifm-navbar-height` in `custom.css` so docs sidebar positioning and anchor-scroll offsets stay correct.
- **Image URLs in CSS**: when copying legacy CSS into `src/css/`, `url("../../images/...")` resolves to a non-existent path inside `src/`. The file at `src/css/legacy-marketing.css` already has absolute `url(/images/...)` rewrites — preserve them if you re-copy.
- **`onBrokenAnchors` warnings**: Docusaurus's anchor checker doesn't see `id` on JSX `<div>` elements (only headings), so `/ome#ovenplayer` shows as broken even though it works at runtime. Currently set to `warn`; flip to `throw` only once you've audited all anchor targets.
- **The branch name `hugo-migration`** is a historical artefact from when Hugo was the candidate. The stack is Docusaurus. Don't get confused — rename whenever convenient.
- **Legacy HTML files at repo root are reference only**. Their links to `/assets/...` and `/images/...` are broken if opened via `file://` because those moved under `static/`. They're useful for source-comparing during MDX conversion; not for visual checking.
- **VS Code Remote-SSH port forwarding** was what made `localhost:3000` work on the remote-server session. On the Mac, this is local; no port forwarding needed.

## 9. Editorial workflow reference (give to the maintainer)

**Add a blog post**
1. Create `blog/2026-05-12-llhls-vs-webrtc.mdx`
2. Frontmatter:
   ```yaml
   ---
   slug: llhls-vs-webrtc
   title: "LL-HLS vs WebRTC: when to choose which"
   authors: [ovenmedialabs]
   tags: [webrtc, llhls, latency]
   date: 2026-05-12
   ---
   ```
3. Write body in markdown/MDX.
4. Optional: drop images into the same folder as a *page bundle* and reference relatively.
5. `git add` + commit + push. PR or push to main triggers the GH Pages deploy.

**Add a docs page**
1. Create `docs/streaming/webrtc-output.md` (or `.mdx`).
2. Frontmatter: `title:`, `sidebar_position: 30`, `description:`.
3. Sidebar updates automatically (autogenerated).
4. Use admonitions: `:::note`, `:::info[Title]`, `:::warning`, `:::tip`, `:::danger`.

**Add a marketing page**
1. Create `src/pages/<slug>.mdx`.
2. Frontmatter:
   ```yaml
   ---
   title: ...
   description: ...
   hide_table_of_contents: true
   wrapperClassName: marketing-page
   ---
   ```
3. Compose Bootstrap-styled sections (`<section className="full-page-section ...">`). Use existing index.mdx / ome.mdx as the template.

## 10. The session's last todo list (verbatim)

```
1. [completed]  Scaffold Docusaurus 3.x with TypeScript
2. [completed]  Move existing assets/ and images/ into static/
3. [completed]  Wire existing CSS into Docusaurus
4. [completed]  Run npm install + first build
5. [completed]  Swizzle Navbar + Footer
6. [completed]  Convert index.html → src/pages/index.mdx
7. [completed]  Convert ome.html → src/pages/ome.mdx
8. [completed]  Blog plugin config + welcome post placeholder
9. [completed]  Docs plugin config + intro page placeholder
10. [completed] GitHub Actions deploy workflow
11. [pending]   Port remaining 7 marketing pages
12. [pending]   Port legacy main.js behaviors          ← actually done via clientModule; verify on Mac
13. [pending]   Add GTM + Cookiebot integration
14. [pending]   Migrate Medium posts → MDX
15. [pending]   Migrate OSS docs (GitBook → Docusaurus)
16. [pending]   Export Enterprise GitBook and migrate
17. [pending]   API docs tooling (OpenAPI)
18. [pending]   301 redirect map
19. [pending]   Preview, merge to main, domain cutover
```

Item 12 is effectively done in code (`src/clientModules/legacy-marketing.ts`) but was never marked complete because the session ended before final dev-server verification.

## 11. First steps on the Mac

1. `npm install && npm start`. Verify `http://localhost:3000` renders the homepage matching production, and `/docs` renders the intro page with the admonition.
2. If anything looks off vs production, compare with `https://ovenmedialabs.com/` and patch CSS/MDX accordingly. The remote session's last visual-parity pass was at viewport 1440 and 1600.
3. Pick the next page from item 11's queue (suggest `ome-enterprise.html` — it's the Enterprise pitch page, biggest pageview value).
4. Continue.

Good luck.
