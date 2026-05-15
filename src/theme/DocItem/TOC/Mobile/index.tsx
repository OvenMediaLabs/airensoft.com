/**
 * Swizzled to surface a mobile "Pages" toggle alongside the standard
 * "On this page" TOC button. On mobile, Docusaurus's intended UX is
 * `navbar hamburger → NavbarMobileSidebar drawer → SecondaryMenu (doc
 * sidebar)`. Our marketing-style hamburger is wired to a Bootstrap
 * collapse for marketing nav, so doc-page users have no path to the
 * NavbarMobileSidebar drawer. This adds that path via a dedicated
 * button next to the TOC mobile control.
 *
 * On a doc page, NavbarSecondaryMenuDisplay defaults `shown = true`
 * when secondary content is available, so toggling the mobile sidebar
 * here opens directly into the doc sidebar — no extra "Menu" tap.
 *
 * The "On this page" TOC renders only when there are entries (and the
 * page hasn't opted out via `hide_table_of_contents`). The Pages
 * button is always rendered so that category index pages without
 * headings — which would otherwise lose all sidebar access — keep a
 * path to navigation.
 */
import {type ReactNode, useEffect, useRef} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import {useDoc} from '@docusaurus/plugin-content-docs/client';

import TOCCollapsible from '@theme/TOCCollapsible';

import styles from './styles.module.css';

/**
 * Close the expanded TOC dropdown on any click outside the chevron
 * toggle button (so tapping body content, TOC links, the Pages
 * button, etc. all collapse it). Only the chevron itself keeps its
 * natural toggle behavior.
 *
 * We can't read TOCCollapsible's internal state directly, so we
 * detect the expanded state from its button's CSS-module class
 * (`tocCollapsibleButtonExpanded_<hash>`) and trigger a click on
 * that button to drive the collapse.
 */
function useCloseTOCOnOutsideClick(navRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const nav = navRef.current;
      if (!nav) return;
      const tocButton = nav.querySelector<HTMLButtonElement>(
        '[class*="tocCollapsibleButton"]',
      );
      if (!tocButton) return;
      // Don't interfere with the toggle button's own click.
      if (tocButton.contains(e.target as Node)) return;
      const isExpanded = Array.from(tocButton.classList).some((c) =>
        c.includes('Expanded'),
      );
      if (isExpanded) {
        tocButton.click();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [navRef]);
}

export default function DocItemTOCMobile(): ReactNode {
  const {toc, frontMatter} = useDoc();
  const mobileSidebar = useNavbarMobileSidebar();
  const showTOC = !frontMatter.hide_table_of_contents && toc.length > 0;
  const navRef = useRef<HTMLDivElement>(null);
  useCloseTOCOnOutsideClick(navRef);

  return (
    <div ref={navRef} className={styles.mobileDocNav}>
      <button
        type="button"
        className={clsx('clean-btn', styles.pagesButton)}
        aria-label="Browse pages"
        onClick={() => mobileSidebar.toggle()}>
        <span className={styles.pagesIcon} aria-hidden="true">
          {/* 3-line list icon */}
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M2 3.5h12v1.5H2zM2 7.25h12v1.5H2zM2 11h12v1.5H2z" />
          </svg>
        </span>
        <span>Pages</span>
      </button>
      {showTOC && (
        <TOCCollapsible
          toc={toc}
          minHeadingLevel={frontMatter.toc_min_heading_level}
          maxHeadingLevel={frontMatter.toc_max_heading_level}
          className={clsx(
            ThemeClassNames.docs.docTocMobile,
            styles.tocMobileInline,
          )}
        />
      )}
    </div>
  );
}
