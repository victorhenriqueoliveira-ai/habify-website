import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckRequest {
  email?: string;
  cpf?: string;
  phone?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, cpf, phone }: CheckRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const errors: string[] = [];

    // Check email uniqueness
    if (email) {
      const { data: emailExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (emailExists) {
        errors.push('Este email já está cadastrado');
      }
    }

    // Check CPF uniqueness (remove formatting)
    if (cpf) {
      const cpfDigits = cpf.replace(/\D/g, '');
      const { data: cpfProfiles } = await supabase
        .from('profiles')
        .select('phone')
        .not('phone', 'is', null);

      // Check if any profile has this CPF in their phone field or metadata
      // Since CPF is stored in phone field sometimes, we need to check both
      const cpfExists = cpfProfiles?.some(p => 
        p.phone?.replace(/\D/g, '') === cpfDigits
      );

      if (cpfExists) {
        errors.push('Este CPF já está cadastrado');
      }
    }

    // Check phone uniqueness (remove formatting)
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      const { data: phoneExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phoneDigits)
        .maybeSingle();

      if (phoneExists) {
        errors.push('Este telefone já está cadastrado');
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Check unique fields error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao verificar dados',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
