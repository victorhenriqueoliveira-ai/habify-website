import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineLogEntry {
  id: string;
  project_id: string;
  step: string;
  status: string;
  payload: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
}

/**
 * Histórico passo-a-passo (ai_generation_logs) de um projeto — o "trajeto"
 * completo de geração: fila, estrutura, conteúdo, GitHub, deploy na Vercel,
 * domínio, até done/failed. Usado pelo painel de dev (PipelineLogsPage) e
 * pelo card de status em ProjectDetailPage.
 */
export const usePipelineLogs = (projectId?: string) => {
  const [logs, setLogs] = useState<PipelineLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setLogs([]);
      return;
    }

    let cancelled = false;

    const fetchLogs = async (): Promise<void> => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_generation_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (!cancelled) {
        if (error) {
          console.error('Error fetching pipeline logs:', error);
        } else {
          setLogs((data as PipelineLogEntry[]) || []);
        }
        setLoading(false);
      }
    };

    fetchLogs();

    const channel = supabase
      .channel(`pipeline-logs-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_generation_logs', filter: `project_id=eq.${projectId}` },
        (payload) => {
          setLogs((prev) => [...prev, payload.new as PipelineLogEntry]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { logs, loading };
};
