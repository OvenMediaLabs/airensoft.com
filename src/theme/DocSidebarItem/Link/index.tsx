/**
 * Faithful eject swizzle of @docusaurus/theme-classic
 * DocSidebarItem/Link (v3.10.1). The ONLY addition over upstream is the
 * <EnterpriseOnlyMarker/> rendered next to the label when the sidebar
 * item carries `customProps.enterpriseOnly` — set by the
 * `enterprise_only: true` frontmatter via src/lib/sidebar-section-headers.ts.
 *
 * Docusaurus ships no built-in sidebar badge, so the component is
 * ejected rather than wrapped (a wrapper cannot inject inline next to
 * the label). Keep this a faithful copy of upstream so it can be
 * re-diffed on a Docusaurus upgrade.
 */
import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type {Props} from '@theme/DocSidebarItem/Link';
import styles from './styles.module.css';

function LinkLabel({label}: {label: string}): ReactNode {
  return (
    <span title={label} className={styles.linkLabel}>
      {label}
    </span>
  );
}

// "Enterprise only" sidebar marker: a small crown glyph. The wording
// shows on hover via an instant CSS tooltip (`data-tip`, styled in
// custom.css) — the native `title` is intentionally NOT used because
// its show delay is browser-hardcoded (~1s) and not configurable.
// `aria-label` keeps the wording available to assistive tech.
function EnterpriseOnlyMarker(): ReactNode {
  return (
    <span
      className="enterprise-only-icon"
      data-tip="Enterprise only"
      aria-label="Enterprise only">
      <svg
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="currentColor"
        aria-hidden="true">
        <path d="M3 7l4.5 3.5L12 4l4.5 6.5L21 7l-1.6 11H4.6L3 7zm1.9 13h14.2v2H4.9v-2z" />
      </svg>
    </span>
  );
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const {href, label, className, autoAddBaseUrl} = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  const enterpriseOnly = item.customProps?.enterpriseOnly === true;
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
      )}
      key={label}>
      <Link
        className={clsx(
          'menu__link',
          !isInternalLink && styles.menuExternalLink,
          {
            'menu__link--active': isActive,
          },
        )}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}>
        <LinkLabel label={label} />
        {enterpriseOnly && <EnterpriseOnlyMarker />}
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
