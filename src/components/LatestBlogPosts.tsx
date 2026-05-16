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
    <section
      id="blog"
      className="full-page-section d-flex flex-column align-items-center bg-body position-relative">
      <div className="w-100 py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4 reveal-up">
            <div>
              <h2 className="fw-bold text-main mb-1">{heading}</h2>
              <p className="text-sub small mb-0">{subhead}</p>
            </div>
            <Link
              to="/blog"
              className="btn btn-sm btn-secondary-outline3 rounded-pill d-none d-md-block">
              Read More &rarr;
            </Link>
          </div>

          <div className="row g-3 g-md-4">
            {posts.map((post) => (
              <div key={post.slug} className="col-12 col-md-4">
                <Link
                  to={post.permalink}
                  className="latest-blog-card h-100 d-flex flex-column p-4 rounded text-decoration-none">
                  <span className="latest-blog-meta">
                    {formatDate(post.date)}
                    {post.tags[0] && (
                      <>
                        <span className="mx-2 opacity-50">·</span>
                        <span>{post.tags[0]}</span>
                      </>
                    )}
                  </span>
                  <h3 className="latest-blog-title fw-bold mb-2 mt-2">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="latest-blog-excerpt text-sub small mb-0">
                      {post.description}
                    </p>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
