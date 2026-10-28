import { useEffect, useRef, useState } from 'react';

interface CountUpValueProps {
  /** Valor final. A contagem começa do zero quando entra na tela. */
  value: number;
  /** Formata cada quadro — ex.: (v) => `R$ ${formatBRL(v)}`. */
  format: (value: number) => string;
  durationMs?: number;
  className?: string;
}

/**
 * Conta até o valor quando entra na tela.
 *
 * Renderiza o valor final já no primeiro quadro — então o HTML
 * pré-renderizado e quem navega sem JS veem o número certo, e nunca um
 * zero. A contagem só é armada depois que o componente monta no
 * navegador.
 */
export function CountUpValue({ value, format, durationMs = 1100, className }: CountUpValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const el = ref.current;
    if (!el) return;

    let frame = 0;
    setDisplay(0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();

          const start = performance.now();
          const tick = (now: number) => {
            const k = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - k, 3);
            setDisplay(value * eased);
            if (k < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
