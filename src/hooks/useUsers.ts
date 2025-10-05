import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/admin';
import { useAuditLogger } from './useAuditLogger';

export const useUsers = () => {
  const { logUserAction } = useAuditLogger();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = data?.map((profile: any) => ({
        id: profile.id,
        userId: profile.user_id,
        name: profile.name,
        email: profile.email || profile.name || '',
        phone: profile.phone || '',
        role: profile.role,
        company: profile.company,
        avatar: profile.avatar_url,
        createdAt: profile.created_at,
        lastLogin: null, // Não temos acesso aos dados de auth via API
        isActive: profile.is_active,
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.role) updateData.role = updates.role;
      if (updates.company !== undefined) updateData.company = updates.company;
      if (updates.avatar !== undefined) updateData.avatar_url = updates.avatar;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Log the update action
      await logUserAction('UPDATE_USER', id, { 
        fields: Object.keys(updateData),
        timestamp: new Date().toISOString()
      });
      
      await fetchUsers();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      // Get the user_id first to delete from auth.users
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      // Delete from auth.users (this will cascade to profiles)
      const { error } = await supabase.auth.admin.deleteUser(profile.user_id);

      if (error) throw error;
      
      // Log the delete action
      await logUserAction('DELETE_USER', id, { 
        user_id: profile.user_id,
        timestamp: new Date().toISOString()
      });
      
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error };
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
    company?: string;
    credits?: number;
  }) => {
    try {
      // 1. Criar usuário no Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role || 'user',
          phone: userData.phone,
          company: userData.company,
        }
      });

      if (error) {
        console.error('Auth user creation error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Usuário não foi criado');
      }

      console.log('Auth user created:', data.user.id);

      // 2. Aguardar um pouco para o trigger criar o perfil
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Buscar o perfil criado pelo trigger
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Erro ao buscar perfil criado');
      }

      if (!profile) {
        console.error('Profile not created by trigger');
        throw new Error('Perfil não foi criado automaticamente');
      }

      console.log('Profile found:', profile.id);

      // 4. Atualizar perfil com dados adicionais
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: userData.phone || null,
          role: (userData.role as 'user' | 'admin' | 'dev') || 'user',
          company: userData.company || null,
          is_active: true,
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error('Erro ao atualizar perfil');
      }

      console.log('Profile updated successfully');

      // 5. Adicionar créditos iniciais se fornecidos
      if (userData.credits && userData.credits > 0) {
        const { error: creditsError } = await supabase.rpc('add_credits', {
          _user_id: profile.id,
          _amount: userData.credits,
          _type: 'admin_grant',
          _description: 'Créditos iniciais concedidos pelo admin'
        });

        if (creditsError) {
          console.error('Credits error:', creditsError);
          // Não falha a criação se der erro nos créditos
        } else {
          console.log(`Added ${userData.credits} credits to user ${profile.id}`);
        }
      }
      
      // 6. Log da ação
      await logUserAction('CREATE_USER', data.user.id, { 
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user',
        credits: userData.credits || 0,
        timestamp: new Date().toISOString()
      });
      
      await fetchUsers();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const createUserWithPlan = async (userData: {
    email: string;
    password: string;
    full_name: string;
    plan_id: string;
    gateway: 'abacatepay' | 'hubla';
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Você precisa estar autenticado');
      }

      // Buscar o profile_id do admin
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single();

      if (!adminProfile) {
        throw new Error('Perfil do admin não encontrado');
      }

      const response = await supabase.functions.invoke('createUserWithCredit', {
        body: {
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          plan_id: userData.plan_id,
          gateway: userData.gateway,
          created_by: adminProfile.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar usuário');
      }

      await fetchUsers();
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating user with plan:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    updateUser,
    deleteUser,
    createUser,
    createUserWithPlan,
  };
};