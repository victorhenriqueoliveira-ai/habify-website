import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Plan {
  id: string;
  name: string;
  type: 'website_only' | 'website_maintenance_1m' | 'website_maintenance_6m';
  price: number;
  description: string;
  features: string[];
  is_active: boolean;
}

export const usePlans = () => {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      const formattedPlans: Plan[] = data?.map((plan) => {
        // Para usuários não autenticados, mascarar dados sensíveis
        if (!isAuthenticated) {
          return {
            id: plan.id,
            name: plan.name,
            type: plan.type,
            price: Number(plan.price),
            description: plan.description || '',
            // Features genéricas para não expor estratégia completa
            features: [
              'Website profissional',
              'Design responsivo',
              'Otimização SEO',
              ...(plan.type.includes('maintenance') ? ['Suporte técnico'] : [])
            ],
            is_active: plan.is_active,
          };
        }
        
        // Para usuários autenticados, dados completos
        return {
          id: plan.id,
          name: plan.name,
          type: plan.type,
          price: Number(plan.price),
          description: plan.description || '',
          features: Array.isArray(plan.features) ? plan.features.filter(f => typeof f === 'string') as string[] : [],
          is_active: plan.is_active,
        };
      }) || [];

      setPlans(formattedPlans);
    } catch (error) {
      setError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [isAuthenticated]); // Atualizar quando auth state mudar

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
  };
};