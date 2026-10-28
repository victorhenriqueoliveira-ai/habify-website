import { useEffect, useState } from 'react';

/**
 * Barra fina no topo que acompanha o quanto da página já foi lida.
 *
 * Fica acima da nav (que é sticky z-50) e nasce em 0 — não há estado
 * escondido nem conteúdo dependendo dela, então o HTML pré-renderizado
 * não é afetado.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-linear motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
