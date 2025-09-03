import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/admin';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          auth_users:user_id (email, last_sign_in_at)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = data?.map((profile: any) => ({
        id: profile.id,
        name: profile.name,
        email: profile.auth_users?.email || '',
        phone: profile.phone || '',
        role: profile.role,
        company: profile.company,
        avatar: profile.avatar_url,
        createdAt: profile.created_at,
        lastLogin: profile.auth_users?.last_sign_in_at,
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
  }) => {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
        }
      });

      if (error) throw error;

      // Update the profile with additional data
      if (data.user && (userData.phone || userData.role || userData.company)) {
        await supabase
          .from('profiles')
          .update({
            phone: userData.phone,
            role: (userData.role as 'user' | 'admin' | 'dev') || 'user',
            company: userData.company,
          })
          .eq('user_id', data.user.id);
      }
      
      await fetchUsers();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error };
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
  };
};