import React from 'react';
import OriginalMDXComponents from '@theme-original/MDXComponents';
import MarkdownTable from '@site/src/components/MarkdownTable';

// Wrap markdown <table> elements in a scrollable <div> so they remain
// usable on narrow viewports. iOS Safari needs the wrapper specifically
// — see src/components/MarkdownTable for the full rationale.

// Wrap markdown images that have alt text in <figure>/<figcaption> so
// ![Caption text](./image.png) renders with a visible caption below.
// Images with no alt text (![](./image.png)) render as plain <img>.
function Img({src, alt, ...props}: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (alt) {
    return (
      <figure className="img-figure">
        <img src={src} alt={alt} {...props} />
        <figcaption>{alt}</figcaption>
      </figure>
    );
  }
  return <img src={src} alt="" {...props} />;
}

export default {
  ...OriginalMDXComponents,
  table: MarkdownTable,
  img: Img,
};
