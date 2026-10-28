import React from 'react';
import { useUserPlans } from '@/hooks/useUserPlans';
import { Package } from 'lucide-react';
import { LoadingState, PageHeader } from '@/components/admin/ui';
import { AvailableCreditsSection, PlanHistorySection } from '@/components/admin/PlanSections';

export const SubscriptionsUserPage: React.FC = () => {
  const { plans, availablePlans, loading } = useUserPlans();

  if (loading) {
    return <LoadingState label="Carregando suas assinaturas..." size="lg" fullScreen />;
  }

  return (
    /* Sem container próprio: o AdminLayout já centraliza e dá o padding. */
    <div className="space-y-6">
      <PageHeader
        icon={Package}
        eyebrow="Conta"
        title="Minhas assinaturas"
        description="Gerencie e visualize seus planos contratados"
      />

      <AvailableCreditsSection
        credits={availablePlans}
        description="Cada crédito vale um site. Use em “Criar novo projeto”."
      />

      <PlanHistorySection
        plans={plans}
        emptyDescription="Quando você adquirir um plano, ele aparece aqui com data de aquisição, uso e validade."
      />
    </div>
  );
};
