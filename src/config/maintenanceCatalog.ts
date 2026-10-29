/**
 * Catálogo de manutenção para o formulário.
 *
 * Reexporta o arquivo que a edge function usa, em vez de manter uma cópia
 * aqui: as duas listas discordando é como o cliente consegue pedir uma
 * alteração que o formulário oferece e o servidor recusa. O arquivo é
 * TypeScript puro — não usa nada de Deno —, então o Vite empacota sem
 * problema.
 *
 * A validação do navegador é conveniência: quem decide o que entra no
 * repositório do cliente é a edge function, que roda no servidor e valida
 * de novo. Esta cópia roda na máquina de quem está pedindo.
 */
export {
  PROPERTY_FIELDS,
  SITE_FIELDS,
  findPropertyField,
  findSiteField,
  validateFieldValue,
  type EditableField,
  type FieldKind,
} from '../../supabase/functions/_shared/maintenance-catalog';

import { PROPERTY_FIELDS, SITE_FIELDS, type EditableField } from '../../supabase/functions/_shared/maintenance-catalog';

/** Rótulos em português dos valores de enum, para o formulário. */
export const ENUM_LABELS: Record<string, Record<string, string>> = {
  property_type: {
    apartment: 'Apartamento',
    house: 'Casa',
    commercial: 'Sala comercial',
    land: 'Terreno',
    warehouse: 'Galpão industrial',
    penthouse: 'Cobertura',
  },
  purpose: {
    sale: 'Venda',
    rent: 'Aluguel',
  },
  creciType: {
    individual: 'Pessoa física',
    company: 'Pessoa jurídica',
  },
};

export function optionLabel(field: EditableField, value: string): string {
  return ENUM_LABELS[field.key]?.[value] ?? value;
}

/** Agrupa os campos do site por assunto, pra lista do formulário não virar um paredão. */
export const SITE_FIELD_GROUPS: Array<{ label: string; keys: string[] }> = [
  { label: 'Contato', keys: ['contactMobile', 'contactPhone', 'contactEmail'] },
  { label: 'Identificação', keys: ['companyName', 'ownerName', 'creciNumber', 'creciType'] },
  {
    label: 'Endereço',
    keys: [
      'addressCep',
      'addressStreet',
      'addressNumber',
      'addressComplement',
      'addressNeighborhood',
      'addressCity',
      'addressState',
    ],
  },
  {
    label: 'Números do site',
    keys: ['statsPropertiesSold', 'statsYearsExperience', 'statsHappyClients'],
  },
  { label: 'Avançado', keys: ['googleAnalyticsId'] },
];

export const PROPERTY_FIELD_LIST = PROPERTY_FIELDS;
export const SITE_FIELD_LIST = SITE_FIELDS;
