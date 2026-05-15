/**
 * Swizzled to always render `DocItemTOCMobile` on mobile, even when the
 * page has no TOC entries.
 *
 * The default decides `canRender = toc.length > 0 && !hide_table_of_contents`
 * and only renders the mobile TOC under that condition. We piggyback
 * the mobile "Pages" sidebar toggle onto `DocItemTOCMobile`, so the
 * default's gating also hides our Pages button on every category index
 * page that has no headings (e.g. `live-source/README`). That breaks
 * navigation — users land on a category index with no way to reach the
 * other pages.
 *
 * The swizzled `DocItemTOCMobile` now decides for itself whether to
 * render the "On this page" TOC alongside the Pages button.
 */
import {type ReactNode} from 'react';
import clsx from 'clsx';
import {useWindowSize} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import DocItemPaginator from '@theme/DocItem/Paginator';
import DocVersionBanner from '@theme/DocVersionBanner';
import DocVersionBadge from '@theme/DocVersionBadge';
import DocItemFooter from '@theme/DocItem/Footer';
import DocItemTOCMobile from '@theme/DocItem/TOC/Mobile';
import DocItemTOCDesktop from '@theme/DocItem/TOC/Desktop';
import DocItemContent from '@theme/DocItem/Content';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import ContentVisibility from '@theme/ContentVisibility';
import type {Props} from '@theme/DocItem/Layout';

import styles from './styles.module.css';

function useDocTOC() {
  const {frontMatter, toc} = useDoc();
  const windowSize = useWindowSize();

  const hidden = frontMatter.hide_table_of_contents;
  const desktopTOCAvailable = !hidden && toc.length > 0;

  // Mobile: always render the slot. Inside, our swizzled
  // DocItemTOCMobile owns the "Pages" + (optional) "On this page" UI.
  // The TOC bit shows up only when there are entries; the Pages button
  // shows up unconditionally.
  const mobile = <DocItemTOCMobile />;

  const desktop =
    desktopTOCAvailable && (windowSize === 'desktop' || windowSize === 'ssr')
      ? <DocItemTOCDesktop />
      : undefined;

  return {hidden, mobile, desktop};
}

export default function DocItemLayout({children}: Props): ReactNode {
  const docTOC = useDocTOC();
  const {metadata} = useDoc();
  return (
    <div className="row">
      <div className={clsx('col', !docTOC.hidden && styles.docItemCol)}>
        <ContentVisibility metadata={metadata} />
        <DocVersionBanner />
        <div className={styles.docItemContainer}>
          <article>
            <DocBreadcrumbs />
            <DocVersionBadge />
            {docTOC.mobile}
            <DocItemContent>{children}</DocItemContent>
            <DocItemFooter />
          </article>
          <DocItemPaginator />
        </div>
      </div>
      {docTOC.desktop && <div className="col col--3">{docTOC.desktop}</div>}
    </div>
  );
}
