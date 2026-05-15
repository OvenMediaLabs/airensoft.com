/**
 * Swizzled BlogPostItem.
 *
 * - Detail view: keep original Container / Header / Content / Footer.
 * - List view: render a horizontal card (thumbnail + title + meta + author
 *   + excerpt + tags).
 */

import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';
import type {Props} from '@theme/BlogPostItem';

import PostFooterExtras from './PostFooterExtras';
import styles from './styles.module.css';

function useFormattedDate(date: string): string {
  // Match the format used by Docusaurus's default Info component.
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

function ListCard({children}: {children: ReactNode}): ReactNode {
  const {metadata, frontMatter, assets} = useBlogPost();
  const {
    permalink,
    title,
    description,
    date,
    readingTime,
    tags,
    authors,
  } = metadata;

  const image = assets.image ?? frontMatter.image;
  const formattedDate = useFormattedDate(date);
  const readingTimeLabel =
    typeof readingTime === 'number'
      ? `${Math.ceil(readingTime)} min read`
      : null;

  return (
    <article className={styles.card}>
      <Link to={permalink} className={styles.thumbLink} aria-label={title}>
        {image ? (
          <img className={styles.thumb} src={image} alt="" loading="lazy" />
        ) : (
          <div className={clsx(styles.thumb, styles.thumbPlaceholder)} />
        )}
      </Link>

      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link to={permalink}>{title}</Link>
        </h2>

        <div className={styles.meta}>
          <time dateTime={date}>{formattedDate}</time>
          {readingTimeLabel && (
            <>
              <span className={styles.metaDot}>·</span>
              <span>{readingTimeLabel}</span>
            </>
          )}
          {authors.length > 0 && (
            <>
              <span className={styles.metaDot}>·</span>
              <span>
                by{' '}
                {authors
                  .map((a) => a.name)
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </>
          )}
        </div>

        {description && (
          <p className={styles.excerpt}>{description}</p>
        )}

        {tags.length > 0 && (
          <ul className={styles.tags}>
            {tags.map(({label, permalink: tagPermalink}) => (
              <li key={tagPermalink}>
                <Link to={tagPermalink} className={styles.tag}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* children (the MDX excerpt) is intentionally not rendered in the
            list view. The description from frontmatter is used instead so
            every card has a uniform two-line summary. */}
        <span className={styles.childrenHidden} aria-hidden="true">
          {children}
        </span>
      </div>
    </article>
  );
}

export default function BlogPostItem({children, className}: Props): ReactNode {
  const {isBlogPostPage} = useBlogPost();

  if (!isBlogPostPage) {
    return (
      <div className={clsx(styles.cardWrapper, className)}>
        <ListCard>{children}</ListCard>
      </div>
    );
  }

  return (
    <BlogPostItemContainer className={className}>
      <BlogPostItemHeader />
      <BlogPostItemContent>{children}</BlogPostItemContent>
      <BlogPostItemFooter />
      <PostFooterExtras />
    </BlogPostItemContainer>
  );
}
