import React, {type ReactNode} from 'react';
import {PageMetadata} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {useLocation} from '@docusaurus/router';

function getDocSuffix(pathname: string): string {
  if (pathname.startsWith('/docs/ome-enterprise')) return 'OvenMediaEngine Enterprise Guide';
  if (pathname.startsWith('/docs/ome')) return 'OvenMediaEngine Guide';
  if (pathname.startsWith('/docs/ovenplayer')) return 'OvenPlayer Guide';
  return 'OvenMedia Labs';
}

export default function DocItemMetadata(): ReactNode {
  const {metadata, frontMatter, assets} = useDoc();
  const {pathname} = useLocation();
  const suffix = getDocSuffix(pathname);

  return (
    <PageMetadata
      title={metadata.title}
      description={metadata.description}
      keywords={frontMatter.keywords}
      image={assets.image ?? frontMatter.image}>
      <title>{metadata.title} | {suffix}</title>
    </PageMetadata>
  );
}
