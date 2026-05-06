import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Github, Loader2, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export type AIGenerationStatusValue =
  | 'idle'
  | 'queued'
  | 'generating_structure'
  | 'generating_content'
  | 'rendering'
  | 'pushing_github'
  | 'done'
  | 'failed';

interface AIGenerationStatusProps {
  projectId: string;
  canRegenerate?: boolean;
}

interface ProjectAIRow {
  ai_generation_status: AIGenerationStatusValue | null;
  ai_generation_error: string | null;
  github_repo_url: string | null;
  github_repo_name: string | null;
}

const STEP_LABELS: Record<AIGenerationStatusValue, string> = {
  idle: 'Aguardando geração',
  queued: 'Na fila',
  generating_structure: 'IA estruturando seu site',
  generating_content: 'IA escrevendo o conteúdo',
  rendering: 'Montando os arquivos do site',
  pushing_github: 'Publicando no GitHub',
  done: 'Pronto!',
  failed: 'Falhou',
};

const STEP_PROGRESS: Record<AIGenerationStatusValue, number> = {
  idle: 0,
  queued: 10,
  generating_structure: 30,
  generating_content: 55,
  rendering: 75,
  pushing_github: 90,
  done: 100,
  failed: 0,
};

const isInProgress = (s: AIGenerationStatusValue): boolean =>
  s === 'queued' ||
  s === 'generating_structure' ||
  s === 'generating_content' ||
  s === 'rendering' ||
  s === 'pushing_github';

export const AIGenerationStatus = ({ projectId, canRegenerate = false }: AIGenerationStatusProps) => {
  const [row, setRow] = useState<ProjectAIRow | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchRow = async (): Promise<void> => {
      const { data } = await supabase
        .from('projects')
        .select('ai_generation_status, ai_generation_error, github_repo_url, github_repo_name')
        .eq('id', projectId)
        .maybeSingle();
      if (!cancelled && data) setRow(data as ProjectAIRow);
    };

    fetchRow();

    const channel = supabase
      .channel(`ai-status-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
        (payload) => {
          const next = payload.new as ProjectAIRow;
          setRow({
            ai_generation_status: next.ai_generation_status,
            ai_generation_error: next.ai_generation_error,
            github_repo_url: next.github_repo_url,
            github_repo_name: next.github_repo_name,
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleRegenerate = async (): Promise<void> => {
    try {
      setRegenerating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase.functions.invoke('ai-site-builder', {
        body: { project_id: projectId, requesting_user_id: user.id, retry: true },
      });
      if (error) throw error;
      toast.success('Geração reiniciada');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao reiniciar geração';
      toast.error(msg);
    } finally {
      setRegenerating(false);
    }
  };

  if (!row) return null;

  const status: AIGenerationStatusValue = row.ai_generation_status ?? 'idle';
  const inProgress = isInProgress(status);
  const progress = STEP_PROGRESS[status];

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Geração automática por IA
        </CardTitle>
        <Badge
          variant={
            status === 'done' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'
          }
          className="gap-1"
        >
          {inProgress && <Loader2 className="h-3 w-3 animate-spin" />}
          {status === 'done' && <CheckCircle2 className="h-3 w-3" />}
          {status === 'failed' && <AlertCircle className="h-3 w-3" />}
          {STEP_LABELS[status]}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {(inProgress || status === 'done') && (
          <Progress value={progress} className="h-2" />
        )}

        {status === 'failed' && row.ai_generation_error && (
          <p className="text-sm text-destructive">{row.ai_generation_error}</p>
        )}

        {status === 'done' && row.github_repo_url && (
          <a
            href={row.github_repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Github className="h-4 w-4" />
            Ver repositório {row.github_repo_name ? `(${row.github_repo_name})` : ''}
          </a>
        )}

        {canRegenerate && (status === 'failed' || status === 'done') && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="gap-2"
          >
            {regenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerar com IA
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
