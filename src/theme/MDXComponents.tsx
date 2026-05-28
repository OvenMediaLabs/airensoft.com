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

// Markdown wraps standalone images in <p>. Since Img renders as <figure>
// (block-level), <p><figure> is invalid HTML5. When the only meaningful
// child of a <p> is an Img element (which will render to <figure>),
// drop the <p> wrapper so the figure sits directly in flow.
function P({children}: {children?: React.ReactNode}) {
  const all = React.Children.toArray(children);
  const meaningful = all.filter(
    (c) => !(typeof c === 'string' && (c as string).trim() === ''),
  );
  if (
    meaningful.length === 1 &&
    React.isValidElement(meaningful[0]) &&
    (meaningful[0] as React.ReactElement).type === Img
  ) {
    return <>{children}</>;
  }
  return <p>{children}</p>;
}

export default {
  ...OriginalMDXComponents,
  table: MarkdownTable,
  img: Img,
  p: P,
};
