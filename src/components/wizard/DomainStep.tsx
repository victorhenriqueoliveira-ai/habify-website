import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Globe, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DomainStepProps {
  desiredDomain?: string;
  onDomainChange: (domain: string) => void;
}

export const DomainStep = ({ desiredDomain, onDomainChange }: DomainStepProps) => {
  const [searchInput, setSearchInput] = useState(desiredDomain || '');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    domain: string;
    fullDomain: string;
    available: boolean;
    suggestions: string[];
  } | null>(null);

  const sanitizeInput = (value: string) => {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, '');
  };

  const handleCheck = async () => {
    const sanitized = sanitizeInput(searchInput);
    if (!sanitized || sanitized.length < 2) {
      toast.error('Digite pelo menos 2 caracteres para o domínio');
      return;
    }

    setChecking(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-domain-availability', {
        body: { domain: sanitized },
      });

      if (error) throw error;

      setResult(data);
      if (data.available) {
        onDomainChange(data.domain);
      }
    } catch (error) {
      console.error('Error checking domain:', error);
      toast.error('Erro ao verificar domínio. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchInput(suggestion);
    onDomainChange(suggestion);
    setResult((prev) => prev ? { ...prev, domain: suggestion, fullDomain: `${suggestion}.com.br`, available: true } : null);
  };

  const handleClearDomain = () => {
    setSearchInput('');
    setResult(null);
    onDomainChange('');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Domínio do Site
            </h2>
            <p className="text-muted-foreground">
              Pesquise se o domínio desejado está disponível. Este passo é opcional — você pode pular e escolher depois.
            </p>
          </div>

          {/* Search input */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Nome do domínio</label>
              <div className="flex items-center">
                <Input
                  placeholder="meusite"
                  value={searchInput}
                  onChange={(e) => setSearchInput(sanitizeInput(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  className="rounded-r-none"
                  maxLength={63}
                />
                <div className="h-10 px-3 flex items-center bg-muted border border-l-0 border-input rounded-r-md text-sm text-muted-foreground font-medium">
                  .com.br
                </div>
              </div>
            </div>
            <Button onClick={handleCheck} disabled={checking || !searchInput.trim()}>
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Verificar
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg border-2 ${
              result.available
                ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
                : 'border-red-500/50 bg-red-50 dark:bg-red-950/20'
            }`}>
              <div className="flex items-center gap-3">
                {result.available ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        {result.fullDomain} está disponível!
                      </p>
                      <p className="text-sm text-green-600/80 dark:text-green-400/80">
                        Este domínio será reservado para o seu projeto.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">
                        {result.fullDomain} não está disponível
                      </p>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80">
                        Este domínio já está registrado. Veja as sugestões abaixo.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Suggestions */}
              {!result.available && result.suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium mb-3 text-muted-foreground">Sugestões disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="border-green-500/50 hover:bg-green-50 hover:border-green-500 dark:hover:bg-green-950/30"
                      >
                        <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                        {suggestion}.com.br
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected domain display */}
          {desiredDomain && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Domínio selecionado:</span>
                <Badge variant="secondary">{desiredDomain}.com.br</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearDomain}>
                Limpar
              </Button>
            </div>
          )}

          {/* Pricing info */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">
              <strong>💡 Sobre o registro:</strong> O registro do domínio custa <strong>R$ 40,00</strong> e será cobrado separadamente após a criação do projeto. Você poderá pagar na página do seu projeto.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
