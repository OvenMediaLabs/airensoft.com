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

/**
 * Close Bootstrap dropdown (desktop Resources menu) and navbar collapse
 * (mobile hamburger menu) when the user clicks / taps outside the navbar.
 *
 * Bootstrap closes its *dropdown* on outside clicks by default, but the
 * navbar *collapse* (#mainNav) has no such built-in behaviour. We handle
 * both here so a single listener covers both cases cleanly.
 */
function initNavbarOutsideClick(): Cleanup | undefined {
  const navbar = document.querySelector<HTMLElement>('.navbar-custom');
  if (!navbar) return;

  // Backdrop element — absorbs clicks when the mobile menu is open.
  const backdrop = document.createElement('div');
  backdrop.style.cssText =
    'position:fixed;inset:0;top:64px;z-index:998;display:none;';

  const closeMenu = () => {
    const bs = (window as any).bootstrap;
    if (!bs) return;
    const mainNav = document.getElementById('mainNav');
    if (mainNav?.classList.contains('show')) {
      const inst =
        bs.Collapse.getInstance(mainNav) ??
        new bs.Collapse(mainNav, {toggle: false});
      inst.hide();
    }
    const openToggle = navbar.querySelector<HTMLElement>(
      '[data-bs-toggle="dropdown"][aria-expanded="true"]',
    );
    if (openToggle) {
      const inst =
        bs.Dropdown.getInstance(openToggle) ?? new bs.Dropdown(openToggle);
      inst.hide();
    }
    backdrop.style.display = 'none';
  };

  backdrop.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
  });
  document.body.appendChild(backdrop);

  // Show/hide backdrop whenever the mobile menu toggles.
  const mainNav = document.getElementById('mainNav');
  const onMenuToggle = () => {
    backdrop.style.display = mainNav?.classList.contains('show') ? 'block' : 'none';
  };
  mainNav?.addEventListener('show.bs.collapse', onMenuToggle);
  mainNav?.addEventListener('hide.bs.collapse', onMenuToggle);
  mainNav?.addEventListener('shown.bs.collapse', onMenuToggle);
  mainNav?.addEventListener('hidden.bs.collapse', onMenuToggle);

  const onOutsideClick = (e: MouseEvent) => {
    if (navbar.contains(e.target as Node)) return;
    closeMenu();
  };

  // Close any open menu when the search input is focused.
  const onSearchFocus = () => closeMenu();
  const searchInput = navbar.querySelector<HTMLElement>('.navbar__search-input');
  searchInput?.addEventListener('focus', onSearchFocus);

  // When resizing to desktop, silently reset mobile-only state without
  // firing Bootstrap events that would re-trigger our own listeners.
  const mq = window.matchMedia('(max-width: 991px)');
  const onBreakpoint = (e: MediaQueryListEvent) => {
    if (!e.matches) {
      requestAnimationFrame(() => {
        backdrop.style.display = 'none';
        if (mainNav) {
          mainNav.classList.remove('show', 'collapsing');
          mainNav.style.removeProperty('height');
        }
        const toggler = navbar.querySelector<HTMLElement>('[data-bs-target="#mainNav"]');
        if (toggler) toggler.setAttribute('aria-expanded', 'false');
      });
    }
  };
  mq.addEventListener('change', onBreakpoint);

  document.addEventListener('click', onOutsideClick);
  return () => {
    document.removeEventListener('click', onOutsideClick);
    searchInput?.removeEventListener('focus', onSearchFocus);
    mq.removeEventListener('change', onBreakpoint);
    mainNav?.removeEventListener('show.bs.collapse', onMenuToggle);
    mainNav?.removeEventListener('hide.bs.collapse', onMenuToggle);
    mainNav?.removeEventListener('shown.bs.collapse', onMenuToggle);
    mainNav?.removeEventListener('hidden.bs.collapse', onMenuToggle);
    backdrop.remove();
  };
}


/**
 * On mobile, position the search results dropdown fixed below the navbar.
 * Uses focus/input events on the search input to find and style the dropdown.
 */
/**
 * On mobile: position search dropdown fixed, and show a backdrop that
 * absorbs taps so the user can't accidentally trigger background elements.
 */
/**
 * Mobile search backdrop + dropdown positioning.
 * Always initializes and responds to viewport changes via matchMedia.
 */
function initSearchDropdownMobile(): Cleanup | undefined {
  const navbar = document.querySelector<HTMLElement>('.navbar-custom');
  if (!navbar) return;
  const searchInput = navbar.querySelector<HTMLElement>('.navbar__search-input');
  if (!searchInput) return;

  const mq = window.matchMedia('(max-width: 991px)');

  const backdrop = document.createElement('div');
  backdrop.className = 'search-backdrop';
  document.body.appendChild(backdrop);

  const showBackdrop = () => {
    if (!mq.matches) return;
    document.body.classList.add('mobile-search-active');
    backdrop.classList.add('active');
  };

  const hideBackdrop = () => {
    document.body.classList.remove('mobile-search-active');
    backdrop.classList.remove('active');
  };

  backdrop.addEventListener('mousedown', (e) => {
    e.preventDefault();
    searchInput.blur();
    hideBackdrop();
  });
  backdrop.addEventListener('touchstart', (e) => {
    e.preventDefault();
    searchInput.blur();
    hideBackdrop();
  }, {passive: false});

  searchInput.addEventListener('focus', showBackdrop);
  searchInput.addEventListener('blur', hideBackdrop);
  searchInput.addEventListener('input', () => {
    if (mq.matches) {
      document.body.classList.add('mobile-search-active');
    }
  });

  // Respond to viewport changes without page reload.
  const onBreakpoint = (e: MediaQueryListEvent) => {
    if (!e.matches) {
      // Switched to desktop — tear down mobile state.
      hideBackdrop();
      searchInput.blur();
    }
    // Switched to mobile — next focus/input event will activate.
  };
  mq.addEventListener('change', onBreakpoint);

  return () => {
    searchInput.removeEventListener('focus', showBackdrop);
    searchInput.removeEventListener('blur', hideBackdrop);
    mq.removeEventListener('change', onBreakpoint);
    backdrop.remove();
  };
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

    // Progressive tint: 8% at the top → 82% at 250 px+ of scroll
    const tintPct = 8 + Math.min(scrollPosition / 250, 1) * 74;
    navbar.style.setProperty('--navbar-tint-pct', `${Math.round(tintPct)}%`);

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

/**
 * EULA / legal page sidebar:
 *   1. Dynamic `top` — centers the sidebar in the available viewport space
 *      (below navbar). If the sidebar is taller than the viewport, falls back
 *      to a hidden-scrollbar overflow so all items are reachable without a
 *      visible scrollbar.
 *   2. Active-state tracking — a passive scroll listener marks the nav link
 *      whose target section is currently visible at the top of the viewport.
 *      Clicking a link immediately marks it active too.
 */
function initDocSidebar(): Cleanup | undefined {
  const sidebar = document.querySelector<HTMLElement>('.doc-sidebar');
  if (!sidebar) return;

  const links = Array.from(
    sidebar.querySelectorAll<HTMLAnchorElement>('.doc-nav-link'),
  );
  if (links.length === 0) return;

  // Build ordered list of section elements referenced by the nav links.
  const sectionEls = links
    .map((l) => {
      const href = l.getAttribute('href');
      return href?.startsWith('#') ? document.getElementById(href.slice(1)) : null;
    })
    .filter((el): el is HTMLElement => el !== null);

  // ── 1. Dynamic top positioning ───────────────────────────────────────
  const updatePosition = () => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--navbar-height')
      .trim();
    const navH = parseFloat(raw) || 78;
    const vh = window.innerHeight;
    const sidebarH = sidebar.scrollHeight;
    const gap = 24;
    const available = vh - navH - gap * 2;

    if (sidebarH <= available) {
      // Fits: center vertically in the available space.
      const top = navH + Math.max(gap, Math.round((available - sidebarH) / 2));
      sidebar.style.top = `${top}px`;
      sidebar.style.maxHeight = '';
      (sidebar.style as any).overflowY = '';
      (sidebar.style as any).scrollbarWidth = '';
    } else {
      // Doesn't fit: anchor at top + allow scrolling, but hide the scrollbar.
      sidebar.style.top = `${navH + gap}px`;
      sidebar.style.maxHeight = `${available}px`;
      (sidebar.style as any).overflowY = 'auto';
      (sidebar.style as any).scrollbarWidth = 'none';
    }
  };

  updatePosition();
  window.addEventListener('resize', updatePosition, { passive: true });

  // ── 2. Active state ──────────────────────────────────────────────────
  let currentActive: string | null = null;

  // ID of the section the user just clicked. While set, syncActive skips
  // updates whose winner differs from this target — preventing the smooth-
  // scroll animation from overwriting the clicked item mid-flight.
  // Cleared as soon as the scroll reaches the target, or after a 2 s
  // safety timeout (handles very long pages or instant-scroll browsers).
  let clickTarget: string | null = null;
  let clickSafetyTimer: ReturnType<typeof setTimeout> | null = null;

  const setActive = (id: string | null) => {
    if (id === currentActive) return;
    currentActive = id;
    links.forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', !!id && href === `#${id}`);
    });
  };

  // Find the last section whose top is at or above the sticky threshold.
  const syncActive = () => {
    const cs = getComputedStyle(document.documentElement);
    const navH = parseFloat(cs.getPropertyValue('--navbar-height').trim()) || 78;
    // A section becomes "active" once its heading crosses the upper 40 % of
    // the viewport — generous enough to feel responsive while scrolling, yet
    // tight enough not to activate sections that are barely peeking in from
    // the bottom. Minimum is navbar + 32 px so we never undercut the navbar.
    const threshold = Math.max(navH + 32, window.innerHeight * 0.4);

    let winner: string | null = null;
    for (const section of sectionEls) {
      if (section.getBoundingClientRect().top <= threshold) {
        winner = section.id;
      } else {
        break;
      }
    }

    // While scrolling to a clicked target, hold off until the scroll
    // actually reaches that section (winner catches up to clickTarget).
    if (clickTarget !== null && winner !== clickTarget) return;
    if (clickTarget !== null) {
      // Scroll reached the target — release the lock.
      clickTarget = null;
      if (clickSafetyTimer) { clearTimeout(clickSafetyTimer); clickSafetyTimer = null; }
    }
    setActive(winner);
  };

  window.addEventListener('scroll', syncActive, { passive: true });
  document.body.addEventListener('scroll', syncActive, { passive: true });
  syncActive(); // set initial active on page load / route change

  // Clicking a link immediately activates it and sets clickTarget so that
  // syncActive won't override it until the scroll animation has caught up.
  const onLinkClick = (e: MouseEvent) => {
    const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
    if (!href?.startsWith('#')) return;
    const id = href.slice(1);
    setActive(id);
    clickTarget = id;
    if (clickSafetyTimer) clearTimeout(clickSafetyTimer);
    // Safety release: clear the lock after 2 s regardless of scroll state.
    clickSafetyTimer = setTimeout(() => {
      clickTarget = null;
      clickSafetyTimer = null;
      syncActive();
    }, 2000);
  };
  links.forEach((l) => l.addEventListener('click', onLinkClick));

  return () => {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', syncActive);
    document.body.removeEventListener('scroll', syncActive);
    links.forEach((l) => l.removeEventListener('click', onLinkClick));
    if (clickSafetyTimer) clearTimeout(clickSafetyTimer);
  };
}

/**
 * Click-to-copy anchor URL for elements with `.copy-title`.
 *
 * On click, builds `origin + pathname + '#' + id` and copies it to the
 * clipboard, then pops up the `.copy-dialog` toast for ~2 seconds.
 *
 * If the clicked element (or its heading ancestor) has no `id`, one is
 * auto-generated from its text content so every section is reachable.
 *
 * The toast element (#copyUrlDialog) is injected once and persists
 * across SPA route changes — only the click listeners are torn down and
 * re-attached on each route update.
 */
function initCopyTitle(): Cleanup | undefined {
  const targets = document.querySelectorAll<HTMLElement>('.copy-title');
  if (targets.length === 0) return;

  // ── Singleton toast ──────────────────────────────────────────────────
  let dialog = document.getElementById('copyUrlDialog') as HTMLElement | null;
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'copyUrlDialog';
    dialog.className = 'copy-dialog';
    dialog.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"' +
      ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="20 6 9 17 4 12"/></svg><span>URL Copied</span>';
    document.body.appendChild(dialog);
  }

  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  const showToast = () => {
    if (!dialog) return;
    dialog.classList.add('show');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      dialog!.classList.remove('show');
      hideTimer = null;
    }, 1400);
  };

  // ── Helpers ──────────────────────────────────────────────────────────
  const toSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const HEADINGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

  // For inline elements (spans etc.) inside a heading, walk up to the heading.
  const getAnchorEl = (el: HTMLElement): HTMLElement => {
    if (HEADINGS.has(el.tagName)) return el;
    let p: HTMLElement | null = el.parentElement;
    while (p) {
      if (HEADINGS.has(p.tagName)) return p;
      p = p.parentElement;
    }
    return el;
  };

  // ── Attach listeners ─────────────────────────────────────────────────
  const handlers: Array<[HTMLElement, () => void]> = [];

  targets.forEach((target) => {
    const anchor = getAnchorEl(target);

    // Auto-assign an id if the anchor element doesn't have one yet.
    if (!anchor.id) {
      const slug = toSlug(anchor.textContent ?? '');
      if (slug) anchor.id = slug;
    }
    if (!anchor.id) return; // can't build a hash URL without an id

    const handler = () => {
      const url =
        window.location.origin +
        window.location.pathname +
        '#' +
        anchor.id;

      const fallback = () => {
        // execCommand fallback for insecure contexts or older browsers.
        const ta = document.createElement('textarea');
        ta.value = url;
        Object.assign(ta.style, {
          position: 'fixed',
          opacity: '0',
          pointerEvents: 'none',
        });
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch {
          // ignore: best effort
        }
        document.body.removeChild(ta);
        showToast();
      };

      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(showToast).catch(fallback);
      } else {
        fallback();
      }
    };

    target.addEventListener('click', handler);
    handlers.push([target, handler]);
  });

  return () => {
    handlers.forEach(([el, fn]) => el.removeEventListener('click', fn));
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (dialog) dialog.classList.remove('show');
  };
}

function reinitialize() {
  runCleanups();
  // Defer one frame so React's hydration commit settles before we query.
  requestAnimationFrame(() => {
    [
      initNavbarOutsideClick(),
      initSearchDropdownMobile(),
      initNavbarScroll(),
      initRevealAnimations(),
      initScrollToTop(),
      initCopyTitle(),
      initDocSidebar(),
    ]
      .filter((fn): fn is Cleanup => typeof fn === 'function')
      .forEach((fn) => activeCleanups.push(fn));
  });
}

const module: ClientModule = {
  onRouteDidUpdate({ location }) {
    reinitialize();
    // After SPA navigation, scroll to hash anchor once the new page renders.
    // A double rAF + short timeout lets React commit and layout before we try
    // scrollIntoView — otherwise the element exists but is still at y=0.
    if (location.hash) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const id = decodeURIComponent(location.hash.slice(1));
            const target = document.getElementById(id);
            if (target) {
              const section = target.closest('section');
              // Three cases:
              // 1. id is on the <section> itself (full-page marketing sections)
              //    → scroll to the section so the whole section is visible.
              // 2. id is on an element *inside* a section (EULA divs, marketing
              //    h2/h3 inside full-page sections) → scroll to the element
              //    directly; scroll-margin-top handles the navbar offset.
              // 3. id is on a heading with no section ancestor (docs/blog) →
              //    same: scroll to element; html scroll-padding-top (= navbar
              //    height) handles the navbar offset.
              const scrollTarget = section === target ? section : target;
              scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 80);
        });
      });
    }
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
