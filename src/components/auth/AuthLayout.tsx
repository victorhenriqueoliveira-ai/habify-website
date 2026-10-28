import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { HabifyMark } from '@/components/landing/HabifyMark';

interface AuthLayoutProps {
  children: ReactNode;
}

const HIGHLIGHTS = [
  'Site no ar no mesmo dia, sem depender de dev',
  'Hospedagem, CDN e SSL já inclusos',
  'Lead do site cai direto no seu WhatsApp',
];

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 lg:flex lg:w-[42%] xl:w-[38%] xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-28 h-80 w-80 rounded-full bg-primary/25 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-96 w-96 rounded-full bg-primary/15 blur-[130px]"
        />
        {/* mesma grade de blueprint do hero, pra tela de acesso não destoar */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 30% 40%, #000 0%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 30% 40%, #000 0%, transparent 72%)',
          }}
        />

        <Link
          to="/"
          className="relative z-10 inline-flex w-fit items-center gap-2.5 font-display text-xl font-bold tracking-[-0.035em] text-background"
        >
          <HabifyMark className="h-6 w-auto text-primary" />
          Habify
        </Link>

        <div className="relative z-10 max-w-sm space-y-7">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-background text-balance xl:text-4xl">
            Seu site imobiliário, no ar agora.
          </h1>
          <ul className="space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-background/70 xl:text-[15px]">
                <span className="mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-primary/20">
                  <Check className="h-2.5 w-2.5 text-primary" strokeWidth={4} aria-hidden="true" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 font-mono text-[11px] text-background/40">
          © {new Date().getFullYear()} Habify · CNPJ 53.247.964/0001-03
        </p>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.05] via-background to-background lg:hidden"
        />
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-bold tracking-[-0.035em]">
              <HabifyMark className="h-6 w-auto text-primary" />
              Habify
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
