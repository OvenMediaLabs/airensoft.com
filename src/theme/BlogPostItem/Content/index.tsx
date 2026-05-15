import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {blogPostContainerID} from '@docusaurus/utils-common';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import MDXContent from '@theme/MDXContent';
import BlogAuthorCard from '@site/src/components/BlogAuthorCard';
import type {Props} from '@theme/BlogPostItem/Content';

export default function BlogPostItemContent({
  children,
  className,
}: Props): ReactNode {
  const {isBlogPostPage, metadata, assets} = useBlogPost();
  const cardAuthors = metadata.authors.map((author, idx) => ({
    ...author,
    imageURL: assets.authorsImageUrls[idx] ?? author.imageURL,
  }));
  return (
    <div
      // This ID is used for the feed generation to locate the main content
      id={isBlogPostPage ? blogPostContainerID : undefined}
      className={clsx('markdown', className)}>
      {isBlogPostPage && cardAuthors.length > 0 && (
        <BlogAuthorCard authors={cardAuthors} />
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
