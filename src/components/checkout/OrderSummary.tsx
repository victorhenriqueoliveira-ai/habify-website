import { Check, Lock, RotateCcw, ShieldCheck } from 'lucide-react';
import { BUSINESS, formatBRL } from '@/config/business';
import { HabifyMark } from '@/components/landing/HabifyMark';

interface OrderSummaryProps {
  planName: string;
  planDescription?: string;
  features: string[];
  price: number;
  /** Total no cartão, já com a taxa de parcelamento repassada. */
  cardTotal: number;
  installments: number;
  method: 'PIX' | 'CARD';
}

export function OrderSummary({
  planName,
  planDescription,
  features,
  price,
  cardTotal,
  installments,
  method,
}: OrderSummaryProps) {
  const isCard = method === 'CARD';
  const total = isCard ? cardTotal : price;
  const fee = cardTotal - price;

  return (
    <div className="overflow-hidden rounded-[15px] border border-border bg-background shadow-sm">
      <div className="px-5 pt-5">
        <span className="font-mono text-[11.5px] text-muted-foreground">seu pedido</span>

        <div className="mt-3 flex items-start gap-3">
          <span className="grid h-[52px] w-[52px] flex-none place-items-center rounded-[10px] bg-primary/10 text-primary">
            <HabifyMark className="h-6 w-auto" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold tracking-[-0.02em]">{planName}</h2>
            {planDescription && (
              <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{planDescription}</p>
            )}
          </div>
        </div>

        {features.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2.5 border-t border-border pt-4">
            {features.slice(0, 5).map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-muted-foreground">
                <span className="mt-0.5 grid h-[15px] w-[15px] flex-none place-items-center rounded-full bg-success/10">
                  <Check className="h-2 w-2 text-success" strokeWidth={4} aria-hidden="true" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 border-t border-border bg-muted/50 px-5 py-4">
        <div className="mb-2 flex items-baseline justify-between text-[13.5px] text-muted-foreground">
          <span>{planName}</span>
          <span>R$ {formatBRL(price)}</span>
        </div>

        {/* A taxa aparece aqui em vez de surpreender o cliente na próxima
            etapa — ela é repassada por padrão no cartão. */}
        {isCard && fee > 0 && (
          <div className="mb-2 flex items-baseline justify-between font-mono text-[11.5px] text-muted-foreground">
            <span>taxa de parcelamento</span>
            <span>+ R$ {formatBRL(fee)}</span>
          </div>
        )}

        <div className="mt-3 flex items-baseline justify-between border-t border-input pt-3 text-[15px] font-semibold">
          <span>Total</span>
          <strong className="font-display text-[27px] font-bold tracking-[-0.035em]">R$ {formatBRL(total)}</strong>
        </div>
        <p className="mt-1.5 text-right font-mono text-[11px] text-muted-foreground">
          {isCard
            ? `pagamento único · ${installments}x de R$ ${formatBRL(total / installments)}`
            : 'pagamento único · à vista no PIX'}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border px-5 py-4">
        <p className="flex items-start gap-2.5 text-[12.5px] leading-snug text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
          <span>
            Pagamento processado pela <strong className="font-semibold text-foreground">AbacatePay</strong>. A Habify
            não armazena dados do seu cartão.
          </span>
        </p>
        <p className="flex items-start gap-2.5 text-[12.5px] leading-snug text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-foreground">{BUSINESS.pricing.guaranteeDays} dias de garantia.</strong>{' '}
            Não gostou, devolvemos o valor.
          </span>
        </p>
        <p className="flex items-start gap-2.5 text-[12.5px] leading-snug text-muted-foreground">
          <RotateCcw className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
          <span>
            Direito de arrependimento de <strong className="font-semibold text-foreground">7 dias</strong> garantido
            pelo CDC.
          </span>
        </p>
      </div>
    </div>
  );
}
