import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { UserRole } from '@/types/admin';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const roleLabels = {
  user: 'Corretor',
  admin: 'Administrador',
  dev: 'Desenvolvedor',
};

export const NewUserPage = () => {
  const navigate = useNavigate();
  const { createUser } = useUsers();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    role: '' as UserRole | '',
    credits: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast({
        title: 'Erro de validação',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        company: formData.company,
        role: formData.role as UserRole,
        credits: formData.credits,
      });

      toast({
        title: 'Usuário criado',
        description: `${formData.name} foi adicionado ao sistema com sucesso.`,
      });

      navigate('/admin/users');
    } catch (error) {
      toast({
        title: 'Erro ao criar usuário',
        description: 'Ocorreu um erro ao criar o usuário. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Usuário</h1>
          <p className="text-muted-foreground">
            Adicione um novo usuário ao sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>
            Preencha os dados do novo usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="João Silva"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="joao@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Senha segura"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Imobiliária XYZ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Perfil *</Label>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{roleLabels.user}</SelectItem>
                    <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                    <SelectItem value="dev">{roleLabels.dev}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Créditos Iniciais</Label>
                <Input
                  id="credits"
                  type="number"
                  min="0"
                  value={formData.credits}
                  onChange={(e) => handleChange('credits', e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Quantidade de sites que o usuário poderá criar
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};