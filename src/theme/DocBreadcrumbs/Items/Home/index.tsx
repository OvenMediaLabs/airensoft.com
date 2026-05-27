/**
 * Swizzled to remove the Home icon from doc breadcrumbs.
 *
 * Docusaurus prepends a house-icon link (→ site root "/") as the first
 * breadcrumb item. Our docs live inside the site, so the Home icon just
 * takes users away from the docs to the marketing homepage — unhelpful
 * and inconsistent with the breadcrumb's purpose of showing the current
 * position within the docs hierarchy.
 *
 * Returning null removes the item from the DOM entirely. The breadcrumb
 * then starts from the first real docs ancestor:
 *   [Section] › [Category] › [Current Page]
 */
export default function HomeBreadcrumbItem(): null {
  return null;
}
