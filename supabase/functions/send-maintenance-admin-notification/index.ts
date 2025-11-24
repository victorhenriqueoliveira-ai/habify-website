import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface AdminNotificationRequest {
  maintenanceId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { maintenanceId }: AdminNotificationRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar dados da manutenção
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenances')
      .select(`
        *,
        project:projects(title, description, landing_page_url),
        profile:profiles!maintenances_user_id_fkey(name, email, phone)
      `)
      .eq('id', maintenanceId)
      .single();

    if (maintenanceError || !maintenance) {
      throw new Error('Manutenção não encontrada');
    }

    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@habify.com.br';
    const customerName = maintenance.profile?.name;
    const customerEmail = maintenance.profile?.email;
    const customerPhone = maintenance.profile?.phone;
    const projectTitle = maintenance.project?.title;
    const projectUrl = maintenance.project?.landing_page_url;

    // Formatar datas
    const contractedDate = new Date(maintenance.contracted_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const expiresDate = new Date(maintenance.expires_at).toLocaleDateString('pt-BR');

    // Enviar email para admins
    const emailResponse = await resend.emails.send({
      from: "Habify Notificações <contato@habify.com.br>",
      to: [adminEmail],
      subject: `🔧 Nova Manutenção Contratada - ${projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .info-section {
              background: #f9fafb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
            }
            .value {
              color: #111827;
              text-align: right;
            }
            .alert {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              background: #f59e0b;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔧 Nova Manutenção Contratada</h1>
          </div>
          
          <div class="content">
            <div class="alert">
              <strong>⚠️ Ação Necessária:</strong> Uma nova manutenção foi contratada e requer atenção da equipe.
            </div>
            
            <div class="info-section">
              <h3 style="margin-top: 0;">👤 Informações do Cliente</h3>
              <div class="info-row">
                <span class="label">Nome:</span>
                <span class="value">${customerName}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${customerEmail}">${customerEmail}</a></span>
              </div>
              ${customerPhone ? `
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">${customerPhone}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="info-section">
              <h3 style="margin-top: 0;">📦 Detalhes da Manutenção</h3>
              <div class="info-row">
                <span class="label">Projeto:</span>
                <span class="value">${projectTitle}</span>
              </div>
              ${projectUrl ? `
              <div class="info-row">
                <span class="label">URL:</span>
                <span class="value"><a href="${projectUrl}" target="_blank">${projectUrl}</a></span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Valor:</span>
                <span class="value"><strong>R$ ${Number(maintenance.amount).toFixed(2)}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Gateway:</span>
                <span class="value">${maintenance.payment_gateway}</span>
              </div>
              <div class="info-row">
                <span class="label">Contratada em:</span>
                <span class="value">${contractedDate}</span>
              </div>
              <div class="info-row">
                <span class="label">Válida até:</span>
                <span class="value">${expiresDate}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">${maintenance.status === 'pending' ? '🟡 Pendente' : '🟢 Ativa'}</span>
              </div>
            </div>
            
            <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #065f46;">✅ Próximos Passos:</h3>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Entrar em contato com o cliente em até 24h</li>
                <li>Agendar primeira reunião de alinhamento</li>
                <li>Definir cronograma de atualizações</li>
                <li>Atualizar status no painel admin</li>
              </ol>
            </div>
            
            <p style="text-align: center;">
              <a href="https://habify.com.br/admin/maintenances" class="button">
                Acessar Painel Admin
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>Sistema de Notificações Habify</p>
            <p>Este é um email automático do sistema.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email de notificação admin enviado:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro ao enviar notificação admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
