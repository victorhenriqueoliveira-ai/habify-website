export type LayoutType = 'classic' | 'modern' | 'minimalist' | 'vibrant';
export type ColorPalette = 'blue' | 'orange' | 'green' | 'purple' | 'neutral';

/**
 * Cor de destaque do site gerado. Variações da mesma identidade visual —
 * a estrutura não muda, só o acento. Os valores casam com os seletores
 * html[data-accent] do habify-site-template.
 */
export type AccentColor = 'dourado' | 'oliva' | 'terracota' | 'petroleo' | 'grafite';
export type ProfileType = 'corretor' | 'imobiliaria';
// Valores reais do <Select> em ProjectDataForm.tsx.
export type CreciType = 'individual' | 'juridico';

export interface WizardData {
  // Step 1: Layout & Colors
  layoutChoice?: LayoutType;
  colorPalette?: ColorPalette;
  
  /** Cor de destaque do site. Ausente = dourado, o padrão do template. */
  accentColor?: AccentColor;

  // Step 2: Logo
  hasLogo: boolean;
  logoUrl?: string;

  // Vídeo/imagem de capa do hero (opcional) — upload direto pro Storage,
  // igual ao logo. Sem heroVideoUrl, o site cai no gradiente de tema padrão.
  heroMediaType?: 'image' | 'video';
  heroVideoUrl?: string;

  // Step 5: Domain
  desiredDomain?: string;
  
  // Step 3: Form Data
  profileType: ProfileType;
  ownerName: string;
  companyName: string;
  /** Nome exibido no site. Vazio = usa companyName. */
  siteName?: string;
  creciNumber: string;
  creciType: CreciType;
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressState: string;
  addressCity: string;
  addressNeighborhood: string;
  contactPhone?: string;
  contactMobile: string;
  contactEmail: string;
  contactEmailConfirm: string;

  // Avançado (opcional)
  /** Measurement ID do GA4 (ex: "G-XXXXXXX") — analytics só carrega no site gerado se preenchido. */
  googleAnalyticsId?: string;

  // Estatísticas de credibilidade (opcionais) — mostradas na home do modo
  // "multiple" (barra de números do corretor/imobiliária). String pra seguir
  // o mesmo padrão dos outros campos numéricos do wizard (parse no submit).
  statsPropertiesSold?: string;
  statsYearsExperience?: string;
  statsHappyClients?: string;
}

export interface LayoutOption {
  id: LayoutType;
  name: string;
  description: string;
  preview: string;
}

export interface ColorOption {
  id: ColorPalette;
  name: string;
  primary: string; // hex color
  secondary: string; // hex color
  accent: string; // hex color
}

export interface PaletteData {
  id: ColorPalette;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}
