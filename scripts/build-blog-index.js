#!/usr/bin/env node
/**
 * Generate `src/data/blog-index.json` by scanning all blog/<slug>/index.mdx
 * frontmatter. This index powers two build-time surfaces:
 *
 *   - the "From the Labs" section on marketing pages
 *     (src/components/LatestBlogPosts.tsx — 3 most recent posts), and
 *   - the "You might also like" related-posts widget at the bottom of
 *     every blog post (src/theme/BlogPostItem/PostFooterExtras.tsx).
 *
 * Both import the JSON statically, so it must exist (and be fresh)
 * before webpack compiles. That freshness is guaranteed automatically
 * by the local Docusaurus plugin `plugins/oml-build-hooks.js`, which
 * calls buildBlogIndex() from its `loadContent` hook on every
 * `docusaurus build` AND `docusaurus start`. You normally never need
 * to run this by hand — but it stays runnable standalone:
 *
 *     node scripts/build-blog-index.js
 *
 * We collect a minimal set of fields:
 *   - slug (or auto-derived from directory name)
 *   - permalink (`/blog/<slug>`)
 *   - title
 *   - description
 *   - tags
 *   - date (YYYY-MM-DD from directory prefix; preferred over frontmatter
 *     because the frontmatter date includes a time component that's noisy)
 *   - dir (the source directory name)
 *
 * Ported 1:1 from the previous scripts/build-blog-index.py — the JSON
 * output is intentionally byte-identical so the committed
 * src/data/blog-index.json never shows a spurious diff.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(REPO, 'blog');
const OUT = path.join(REPO, 'src', 'data', 'blog-index.json');

const DIR_DATE_RE = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

/**
 * Very small YAML-like parser. The migration script writes flat
 * frontmatter (no nested maps), so we don't need a full YAML lib here.
 * Supports: scalars, quoted strings, simple inline lists `[a, b, c]`.
 */
function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return {};
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return {};
  const block = text.slice(4, end);

  const out = {};
  for (const raw of block.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    if (!value) {
      out[key] = '';
      continue;
    }
    // Strip surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Inline list `[a, b]`.
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1);
      out[key] = inner
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter((item) => item.length > 0);
      continue;
    }
    out[key] = value;
  }
  return out;
}

function buildBlogIndex() {
  const posts = [];

  const entries = fs.readdirSync(BLOG_DIR).sort();
  for (const name of entries) {
    // Mirror Docusaurus's blog `exclude` (GlobExcludeDefault +
    // config): anything under a `_`-prefixed dir (e.g. `_template/`)
    // is NOT a published post, so it has no `/blog/<slug>` route.
    // Indexing it would surface a fake card and trip
    // `onBrokenLinks: 'throw'`. Also skip dotfiles defensively.
    if (name.startsWith('_') || name.startsWith('.')) continue;

    const postDir = path.join(BLOG_DIR, name);
    if (!fs.statSync(postDir).isDirectory()) continue;
    const mdx = path.join(postDir, 'index.mdx');
    if (!fs.existsSync(mdx)) continue;

    const fm = parseFrontmatter(fs.readFileSync(mdx, 'utf8'));

    // Derive date + dir slug from directory name.
    const m = DIR_DATE_RE.exec(name);
    let date;
    let dirSlug;
    if (m) {
      date = m[1];
      dirSlug = m[2];
    } else {
      date = String(fm.date || '').slice(0, 10);
      dirSlug = name;
    }

    const slug = fm.slug || dirSlug;
    const title = fm.title || '';
    const description = fm.description || '';
    const tags = 'tags' in fm ? fm.tags : [];
    // Strip leading `./` so the path is just the filename (e.g. "hero.png")
    const image = (fm.image || '').replace(/^\.\//, '');

    posts.push({
      slug,
      permalink: `/blog/${slug}`,
      title,
      description,
      tags: Array.isArray(tags) ? tags : [tags],
      date,
      dir: name,
      image,
    });
  }

  // Newest first. JS Array.prototype.sort is stable, so same-date posts
  // keep ascending directory-name order — matching Python's stable
  // list.sort(reverse=True).
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  fs.mkdirSync(path.dirname(OUT), {recursive: true});
  fs.writeFileSync(OUT, JSON.stringify(posts, null, 2) + '\n', 'utf8');

  return posts.length;
}

module.exports = {buildBlogIndex};

if (require.main === module) {
  const count = buildBlogIndex();
  console.log(
    `Wrote ${path.relative(REPO, OUT)} with ${count} entries.`,
  );
}
