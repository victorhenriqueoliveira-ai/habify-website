import { FileText } from 'lucide-react';
import { SectionHeader, DetailField, DetailGrid } from '@/components/admin/ui';

/**
 * Tudo que o cliente preencheu ao criar o projeto, legível.
 *
 * As seções acima mostram o que o site usa; esta mostra o que foi enviado —
 * inclusive campos que nenhuma outra seção exibe. Serve de prova: quando o
 * cliente diz "não foi isso que eu coloquei", a resposta está aqui, com o
 * mesmo rótulo que ele viu no formulário.
 *
 * Antes isso existia só como um JSON bruto atrás de um botão de debug, e
 * só para admin/dev — o cliente não tinha como conferir o próprio envio.
 */

/** Rótulo de cada chave, igual ao que o wizard mostra. */
const LABELS: Record<string, string> = {
  profileType: 'Tipo de perfil',
  ownerName: 'Nome do responsável',
  companyName: 'Nome da empresa',
  siteName: 'Nome que aparece no site',
  creciNumber: 'CRECI',
  creciType: 'Tipo de CRECI',
  addressCep: 'CEP',
  addressStreet: 'Rua',
  addressNumber: 'Número',
  addressComplement: 'Complemento',
  addressNeighborhood: 'Bairro',
  addressCity: 'Cidade',
  addressState: 'Estado',
  contactPhone: 'Telefone fixo',
  contactMobile: 'Celular / WhatsApp',
  contactEmail: 'E-mail de contato',
  contactEmailConfirm: 'Confirmação do e-mail',
  desiredDomain: 'Domínio desejado',
  googleAnalyticsId: 'Google Analytics',
  accentColor: 'Cor de destaque',
  hasLogo: 'Enviou logo',
  logoUrl: 'Arquivo do logo',
  heroMediaType: 'Tipo de mídia do topo',
  heroVideoUrl: 'Vídeo/imagem do topo',
  statsPropertiesSold: 'Imóveis vendidos',
  statsYearsExperience: 'Anos de experiência',
  statsHappyClients: 'Clientes atendidos',
  layoutChoice: 'Layout',
  colorPalette: 'Paleta (sistema antigo)',
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  profileType: { corretor: 'Corretor de imóveis', imobiliaria: 'Imobiliária' },
  creciType: { individual: 'Individual', juridico: 'Jurídico' },
  accentColor: {
    dourado: 'Dourado',
    oliva: 'Oliva',
    terracota: 'Terracota',
    petroleo: 'Petróleo',
    grafite: 'Grafite',
  },
  heroMediaType: { image: 'Imagem', video: 'Vídeo' },
};

/** Ordem de leitura — a mesma do formulário, não a do objeto. */
const ORDER = [
  'siteName',
  'profileType',
  'ownerName',
  'companyName',
  'creciNumber',
  'creciType',
  'addressCep',
  'addressStreet',
  'addressNumber',
  'addressComplement',
  'addressNeighborhood',
  'addressCity',
  'addressState',
  'contactMobile',
  'contactPhone',
  'contactEmail',
  'accentColor',
  'hasLogo',
  'logoUrl',
  'heroMediaType',
  'heroVideoUrl',
  'desiredDomain',
  'googleAnalyticsId',
  'statsPropertiesSold',
  'statsYearsExperience',
  'statsHappyClients',
  'layoutChoice',
  'colorPalette',
];

function displayValue(key: string, raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '';
  if (typeof raw === 'boolean') return raw ? 'Sim' : 'Não';
  const value = String(raw);
  return VALUE_LABELS[key]?.[value] ?? value;
}

export function WizardDataProof({ wizardData }: { wizardData: Record<string, unknown> }) {
  const entries = Object.entries(wizardData ?? {});
  if (entries.length === 0) return null;

  const known = ORDER.filter((key) => key in wizardData);
  // Campos que o wizard passou a enviar depois desta tela existir aparecem
  // mesmo sem rótulo, em vez de sumirem sem ninguém notar.
  const extra = entries
    .map(([key]) => key)
    .filter((key) => !ORDER.includes(key) && key !== 'contactEmailConfirm')
    .sort();

  const render = (key: string) => (
    <DetailField
      key={key}
      label={LABELS[key] ?? key}
      value={displayValue(key, wizardData[key])}
      empty="não preenchido"
      wide={key === 'logoUrl' || key === 'heroVideoUrl'}
    />
  );

  return (
    <section className="admin-card-elevated p-4 sm:p-5">
      <SectionHeader
        icon={FileText}
        title="O que foi preenchido na criação"
        description="Tudo que você enviou no formulário, exatamente como foi salvo."
      />

      <DetailGrid className="mt-4">{known.map(render)}</DetailGrid>

      {extra.length > 0 && (
        <DetailGrid className="mt-4 border-t border-border pt-4">{extra.map(render)}</DetailGrid>
      )}
    </section>
  );
}
