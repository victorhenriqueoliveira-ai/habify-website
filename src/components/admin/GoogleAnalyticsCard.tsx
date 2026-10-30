import { useState } from 'react';
import { BarChart3, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SectionHeader, StatusPill } from '@/components/admin/ui';

interface GoogleAnalyticsCardProps {
  projectId: string;
  /** Valor já salvo, pra abrir o campo preenchido. */
  currentId?: string | null;
  /** Avisa a tela pai pra recarregar o projeto depois de salvar. */
  onSaved?: (value: string | null) => void;
}

const GA_MEASUREMENT_ID = /^G-[A-Z0-9]{4,20}$/;

/**
 * Conectar o Google Analytics ao site.
 *
 * Fica fora do fluxo de manutenção de propósito: não custa crédito. O
 * cliente está ligando a própria ferramenta de medição ao site que já
 * comprou — cobrar por isso faria ele simplesmente não medir nada.
 */
export function GoogleAnalyticsCard({ projectId, currentId, onSaved }: GoogleAnalyticsCardProps) {
  const { user } = useAuth();
  const [value, setValue] = useState(currentId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim().toUpperCase();
  const isEmpty = trimmed === '';
  const connected = !!currentId;
  const unchanged = trimmed === (currentId ?? '').toUpperCase();

  const handleSave = async () => {
    // Valida antes de chamar: o formato é conferido de novo no servidor,
    // mas avisar aqui evita uma ida ao banco e um build à toa.
    if (!isEmpty && !GA_MEASUREMENT_ID.test(trimmed)) {
      setError('O ID tem o formato G-XXXXXXX. Confira no painel do Google Analytics.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('update-site-settings', {
        body: {
          project_id: projectId,
          field: 'googleAnalyticsId',
          value: isEmpty ? null : trimmed,
          requesting_user_id: user?.userId || user?.id,
        },
      });

      if (fnError || !data?.success) {
        const message = data?.error || fnError?.message || 'Não foi possível salvar agora.';
        setError(message);
        // `saved` vem true quando gravamos mas o site não publicou: o valor
        // não se perdeu, então pedir pra tentar de novo seria enganoso.
        if (data?.saved) {
          onSaved?.(isEmpty ? null : trimmed);
        }
        return;
      }

      onSaved?.(isEmpty ? null : trimmed);

      toast.success(
        data.published
          ? isEmpty
            ? 'Google Analytics desconectado do site.'
            : 'Google Analytics conectado! Seu site já está medindo.'
          : 'Salvo! A publicação está em andamento e entra no ar em alguns minutos.',
      );
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível salvar agora.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-card-elevated p-4 sm:p-5">
      <SectionHeader
        icon={BarChart3}
        title="Google Analytics"
        description="Conecte sua conta para acompanhar as visitas do site. Não consome crédito de manutenção."
        actions={connected ? <StatusPill label="Conectado" tone="success" /> : undefined}
      />

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1 space-y-1.5">
          <Label
            htmlFor="ga-measurement-id"
            className="font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground"
          >
            Measurement ID
          </Label>
          <Input
            id="ga-measurement-id"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="G-XXXXXXXXXX"
            aria-invalid={!!error}
            aria-describedby={error ? 'ga-error' : 'ga-hint'}
            className={error ? 'border-destructive' : undefined}
          />
        </div>

        <Button onClick={handleSave} disabled={saving || unchanged}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? 'Publicando...' : isEmpty && connected ? 'Desconectar' : 'Salvar e publicar'}
        </Button>
      </div>

      {error ? (
        <p id="ga-error" role="alert" className="mt-2 text-[12.5px] font-medium text-destructive">
          {error}
        </p>
      ) : (
        <p id="ga-hint" className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
          Encontre em Administrador → Fluxos de dados, no{' '}
          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Google Analytics
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          . Salvar republica o site — leva um ou dois minutos.
        </p>
      )}
    </section>
  );
}
