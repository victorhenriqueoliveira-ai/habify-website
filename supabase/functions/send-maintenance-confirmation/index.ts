import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface MaintenanceConfirmationRequest {
  maintenanceId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { maintenanceId }: MaintenanceConfirmationRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar dados da manutenção
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenances')
      .select(`
        *,
        project:projects(title, description),
        profile:profiles!maintenances_user_id_fkey(name, email)
      `)
      .eq('id', maintenanceId)
      .single();

    if (maintenanceError || !maintenance) {
      throw new Error('Manutenção não encontrada');
    }

    const customerEmail = maintenance.profile?.email;
    const customerName = maintenance.profile?.name;
    const projectTitle = maintenance.project?.title;

    if (!customerEmail) {
      throw new Error('Email do cliente não encontrado');
    }

    // Formatar datas
    const contractedDate = new Date(maintenance.contracted_at).toLocaleDateString('pt-BR');
    const expiresDate = new Date(maintenance.expires_at).toLocaleDateString('pt-BR');

    // Enviar email para o cliente
    const emailResponse = await resend.emails.send({
      from: "Habify <contato@habify.com.br>",
      to: [customerEmail],
      subject: "✅ Manutenção Mensal Confirmada - Habify",
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            .info-box {
              background: #f9fafb;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
            }
            .services {
              background: #ecfdf5;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .service-item {
              display: flex;
              align-items: center;
              margin: 10px 0;
            }
            .checkmark {
              color: #10b981;
              font-size: 20px;
              margin-right: 10px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Manutenção Confirmada!</h1>
          </div>
          
          <div class="content">
            <p>Olá <strong>${customerName}</strong>,</p>
            
            <p>Sua manutenção mensal foi confirmada com sucesso!</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">📋 Detalhes da Manutenção</h3>
              <p><strong>Projeto:</strong> ${projectTitle}</p>
              <p><strong>Valor:</strong> R$ ${Number(maintenance.amount).toFixed(2)}</p>
              <p><strong>Contratada em:</strong> ${contractedDate}</p>
              <p><strong>Válida até:</strong> ${expiresDate}</p>
              <p><strong>Status:</strong> ${maintenance.status === 'pending' ? 'Pendente' : 'Ativa'}</p>
            </div>
            
            <div class="services">
              <h3 style="margin-top: 0; color: #065f46;">✨ O que está incluído:</h3>
              
              <div class="service-item">
                <span class="checkmark">✓</span>
                <span>Atualizações de conteúdo ilimitadas</span>
              </div>
              
              <div class="service-item">
                <span class="checkmark">✓</span>
                <span>Correções de bugs e melhorias</span>
              </div>
              
              <div class="service-item">
                <span class="checkmark">✓</span>
                <span>Suporte técnico prioritário</span>
              </div>
              
              <div class="service-item">
                <span class="checkmark">✓</span>
                <span>Backup regular automático</span>
              </div>
            </div>
            
            <p>Nossa equipe já foi notificada e em breve entraremos em contato para agendar as primeiras atualizações.</p>
            
            <p style="text-align: center;">
              <a href="https://habify.com.br/admin/my-maintenances" class="button">
                Acessar Painel de Manutenções
              </a>
            </p>
            
            <p>Se tiver alguma dúvida, responda este email ou entre em contato conosco.</p>
            
            <p>Obrigado por confiar na Habify! 🚀</p>
          </div>
          
          <div class="footer">
            <p>Habify - Soluções em Sites Imobiliários</p>
            <p>Este é um email automático, mas você pode responder se precisar de ajuda.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email de confirmação enviado:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro ao enviar email de confirmação:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
