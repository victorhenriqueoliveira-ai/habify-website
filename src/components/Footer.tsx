import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone } from 'lucide-react';
import { BUSINESS, formatBRL } from '@/config/business';
import { HabifyMark } from '@/components/landing/HabifyMark';

// Âncoras conferidas contra os ids reais das seções da landing — as
// antigas (#hero e #plans) não existiam mais depois da reescrita.
const NAV = [
  { label: 'Portfólio', href: '/#portfolio' },
  { label: 'Tecnologia', href: '/#tecnologia' },
  { label: 'Preço', href: '/#preco' },
  { label: 'Dúvidas', href: '/#faq' },
];

const CONTACTS = [
  {
    icon: Mail,
    label: 'E-mail',
    value: BUSINESS.email.contact,
    href: `mailto:${BUSINESS.email.contact}`,
    external: false,
  },
  {
    icon: Phone,
    label: 'WhatsApp',
    value: BUSINESS.whatsapp.display,
    href: BUSINESS.whatsapp.url('Olá! Gostaria de saber mais sobre a Habify.'),
    external: true,
  },
  {
    icon: Instagram,
    label: 'Instagram',
    value: '@habify.br',
    href: 'https://www.instagram.com/habify.br/',
    external: true,
  },
];

const Footer = () => (
  <footer className="border-t border-border bg-muted/40">
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="lg:pr-6">
          <Link to="/" className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-[-0.035em]">
            <HabifyMark className="h-6 w-auto text-primary" />
            Habify
          </Link>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
            Sites profissionais em React para corretores de imóveis e imobiliárias. No ar no mesmo dia, por
            R$&nbsp;{formatBRL(BUSINESS.pricing.sitePrice)}, pagamento único.
          </p>
        </div>

        <nav aria-label="Navegação do rodapé">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Navegação</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Entrar
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Legal</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            <li>
              <Link
                to="/termos-de-uso"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Termos de Uso
              </Link>
            </li>
            <li>
              <Link
                to="/politica-privacidade"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Política de Privacidade
              </Link>
            </li>
            <li className="text-sm text-muted-foreground">
              Arrependimento em 7 dias (CDC)
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Contato</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {CONTACTS.map(({ icon: Icon, label, value, href, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group flex items-center gap-3 transition-colors"
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-border bg-background transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
                    <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[10.5px] text-muted-foreground">{label}</span>
                    <span className="block truncate text-sm font-medium transition-colors group-hover:text-primary">
                      {value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 font-mono text-[11px] leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Habify · Victor Henrique Soares de Oliveira Desenvolvimento de Software LTDA ·
          CNPJ 53.247.964/0001-03
        </p>
        <p>Pagamentos processados pela AbacatePay</p>
      </div>
    </div>
  </footer>
);

export default Footer;
