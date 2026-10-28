import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Calendar, Package } from 'lucide-react';
import { EmptyState, SectionHeader, StatusPill, type StatusTone } from '@/components/admin/ui';

/**
 * Créditos disponíveis e histórico de planos.
 *
 * Estas duas seções estavam escritas duas vezes, praticamente idênticas —
 * em `subscriptionsUser.tsx` (visão do cliente) e em
 * `UserSubscriptionsPage.tsx` (a mesma coisa vista pelo admin, pra um
 * usuário específico). Eram ~150 linhas repetidas, e as diferenças entre
 * elas eram acidentais, não intencionais.
 */

export interface PlanHistoryItem {
  id: string;
  plan_name: string;
  plan_type: string;
  status: string;
  created_at: string;
  used_at?: string;
  expires_at?: string;
  used_for_project_id?: string;
  plan_price?: string;
  notes?: string;
}

export interface AvailableCredit {
  plan_id: string;
  plan_name: string;
  plan_type: string;
  count: number;
  expires_at?: string | null;
  plan_features?: unknown;
}

const statusConfig: Record<string, { tone: StatusTone; label: string }> = {
  active: { tone: 'success', label: 'Ativo' },
  used: { tone: 'info', label: 'Utilizado' },
  expired: { tone: 'neutral', label: 'Expirado' },
  cancelled: { tone: 'destructive', label: 'Cancelado' },
};

const planTypeLabels: Record<string, string> = {
  website_only: 'Site único',
  website_maintenance_1m: 'Site + 1 mês de manutenção',
  website_maintenance_6m: 'Site + 6 meses de manutenção',
};

const detailLabel = 'font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground';

export function AvailableCreditsSection({
  credits,
  description,
}: {
  credits: AvailableCredit[];
  description?: string;
}) {
  if (credits.length === 0) return null;

  const total = credits.reduce((sum, p) => sum + p.count, 0);

  return (
    <section className="space-y-3.5">
      <SectionHeader
        icon={Package}
        title="Créditos disponíveis"
        count={total}
        tone="success"
        description={description}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {credits.map((plan) => {
          const features = Array.isArray(plan.plan_features)
            ? (plan.plan_features as string[]).filter((f) => typeof f === 'string')
            : [];

          return (
            <article key={plan.plan_id} className="admin-card-elevated p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 text-[14.5px] font-semibold leading-snug">{plan.plan_name}</h3>
                <StatusPill
                  label={`${plan.count} ${plan.count === 1 ? 'crédito' : 'créditos'}`}
                  tone="success"
                />
              </div>

              <p className="mt-1 text-[12.5px] text-muted-foreground">
                {planTypeLabels[plan.plan_type] ?? plan.plan_type}
              </p>

              {features.length > 0 && (
                <ul className="mt-2.5 space-y-1 text-[12.5px] text-muted-foreground">
                  {features.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex gap-1.5">
                      <span aria-hidden="true">·</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {plan.expires_at && (
                <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 font-mono text-[11px] tabular-nums text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Válido até{' '}
                  {format(new Date(plan.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PlanHistorySection({
  plans,
  emptyDescription,
}: {
  plans: PlanHistoryItem[];
  emptyDescription: string;
}) {
  if (plans.length === 0) {
    return (
      <EmptyState
        className="admin-card-elevated"
        icon={Package}
        title="Nenhum plano contratado"
        description={emptyDescription}
      />
    );
  }

  return (
    <section className="space-y-3.5">
      <SectionHeader title="Histórico de planos" count={plans.length} />

      <div className="space-y-3">
        {plans.map((plan) => {
          // Antes "Utilizado" e "Expirado" caíam num default sem cor numa
          // das duas telas, porque o switch só tratava active e cancelled.
          const status = statusConfig[plan.status] ?? statusConfig.expired;

          return (
            <article key={plan.id} className="admin-card-elevated p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <Package className="h-[17px] w-[17px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[16px] font-bold tracking-[-0.02em]">
                      {plan.plan_name}
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {planTypeLabels[plan.plan_type] ?? plan.plan_type}
                    </p>
                    {plan.used_for_project_id && (
                      /* <Link>, não window.location.href nem navigate manual
                       *  num <Button variant="link"> — isto é um link. */
                      <Link
                        to={`/admin/projects/${plan.used_for_project_id}`}
                        className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"
                      >
                        Ver projeto vinculado
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>

                <StatusPill label={status.label} tone={status.tone} />
              </div>

              <dl className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <div>
                  <dt className={detailLabel}>Aquisição</dt>
                  <dd className="mt-0.5 font-mono text-[12.5px] tabular-nums">
                    {format(new Date(plan.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </dd>
                </div>
                {plan.used_at && (
                  <div>
                    <dt className={detailLabel}>Uso</dt>
                    <dd className="mt-0.5 font-mono text-[12.5px] tabular-nums">
                      {format(new Date(plan.used_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </dd>
                  </div>
                )}
                {plan.expires_at && (
                  <div>
                    <dt className={detailLabel}>Expiração</dt>
                    <dd className="mt-0.5 font-mono text-[12.5px] tabular-nums">
                      {format(new Date(plan.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </dd>
                  </div>
                )}
                {plan.plan_price && (
                  <div>
                    <dt className={detailLabel}>Valor</dt>
                    <dd className="mt-0.5 font-display text-[17px] font-bold tabular-nums">
                      R$ {parseFloat(plan.plan_price).toFixed(2)}
                    </dd>
                  </div>
                )}
              </dl>

              {plan.notes && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className={detailLabel}>Observações</p>
                  <p className="mt-1 text-[13px] leading-relaxed">{plan.notes}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
