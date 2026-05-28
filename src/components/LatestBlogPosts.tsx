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

// Build a "dir/filename" → webpack-processed image URL map at compile time.
// require.context scans the entire blog/ tree so every post's frontmatter
// `image:` (now stored in blog-index.json) can be resolved to its hashed
// asset URL without a runtime fetch — regardless of whether the file is
// named "hero.png" or a Medium-style hashed filename.
const imageMap: Record<string, string> = (() => {
  try {
    const ctx = (require as any).context(
      '@site/blog',
      true,
      /\.(png|jpe?g|webp)$/,
    );
    const map: Record<string, string> = {};
    (ctx.keys() as string[]).forEach((key) => {
      // key is like "./2022-10-21-.../1-BRydy_...jpeg"
      const m = key.match(/^\.\/(.+)$/);
      if (m) {
        const mod = ctx(key);
        map[m[1]] = (mod as any)?.default ?? mod;
      }
    });
    return map;
  } catch {
    return {};
  }
})();

type IndexedPost = {
  slug: string;
  permalink: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  dir: string;
  image: string;
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
  anchor = true,
}: {
  limit?: number;
  heading?: string;
  subhead?: string;
  anchor?: boolean;
}) {
  const posts = POSTS.slice(0, limit);

  return (
    <section className="blog-section">
      <div className="blog-section-inner">
        <div className="blog-head">
          <div className="left">
            <h2 {...(anchor ? { id: 'blog', className: 'copy-title' } : {})}>{heading}</h2>
            <p>{subhead}</p>
          </div>
          <Link
            to="/blog"
            className="btn btn-sm btn-secondary-outline3 rounded-pill d-none d-md-block">
            Read More &rarr;
          </Link>
        </div>

        <div className="blog-grid">
          {posts.map((post) => {
            const heroSrc =
              post.dir && post.image
                ? imageMap[`${post.dir}/${post.image}`]
                : undefined;
            return (
              <Link key={post.slug} to={post.permalink} className="blog-card">
                {heroSrc && (
                  <div className="blog-card-thumb">
                    <img src={heroSrc} alt="" loading="lazy" />
                  </div>
                )}
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
                {post.description && <span className="blog-card-desc">{post.description}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
