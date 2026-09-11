import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineProjectRow {
  id: string;
  title: string;
  user_id: string;
  status: string;
  ai_generation_status: string | null;
  ai_generation_error: string | null;
  github_repo_url: string | null;
  github_repo_name: string | null;
  vercel_project_id: string | null;
  vercel_deployment_url: string | null;
  vercel_custom_domain: string | null;
  vercel_domain_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

const PIPELINE_COLUMNS =
  'id, title, user_id, status, ai_generation_status, ai_generation_error, github_repo_url, github_repo_name, vercel_project_id, vercel_deployment_url, vercel_custom_domain, vercel_domain_verified, created_at, updated_at';

/**
 * Visão geral do pipeline de geração automática (git + vercel + domínio)
 * pra todos os projetos — base do painel de dev em PipelineLogsPage.
 */
export const usePipelineOverview = () => {
  const [projects, setProjects] = useState<PipelineProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(PIPELINE_COLUMNS)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data as PipelineProjectRow[]) || []);
    } catch (error) {
      console.error('Error fetching pipeline overview:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel('pipeline-overview')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchProjects();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { projects, loading, refetch: fetchProjects };
};
