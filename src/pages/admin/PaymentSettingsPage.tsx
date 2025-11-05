import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Key, Save, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { supabase } from '@/integrations/supabase/client';

export const PaymentSettingsPage = () => {
  const { settings, loading: settingsLoading, updateSetting } = useSystemSettings();
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [showAbacateKey, setShowAbacateKey] = useState(false);
  const [showHublaKey, setShowHublaKey] = useState(false);
  
  const [localSettings, setLocalSettings] = useState({
    abacatePayApiKey: '',
    hublaApiKey: '',
    modeDev: false,
  });

  useEffect(() => {
    if (settings.length > 0) {
      const abacateSetting = settings.find(s => s.key === 'abacatepay_api_key');
      const hublaSetting = settings.find(s => s.key === 'hubla_api_key');
      const modeSetting = settings.find(s => s.key === 'payment_mode_dev');
      
      setLocalSettings({
        abacatePayApiKey: abacateSetting?.value?.key || '',
        hublaApiKey: hublaSetting?.value?.key || '',
        modeDev: modeSetting?.value?.enabled || false,
      });
    }
  }, [settings]);

  const handleSaveClick = () => {
    setShowPasswordDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!password) {
      toast.error('Digite sua senha para confirmar');
      return;
    }

    setLoading(true);
    
    try {
      // Validar senha do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('Usuário não encontrado');
        return;
      }

      // Tentar fazer login com a senha fornecida
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        toast.error('Senha incorreta');
        return;
      }

      // Senha validada, salvar configurações
      const updates = [
        updateSetting('abacatepay_api_key', { 
          key: localSettings.abacatePayApiKey,
          updated_at: new Date().toISOString()
        }),
        updateSetting('hubla_api_key', { 
          key: localSettings.hublaApiKey,
          updated_at: new Date().toISOString()
        }),
        updateSetting('payment_mode_dev', { 
          enabled: localSettings.modeDev,
          updated_at: new Date().toISOString()
        }),
      ];

      await Promise.all(updates);

      toast.success('Configurações de pagamento salvas com sucesso!');
      setShowPasswordDialog(false);
      setPassword('');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold tracking-tight">Configurações de Pagamento</h1>
        <p className="text-muted-foreground">
          Configure as integrações de pagamento (AbacatePay e Hubla)
        </p>
      </div>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Atenção: Configurações Sensíveis
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Essas configurações afetam diretamente o processamento de pagamentos. 
                Você precisará confirmar sua senha antes de salvar qualquer alteração.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AbacatePay Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              AbacatePay (PIX)
            </CardTitle>
            <CardDescription>
              Configure a chave de API do AbacatePay para pagamentos via PIX
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="abacatepay">API Key</Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="abacatepay"
                    type={showAbacateKey ? "text" : "password"}
                    value={localSettings.abacatePayApiKey}
                    onChange={(e) => setLocalSettings(prev => ({...prev, abacatePayApiKey: e.target.value}))}
                    placeholder="Digite a chave da API do AbacatePay"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowAbacateKey(!showAbacateKey)}
                  >
                    {showAbacateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {localSettings.abacatePayApiKey && (
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Esta chave será usada para processar pagamentos via PIX através do AbacatePay
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hubla Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Hubla (Cartão)
            </CardTitle>
            <CardDescription>
              Configure a chave de API da Hubla para pagamentos com cartão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hubla">API Key</Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="hubla"
                    type={showHublaKey ? "text" : "password"}
                    value={localSettings.hublaApiKey}
                    onChange={(e) => setLocalSettings(prev => ({...prev, hublaApiKey: e.target.value}))}
                    placeholder="Digite a chave da API da Hubla"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowHublaKey(!showHublaKey)}
                  >
                    {showHublaKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {localSettings.hublaApiKey && (
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Esta chave será usada para processar pagamentos com cartão através da Hubla
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Modo de Operação</CardTitle>
          <CardDescription>
            Configure se o sistema está em modo de desenvolvimento ou produção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Desenvolvimento</Label>
              <p className="text-sm text-muted-foreground">
                Ativar ambiente de testes para pagamentos (sandbox)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={localSettings.modeDev ? "secondary" : "default"}>
                {localSettings.modeDev ? "DEV" : "PRODUÇÃO"}
              </Badge>
              <Switch
                checked={localSettings.modeDev}
                onCheckedChange={(checked) => setLocalSettings(prev => ({...prev, modeDev: checked}))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleSaveClick} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>

      {/* Password Confirmation Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alterações</DialogTitle>
            <DialogDescription>
              Por segurança, digite sua senha para confirmar as alterações nas configurações de pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmSave();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setPassword('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSave} disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
