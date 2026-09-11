import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

const HIGHLIGHTS = [
  'Site imobiliário no ar na hora, sem depender de dev',
  'Domínio próprio e hospedagem já inclusos',
  'Manutenções e ajustes com atendimento em até 72h',
];

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden bg-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-primary/30 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-96 w-96 rounded-full bg-primary/20 blur-[130px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(hsl(var(--background)) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <Link to="/" className="relative z-10 inline-flex w-fit">
          <img src="/logotipo_habify.png" alt="HabiFy" className="h-9 w-auto" />
        </Link>

        <div className="relative z-10 space-y-8 max-w-sm">
          <h1 className="font-display text-3xl xl:text-4xl font-medium leading-tight text-background text-balance">
            Seu site imobiliário, no ar agora.
          </h1>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm xl:text-base text-background/75">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-background/45">
          © {new Date().getFullYear()} HabiFy. Todos os direitos reservados.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10 relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.06] via-background to-background lg:hidden"
        />
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/">
              <img src="/logotipo_habify.png" alt="HabiFy" className="h-10 w-auto" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
