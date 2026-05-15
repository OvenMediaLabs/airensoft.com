/**
 * Marketing-design navbar. Replaces Docusaurus's default Navbar/Content with
 * the Bootstrap-based markup from the legacy index.html. Menu items still
 * come from themeConfig.navbar.items, so editing config drives the nav.
 *
 * Supports a single level of dropdown by giving a navbar item an `items` array
 * (Docusaurus's standard dropdown-type item schema). Bootstrap's dropdown JS
 * (loaded globally via headTags) handles the open/close behavior.
 */
import {type ReactNode} from 'react';
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

function DropdownItem({item}: {item: NavbarItem}) {
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
          className="dropdown-item dropdown-item-external d-flex align-items-center justify-content-between"
          href={item.href}
          target={item.target ?? '_blank'}
          rel="noopener noreferrer">
          <span>{item.label}</span>
          <i className="ph ph-arrow-up-right ms-2 small opacity-50"></i>
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link className="dropdown-item" to={item.to ?? '/'}>
        {item.label}
      </Link>
    </li>
  );
}

function Dropdown({item, isActive}: {item: NavbarItem; isActive: boolean}) {
  const subItems: NavbarItem[] =
    item.customMenu === 'resources'
      ? (resourcesDropdownItems as NavbarItem[])
      : (item.items ?? []);
  return (
    <li className="nav-item dropdown">
      <a
        className={`nav-link dropdown-toggle${isActive ? ' active' : ''}`}
        href="#"
        role="button"
        data-bs-toggle="dropdown"
        aria-expanded="false">
        {item.label}
      </a>
      <ul className="dropdown-menu dropdown-menu-end navbar-dropdown-menu">
        {subItems.map((sub, i) => (
          <DropdownItem key={i} item={sub} />
        ))}
      </ul>
    </li>
  );
}

function isCurrentPath(itemTo: string | undefined, pathname: string): boolean {
  if (!itemTo) return false;
  const normalize = (s: string) => (s.length > 1 ? s.replace(/\/$/, '') : s);
  return normalize(itemTo) === normalize(pathname);
}

function isDropdownActive(item: NavbarItem, pathname: string): boolean {
  if (!item.items) return false;
  return item.items.some((sub) => {
    if (sub.to && pathname.startsWith(sub.to)) return true;
    return false;
  });
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
