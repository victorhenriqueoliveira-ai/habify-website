import { useState } from 'react';
import { Check, Loader2, Search, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from '@/hooks/usePlans';
import { usePayment } from '@/hooks/usePayment';
import { BUSINESS, estimateCardTotal, formatBRL } from '@/config/business';
import { toast } from 'sonner';
import { AdminNotice, SectionHeader } from '@/components/admin/ui';

/**
 * Compra de domínio .com.br pelo painel.
 *
 * Verifica antes de cobrar: o registro.br expõe consulta (RDAP) mas não
 * registro automático para terceiros, então o registro em si é feito pela
 * equipe. Cobrar por um domínio que já é de outra pessoa seria vender algo
 * impossível de entregar — por isso o botão de pagar só aparece depois que
 * a consulta volta disponível.
 */

type Availability = { domain: string; available: boolean } | null;

interface DomainPurchaseProps {
  projectId: string;
  /** Recarrega o projeto depois que o pagamento é iniciado. */
  onPurchased?: () => void;
}

export function DomainPurchase({ projectId, onPurchased }: DomainPurchaseProps) {
  const { user } = useAuth();
  const { plans } = usePlans();
  const { createPayment, loading: paying } = usePayment();

  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Availability>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');

  const domainPlan = plans.find((p) => p.type === 'domain_registration');
  const price = domainPlan?.price ?? BUSINESS.pricing.domainYearly;
  const cardTotal = estimateCardTotal(price);

  const sanitize = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\.com\.br$/, '')
      .replace(/[^a-z0-9-]/g, '');

  const handleCheck = async () => {
    const sanitized = sanitize(input);
    if (sanitized.length < 2) {
      toast.error('Digite pelo menos 2 caracteres.');
      return;
    }

    setChecking(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-domain-availability', {
        body: { domain: sanitized },
      });
      if (error) throw error;
      setResult(data);
    } catch {
      toast.error('Não foi possível consultar agora. Tente de novo em instantes.');
    } finally {
      setChecking(false);
    }
  };

  const handleBuy = async () => {
    if (!result?.available || !domainPlan) return;

    try {
      // Busca CPF e telefone do perfil: o gateway exige, e pedir de novo
      // aqui seria redigitar o que o cliente já cadastrou.
      const { data: profile } = await supabase
        .from('profiles')
        .select('cpf, phone, name')
        .eq('user_id', user?.userId || user?.id)
        .single();

      const cpf = profile?.cpf?.replace(/\D/g, '') || '';
      const phone = profile?.phone?.replace(/\D/g, '') || '';

      if (cpf.length !== 11 || phone.length < 10) {
        toast.error('Complete seu CPF e telefone em "Meu perfil" antes de comprar.');
        return;
      }

      const response = await createPayment(domainPlan.id, {
        name: profile?.name || user?.name || '',
        email: user?.email || '',
        phone,
        cpf,
        password: '',
        paymentMethod,
        isLoggedInPurchase: true,
        userId: user?.userId || user?.id,
        projectId,
        // O domínio escolhido viaja junto pra equipe saber o que registrar
        // sem ter que perguntar depois.
        desiredDomain: result.domain,
      } as Parameters<typeof createPayment>[1]);

      if (response.success && response.paymentUrl) {
        // Guarda a escolha no projeto antes de sair da página: se o cliente
        // fechar o checkout, o domínio pretendido não se perde.
        await supabase
          .from('projects')
          .update({ desired_domain: result.domain, domain_status: 'pending' })
          .eq('id', projectId);

        onPurchased?.();
        window.location.href = response.paymentUrl;
      } else {
        toast.error(response.error || 'Não foi possível iniciar o pagamento.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento.');
    }
  };

  return (
    <section className="admin-card-elevated p-4 sm:p-5">
      <SectionHeader
        icon={Globe}
        title="Registrar um domínio"
        description={`Seu endereço próprio .com.br por R$ ${formatBRL(price)} ao ano.`}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input
            id="domain-search"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setResult(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            placeholder="meusite"
            aria-label="Nome do domínio"
            className="pr-20"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[12.5px] text-muted-foreground">
            .com.br
          </span>
        </div>
        <Button onClick={handleCheck} disabled={checking} variant="outline" className="shrink-0">
          {checking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Consultar
        </Button>
      </div>

      {result && !result.available && (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/[0.06] p-3.5">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="text-[13.5px] font-semibold">
              {result.domain}.com.br já está registrado
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Tente outro nome — por exemplo com a cidade ou o seu sobrenome junto.
            </p>
          </div>
        </div>
      )}

      {result?.available && (
        <div className="mt-3 rounded-lg border border-success/25 bg-success/[0.06] p-4">
          <div className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <p className="text-[13.5px] font-semibold">
              {result.domain}.com.br está disponível
            </p>
          </div>

          <div className="mt-4">
            <Label className="font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
              Forma de pagamento
            </Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as 'PIX' | 'CARD')}
              className="mt-2 gap-2"
            >
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                <span className="flex items-center gap-2.5">
                  <RadioGroupItem value="PIX" id="dom-pix" />
                  <span className="text-[13.5px] font-medium">PIX</span>
                </span>
                <span className="font-display text-[15px] font-bold tabular-nums">
                  R$ {formatBRL(price)}
                </span>
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                <span className="flex items-center gap-2.5">
                  <RadioGroupItem value="CARD" id="dom-card" />
                  <span className="text-[13.5px] font-medium">Cartão</span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-[15px] font-bold tabular-nums">
                    R$ {formatBRL(cardTotal)}
                  </span>
                  {/* A taxa do cartão é do cliente, não absorvida — e o valor
                    *  aparece antes de ele escolher, não na fatura. */}
                  <span className="block text-[11px] text-muted-foreground">
                    com a taxa da operadora
                  </span>
                </span>
              </label>
            </RadioGroup>
          </div>

          <Button onClick={handleBuy} disabled={paying} className="mt-4 w-full">
            {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {paying ? 'Abrindo pagamento...' : `Registrar ${result.domain}.com.br`}
          </Button>

          <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">
            Depois do pagamento confirmado, registramos o domínio e colocamos seu site no ar nele
            em até <strong>6 horas</strong>. Enquanto isso o endereço temporário continua
            funcionando.
          </p>
        </div>
      )}

      {!result && (
        <AdminNotice
          className="mt-3"
          tone="info"
          title="Consultamos no registro.br na hora"
          description="Só dá pra pagar se o nome estiver mesmo livre — assim ninguém compra um domínio que já é de outra pessoa."
        />
      )}
    </section>
  );
}
