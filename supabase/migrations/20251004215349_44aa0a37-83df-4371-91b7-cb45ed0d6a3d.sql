-- Criar tabela de logs de pagamento para auditoria
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  status_code INTEGER,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all payment logs"
ON public.payment_logs
FOR SELECT
TO authenticated
USING (is_admin_or_dev());

-- Sistema pode criar logs
CREATE POLICY "System can create payment logs"
ON public.payment_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ajustar tabela orders para permitir user_id nulo inicialmente
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payment_logs_gateway ON public.payment_logs(gateway);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON public.payment_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_abacatepay_id ON public.orders(abacatepay_id);
CREATE INDEX IF NOT EXISTS idx_orders_hubla_transaction_id ON public.orders(hubla_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_gateway ON public.orders(gateway);