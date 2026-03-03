import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain || typeof domain !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Domínio é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize: only allow alphanumeric, hyphens
    const sanitized = domain.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!sanitized || sanitized.length < 2 || sanitized.length > 63) {
      return new Response(
        JSON.stringify({ error: 'Domínio inválido. Use entre 2 e 63 caracteres (letras, números e hífens).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullDomain = `${sanitized}.com.br`;

    // Query Registro.br RDAP API
    const rdapUrl = `https://rdap.registro.br/domain/${fullDomain}`;
    const rdapResponse = await fetch(rdapUrl, {
      headers: { 'Accept': 'application/rdap+json' },
    });

    const available = rdapResponse.status === 404;

    // Generate suggestions if domain is taken
    const suggestions: string[] = [];
    if (!available) {
      const suffixes = ['imoveis', 'corretor', 'imob', 'site'];
      for (const suffix of suffixes) {
        const suggestion = `${sanitized}${suffix}`;
        if (suggestion.length <= 63) {
          // Check each suggestion
          try {
            const suggestResp = await fetch(`https://rdap.registro.br/domain/${suggestion}.com.br`, {
              headers: { 'Accept': 'application/rdap+json' },
            });
            if (suggestResp.status === 404) {
              suggestions.push(suggestion);
            }
          } catch {
            // Skip failed suggestion checks
          }
          if (suggestions.length >= 3) break;
        }
      }
    }

    return new Response(
      JSON.stringify({
        domain: sanitized,
        fullDomain,
        available,
        suggestions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking domain:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar domínio' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
