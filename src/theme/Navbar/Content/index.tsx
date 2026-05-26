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
  [key: string]: unknown;
};

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
          <i className="ph ph-arrow-up-right ms-2 small opacity-50"></i>
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        className={`dropdown-item d-flex align-items-center${isActive ? ' active' : ''}`}
        to={item.to ?? '/'}>
        {item.icon && (
          <i className={`ph ${item.icon} dropdown-item-leading`}></i>
        )}
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

function Dropdown({item, isActive}: {item: NavbarItem; isActive: boolean}) {
  const {pathname} = useLocation();
  const subItems: NavbarItem[] =
    item.customMenu === 'resources'
      ? (resourcesDropdownItems as NavbarItem[])
      : (item.items ?? []);
  const linkItems = subItems.filter(
    (sub) => sub.type !== 'divider' && sub.type !== 'header',
  );
  const isResourcesActive = linkItems.some(
    (sub) => sub.to != null && pathUnder(sub.to, pathname),
  );
  const [externalClicked, setExternalClicked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
    const el = document.getElementById('mobileResourcesMenu');
    if (!el) return;
    const bs = (window as any).bootstrap;
    if (!bs) return;
    const instance =
      bs.Collapse.getInstance(el) ?? new bs.Collapse(el, {toggle: false});
    showAccordion ? instance.show() : instance.hide();
  }, [showAccordion]);

  // Track mobile accordion state for the active class
  useEffect(() => {
    const el = document.getElementById('mobileResourcesMenu');
    if (!el) return;
    const onShow = () => setIsExpanded(true);
    const onHide = () => setIsExpanded(false);
    el.addEventListener('show.bs.collapse', onShow);
    el.addEventListener('hide.bs.collapse', onHide);
    return () => {
      el.removeEventListener('show.bs.collapse', onShow);
      el.removeEventListener('hide.bs.collapse', onHide);
    };
  }, []);

  // Hamburger open/close → Resources accordion sync (no double-animation):
  //
  //   show.bs.collapse  (hamburger starts opening, before any frame is painted)
  //     → set Resources to its target state instantly, with no transition, so
  //       it is already in the right position when the menu slides into view.
  //
  //   hidden.bs.collapse (hamburger fully hidden, off-screen)
  //     → silently reset Resources to collapsed so the next open starts clean.
  //       Done after the hamburger is invisible so there is no visible flicker.
  useEffect(() => {
    const mainNav = document.getElementById('mainNav');
    if (!mainNav) return;

    const setResourcesInstant = (open: boolean) => {
      const el = document.getElementById('mobileResourcesMenu');
      if (!el) return;
      // Bypass Bootstrap's transition by toggling the class directly.
      // Do NOT call dispose() — that nulls Bootstrap's internal _element ref
      // and causes "Cannot read properties of null (reading 'classList')" the
      // next time the user clicks the Resources toggle.
      el.classList.toggle('show', open);
    };

    // Guard against event bubbling: collapse events from child elements
    // (e.g. #mobileResourcesMenu) bubble up to #mainNav. Without the target
    // check, clicking Resources would re-trigger this handler and fight with
    // Bootstrap's own open animation.
    const onNavShow   = (e: Event) => {
      if ((e.target as HTMLElement)?.id !== 'mainNav') return;
      setResourcesInstant(showAccordionRef.current);
    };
    const onNavHidden = (e: Event) => {
      if ((e.target as HTMLElement)?.id !== 'mainNav') return;
      setResourcesInstant(false);
    };

    mainNav.addEventListener('show.bs.collapse',   onNavShow);
    mainNav.addEventListener('hidden.bs.collapse', onNavHidden);
    return () => {
      mainNav.removeEventListener('show.bs.collapse',   onNavShow);
      mainNav.removeEventListener('hidden.bs.collapse', onNavHidden);
    };
  }, []);

  // Track desktop dropdown open/close for the active class
  useEffect(() => {
    const toggle = dropdownToggleRef.current;
    if (!toggle) return;
    const onShow = () => setIsDropdownOpen(true);
    const onHide = () => setIsDropdownOpen(false);
    toggle.addEventListener('show.bs.dropdown', onShow);
    toggle.addEventListener('hide.bs.dropdown', onHide);
    return () => {
      toggle.removeEventListener('show.bs.dropdown', onShow);
      toggle.removeEventListener('hide.bs.dropdown', onHide);
    };
  }, []);

  return (
    <>
      {/* Desktop: full dropdown */}
      <li className="nav-item dropdown d-none d-lg-block">
        <a
          ref={dropdownToggleRef}
          className={`nav-link dropdown-toggle${(isResourcesActive || isDropdownOpen) ? ' active' : ''}`}
          href="#"
          role="button"
          data-bs-toggle="dropdown"
          aria-expanded="false">
          {item.label}
        </a>
        <ul className="dropdown-menu dropdown-menu-end navbar-dropdown-menu">
          {subItems.map((sub, i) => (
            <DropdownItem
              key={i}
              item={sub}
              isActive={sub.to != null && pathUnder(sub.to, pathname)}
            />
          ))}
        </ul>
      </li>

      {/* Mobile: accordion collapse */}
      <li className="nav-item d-lg-none">
        <a
          className={`nav-link d-flex align-items-center justify-content-between${(isResourcesActive || isExpanded) ? ' active' : ''}`}
          href="#mobileResourcesMenu"
          role="button"
          data-bs-toggle="collapse"
          aria-expanded={showAccordion ? 'true' : 'false'}
          aria-controls="mobileResourcesMenu">
          {item.label}
          <i className="ph ph-caret-down mobile-nav-caret"></i>
        </a>
        <div
          className={`collapse${showAccordion ? ' show' : ''}`}
          id="mobileResourcesMenu">
          <ul className="nav flex-column">
            {linkItems.map((sub, i) => {
              const label: string = sub.mobileLabel ?? sub.label ?? '';
              return sub.href ? (
                <li key={`mob-${i}`} className="nav-item">
                  <a
                    className="nav-link nav-link-sub d-flex align-items-center"
                    href={sub.href}
                    target={sub.target ?? '_blank'}
                    rel="noopener noreferrer"
                    onClick={() => setExternalClicked(true)}>
                    <span>{label}</span>
                    <i className="ph ph-arrow-up-right ms-2 mobile-nav-external-icon"></i>
                  </a>
                </li>
              ) : (
                <li key={`mob-${i}`} className="nav-item">
                  <Link
                    className={`nav-link nav-link-sub${isCurrentPath(sub.to, pathname) ? ' active' : ''}`}
                    to={sub.to ?? '/'}>
                    {label}
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

  const logoSrc = useBaseUrl('/images/airen_ci/OML_Letter_GGL.svg');
  const logoPng = useBaseUrl('/images/airen_ci/OML_Letter_GGL.png');

  return (
    <div className="container">
      {/* Brand structure mirrors legacy index.html: the <p> "(Formerly AirenSoft)"
          sits INSIDE the <picture> element so it stacks below the logo image as
          a subscript. Browsers tolerate non-spec children in <picture>; the
          rendering order matches the original site exactly. */}
      <Link className="navbar-brand d-flex align-items-center" to={brandTo}>
        <picture style={{pointerEvents: 'none'}}>
          <source srcSet={logoSrc} type="image/svg+xml" />
          <img src={logoPng} alt="OvenMedia Labs" className="sharp-img" />
          <p className="super-small text-end text-sub mb-0 opacity-75">
            (Formerly AirenSoft)
          </p>
        </picture>
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
