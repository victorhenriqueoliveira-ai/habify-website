import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Project } from '@/types/admin';
import { useAuditLogger } from './useAuditLogger';

export const useProjects = () => {
  const { logProjectAction } = useAuditLogger();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects: Project[] = data?.map((project) => ({
        id: project.id,
        userId: project.user_id,
        title: project.title,
        description: project.description || '',
        status: project.status,
        landingPageUrl: project.landing_page_url,
        photos: project.photos || [],
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        completedAt: project.completed_at,
        price: Number(project.price) || 0,
        location: project.location || '',
        propertyType: project.property_type || 'house',
        bedrooms: project.bedrooms,
        bathrooms: project.bathrooms,
        area: Number(project.area) || 0,
        projectType: project.project_type || 'single_property',
        features: project.features as Record<string, any> || {},
      })) || [];

      setProjects(formattedProjects);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Partial<Project> & { userId: string }) => {
    try {
      // Ensure photos is always an array
      const photos = Array.isArray(projectData.photos) ? projectData.photos : [];
      console.log('Creating project with photos:', photos.length);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: projectData.userId,
          title: projectData.title,
          description: projectData.description,
          price: projectData.price || 0,
          location: projectData.location,
          property_type: projectData.propertyType,
          bedrooms: projectData.bedrooms,
          bathrooms: projectData.bathrooms,
          area: projectData.area,
          photos: photos,
          project_type: projectData.projectType || 'single_property',
          features: projectData.features || {},
          status: projectData.status || 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }
      
      console.log('Project created successfully:', { id: data.id, photos: data.photos?.length || 0 });
      
      // Log the create action
      await logProjectAction('CREATE_PROJECT', data.id, {
        title: projectData.title,
        location: projectData.location,
        price: projectData.price,
        timestamp: new Date().toISOString()
      });
      
      await fetchProjects();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to create project:', error);
      return { success: false, error };
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.landingPageUrl !== undefined) updateData.landing_page_url = updates.landingPageUrl;
      if (updates.photos !== undefined) {
        // Ensure photos is always an array
        updateData.photos = Array.isArray(updates.photos) ? updates.photos : [];
        console.log('Updating project photos:', { id, photosCount: updateData.photos.length });
      }
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.propertyType) updateData.property_type = updates.propertyType;
      if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms;
      if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms;
      if (updates.area !== undefined) updateData.area = updates.area;
      if (updates.projectType) updateData.project_type = updates.projectType;
      if (updates.features !== undefined) updateData.features = updates.features;
      
      if (updates.status === 'completed' && !updates.completedAt) {
        updateData.completed_at = new Date().toISOString();
      }

      console.log('Updating project in database:', { id, updateData });

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Projeto não encontrado ou sem permissão para atualizar');
      }
      
      console.log('Project updated successfully:', { id, photos: data.photos?.length || 0 });
      
      // Log the update action
      await logProjectAction('UPDATE_PROJECT', id, {
        fields: Object.keys(updateData),
        status: updates.status,
        timestamp: new Date().toISOString()
      });
      
      await fetchProjects();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to update project:', error);
      return { success: false, error };
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Log the delete action
      await logProjectAction('DELETE_PROJECT', id, {
        timestamp: new Date().toISOString()
      });
      
      await fetchProjects();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};