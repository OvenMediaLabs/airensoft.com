/**
 * Port of the legacy /assets/js/main.js into a Docusaurus clientModule.
 *
 * Why this exists:
 *   The original main.js attaches `DOMContentLoaded` listeners that run once
 *   at page load. In a Docusaurus SPA, that fires before React hydrates the
 *   layout, so `document.querySelector('.navbar-custom')` returns null and
 *   later scroll handlers crash on `null.classList`. It also never re-runs
 *   on client-side route changes, so animations and the scroll-to-top button
 *   stop working after the first navigation.
 *
 * What this does:
 *   - Re-initializes navbar scroll behavior, reveal-up animations, and the
 *     scroll-to-top button on every route change via `onRouteDidUpdate`.
 *   - Cleans up event listeners on route change to avoid leaks.
 *   - Null-guards every DOM lookup so a missing element on a given route
 *     never throws.
 *
 * Not ported (intentional):
 *   - Medium RSS blog grid fetcher: replaced by Docusaurus blog plugin.
 *   - Notice modal: legacy exhibition banner, will be re-introduced as an
 *     MDX component when needed.
 *   - EULA section observer: only relevant if/when the EULA page is ported.
 */

import type {ClientModule} from '@docusaurus/types';

type Cleanup = () => void;
let activeCleanups: Cleanup[] = [];

function runCleanups() {
  for (const fn of activeCleanups) {
    try {
      fn();
    } catch {
      // ignore: best effort
    }
  }
  activeCleanups = [];
}

function initNavbarScroll(): Cleanup | undefined {
  const navbar = document.querySelector<HTMLElement>('.navbar-custom');
  if (!navbar) return;

  const navbarCollapse = document.getElementById('mainNav');

  const onScroll = () => {
    const scrollPosition =
      window.scrollY ||
      document.body.scrollTop ||
      document.documentElement.scrollTop;

    if (scrollPosition > 20) {
      navbar.classList.add('scrolled');
    } else if (
      !navbarCollapse ||
      (!navbarCollapse.classList.contains('show') &&
        !navbarCollapse.classList.contains('collapsing'))
    ) {
      navbar.classList.remove('scrolled');
    }

    const scrollTopBtn = document.getElementById('btnScrollTop');
    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle('show', scrollPosition > 400);
    }
  };

  window.addEventListener('scroll', onScroll, {passive: true});
  document.body.addEventListener('scroll', onScroll, {passive: true});
  onScroll();

  return () => {
    window.removeEventListener('scroll', onScroll);
    document.body.removeEventListener('scroll', onScroll);
  };
}

function initRevealAnimations(): Cleanup | undefined {
  const targets = document.querySelectorAll<HTMLElement>(
    '.reveal-up, .progress-bar',
  );
  if (targets.length === 0) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        if (el.classList.contains('reveal-up')) {
          el.classList.add('active');
          obs.unobserve(el);
        }
        if (el.classList.contains('progress-bar')) {
          const aria = el.getAttribute('aria-valuenow');
          if (aria) el.style.width = `${aria}%`;
          obs.unobserve(el);
        }
      }
    },
    {threshold: 0.15},
  );

  targets.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

function initScrollToTop(): Cleanup | undefined {
  const btn = document.getElementById('btnScrollTop');
  if (!btn) return;

  const handler = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
    document.body.scrollTo({top: 0, behavior: 'smooth'});
  };
  btn.addEventListener('click', handler);
  return () => btn.removeEventListener('click', handler);
}

function reinitialize() {
  runCleanups();
  // Defer one frame so React's hydration commit settles before we query.
  requestAnimationFrame(() => {
    [
      initNavbarScroll(),
      initRevealAnimations(),
      initScrollToTop(),
    ]
      .filter((fn): fn is Cleanup => typeof fn === 'function')
      .forEach((fn) => activeCleanups.push(fn));
  });
}

const module: ClientModule = {
  onRouteDidUpdate() {
    reinitialize();
  },
};

if (typeof window !== 'undefined') {
  // Initial run for the first page load (onRouteDidUpdate also fires here
  // in modern Docusaurus, but kept defensively for older builds).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reinitialize, {once: true});
  } else {
    reinitialize();
  }
}

export default module;
