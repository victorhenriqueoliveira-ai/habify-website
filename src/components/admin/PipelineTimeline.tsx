import { usePipelineLogs } from '@/hooks/usePipelineLogs';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PipelineTimelineProps {
  projectId: string;
}

const STEP_LABELS: Record<string, string> = {
  queued: 'Na fila',
  generating_structure: 'Carregando projeto e imóveis',
  generating_content: 'Montando site.config.json',
  rendering: 'Gerando repositório no GitHub',
  pushing_github: 'Publicando dados no GitHub',
  deploying: 'Publicando na Vercel',
  done: 'Concluído',
  failed: 'Falhou',
  'ai-site-builder': 'Erro no pipeline',
};

const stepLabel = (step: string): string => STEP_LABELS[step] || step;

export const PipelineTimeline = ({ projectId }: PipelineTimelineProps) => {
  const { logs, loading } = usePipelineLogs(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando trajeto...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Este projeto ainda não passou pelo pipeline de geração automática.
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {logs.map((log, index) => {
        const isLast = index === logs.length - 1;
        const isFailed = log.status === 'failed';
        return (
          <li key={log.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[11px] top-6 bottom-0 w-px bg-border"
              />
            )}
            <div
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                isFailed ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success',
              )}
            >
              {isFailed ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium">{stepLabel(log.step)}</p>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                </time>
              </div>
              {log.error && (
                <p className="text-sm text-destructive break-words">{log.error}</p>
              )}
              {!log.error && log.payload && Object.keys(log.payload).length > 0 && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {Object.entries(log.payload).map(([key, value]) => (
                    <p key={key} className="break-words">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
