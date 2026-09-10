import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@3.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SiteReadyRequest {
  userName: string;
  userEmail: string;
  projectTitle: string;
  siteUrl: string;
  projectId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail, projectTitle, siteUrl, projectId }: SiteReadyRequest = await req.json();

    console.log('[SEND-SITE-READY] Sending email for project:', projectTitle);

    const emailResponse = await resend.emails.send({
      from: "Habify <contato@habify.com.br>",
      to: [userEmail],
      subject: `🚀 Seu site "${projectTitle}" já está no ar!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; }
              .site-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
              .site-link { font-size: 18px; font-weight: bold; color: #F97316; word-break: break-all; }
              .button { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
              .button-outline { border: 2px solid #F97316; color: #F97316; padding: 10px 28px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 Seu site já está no ar!</h1>
              </div>
              <div class="content">
                <p>Olá, <strong>${userName}</strong>!</p>
                <p>Seu site <strong>"${projectTitle}"</strong> foi gerado e publicado automaticamente — sem espera de fila de desenvolvimento.</p>

                <div class="site-box">
                  <p style="margin-top: 0; color: #666;">Endereço temporário do seu site:</p>
                  <p class="site-link"><a href="${siteUrl}" style="color: #F97316;">${siteUrl}</a></p>
                </div>

                <h3 style="color: #F97316;">🌐 Quer usar seu próprio domínio?</h3>
                <p>Você pode conectar um domínio que já tenha (ou registrar um novo) direto no painel — lá tem as instruções exatas de DNS pra apontar pro seu site.</p>

                <div style="text-align: center;">
                  <a href="${siteUrl}" class="button">Ver Site</a>
                  <a href="https://habify.com.br/admin/projects/${projectId}" class="button-outline">Conectar Domínio</a>
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

    console.log('[SEND-SITE-READY] Email sent successfully');

    return new Response(JSON.stringify({
      success: true,
      email_id: emailResponse.data?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('[SEND-SITE-READY] Error:', error);
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
