import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    if (hasRole(['dev'])) {
      return <Navigate to="/admin/users" replace />;
    }
    return <Navigate to="/admin/my-projects" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    const success = await login(email, password);
    
    if (success) {
      toast({
        title: 'Sucesso!',
        description: 'Login realizado com sucesso',
      });
      // Redirect based on user role
      if (hasRole(['dev'])) {
        navigate('/admin/users');
      } else {
        navigate('/admin');
      }
    } else {
      toast({
        title: 'Erro',
        description: 'Email ou senha incorretos. Use uma das contas de teste abaixo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      {/* Back to Homepage Button */}      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">HabiFy Admin</CardTitle>
          <CardDescription>
            Faça login para acessar o painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="flex flex-col items-center mt-4">
            <Link to="/" className="text-primary hover:text-primary-700 mb-8">
              ← Voltar para a página inicial
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};