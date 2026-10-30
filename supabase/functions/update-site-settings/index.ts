// Ajustes de site que o cliente faz sem gastar crédito de manutenção.
//
// A manutenção existe pra alterações de conteúdo — texto, fotos, imóveis.
// Colar o Measurement ID do Google Analytics não é isso: é o cliente
// conectando a própria ferramenta de medição ao site que já pagou. Cobrar
// um crédito por isso faria o cliente simplesmente não medir nada.
//
// A lista de campos gratuitos é curta e explícita de propósito. Ela não lê
// do catálogo de manutenção: um campo entrar lá não deve, sozinho, torná-lo
// gratuito — essa é uma decisão de negócio, não uma consequência técnica.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { publishProjectSite } from "../_shared/publish-site.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FreeField {
  label: string;
  /** Valida e normaliza. Devolver null limpa o campo. */
  parse: (raw: unknown) => { ok: true; value: string | null } | { ok: false; error: string };
}

const GA_MEASUREMENT_ID = /^G-[A-Z0-9]{4,20}$/;

const FREE_FIELDS: Record<string, FreeField> = {
  googleAnalyticsId: {
    label: 'ID do Google Analytics',
    parse: (raw) => {
      if (raw === null || raw === undefined || raw === '') return { ok: true, value: null };
      if (typeof raw !== 'string') return { ok: false, error: 'O ID precisa ser um texto.' };

      const value = raw.trim().toUpperCase();
      if (!GA_MEASUREMENT_ID.test(value)) {
        return {
          ok: false,
          error: 'O ID do Google Analytics tem o formato G-XXXXXXX. Confira no painel do Google.',
        };
      }
      return { ok: true, value };
    },
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { project_id: projectId, field: fieldKey, value, requesting_user_id: requestingUserId } =
      await req.json();

    if (!projectId || !fieldKey || !requestingUserId) {
      return json({ success: false, error: 'project_id, field e requesting_user_id são obrigatórios.' }, 400);
    }

    const field = FREE_FIELDS[fieldKey];
    if (!field) {
      return json({ success: false, error: `"${fieldKey}" não é um ajuste gratuito.` }, 400);
    }

    const parsed = field.parse(value);
    if (!parsed.ok) {
      return json({ success: false, error: parsed.error }, 400);
    }

    // ---- Permissão: dono do projeto, ou admin/dev ----
    const { data: project, error: projectError } = await supabaseService
      .from('projects')
      .select('id, user_id, wizard_data, title')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return json({ success: false, error: 'Projeto não encontrado.' }, 404);
    }

    // projects.user_id guarda o id de autenticação, não o profiles.id —
    // são convenções diferentes no mesmo banco, então a comparação é
    // direta com requesting_user_id.
    if (project.user_id !== requestingUserId) {
      const { data: isAdmin } = await supabaseService.rpc('is_admin_or_dev_v2', {
        _user_id: requestingUserId,
      });
      if (!isAdmin) {
        return json({ success: false, error: 'Você não tem permissão sobre este projeto.' }, 403);
      }
    }

    // ---- Grava ----
    const updatedWizardData = { ...(project.wizard_data || {}), [fieldKey]: parsed.value };

    const { error: updateError } = await supabaseService
      .from('projects')
      .update({ wizard_data: updatedWizardData })
      .eq('id', projectId);

    if (updateError) {
      return json({ success: false, error: `Falha ao salvar: ${updateError.message}` }, 500);
    }

    // ---- Publica ----
    const published = await publishProjectSite(
      supabaseService,
      projectId,
      `Configuração: ${field.label}`,
    );

    if (!published.ok) {
      // O valor ficou salvo; só não chegou ao site. Dizer isso é melhor que
      // um "erro" genérico que faria o cliente tentar salvar de novo.
      return json(
        {
          success: false,
          saved: true,
          error: `Salvamos o valor, mas não conseguimos publicar agora: ${published.error}`,
        },
        502,
      );
    }

    return json({
      success: true,
      saved: true,
      published: published.confirmed,
      deploymentId: published.deploymentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, error: message }, 500);
  }
});
