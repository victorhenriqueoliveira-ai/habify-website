UPDATE public.plans
SET 
  name = 'Plano Corretor',
  price = 300.00,
  description = 'Site profissional em React.js para corretores — até 5 empreendimentos',
  features = '["Até 5 empreendimentos cadastrados", "Site 100% em React.js (mesma tecnologia do Airbnb e QuintoAndar)", "Design responsivo e otimizado para mobile", "Captura de leads via WhatsApp", "Otimização SEO para Google", "Google Analytics integrado", "Domínio personalizado", "Pagamento único — sem mensalidades"]'::jsonb,
  updated_at = now()
WHERE id = '9fb31f78-ed65-44e7-a67d-271a0cad8eb9';