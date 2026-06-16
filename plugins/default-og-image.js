// Remark plugin: injects a default `image` into frontmatter for an entire
// docs plugin instance, so section-level OG images can be set in
// docusaurus.config.ts without touching individual .md files.
//
// Usage (in docusaurus.config.ts):
//   remarkPlugins: [[defaultOgImage, { image: 'images/og/og_ome.png' }]]

/** @param {{ image: string }} options */
function defaultOgImagePlugin({ image } = {}) {
  if (!image) throw new Error('default-og-image plugin requires an `image` option');

  return (tree, file) => {
    const fm = file?.data?.frontMatter;
    if (fm && !fm.image) {
      fm.image = image;
    }
  };
}

module.exports = defaultOgImagePlugin;
