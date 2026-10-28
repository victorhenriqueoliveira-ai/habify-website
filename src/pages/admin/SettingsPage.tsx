import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Database,
  Mail,
  Shield,
  Key,
  Save,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { useDatabaseStats } from '@/hooks/useDatabaseStats';
import {
  AdminNotice,
  LoadingState,
  PageHeader,
  SectionHeader,
  StatCard,
  StatusPill,
} from '@/components/admin/ui';

type SettingValue = Record<string, string | number | boolean>;

const fieldLabel = 'font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground';

/** Linha com rótulo, explicação e interruptor. */
function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium">{label}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="shrink-0"
      />
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Settings;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-card-elevated flex flex-col p-4 sm:p-5">
      <SectionHeader icon={Icon} title={title} description={description} />
      <div className="mt-3">{children}</div>
    </section>
  );
}

export const SettingsPage = () => {
  const {
    loading: settingsLoading,
    updateSetting,
    getEmailSettings,
    getSystemSettings,
    getSecuritySettings,
  } = useSystemSettings();
  const { logSystemAction } = useAuditLogger();
  const { stats: dbStats } = useDatabaseStats();
  const [loading, setLoading] = useState(false);

  const emailSettings = getEmailSettings();
  const systemSettings = getSystemSettings();
  const securitySettings = getSecuritySettings();

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = [
        updateSetting('email_notifications', { enabled: emailSettings.notifications.enabled }),
        updateSetting('email_provider', emailSettings.provider),
        updateSetting('maintenance_mode', { enabled: systemSettings.maintenanceMode.enabled }),
        updateSetting('allow_registrations', { enabled: systemSettings.allowRegistrations.enabled }),
        updateSetting('auto_approve_projects', {
          enabled: systemSettings.autoApproveProjects.enabled,
        }),
        updateSetting('max_upload_size', { size_mb: systemSettings.maxUploadSize.size_mb }),
        updateSetting('enforce_ssl', { enabled: securitySettings.enforceSSL.enabled }),
        updateSetting('password_policy', securitySettings.passwordPolicy),
        updateSetting('session_timeout', { hours: securitySettings.sessionTimeout.hours }),
      ];

      await Promise.all(updates);

      await logSystemAction('CHANGE_SETTINGS', {
        categories: ['email', 'system', 'security'],
        timestamp: new Date().toISOString(),
      });

      toast.success('Configurações salvas', {
        description: 'As configurações foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar', { description: 'Ocorreu um erro ao salvar as configurações.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (
    category: string,
    field: string,
    value: string | boolean,
  ) => {
    try {
      let settingKey = '';
      let settingValue: SettingValue = {};

      switch (category) {
        case 'email':
          if (field === 'emailNotifications') {
            settingKey = 'email_notifications';
            settingValue = { enabled: value };
          } else if (field === 'smtpHost') {
            settingKey = 'email_provider';
            settingValue = { ...emailSettings.provider, host: value };
          } else if (field === 'smtpPort') {
            settingKey = 'email_provider';
            settingValue = { ...emailSettings.provider, port: value };
          }
          break;
        case 'system':
          if (field === 'maintenanceMode') {
            settingKey = 'maintenance_mode';
            settingValue = { enabled: value };
          } else if (field === 'allowRegistrations') {
            settingKey = 'allow_registrations';
            settingValue = { enabled: value };
          } else if (field === 'autoApproveProjects') {
            settingKey = 'auto_approve_projects';
            settingValue = { enabled: value };
          } else if (field === 'maxUploadSize') {
            settingKey = 'max_upload_size';
            settingValue = { size_mb: parseInt(value as string) || 10 };
          }
          break;
        case 'security':
          if (field === 'enforceSSL') {
            settingKey = 'enforce_ssl';
            settingValue = { enabled: value };
          } else if (field === 'passwordPolicy') {
            settingKey = 'password_policy';
            settingValue = { enabled: value, min_length: 8 };
          } else if (field === 'sessionTimeout') {
            settingKey = 'session_timeout';
            settingValue = { hours: parseInt(value as string) || 24 };
          }
          break;
      }

      if (settingKey) {
        await updateSetting(settingKey, settingValue);
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Erro', { description: 'Falha ao atualizar configuração.' });
    }
  };

  if (settingsLoading) {
    return <LoadingState label="Carregando configurações..." size="lg" fullScreen />;
  }

  const dbOnline = dbStats?.status === 'online';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        eyebrow="Sistema"
        title="Configurações"
        description="Configure as definições do sistema e integrações"
        actions={
          <>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Recarregar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {loading ? 'Salvando...' : 'Salvar configurações'}
            </Button>
          </>
        }
      />

      <AdminNotice
        tone="warning"
        title="Configurações de desenvolvedor"
        description="Alterações nesta página afetam o funcionamento do sistema para todos os usuários. Confira as implicações antes de mudar."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Antes havia aqui um campo "AbacatePay API Key" com um Badge
         *  "Ativo": ele era puramente decorativo — o valor nascia como
         *  bolinhas, não era lido de lugar nenhum e handleSave não o
         *  gravava. Quem digitasse uma chave de verdade sairia achando que
         *  tinha trocado. As chaves vivem nos secrets do Supabase. */}
        <SettingsCard
          icon={Key}
          title="Integrações"
          description="As chaves ficam nos secrets do Supabase, fora do navegador."
        >
          <ul className="space-y-2">
            <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5">
              <span className="min-w-0">
                <span className="block text-[13.5px] font-medium">AbacatePay</span>
                <span className="block font-mono text-[11px] text-muted-foreground">
                  ABACATEPAY_API_KEY · ABACATEPAY_API_KEY_V2
                </span>
              </span>
              <StatusPill label="Em uso" tone="success" />
            </li>
            <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5">
              <span className="min-w-0">
                <span className="block text-[13.5px] font-medium">Supabase</span>
                <span className="block font-mono text-[11px] text-muted-foreground">
                  URL e chave pública fixadas no build
                </span>
              </span>
              <StatusPill label={dbOnline ? 'Online' : 'Offline'} tone={dbOnline ? 'success' : 'destructive'} />
            </li>
          </ul>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            Para trocar uma chave, use{' '}
            <code className="rounded border border-border bg-muted px-1 py-px font-mono text-[11px]">
              supabase secrets set
            </code>{' '}
            — nenhuma delas é editável por aqui.
          </p>
        </SettingsCard>

        <SettingsCard
          icon={Mail}
          title="E-mail"
          description="Configure o envio de e-mails e notificações."
        >
          <ToggleRow
            label="Notificações por e-mail"
            description="Enviar e-mails para eventos importantes."
            checked={emailSettings.notifications?.enabled || false}
            onCheckedChange={(checked) => handleSettingChange('email', 'emailNotifications', checked)}
          />

          <div className="grid gap-3 pt-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="smtp-host" className={fieldLabel}>
                SMTP host
              </Label>
              <Input
                id="smtp-host"
                value={emailSettings.provider?.host || ''}
                onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp-port" className={fieldLabel}>
                SMTP port
              </Label>
              <Input
                id="smtp-port"
                inputMode="numeric"
                value={emailSettings.provider?.port?.toString() || ''}
                onChange={(e) => handleSettingChange('email', 'smtpPort', e.target.value)}
              />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={Settings}
          title="Sistema"
          description="Comportamento geral da plataforma."
        >
          <ToggleRow
            label="Modo manutenção"
            description="Desativa o acesso público ao sistema."
            checked={systemSettings.maintenanceMode?.enabled || false}
            onCheckedChange={(checked) => handleSettingChange('system', 'maintenanceMode', checked)}
          />
          <ToggleRow
            label="Permitir registros"
            description="Novos usuários podem se cadastrar sozinhos."
            checked={systemSettings.allowRegistrations?.enabled || false}
            onCheckedChange={(checked) => handleSettingChange('system', 'allowRegistrations', checked)}
          />
          <ToggleRow
            label="Auto-aprovar projetos"
            description="Projetos entram aprovados, sem conferência manual."
            checked={systemSettings.autoApproveProjects?.enabled || false}
            onCheckedChange={(checked) =>
              handleSettingChange('system', 'autoApproveProjects', checked)
            }
          />

          <div className="space-y-1.5 pt-3">
            <Label htmlFor="max-upload" className={fieldLabel}>
              Tamanho máximo de upload (MB)
            </Label>
            <Input
              id="max-upload"
              type="number"
              min={1}
              value={systemSettings.maxUploadSize?.size_mb?.toString() || '10'}
              onChange={(e) => handleSettingChange('system', 'maxUploadSize', e.target.value)}
            />
          </div>
        </SettingsCard>

        <SettingsCard icon={Shield} title="Segurança" description="Políticas de acesso e sessão.">
          <ToggleRow
            label="Forçar SSL"
            description="Redireciona HTTP para HTTPS."
            checked={securitySettings.enforceSSL?.enabled || false}
            onCheckedChange={(checked) => handleSettingChange('security', 'enforceSSL', checked)}
          />
          <ToggleRow
            label="Política de senhas"
            description="Exige senhas complexas, com no mínimo 8 caracteres."
            checked={securitySettings.passwordPolicy?.enabled || false}
            onCheckedChange={(checked) => handleSettingChange('security', 'passwordPolicy', checked)}
          />

          <div className="space-y-1.5 pt-3">
            <Label htmlFor="session-timeout" className={fieldLabel}>
              Timeout de sessão (horas)
            </Label>
            <Input
              id="session-timeout"
              type="number"
              min={1}
              value={securitySettings.sessionTimeout?.hours?.toString() || '24'}
              onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
            />
          </div>
        </SettingsCard>
      </div>

      <section className="space-y-3.5">
        <SectionHeader
          icon={Database}
          title="Banco de dados"
          description="Status e estatísticas da instância."
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <StatCard
            label="Status"
            value={dbStats?.status || 'Offline'}
            tone={dbOnline ? 'success' : 'destructive'}
          />
          <StatCard label="Tamanho" value={dbStats?.size || '—'} />
          <StatCard label="Latência" value={`${dbStats?.latency || 0}ms`} />
          <StatCard label="Uptime" value={dbStats?.uptime || '0%'} />
        </div>

        {dbStats?.lastBackup && (
          <dl className="admin-card-elevated divide-y divide-border px-4 text-[13px]">
            <div className="flex justify-between gap-3 py-2.5">
              <dt className="text-muted-foreground">Último backup</dt>
              <dd className="font-mono tabular-nums">{dbStats.lastBackup}</dd>
            </div>
            <div className="flex justify-between gap-3 py-2.5">
              <dt className="text-muted-foreground">Conexões ativas</dt>
              <dd className="font-mono tabular-nums">{dbStats.connections || 0}</dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
};
