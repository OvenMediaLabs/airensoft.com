import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import clsx from 'clsx';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {useLocation} from '@docusaurus/router';

import styles from '../theme/DocItem/TOC/Mobile/styles.module.css';

export default function BlogPostTOCMobile(): ReactNode {
  const {toc, frontMatter} = useBlogPost();
  const {pathname} = useLocation();
  const themeConfig = useThemeConfig();

  const showTOC = !frontMatter.hide_table_of_contents && toc.length > 0;

  const minLevel =
    frontMatter.toc_min_heading_level ??
    themeConfig.tableOfContents.minHeadingLevel;
  const maxLevel =
    frontMatter.toc_max_heading_level ??
    themeConfig.tableOfContents.maxHeadingLevel;
  const filteredTOC = useMemo(
    () => toc.filter((item) => item.level >= minLevel && item.level <= maxLevel),
    [toc, minLevel, maxLevel],
  );

  const [tocOpen, setTocOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [clickOverrideId, setClickOverrideId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const overrideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSkipsRef = useRef(0);

  useEffect(() => {
    if (!showTOC) return;
    const getNavH = () =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ifm-navbar-height').trim()) || 64;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const sync = () => {
      const scrollY = window.scrollY;
      if (scrollY < 10) {
        if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
        setActiveId(null);
        return;
      }
      const threshold = Math.max(getNavH() + 32, window.innerHeight * 0.4);
      let winner: string | null = null;
      for (const item of filteredTOC) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= threshold) winner = item.id;
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => setActiveId(winner), 80);
    };
    window.addEventListener('scroll', sync, {passive: true});
    sync();
    return () => {
      window.removeEventListener('scroll', sync);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [showTOC, filteredTOC]);

  useEffect(() => {
    setTocOpen(false);
    setClickOverrideId(null);
    if (overrideTimer.current) clearTimeout(overrideTimer.current);
  }, [pathname]);

  useEffect(() => {
    if (!tocOpen) return;
    const handler = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setTocOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [tocOpen]);

  useEffect(() => {
    if (clickOverrideId === null || activeId === null) return;
    if (pendingSkipsRef.current > 0) {
      pendingSkipsRef.current--;
      return;
    }
    setClickOverrideId(null);
    if (overrideTimer.current) { clearTimeout(overrideTimer.current); overrideTimer.current = null; }
  }, [activeId, clickOverrideId]);

  const handleTocToggle = useCallback(() => setTocOpen((p) => !p), []);
  const handleLinkClick = useCallback((id: string) => {
    setClickOverrideId(id);
    pendingSkipsRef.current = 1;
    if (overrideTimer.current) clearTimeout(overrideTimer.current);
    overrideTimer.current = setTimeout(() => setClickOverrideId(null), 10000);
    setTocOpen(false);
  }, []);

  const displayActiveId = clickOverrideId ?? activeId;

  if (!showTOC) return null;

  const activeItem = filteredTOC.find((item) => item.id === displayActiveId);
  const buttonLabel = activeItem
    ? activeItem.value.replace(/<[^>]+>/g, '')
    : 'Content';

  return (
    <>
      <div className={styles.mobileDocNavSpacer} aria-hidden="true" />
      <div ref={navRef} className={styles.mobileDocNav}>
        <div className={styles.tocButtonWrapper}>
          <button
            type="button"
            className={clsx('clean-btn', styles.tocButton, tocOpen && styles.tocButtonOpen)}
            aria-label="On this page"
            aria-expanded={tocOpen}
            onClick={handleTocToggle}>
            <span className={styles.tocButtonLabel}>{buttonLabel}</span>
            <i className={clsx('ph ph-caret-down', styles.tocCaret)} aria-hidden="true" />
          </button>
          {tocOpen && (
            <div className={styles.tocOverlay} role="navigation" aria-label="Page sections">
              <ul className={styles.tocList} role="list">
                {filteredTOC.map((item) => {
                  const depth = item.level - minLevel;
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
                        className={clsx(
                          styles.tocOverlayLink,
                          displayActiveId === item.id && styles.tocLinkActive,
                        )}
                        dangerouslySetInnerHTML={{__html: item.value}}
                        onClick={() => handleLinkClick(item.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
