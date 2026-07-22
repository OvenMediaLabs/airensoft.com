/**
 * Items shown under the navbar "Resources" dropdown.
 *
 * Kept in a separate module (rather than inline in docusaurus.config.ts)
 * because Docusaurus's runtime themeConfig schema rejects unknown navbar
 * item `type` values (`divider`, `header`). The swizzled NavbarContent
 * reads from this module directly when it encounters a dropdown whose
 * `customMenu === 'resources'`, bypassing the schema validation entirely.
 */
export type ResourcesItem = {
  to?: string;
  href?: string;
  label?: string;
  // Phosphor icon class (e.g. 'ph-newspaper'). Renders as a small
  // leading glyph next to the label. Headers/dividers ignore this.
  icon?: string;
  target?: string;
  type?: 'divider' | 'header';
  // Label shown in the mobile accordion instead of `label`.
  // Use when the desktop label relies on a category header for context.
  mobileLabel?: string;
  // Label shown in the navbar toggle when this item is the active route.
  // Falls back to `label` when not set.
  navLabel?: string;
};

export const resourcesDropdownItems: ResourcesItem[] = [
  {type: 'header', label: 'From the team'},
  {to: '/blog', label: 'Blog', icon: 'ph-article'},
  {type: 'divider'},
  {type: 'header', label: 'Documentation'},
  // All three docs items intentionally share the same "open book" icon
  // so the column reads as "this group is documentation" and the label
  // is the only differentiator. Product-specific icons looked too much
  // like product logos.
  {to: '/docs/ome', label: 'OvenMediaEngine', icon: 'ph-book-open-text', navLabel: 'OvenMediaEngine Guide'},
  {
    to: '/docs/ome-enterprise',
    label: 'OvenMediaEngine Enterprise',
    icon: 'ph-book-open-text',
    navLabel: 'OvenMediaEngine Enterprise Guide',
  },
  {to: '/docs/ovenplayer', label: 'OvenPlayer', icon: 'ph-book-open-text', navLabel: 'OvenPlayer Guide'},
  {type: 'divider'},
  {type: 'header', label: 'Source & Community'},
  {
    label: 'GitHub',
    href: 'https://github.com/OvenMediaLabs',
    icon: 'ph-github-logo',
  },
  {
    label: 'Community Discussions',
    href: 'https://github.com/AirenSoft/OvenMediaEngine/discussions',
    icon: 'ph-chats-circle',
  },
];
