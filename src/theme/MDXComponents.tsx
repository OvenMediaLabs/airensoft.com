import OriginalMDXComponents from '@theme-original/MDXComponents';
import MarkdownTable from '@site/src/components/MarkdownTable';

// Wrap markdown <table> elements in a scrollable <div> so they remain
// usable on narrow viewports. iOS Safari needs the wrapper specifically
// — see src/components/MarkdownTable for the full rationale.
export default {
  ...OriginalMDXComponents,
  table: MarkdownTable,
};
