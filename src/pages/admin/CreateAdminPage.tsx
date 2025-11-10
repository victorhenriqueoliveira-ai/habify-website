import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Shield, UserCog } from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/validations';

type AdminRole = 'admin' | 'dev';

export default function CreateAdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<AdminRole>('admin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }

    setLoading(true);

    try {
      // Verificar se email já existe
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUsers) {
        toast.error('Este email já está cadastrado');
        setLoading(false);
        return;
      }

      // Criar usuário usando edge function
      const { data, error } = await supabase.functions.invoke('createUserWithCredit', {
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          cpf: formData.cpf?.replace(/\D/g, '') || null,
          phone: formData.phone?.replace(/\D/g, '') || null,
          role: role,
          credits: 0
        }
      });

      if (error) {
        console.error('Error creating admin:', error);
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar usuário');
      }

      toast.success(`${role === 'admin' ? 'Admin' : 'Dev'} criado com sucesso!`);
      navigate('/admin/users');
      
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Criar Novo Administrador</h1>
        <p className="text-muted-foreground">Cadastre um novo usuário Admin ou Dev</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Administrador</CardTitle>
          <CardDescription>
            Preencha os dados para criar uma nova conta administrativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Role */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tipo de Acesso *</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as AdminRole)}>
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="flex items-center cursor-pointer flex-1">
                    <Shield className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium">Administrador</div>
                      <div className="text-sm text-muted-foreground">
                        Acesso completo ao sistema, gerenciamento de usuários e projetos
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="dev" id="dev" />
                  <Label htmlFor="dev" className="flex items-center cursor-pointer flex-1">
                    <UserCog className="h-5 w-5 mr-3 text-purple-600" />
                    <div>
                      <div className="font-medium">Desenvolvedor</div>
                      <div className="text-sm text-muted-foreground">
                        Acesso técnico completo incluindo configurações e logs do sistema
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Alert>
              <AlertDescription>
                {role === 'admin' 
                  ? '👤 Admins podem gerenciar usuários, projetos, pagamentos e relatórios.'
                  : '⚙️ Devs têm acesso a todas as funcionalidades dos admins + configurações técnicas e logs do sistema.'
                }
              </AlertDescription>
            </Alert>

            {/* Campos do formulário */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="João da Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@habify.com.br"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Digite a senha novamente"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Criar {role === 'admin' ? 'Admin' : 'Dev'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
