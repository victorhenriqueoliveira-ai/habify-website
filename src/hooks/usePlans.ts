import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Plan {
  id: string;
  name: string;
  type: 'website_only' | 'website_maintenance_1m' | 'website_maintenance_6m';
  price: number;
  pix_price?: number;
  description: string;
  features: string[];
  is_active: boolean;
  credits_granted?: number;
}

export const usePlans = () => {
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

      const formattedPlans: Plan[] = data?.map((plan) => ({
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: Number(plan.price),
        pix_price: plan.pix_price ? Number(plan.pix_price) : undefined,
        description: plan.description || '',
        features: Array.isArray(plan.features) ? plan.features.filter(f => typeof f === 'string') as string[] : [],
        is_active: plan.is_active,
        credits_granted: plan.credits_granted || 1,
      })) || [];

      setPlans(formattedPlans);
    } catch (error) {
      setError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
  };
};