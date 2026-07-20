import type {ClientModule} from '@docusaurus/types';

type Cleanup = () => void;
let activeCleanups: Cleanup[] = [];

function runCleanups() {
  for (const fn of activeCleanups) {
    try { fn(); } catch { /* ignore */ }
  }
  activeCleanups = [];
}

function updateMask(row: HTMLElement) {
  const sl = row.scrollLeft;
  const max = row.scrollWidth - row.clientWidth;
  if (max <= 2) {
    row.style.maskImage = 'none';
    row.style.webkitMaskImage = 'none';
    return;
  }
  const atStart = sl <= 2;
  const atEnd = sl >= max - 2;
  const m =
    atStart && atEnd ? 'none'
    : atStart ? 'linear-gradient(to right, black 95%, transparent 100%)'
    : atEnd   ? 'linear-gradient(to right, transparent 0%, black 5%, black 100%)'
    :           'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)';
  row.style.maskImage = m;
  row.style.webkitMaskImage = m;
}

function init() {
  runCleanups();

  // Only activate on mobile breakpoint — avoids leaking inline styles to desktop
  if (!window.matchMedia('(max-width: 991px)').matches) return;

  const rows = document.querySelectorAll<HTMLElement>('.mobile-horizontal-scroll');
  rows.forEach(row => {
    const cards = Array.from(row.children).filter(
      el => /\bcol/.test((el as HTMLElement).className)
    ) as HTMLElement[];
    const count = cards.length;
    if (count < 2) return;

    // ── Dot indicators ───────────────────────────────────────────
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'scroll-dots';
    const dots = cards.map((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'scroll-dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `${i + 1} / ${count}`);
      btn.addEventListener('click', () => {
        const cardRect = cards[i].getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        row.scrollBy({left: cardRect.left - rowRect.left - 15, behavior: 'smooth'});
      });
      dotsWrap.appendChild(btn);
      return btn;
    });
    row.after(dotsWrap);

    // ── Active dot via IntersectionObserver ──────────────────────
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.intersectionRatio >= 0.5) {
          const idx = cards.indexOf(entry.target as HTMLElement);
          if (idx !== -1) dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }
      });
    }, {root: row, threshold: 0.5});
    cards.forEach(c => io.observe(c));

    // ── Mask ─────────────────────────────────────────────────────
    updateMask(row);
    const onScroll = () => updateMask(row);
    row.addEventListener('scroll', onScroll, {passive: true});

    activeCleanups.push(() => {
      io.disconnect();
      row.removeEventListener('scroll', onScroll);
      dotsWrap.remove();
      row.style.maskImage = '';
      row.style.webkitMaskImage = '';
    });
  });
}

// Re-init (with cleanup) whenever the mobile breakpoint is crossed
if (typeof window !== 'undefined') {
  window.matchMedia('(max-width: 991px)').addEventListener('change', () => init());
}

const module: ClientModule = {
  onRouteDidUpdate() {
    setTimeout(init, 50);
  },
};

export default module;
export const {onRouteDidUpdate} = module;
