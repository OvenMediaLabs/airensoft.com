import React, {type ReactNode} from 'react';
import {BlogPostProvider} from '@docusaurus/plugin-content-blog/client';
import BlogPostItem from '@theme/BlogPostItem';
import type {Props} from '@theme/BlogPostItems';

export default function BlogPostItems({
  items,
  component: BlogPostItemComponent = BlogPostItem,
}: Props): ReactNode {
  return (
    <div className="d-flex flex-column gap-4 gap-lg-3">
      {items.map(({content: BlogPostContent}) => (
        <BlogPostProvider
          key={BlogPostContent.metadata.permalink}
          content={BlogPostContent}>
          <BlogPostItemComponent>
            <BlogPostContent />
          </BlogPostItemComponent>
        </BlogPostProvider>
      ))}
    </div>
  );
}
