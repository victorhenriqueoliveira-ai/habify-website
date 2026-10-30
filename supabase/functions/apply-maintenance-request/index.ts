import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { publishProjectSite } from "../_shared/publish-site.ts";
import {
  findPropertyField,
  findSiteField,
  validateFieldValue,
} from "../_shared/maintenance-catalog.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
      const fieldKey = changes.field as string;
      const propertyId = changes.property_id as string;

      const field = findPropertyField(fieldKey);
      if (!field) {
        return respondError(requestId, `Campo "${fieldKey}" não é editável automaticamente.`);
      }

      // A allowlist diz em qual coluna dá pra escrever; esta validação diz
      // o que dá pra escrever nela. Sem ela, um preço negativo ou um texto
      // gigante iam direto pro site.config.json do cliente.
      const validated = validateFieldValue(field, changes.new_value);
      if (!validated.ok) {
        return respondError(requestId, validated.error);
      }

      const { error: updateError } = await supabaseService
        .from('portfolio_properties')
        .update({ [field.key]: validated.value })
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
      const fieldKey = changes.field as string;

      const field = findSiteField(fieldKey);
      if (!field) {
        return respondError(requestId, `Campo "${fieldKey}" não é editável automaticamente.`);
      }

      const validated = validateFieldValue(field, changes.new_value);
      if (!validated.ok) {
        return respondError(requestId, validated.error);
      }

      // O catálogo diz onde o valor mora: a maioria dos campos do site
      // fica dentro de projects.wizard_data, mas alguns (como o logo) são
      // colunas de projects. Antes a função assumia wizard_data pra tudo.
      if (field.target === 'project') {
        const { error: updateError } = await supabaseService
          .from('projects')
          .update({ [field.key]: validated.value })
          .eq('id', projectId);
        if (updateError) {
          return respondError(requestId, `Falha ao atualizar o projeto: ${updateError.message}`);
        }
      } else {
        const { data: currentProject, error: loadError } = await supabaseService
          .from('projects')
          .select('wizard_data')
          .eq('id', projectId)
          .single();
        if (loadError || !currentProject) {
          return respondError(requestId, `Falha ao carregar projeto: ${loadError?.message ?? projectId}`);
        }
        const updatedWizardData = { ...(currentProject.wizard_data || {}), [field.key]: validated.value };
        const { error: updateError } = await supabaseService
          .from('projects')
          .update({ wizard_data: updatedWizardData })
          .eq('id', projectId);
        if (updateError) {
          return respondError(requestId, `Falha ao atualizar dados do site: ${updateError.message}`);
        }
      }
    } else {
      return respondError(requestId, `Tipo de alteração desconhecido: ${maintenanceRequest.change_type}`);
    }

    // ---- 2 e 3. Remonta o site.config.json, commita e publica ----
    //
    // Esta sequência vive em _shared/publish-site.ts porque é a mesma para
    // qualquer alteração pós-entrega: a manutenção paga e os ajustes
    // gratuitos (como a tag do Google) usam exatamente o mesmo caminho.
    const published = await publishProjectSite(
      supabaseService,
      projectId,
      `Manutenção: ${maintenanceRequest.title}`,
    );

    if (!published.ok) {
      return respondError(requestId, published.error);
    }

    const deployment = { deploymentId: published.deploymentId, origin: published.origin };
    const confirmed = published.confirmed;

    // ---- 4. Marca concluída ----
    //
    // Build não confirmado não é falha: a Vercel segue publicando depois
    // que a edge function morre. A solicitação é concluída do mesmo jeito,
    // e a nota registra que a publicação não foi confirmada aqui.
    await supabaseService
      .from('maintenance_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        applied_automatically: true,
        admin_notes: confirmed
          ? `Aplicado automaticamente e publicado (deploy ${deployment.deploymentId}, originado por ${deployment.origin === 'git' ? 'push' : 'API'}).`
          : `Aplicado automaticamente. A publicação foi disparada (deploy ${deployment.deploymentId}) mas ainda não tinha concluído quando terminamos de acompanhar — confira o site em alguns minutos.`,
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
      JSON.stringify({
        success: true,
        deploymentId: deployment.deploymentId,
        deploymentOrigin: deployment.origin,
        published: confirmed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return respondError(requestId, message, 500);
  }
});
