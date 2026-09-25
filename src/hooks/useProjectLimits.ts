import { useAuth } from '@/contexts/AuthContext';
import { useUserPlans } from '@/hooks/useUserPlans';

/**
 * Se o usuário pode criar um projeto novo agora. Antes limitava a 1 projeto
 * ativo por vez (mesmo com planos pagos sobrando) — um usuário com 2 planos
 * não conseguia começar o segundo site até o primeiro ser concluído. Agora
 * a única regra real é ter plano disponível pra usar (mesma checagem que já
 * existia em MyProjectsPage pro botão "Criar Novo Projeto"); admin/dev
 * continuam sem limite.
 */
export const useProjectLimits = () => {
  const { hasRole } = useAuth();
  const { availablePlans, loading } = useUserPlans();

  const canCreateProject = hasRole(['admin', 'dev']) || availablePlans.length > 0;

  return {
    canCreateProject,
    loading,
  };
};
