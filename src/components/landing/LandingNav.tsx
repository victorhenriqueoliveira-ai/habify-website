import { useEffect, useState } from 'react';
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

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md transition-shadow',
        scrolled ? 'border-border shadow-sm' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 md:gap-8">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight sm:text-xl">
          <HabifyMark className="h-5 w-auto text-primary" />
          Habify
        </a>

        <nav className="ml-auto hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        {/* O Entrar fica visível no mobile de propósito: é o acesso de quem
            já comprou, não pode depender de menu escondido. */}
        <a
          href="/login"
          className="ml-auto rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary sm:px-4 md:ml-0"
        >
          Entrar
        </a>

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
