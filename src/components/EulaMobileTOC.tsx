import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

const SECTIONS = [
  { id: 'preamble', label: 'Important Notice' },
  { id: 'sec-0',   label: '0. Definitions' },
  { id: 'sec-1',   label: '1. Agreement & Scope' },
  { id: 'sec-2',   label: '2. License Grant' },
  { id: 'sec-3',   label: '3. Restrictions' },
  { id: 'sec-4',   label: '4. Support Program' },
  { id: 'sec-5',   label: '5. Open Source' },
  { id: 'sec-6',   label: '6. Fees & Payment' },
  { id: 'sec-7',   label: '7. Confidentiality' },
  { id: 'sec-8',   label: '8. Warranties' },
  { id: 'sec-9',   label: '9. Liability' },
  { id: 'sec-10',  label: '10. Compliance & Export' },
  { id: 'sec-11',  label: '11. Term & Termination' },
  { id: 'sec-12',  label: '12. Governing Law' },
  { id: 'sec-13',  label: '13. Notices' },
  { id: 'sec-14',  label: '14. Miscellaneous' },
  { id: 'app-a',   label: 'Appendix A' },
  { id: 'app-b',   label: 'Appendix B' },
] as const;

export default function EulaMobileTOC(): ReactNode {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [clickOverrideId, setClickOverrideId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const overrideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSkipsRef = useRef(0);

  useEffect(() => {
    const getNavH = () =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height').trim()) || 78;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const sync = () => {
      const scrollY = window.scrollY;
      if (scrollY < 10) {
        if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
        setActiveId(null);
        return;
      }
      const threshold = Math.max(getNavH() + 32, window.innerHeight * 0.4);
      let winner: string | null = null;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= threshold) winner = id;
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => setActiveId(winner), 80);
    };

    window.addEventListener('scroll', sync, { passive: true });
    document.body.addEventListener('scroll', sync, { passive: true });
    sync();
    return () => {
      window.removeEventListener('scroll', sync);
      document.body.removeEventListener('scroll', sync);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (clickOverrideId === null || activeId === null) return;
    if (pendingSkipsRef.current > 0) {
      pendingSkipsRef.current--;
      return;
    }
    setClickOverrideId(null);
    if (overrideTimer.current) { clearTimeout(overrideTimer.current); overrideTimer.current = null; }
  }, [activeId, clickOverrideId]);

  const handleLinkClick = useCallback((id: string) => {
    setClickOverrideId(id);
    pendingSkipsRef.current = 1;
    if (overrideTimer.current) clearTimeout(overrideTimer.current);
    overrideTimer.current = setTimeout(() => setClickOverrideId(null), 10000);
    setOpen(false);
  }, []);

  const displayActiveId = clickOverrideId ?? activeId;
  const activeLabel = SECTIONS.find(s => s.id === displayActiveId)?.label;

  return (
    <div ref={ref} className="eula-toc-mobile d-lg-none">
      <button
        className="eula-toc-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Page contents"
        type="button"
      >
        <span className="eula-toc-current">{activeLabel ?? 'Contents'}</span>
        <i className={`ph-bold ph-caret-down eula-toc-chevron${open ? ' open' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <nav className="eula-toc-nav" aria-label="Page contents">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`eula-toc-link${displayActiveId === id ? ' active' : ''}`}
              onClick={() => handleLinkClick(id)}
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
