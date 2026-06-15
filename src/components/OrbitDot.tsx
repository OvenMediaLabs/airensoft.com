import { useEffect, useRef } from 'react';

type Props = {
  orbitColor: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default function OrbitDot({ orbitColor, className = '', style = {}, children }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timers: ReturnType<typeof setTimeout>[] = [];
    const clear = () => { timers.forEach(clearTimeout); timers = []; };

    const fire = () => {
      clear();
      el.classList.remove('orbit-pulse');
      void el.offsetWidth;

      timers.push(setTimeout(() => {
        el.classList.add('orbit-pulse');
        timers.push(setTimeout(() => {
          el.classList.remove('orbit-pulse');
        }, 1000));
      }, 450));
    };

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fire(); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clear();
    };
  }, [orbitColor]);

  return (
    <span
      ref={ref}
      className={`dot-orbit ${className}`}
      style={{ ...style, '--orbit-color': orbitColor } as React.CSSProperties}
    >
      {children}
    </span>
  );
}
