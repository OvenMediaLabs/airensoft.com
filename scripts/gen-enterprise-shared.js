#!/usr/bin/env node
'use strict';
/**
 * Regenerate OvenMediaEngine Enterprise shared pages from the OSS manual.
 *
 * Single source of truth: `docs/ome/` (the open-source manual, plain
 * markdown, authored upstream and synced here unchanged). An Enterprise
 * page that should mirror an OSS page carries a `dup:` key in its YAML
 * frontmatter, e.g.:
 *
 *     ---
 *     title: RTMP
 *     sidebar_position: 81
 *     dup: /docs/ome/live-source/rtmp.md
 *     ---
 *
 * Run by `scripts/sync-docs.sh` after both upstreams are synced, this
 * replaces such a page's BODY with the OSS source's body, keeping the
 * Enterprise frontmatter. Links/images in the copied body are OSS-
 * relative, so they are rewritten:
 *
 *   - link to another OSS page that is itself `dup:`'d  -> the Enterprise
 *     twin (path recomputed for the new location). File renames
 *     (webrtc.md -> webrtc-whip.md) are absorbed for free because the map
 *     is the union of every `dup:` header.
 *   - link to an intentionally OSS-only page -> handled per
 *     scripts/oss-only-redirects.txt (a chosen Enterprise page, or the
 *     OSS section of the site).
 *   - link to an OSS page that is neither -> FAIL-CLOSED: abort with the
 *     offending file+link so sync-docs.sh (set -e) stops before anything
 *     is committed/deployed. Fail-closed is all-or-nothing: on any
 *     unresolved link NOTHING is written.
 *   - images stay single-sourced: the link is rewritten to a relative
 *     path into `docs/ome/`'s image (same repo, same build) -- no copy.
 *
 * Safety: if NO Enterprise page has a `dup:` header this is a complete
 * no-op (exit 0), so it is safe to land before the upstream stub
 * conversion happens.
 *
 * Usage:
 *   node scripts/gen-enterprise-shared.js            # write changes
 *   node scripts/gen-enterprise-shared.js --check    # report only
 *
 * Exit codes: 0 = ok (or nothing to do); 1 = fail-closed / map error.
 */
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const OME = 'docs/ome';
const ENT = 'docs/ome-enterprise';
const REDIRECTS_FILE = path.join('scripts', 'oss-only-redirects.txt');

const IMG_EXTS = new Set(
  ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.bmp']);
const SCHEME_RE = /^[a-z][a-z0-9+.\-]*:/i;
const FM_RE = /^---\n([\s\S]*?)\n---\n/;
const DUP_RE = /^dup:\s*(\S+)\s*$/m;
const SLUG_RE = /^slug:\s*(\S+)\s*$/m;
// Markdown inline link/image: ![alt](url "title") or [text](url)
const MD_LINK_RE = /(!?)\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+)((?:\s+"[^"]*")?)\s*\)/g;
// Reference definition: [label]: url "title"
const MD_REF_RE = /^(\s*\[[^\]]+\]:\s*)(<[^>]+>|\S+)/gm;
// Raw HTML attributes (GitBook tables embed <a href> / <img src>)
const HTML_ATTR_RE = /\b(href|src)\s*=\s*("[^"]*"|'[^']*')/g;

const read = (p) => fs.readFileSync(path.join(REPO, p), 'utf8');

function splitFrontmatter(text) {
  const m = FM_RE.exec(text);
  if (!m) return [null, text];
  return [m[1], text.slice(m[0].length)];
}

function mdFiles(rootRel) {
  const out = [];
  const walk = (absDir) => {
    for (const e of fs.readdirSync(absDir, { withFileTypes: true })) {
      const abs = path.join(absDir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (e.isFile() && e.name.endsWith('.md'))
        out.push(path.relative(REPO, abs).split(path.sep).join('/'));
    }
  };
  const start = path.join(REPO, rootRel);
  if (fs.existsSync(start)) walk(start);
  return out.sort();
}

function resolveDup(raw) {
  let v = raw.trim().replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '');
  if (!v.startsWith(OME + '/')) return null;
  const cands = [];
  if (v.endsWith('.md')) cands.push(v);
  else {
    cands.push(v.replace(/\/+$/, '') + '/README.md');
    cands.push(v.replace(/\/+$/, '') + '.md');
  }
  for (const c of cands)
    if (fs.existsSync(path.join(REPO, c))) return c;
  return cands[0]; // report as dangling later
}

function loadRedirects() {
  const out = {};
  if (!fs.existsSync(path.join(REPO, REDIRECTS_FILE))) return out;
  for (let ln of read(REDIRECTS_FILE).split('\n')) {
    ln = ln.split('#')[0].trim();
    if (!ln) continue;
    if (!ln.includes('=>')) {
      console.error(`bad redirect line (missing '=>'): ${ln}`);
      process.exit(1);
    }
    const i = ln.indexOf('=>');
    const src = ln.slice(0, i).trim().replace(/^\/+/, '');
    const dst = ln.slice(i + 2).trim();
    out[src] = dst === '@oss-site' ? dst : dst.replace(/^\/+/, '');
  }
  return out;
}

function ossRoute(ossPath) {
  const [fm] = splitFrontmatter(read(ossPath));
  if (fm) {
    const m = SLUG_RE.exec(fm);
    if (m) {
      const s = m[1];
      return '/docs/ome' + (s === '/' ? '' : '/' + s.replace(/^\/+|\/+$/g, ''));
    }
  }
  let rel = ossPath.slice(OME.length + 1)
    .replace(/(^|\/)README\.md$/, '')
    .replace(/\.md$/, '');
  return '/docs/ome' + (rel ? '/' + rel : '');
}

function buildIndex() {
  const entToOss = {};
  const ossToEnt = {};
  const errors = [];
  for (const rel of mdFiles(ENT)) {
    const [fm] = splitFrontmatter(read(rel));
    if (!fm) continue;
    const m = DUP_RE.exec(fm);
    if (!m) continue;
    const oss = resolveDup(m[1]);
    if (oss === null) {
      errors.push(`${rel}: dup: '${m[1]}' is not under /${OME}/`);
      continue;
    }
    if (!fs.existsSync(path.join(REPO, oss))) {
      errors.push(`${rel}: dup: target does not exist: /${oss}`);
      continue;
    }
    if (oss in ossToEnt) {
      errors.push(`collision: /${oss} is dup:'d by both /${ossToEnt[oss]} and /${rel}`);
      continue;
    }
    entToOss[rel] = oss;
    ossToEnt[oss] = rel;
  }
  return { entToOss, ossToEnt, errors };
}

function rewriteUrl(url, ossSrc, entDst, ossToEnt, redirects, unresolved) {
  const bare = url.startsWith('<') && url.endsWith('>') ? url.slice(1, -1) : url;
  const h = bare.indexOf('#');
  const p = h === -1 ? bare : bare.slice(0, h);
  const frag = h === -1 ? '' : bare.slice(h);
  if (!p || SCHEME_RE.test(p) || p.startsWith('/')) return url;
  const absPosix = path.posix
    .normalize(path.posix.join(path.posix.dirname(ossSrc), p));
  if (!absPosix.startsWith(OME + '/')) return url; // escapes OSS tree
  const ext = path.posix.extname(absPosix).toLowerCase();
  const entDir = path.posix.dirname(entDst);
  const relTo = (target) => {
    const r = path.posix.relative(entDir, target);
    return r.startsWith('.') ? r : './' + r;
  };
  if (ext === '.md') {
    if (absPosix in ossToEnt) return relTo(ossToEnt[absPosix]) + frag;
    if (absPosix in redirects) {
      const dest = redirects[absPosix];
      if (dest === '@oss-site') return ossRoute(absPosix) + frag;
      return relTo(dest) + frag;
    }
    unresolved.push(
      `  ${entDst}\n      link ${bare}  ->  /${absPosix}  (no dup: twin, not in redirects)`);
    return url;
  }
  if (IMG_EXTS.has(ext)) {
    // single-sourced image: reference the OSS file in-place (same repo
    // / same build). No copy -> no duplicated binaries in git.
    return relTo(absPosix) + frag;
  }
  return url; // other relative asset: leave untouched
}

function rewriteBody(body, ossSrc, entDst, ossToEnt, redirects, unresolved) {
  body = body.replace(MD_LINK_RE, (_, bang, text, target, title) =>
    `${bang}[${text}](${rewriteUrl(target, ossSrc, entDst, ossToEnt, redirects, unresolved)}${title})`);
  body = body.replace(MD_REF_RE, (_, pre, target) =>
    pre + rewriteUrl(target, ossSrc, entDst, ossToEnt, redirects, unresolved));
  body = body.replace(HTML_ATTR_RE, (_, attr, quoted) => {
    const q = quoted[0];
    return `${attr}=${q}${rewriteUrl(quoted.slice(1, -1), ossSrc, entDst, ossToEnt, redirects, unresolved)}${q}`;
  });
  return body;
}

function main(argv) {
  const checkOnly = argv.includes('--check');
  const { entToOss, ossToEnt, errors } = buildIndex();

  if (Object.keys(entToOss).length === 0 && errors.length === 0) {
    console.log('gen-enterprise-shared: no dup: pages found — nothing to do.');
    return 0;
  }
  if (errors.length) {
    console.error('gen-enterprise-shared: MAP ERRORS (fail-closed):');
    for (const e of errors) console.error('  ' + e);
    return 1;
  }

  const redirects = loadRedirects();
  const unresolved = [];
  const plan = [];
  for (const entRel of Object.keys(entToOss).sort()) {
    const ossRel = entToOss[entRel];
    const [entFm] = splitFrontmatter(read(entRel));
    const [, ossBody] = splitFrontmatter(read(ossRel));
    const newBody = rewriteBody(
      ossBody.replace(/^\n+/, ''), ossRel, entRel, ossToEnt, redirects, unresolved);
    const banner =
      '{/* AUTO-GENERATED from /' + ossRel + ' by ' +
      'scripts/gen-enterprise-shared.js — edit the OSS source, not this file. */}';
    plan.push([
      path.join(REPO, entRel),
      `---\n${entFm}\n---\n\n${banner}\n\n${newBody.replace(/\s+$/, '')}\n`,
    ]);
  }

  // Fail-closed is all-or-nothing: if ANY page has an unresolved OSS-only
  // link, write NOTHING and abort, so a half-rewritten tree is never
  // committed/deployed.
  if (unresolved.length) {
    console.error(
      'gen-enterprise-shared: UNRESOLVED OSS-only links (fail-closed).\n' +
      `Add a /${REDIRECTS_FILE.split(path.sep).join('/')} entry, ` +
      'or make the target a dup: page:\n');
    for (const u of unresolved) console.error(u);
    return 1;
  }

  let changed = 0;
  for (const [absPath, out] of plan) {
    if (fs.readFileSync(absPath, 'utf8') !== out) {
      changed += 1;
      if (!checkOnly) fs.writeFileSync(absPath, out);
    }
  }
  const verb = checkOnly ? 'would regenerate' : 'regenerated';
  console.log(`gen-enterprise-shared: ${verb} ${changed}/${Object.keys(entToOss).length} dup: page(s).`);
  return 0;
}

process.exit(main(process.argv.slice(2)));
