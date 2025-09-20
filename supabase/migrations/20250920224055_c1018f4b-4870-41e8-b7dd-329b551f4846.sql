-- Create orders table to replace transactions for better organization
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- References profile, not auth.users yet
  plan_id UUID REFERENCES public.plans(id),
  abacatepay_id TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_data JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = orders.user_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (is_admin_or_dev());

CREATE POLICY "System can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update orders" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add auth_user_id to profiles to link with auth.users when activated
ALTER TABLE public.profiles ADD COLUMN auth_user_id UUID UNIQUE;