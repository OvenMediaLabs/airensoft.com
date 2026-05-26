/**
 * Swizzled to surface a mobile "Pages" toggle alongside the standard
 * "On this page" TOC button. On mobile, Docusaurus's intended UX is
 * `navbar hamburger → NavbarMobileSidebar drawer → SecondaryMenu (doc
 * sidebar)`. Our marketing-style hamburger is wired to a Bootstrap
 * collapse for marketing nav, so doc-page users have no path to the
 * NavbarMobileSidebar drawer. This adds that path via a dedicated
 * button next to the TOC mobile control.
 *
 * "On this page" opens a position:absolute overlay panel anchored to
 * the button wrapper so the dropdown width matches the button exactly
 * and page content is never pushed down.
 *
 * The Pages button is always rendered so category index pages without
 * headings (which would otherwise lose all sidebar access) keep a
 * path to navigation.
 */
import {type ReactNode, useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {useLocation} from '@docusaurus/router';

import styles from './styles.module.css';

export default function DocItemTOCMobile(): ReactNode {
  const {toc, frontMatter} = useDoc();
  const mobileSidebar = useNavbarMobileSidebar();
  const {pathname} = useLocation();
  const themeConfig = useThemeConfig();

  const showTOC = !frontMatter.hide_table_of_contents && toc.length > 0;

  // Filter TOC items by heading level (matches TOCCollapsible behaviour).
  const minLevel =
    frontMatter.toc_min_heading_level ??
    themeConfig.tableOfContents.minHeadingLevel;
  const maxLevel =
    frontMatter.toc_max_heading_level ??
    themeConfig.tableOfContents.maxHeadingLevel;
  const filteredTOC = toc.filter(
    (item) => item.level >= minLevel && item.level <= maxLevel,
  );

  const [tocOpen, setTocOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close TOC on route change.
  useEffect(() => {
    setTocOpen(false);
  }, [pathname]);

  // Close TOC when Pages sidebar opens.
  useEffect(() => {
    if (mobileSidebar.shown) setTocOpen(false);
  }, [mobileSidebar.shown]);

  // Close TOC when user clicks outside the bar.
  useEffect(() => {
    if (!tocOpen) return;
    const handler = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) {
        setTocOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [tocOpen]);

  const handleTocToggle = useCallback(() => setTocOpen((p) => !p), []);
  const closeTOC = useCallback(() => setTocOpen(false), []);

  return (
    <>
    {/* Spacer keeps the article layout intact while the bar is fixed. */}
    <div className={styles.mobileDocNavSpacer} aria-hidden="true" />
    <div ref={navRef} className={styles.mobileDocNav}>
      {/* Pages button — opens the docs-sidebar drawer */}
      <button
        type="button"
        className={clsx('clean-btn', styles.pagesButton)}
        aria-label="Browse pages"
        onClick={() => mobileSidebar.toggle()}>
        <span className={styles.pagesIcon} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M2 3.5h12v1.5H2zM2 7.25h12v1.5H2zM2 11h12v1.5H2z" />
          </svg>
        </span>
        <span>Pages</span>
      </button>

      {/* "On this page" button + overlay — only when TOC entries exist */}
      {showTOC && (
        <div className={styles.tocButtonWrapper}>
          <button
            type="button"
            className={clsx(
              'clean-btn',
              styles.tocButton,
              tocOpen && styles.tocButtonOpen,
            )}
            aria-label="On this page"
            aria-expanded={tocOpen}
            onClick={handleTocToggle}>
            <span>On this page</span>
            <i
              className={clsx('ph ph-caret-down', styles.tocCaret)}
              aria-hidden="true"
            />
          </button>

          {/* Overlay — position:absolute inside the wrapper so it inherits
              the button's width exactly and doesn't push content down. */}
          {tocOpen && (
            <div className={styles.tocOverlay} role="navigation" aria-label="Page sections">
              <ul className={styles.tocList} role="list">
                {filteredTOC.map((item) => {
                  const depth = item.level - minLevel; // 0 = top level
                  return (
                    <li
                      key={item.id}
                      className={clsx(
                        styles.tocListItem,
                        depth === 0 && styles.tocItemL1,
                        depth === 1 && styles.tocItemL2,
                        depth >= 2 && styles.tocItemL3,
                      )}>
                      <a
                        href={`#${item.id}`}
                        className={styles.tocOverlayLink}
                        dangerouslySetInnerHTML={{__html: item.value}}
                        onClick={closeTOC}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
