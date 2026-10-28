import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HabifyMark } from './HabifyMark';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Portfólio', href: '#portfolio' },
  { label: 'Tecnologia', href: '#tecnologia' },
  { label: 'Preço', href: '#preco' },
  { label: 'Dúvidas', href: '#faq' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * Baixa o chunk da tela de login assim que o cursor encosta no botão.
   * A página é lazy, então sem isso o clique espera o download — o que dá
   * aquela sensação de "não aconteceu nada" por uns instantes.
   */
  const prefetchLogin = useCallback(() => {
    void import('@/pages/admin/LoginPage');
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md transition-shadow',
        scrolled ? 'border-border shadow-sm' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 md:gap-8">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight sm:text-xl">
          <HabifyMark className="h-5 w-auto text-primary" />
          Habify
        </Link>

        <nav className="ml-auto hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        {/* Link do router, não <a href>: com <a> o navegador recarregava o
            app inteiro a cada clique em Entrar. O Entrar fica visível no
            mobile de propósito — é o acesso de quem já comprou. */}
        <Link
          to="/login"
          onMouseEnter={prefetchLogin}
          onFocus={prefetchLogin}
          onTouchStart={prefetchLogin}
          className="ml-auto rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary sm:px-4 md:ml-0"
        >
          Entrar
        </Link>

        <a
          href="#preco"
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 sm:px-4"
        >
          <span className="hidden sm:inline">Criar meu site</span>
          <span className="sm:hidden">Criar site</span>
        </a>
      </div>
    </header>
  );
}
