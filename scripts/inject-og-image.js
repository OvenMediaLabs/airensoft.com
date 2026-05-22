#!/usr/bin/env node
/**
 * Post-build pass that sets section-specific OG images on docs pages.
 *
 * Docusaurus resolves og:image from page frontmatter `image:` first,
 * then falls back to themeConfig.image (og_oml.png). The synced docs
 * trees carry no `image:` frontmatter (editing them is not viable —
 * the next sync wipes the changes). This pass replaces the default
 * og:image/twitter:image in built HTML with the product-specific image
 * for each docs section.
 *
 * Run order: added to the npm `postbuild` chain, so it executes after
 * `docusaurus build` and the other post-processing scripts complete.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');

// Order matters: more-specific prefixes must come before shorter ones
// so docs/ome-enterprise is matched before docs/ome.
const SECTION_IMAGES = [
  {prefix: 'docs/ome-enterprise', image: 'og_ome-enterprise.png'},
  {prefix: 'docs/ome', image: 'og_ome.png'},
  {prefix: 'docs/ovenplayer', image: 'og_op.png'},
];

function htmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let totalUpdated = 0;

for (const {prefix, image} of SECTION_IMAGES) {
  const sectionDir = path.join(BUILD_DIR, prefix);
  if (!fs.existsSync(sectionDir)) continue;

  let sectionUpdated = 0;
  for (const file of htmlFiles(sectionDir)) {
    const html = fs.readFileSync(file, 'utf8');
    // Replace the path portion of the OG image URL, leaving the origin intact.
    // Matches both og:image and twitter:image since Docusaurus emits both from
    // the same source value.
    const out = html.replace(
      /\/images\/og\/og_oml\.png/g,
      `/images/og/${image}`,
    );
    if (out !== html) {
      fs.writeFileSync(file, out);
      sectionUpdated++;
    }
  }
  console.log(`inject-og-image: ${prefix} → ${image} (${sectionUpdated} page(s) updated)`);
  totalUpdated += sectionUpdated;
}

console.log(`inject-og-image: ${totalUpdated} page(s) updated total`);
