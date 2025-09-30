import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PortfolioProperty {
  id: string;
  projectId: string;
  title: string;
  location: string;
  price: number;
  propertyType: string;
  purpose: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  parkingSpaces?: number;
  constructionYear?: number;
  floorNumber?: number;
  condominiumFee?: number;
  iptu?: number;
  description?: string;
  amenities?: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export const usePortfolioProperties = (projectId?: string) => {
  const [properties, setProperties] = useState<PortfolioProperty[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProperties = async () => {
    if (!projectId) {
      setProperties([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_properties')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedProperties: PortfolioProperty[] = data?.map((prop) => ({
        id: prop.id,
        projectId: prop.project_id,
        title: prop.title,
        location: prop.location,
        price: Number(prop.price),
        propertyType: prop.property_type,
        purpose: prop.purpose,
        bedrooms: prop.bedrooms || undefined,
        bathrooms: prop.bathrooms || undefined,
        area: Number(prop.area),
        parkingSpaces: prop.parking_spaces || undefined,
        constructionYear: prop.construction_year || undefined,
        floorNumber: prop.floor_number || undefined,
        condominiumFee: prop.condominium_fee ? Number(prop.condominium_fee) : undefined,
        iptu: prop.iptu ? Number(prop.iptu) : undefined,
        description: prop.description || undefined,
        amenities: prop.amenities || [],
        photos: prop.photos || [],
        createdAt: prop.created_at,
        updatedAt: prop.updated_at,
      })) || [];

      setProperties(formattedProperties);
    } catch (error) {
      console.error('Error fetching portfolio properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [projectId]);

  return {
    properties,
    loading,
    fetchProperties,
  };
};
