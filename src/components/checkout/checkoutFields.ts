import { isValidCPF } from '@/lib/validations';

export type CheckoutFieldKey = 'name' | 'email' | 'cpf' | 'phone' | 'password';

export interface FieldRule {
  label: string;
  /** Texto de apoio mostrado quando o campo está em repouso ou válido. */
  hint: string;
  /** Devolve a mensagem de erro, ou null se estiver válido. */
  validate: (value: string) => string | null;
}

/**
 * Regras de validação do checkout.
 *
 * As mensagens dizem o que fazer, não só que está errado — "Faltam 3
 * dígitos" em vez de "CPF inválido". Antes tudo isso só aparecia como
 * toast no canto da tela depois de o usuário enviar o formulário, sem
 * apontar qual campo tinha o problema.
 */
export const CHECKOUT_RULES: Record<CheckoutFieldKey, FieldRule> = {
  name: {
    label: 'nome completo',
    hint: 'Como aparece no seu documento.',
    validate: (value) => {
      const parts = value.trim().split(/\s+/).filter(Boolean);
      if (!value.trim()) return 'Preencha seu nome completo.';
      if (parts.length < 2) return 'Falta o sobrenome.';
      if (parts.some((p) => p.length < 2)) return 'Confira o nome — alguma parte ficou muito curta.';
      return null;
    },
  },
  email: {
    label: 'e-mail',
    hint: 'É pra onde vai o acesso ao painel e o recibo.',
    validate: (value) => {
      if (!value.trim()) return 'Preencha seu e-mail.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) return 'Esse e-mail parece incompleto.';
      return null;
    },
  },
  cpf: {
    label: 'CPF',
    hint: 'Exigido pelo processador de pagamento.',
    validate: (value) => {
      const digits = value.replace(/\D/g, '');
      if (!digits) return 'Preencha seu CPF.';
      if (digits.length < 11) {
        const missing = 11 - digits.length;
        return `Faltam ${missing} dígito${missing > 1 ? 's' : ''}.`;
      }
      if (!isValidCPF(value)) return 'Esse CPF não é válido. Confira os números.';
      return null;
    },
  },
  phone: {
    label: 'celular',
    hint: 'É o número que vai receber os leads do site.',
    validate: (value) => {
      const digits = value.replace(/\D/g, '');
      if (!digits) return 'Preencha seu celular.';
      if (digits.length < 10) return 'Faltam dígitos — inclua o DDD.';
      if (digits.length > 11) return 'Número muito longo. Confira os dígitos.';
      return null;
    },
  },
  password: {
    label: 'senha',
    hint: 'Mínimo de 6 caracteres.',
    validate: (value) => {
      if (!value) return 'Crie uma senha.';
      if (value.length < 6) {
        const missing = 6 - value.length;
        return `Faltam ${missing} caractere${missing > 1 ? 's' : ''}.`;
      }
      return null;
    },
  },
};

/** 0 = vazia, 1 = fraca, 2 = ok, 3 = forte. */
export function passwordStrength(value: string): 0 | 1 | 2 | 3 {
  if (!value) return 0;
  if (value.length >= 12 || (value.length >= 9 && /[A-Z]/.test(value) && /\d/.test(value))) return 3;
  if (value.length >= 9 && /[^a-zA-Z]/.test(value)) return 2;
  if (value.length >= 6) return 1;
  return 1;
}
