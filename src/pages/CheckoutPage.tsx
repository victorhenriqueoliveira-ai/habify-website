import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, CreditCard, Info, Loader2, Lock, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { usePlans } from '@/hooks/usePlans';
import { usePayment } from '@/hooks/usePayment';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCPF, formatPhone } from '@/lib/validations';
import { estimateCardTotal, formatBRL, maxInstallmentsFor } from '@/config/business';
import { HabifyMark } from '@/components/landing/HabifyMark';
import { CheckoutField } from '@/components/checkout/CheckoutField';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { CHECKOUT_RULES, type CheckoutFieldKey } from '@/components/checkout/checkoutFields';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STEPS = ['Seus dados', 'Pagamento na AbacatePay', 'Montar o site'];

type FormState = Record<CheckoutFieldKey, string>;

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, loading: plansLoading } = usePlans();
  const { createPayment, loading: paymentLoading } = usePayment();

  const isDomainCheckout = searchParams.get('type') === 'domain';
  const isSpecificPlan = planId === '9fb31f78-ed65-44e7-a67d-271a0cad8eb9';

  const [method, setMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [consent, setConsent] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    cpf: '',
    phone: '',
    password: '',
  });
  const [touched, setTouched] = useState<Record<CheckoutFieldKey, boolean>>({
    name: false,
    email: false,
    cpf: false,
    phone: false,
    password: false,
  });

  const fieldRefs = useRef<Partial<Record<CheckoutFieldKey, HTMLDivElement | null>>>({});

  const plan = isDomainCheckout
    ? plans.find((p) => p.type === 'domain_registration')
    : plans.find((p) => p.id === planId);

  // Campos exigidos: quem já está logado não cria senha de novo.
  const activeKeys = useMemo<CheckoutFieldKey[]>(
    () => (user ? ['name', 'email', 'cpf', 'phone'] : ['name', 'email', 'cpf', 'phone', 'password']),
    [user],
  );

  const errors = useMemo(() => {
    const out: Partial<Record<CheckoutFieldKey, string | null>> = {};
    activeKeys.forEach((key) => {
      out[key] = CHECKOUT_RULES[key].validate(form[key]);
    });
    return out;
  }, [form, activeKeys]);

  const missing = activeKeys.filter((key) => !!errors[key]);
  const canSubmit = missing.length === 0 && consent && !paymentLoading && !redirecting;

  const price = plan?.pix_price ?? plan?.price ?? 0;
  const cardTotal = estimateCardTotal(plan?.price ?? 0);
  const installments = maxInstallmentsFor(plan?.price ?? 0);
  const total = method === 'CARD' ? cardTotal : price;

  // Google Ads: tag só do plano específico, mantida do checkout anterior.
  useEffect(() => {
    if (!isSpecificPlan) return;
    if (document.querySelector('script[src*="googletagmanager.com/gtag/js?id=AW-17736187305"]')) return;

    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17736187305';
    document.head.appendChild(gtagScript);

    const configScript = document.createElement('script');
    configScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'AW-17736187305');
    `;
    document.head.appendChild(configScript);
  }, [isSpecificPlan]);

  useEffect(() => {
    if (!plansLoading && !plan) {
      toast.error('Plano não encontrado');
      navigate('/');
    }
  }, [plan, plansLoading, navigate]);

  const setField = (key: CheckoutFieldKey, raw: string) => {
    const value = key === 'cpf' ? formatCPF(raw) : key === 'phone' ? formatPhone(raw) : raw;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!plan || redirecting) return;

    // Marca tudo como tocado pra revelar os erros que ainda estavam ocultos.
    setTouched({ name: true, email: true, cpf: true, phone: true, password: true });

    if (missing.length > 0) {
      // Leva o usuário até o problema em vez de só avisar num canto da tela.
      const first = missing[0];
      fieldRefs.current[first]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldRefs.current[first]?.querySelector('input')?.focus();
      return;
    }
    if (!consent) return;

    const cpfDigits = form.cpf.replace(/\D/g, '');
    const phoneDigits = form.phone.replace(/\D/g, '');

    if (!user) {
      try {
        const { data: uniqueCheck } = await supabase.functions.invoke('check-unique-fields', {
          body: { email: form.email, cpf: cpfDigits, phone: phoneDigits },
        });

        if (!uniqueCheck?.success) {
          // Uma mensagem só: antes isto disparava um toast por erro, empilhando.
          const list: string[] = uniqueCheck?.errors ?? ['Não foi possível validar seus dados.'];
          toast.error(list.join(' '), {
            description: 'Se você já tem conta na Habify, entre antes de comprar.',
            action: { label: 'Entrar', onClick: () => navigate('/login') },
          });
          return;
        }
      } catch {
        toast.error('Não conseguimos validar seus dados agora. Tente de novo em instantes.');
        return;
      }
    }

    try {
      ['orderId', 'paymentId', 'gateway', 'transactionData'].forEach((k) => localStorage.removeItem(k));

      const response = await createPayment(plan.id, {
        ...form,
        cpf: cpfDigits,
        phone: phoneDigits,
        paymentMethod: method,
        isLoggedInPurchase: !!user,
      });

      if (response.success && response.paymentUrl) {
        if (response.orderId) localStorage.setItem('orderId', response.orderId);
        if (response.paymentId) localStorage.setItem('paymentId', response.paymentId);
        localStorage.setItem('gateway', response.gateway ?? 'UNKNOWN');

        setRedirecting(true);
        window.location.href = response.paymentUrl;
      } else {
        toast.error(response.error ?? 'Não foi possível criar o pedido. Tente de novo.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    }
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <Skeleton className="h-10 w-48" />
          <div className="mt-8 grid gap-7 md:grid-cols-[1.32fr_0.88fr]">
            <div className="space-y-4">
              <Skeleton className="h-52 w-full rounded-[15px]" />
              <Skeleton className="h-72 w-full rounded-[15px]" />
            </div>
            <Skeleton className="h-96 w-full rounded-[15px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const blockedReason = (() => {
    if (missing.length > 0 && !consent) return 'Complete os campos e aceite os termos para continuar.';
    if (missing.length === 1) return `Falta preencher: ${CHECKOUT_RULES[missing[0]].label}.`;
    if (missing.length > 1) return `Faltam ${missing.length} campos para continuar.`;
    if (!consent) return 'Falta aceitar os termos para continuar.';
    return null;
  })();

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Topo enxuto: o checkout não repete a navegação, pra não dar rota de fuga. */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-[-0.035em]">
            <HabifyMark className="h-5 w-auto text-primary" />
            Habify
          </a>
          <span className="ml-auto inline-flex items-center gap-2 font-mono text-[11.5px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            conexão segura
          </span>
        </div>
      </div>

      {/* Deixa claro que existe uma etapa seguinte, em outro site. */}
      <div className="border-b border-border bg-background">
        <ol className="mx-auto flex max-w-5xl gap-0 overflow-x-auto px-4 sm:px-6">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={cn(
                'flex min-w-max flex-1 items-center gap-2.5 py-3.5 text-[13.5px]',
                i > 0 && 'pl-4',
                i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'grid h-[21px] w-[21px] flex-none place-items-center rounded-full font-mono text-[10.5px]',
                  i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              {label}
              {i < STEPS.length - 1 && <ArrowRight className="ml-auto h-3.5 w-3.5 text-input" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mx-auto grid max-w-5xl items-start gap-7 px-4 pb-32 pt-8 sm:px-6 md:grid-cols-[1.32fr_0.88fr]">
        <div>
          {/* 01 — método */}
          <section className="mb-4 rounded-[15px] border border-border bg-background p-6">
            <div className="mb-5 flex items-baseline gap-3">
              <span className="font-mono text-[11.5px] text-muted-foreground">01</span>
              <h2 className="font-display text-[19px] font-semibold tracking-[-0.025em]">Como você prefere pagar</h2>
            </div>

            <div className="flex flex-col gap-3">
              {(['PIX', 'CARD'] as const).map((option) => {
                const selected = method === option;
                const isPix = option === 'PIX';
                return (
                  <label
                    key={option}
                    className={cn(
                      'relative flex cursor-pointer items-start gap-3.5 rounded-xl border-[1.5px] p-4 transition-[border-color,background,box-shadow]',
                      selected
                        ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]'
                        : 'border-border hover:border-input hover:bg-muted/60',
                    )}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={option}
                      checked={selected}
                      onChange={() => setMethod(option)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'mt-0.5 grid h-[19px] w-[19px] flex-none place-items-center rounded-full border-[1.5px] transition-colors',
                        selected ? 'border-primary' : 'border-input',
                      )}
                    >
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full bg-primary transition-transform',
                          selected ? 'scale-100' : 'scale-0',
                        )}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-2.5">
                        {isPix ? (
                          <QrCode className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        )}
                        <span className="text-[15.5px] font-semibold tracking-[-0.01em]">
                          {isPix ? 'PIX' : 'Cartão de crédito'}
                        </span>
                        {isPix && (
                          <span className="rounded bg-success/10 px-1.5 py-0.5 font-mono text-[10px] text-success">
                            sem taxa
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-[13.5px] text-muted-foreground">
                        {isPix
                          ? 'Cai na hora. O site libera assim que o pagamento confirma.'
                          : `Em até ${installments}x. As parcelas aparecem na próxima etapa.`}
                      </span>
                    </span>

                    <span className="flex-none text-right">
                      <strong className="block font-display text-xl font-bold tracking-[-0.03em]">
                        {isPix ? `R$ ${formatBRL(price)}` : `${installments}x R$ ${formatBRL(cardTotal / installments)}`}
                      </strong>
                      <span className="font-mono text-[10.5px] text-muted-foreground">
                        {isPix ? 'à vista' : `≈ R$ ${formatBRL(cardTotal)} total`}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <p className="mt-3 flex items-start gap-2.5 rounded-[10px] border border-border bg-muted/60 p-3 text-[13px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
              {method === 'CARD' ? (
                <span>
                  <strong className="font-semibold text-foreground">O valor acima já inclui a taxa de parcelamento</strong>{' '}
                  cobrada pela operadora. Você escolhe o número de parcelas na próxima etapa, e o total é confirmado
                  lá antes de você pagar.
                </span>
              ) : (
                <span>
                  <strong className="font-semibold text-foreground">PIX não tem acréscimo.</strong> No cartão, a
                  operadora cobra uma taxa por parcelamento que entra no valor final — o total exato aparece na
                  próxima etapa, antes de você confirmar.
                </span>
              )}
            </p>
          </section>

          {/* 02 — dados */}
          <section className="mb-4 rounded-[15px] border border-border bg-background p-6">
            <div className="mb-5 flex items-baseline gap-3">
              <span className="font-mono text-[11.5px] text-muted-foreground">02</span>
              <h2 className="font-display text-[19px] font-semibold tracking-[-0.025em]">Seus dados</h2>
              <span className="ml-auto text-[12.5px] text-muted-foreground">usados na nota e no cadastro</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(['name', 'email'] as const).map((key) => (
                <div key={key} ref={(el) => (fieldRefs.current[key] = el)} className="sm:col-span-2">
                  <CheckoutField
                    id={key}
                    label={key === 'name' ? 'Nome completo' : 'E-mail'}
                    value={form[key]}
                    onChange={(v) => setField(key, v)}
                    onBlur={() => setTouched((t) => ({ ...t, [key]: true }))}
                    error={errors[key] ?? null}
                    hint={CHECKOUT_RULES[key].hint}
                    touched={touched[key]}
                    type={key === 'email' ? 'email' : 'text'}
                    inputMode={key === 'email' ? 'email' : 'text'}
                    autoComplete={key === 'email' ? 'email' : 'name'}
                    placeholder={key === 'name' ? 'Maria Márcia de Souza' : 'voce@email.com.br'}
                    disabled={!!user}
                  />
                </div>
              ))}

              <div ref={(el) => (fieldRefs.current.cpf = el)}>
                <CheckoutField
                  id="cpf"
                  label="CPF"
                  value={form.cpf}
                  onChange={(v) => setField('cpf', v)}
                  onBlur={() => setTouched((t) => ({ ...t, cpf: true }))}
                  error={errors.cpf ?? null}
                  hint={CHECKOUT_RULES.cpf.hint}
                  touched={touched.cpf}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div ref={(el) => (fieldRefs.current.phone = el)}>
                <CheckoutField
                  id="phone"
                  label="Celular"
                  value={form.phone}
                  onChange={(v) => setField('phone', v)}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  error={errors.phone ?? null}
                  hint={CHECKOUT_RULES.phone.hint}
                  touched={touched.phone}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="(11) 90000-0000"
                  maxLength={15}
                />
              </div>
            </div>
          </section>

          {/* 03 — acesso */}
          <section className="rounded-[15px] border border-border bg-background p-6">
            <div className="mb-5 flex items-baseline gap-3">
              <span className="font-mono text-[11.5px] text-muted-foreground">03</span>
              <h2 className="font-display text-[19px] font-semibold tracking-[-0.025em]">
                {user ? 'Confirmação' : 'Acesso ao painel'}
              </h2>
            </div>

            {!user && (
              <>
                {/* Sem este bloco, um campo de senha no meio de uma compra
                    vira dúvida — e dúvida no checkout vira desistência. */}
                <p className="mb-5 flex items-start gap-2.5 rounded-[10px] border border-border bg-muted/60 p-3 text-[13px] leading-relaxed text-muted-foreground">
                  <Lock className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold text-foreground">Por que uma senha?</strong> É com ela que você
                    entra no painel depois de pagar, preenche as informações do imóvel e publica o site. A conta já
                    fica criada agora pra você não ter que cadastrar nada depois.
                  </span>
                </p>

                <div ref={(el) => (fieldRefs.current.password = el)}>
                  <CheckoutField
                    id="password"
                    label="Crie uma senha"
                    value={form.password}
                    onChange={(v) => setField('password', v)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    error={errors.password ?? null}
                    hint={CHECKOUT_RULES.password.hint}
                    touched={touched.password}
                    type="password"
                    autoComplete="new-password"
                    placeholder="No mínimo 6 caracteres"
                    showStrength
                  />
                </div>
              </>
            )}

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[11px] border border-border bg-muted/60 p-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="sr-only"
              />
              <span
                className={cn(
                  'mt-0.5 grid h-[19px] w-[19px] flex-none place-items-center rounded-md border-[1.5px] transition-colors',
                  consent ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background',
                )}
              >
                {consent && <Check className="h-2.5 w-2.5" strokeWidth={4} aria-hidden="true" />}
              </span>
              <span className="text-[13px] leading-relaxed text-muted-foreground">
                Li e aceito os{' '}
                <a href="/termos-de-uso" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="/politica-privacidade" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                  Política de Privacidade
                </a>
                , incluindo o direito de arrependimento de 7 dias, e autorizo o tratamento dos meus dados conforme a
                LGPD.
              </span>
            </label>
          </section>
        </div>

        {/* resumo + ação, grudados juntos pra o card não deslizar por cima do botão */}
        <aside className="md:sticky md:top-5">
          <OrderSummary
            planName={plan.name}
            planDescription={plan.description}
            features={plan.features ?? []}
            price={price}
            cardTotal={cardTotal}
            installments={installments}
            method={method}
          />

          <div className="mt-4">
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-4 text-[16.5px] font-semibold text-primary-foreground',
                'shadow-lg shadow-primary/25 transition-[filter,transform,opacity]',
                canSubmit ? 'hover:-translate-y-0.5 hover:brightness-110' : 'cursor-not-allowed opacity-45 shadow-none',
              )}
            >
              {paymentLoading || redirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Criando seu pedido
                </>
              ) : (
                <>
                  Ir para o pagamento
                  <span className="opacity-50" aria-hidden="true">·</span>
                  <span className="font-display font-bold tracking-[-0.02em]">R$ {formatBRL(total)}</span>
                </>
              )}
            </button>

            {/* O botão explica por que está desabilitado — antes ele só não funcionava. */}
            <p
              className={cn(
                'mt-3 min-h-[18px] text-center text-[12.5px]',
                blockedReason ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {blockedReason ?? 'Você confere tudo na próxima etapa antes de pagar.'}
            </p>
          </div>
        </aside>
      </form>

      {redirecting && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-6 backdrop-blur-sm"
        >
          <div className="max-w-sm rounded-2xl border border-border bg-background p-9 text-center shadow-2xl">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" aria-hidden="true" />
            <h2 className="mt-4 font-display text-[19px] font-semibold tracking-[-0.025em]">
              Levando você ao pagamento
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Estamos abrindo o ambiente seguro da AbacatePay pra você concluir. Não feche esta janela.
            </p>
            <span className="mt-4 block font-mono text-[11.5px] text-muted-foreground">
              pedido criado · aguardando pagamento
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
