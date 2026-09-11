import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AuthLayout } from '@/components/auth/AuthLayout';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const passwordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: 'Erro',
        description: 'A senha não atende aos requisitos de segurança',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Senha redefinida com sucesso. Redirecionando...',
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      // Error silenced for security - details not exposed to client
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao redefinir senha. Tente solicitar um novo link.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          Nova senha
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Crie uma senha forte e segura para sua conta
        </p>
      </div>
      <div className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {password && (
                <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs font-medium text-foreground mb-2">Requisitos de senha:</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.minLength ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        passwordValidation.minLength ? "text-green-600" : "text-muted-foreground"
                      )}>
                        Mínimo 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasUppercase ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        passwordValidation.hasUppercase ? "text-green-600" : "text-muted-foreground"
                      )}>
                        Uma letra maiúscula
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasNumber ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        passwordValidation.hasNumber ? "text-green-600" : "text-muted-foreground"
                      )}>
                        Um número
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasSpecial ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        passwordValidation.hasSpecial ? "text-green-600" : "text-muted-foreground"
                      )}>
                        Um caractere especial (!@#$%...)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <XCircle className="h-3 w-3" />
                  As senhas não coincidem
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold" 
              disabled={loading || !isPasswordValid || password !== confirmPassword}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? 'Atualizando...' : 'Redefinir Senha'}
            </Button>
          </form>
      </div>
    </AuthLayout>
  );
};
