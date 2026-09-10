import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@3.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ProjectConfirmationRequest {
  userName: string;
  userEmail: string;
  projectTitle: string;
  projectDescription?: string;
  projectLocation?: string;
  planName: string;
  projectId: string;
  /** Projeto entra no pipeline de geração automática (ai-site-builder) em vez de fila manual de desenvolvimento. */
  aiSiteBuilderEnabled?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userName, 
      userEmail, 
      projectTitle, 
      projectDescription,
      projectLocation,
      planName,
      projectId,
      aiSiteBuilderEnabled,
    }: ProjectConfirmationRequest = await req.json();

    const nextSteps = aiSiteBuilderEnabled
      ? `
        <li>Seu site está sendo gerado e publicado automaticamente — geralmente pronto em poucos minutos</li>
        <li>Você recebe um e-mail assim que ele estiver no ar, com o link e instruções pra conectar seu domínio</li>
        <li>Acompanhe o progresso ao vivo no painel administrativo</li>
      `
      : `
        <li>Nossa equipe está revisando seu projeto</li>
        <li>Em breve você receberá atualizações sobre o desenvolvimento</li>
        <li>Você pode acompanhar o progresso no painel administrativo</li>
        <li>Use o chat para enviar dúvidas ou solicitações adicionais</li>
      `;

    console.log('[SEND-PROJECT-CONFIRMATION] Sending emails for project:', projectTitle);

    // Email para o usuário
    const userEmailResponse = await resend.emails.send({
      from: "Habify <contato@habify.com.br>",
      to: [userEmail],
      subject: `✅ Projeto "${projectTitle}" Criado com Sucesso!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; }
              .project-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .info-item { margin: 15px 0; padding: 15px; background: #fff7ed; border-radius: 5px; }
              .label { font-weight: bold; color: #F97316; display: block; margin-bottom: 5px; }
              .button { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Projeto Criado com Sucesso!</h1>
              </div>
              <div class="content">
                <p>Olá, <strong>${userName}</strong>!</p>
                <p>Seu projeto foi criado com sucesso e já está disponível em nossa plataforma.</p>

                <div class="project-box">
                  <h2 style="color: #F97316; margin-top: 0;">📋 Detalhes do Projeto</h2>
                  
                  <div class="info-item">
                    <span class="label">Nome do Projeto:</span>
                    <span>${projectTitle}</span>
                  </div>

                  ${projectDescription ? `
                    <div class="info-item">
                      <span class="label">Descrição:</span>
                      <span>${projectDescription}</span>
                    </div>
                  ` : ''}

                  ${projectLocation ? `
                    <div class="info-item">
                      <span class="label">Localização:</span>
                      <span>${projectLocation}</span>
                    </div>
                  ` : ''}

                  <div class="info-item">
                    <span class="label">Plano Utilizado:</span>
                    <span>${planName}</span>
                  </div>

                  <div class="info-item">
                    <span class="label">Data de Criação:</span>
                    <span>${new Date().toLocaleDateString('pt-BR', { 
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>

                <h3 style="color: #F97316;">🎯 Próximos Passos:</h3>
                <ul style="line-height: 2;">
                  ${nextSteps}
                </ul>

                <div style="text-align: center;">
                  <a href="https://habify.com.br/admin/projects/${projectId}" class="button">Ver Projeto</a>
                </div>

                <div style="background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #F97316; margin-top: 20px;">
                  <h4 style="margin-top: 0; color: #F97316;">💬 Precisa de ajuda?</h4>
                  <p style="margin-bottom: 0;">Entre em contato pelo email: <strong>contato@habify.com.br</strong></p>
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Habify. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Email para admin
    const adminEmailResponse = await resend.emails.send({
      from: "Habify Sistema <contato@habify.com.br>",
      to: ["habifybr@gmail.com"],
      subject: `🆕 Novo Projeto Criado: ${projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F97316; }
              .info-item { margin: 10px 0; }
              .label { font-weight: bold; color: #F97316; }
              .button { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🆕 Novo Projeto Criado</h1>
              </div>
              <div class="content">
                <p>Um novo projeto foi criado na plataforma Habify:</p>
                
                <div class="info-box">
                  <div class="info-item">
                    <span class="label">Cliente:</span> ${userName} (${userEmail})
                  </div>
                  <div class="info-item">
                    <span class="label">Projeto:</span> ${projectTitle}
                  </div>
                  ${projectLocation ? `
                    <div class="info-item">
                      <span class="label">Localização:</span> ${projectLocation}
                    </div>
                  ` : ''}
                  <div class="info-item">
                    <span class="label">Plano:</span> ${planName}
                  </div>
                  <div class="info-item">
                    <span class="label">Data:</span> ${new Date().toLocaleDateString('pt-BR', { 
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div style="text-align: center;">
                  <a href="https://habify.com.br/admin/projects/${projectId}" class="button">Visualizar Projeto</a>
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Habify. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('[SEND-PROJECT-CONFIRMATION] Emails sent successfully');

    return new Response(JSON.stringify({ 
      success: true,
      user_email_id: userEmailResponse.data?.id,
      admin_email_id: adminEmailResponse.data?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('[SEND-PROJECT-CONFIRMATION] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
