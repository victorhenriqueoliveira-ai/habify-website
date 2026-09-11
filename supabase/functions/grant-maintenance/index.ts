import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Concede manutenção sem cobrança — dev/admin usam isso pra bonificar um
// cliente ou corrigir uma compra que não passou pelo fluxo normal de
// pagamento. Grava exatamente no mesmo formato de uma manutenção paga
// (mesma tabela, mesmos 30 dias de validade) pra não precisar de nenhuma
// lógica especial no resto do sistema — só o payment_gateway muda.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { project_id, requesting_user_id, notes } = await req.json();

    if (!project_id || !requesting_user_id) {
      throw new Error('project_id e requesting_user_id são obrigatórios.');
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { data: isAdmin } = await supabaseService.rpc('is_admin_or_dev_v2', { _user_id: requesting_user_id });
    if (!isAdmin) {
      throw new Error('Apenas admin/dev podem conceder manutenção manualmente.');
    }

    const { data: project, error: projectError } = await supabaseService
      .from('projects')
      .select('id, title, user_id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      throw new Error(`Projeto não encontrado: ${projectError?.message ?? project_id}`);
    }

    if (!project.user_id) {
      throw new Error('Este projeto ainda não tem um cliente vinculado.');
    }

    const { data: maintenance, error: maintenanceError } = await supabaseService
      .from('maintenances')
      .insert({
        user_id: project.user_id,
        project_id: project.id,
        amount: 0,
        status: 'pending',
        payment_gateway: 'ADMIN_GRANT',
        payment_id: null,
        payment_data: {
          granted_manually: true,
          granted_by: requesting_user_id,
          granted_at: new Date().toISOString(),
          notes: notes || null,
        },
        contracted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (maintenanceError) {
      throw new Error(`Falha ao conceder manutenção: ${maintenanceError.message}`);
    }

    try {
      await supabaseService.functions.invoke('send-maintenance-confirmation', {
        body: { maintenanceId: maintenance.id },
      });
    } catch (emailError) {
      console.warn('[grant-maintenance] Falha ao enviar e-mail de confirmação:', emailError);
    }

    return new Response(
      JSON.stringify({ success: true, maintenance }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[grant-maintenance]', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
