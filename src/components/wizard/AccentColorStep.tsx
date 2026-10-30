import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccentColor } from '@/types/wizard';

/**
 * Escolha da cor de destaque do site.
 *
 * O site tem uma identidade só — serifada, fundo areia, mesmo ritmo de
 * seções — e o que varia é o acento. Esta etapa existiu antes como
 * "Layout e Cores", oferecendo 5 paletas genéricas (azul, laranja, roxo...)
 * sobre um layout neutro; ela foi removida quando o template passou a ter
 * uma identidade curada, e ficou órfã até ser deletada.
 *
 * Aqui a promessa é mais estreita e verdadeira: a estrutura não muda, a
 * cor sim. É por isso que todas as opções ficam boas.
 */

interface AccentOption {
  id: AccentColor;
  label: string;
  /** Hex só pro preview — a cor real vem do CSS do template. */
  swatch: string;
  hint: string;
}

const OPTIONS: AccentOption[] = [
  { id: 'dourado', label: 'Dourado', swatch: '#c8a25a', hint: 'Clássico e sofisticado' },
  { id: 'oliva', label: 'Oliva', swatch: '#7d8c5c', hint: 'Natural e tranquilo' },
  { id: 'terracota', label: 'Terracota', swatch: '#b4663f', hint: 'Quente e acolhedor' },
  { id: 'petroleo', label: 'Petróleo', swatch: '#2f6b72', hint: 'Sóbrio e moderno' },
  { id: 'grafite', label: 'Grafite', swatch: '#5a6472', hint: 'Discreto e urbano' },
];

interface AccentColorStepProps {
  value?: AccentColor;
  onChange: (value: AccentColor) => void;
}

export function AccentColorStep({ value = 'dourado', onChange }: AccentColorStepProps) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        O design do seu site é o mesmo em todas as opções — muda só a cor dos destaques: botões,
        detalhes e títulos. Dá pra trocar depois, pela manutenção.
      </p>

      {/* radiogroup de verdade: dá pra navegar e escolher pelo teclado. */}
      <div
        role="radiogroup"
        aria-label="Cor de destaque do site"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {OPTIONS.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'border-primary bg-primary/[0.06]' : 'border-border hover:bg-muted',
              )}
            >
              {/* A amostra mostra a cor; o nome sozinho não diz nada a quem
                *  nunca viu "petróleo" aplicado num site. */}
              <span
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-md border border-black/10"
                style={{ backgroundColor: option.swatch }}
              />

              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">{option.label}</span>
                <span className="block text-[12.5px] text-muted-foreground">{option.hint}</span>
              </span>

              {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
