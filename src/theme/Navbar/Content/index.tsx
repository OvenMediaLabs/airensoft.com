/**
 * Marketing-design navbar. Replaces Docusaurus's default Navbar/Content with
 * the Bootstrap-based markup from the legacy index.html. Menu items still
 * come from themeConfig.navbar.items, so editing config drives the nav.
 *
 * The outer <nav class="navbar ..."> markup intentionally matches the legacy
 * structure so existing style.css rules (navbar-custom, navbar-brand, etc.)
 * apply without modification.
 */
import {type ReactNode} from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useLocation} from '@docusaurus/router';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';

type NavbarItem = {
  to?: string;
  href?: string;
  label?: string;
  position?: 'left' | 'right';
  target?: string;
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

function isCurrentPath(itemTo: string | undefined, pathname: string): boolean {
  if (!itemTo) return false;
  // Strip trailing slash for comparison
  const normalize = (s: string) => (s.length > 1 ? s.replace(/\/$/, '') : s);
  return normalize(itemTo) === normalize(pathname);
}

export default function NavbarContent(): ReactNode {
  const {navbar} = useThemeConfig();
  const items = (navbar.items ?? []) as NavbarItem[];
  const {pathname} = useLocation();

  const logoSrc = useBaseUrl('/images/airen_ci/OML_Letter_GGL.svg');
  const logoPng = useBaseUrl('/images/airen_ci/OML_Letter_GGL.png');

  return (
    <div className="container">
      {/* Brand structure mirrors legacy index.html: the <p> "(Formerly AirenSoft)"
          sits INSIDE the <picture> element so it stacks below the logo image as
          a subscript. Browsers tolerate non-spec children in <picture>; the
          rendering order matches the original site exactly. */}
      <Link className="navbar-brand d-flex align-items-center" to="/">
        <picture style={{pointerEvents: 'none'}}>
          <source srcSet={logoSrc} type="image/svg+xml" />
          <img src={logoPng} alt="OvenMedia Labs" className="sharp-img" />
          <p className="super-small text-end text-sub mb-0 opacity-75">
            (Formerly AirenSoft)
          </p>
        </picture>
      </Link>

      <button
        className="navbar-toggler"
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

      <div className="collapse navbar-collapse" id="mainNav">
        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
          {items.map((item, i) => (
            <li key={i} className="nav-item">
              <NavLink item={item} isActive={isCurrentPath(item.to, pathname)} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
