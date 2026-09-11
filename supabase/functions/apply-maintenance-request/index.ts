import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildSiteConfig, commitSiteConfig } from "../_shared/site-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Campos que uma solicitação de manutenção pode alterar diretamente.
// Mantido explícito (em vez de aceitar qualquer nome de coluna vindo do
// cliente) pra nunca dar pra escrever em colunas fora dessa lista.
const EDITABLE_PROPERTY_FIELDS = new Set([
  'title',
  'location',
  'price',
  'description',
  'bedrooms',
  'bathrooms',
  'area',
  'parking_spaces',
  'condominium_fee',
  'iptu',
]);

const EDITABLE_CONTACT_FIELDS = new Set([
  'contactPhone',
  'contactMobile',
  'contactEmail',
  'companyName',
  'ownerName',
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  const respondError = async (requestId: string | undefined, message: string, status = 400) => {
    // Falha em aplicar automaticamente não é um erro fatal do sistema — a
    // solicitação continua 'pending' pra um humano assumir. Só registramos
    // o motivo em admin_notes pra quem for atender já entender o que rolou.
    if (requestId) {
      await supabaseService
        .from('maintenance_requests')
        .update({ admin_notes: `Tentativa automática falhou: ${message}` })
        .eq('id', requestId);
    }
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status },
    );
  };

  let requestId: string | undefined;

  try {
    const body = await req.json();
    requestId = body.request_id;
    const requestingUserId: string | undefined = body.requesting_user_id;

    if (!requestId || !requestingUserId) {
      return respondError(requestId, 'request_id e requesting_user_id são obrigatórios.');
    }

    const { data: maintenanceRequest, error: requestError } = await supabaseService
      .from('maintenance_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !maintenanceRequest) {
      return respondError(requestId, `Solicitação não encontrada: ${requestError?.message ?? requestId}`, 404);
    }

    // Dono da solicitação ou admin/dev.
    const { data: requesterProfile } = await supabaseService
      .from('profiles')
      .select('id')
      .eq('user_id', requestingUserId)
      .single();

    if (!requesterProfile || requesterProfile.id !== maintenanceRequest.user_id) {
      const { data: isAdmin } = await supabaseService.rpc('is_admin_or_dev_v2', { _user_id: requestingUserId });
      if (!isAdmin) {
        return respondError(requestId, 'Usuário não tem permissão sobre esta solicitação.', 403);
      }
    }

    if (maintenanceRequest.status !== 'pending') {
      return respondError(requestId, `Solicitação já está em status "${maintenanceRequest.status}".`);
    }

    if (maintenanceRequest.change_type === 'other' || !maintenanceRequest.changes) {
      return respondError(requestId, 'Esta solicitação não é estruturada — precisa de atendimento manual.');
    }

    const projectId = maintenanceRequest.project_id as string;
    const changes = maintenanceRequest.changes as Record<string, unknown>;

    // ---- 1. Aplica a mudança estruturada no banco ----
    if (maintenanceRequest.change_type === 'property_field') {
      const field = changes.field as string;
      const propertyId = changes.property_id as string;
      if (!EDITABLE_PROPERTY_FIELDS.has(field)) {
        return respondError(requestId, `Campo "${field}" não é editável automaticamente.`);
      }
      const { error: updateError } = await supabaseService
        .from('portfolio_properties')
        .update({ [field]: changes.new_value })
        .eq('id', propertyId)
        .eq('project_id', projectId);
      if (updateError) {
        return respondError(requestId, `Falha ao atualizar imóvel: ${updateError.message}`);
      }
    } else if (maintenanceRequest.change_type === 'property_photos') {
      const propertyId = changes.property_id as string;
      const photos = changes.photos;
      if (!Array.isArray(photos)) {
        return respondError(requestId, 'Lista de fotos inválida.');
      }
      const { error: updateError } = await supabaseService
        .from('portfolio_properties')
        .update({ photos })
        .eq('id', propertyId)
        .eq('project_id', projectId);
      if (updateError) {
        return respondError(requestId, `Falha ao atualizar fotos: ${updateError.message}`);
      }
    } else if (maintenanceRequest.change_type === 'contact_info') {
      const field = changes.field as string;
      if (!EDITABLE_CONTACT_FIELDS.has(field)) {
        return respondError(requestId, `Campo "${field}" não é editável automaticamente.`);
      }
      const { data: currentProject, error: loadError } = await supabaseService
        .from('projects')
        .select('wizard_data')
        .eq('id', projectId)
        .single();
      if (loadError || !currentProject) {
        return respondError(requestId, `Falha ao carregar projeto: ${loadError?.message ?? projectId}`);
      }
      const updatedWizardData = { ...(currentProject.wizard_data || {}), [field]: changes.new_value };
      const { error: updateError } = await supabaseService
        .from('projects')
        .update({ wizard_data: updatedWizardData })
        .eq('id', projectId);
      if (updateError) {
        return respondError(requestId, `Falha ao atualizar dados de contato: ${updateError.message}`);
      }
    } else {
      return respondError(requestId, `Tipo de alteração desconhecido: ${maintenanceRequest.change_type}`);
    }

    // ---- 2. Recarrega tudo já atualizado e remonta o site.config.json ----
    const { data: project, error: projectError } = await supabaseService
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return respondError(requestId, `Falha ao recarregar projeto: ${projectError?.message ?? projectId}`);
    }

    if (!project.github_repo_name) {
      return respondError(requestId, 'Este projeto ainda não tem um site gerado — não dá pra aplicar via API. Peça pra alguém atender manualmente.');
    }

    const { data: properties, error: propertiesError } = await supabaseService
      .from('portfolio_properties')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (propertiesError) {
      return respondError(requestId, `Falha ao recarregar imóveis: ${propertiesError.message}`);
    }

    const githubToken = Deno.env.get('GITHUB_PAT');
    if (!githubToken) {
      return respondError(requestId, 'GITHUB_PAT não configurado nos secrets da função.');
    }

    const siteConfig = buildSiteConfig(project, properties || []);
    const commitResult = await commitSiteConfig(
      githubToken,
      project.github_repo_name,
      siteConfig,
      `Manutenção: ${maintenanceRequest.title}`,
    );

    if (!commitResult.ok) {
      return respondError(requestId, commitResult.error);
    }

    // ---- 3. Marca concluída ----
    await supabaseService
      .from('maintenance_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        applied_automatically: true,
        admin_notes: 'Aplicado automaticamente via API.',
      })
      .eq('id', requestId);

    try {
      await supabaseService.functions.invoke('send-maintenance-request-notification', {
        body: { requestId, action: 'completed' },
      });
    } catch (emailError) {
      console.warn('[apply-maintenance-request] Falha ao enviar notificação:', emailError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return respondError(requestId, message, 500);
  }
});
