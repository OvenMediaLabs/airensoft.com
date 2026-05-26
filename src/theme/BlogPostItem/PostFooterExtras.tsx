/**
 * Marketing extras appended to the bottom of every single blog post:
 *
 *   1. Product CTA — short OME intro + two paths (Open source /
 *      Enterprise) so the blog earns its keep as a top-of-funnel
 *      surface. Tone is intentionally subtle (no loud gradient) and
 *      points the reader to whichever edition fits their use case.
 *   2. "You might also like" — three related posts, scored by tag
 *      overlap with the current post (falling back to most-recent).
 *   3. "View all posts" link back to /blog.
 *
 * Data source: src/data/blog-index.json, regenerated from blog/
 * frontmatter on every build by the `oml-build-hooks` Docusaurus
 * plugin (plugins/oml-build-hooks.js).
 */

import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import blogIndex from '@site/src/data/blog-index.json';

import styles from './PostFooterExtras.module.css';

type IndexedPost = {
  slug: string;
  permalink: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  dir: string;
};

const ALL_POSTS = blogIndex as IndexedPost[];

function pickRelated(
  currentSlug: string,
  currentTags: string[],
  limit = 3,
): IndexedPost[] {
  const currentTagSet = new Set(currentTags);

  const scored = ALL_POSTS
    .filter((p) => p.slug !== currentSlug)
    .map((p) => {
      const overlap = p.tags.filter((t) => currentTagSet.has(t)).length;
      return {post: p, score: overlap};
    });

  // Sort by tag overlap desc, then by date desc as tiebreaker so
  // posts with no shared tags still fall back to "most recent".
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.post.date.localeCompare(a.post.date);
  });

  return scored.slice(0, limit).map((s) => s.post);
}

function formatShortDate(iso: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

function ProductCTA(): ReactNode {
  return (
    <aside className={styles.cta} aria-labelledby="cta-heading">
      <header className={styles.ctaHeader}>
        <p className={styles.ctaEyebrow}>OvenMediaEngine</p>
        <h3 id="cta-heading" className={styles.ctaTitle}>
          Sub-second live streaming server. WebRTC, LL-HLS, and SRT in one
          engine.
        </h3>
      </header>
      <div className={styles.ctaCards}>
        <div className={styles.ctaCard}>
          <p className={styles.ctaCardLabel}>Open source</p>
          <p className={styles.ctaCardBody}>
            Free and self-hosted. Deploy on your own infrastructure.
          </p>
          <Link to="/ome" className={styles.ctaCardButton}>
            Get started →
          </Link>
        </div>
        <div className={styles.ctaCard}>
          <p className={styles.ctaCardLabel}>Enterprise</p>
          <p className={styles.ctaCardBody}>Production-ready, with:</p>
          <ul className={styles.ctaCardList}>
            <li>High availability</li>
            <li>Operational ease</li>
            <li>Hardened security</li>
            <li>Customization &amp; integration</li>
            <li>Direct engineer support</li>
            <li>…and more</li>
          </ul>
          <Link to="/ome-enterprise" className={styles.ctaCardButton}>
            Explore Enterprise →
          </Link>
        </div>
      </div>
    </aside>
  );
}

function RelatedPosts({posts}: {posts: IndexedPost[]}): ReactNode {
  if (posts.length === 0) return null;
  return (
    <section className={styles.related} aria-labelledby="related-heading">
      <header className={styles.relatedHeader}>
        <h3 id="related-heading" className={styles.relatedTitle}>
          You might also like
        </h3>
        <Link to="/blog" className={styles.viewAll}>
          View all posts →
        </Link>
      </header>
      <ul className={styles.relatedGrid}>
        {posts.map((p) => (
          <li key={p.slug} className={styles.relatedItem}>
            <Link to={p.permalink} className={styles.relatedCard}>
              <span className={styles.relatedMeta}>
                {formatShortDate(p.date)}
                {p.tags[0] && (
                  <>
                    <span className={styles.relatedDot} aria-hidden="true" />
                    <span className={styles.relatedMetaTag}>{p.tags[0]}</span>
                  </>
                )}
              </span>
              <span className={styles.relatedCardTitle}>{p.title}</span>
              {p.description && (
                <span className={styles.relatedCardExcerpt}>
                  {p.description}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PostFooterExtras(): ReactNode {
  const {metadata} = useBlogPost();
  const tagLabels = metadata.tags.map((t) => {
    // The frontmatter tag value is the last segment of the permalink
    // (e.g. `/blog/tags/llhls` -> `llhls`). That matches what
    // scripts/build-blog-index.js stores in tags[].
    return t.permalink.split('/').filter(Boolean).pop() ?? '';
  });

  const related = pickRelated(metadata.frontMatter.slug ?? '', tagLabels, 3);

  return (
    <div className={styles.wrapper}>
      <ProductCTA />
      <RelatedPosts posts={related} />
    </div>
  );
}
