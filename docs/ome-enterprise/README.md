# `docs-enterprise/` — OvenMediaEngine Enterprise docs source

This folder holds the **MDX source** for the OvenMediaEngine Enterprise user
guide published at <https://ovenmedialabs.com/docs/ome-enterprise/>.

## Shared pages: single-sourced from the open-source manual (`dup:`)

Many pages here are identical in substance to the open-source
OvenMediaEngine manual. **Do not hand-copy them.** Such a page is a tiny
stub whose frontmatter carries a `dup:` key pointing at the OSS source;
its body is generated from that source when the site is published.

```yaml
---
title: RTMP
sidebar_position: 81
dup: /docs/ome/live-source/rtmp
---
```

- The page has **no body** — anything you write is overwritten by the
  OSS body at publish time.
- Links and images in the copied body are rewritten automatically for
  the Enterprise tree (file renames are handled too).
- To change a shared page's content, **edit the OSS manual**, not the
  stub here.
- An **Enterprise-only** page (no OSS counterpart) is authored normally,
  with no `dup:`. To flag it as Enterprise-exclusive in the sidebar, add
  `enterprise_only: true` — see [Frontmatter](#frontmatter) below.

### OSS-only links

If a shared OSS page links to something that intentionally has **no
Enterprise page** (e.g. open-source build steps), add a line to
[`oss-only-redirects.txt`](./oss-only-redirects.txt) so the link is
pointed at the right Enterprise page (or the OSS site) instead.

### A broken `dup:` is caught before merge

If a `dup:` page links an OSS page that is neither `dup:`'d here nor
listed in `oss-only-redirects.txt`, the **Check docs build** PR check
fails with the exact file and link. Fix the mapping or add a redirect —
nothing broken ships.

## Editing

Each page is a markdown / MDX file under this directory; the folder
tree maps to the URL structure of the published docs.

### Frontmatter

Every page should have YAML frontmatter at the top:

```yaml
---
title: Stream Recording
sidebar_position: 4
description: Configure on-the-fly recording of WebRTC streams.
---
```

- `title` — page title shown in browser tab and as H1
- `sidebar_position` — order within the section (smaller = higher)
- `description` — SEO meta description; appears in search snippets
- `slug` (optional) — override URL path; useful for `about/intro.md` (`slug: /`)
- `enterprise_only` (optional) — set to `true` on a page that documents
  an Enterprise-exclusive feature. The docs site then shows a small
  "Enterprise only" marker next to that page in the sidebar (hover for
  the wording). It is an explicit per-page opt-in, like `dup:` — **not**
  inferred from the absence of `dup:`. A `dup:` page is shared with the
  open-source manual, so it must never set `enterprise_only`.

### Admonitions

```mdx
:::note
General note.
:::

:::tip
Helpful tip.
:::

:::info
Neutral info.
:::

:::warning
Warning.
:::

:::danger
Critical warning.
:::
```

Optionally with a title: `:::info[Custom title]`

### Tabs

```mdx
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="ubuntu" label="Ubuntu 22" default>

  Ubuntu-specific instructions here.

  </TabItem>
  <TabItem value="fedora" label="Fedora 38">

  Fedora-specific instructions here.

  </TabItem>
</Tabs>
```

The two `import` lines are required once per file that uses tabs.

### Code blocks

Standard fenced code with optional language, title, and highlights:

````mdx
```bash title="Install OME Enterprise"
sudo apt install ovenmediaengine-enterprise
```
````

````mdx
```xml title="Server.xml" {3,7-9}
<Server>
  <Name>OME</Name>
  <IP>*</IP>           {/* highlighted */}
  <Bind>...</Bind>
</Server>
```
````

### Images

Put images in `docs-enterprise/images/` and reference them with a relative path:

```mdx
![Architecture diagram](../images/architecture.png)
```

**Filename rule**: no spaces, no parens. Use `kebab-case` or
`snake_case`. (Spaces and `()` need URL-encoding, which is a footgun.)

### Characters that need escaping

MDX parses `<`, `{`, `}` as JSX. In plain text:

- `<` → `&lt;` (or wrap in backticks: `` `<992` ``)
- `{` → `&#123;`
- `}` → `&#125;`

Inside fenced code blocks (` ``` `) or inline code (`` ` ``), escape
nothing — those are raw.

### Sidebar order

Page order within a section follows `sidebar_position:` in frontmatter.
For directory labels and order, add a `_category_.json` to the folder:

```json
{
  "label": "Security",
  "position": 5,
  "link": { "type": "doc", "id": "README" }
}
```

For top-level **section dividers** — the all-caps decorative headers
(ABOUT, FEATURES, REFERENCES, …) that appear above a group of
categories without being collapsible themselves — add
`customProps.sidebarHeader: true` to the folder's `_category_.json`:

```json
{
  "label": "FEATURES",
  "position": 5,
  "customProps": {
    "sidebarHeader": true
  }
}
```

A folder with this flag is rendered as a visual section header and its
children are promoted to the same sidebar level (not nested inside a
collapsible category). Do **not** add a `link:` field to section-header
entries — they are not clickable.

## Local preview

Run `./docs-enterprise/preview.sh` from the repo root.

The script clones the [ovenmedialabs.com](https://github.com/OvenMediaLabs/ovenmedialabs.com)
repo into a per-product cache, copies your `docs-enterprise/` into it
(and watches it so your edits hot-reload), and starts a dev server.
When it's ready you'll see:

    [SUCCESS] Docusaurus website is running at: http://localhost:3000/

Open that URL in a browser — the page reloads automatically as you
save edits in `docs-enterprise/`.

Stop the preview with **Ctrl-C** in the terminal.

> **What about broken links?** A broken markdown link (e.g. a typo'd
> `.md` path or a missing image) shows up in the preview terminal
> immediately and stops the page from compiling — you'll know right
> away. A broken anchor (`#missing-section`) is only flagged by the
> full production build, so click your anchor links once before
> merging.

Requirements: bash, git, Node 20+, npm. macOS/Linux. First run ~5
minutes (clone + npm install); subsequent runs ~10 seconds.

Env var overrides:

- `OML_PREVIEW_PORT` (default `3000`)
- `OML_PREVIEW_HOST` (default `localhost`; set `0.0.0.0` to open the preview from another machine)
- `OML_PREVIEW_CACHE` (cache root path)
