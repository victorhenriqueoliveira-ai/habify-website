// Catálogo do que uma solicitação de manutenção pode alterar sozinha.
//
// Esta é a autoridade: é por aqui que um valor vindo do navegador vira
// conteúdo no repositório do cliente. O espelho em
// src/config/maintenanceCatalog.ts existe só pra desenhar o formulário e
// precisa ser atualizado junto — mas quem decide o que passa é este
// arquivo, porque o outro roda na máquina de quem está pedindo.
//
// Antes existiam dois Sets de nomes de coluna e nada mais: a allowlist
// dizia *em qual coluna* dava pra escrever, mas não *o que* dava pra
// escrever nela. Um preço negativo, um ano de construção com 9 dígitos ou
// uma descrição de 10 MB passavam direto pro site.config.json.

export type FieldKind = 'text' | 'longtext' | 'number' | 'currency' | 'enum' | 'stringList';

export interface EditableField {
  /** Coluna (imóvel) ou chave do wizard_data (site). */
  key: string;
  label: string;
  kind: FieldKind;
  options?: readonly string[];
  /** Tamanho máximo pra texto; valor máximo pra número. */
  max?: number;
  min?: number;
}

export const PROPERTY_FIELDS: readonly EditableField[] = [
  { key: 'title', label: 'Título do imóvel', kind: 'text', max: 120 },
  { key: 'location', label: 'Localização', kind: 'text', max: 200 },
  { key: 'price', label: 'Valor', kind: 'currency', min: 0, max: 1_000_000_000 },
  { key: 'description', label: 'Descrição', kind: 'longtext', max: 5000 },
  { key: 'bedrooms', label: 'Quartos', kind: 'number', min: 0, max: 50 },
  { key: 'bathrooms', label: 'Banheiros', kind: 'number', min: 0, max: 50 },
  { key: 'area', label: 'Área (m²)', kind: 'number', min: 0, max: 1_000_000 },
  { key: 'parking_spaces', label: 'Vagas', kind: 'number', min: 0, max: 100 },
  { key: 'condominium_fee', label: 'Condomínio', kind: 'currency', min: 0, max: 1_000_000 },
  { key: 'iptu', label: 'IPTU', kind: 'currency', min: 0, max: 1_000_000 },
  // Novos — antes caíam em "outro" e viravam atendimento manual.
  {
    key: 'property_type',
    label: 'Tipo do imóvel',
    kind: 'enum',
    options: ['apartment', 'house', 'commercial', 'land', 'warehouse', 'penthouse'],
  },
  { key: 'purpose', label: 'Finalidade', kind: 'enum', options: ['sale', 'rent'] },
  { key: 'construction_year', label: 'Ano de construção', kind: 'number', min: 1800, max: 2100 },
  { key: 'floor_number', label: 'Andar', kind: 'number', min: 0, max: 200 },
  { key: 'badge', label: 'Selo', kind: 'text', max: 40 },
  { key: 'amenities', label: 'Comodidades', kind: 'stringList', max: 40 },
] as const;

export const SITE_FIELDS: readonly EditableField[] = [
  { key: 'companyName', label: 'Nome da empresa', kind: 'text', max: 120 },
  { key: 'ownerName', label: 'Nome do responsável', kind: 'text', max: 120 },
  { key: 'contactPhone', label: 'Telefone fixo', kind: 'text', max: 20 },
  { key: 'contactMobile', label: 'Celular / WhatsApp', kind: 'text', max: 20 },
  { key: 'contactEmail', label: 'E-mail de contato', kind: 'text', max: 150 },
  // Novos.
  { key: 'addressCep', label: 'CEP', kind: 'text', max: 10 },
  { key: 'addressStreet', label: 'Rua', kind: 'text', max: 150 },
  { key: 'addressNumber', label: 'Número', kind: 'text', max: 20 },
  { key: 'addressComplement', label: 'Complemento', kind: 'text', max: 60 },
  { key: 'addressNeighborhood', label: 'Bairro', kind: 'text', max: 100 },
  { key: 'addressCity', label: 'Cidade', kind: 'text', max: 100 },
  { key: 'addressState', label: 'Estado (UF)', kind: 'text', max: 2 },
  { key: 'creciNumber', label: 'Número do CRECI', kind: 'text', max: 30 },
  { key: 'creciType', label: 'Tipo de CRECI', kind: 'enum', options: ['individual', 'company'] },
  { key: 'statsPropertiesSold', label: 'Imóveis vendidos', kind: 'number', min: 0, max: 100_000 },
  { key: 'statsYearsExperience', label: 'Anos de experiência', kind: 'number', min: 0, max: 100 },
  { key: 'statsHappyClients', label: 'Clientes atendidos', kind: 'number', min: 0, max: 1_000_000 },
  { key: 'googleAnalyticsId', label: 'ID do Google Analytics', kind: 'text', max: 40 },
] as const;

export function findPropertyField(key: string): EditableField | undefined {
  return PROPERTY_FIELDS.find((f) => f.key === key);
}

export function findSiteField(key: string): EditableField | undefined {
  return SITE_FIELDS.find((f) => f.key === key);
}

export type ValidationResult =
  | { ok: true; value: string | number | string[] | null }
  | { ok: false; error: string };

/**
 * Valida e normaliza o valor antes de ele virar conteúdo do site.
 *
 * Devolve o valor já no formato que vai pro banco — número como número,
 * texto aparado, lista sem itens vazios — pra quem chama não ter que
 * refazer essa conversão e arriscar divergir daqui.
 */
export function validateFieldValue(field: EditableField, raw: unknown): ValidationResult {
  // Campo opcional sendo esvaziado é uma edição legítima ("tirar o selo").
  if (raw === null || raw === undefined || raw === '') {
    return { ok: true, value: null };
  }

  switch (field.kind) {
    case 'enum': {
      const value = String(raw);
      if (!field.options?.includes(value)) {
        return { ok: false, error: `"${field.label}" não aceita o valor "${value}".` };
      }
      return { ok: true, value };
    }

    case 'number':
    case 'currency': {
      const value = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
      if (!Number.isFinite(value)) {
        return { ok: false, error: `"${field.label}" precisa ser um número.` };
      }
      if (field.min !== undefined && value < field.min) {
        return { ok: false, error: `"${field.label}" não pode ser menor que ${field.min}.` };
      }
      if (field.max !== undefined && value > field.max) {
        return { ok: false, error: `"${field.label}" não pode passar de ${field.max}.` };
      }
      return { ok: true, value: field.kind === 'number' ? Math.round(value) : value };
    }

    case 'stringList': {
      if (!Array.isArray(raw)) {
        return { ok: false, error: `"${field.label}" precisa ser uma lista.` };
      }
      const items = raw
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
      if (items.length !== raw.length) {
        return { ok: false, error: `"${field.label}" tem itens inválidos.` };
      }
      if (field.max !== undefined && items.length > field.max) {
        return { ok: false, error: `"${field.label}" aceita no máximo ${field.max} itens.` };
      }
      if (items.some((item) => item.length > 60)) {
        return { ok: false, error: `Cada item de "${field.label}" deve ter até 60 caracteres.` };
      }
      return { ok: true, value: items };
    }

    case 'text':
    case 'longtext':
    default: {
      if (typeof raw !== 'string') {
        return { ok: false, error: `"${field.label}" precisa ser um texto.` };
      }
      const value = raw.trim();
      if (field.max !== undefined && value.length > field.max) {
        return {
          ok: false,
          error: `"${field.label}" passa do limite de ${field.max} caracteres.`,
        };
      }
      return { ok: true, value };
    }
  }
}
