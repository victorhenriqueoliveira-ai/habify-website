/**
 * Utility functions for form validation and visual feedback
 * Fase 2 - Item 9: Melhorar UX e validação de formulários
 */

import { ErrorMessages } from '@/lib/errorMessages';

/**
 * Valida arquivo de imagem e retorna mensagem de erro se inválido
 */
export const validateImageFile = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return `Arquivo "${file.name}" não é um formato válido. Use JPG, PNG ou WEBP.`;
  }

  if (file.size > maxSize) {
    return `Arquivo "${file.name}" é muito grande. Máximo 5MB por arquivo.`;
  }

  return null;
};

/**
 * Valida múltiplos arquivos de imagem
 */
export const validateImageFiles = (
  files: File[],
  maxFiles: number = 10
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (files.length > maxFiles) {
    errors.push(`Máximo de ${maxFiles} fotos por projeto`);
    return { valid: false, errors };
  }

  files.forEach((file) => {
    const error = validateImageFile(file);
    if (error) {
      errors.push(error);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Retorna classes CSS para input inválido
 */
export const getInputErrorClasses = (hasError: boolean): string => {
  return hasError 
    ? 'border-destructive focus-visible:ring-destructive' 
    : '';
};

/**
 * Retorna mensagem de erro amigável para erros comuns do Supabase
 */
export const getSupabaseErrorMessage = (error: any): string => {
  if (!error) return ErrorMessages.UNKNOWN_ERROR;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code;

  // Auth errors
  if (errorMessage.includes('jwt') || errorMessage.includes('token')) {
    return ErrorMessages.AUTH_SESSION_EXPIRED;
  }

  if (errorMessage.includes('invalid login credentials')) {
    return ErrorMessages.AUTH_FAILED;
  }

  // Database errors
  if (errorCode === '23505' || errorMessage.includes('duplicate')) {
    return ErrorMessages.USER_ALREADY_EXISTS;
  }

  if (errorCode === '23503' || errorMessage.includes('foreign key')) {
    return 'Operação não permitida devido a dependências existentes.';
  }

  if (errorMessage.includes('not found')) {
    return 'Registro não encontrado.';
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return ErrorMessages.NETWORK_ERROR;
  }

  // Return original message if no match
  return error.message || ErrorMessages.UNKNOWN_ERROR;
};

/**
 * Debounce function para validação em tempo real
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Formata mensagem de erro para display
 */
export const formatErrorForDisplay = (
  error: any,
  fieldName?: string
): string => {
  if (typeof error === 'string') return error;
  
  if (error?.message) {
    return fieldName 
      ? `${fieldName}: ${error.message}` 
      : error.message;
  }

  return ErrorMessages.UNKNOWN_ERROR;
};
