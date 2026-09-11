import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    if (hasRole(['admin', 'dev'])) {
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
      if (hasRole(['admin', 'dev'])) {
        navigate('/admin/users');
      } else {
        navigate('/admin/my-projects');
      }
    } else {
      toast({
        title: 'Erro',
        description: 'Email ou senha incorretos.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          Bem-vindo de volta
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Entre para gerenciar seus projetos e imóveis
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-10"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-10 pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-8 flex items-center justify-center border-t pt-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a página inicial
        </Link>
      </div>
    </AuthLayout>
  );
};
