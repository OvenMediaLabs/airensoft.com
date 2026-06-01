import React, { useState, useEffect } from 'react';

const NAVBAR_H = 78;

const PRODUCTS = [
  { href: '#enterprise', label: 'OME Enterprise',  color: '#7dd3fc', bg: 'rgba(125, 211, 252, 0.15)', border: 'rgba(125, 211, 252, 0.3)' },
  { href: '#marketplace', label: 'OME for AWS',          color: '#fbbe24', bg: 'rgba(251, 190, 36, 0.15)',  border: 'rgba(251, 190, 36, 0.3)'  },
  { href: '#ome',        label: 'OvenMediaEngine',  color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.3)'  },
  { href: 'mailto:contact@ovenmedialabs.com?subject=[OME Enterprise] Consultation Request', label: 'sales', color: '#C5A38E', bg: 'rgba(197, 163, 142, 0.15)', border: 'rgba(197, 163, 142, 0.3)', desktopOnly: true },
];

export default function OmeProductNav(): React.ReactElement {
    const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enterprise = document.getElementById('enterprise');
    if (!enterprise) return;

    const onScroll = () => {
      const threshold = enterprise.offsetTop - NAVBAR_H - 200;
      setVisible(window.scrollY >= threshold);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const positionStyle = { top: 'calc(78px + 8px)' };
  const slideHidden = 'translateX(-50%) translateY(-14px)';

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        ...positionStyle,
        width: 'min(92vw, 560px)',
        transform: visible ? 'translateX(-50%) translateY(0)' : slideHidden,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'stretch',
        gap: '6px',
        padding: '5px 6px',
        background: 'rgba(5, 7, 10, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '999px',
        border: '1px solid rgba(233, 237, 246, 0.1)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        transition: 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {PRODUCTS.map(({ href, label, color, bg, border, desktopOnly }, i) => (
        <React.Fragment key={href}>
          {desktopOnly && (
            <div className="d-none d-md-block" style={{width: '1px', background: 'rgba(233,237,246,0.12)', margin: '4px 8px'}} />
          )}
          <a
            href={href}
            className={desktopOnly ? 'd-none d-md-flex' : undefined}
          style={{
            flex: desktopOnly ? '0 0 auto' : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: desktopOnly ? '7px 14px' : '7px 8px',
            borderRadius: '999px',
            background: bg,
            border: desktopOnly ? `1.5px solid ${border}` : `1px solid ${border}`,
            color,
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
            textAlign: 'center',
          }}
        >
          {href === '#ome' ? (
            <>
              <span className="d-none d-md-inline">OvenMediaEngine</span>
              <span className="d-md-none">OME</span>
            </>
          ) : label === 'sales' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'block', flexShrink: 0, transform: 'rotate(0deg)'}}>
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9Z" />
            </svg>
          ) : label}
          </a>
        </React.Fragment>
      ))}
    </div>
  );
}
