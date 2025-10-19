import { useAuth } from '@/contexts/AuthContext';

export const useCanViewPlans = () => {
  const { user, hasRole } = useAuth();
  
  // Admin e Dev não devem ver seções de compra de planos
  const canViewPlans = !hasRole(['admin', 'dev']);
  
  return {
    canViewPlans,
    isAdminOrDev: hasRole(['admin', 'dev'])
  };
};
