import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Plan {
  id: string;
  name: string;
  type: 'website_only' | 'website_maintenance_1m' | 'website_maintenance_6m' | 'domain_registration';
  price: number;
  pix_price?: number;
  description: string;
  features: string[];
  is_active: boolean;
  credits_granted?: number;
}

async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;

  return (
    data?.map((plan) => ({
      id: plan.id,
      name: plan.name,
      type: plan.type,
      price: Number(plan.price),
      pix_price: plan.pix_price ? Number(plan.pix_price) : undefined,
      description: plan.description || '',
      features: Array.isArray(plan.features)
        ? (plan.features.filter((f) => typeof f === 'string') as string[])
        : [],
      is_active: plan.is_active,
      credits_granted: plan.credits_granted || 1,
    })) || []
  );
}

/**
 * Planos ativos, em cache compartilhado.
 *
 * Antes isto era useState + useEffect, ou seja, **cada tela que montava
 * refazia o fetch do zero**. Na prática: a landing buscava os planos, o
 * visitante clicava em "Criar meu site" e o checkout buscava tudo de
 * novo, mostrando esqueleto de página inteira durante a ida ao servidor.
 * Com o react-query (o QueryClientProvider já é a raiz do App), a
 * segunda tela aproveita o que a primeira já trouxe e abre instantânea.
 *
 * A assinatura de retorno é a mesma de antes, de propósito: há cinco
 * consumidores e nenhum precisou mudar.
 */
export const usePlans = () => {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    plans: data ?? [],
    loading: isPending,
    error: error ? 'Erro ao carregar planos' : null,
    refetch,
  };
};
