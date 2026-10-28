import { CreditCard, QrCode, Webhook, Terminal } from 'lucide-react';
import { AdminNotice, PageHeader, SectionHeader, StatusPill } from '@/components/admin/ui';

/**
 * Configurações de pagamento — painel de leitura.
 *
 * Esta tela tinha campos pra colar a API key da AbacatePay e da Hubla, e
 * era uma armadilha: a chave digitada ia pra uma linha de `system_settings`
 * no Postgres, e **nenhuma edge function lê essa linha** — todas usam
 * `Deno.env.get('ABACATEPAY_API_KEY')`, ou seja, os secrets do Supabase.
 * Na prática, quem trocasse a chave aqui (a) não mudava nada no pagamento
 * e (b) tinha acabado de gravar um segredo vivo numa tabela do banco.
 *
 * As chaves continuam onde sempre estiveram, nos secrets. Esta página
 * agora mostra o que está realmente em uso e como trocar, sem aceitar
 * segredo pelo navegador.
 */

const secretRows: Array<{
  icon: typeof QrCode;
  title: string;
  secret: string;
  detail: string;
}> = [
  {
    icon: QrCode,
    title: 'AbacatePay — PIX',
    secret: 'ABACATEPAY_API_KEY',
    detail: 'API v1, rota billing/create',
  },
  {
    icon: CreditCard,
    title: 'AbacatePay — cartão',
    secret: 'ABACATEPAY_API_KEY_V2',
    detail: 'API v2, rota checkouts/create, com parcelamento e taxa repassada ao cliente',
  },
  {
    icon: Webhook,
    title: 'Webhook de confirmação',
    secret: 'ABACATEPAY_WEBHOOK_SECRET · _V2',
    detail: 'O webhook aceita os dois envelopes, v1 e v2',
  },
];

export const PaymentSettingsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={CreditCard}
        eyebrow="Financeiro"
        title="Configurações de pagamento"
        description="O que está em uso no processamento de pagamentos e onde trocar cada chave"
      />

      <AdminNotice
        tone="info"
        title="As chaves não são editáveis por aqui"
        description="Elas vivem nos secrets do Supabase, que as edge functions leem em tempo de execução. Um campo no navegador gravaria o segredo numa tabela do banco sem efeito nenhum sobre o pagamento."
      />

      <section className="space-y-3.5">
        <SectionHeader
          title="Gateway ativo"
          description="AbacatePay responde por PIX e cartão. A Hubla está desativada e não é mais chamada."
        />

        <ul className="space-y-2">
          {secretRows.map((row) => (
            <li
              key={row.secret}
              className="admin-card-elevated flex flex-wrap items-center gap-x-4 gap-y-2 p-4"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
                <row.icon className="h-[17px] w-[17px]" aria-hidden="true" />
              </span>

              <div className="min-w-[14rem] flex-1">
                <p className="text-[14px] font-semibold">{row.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{row.secret}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {row.detail}
                </p>
              </div>

              <StatusPill label="Em uso" tone="success" />
            </li>
          ))}

          <li className="admin-card-elevated flex flex-wrap items-center gap-x-4 gap-y-2 p-4 opacity-70">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
              <CreditCard className="h-[17px] w-[17px]" aria-hidden="true" />
            </span>
            <div className="min-w-[14rem] flex-1">
              <p className="text-[14px] font-semibold">Hubla</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                Gateway antigo de cartão. Não é mais chamado por nenhuma função.
              </p>
            </div>
            <StatusPill label="Desativado" tone="neutral" />
          </li>
        </ul>
      </section>

      <section className="admin-card-elevated p-4 sm:p-5">
        <SectionHeader
          icon={Terminal}
          title="Como trocar uma chave"
          description="Pelo CLI do Supabase, na máquina de quem tem acesso ao projeto."
        />
        <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-[11.5px] leading-relaxed">
          {`supabase secrets set ABACATEPAY_API_KEY_V2=<nova chave>
supabase functions deploy create-payment`}
        </pre>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
          A chave nova passa a valer no próximo deploy da função. Não é preciso mexer no banco nem
          nesta tela.
        </p>
      </section>
    </div>
  );
};
