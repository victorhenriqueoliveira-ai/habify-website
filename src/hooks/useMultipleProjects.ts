import { useState } from 'react';

export interface FloorPlanData {
  name: string;
  file: File;
  /** Preço específico dessa planta (opcional — texto formatado, igual ao campo `price` do imóvel). */
  price?: string;
  /** Selo curto sobre a planta (ex: "Mais procurado", "Exclusivo"). */
  badge?: string;
  /** Destaca visualmente o card dessa planta em relação às demais. */
  highlighted?: boolean;
}

/** Diferencial em destaque do imóvel — aparece com ícone na home/página do imóvel. */
export interface DifferentialData {
  title: string;
  description: string;
}

/** Ponto de interesse próximo, com tempo estimado até lá (ex: "Metrô — 6 min"). */
export interface NearbyPlaceData {
  name: string;
  time: string;
}

export interface PropertyData {
  title: string;
  cep?: string; // CEP para busca automática de endereço
  location: string; // Localização completa formatada
  price: string;
  propertyType: 'apartment' | 'house' | 'commercial' | 'land' | 'warehouse' | 'penthouse';
  purpose: 'sale' | 'rent';
  bedrooms: string;
  bathrooms: string;
  area: string;
  parkingSpaces: string;
  constructionYear: string;
  floorNumber: string;
  condominiumFee: string;
  iptu: string;
  description: string;
  /** Selo curto sobre o imóvel (ex: "Lançamento", "Últimas unidades"). */
  badge: string;
  amenities: string[];
  /** Diferenciais em destaque (specs vendáveis, ex: "Segurança", "Valorização") — separado de `amenities` (lazer do condomínio). */
  differentials: DifferentialData[];
  /** Pontos de interesse próximos, com tempo estimado. */
  nearbyPlaces: NearbyPlaceData[];
  photos: File[];
  floorPlans: FloorPlanData[];
  id?: string;
}

export const useMultipleProjects = () => {
  const [properties, setProperties] = useState<PropertyData[]>([{
    title: '',
    location: '',
    price: '',
    propertyType: 'apartment',
    purpose: 'sale',
    bedrooms: '',
    bathrooms: '',
    area: '',
    parkingSpaces: '',
    constructionYear: '',
    floorNumber: '',
    condominiumFee: '',
    iptu: '',
    description: '',
    badge: '',
    amenities: [],
    differentials: [],
    nearbyPlaces: [],
    photos: [],
    floorPlans: [],
  }]);

  const addProperty = (maxProperties: number = 5) => {
    if (properties.length < maxProperties) {
      setProperties([...properties, {
        title: '',
        location: '',
        price: '',
        propertyType: 'apartment',
        purpose: 'sale',
        bedrooms: '',
        bathrooms: '',
        area: '',
        parkingSpaces: '',
        constructionYear: '',
        floorNumber: '',
        condominiumFee: '',
        iptu: '',
        description: '',
        badge: '',
        amenities: [],
        differentials: [],
        nearbyPlaces: [],
        photos: [],
        floorPlans: [],
      }]);
    }
  };

  const removeProperty = (index: number) => {
    if (properties.length > 1) {
      setProperties(properties.filter((_, i) => i !== index));
    }
  };

  const updateProperty = (index: number, field: keyof PropertyData, value: any) => {
    setProperties(properties.map((property, i) => 
      i === index ? { ...property, [field]: value } : property
    ));
  };

  const resetProperties = () => {
    setProperties([{
      title: '',
      location: '',
      price: '',
      propertyType: 'apartment',
      purpose: 'sale',
      bedrooms: '',
      bathrooms: '',
      area: '',
      parkingSpaces: '',
      constructionYear: '',
      floorNumber: '',
      condominiumFee: '',
      iptu: '',
      description: '',
      badge: '',
      amenities: [],
      differentials: [],
      nearbyPlaces: [],
      photos: [],
      floorPlans: [],
    }]);
  };

  return {
    properties,
    addProperty,
    removeProperty,
    updateProperty,
    resetProperties,
  };
};