import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { FieldErrors } from '@/lib/wizardValidation';

interface ErrorSummaryProps {
  errors: FieldErrors;
  /** Rótulo humano de cada chave. Sem isto a lista mostraria "addressCep". */
  labels?: Record<string, string>;
}

/**
 * Resumo do que falta preencher, no topo da etapa.
 *
 * Numa etapa longa — a de imóveis passa de uma tela inteira — marcar só o
 * campo não resolve: o erro fica fora da área visível e o cliente clica em
 * "Próximo" de novo sem entender por que não avança. Aqui ele vê a lista
 * completa e pula direto pro campo.
 */
export function ErrorSummary({ errors, labels = {} }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const entries = Object.entries(errors);

  // Rola até o resumo quando ele aparece: o clique em "Próximo" costuma
  // acontecer no rodapé da página, longe do topo da etapa.
  useEffect(() => {
    if (entries.length > 0) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Só quando a quantidade muda — não a cada tecla digitada.
  }, [entries.length]);

  if (entries.length === 0) return null;

  const focusField = (key: string) => {
    const field = document.getElementById(key);
    if (!field) return;
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // O foco vem depois da rolagem, senão o browser salta sem animação.
    window.setTimeout(() => field.focus({ preventScroll: true }), 300);
  };

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-destructive/25 bg-destructive/[0.06] p-4"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-destructive" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-foreground">
            {entries.length === 1
              ? 'Falta um campo para continuar'
              : `Faltam ${entries.length} campos para continuar`}
          </h3>

          <ul className="mt-2 space-y-1">
            {entries.map(([key, message]) => (
              <li key={key} className="text-[13px] leading-relaxed">
                <button
                  type="button"
                  onClick={() => focusField(key)}
                  className="text-left text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {labels[key] ? <strong className="font-semibold">{labels[key]}: </strong> : null}
                  {message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
