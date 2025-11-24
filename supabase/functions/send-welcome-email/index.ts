import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface WelcomeEmailRequest {
  name: string;
  email: string;
  isAdmin?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, isAdmin }: WelcomeEmailRequest = await req.json();

    console.log('[SEND-WELCOME-EMAIL] Sending welcome email to:', email);

    if (isAdmin) {
      // Email para admin sobre novo cliente
      const adminEmailResponse = await resend.emails.send({
        from: "Habify Sistema <contato@habify.com.br>",
        to: ["habifybr@gmail.com"],
        subject: "🎉 Novo Cliente Registrado - Habify",
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
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Novo Cliente Registrado!</h1>
                </div>
                <div class="content">
                  <p>Um novo cliente acabou de se registrar na plataforma Habify:</p>
                  
                  <div class="info-box">
                    <div class="info-item">
                      <span class="label">Nome:</span> ${name}
                    </div>
                    <div class="info-item">
                      <span class="label">Email:</span> ${email}
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

                  <p>O cliente já pode acessar a plataforma e criar seus projetos.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Habify. Todos os direitos reservados.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      console.log('[SEND-WELCOME-EMAIL] Admin notification sent:', adminEmailResponse.data?.id);
    }

    // Email de boas-vindas para o usuário
    const userEmailResponse = await resend.emails.send({
      from: "Habify <contato@habify.com.br>",
      to: [email],
      subject: "🎉 Bem-vindo à Habify!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; }
              .welcome-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .step { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #F97316; }
              .step-number { background: #F97316; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px; }
              .button { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
              .highlight { color: #F97316; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Bem-vindo à Habify!</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Olá, ${name}!</p>
              </div>
              <div class="content">
                <div class="welcome-box">
                  <h2 style="color: #F97316; margin-top: 0;">Sua conta foi criada com sucesso! 🚀</h2>
                  <p>Estamos muito felizes em tê-lo(a) conosco. A Habify é a plataforma completa para criar landing pages profissionais para seus imóveis de forma rápida e fácil.</p>
                </div>

                <h3 style="color: #F97316;">Como usar a plataforma:</h3>

                <div class="step">
                  <div style="display: flex; align-items: center;">
                    <span class="step-number">1</span>
                    <div>
                      <strong>Acesse sua conta</strong>
                      <p style="margin: 5px 0 0 0;">Entre com seu email e senha em <a href="https://habify.com.br/admin/auth" style="color: #F97316;">habify.com.br/admin/auth</a></p>
                    </div>
                  </div>
                </div>

                <div class="step">
                  <div style="display: flex; align-items: center;">
                    <span class="step-number">2</span>
                    <div>
                      <strong>Escolha seu plano</strong>
                      <p style="margin: 5px 0 0 0;">Se ainda não tem um plano ativo, escolha o que melhor atende suas necessidades</p>
                    </div>
                  </div>
                </div>

                <div class="step">
                  <div style="display: flex; align-items: center;">
                    <span class="step-number">3</span>
                    <div>
                      <strong>Crie seu projeto</strong>
                      <p style="margin: 5px 0 0 0;">Preencha os dados do seu imóvel, adicione fotos e personalize sua landing page</p>
                    </div>
                  </div>
                </div>

                <div class="step">
                  <div style="display: flex; align-items: center;">
                    <span class="step-number">4</span>
                    <div>
                      <strong>Publique e compartilhe</strong>
                      <p style="margin: 5px 0 0 0;">Sua landing page estará pronta para ser compartilhada com seus clientes!</p>
                    </div>
                  </div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://habify.com.br/admin/auth" class="button">Acessar Minha Conta</a>
                </div>

                <div class="welcome-box" style="background: #fff7ed; border-left: 4px solid #F97316;">
                  <h4 style="margin-top: 0; color: #F97316;">💬 Precisa de ajuda?</h4>
                  <p style="margin-bottom: 0;">Nossa equipe está pronta para ajudar! Entre em contato pelo email: <strong>contato@habify.com.br</strong></p>
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Habify. Todos os direitos reservados.</p>
                <p>Landing Pages Profissionais para Imóveis</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('[SEND-WELCOME-EMAIL] User email sent:', userEmailResponse.data?.id);

    return new Response(JSON.stringify({ 
      success: true,
      user_email_id: userEmailResponse.data?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('[SEND-WELCOME-EMAIL] Error:', error);
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
