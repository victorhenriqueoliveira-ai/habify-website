import { z } from 'zod';

/**
 * Esquemas de validação usando Zod
 * FASE 3 - Item 10: Melhorar validação de formulários
 */

// Validação de CPF
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cpfDigitsRegex = /^\d{11}$/;

function isValidCPF(cpf: string): boolean {
  // Remove caracteres especiais
  const digits = cpf.replace(/\D/g, '');
  
  if (digits.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(digits.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(digits.charAt(10))) return false;
  
  return true;
}

// Validação de telefone brasileiro
const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
const phoneDigitsRegex = /^\d{10,11}$/;

// Senha forte
const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos um caractere especial');

// Email
const emailSchema = z
  .string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório');

// CPF
const cpfSchema = z
  .string()
  .refine((val) => cpfRegex.test(val) || cpfDigitsRegex.test(val), {
    message: 'CPF inválido. Use o formato XXX.XXX.XXX-XX ou 11 dígitos'
  })
  .refine(isValidCPF, {
    message: 'CPF inválido'
  });

// Telefone
const phoneSchema = z
  .string()
  .refine((val) => phoneRegex.test(val) || phoneDigitsRegex.test(val), {
    message: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX'
  });

// Nome
const nameSchema = z
  .string()
  .min(3, 'Nome deve ter no mínimo 3 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras');

// Esquema de Checkout
export const checkoutSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.union([z.string().length(0), passwordSchema]), // Opcional ou forte
  phone: phoneSchema.optional().or(z.literal('')),
  cpf: cpfSchema.optional().or(z.literal('')),
  paymentMethod: z.enum(['PIX', 'CARD']),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Esquema de Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Esquema de Registro
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: phoneSchema.optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Esquema de Perfil
export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  company: z.string().max(100).optional().or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Esquema de Projeto
export const projectSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').max(1000).optional().or(z.literal('')),
  location: z.string().min(3, 'Localização deve ter no mínimo 3 caracteres').max(200).optional().or(z.literal('')),
  price: z.number().min(0, 'Preço deve ser maior que 0').optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  area: z.number().min(0).optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// Esquema de Propriedade de Portfólio
export const portfolioPropertySchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').max(2000),
  location: z.string().min(3, 'Localização é obrigatória').max(200),
  price: z.number().min(0, 'Preço deve ser maior que 0'),
  property_type: z.string().min(1, 'Tipo de imóvel é obrigatório'),
  purpose: z.enum(['sale', 'rent'], { message: 'Finalidade inválida' }),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  area: z.number().min(1, 'Área deve ser maior que 0'),
  parking_spaces: z.number().int().min(0).max(20).optional(),
  floor_number: z.number().int().optional(),
  condominium_fee: z.number().min(0).optional(),
  iptu: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
});

export type PortfolioPropertyFormData = z.infer<typeof portfolioPropertySchema>;

// Helpers para formatação
export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
