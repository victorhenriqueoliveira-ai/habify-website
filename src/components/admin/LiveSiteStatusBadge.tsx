import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface LiveSiteStatusBadgeProps {
  projectId: string;
}

interface Row {
  ai_generation_status: string | null;
  vercel_deployment_url: string | null;
}

/**
 * Mostra "No ar" + link quando o site foi gerado automaticamente
 * (ai-site-builder) e já está publicado — pra não deixar o projeto
 * marcado como "pendente" pra sempre em listas que usam o status manual
 * antigo (fila de desenvolvimento), que essa automação não atualiza.
 */
export const LiveSiteStatusBadge = ({ projectId }: LiveSiteStatusBadgeProps) => {
  const [row, setRow] = useState<Row | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRow = async (): Promise<void> => {
      const { data } = await supabase
        .from('projects')
        .select('ai_generation_status, vercel_deployment_url')
        .eq('id', projectId)
        .maybeSingle();
      if (!cancelled && data) setRow(data as Row);
    };

    fetchRow();

    const channel = supabase
      .channel(`live-site-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
        (payload) => setRow(payload.new as Row),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  if (!row || row.ai_generation_status !== 'done' || !row.vercel_deployment_url) return null;

  return (
    <a
      href={row.vercel_deployment_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-block"
    >
      <Badge className="gap-1 bg-green-600 hover:bg-green-700">
        <ExternalLink className="h-3 w-3" />
        No ar
      </Badge>
    </a>
  );
};
