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
  target?: string;
  type?: 'divider' | 'header';
};

export const resourcesDropdownItems: ResourcesItem[] = [
  {type: 'header', label: 'Documentation'},
  {to: '/docs/ome', label: 'OvenMediaEngine'},
  {to: '/docs/ome-enterprise', label: 'OvenMediaEngine Enterprise'},
  {to: '/docs/ovenplayer', label: 'OvenPlayer'},
  {to: '/blog', label: 'Blog'},
  {type: 'divider'},
  {type: 'header', label: 'Source & Community'},
  {label: 'GitHub', href: 'https://github.com/AirenSoft'},
  {label: 'OvenMediaEngine on GitHub', href: 'https://github.com/AirenSoft/OvenMediaEngine'},
  {label: 'OvenPlayer on GitHub', href: 'https://github.com/AirenSoft/OvenPlayer'},
  {label: 'OvenLiveKit on GitHub', href: 'https://github.com/AirenSoft/OvenLiveKit-Web'},
  {label: 'Community Discussions', href: 'https://github.com/AirenSoft/OvenMediaEngine/discussions'},
];
