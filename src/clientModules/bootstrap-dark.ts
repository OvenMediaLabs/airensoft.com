/**
 * Sets `data-bs-theme="dark"` on <html> so Bootstrap 5's dark-mode variables
 * activate. The legacy marketing CSS was authored against this attribute,
 * so without it dark backgrounds and text colors revert to Bootstrap's
 * light defaults.
 *
 * Runs as a clientModule (after hydration). For pages rendered server-side,
 * there's a one-frame flash before this attaches — acceptable for now.
 */
export function onRouteDidUpdate() {
  // no-op; we only need to set the attribute once at first paint
}

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-bs-theme', 'dark');
}
