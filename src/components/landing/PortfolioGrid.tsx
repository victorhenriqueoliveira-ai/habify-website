import { Reveal } from './Reveal';

const SITES = [
  {
    src: '/fotos/site_mariamarcia.webp',
    alt: 'Site para corretora de imóveis — exemplo Maria Márcia Corretora',
    name: 'Maria Márcia Corretora',
    meta: 'mariamarciacorretora.com.br',
  },
  {
    src: '/fotos/site_ralphsantos1.webp',
    alt: 'Site para corretor de imóveis — exemplo Ralph Santos',
    name: 'Ralph Santos',
    meta: 'corretor autônomo',
  },
  {
    src: '/fotos/site_empreendimentosmoderno.webp',
    alt: 'Site de imobiliária com portfólio de imóveis — modelo moderno',
    name: 'Modelo Moderno',
    meta: 'portfólio de imóveis',
  },
  {
    src: '/fotos/site_empreendimentosclassico.webp',
    alt: 'Site de imobiliária com portfólio de imóveis — modelo clássico',
    name: 'Modelo Clássico',
    meta: 'portfólio de imóveis',
  },
];

export function PortfolioGrid() {
  return (
    <section id="portfolio" className="border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="font-mono text-[11.5px] text-muted-foreground">portfólio</p>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mt-3 font-display text-[clamp(1.7rem,3.5vw,2.5rem)] font-semibold tracking-[-0.035em] text-balance">
            Sites para corretores que já estão no ar
          </h2>
        </Reveal>
        <Reveal delay={110}>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-muted-foreground">
            Todos construídos na plataforma e publicados no mesmo dia da contratação.
          </p>
        </Reveal>

        <div className="mt-11 grid gap-5 sm:grid-cols-2">
          {SITES.map((site, i) => (
            <Reveal key={site.src} delay={i * 80}>
              <figure className="group overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="overflow-hidden">
                  <img
                    src={site.src}
                    alt={site.alt}
                    width={1600}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-video w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.035]"
                  />
                </div>
                <figcaption className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                  <strong className="text-[13.5px] font-semibold">{site.name}</strong>
                  <span className="font-mono text-[11px] text-muted-foreground">{site.meta}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
