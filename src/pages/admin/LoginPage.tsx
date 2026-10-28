import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { cn } from '@/lib/utils';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  /** Erro do servidor (credenciais). Fica fixo acima do formulário em vez
   *  de passar num toast que some antes de a pessoa terminar de ler. */
  const [formError, setFormError] = useState<string | null>(null);

  const { login, loading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  const errors = useMemo(
    () => ({
      email: !email.trim()
        ? 'Preencha seu e-mail.'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
          ? 'Esse e-mail parece incompleto.'
          : null,
      password: !password ? 'Preencha sua senha.' : null,
    }),
    [email, password],
  );

  const isValid = !errors.email && !errors.password;

  if (isAuthenticated) {
    return <Navigate to={hasRole(['admin', 'dev']) ? '/admin/users' : '/admin/my-projects'} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setFormError(null);

    if (!isValid) return;

    const success = await login(email, password);

    if (success) {
      // Sem toast de sucesso: a própria troca de tela já é o retorno.
      navigate(hasRole(['admin', 'dev']) ? '/admin/users' : '/admin/my-projects');
      return;
    }

    setFormError('E-mail ou senha incorretos. Confira os dados e tente de novo.');
  };

  const fieldClasses = (hasError: boolean) =>
    cn(
      'h-12 w-full rounded-[10px] border-[1.5px] bg-background pl-11 pr-3 text-[15.5px] transition-[border-color,box-shadow]',
      'placeholder:text-muted-foreground focus:outline-none',
      hasError
        ? 'border-destructive bg-destructive/5 focus:shadow-[0_0_0_3px_hsl(var(--destructive)/0.16)]'
        : 'border-input hover:border-muted-foreground/40 focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.14)]',
    );

  const showEmailError = touched.email && !!errors.email;
  const showPasswordError = touched.password && !!errors.password;

  return (
    <AuthLayout>
      <div className="space-y-1.5 text-center lg:text-left">
        <h2 className="font-display text-[28px] font-semibold tracking-[-0.03em] sm:text-3xl">Bem-vindo de volta</h2>
        <p className="text-[15px] text-muted-foreground">Entre para gerenciar seus projetos e imóveis.</p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] leading-relaxed text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          <span>
            {formError}{' '}
            <Link to="/forgot-password" className="font-semibold underline underline-offset-2">
              Esqueceu a senha?
            </Link>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[13.5px] font-semibold tracking-[-0.01em]">
            E-mail
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@email.com.br"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError(null);
              }}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={showEmailError}
              aria-describedby="email-msg"
              className={fieldClasses(showEmailError)}
            />
          </div>
          <p
            id="email-msg"
            className={cn('min-h-[17px] text-[12.5px]', showEmailError ? 'font-medium text-destructive' : 'sr-only')}
          >
            {showEmailError ? errors.email : 'Informe o e-mail da sua conta.'}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13.5px] font-semibold tracking-[-0.01em]">
              Senha
            </label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={showPasswordError}
              aria-describedby="password-msg"
              className={cn(fieldClasses(showPasswordError), 'pr-11')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
          <p
            id="password-msg"
            className={cn('min-h-[17px] text-[12.5px]', showPasswordError ? 'font-medium text-destructive' : 'sr-only')}
          >
            {showPasswordError ? errors.password : 'Informe a senha da sua conta.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-primary text-base font-semibold text-primary-foreground',
            'shadow-lg shadow-primary/20 transition-[filter,transform,opacity]',
            loading ? 'cursor-wait opacity-70' : 'hover:-translate-y-0.5 hover:brightness-110',
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Entrando…
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="mt-7 space-y-4 border-t border-border pt-6 text-center">
        <p className="text-[13.5px] text-muted-foreground">
          Ainda não tem site?{' '}
          <Link to="/#preco" className="font-semibold text-primary hover:underline">
            Crie o seu em minutos
          </Link>
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para a página inicial
        </Link>
      </div>
    </AuthLayout>
  );
};
