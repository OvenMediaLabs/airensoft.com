// When the site runs in preview mode (started by docs-site/preview.sh
// with OML_PREVIEW_SOURCE=ome|ome-enterprise|ovenplayer), the editor is
// previewing docs and shouldn't see the marketing home. Redirect any
// visit to `/` straight to the relevant `/docs/<source>/` landing.
//
// Other routes are intentionally left alone — typing /ome directly
// still works, but a fresh tab opens at the docs landing.
import siteConfig from '@generated/docusaurus.config';

const PREVIEW_SOURCE = (siteConfig.customFields as Record<string, string> | undefined)?.previewSource || '';

function redirectIfMarketingRoot(): void {
  if (!PREVIEW_SOURCE) return;
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== '/') return;
  window.location.replace(`/docs/${PREVIEW_SOURCE}/`);
}

export function onRouteDidUpdate(): void {
  redirectIfMarketingRoot();
}

redirectIfMarketingRoot();
