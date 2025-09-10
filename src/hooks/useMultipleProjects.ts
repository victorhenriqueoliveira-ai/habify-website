import { useState } from 'react';

export interface ProjectData {
  title: string;
  description: string;
  price: string;
  location: string;
  propertyType: 'house' | 'apartment' | 'land' | 'commercial';
  bedrooms: string;
  bathrooms: string;
  area: string;
  photos: string[];
  id?: string;
}

export const useMultipleProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([{
    title: '',
    description: '',
    price: '',
    location: '',
    propertyType: 'house',
    bedrooms: '',
    bathrooms: '',
    area: '',
    photos: [],
  }]);

  const addProject = () => {
    if (projects.length < 5) {
      setProjects([...projects, {
        title: '',
        description: '',
        price: '',
        location: '',
        propertyType: 'house',
        bedrooms: '',
        bathrooms: '',
        area: '',
        photos: [],
      }]);
    }
  };

  const removeProject = (index: number) => {
    if (projects.length > 1) {
      setProjects(projects.filter((_, i) => i !== index));
    }
  };

  const updateProject = (index: number, field: keyof ProjectData, value: any) => {
    setProjects(projects.map((project, i) => 
      i === index ? { ...project, [field]: value } : project
    ));
  };

  const resetProjects = () => {
    setProjects([{
      title: '',
      description: '',
      price: '',
      location: '',
      propertyType: 'house',
      bedrooms: '',
      bathrooms: '',
      area: '',
      photos: [],
    }]);
  };

  return {
    projects,
    addProject,
    removeProject,
    updateProject,
    resetProjects,
  };
};