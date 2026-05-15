import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogAuthor from '@theme/Blog/Components/Author';
import type {Props} from '@theme/BlogPostItem/Header/Authors';
import styles from './styles.module.css';

// Component responsible for the authors layout.
//
// On the post detail page we render a dedicated `<BlogAuthorCard>` in the
// right column (see swizzled BlogPostPage), so the inline author block at
// the top of the post would just duplicate it. Skip it there and keep the
// inline layout for the blog list page where there's no right column.
export default function BlogPostItemHeaderAuthors({
  className,
}: Props): ReactNode {
  const {
    metadata: {authors},
    assets,
    isBlogPostPage,
  } = useBlogPost();
  const authorsCount = authors.length;
  if (authorsCount === 0 || isBlogPostPage) {
    return null;
  }
  const imageOnly = authors.every(({name}) => !name);
  const singleAuthor = authors.length === 1;
  return (
    <div
      className={clsx(
        'margin-top--md margin-bottom--sm',
        imageOnly ? styles.imageOnlyAuthorRow : 'row',
        className,
      )}>
      {authors.map((author, idx) => (
        <div
          className={clsx(
            !imageOnly && (singleAuthor ? 'col col--12' : 'col col--6'),
            imageOnly ? styles.imageOnlyAuthorCol : styles.authorCol,
          )}
          key={idx}>
          <BlogAuthor
            author={{
              ...author,
              // Handle author images using relative paths
              imageURL: assets.authorsImageUrls[idx] ?? author.imageURL,
            }}
          />
        </div>
      ))}
    </div>
  );
}
