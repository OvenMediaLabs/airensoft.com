'use strict';

/**
 * Local Docusaurus plugin that regenerates src/data/blog-index.json
 * from blog/ frontmatter as part of the normal build lifecycle, so the
 * npm `build` script can stay a plain `docusaurus build` instead of a
 * hand-chained `node scripts/build-blog-index.js && docusaurus build`.
 *
 *   loadContent() — runs in the content-loading phase, BEFORE webpack
 *     resolves the static `@site/src/data/blog-index.json` imports in
 *     LatestBlogPosts.tsx ("From the Labs", 3 most recent) and
 *     PostFooterExtras.tsx (related posts). Docusaurus also runs
 *     loadContent on `start`, so local dev reflects the latest posts
 *     too (after a dev-server restart) with no extra wiring.
 *
 * Why search-index labeling is NOT done here: the search index is
 * produced by `@easyops-cn/docusaurus-search-local`, and empirically
 * its `search-index*.json` is not yet present in `outDir` when other
 * plugins' `postBuild` hooks run (Docusaurus gives no ordering /
 * "after all plugins" guarantee). So labeling stays a separate step
 * that runs after `docusaurus build` fully exits — wired as the npm
 * `postbuild` lifecycle script (see package.json), which `npm run
 * build` (and therefore CI) triggers automatically.
 *
 * The blog-index logic itself lives in scripts/build-blog-index.js,
 * still runnable standalone for one-off debugging. This plugin is just
 * the wiring.
 */

const {buildBlogIndex} = require('../scripts/build-blog-index');

module.exports = function omlBuildHooks() {
  return {
    name: 'oml-build-hooks',

    async loadContent() {
      const count = buildBlogIndex();
      console.log(
        `[oml-build-hooks] blog-index.json regenerated (${count} posts)`,
      );
    },
  };
};
