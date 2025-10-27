/**
 * Mensagens de erro padronizadas do sistema
 * Fase 2 - Item 8: Padronizar mensagens de erro
 */

export const ErrorMessages = {
  // Erros de Pagamento
  PAYMENT_NOT_FOUND: 'Pagamento não encontrado. Verifique se o pagamento foi concluído.',
  PAYMENT_PENDING: 'Pagamento ainda está sendo processado. Aguarde alguns instantes.',
  PAYMENT_FAILED: 'Falha ao processar o pagamento. Entre em contato com o suporte.',
  PAYMENT_VERIFICATION_ERROR: 'Erro ao verificar pagamento. Tente novamente em instantes.',
  PAYMENT_ID_MISSING: 'ID de pagamento não fornecido. Entre em contato com o suporte.',
  
  // Erros de Ordem
  ORDER_NOT_FOUND: 'Pedido não encontrado. Verifique se o pagamento foi concluído.',
  ORDER_ALREADY_PAID: 'Este pedido já foi pago anteriormente.',
  ORDER_DUPLICATE: 'Você já tem um pedido pendente. Complete o pagamento anterior ou aguarde alguns minutos.',
  
  // Erros de Plano
  PLAN_NOT_FOUND: 'Plano não encontrado. Tente novamente.',
  PLAN_INACTIVE: 'Este plano não está mais disponível para compra. Entre em contato com o suporte.',
  PLAN_PRICE_INVALID: 'Preço do plano inválido. Entre em contato com o suporte.',
  PLAN_NO_CHECKOUT_URL: 'Link de pagamento com cartão não está configurado. Entre em contato com o suporte.',
  
  // Erros de Usuário/Perfil
  USER_NOT_FOUND: 'Usuário não encontrado.',
  USER_INACTIVE: 'Sua conta não está ativa. Entre em contato com o suporte.',
  USER_ALREADY_EXISTS: 'Já existe uma conta com este email.',
  PROFILE_NOT_FOUND: 'Perfil de usuário não encontrado.',
  PROFILE_INCOMPLETE: 'Dados do perfil incompletos. Entre em contato com o suporte.',
  
  // Erros de Autenticação
  AUTH_FAILED: 'Falha na autenticação. Verifique suas credenciais.',
  AUTH_USER_NOT_ACTIVATED: 'Usuário ainda não foi ativado. Aguarde a confirmação do pagamento.',
  AUTH_SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
  AUTH_UNAUTHORIZED: 'Você não tem permissão para acessar este recurso.',
  
  // Erros de Senha
  PASSWORD_WEAK: 'A senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais.',
  PASSWORD_REQUIRED: 'Senha é obrigatória para novos usuários.',
  PASSWORD_MISMATCH: 'As senhas não coincidem.',
  
  // Erros de Validação
  VALIDATION_EMAIL_INVALID: 'Email inválido.',
  VALIDATION_CPF_INVALID: 'CPF inválido.',
  VALIDATION_PHONE_INVALID: 'Telefone inválido.',
  VALIDATION_REQUIRED_FIELD: 'Este campo é obrigatório.',
  VALIDATION_MIN_LENGTH: 'Mínimo de caracteres não atingido.',
  VALIDATION_MAX_LENGTH: 'Máximo de caracteres excedido.',
  
  // Erros de Crédito
  CREDITS_INSUFFICIENT: 'Você não tem créditos suficientes para criar um site.',
  CREDITS_ADD_FAILED: 'Erro ao adicionar créditos. Entre em contato com o suporte.',
  CREDITS_USE_FAILED: 'Erro ao usar créditos. Entre em contato com o suporte.',
  
  // Erros de Email
  EMAIL_SEND_FAILED: 'Falha ao enviar email de confirmação. Seu pagamento foi processado com sucesso.',
  EMAIL_DATA_INCOMPLETE: 'Dados para envio de email incompletos.',
  
  // Erros de Webhook
  WEBHOOK_UNAUTHORIZED: 'Token de webhook inválido ou ausente.',
  WEBHOOK_INVALID_DATA: 'Dados do webhook inválidos.',
  WEBHOOK_PROCESSING_ERROR: 'Erro ao processar webhook. O pagamento será verificado novamente.',
  
  // Erros Genéricos
  INTERNAL_ERROR: 'Erro interno do sistema. Entre em contato com o suporte.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
  TIMEOUT_ERROR: 'A operação demorou muito tempo. Tente novamente.',
  UNKNOWN_ERROR: 'Erro desconhecido. Entre em contato com o suporte.',
  
  // Mensagens de Sucesso
  SUCCESS_PAYMENT_CONFIRMED: 'Pagamento confirmado! Bem-vindo à Habify!',
  SUCCESS_ACCOUNT_CREATED: 'Conta criada com sucesso! Faça login para continuar.',
  SUCCESS_CREDITS_ADDED: 'Créditos adicionados com sucesso!',
  SUCCESS_LOGIN: 'Login realizado com sucesso!',
  SUCCESS_LOGOUT: 'Logout realizado com sucesso!',
  
  // Mensagens de Info
  INFO_PAYMENT_PROCESSING: 'Pagamento sendo processado. Aguarde a confirmação.',
  INFO_ACCOUNT_PENDING: 'Sua conta está sendo criada. Aguarde alguns instantes.',
  INFO_REDIRECTING: 'Redirecionando...',
} as const;

export type ErrorMessageKey = keyof typeof ErrorMessages;

/**
 * Função helper para obter mensagem de erro
 * @param key - Chave da mensagem
 * @param fallback - Mensagem padrão caso a chave não exista
 */
export const getErrorMessage = (
  key: ErrorMessageKey,
  fallback?: string
): string => {
  return ErrorMessages[key] || fallback || ErrorMessages.UNKNOWN_ERROR;
};

/**
 * Função helper para obter mensagem de erro do Supabase
 * @param error - Erro do Supabase
 */
export const getSupabaseErrorMessage = (error: any): string => {
  if (!error) return ErrorMessages.UNKNOWN_ERROR;
  
  // Erros comuns do Supabase
  if (error.message?.includes('JWT')) {
    return ErrorMessages.AUTH_SESSION_EXPIRED;
  }
  
  if (error.message?.includes('not found')) {
    return ErrorMessages.ORDER_NOT_FOUND;
  }
  
  if (error.message?.includes('duplicate')) {
    return ErrorMessages.USER_ALREADY_EXISTS;
  }
  
  if (error.code === '23505') {
    return ErrorMessages.USER_ALREADY_EXISTS;
  }
  
  if (error.code === '23503') {
    return ErrorMessages.VALIDATION_REQUIRED_FIELD;
  }
  
  return error.message || ErrorMessages.UNKNOWN_ERROR;
};
