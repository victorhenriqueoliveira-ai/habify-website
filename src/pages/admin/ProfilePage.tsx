import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Building, Save, Trash2, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useUserStats } from '@/hooks/useUserStats';
import { toast } from 'sonner';
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
import { PageHeader, SectionHeader, StatCard } from '@/components/admin/ui';

const fieldLabel = 'font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground';

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

      toast.success('Perfil atualizado', { description: 'Suas informações foram salvas com sucesso.' });
      setIsEditing(false);
    } catch {
      toast.error('Erro', { description: 'Não foi possível salvar as alterações.' });
    }
  };

  const handleCancel = () => {
    // Descarta o que foi digitado — sem isto, sair da edição e voltar
    // mostrava o rascunho abandonado como se tivesse sido salvo.
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      company: user.company || '',
    });
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRequestDeletion = async () => {
    try {
      const ownId = user.userId || user.id;

      await supabase.from('notifications').insert({
        user_id: ownId,
        title: 'Solicitação de exclusão de conta',
        message: `O usuário ${user.name || user.email} (${user.email}) solicitou a exclusão da sua conta conforme LGPD Art. 18.`,
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
              title: 'Solicitação LGPD — exclusão de conta',
              message: `O usuário ${user.name || user.email} (${user.email}) solicitou a exclusão da sua conta.`,
              type: 'warning',
            });
          }
        }
      }

      toast.success('Solicitação enviada', {
        description: 'Sua solicitação de exclusão foi registrada. Um administrador entrará em contato.',
      });
    } catch {
      toast.error('Erro', { description: 'Não foi possível enviar a solicitação. Tente novamente.' });
    }
  };

  const field = (
    id: 'name' | 'email' | 'phone' | 'company',
    label: string,
    Icon: typeof User,
    type = 'text',
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={fieldLabel}>
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={id}
          type={type}
          value={formData[id]}
          onChange={(e) => handleChange(id, e.target.value)}
          disabled={!isEditing}
          className="pl-9"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={User}
        eyebrow="Conta"
        title="Meu perfil"
        description="Gerencie suas informações pessoais e preferências"
      />

      <div className="admin-card-elevated p-4 sm:p-5">
        <SectionHeader
          title="Informações pessoais"
          description="Mantenha seus dados sempre atualizados."
          actions={
            !isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )
          }
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {field('name', 'Nome completo', User)}
          {field('email', 'E-mail', Mail, 'email')}
          {field('phone', 'Telefone', Phone, 'tel')}
          {field('company', 'Empresa', Building)}
        </div>

        {/* O botão de salvar aparece uma vez só. Antes havia um no cabeçalho
         *  e outro no rodapé, ambos ativos ao mesmo tempo. */}
        {isEditing && (
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        )}
      </div>

      <section className="space-y-3.5">
        <SectionHeader
          icon={Activity}
          title="Resumo de atividades"
          description="Suas estatísticas no sistema."
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          <StatCard
            label={user.role === 'user' ? 'Projetos criados' : 'Projetos gerenciados'}
            value={statsLoading ? '—' : userStats.totalProjects}
          />
          <StatCard
            label={user.role === 'user' ? 'Projetos concluídos' : 'Projetos finalizados'}
            value={statsLoading ? '—' : userStats.completedProjects}
            tone="success"
          />
          <StatCard
            label="Taxa de sucesso"
            value={statsLoading ? '—' : `${userStats.successRate}%`}
            tone="info"
          />
        </div>
      </section>

      {/* Exclusão de Conta - LGPD Art. 18 */}
      <section className="rounded-lg border border-destructive/25 bg-destructive/[0.04] p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-display text-[16.5px] font-bold tracking-[-0.02em] text-destructive">
          <Trash2 className="h-[17px] w-[17px]" aria-hidden="true" />
          Exclusão de conta
        </h2>
        <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-muted-foreground">
          Conforme a LGPD (Art. 18), você pode solicitar a exclusão dos seus dados pessoais. Um
          administrador é notificado e processa a solicitação. Dados fiscais podem ser mantidos por
          até 5 anos conforme exigência legal.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="mt-4">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Solicitar exclusão da minha conta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-[19px] font-bold tracking-[-0.025em]">
                Confirmar solicitação de exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação envia uma solicitação de exclusão de conta para o administrador. Todos os
                seus dados pessoais serão removidos, exceto os exigidos por lei. Não pode ser
                desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleRequestDeletion}
              >
                Confirmar exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
};
