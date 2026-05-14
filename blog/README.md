# Authoring a Blog Post

Blog posts live in `blog/<YYYY-MM-DD>-<slug>/index.mdx`. The date in the
folder name is the publish date that appears on the post; the slug becomes
the URL (`/blog/<slug>`).

## Quick start

1. Copy `blog/_template/` to a new folder named `YYYY-MM-DD-<slug>` (today's
   date + a short slug). Example: `blog/2026-06-04-llhls-tuning-tips/`.
2. Edit `index.mdx`:
   - Update the frontmatter (`slug`, `title`, `description`, `tags`).
   - Replace the body with your post.
3. Drop any images you reference into the same folder (e.g. `hero.png`)
   and link to them with relative paths (`![alt](./hero.png)`).
4. Local preview: `npm start` and open `http://localhost:3000/blog`.
5. Commit and open a PR.

That's it. No sidebar to update, no index to register — blog posts are
auto-listed by their folder date.

## Frontmatter fields

```yaml
---
slug: my-post-url-slug              # required; final URL is /blog/<slug>
title: "My Post Title"              # required; H1 of the post
description: One-sentence summary.  # required; SEO meta + RSS summary
authors: [ovenmedialabs]            # required; keys from authors.yml
tags: [llhls, tutorial]             # required; keys from tags.yml
date: 2026-06-04                    # optional; defaults to folder date
image: ./hero.png                   # optional; social/RSS thumbnail
canonical_url: https://...          # optional; use when reposting
---
```

- **`authors`** — pick keys from [`authors.yml`](./authors.yml). Add a new
  author by appending an entry there with `name`, `title`, `image_url`, and
  optional `socials`.
- **`tags`** — pick keys from [`tags.yml`](./tags.yml). To introduce a new
  tag, add it to `tags.yml` first (`label`, `permalink`, `description`).
  Inline tags trigger a build warning.
- **`canonical_url`** — set this when the post is mirrored from Medium or
  another site so search engines credit the original.

## Cut-off for the listing page

Use the `{/* truncate */}` marker to control how much of the post
appears in the blog index. Everything above the marker shows in the
preview; everything below only appears on the post page.

```mdx
The first paragraph or two of the post — this is what readers see
on the blog list page.

{/* truncate */}

The full body of the post continues here.
```

If you forget the marker, the build emits an "untruncated blog post"
warning.

## Images

Put images in the **same folder** as the post and reference them
relatively. The Docusaurus build hashes asset filenames, so large/raw
images won't bloat the production bundle.

```mdx
![Architecture diagram](./diagram.png)
```

Filenames: no spaces, no parentheses. Use `kebab-case` or `snake_case`.

## MDX features

`index.mdx` supports MDX, so you can import React components and use
admonitions:

```mdx
:::tip
Use this for actionable advice.
:::

:::warning
Use this for caveats and gotchas.
:::
```

See the [Docusaurus MDX docs](https://docusaurus.io/docs/markdown-features)
for the full set of features.

## Common pitfalls

- **Folder date doesn't match `date:` frontmatter** → the frontmatter
  wins. Pick one source of truth; the folder date is the simpler choice.
- **Tag not in `tags.yml`** → build warning ("inline tag"). Add it to
  `tags.yml` first.
- **Author not in `authors.yml`** → same as tags.
- **No `{/* truncate */}` marker** → the full post body lands on the
  index page. Build warns.
- **MDX parsing error on raw `<`, `{`, `}`** → wrap in backticks or
  escape (`&lt;`, `&#123;`, `&#125;`). Inside fenced code blocks no
  escaping is needed.
