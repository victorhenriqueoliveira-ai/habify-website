export type LayoutType = 'classic' | 'modern' | 'minimalist' | 'vibrant';
export type ColorPalette = 'blue' | 'orange' | 'green' | 'purple' | 'neutral';
export type ProfileType = 'corretor' | 'imobiliaria';
export type CreciType = 'individual' | 'juridico';

export interface WizardData {
  // Step 1: Layout & Colors
  layoutChoice?: LayoutType;
  colorPalette?: ColorPalette;
  
  // Step 2: Logo
  hasLogo: boolean;
  logoUrl?: string;
  
  // Step 3: Form Data
  profileType: ProfileType;
  ownerName: string;
  companyName: string;
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
