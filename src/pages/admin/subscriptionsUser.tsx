import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCanViewPlans } from "@/hooks/useCanViewPlans";
import { useUserPlans } from "@/hooks/useUserPlans";
import { useNavigate } from "react-router-dom";

export const SubscriptionsUserPage: React.FC = ( ) => {
  const { plans, loading } = useUserPlans();
  const navigate = useNavigate();
  const { canViewPlans } = useCanViewPlans();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Carregando informações...</p>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Nenhuma assinatura encontrada.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg min-h-screen">
        {plans.map((plan) => (
            <Card
                key={plan.id}
                className="p-6 mb-8 shadow-sm border border-gray-200 bg-white"
            >
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Detalhes da assinatura
                </h1>

              <Badge className={`${getStatusColor(plan.status)} text-sm py-1 px-3`}>
                {plan.status === "active" ? "Ativa" : "Inativa"}
              </Badge>
            </div>

            {/* Dados principais */}
            <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-8 border-b pb-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Plano</p>
                <p className="text-lg font-semibold text-gray-900">
                  {plan.plan_name || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {plan.status === "active"
                    ? "Ativo"
                    : plan.status === "cancelled"
                    ? "Cancelado"
                    : "Inativo"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Data de início</p>
                <p className="text-lg font-semibold text-gray-900">
                  {plan.created_at
                    ? format(new Date(plan.created_at), "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Expira</p>
                <p className="text-lg font-semibold text-gray-900">
                  {plan.expires_at
                    ? format(new Date(plan.expires_at), "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                </p>
              </div>

              <div className="col-span-full">
                <p className="text-sm text-gray-500 mb-1">Valor da assinatura</p>
                <p className="text-lg font-semibold text-gray-900">
                  {plan.plan_price ? `R$ ${plan.plan_price}` : "Sob consulta"}
                </p>
              </div>

              <div className="col-span-full">
                <p className="text-sm text-gray-500 mb-1">Comentário</p>
                <p className="text-lg font-semibold text-gray-900">
                  {plan.notes || "—"}
                </p>
              </div>
            </div>
        </Card>
        ))}
    </div>
  );
};
