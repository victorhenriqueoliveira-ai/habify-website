import type { PropertyData } from '@/hooks/useMultipleProjects';
import type { WizardData } from '@/types/wizard';

/**
 * Validação do wizard de criação de projeto.
 *
 * Ficou fora dos componentes de propósito: antes cada etapa validava
 * dentro do `handleNext` disparando `toast.error` e um `return false` no
 * primeiro erro encontrado. Na prática o cliente corrigia o título, clicava
 * em Próximo, e só então descobria que faltava a localização — um erro por
 * vez, numa notificação que some sozinha e não aponta o campo.
 *
 * Aqui as funções são puras: recebem o estado e devolvem **todos** os
 * problemas de uma vez, com a chave do campo que os causou.
 */

/** Erro por campo. A chave casa com o `id` do input que o originou. */
export type FieldErrors = Record<string, string>;

/** Chave de erro de um imóvel do portfólio — casa com o id do input. */
export const propertyFieldKey = (index: number, field: string) => `${field}-${index}`;

/** Rótulo legível de um imóvel, pro resumo no topo da etapa. */
export const propertyLabel = (property: PropertyData, index: number) =>
  property.title?.trim() || `Imóvel ${index + 1}`;

export function validatePlanStep(selectedPlanId: string): FieldErrors {
  return selectedPlanId ? {} : { plan: 'Escolha qual plano usar neste projeto.' };
}

export function validateLogoStep(data: Partial<WizardData>): FieldErrors {
  if (data.hasLogo && !data.logoUrl) {
    return { logoUrl: 'Envie o arquivo do logotipo, ou escolha "Quero que vocês criem".' };
  }
  return {};
}

export function validatePropertiesStep(properties: PropertyData[]): FieldErrors {
  if (properties.length === 0) {
    return { properties: 'Adicione pelo menos um imóvel.' };
  }

  const errors: FieldErrors = {};

  properties.forEach((property, index) => {
    const key = (field: string) => propertyFieldKey(index, field);

    if (!property.title?.trim()) {
      errors[key('title')] = 'Dê um título para este imóvel.';
    }

    if (!property.location?.trim()) {
      errors[key('full-location')] = 'Busque o CEP para preencher a localização.';
    }

    // Preço é opcional (vira "Sob consulta" no site) — só valida se foi preenchido.
    if (property.price && parseFloat(property.price.replace(/\D/g, '')) <= 0) {
      errors[key('price')] = 'Valor inválido. Deixe em branco para "Sob consulta".';
    }

    if (!property.area || parseFloat(property.area) <= 0) {
      errors[key('area')] = 'Informe a área em m².';
    }

    if (property.photos.length === 0) {
      errors[key('photos')] = 'Adicione pelo menos uma foto deste imóvel.';
    }
  });

  return errors;
}

export function validateProjectDataStep(data: Partial<WizardData>): FieldErrors {
  const errors: FieldErrors = {};

  const required: Array<[keyof WizardData, string]> = [
    ['profileType', 'Escolha o tipo de perfil.'],
    ['ownerName', 'Informe o nome do responsável.'],
    ['companyName', 'Informe o nome da empresa.'],
    ['creciNumber', 'Informe o número do CRECI.'],
    ['creciType', 'Escolha o tipo de CRECI.'],
    ['addressCep', 'Informe o CEP.'],
    ['addressStreet', 'Informe a rua.'],
    ['addressNumber', 'Informe o número.'],
    ['addressState', 'Informe o estado.'],
    ['addressCity', 'Informe a cidade.'],
    ['addressNeighborhood', 'Informe o bairro.'],
    ['contactMobile', 'Informe o celular/WhatsApp.'],
  ];

  required.forEach(([field, message]) => {
    const value = data[field];
    if (typeof value === 'string' ? !value.trim() : !value) {
      errors[field] = message;
    }
  });

  if (!data.contactEmail?.trim()) {
    errors.contactEmail = 'Informe o e-mail de contato.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = 'Esse e-mail parece incompleto.';
  }

  if (!data.contactEmailConfirm?.trim()) {
    errors.contactEmailConfirm = 'Repita o e-mail para confirmar.';
  } else if (data.contactEmail !== data.contactEmailConfirm) {
    errors.contactEmailConfirm = 'Os e-mails não conferem.';
  }

  return errors;
}
