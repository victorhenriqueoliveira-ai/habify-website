import { useState } from 'react';

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
  amenities: string[];
  photos: File[];
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
    amenities: [],
    photos: [],
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
        amenities: [],
        photos: [],
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
      amenities: [],
      photos: [],
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