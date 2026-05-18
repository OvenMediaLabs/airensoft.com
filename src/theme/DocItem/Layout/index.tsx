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
 *
 * Additionally, any doc that is a sidebar category's index page renders
 * an automatic child-page grid at the bottom of the article (below body
 * content, above the footer). Fully automatic — no per-page config — so
 * empty category landing pages get a usable child index and
 * content-bearing ones get the same grid appended under their prose.
 * The category is matched deterministically by `href === permalink`, so
 * it never throws on leaf pages.
 *
 * We deliberately do NOT use `@theme/DocCardList`/`DocCard`: those
 * render an `<a class="card …">`, and this site loads Bootstrap
 * globally for marketing, whose `.card` (and `.row`) rules fight every
 * override. Instead we render plain `<Link>`s with a local CSS-module
 * class, so the cards are immune to Bootstrap and match the blog
 * "You might also like" cards exactly (see `styles.module.css`,
 * mirroring `src/theme/BlogPostItem/PostFooterExtras.module.css`).
 */
import {type ReactNode} from 'react';
import clsx from 'clsx';
import {useWindowSize} from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import {
  useDoc,
  useDocsSidebar,
  findSidebarCategory,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
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

// Strip trailing slashes so the comparison is robust regardless of the
// site's `trailingSlash` setting.
const stripSlash = (s: string): string => s.replace(/\/+$/, '');

/**
 * Renders a title-only grid of child pages when the current doc is the
 * index page of a sidebar category. Returns null on leaf pages and on
 * docs with no sidebar, so it is safe to render unconditionally.
 */
function DocItemChildCards(): ReactNode {
  const {metadata} = useDoc();
  const sidebar = useDocsSidebar();
  if (!sidebar) {
    return null;
  }
  const category = findSidebarCategory(
    sidebar.items,
    (cat) =>
      cat.href !== undefined &&
      stripSlash(cat.href) === stripSlash(metadata.permalink),
  );
  if (!category || category.items.length === 0) {
    return null;
  }

  const links = category.items
    .map((item) => {
      if (item.type === 'link') {
        return {label: item.label, href: item.href};
      }
      if (item.type === 'category') {
        const href = item.href ?? findFirstSidebarItemLink(item);
        return href ? {label: item.label, href} : null;
      }
      return null;
    })
    .filter((l): l is {label: string; href: string} => l !== null);

  if (links.length === 0) {
    return null;
  }

  return (
    <nav className={styles.childNav} aria-label="Pages in this section">
      <p className={styles.childNavTitle}>Dive deeper</p>
      <div className={styles.childGrid}>
        {links.map((l) => (
          <Link key={l.href} to={l.href} className={styles.childCard}>
            <span className={styles.childCardLabel}>{l.label}</span>
            <span className={styles.childCardArrow} aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
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
            <DocItemChildCards />
            <DocItemFooter />
          </article>
          <DocItemPaginator />
        </div>
      </div>
      {docTOC.desktop && <div className="col col--3">{docTOC.desktop}</div>}
    </div>
  );
}
