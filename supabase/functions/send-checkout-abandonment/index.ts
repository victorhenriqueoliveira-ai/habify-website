import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface AbandonmentEmailRequest {
  name: string;
  email: string;
  planName: string;
  planPrice: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, planName, planPrice }: AbandonmentEmailRequest = await req.json();

    console.log('[SEND-CHECKOUT-ABANDONMENT] Sending abandonment email to:', email);

    const emailResponse = await resend.emails.send({
      from: "Habify <contato@habify.com.br>",
      to: [email],
      subject: "😊 Notamos que você não finalizou sua compra - Habify",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .plan-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
              .price { font-size: 32px; font-weight: bold; color: #f59e0b; margin: 15px 0; }
              .button { background: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold; }
              .support-box { background: #dcfce7; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>😊 Sentimos sua falta!</h1>
              </div>
              <div class="content">
                <p>Olá, <strong>${name}</strong>!</p>
                <p>Percebemos que você iniciou o processo de contratação do plano <strong>${planName}</strong>, mas não finalizou.</p>
                
                <div class="plan-box">
                  <h2 style="margin-top: 0; color: #f59e0b;">📋 ${planName}</h2>
                  <div class="price">R$ ${planPrice.toFixed(2)}</div>
                  <p style="margin-bottom: 0;">Crie landing pages profissionais para seus imóveis</p>
                </div>

                <h3 style="color: #f59e0b;">Por que escolher a Habify?</h3>
                <ul style="line-height: 2;">
                  <li>✨ Landing pages profissionais em minutos</li>
                  <li>📱 Design responsivo e otimizado para todos os dispositivos</li>
                  <li>🎨 Personalização completa de cores e layout</li>
                  <li>📸 Galeria de fotos otimizadas</li>
                  <li>🚀 Publicação imediata</li>
                  <li>💬 Suporte via WhatsApp</li>
                </ul>

                <div style="text-align: center;">
                  <a href="https://habify.com.br/checkout/${planName.toLowerCase().replace(/ /g, '-')}" class="button">Finalizar Minha Compra</a>
                </div>

                <div class="support-box">
                  <h4 style="margin-top: 0; color: #16a34a;">💬 Tem alguma dúvida?</h4>
                  <p>Nossa equipe está pronta para ajudar! Entre em contato pelo WhatsApp:</p>
                  <p style="font-size: 20px; font-weight: bold; margin: 10px 0; color: #16a34a;">+55 11 96176-9504</p>
                  <p style="margin-bottom: 0; font-size: 14px;">Estamos aqui para tirar todas as suas dúvidas e ajudar você a criar landing pages incríveis! 😊</p>
                </div>

                <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                  Se você já finalizou sua compra, por favor desconsidere este email.
                </p>
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

    console.log('[SEND-CHECKOUT-ABANDONMENT] Email sent:', emailResponse.data?.id);

    return new Response(JSON.stringify({ 
      success: true,
      email_id: emailResponse.data?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('[SEND-CHECKOUT-ABANDONMENT] Error:', error);
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
