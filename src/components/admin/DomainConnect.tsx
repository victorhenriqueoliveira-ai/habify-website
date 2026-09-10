import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, ExternalLink, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DomainConnectProps {
  projectId: string;
}

interface ProjectDomainRow {
  ai_generation_status: string | null;
  vercel_project_id: string | null;
  vercel_deployment_url: string | null;
  vercel_domain_verified: boolean | null;
  vercel_custom_domain: string | null;
}

interface DomainInstructions {
  type: string;
  name: string;
  value: string;
}

export const DomainConnect = ({ projectId }: DomainConnectProps) => {
  const [row, setRow] = useState<ProjectDomainRow | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [instructions, setInstructions] = useState<DomainInstructions | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRow = async (): Promise<void> => {
      const { data } = await supabase
        .from('projects')
        .select('ai_generation_status, vercel_project_id, vercel_deployment_url, vercel_domain_verified, vercel_custom_domain')
        .eq('id', projectId)
        .maybeSingle();
      if (!cancelled && data) {
        setRow(data as ProjectDomainRow);
        setDomainInput((prev) => prev || (data as ProjectDomainRow).vercel_custom_domain || '');
      }
    };

    fetchRow();

    const channel = supabase
      .channel(`domain-status-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
        (payload) => {
          const next = payload.new as ProjectDomainRow;
          setRow(next);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const callManageDomain = async (action: 'attach' | 'status'): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Não autenticado');
      return;
    }

    const { data, error } = await supabase.functions.invoke('manage-project-domain', {
      body: {
        project_id: projectId,
        requesting_user_id: user.id,
        domain: domainInput.trim() || undefined,
        action,
      },
    });

    if (error || !data?.success) {
      toast.error(data?.error || error?.message || 'Erro ao conectar domínio');
      return;
    }

    setInstructions(data.verified ? null : data.instructions);
    if (data.verified) {
      toast.success('Domínio verificado e conectado!');
    } else {
      toast.info('Domínio anexado — falta o DNS apontar corretamente (veja as instruções abaixo).');
    }
  };

  const handleConnect = async (): Promise<void> => {
    if (!domainInput.trim()) {
      toast.error('Informe um domínio (ex: meusite.com.br)');
      return;
    }
    try {
      setSaving(true);
      await callManageDomain('attach');
    } finally {
      setSaving(false);
    }
  };

  const handleCheck = async (): Promise<void> => {
    try {
      setChecking(true);
      await callManageDomain('status');
    } finally {
      setChecking(false);
    }
  };

  // Só faz sentido depois que o site foi gerado e publicado.
  if (!row || row.ai_generation_status !== 'done' || !row.vercel_project_id) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-primary" />
          Seu site e domínio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {row.vercel_deployment_url && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Endereço temporário (sempre funciona)</p>
              <p className="text-sm font-medium">{row.vercel_deployment_url}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={row.vercel_deployment_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Abrir
              </a>
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="domain-input" className="text-sm font-medium">
            Conectar seu próprio domínio
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="domain-input"
              placeholder="meusite.com.br"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleConnect} disabled={saving} className="shrink-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Conectar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Já tem um domínio (comprado aqui ou em outro lugar)? Digite ele acima pra conectar ao seu site.
          </p>
        </div>

        {row.vercel_custom_domain && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-xs text-muted-foreground">Domínio</p>
              <p className="text-sm font-medium">{row.vercel_custom_domain}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={row.vercel_domain_verified ? 'default' : 'secondary'} className="gap-1">
                {row.vercel_domain_verified ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Verificado
                  </>
                ) : (
                  'Aguardando DNS'
                )}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleCheck} disabled={checking}>
                {checking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}

        {instructions && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/20">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Configure este registro DNS no painel de onde você comprou o domínio:
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-semibold">{instructions.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="font-semibold">{instructions.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor</p>
                <p className="font-semibold">{instructions.value}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">
              A propagação do DNS pode levar de alguns minutos até algumas horas. Clique em{' '}
              <RefreshCw className="inline h-3 w-3" /> pra verificar de novo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
