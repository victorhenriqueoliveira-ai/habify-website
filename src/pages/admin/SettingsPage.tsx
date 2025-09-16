import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Mail, 
  Bell, 
  Shield, 
  Key,
  Save,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAuditLogger } from '@/hooks/useAuditLogger';

export const SettingsPage = () => {
  const { 
    settings, 
    loading: settingsLoading, 
    updateSetting, 
    getEmailSettings, 
    getSystemSettings, 
    getSecuritySettings 
  } = useSystemSettings();
  const { logSystemAction } = useAuditLogger();
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    // API Settings
    abacatePayApiKey: '••••••••••••••••',
    supabaseUrl: 'https://jsttoajuszshrivmgnmc.supabase.co',
  });

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
        updateSetting('auto_approve_projects', { enabled: systemSettings.autoApproveProjects.enabled }),
        updateSetting('max_upload_size', { size_mb: systemSettings.maxUploadSize.size_mb }),
        updateSetting('enforce_ssl', { enabled: securitySettings.enforceSSL.enabled }),
        updateSetting('password_policy', securitySettings.passwordPolicy),
        updateSetting('session_timeout', { hours: securitySettings.sessionTimeout.hours }),
      ];

      await Promise.all(updates);
      
      await logSystemAction('CHANGE_SETTINGS', {
        categories: ['email', 'system', 'security'],
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Configurações salvas',
        description: 'As configurações foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (category: string, field: string, value: string | boolean) => {
    try {
      let settingKey = '';
      let settingValue: any = {};

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
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar configuração.',
        variant: 'destructive',
      });
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Configure as definições do sistema e integrações
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Integrações API
            </CardTitle>
            <CardDescription>
              Configure as chaves de API e integrações externas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="abacatepay">AbacatePay API Key</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="abacatepay"
                  type="password"
                  value={localSettings.abacatePayApiKey}
                  onChange={(e) => setLocalSettings(prev => ({...prev, abacatePayApiKey: e.target.value}))}
                />
                <Badge variant="default">Ativo</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supabase">Supabase URL</Label>
              <Input
                id="supabase"
                value={localSettings.supabaseUrl}
                onChange={(e) => setLocalSettings(prev => ({...prev, supabaseUrl: e.target.value}))}
                readOnly
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Configurações de Email
            </CardTitle>
            <CardDescription>
              Configure o envio de emails e notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar emails para eventos importantes
                </p>
              </div>
              <Switch
                checked={emailSettings.notifications?.enabled || false}
                onCheckedChange={(checked) => handleSettingChange('email', 'emailNotifications', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  value={emailSettings.provider?.host || ''}
                  onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  value={emailSettings.provider?.port?.toString() || ''}
                  onChange={(e) => handleSettingChange('email', 'smtpPort', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Configurações do Sistema
            </CardTitle>
            <CardDescription>
              Configure o comportamento geral do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Desativar acesso público ao sistema
                </p>
              </div>
              <Switch
                checked={systemSettings.maintenanceMode?.enabled || false}
                onCheckedChange={(checked) => handleSettingChange('system', 'maintenanceMode', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Registros</Label>
                <p className="text-sm text-muted-foreground">
                  Novos usuários podem se registrar
                </p>
              </div>
              <Switch
                checked={systemSettings.allowRegistrations?.enabled || false}
                onCheckedChange={(checked) => handleSettingChange('system', 'allowRegistrations', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-aprovar Projetos</Label>
                <p className="text-sm text-muted-foreground">
                  Aprovar projetos automaticamente
                </p>
              </div>
              <Switch
                checked={systemSettings.autoApproveProjects?.enabled || false}
                onCheckedChange={(checked) => handleSettingChange('system', 'autoApproveProjects', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-upload">Tamanho Máximo de Upload (MB)</Label>
              <Input
                id="max-upload"
                type="number"
                value={systemSettings.maxUploadSize?.size_mb?.toString() || '10'}
                onChange={(e) => handleSettingChange('system', 'maxUploadSize', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Configurações de Segurança
            </CardTitle>
            <CardDescription>
              Configure as políticas de segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Forçar SSL</Label>
                <p className="text-sm text-muted-foreground">
                  Redirecionar HTTP para HTTPS
                </p>
              </div>
              <Switch
                checked={securitySettings.enforceSSL?.enabled || false}
                onCheckedChange={(checked) => handleSettingChange('security', 'enforceSSL', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Política de Senhas</Label>
                <p className="text-sm text-muted-foreground">
                  Exigir senhas complexas
                </p>
              </div>
              <Switch
                checked={securitySettings.passwordPolicy?.enabled || false}
                onCheckedChange={(checked) => handleSettingChange('security', 'passwordPolicy', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Timeout de Sessão (horas)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={securitySettings.sessionTimeout?.hours?.toString() || '24'}
                onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Status do Banco de Dados
          </CardTitle>
          <CardDescription>
            Informações sobre o banco de dados e estatísticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">2.1GB</div>
              <p className="text-sm text-muted-foreground">Tamanho</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">45ms</div>
              <p className="text-sm text-muted-foreground">Latência</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Recarregar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Atenção: Configurações de Desenvolvedor
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Alterações nesta página podem afetar o funcionamento do sistema. 
                Certifique-se de que você entende as implicações antes de fazer mudanças.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};