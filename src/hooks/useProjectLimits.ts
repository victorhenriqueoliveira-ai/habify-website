import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';

export const useProjectLimits = () => {
  const { user, hasRole } = useAuth();
  const { projects } = useProjects();
  const [canCreateProject, setCanCreateProject] = useState(true);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);

  useEffect(() => {
    if (!user?.id && !user?.userId) return;

    const userId = user.userId || user.id;
    const userProjects = projects.filter(p => p.userId === userId);
    
    // Projetos ativos são aqueles que não estão "completed" ou "rejected"
    const activeProjects = userProjects.filter(p => 
      p.status !== 'completed' && p.status !== 'rejected'
    );
    
    setActiveProjectsCount(activeProjects.length);
    
    // Limitar a 1 projeto ativo por usuário regular
    // Admins e devs podem ter projetos ilimitados (usando user_roles table)
    if (hasRole(['admin', 'dev'])) {
      setCanCreateProject(true);
    } else {
      setCanCreateProject(activeProjects.length === 0);
    }
  }, [projects, user, hasRole]);

  return {
    canCreateProject,
    activeProjectsCount,
    maxProjects: 1,
  };
};