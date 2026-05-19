/**
 * "From the Labs" section used on marketing pages (homepage, /ome,
 * /ome-enterprise, /latency).
 *
 * Renders the three most recent blog posts as a static card grid at
 * build time. Data comes from src/data/blog-index.json, regenerated
 * from blog/<slug>/index.mdx frontmatter on every build by the
 * `oml-build-hooks` Docusaurus plugin (plugins/oml-build-hooks.js),
 * so there's no client-side fetch and no loading spinner — the
 * cards are part of the SSR HTML and visible immediately.
 *
 * Replaces the legacy `<div id="blog-grid"><div class="spinner-border">`
 * placeholder that was waiting on JS that never ran.
 */

import React from 'react';
import Link from '@docusaurus/Link';
import blogIndex from '@site/src/data/blog-index.json';

type IndexedPost = {
  slug: string;
  permalink: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  dir: string;
};

const POSTS = blogIndex as IndexedPost[];
const DEFAULT_LIMIT = 3;

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export default function LatestBlogPosts({
  limit = DEFAULT_LIMIT,
  heading = 'From the Labs',
  subhead = 'Discover the research and ideas driving our streaming technology.',
}: {
  limit?: number;
  heading?: string;
  subhead?: string;
}) {
  const posts = POSTS.slice(0, limit);

  return (
    <section id="blog" className="blog-section">
      <div className="blog-section-inner">
        <div className="blog-head">
          <div className="left">
            <h3>{heading}</h3>
            <p>{subhead}</p>
          </div>
          <Link
            to="/blog"
            className="btn btn-sm btn-secondary-outline3 rounded-pill d-none d-md-block">
            Read More &rarr;
          </Link>
        </div>

        <div className="blog-grid">
          {posts.map((post) => (
            <Link key={post.slug} to={post.permalink} className="blog-card">
              <div className="meta">
                <span>{formatDate(post.date)}</span>
                {post.tags[0] && (
                  <>
                    <span className="sep" />
                    <span className="tag">{post.tags[0]}</span>
                  </>
                )}
              </div>
              <h4>{post.title}</h4>
              {post.description && <p>{post.description}</p>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
