import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Camera, 
  Shield, 
  Save, 
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useUserStats } from '@/hooks/useUserStats';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const roleLabels = {
  user: 'Corretor',
  admin: 'Administrador',
  dev: 'Desenvolvedor',
};

const roleColors = {
  user: 'default',
  admin: 'secondary',
  dev: 'destructive',
} as const;

export const ProfilePage = () => {
  const { user } = useAuth();
  const { updateUser, loading } = useUsers();
  const { stats: userStats, loading: statsLoading } = useUserStats();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });

  if (!user) return null;

  const handleSave = async () => {
    try {
      await updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
      });
      
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 w-full">
        {/* Information Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Mantenha seus dados sempre atualizados
              </CardDescription>
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
            >
              {isEditing ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar'}
                </>
              ) : (
                'Editar'
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Resumo de Atividades
          </CardTitle>
          <CardDescription>
            Suas estatísticas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {statsLoading ? '...' : userStats.totalProjects}
              </div>
              <p className="text-sm text-muted-foreground">
                {user.role === 'user' ? 'Projetos Criados' : 'Projetos Gerenciados'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {statsLoading ? '...' : userStats.completedProjects}
              </div>
              <p className="text-sm text-muted-foreground">
                {user.role === 'user' ? 'Projetos Concluídos' : 'Projetos Finalizados'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {statsLoading ? '...' : `${userStats.successRate}%`}
              </div>
              <p className="text-sm text-muted-foreground">
                Taxa de Sucesso
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Exclusão de Conta - LGPD Art. 18 */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <Trash2 className="mr-2 h-5 w-5" />
            Exclusão de Conta
          </CardTitle>
          <CardDescription>
            Conforme a LGPD (Art. 18), você pode solicitar a exclusão dos seus dados pessoais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ao solicitar a exclusão, um administrador será notificado e processará sua solicitação.
            Dados fiscais podem ser mantidos por até 5 anos conforme exigência legal.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Solicitar Exclusão da Minha Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar solicitação de exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação enviará uma solicitação de exclusão de conta para o administrador.
                  Todos os seus dados pessoais serão removidos, exceto os exigidos por lei.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    try {
                      await supabase.from('notifications').insert({
                        user_id: (user as any).userId || user?.id,
                        title: 'Solicitação de exclusão de conta',
                        message: `O usuário ${user?.name || user?.email} (${user?.email}) solicitou a exclusão da sua conta conforme LGPD Art. 18.`,
                        type: 'warning',
                      });
                      // Also notify admins
                      const { data: admins } = await supabase
                        .from('profiles')
                        .select('user_id')
                        .in('role', ['admin', 'dev']);
                      if (admins) {
                        for (const admin of admins) {
                          if (admin.user_id) {
                            await supabase.from('notifications').insert({
                              user_id: admin.user_id,
                              title: '⚠️ Solicitação LGPD - Exclusão de conta',
                              message: `O usuário ${user?.name || user?.email} (${user?.email}) solicitou a exclusão da sua conta.`,
                              type: 'warning',
                            });
                          }
                        }
                      }
                      toast({
                        title: 'Solicitação enviada',
                        description: 'Sua solicitação de exclusão foi registrada. Um administrador entrará em contato.',
                      });
                    } catch {
                      toast({
                        title: 'Erro',
                        description: 'Não foi possível enviar a solicitação. Tente novamente.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Confirmar Exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};