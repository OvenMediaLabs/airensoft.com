#!/usr/bin/env node
/**
 * Post-build pass that labels every search index document with its
 * source product. The local-search plugin (`@easyops-cn/docusaurus-search-local`)
 * exposes no per-result source hint by default — OME, Enterprise,
 * OvenPlayer, and blog results all blend into one list with no way to
 * tell them apart. We prepend the product name to each document's
 * breadcrumb (`b` field) so the search UI's existing hitPath / result
 * row renders "OvenMediaEngine Enterprise › … › title" instead of just
 * "… › title". Cheaper than swizzling the SuggestionTemplate.
 *
 * Idempotent: skips docs already prefixed.
 *
 * Wired in as the npm `postbuild` lifecycle script (package.json), so
 * `npm run build` runs it automatically after `docusaurus build` fully
 * exits. It can't be a Docusaurus plugin `postBuild` hook: the search
 * index (`@easyops-cn/docusaurus-search-local`) isn't written to the
 * build dir until after plugin postBuild runs, and Docusaurus gives no
 * "after all plugins" ordering guarantee. Also runnable standalone:
 *
 *     node scripts/label-search-results.js
 */

const fs = require('fs');
const path = require('path');

// Order matters — longest/most specific URL prefix first so
// `/docs/ome-enterprise/` doesn't get matched by `/docs/ome/`.
const SOURCES = [
  {prefix: '/docs/ome-enterprise', label: 'OvenMediaEngine Enterprise'},
  {prefix: '/docs/ovenplayer', label: 'OvenPlayer'},
  {prefix: '/docs/ome', label: 'OvenMediaEngine'},
  {prefix: '/blog', label: 'Blog'},
];

function labelFor(url) {
  for (const {prefix, label} of SOURCES) {
    if (url === prefix || url.startsWith(prefix + '/')) return label;
  }
  return null;
}

function processFile(filepath) {
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  if (!Array.isArray(data)) return 0;
  let modified = 0;
  for (const entry of data) {
    if (!entry || !Array.isArray(entry.documents)) continue;
    for (const doc of entry.documents) {
      if (typeof doc.u !== 'string') continue;
      const label = labelFor(doc.u);
      if (!label) continue;
      doc.b = Array.isArray(doc.b) ? doc.b : [];
      if (doc.b[0] === label) continue;        // already labeled — idempotent
      doc.b = [label, ...doc.b];
      modified++;
    }
  }
  if (modified > 0) fs.writeFileSync(filepath, JSON.stringify(data));
  return modified;
}

function labelSearchResults(buildDir) {
  if (!fs.existsSync(buildDir)) {
    throw new Error(
      `label-search-results: build dir not found at ${buildDir}`,
    );
  }
  let total = 0;
  for (const f of fs.readdirSync(buildDir)) {
    if (!f.startsWith('search-index') || !f.endsWith('.json')) continue;
    const filepath = path.join(buildDir, f);
    const n = processFile(filepath);
    total += n;
    console.log(`  ${f}: labeled ${n} document(s)`);
  }
  console.log(`label-search-results: labeled ${total} documents total`);
  return total;
}

module.exports = {labelSearchResults};

if (require.main === module) {
  try {
    labelSearchResults(path.resolve(__dirname, '..', 'build'));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
