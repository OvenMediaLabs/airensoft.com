'use strict';

/**
 * Expand `dup:` Enterprise stubs from the OSS manual as part of the
 * Docusaurus lifecycle.
 *
 * The logic lives in scripts/gen-enterprise-shared.js (still runnable
 * standalone for debugging). This wires it to run at plugin
 * MODULE-LOAD time, which Docusaurus performs before any plugin's
 * loadContent — including @docusaurus/plugin-content-docs — and
 * identically for `docusaurus build` and `docusaurus start`. So shared
 * pages are filled from OSS for the published build, the enterprise
 * repo's docs-build PR check, AND local preview (`npm start` /
 * preview.sh) — with no npm `prebuild` step needed.
 *
 * Fail-closed: a non-zero result (unresolved OSS-only link, dangling
 * or colliding `dup:`) throws here, aborting build/start with the
 * located error rather than shipping or previewing a broken page.
 */
const {main} = require('../scripts/gen-enterprise-shared.js');

if (process.env.GEN_ENT_SKIP !== '1' && main([]) !== 0) {
  throw new Error(
    'gen-enterprise-shared: fail-closed (see the error logged above). ' +
    'Fix the dup: mapping or add a docs-enterprise/oss-only-redirects.txt entry.',
  );
}

module.exports = function genEnterpriseSharedPlugin() {
  return {name: 'gen-enterprise-shared'};
};
