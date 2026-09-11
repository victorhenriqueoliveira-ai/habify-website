import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
}

/**
 * Verifica se o usuário autenticado tem uma feature flag ativa.
 *
 * Uso:
 *   const { enabled, loading } = useFeatureFlag('minha_flag');
 *   if (loading) return null;
 *   if (!enabled) return null;
 *   return <NewExperimentalUI />;
 *
 * IMPORTANTE: este hook é apenas a primeira camada de defesa.
 * Edge Functions DEVEM revalidar via `has_feature_flag()` no banco.
 */
export const useFeatureFlag = (flagName: string): UseFeatureFlagResult => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async (): Promise<void> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) {
            setEnabled(false);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('feature_flags_users')
          .select('enabled')
          .eq('user_id', user.id)
          .eq('flag_name', flagName)
          .eq('enabled', true)
          .maybeSingle();

        if (cancelled) return;
        setEnabled(!error && !!data);
      } catch {
        if (!cancelled) setEnabled(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [flagName]);

  return { enabled, loading };
};

/**
 * Versão imperativa (fora de componentes React), pra usar em handlers e
 * outros pontos fora do corpo de um componente.
 */
export const checkFeatureFlag = async (
  userId: string,
  flagName: string,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('feature_flags_users')
      .select('enabled')
      .eq('user_id', userId)
      .eq('flag_name', flagName)
      .eq('enabled', true)
      .maybeSingle();

    return !error && !!data;
  } catch {
    return false;
  }
};
