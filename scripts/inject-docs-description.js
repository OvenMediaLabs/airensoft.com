#!/usr/bin/env node
/**
 * Post-build pass that backfills the meta description on docs pages.
 *
 * The docs tree is a flat snapshot imported from the upstream product
 * repos (`scripts/sync-docs.sh` does a `git read-tree`). Almost no
 * upstream source file carries an authored `description:` frontmatter;
 * for pages that have body text Docusaurus auto-derives one from the
 * first content (often weak — e.g. a section heading like "How to
 * write code" — but non-empty, so out of this pass's scope). The
 * pages that ship with NO `<meta name="description">` at all are the
 * section/category landing pages — a bare `<h1>` plus a grid of child
 * links, with no first text for Docusaurus to excerpt. Search
 * snippets and AI answer extraction then fall back to arbitrary
 * chrome text on exactly the pages that frame a whole section. (The
 * GitBook-migration redirect stubs under legacy version paths also
 * lack a description, but they carry an http-equiv refresh + canonical
 * and must NOT be touched — this pass skips them.)
 *
 * This pass only fills the genuinely-empty case. Replacing the weak
 * auto-excerpts with authored copy is a separate, larger upstream
 * effort (frontmatter `description:` in the product repos).
 *
 * Editing the synced source files is not viable (the next sync wipes
 * them) and a remark plugin can't help either: Docusaurus parses
 * frontmatter (and computes the page metadata) before remark runs. So
 * we do what the existing search-label pass does — mutate the built
 * HTML after `docusaurus build` fully exits. For every real docs page
 * that has no description we synthesize one (first body paragraph if
 * present, else the section title + its child-page labels) and inject
 * `description`, `og:description`, and `twitter:description`.
 *
 * Idempotent: a page that already has a `name="description"` meta tag
 * (from frontmatter, or from a previous run) is left untouched.
 *
 * Wired in as part of the npm `postbuild` lifecycle script
 * (package.json), after `label-search-results.js`. Also runnable
 * standalone:
 *
 *     node scripts/inject-docs-description.js
 */

const fs = require('fs');
const path = require('path');

const MAX_LEN = 155; // target meta description length (chars)
const MIN_LEN = 30; // below this the extract is too thin to be useful

/** Recursively collect every *.html under dir. */
function htmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Decode the handful of HTML entities that survive into rendered text. */
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…');
}

/** Escape a string for safe use inside an HTML double-quoted attribute. */
function escapeAttr(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Collapse to a single line and clamp to MAX_LEN on a word boundary. */
function truncate(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= MAX_LEN) return t;
  const cut = t.slice(0, MAX_LEN);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

/**
 * Synthesize a meta description for a rendered docs page.
 *
 *  1. First real body paragraph (the normal content-page case — kept
 *     so any future prose page that lacks a frontmatter description
 *     still gets one).
 *  2. Section landing pages have no paragraph: build the description
 *     from the page's <h1> and the labels of its child-page cards,
 *     e.g. "Streaming — OvenMediaEngine guide covering WebRTC
 *     Streaming, Low-Latency HLS, SRT".
 *  3. Fall back to "<h1> — <product> documentation".
 *
 * Returns null when there is nothing usable (caller then leaves the
 * page untouched).
 */
function extractDescription(html, productLabel) {
  // Scope to the rendered markdown body so we skip nav / sidebar /
  // breadcrumb chrome. Fall back to <main> if the class name changes.
  let scope = html;
  const mdIdx = html.indexOf('theme-doc-markdown');
  if (mdIdx !== -1) scope = html.slice(mdIdx);
  else {
    const mainIdx = html.indexOf('<main');
    if (mainIdx !== -1) scope = html.slice(mainIdx);
  }

  // 1. First meaningful paragraph.
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRe.exec(scope)) !== null) {
    const text = decodeEntities(
      m[1].replace(/<[^>]+>/g, ' '), // strip inline tags (a, code, strong…)
    ).trim();
    if (text.replace(/\s+/g, ' ').trim().length >= MIN_LEN) {
      return truncate(text);
    }
  }

  // 2 & 3. Section landing page: <h1> + child-card labels.
  const h1m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(scope);
  if (!h1m) return null;
  const title = decodeEntities(h1m[1].replace(/<[^>]+>/g, '')).trim();
  if (!title) return null;

  const labels = [];
  const labelRe = /childCardLabel_[^>]*>([^<]+)</g;
  let lm;
  while ((lm = labelRe.exec(scope)) !== null) {
    labels.push(decodeEntities(lm[1]).trim());
  }

  if (labels.length > 0) {
    return truncate(
      `${title} — ${productLabel} guide covering ${labels.join(', ')}.`,
    );
  }
  return truncate(`${title} — ${productLabel} documentation.`);
}

/** Map a built docs HTML path to its product label. */
function productLabelFor(filepath) {
  const p = filepath.replace(/\\/g, '/');
  if (p.includes('/docs/ome-enterprise/')) return 'OvenMediaEngine Enterprise';
  if (p.includes('/docs/ovenplayer/')) return 'OvenPlayer';
  if (p.includes('/docs/ome/')) return 'OvenMediaEngine';
  return 'OvenMedia Labs';
}

function processFile(filepath) {
  const html = fs.readFileSync(filepath, 'utf8');

  // Never touch the GitBook-migration redirect stubs: they bounce to
  // the canonical page and must not be turned into indexable content.
  if (/http-equiv=["']?refresh/i.test(html)) return false;

  // Idempotent / respect existing: skip if a description meta already
  // exists (frontmatter-provided, or a prior run of this script).
  if (/<meta[^>]+name=["']?description["']?/i.test(html)) return false;

  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) return false;

  const desc = extractDescription(html, productLabelFor(filepath));
  if (!desc) return false;

  const v = escapeAttr(desc);
  const tags =
    `<meta name="description" content="${v}"/>` +
    `<meta property="og:description" content="${v}"/>` +
    `<meta name="twitter:description" content="${v}"/>`;

  const out = html.slice(0, headEnd) + tags + html.slice(headEnd);
  fs.writeFileSync(filepath, out);
  return true;
}

function injectDocsDescriptions(buildDir) {
  const docsDir = path.join(buildDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    throw new Error(
      `inject-docs-description: build/docs not found at ${docsDir}`,
    );
  }
  const files = htmlFiles(docsDir);
  let injected = 0;
  for (const f of files) if (processFile(f)) injected++;
  console.log(
    `inject-docs-description: added description to ${injected}/${files.length} docs page(s)`,
  );
  return injected;
}

module.exports = {
  injectDocsDescriptions,
  extractDescription,
  productLabelFor,
  processFile,
};

if (require.main === module) {
  try {
    injectDocsDescriptions(path.resolve(__dirname, '..', 'build'));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
