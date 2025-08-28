import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Webhook,
  Save,
  RefreshCw,
  AlertTriangle,
  Bell,
  Globe,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    // System Settings
    systemName: 'HabiFy Admin',
    systemVersion: '1.0.0',
    maintenanceMode: false,
    debugMode: false,
    
    // Email Settings
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@habify.com',
    smtpPassword: '',
    emailNotifications: true,
    
    // Database Settings
    dbHost: 'localhost',
    dbName: 'habify_production',
    dbUser: 'admin',
    dbBackupEnabled: true,
    backupFrequency: 'daily',
    
    // Security Settings
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    twoFactorEnabled: false,
    passwordMinLength: '8',
    
    // Notification Settings
    pushNotifications: true,
    emailAlerts: true,
    smsNotifications: false,
    
    // Integration Settings
    webhookUrl: '',
    apiEnabled: true,
    rateLimitEnabled: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (section: string) => {
    toast({
      title: 'Configurações salvas',
      description: `As configurações de ${section} foram atualizadas com sucesso.`,
    });
  };

  const handleSystemRestart = () => {
    toast({
      title: 'Reiniciando sistema',
      description: 'O sistema será reiniciado em alguns segundos...',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground">
          Gerencie configurações avançadas do sistema HabiFy
        </p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Informações gerais e controles do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">Sistema operacional</p>
              </div>
              <Badge variant="default">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Versão</p>
                <p className="text-xs text-muted-foreground">Versão atual</p>
              </div>
              <Badge variant="secondary">{settings.systemVersion}</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Uptime</p>
                <p className="text-xs text-muted-foreground">Tempo online</p>
              </div>
              <span className="text-sm font-medium">15d 4h 32m</span>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="maintenance"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
              />
              <Label htmlFor="maintenance">Modo de Manutenção</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="debug"
                checked={settings.debugMode}
                onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
              />
              <Label htmlFor="debug">Modo Debug</Label>
            </div>
          </div>

          <div className="mt-6 flex space-x-2">
            <Button variant="outline" onClick={handleSystemRestart}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reiniciar Sistema
            </Button>
            <Button onClick={() => handleSave('sistema')}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Banco de Dados
            </CardTitle>
            <CardDescription>
              Configurações do banco de dados e backups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dbHost">Host do Banco</Label>
              <Input
                id="dbHost"
                value={settings.dbHost}
                onChange={(e) => handleSettingChange('dbHost', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dbName">Nome do Banco</Label>
              <Input
                id="dbName"
                value={settings.dbName}
                onChange={(e) => handleSettingChange('dbName', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="backup"
                checked={settings.dbBackupEnabled}
                onCheckedChange={(checked) => handleSettingChange('dbBackupEnabled', checked)}
              />
              <Label htmlFor="backup">Backup Automático</Label>
            </div>

            <Button onClick={() => handleSave('banco de dados')} className="w-full">
              Salvar Configurações do BD
            </Button>
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
              Configure o servidor SMTP para envio de emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp">Servidor SMTP</Label>
              <Input
                id="smtp"
                value={settings.smtpServer}
                onChange={(e) => handleSettingChange('smtpServer', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  value={settings.smtpPort}
                  onChange={(e) => handleSettingChange('smtpPort', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user">Usuário</Label>
                <Input
                  id="user"
                  value={settings.smtpUser}
                  onChange={(e) => handleSettingChange('smtpUser', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="emailNotif"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
              <Label htmlFor="emailNotif">Notificações por Email</Label>
            </div>

            <Button onClick={() => handleSave('email')} className="w-full">
              Salvar Configurações de Email
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança e autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session">Timeout Sessão (min)</Label>
                <Input
                  id="session"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attempts">Máx. Tentativas Login</Label>
                <Input
                  id="attempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('maxLoginAttempts', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="2fa"
                checked={settings.twoFactorEnabled}
                onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
              />
              <Label htmlFor="2fa">Autenticação de 2 Fatores</Label>
            </div>

            <Button onClick={() => handleSave('segurança')} className="w-full">
              Salvar Configurações de Segurança
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure os tipos de notificação do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notificações em tempo real</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alertas por email</p>
                </div>
                <Switch
                  checked={settings.emailAlerts}
                  onCheckedChange={(checked) => handleSettingChange('emailAlerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notificações por SMS</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                />
              </div>
            </div>

            <Button onClick={() => handleSave('notificações')} className="w-full">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Webhook className="mr-2 h-5 w-5" />
            Integrações e API
          </CardTitle>
          <CardDescription>
            Configure integrações externas e acesso à API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook">Webhook URL</Label>
            <Input
              id="webhook"
              placeholder="https://api.exemplo.com/webhook"
              value={settings.webhookUrl}
              onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>API Habilitada</Label>
                <p className="text-sm text-muted-foreground">Permite acesso à API REST</p>
              </div>
              <Switch
                checked={settings.apiEnabled}
                onCheckedChange={(checked) => handleSettingChange('apiEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Rate Limiting</Label>
                <p className="text-sm text-muted-foreground">Limita requisições por minuto</p>
              </div>
              <Switch
                checked={settings.rateLimitEnabled}
                onCheckedChange={(checked) => handleSettingChange('rateLimitEnabled', checked)}
              />
            </div>
          </div>

          <Button onClick={() => handleSave('integrações')} className="w-full">
            Salvar Configurações de Integrações
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que podem afetar todo o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 border border-destructive rounded-lg">
            <div>
              <p className="font-medium">Limpar Cache do Sistema</p>
              <p className="text-sm text-muted-foreground">
                Remove todos os dados em cache. O sistema pode ficar lento temporariamente.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Limpar Cache
            </Button>
          </div>

          <div className="flex justify-between items-center p-4 border border-destructive rounded-lg">
            <div>
              <p className="font-medium">Resetar Configurações</p>
              <p className="text-sm text-muted-foreground">
                Retorna todas as configurações aos valores padrão.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Resetar Tudo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};