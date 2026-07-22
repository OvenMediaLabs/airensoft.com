/**
 * Marketing-design navbar. Replaces Docusaurus's default Navbar/Content with
 * the Bootstrap-based markup from the legacy index.html. Menu items still
 * come from themeConfig.navbar.items, so editing config drives the nav.
 *
 * Supports a single level of dropdown by giving a navbar item an `items` array
 * (Docusaurus's standard dropdown-type item schema). Bootstrap's dropdown JS
 * (loaded globally via headTags) handles the open/close behavior.
 */
import {type ReactNode, useEffect, useRef, useState} from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useLocation} from '@docusaurus/router';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import SearchBar from '@theme/SearchBar';
import {resourcesDropdownItems} from '@site/src/config/navbarResources';

type NavbarItem = {
  to?: string;
  href?: string;
  label?: string;
  // Phosphor icon class (e.g. 'ph-newspaper'). Renders as a small
  // leading glyph in dropdown rows.
  icon?: string;
  position?: 'left' | 'right';
  target?: string;
  items?: NavbarItem[];
  // Custom types used inside dropdown `items` only:
  //   'divider' renders a horizontal rule, 'header' renders a small group label.
  type?: 'divider' | 'header';
  // When set on a top-level item, the swizzled NavbarContent loads dropdown
  // entries from a named module instead of `items` (lets us include divider/
  // header rows that Docusaurus's themeConfig schema would reject).
  customMenu?: 'resources';
  mobileLabel?: string;
  navLabel?: string;
  [key: string]: unknown;
};

function AnimatedLabel({label}: {label: string}) {
  const [displayed, setDisplayed] = useState(label);
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('enter');

  useEffect(() => {
    if (label === displayed) {
      const t = setTimeout(() => setPhase('idle'), 340);
      return () => clearTimeout(t);
    }
    setPhase('exit');
    const t1 = setTimeout(() => { setDisplayed(label); setPhase('enter'); }, 130);
    const t2 = setTimeout(() => setPhase('idle'), 340);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [label]);

  const cls = phase === 'exit' ? 'nav-label-exit'
    : phase === 'enter' ? 'nav-label-enter'
    : '';

  return <span className={`nav-label-animated${cls ? ` ${cls}` : ''}`}>{displayed}</span>;
}

function NavLink({item, isActive}: {item: NavbarItem; isActive: boolean}) {
  const href = item.href;
  const to = item.to;
  const className = `nav-link${isActive ? ' active' : ''}`;
  if (href) {
    return (
      <a
        className={className}
        href={href}
        target={item.target ?? '_blank'}
        rel="noopener noreferrer">
        {item.label}
      </a>
    );
  }
  return (
    <Link className={className} to={to ?? '/'}>
      {item.label}
    </Link>
  );
}

function DropdownItem({item, isActive = false}: {item: NavbarItem; isActive?: boolean}) {
  if (item.type === 'divider') {
    return (
      <li>
        <hr className="dropdown-divider" />
      </li>
    );
  }
  if (item.type === 'header') {
    return (
      <li>
        <h6 className="dropdown-header">{item.label}</h6>
      </li>
    );
  }
  if (item.href) {
    return (
      <li>
        <a
          className="dropdown-item dropdown-item-external d-flex align-items-center"
          href={item.href}
          target={item.target ?? '_blank'}
          rel="noopener noreferrer">
          {item.icon && (
            <i className={`ph ${item.icon} dropdown-item-leading`}></i>
          )}
          <span className="me-auto">{item.label}</span>
          <i className="ph ph-arrow-up-right ms-2 small" style={{opacity: 0.6}}></i>
        </a>
      </li>
    );
  }
  const closeMenu = () => {
    const bs = (window as any).bootstrap;
    if (!bs) return;
    document.querySelectorAll<HTMLElement>('[data-bs-toggle="dropdown"]').forEach(el => {
      bs.Dropdown.getInstance(el)?.hide();
    });
  };
  return (
    <li>
      <Link
        className={`dropdown-item d-flex align-items-center${isActive ? ' active' : ''}`}
        to={item.to ?? '/'}
        onClick={closeMenu}>
        {item.icon && (
          <i className={`ph ${item.icon} dropdown-item-leading`}></i>
        )}
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

function Dropdown({item, isActive, dropdownId}: {item: NavbarItem; isActive: boolean; dropdownId: string}) {
  const {pathname} = useLocation();
  const subItems: NavbarItem[] =
    item.customMenu === 'resources'
      ? (resourcesDropdownItems as NavbarItem[])
      : (item.items ?? []);
  const linkItems = subItems.filter(
    (sub) => sub.type !== 'divider' && sub.type !== 'header',
  );
  const [externalClicked, setExternalClicked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const isResourcesActive = linkItems.some((sub) => {
    if (!sub.to) return false;
    // Anchor items (e.g. /#enterprise) are on the homepage; pathname never
    // contains the hash, so pathUnder would never match. Match only when
    // that specific section is scrolled into view (activeAnchor).
    if (sub.to.startsWith('/#')) return activeAnchor === sub.to;
    return pathUnder(sub.to, pathname);
  });
  const dropdownToggleRef = useRef<HTMLAnchorElement>(null);
  const showAccordionRef = useRef(false);

  // Reset when the user navigates to a new internal page
  useEffect(() => {
    setExternalClicked(false);
  }, [pathname]);

  const showAccordion = isResourcesActive && !externalClicked;

  useEffect(() => {
    showAccordionRef.current = showAccordion;
  }, [showAccordion]);

  // Drive Bootstrap collapse open/close based on route
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(dropdownId);
    if (!el) return;
    const bs = (window as any).bootstrap;
    if (!bs) return;
    const instance =
      bs.Collapse.getInstance(el) ?? new bs.Collapse(el, {toggle: false});
    showAccordion ? instance.show() : instance.hide();
  }, [showAccordion, dropdownId]);

  // Track mobile accordion state for the active class.
  // Also close all other mobile accordions when this one opens (mutual exclusivity).
  useEffect(() => {
    const el = document.getElementById(dropdownId);
    if (!el) return;
    const onShow = () => {
      setIsExpanded(true);
      const bs = (window as any).bootstrap;
      if (bs) {
        document.querySelectorAll<HTMLElement>('#mainNav .collapse[id^="mobileDropdown-"]').forEach((other) => {
          if (other !== el) bs.Collapse.getInstance(other)?.hide();
        });
      }
    };
    // Only update isExpanded when showAccordion is false. When showAccordion
    // is true (user is on an active page), calling setIsExpanded(false) would
    // trigger a React re-render that immediately adds 'show' back, fighting
    // Bootstrap's close animation and preventing mutual exclusivity from working.
    const onHide = () => { if (!showAccordionRef.current) setIsExpanded(false); };
    el.addEventListener('show.bs.collapse', onShow);
    el.addEventListener('hide.bs.collapse', onHide);
    return () => {
      el.removeEventListener('show.bs.collapse', onShow);
      el.removeEventListener('hide.bs.collapse', onHide);
    };
  }, [dropdownId]);

  // Hamburger open/close → accordion sync (no double-animation):
  //
  //   show.bs.collapse  (hamburger starts opening, before any frame is painted)
  //     → set this accordion to its target state instantly, with no transition,
  //       so it is already in the right position when the menu slides into view.
  //
  //   hidden.bs.collapse (hamburger fully hidden, off-screen)
  //     → silently reset to collapsed so the next open starts clean.
  //       Done after the hamburger is invisible so there is no visible flicker.
  useEffect(() => {
    const mainNav = document.getElementById('mainNav');
    if (!mainNav) return;

    const setAccordionInstant = (open: boolean) => {
      const el = document.getElementById(dropdownId);
      if (!el) return;
      // Bypass Bootstrap's transition by toggling the class directly.
      // Do NOT call dispose() — that nulls Bootstrap's internal _element ref
      // and causes "Cannot read properties of null (reading 'classList')" the
      // next time the user clicks the toggle.
      el.classList.toggle('show', open);
    };

    // Guard against event bubbling: collapse events from child elements
    // bubble up to #mainNav. Without the target check, clicking a dropdown
    // would re-trigger this handler and fight with Bootstrap's own animation.
    const onNavShow   = (e: Event) => {
      if ((e.target as HTMLElement)?.id !== 'mainNav') return;
      setAccordionInstant(showAccordionRef.current);
    };
    const onNavHidden = (e: Event) => {
      if ((e.target as HTMLElement)?.id !== 'mainNav') return;
      setAccordionInstant(false);
      setIsExpanded(false);
    };

    mainNav.addEventListener('show.bs.collapse',   onNavShow);
    mainNav.addEventListener('hidden.bs.collapse', onNavHidden);
    return () => {
      mainNav.removeEventListener('show.bs.collapse',   onNavShow);
      mainNav.removeEventListener('hidden.bs.collapse', onNavHidden);
    };
  }, [dropdownId]);

  // Scroll-based section activation for homepage anchor items (e.g. /#enterprise).
  // Resets when navigating away from /.
  useEffect(() => {
    const anchorSubs = (item.items ?? []).filter(sub => sub.to?.startsWith('/#'));
    if (anchorSubs.length === 0 || pathname !== '/') {
      setActiveAnchor(null);
      return;
    }
    const navbarHeight = 82;
    const update = () => {
      let active: string | null = null;
      for (const sub of anchorSubs) {
        const id = sub.to!.slice(2); // '/#enterprise' → 'enterprise'
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= navbarHeight + 1) active = sub.to!;
      }
      setActiveAnchor(active);
    };
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(update, 30);
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(debounceTimer);
    };
  }, [pathname]); // item.items is static config — safe to omit

  // Track desktop dropdown open/close for the active class.
  // Also close all other open dropdowns when this one opens (mutual exclusivity).
  useEffect(() => {
    const toggle = dropdownToggleRef.current;
    if (!toggle) return;
    const onShow = () => {
      setIsDropdownOpen(true);
      const bs = (window as any).bootstrap;
      if (bs) {
        document.querySelectorAll<HTMLElement>('[data-bs-toggle="dropdown"]').forEach((el) => {
          if (el !== toggle) bs.Dropdown.getInstance(el)?.hide();
        });
      }
    };
    const onHide = () => setIsDropdownOpen(false);
    toggle.addEventListener('show.bs.dropdown', onShow);
    toggle.addEventListener('hide.bs.dropdown', onHide);
    return () => {
      toggle.removeEventListener('show.bs.dropdown', onShow);
      toggle.removeEventListener('hide.bs.dropdown', onHide);
    };
  }, []);

  const hasAnchorItems = (item.items ?? []).some(sub => sub.to?.startsWith('/#'));
  const isSubActive = (sub: NavbarItem): boolean => {
    if (!sub.to) return false;
    if (pathname !== '/') return pathUnder(sub.to, pathname);
    if (activeAnchor !== null) return activeAnchor === sub.to;
    return false;
  };
  const isToggleActive = isActive || isDropdownOpen || isResourcesActive
    || (hasAnchorItems && pathname === '/');
  const activeSub = activeAnchor
    ? linkItems.find(sub => sub.to === activeAnchor)
    : linkItems.find(sub => isSubActive(sub));
  const activeSubLabel = activeSub ? (activeSub.navLabel ?? activeSub.label ?? null) : null;
  const toggleLabel = activeSubLabel ?? item.label ?? '';

  // Closes any open Bootstrap dropdown (PC) or the hamburger collapse (mobile).
  const closeDropdownMenu = () => {
    const bs = (window as any).bootstrap;
    if (!bs) return;
    document.querySelectorAll<HTMLElement>('[data-bs-toggle="dropdown"]').forEach(el => {
      bs.Dropdown.getInstance(el)?.hide();
    });
    const mainNav = document.getElementById('mainNav');
    if (mainNav) bs.Collapse.getInstance(mainNav)?.hide();
  };

  return (
    <>
      {/* Desktop: full dropdown */}
      <li className="nav-item dropdown d-none d-lg-block">
        <a
          ref={dropdownToggleRef}
          className={`nav-link dropdown-toggle${isToggleActive ? ' active' : ''}`}
          href="#"
          role="button"
          data-bs-toggle="dropdown"
          aria-expanded="false">
          <AnimatedLabel label={toggleLabel} />
        </a>
        <ul className="dropdown-menu dropdown-menu-end navbar-dropdown-menu">
          {subItems.map((sub, i) => (
            <DropdownItem
              key={i}
              item={sub}
              isActive={isSubActive(sub)}
            />
          ))}
        </ul>
      </li>

      {/* Mobile: accordion collapse */}
      <li className="nav-item d-lg-none">
        <a
          className={`nav-link d-flex align-items-center justify-content-between${(isToggleActive || isExpanded) ? ' active' : ''}`}
          href={`#${dropdownId}`}
          role="button"
          data-bs-toggle="collapse"
          aria-expanded={showAccordion ? 'true' : 'false'}
          aria-controls={dropdownId}>
          <AnimatedLabel label={toggleLabel} />
          <i className="ph ph-caret-down mobile-nav-caret"></i>
        </a>
        <div
          className={`collapse${showAccordion ? ' show' : ''}`}
          id={dropdownId}>
          <ul className="nav flex-column">
            {subItems.map((sub, i) => {
              if (sub.type === 'header') {
                return (
                  <li key={`mob-${i}`}>
                    <h6 className="dropdown-header">{sub.label}</h6>
                  </li>
                );
              }
              if (sub.type === 'divider') return null;
              const label: string = sub.mobileLabel ?? sub.label ?? '';
              return sub.href ? (
                <li key={`mob-${i}`} className="nav-item">
                  <a
                    className="nav-link nav-link-sub d-flex align-items-center"
                    href={sub.href}
                    target={sub.target ?? '_blank'}
                    rel="noopener noreferrer"
                    onClick={() => setExternalClicked(true)}>
                    {sub.icon && <i className={`ph ${sub.icon} nav-link-sub-icon`}></i>}
                    <span className="me-auto">{label}</span>
                    <i className="ph ph-arrow-up-right mobile-nav-external-icon"></i>
                  </a>
                </li>
              ) : (
                <li key={`mob-${i}`} className="nav-item">
                  <Link
                    className={`nav-link nav-link-sub d-flex align-items-center${isSubActive(sub) ? ' active' : ''}`}
                    to={sub.to ?? '/'}
                    onClick={closeDropdownMenu}>
                    {sub.icon && <i className={`ph ${sub.icon} nav-link-sub-icon`}></i>}
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </li>
    </>
  );
}

function isCurrentPath(itemTo: string | undefined, pathname: string): boolean {
  if (!itemTo) return false;
  const normalize = (s: string) => (s.length > 1 ? s.replace(/\/$/, '') : s);
  return normalize(itemTo) === normalize(pathname);
}

// True when pathname equals itemTo or is a sub-path of it (e.g. /docs/ome/intro
// matches /docs/ome, but /docs/ome-enterprise does NOT match /docs/ome).
function pathUnder(itemTo: string, pathname: string): boolean {
  const base = itemTo.replace(/\/$/, '');
  return pathname === base || pathname.startsWith(base + '/');
}

function isDropdownActive(item: NavbarItem, pathname: string): boolean {
  if (!item.items) return false;
  return item.items.some((sub) => sub.to != null && pathUnder(sub.to, pathname));
}

export default function NavbarContent(): ReactNode {
  const {navbar} = useThemeConfig();
  const {siteConfig} = useDocusaurusContext();
  const previewSource = (siteConfig.customFields as Record<string, string> | undefined)?.previewSource || '';
  // In preview mode the editor is focused on one product's docs — drop
  // the marketing menu so it can't distract or mis-link off the docs
  // chapter.
  const items = previewSource ? [] : ((navbar.items ?? []) as NavbarItem[]);
  const brandTo = previewSource ? `/docs/${previewSource}/` : '/';
  const {pathname} = useLocation();

  const logoDefaultSrc = useBaseUrl('/images/airen_ci/OML_horz_right_default.svg');
  const logoDefaultPng = useBaseUrl('/images/airen_ci/OML_horz_right_default.png');
  const logoLightSrc = useBaseUrl('/images/airen_ci/OML_horz_right_light.svg');
  const logoLightPng = useBaseUrl('/images/airen_ci/OML_horz_right_light.png');

  return (
    <div className="container">
      <Link className="navbar-brand d-flex flex-column align-items-start" to={brandTo}>
        <div style={{position: 'relative', pointerEvents: 'none'}}>
          <picture style={{display: 'block'}}>
            <source srcSet={logoDefaultSrc} type="image/svg+xml" />
            <img src={logoDefaultPng} alt="OvenMedia Labs" style={{filter: 'brightness(1.25)'}} />
          </picture>
          <picture style={{
            position: 'absolute', top: 0, left: 0, display: 'block',
            maskImage: 'linear-gradient(-60deg, transparent 0%, white 100%)',
            WebkitMaskImage: 'linear-gradient(-60deg, transparent 0%, white 100%)',
          }}>
            <source srcSet={logoLightSrc} type="image/svg+xml" />
            <img src={logoLightPng} alt="" style={{filter: 'brightness(1.25)'}} />
          </picture>
        </div>
        <span
          className="super-small text-sub navbar-formerly"
          style={{pointerEvents: 'none', opacity: 0.75, alignSelf: 'flex-end'}}>
          (Formerly AirenSoft)
        </span>
      </Link>

      {/* SearchBar lives OUTSIDE the Bootstrap collapse so it stays
          visible on mobile (sibling to the hamburger). On desktop it
          renders an input pill; on mobile the plugin's SearchBar
          collapses to a magnifier icon and opens an overlay on tap.
          Wrapped in `order-*` utilities so on desktop it sits at the
          end of the nav row (after the items in the collapse), while
          on mobile it sits between the brand and the toggler. */}
      <div className="d-flex align-items-center order-lg-3 ms-auto ms-lg-2 me-2 me-lg-0 mobile-search-wrapper">
        <SearchBar />
        {/* Mobile-only cancel button. CSS reveals it when the search
            input is focused (and at the same time hides brand +
            toggler so the input gets the whole navbar row). onMouseDown
            preventDefault keeps the input focused long enough for the
            click handler to run before iOS dismisses it. */}
        <button
          type="button"
          className="clean-btn mobile-search-cancel"
          aria-label="Cancel search"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const input = document.querySelector(
              '.navbar__search-input',
            ) as HTMLInputElement | null;
            if (input) {
              input.value = '';
              input.blur();
            }
          }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <button
        className="navbar-toggler order-lg-4"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation">
        <div className="toggler-icon-bar"></div>
        <div className="toggler-icon-bar"></div>
        <div className="toggler-icon-bar"></div>
      </button>

      <div className="collapse navbar-collapse order-lg-2" id="mainNav">
        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
          {items.map((item, i) => {
            const isDropdown =
              item.customMenu || (item.items && item.items.length > 0);
            if (isDropdown) {
              return (
                <Dropdown
                  key={i}
                  item={item}
                  isActive={isDropdownActive(item, pathname)}
                  dropdownId={`mobileDropdown-${i}`}
                />
              );
            }
            return (
              <li key={i} className="nav-item">
                <NavLink item={item} isActive={isCurrentPath(item.to, pathname)} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
