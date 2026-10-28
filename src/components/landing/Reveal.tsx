import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: ReactNode;
  /** Atraso em ms, para escalonar itens de uma mesma fileira. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li';
}

/**
 * Revela o conteúdo quando ele entra na tela — mas **nasce visível**.
 *
 * Esta é a diferença que importa: o padrão antigo da landing montava os
 * elementos já em `opacity: 0` esperando um observer. Como o prerender
 * (Puppeteer) captura o HTML sem rolar a página, 42 elementos — incluindo
 * o <h1> — iam para o HTML indexado invisíveis.
 *
 * Aqui o estado escondido só é aplicado depois que o componente monta no
 * navegador, ou seja, depois que sabemos que o JS está rodando. No HTML
 * pré-renderizado, e para quem navega sem JS, tudo aparece normalmente.
 */
export function Reveal({ children, delay = 0, className, as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }

    setArmed(true);
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setShown(true);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );
    observer.observe(el);

    // Se por algum motivo o observer não disparar, mostra assim mesmo.
    const failsafe = window.setTimeout(() => setShown(true), 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      className={cn(
        armed && 'motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out',
        armed && !shown && 'opacity-0 motion-safe:translate-y-4',
        className,
      )}
      style={armed && !shown ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
