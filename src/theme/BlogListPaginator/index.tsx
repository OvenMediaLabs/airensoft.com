import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import type {Props} from '@theme/BlogListPaginator';
import styles from './styles.module.css';

/**
 * Numbered blog-list pagination.
 *
 * Docusaurus ships only an Older/Newer entries pair. The
 * `BlogPaginatedMetadata` includes `page` (current, 1-based),
 * `totalPages`, `previousPage`, `nextPage`, and `permalink`, so we can
 * derive the blog's base path and build a numbered pager with first /
 * last anchors and `…` collapses around the current page.
 */

function deriveBasePath(permalink: string, page: number): string {
  // Page 1's permalink is the blog root (e.g. `/blog`).
  // Subsequent pages append `/page/<n>`. Strip the suffix if present.
  if (page === 1) return permalink.replace(/\/$/, '');
  return permalink.replace(/\/page\/\d+\/?$/, '');
}

function pageHref(base: string, page: number): string {
  return page === 1 ? base || '/' : `${base}/page/${page}`;
}

/**
 * Build the visible page sequence for a "first … middle … last" pager.
 * Returns a list of page numbers; `null` represents an ellipsis gap.
 */
function buildPageWindow(current: number, total: number): (number | null)[] {
  const SIBLINGS = 1; // pages shown either side of current
  const BOUNDARY = 1; // pages pinned at each end
  const pages = new Set<number>();
  for (let i = 1; i <= Math.min(BOUNDARY, total); i++) pages.add(i);
  for (let i = Math.max(1, total - BOUNDARY + 1); i <= total; i++) pages.add(i);
  for (
    let i = Math.max(1, current - SIBLINGS);
    i <= Math.min(total, current + SIBLINGS);
    i++
  ) {
    pages.add(i);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  let prev = 0;
  for (const p of sorted) {
    const gap = p - prev;
    if (gap === 2) {
      // A single page is missing between the last and the next visible
      // entry. Showing it as a numeric link is shorter and tidier than
      // an ellipsis (which would be hiding a single number anyway).
      out.push(prev + 1);
    } else if (gap > 2) {
      out.push(null);
    }
    out.push(p);
    prev = p;
  }
  return out;
}

export default function BlogListPaginator(props: Props): ReactNode {
  const {metadata} = props;
  const {previousPage, nextPage, page, totalPages, permalink} = metadata;

  if (totalPages <= 1) return null;

  const base = deriveBasePath(permalink, page);
  const window = buildPageWindow(page, totalPages);

  return (
    <nav
      className={clsx('pagination-nav', styles.pager)}
      aria-label={translate({
        id: 'theme.blog.paginator.navAriaLabel',
        message: 'Blog list page navigation',
        description: 'The ARIA label for the blog pagination',
      })}>
      {previousPage ? (
        <Link to={previousPage} className={styles.step} rel="prev">
          ‹ Prev
        </Link>
      ) : (
        <span
          className={clsx(styles.step, styles.stepDisabled)}
          aria-hidden="true">
          ‹ Prev
        </span>
      )}

      <ol className={styles.pages}>
        {window.map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} className={styles.gap} aria-hidden="true">
              …
            </li>
          ) : p === page ? (
            <li key={p} className={clsx(styles.page, styles.pageCurrent)}>
              <span aria-current="page">{p}</span>
            </li>
          ) : (
            <li key={p} className={styles.page}>
              <Link to={pageHref(base, p)} aria-label={`Page ${p}`}>
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>

      {nextPage ? (
        <Link to={nextPage} className={styles.step} rel="next">
          Next ›
        </Link>
      ) : (
        <span
          className={clsx(styles.step, styles.stepDisabled)}
          aria-hidden="true">
          Next ›
        </span>
      )}
    </nav>
  );
}
