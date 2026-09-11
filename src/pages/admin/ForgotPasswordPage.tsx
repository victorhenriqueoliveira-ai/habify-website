import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Erro',
        description: 'Preencha o campo de email',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email válido',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { 
          email,
          redirectUrl: 'https://habify.com.br/admin/reset-password'
        },
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha',
      });
    } catch (error: any) {
      // Error silenced for security - details not exposed to client
      toast({
        title: 'Email enviado',
        description: 'Se o email existir em nossa base, você receberá as instruções',
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          Recuperar senha
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {sent
            ? 'Email enviado com sucesso!'
            : 'Digite seu email para receber o link de recuperação'}
        </p>
      </div>
      <div className="mt-8 space-y-6">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Atenção</p>
                    <p>O link de recuperação expira em <strong>1 hora</strong> e só pode ser usado uma vez.</p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-2">
                      Email enviado para <strong className="text-primary">{email}</strong>
                    </p>
                    <p className="text-muted-foreground">
                      Verifique sua caixa de entrada e também a pasta de spam. 
                      O link expira em 1 hora.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Não recebeu o email? Verifique a pasta de spam ou tente novamente.</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center pt-4 border-t">
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
      </div>
    </AuthLayout>
  );
};
