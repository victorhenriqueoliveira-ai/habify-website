-- Adicionar campo CPF à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Criar índices únicos para email, phone e cpf
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique 
ON public.profiles(email) 
WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique 
ON public.profiles(phone) 
WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique 
ON public.profiles(cpf) 
WHERE cpf IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.cpf IS 'CPF do usuário (apenas dígitos, sem formatação)';
COMMENT ON INDEX profiles_email_unique IS 'Garante unicidade de email entre usuários';
COMMENT ON INDEX profiles_phone_unique IS 'Garante unicidade de telefone entre usuários';
COMMENT ON INDEX profiles_cpf_unique IS 'Garante unicidade de CPF entre usuários';