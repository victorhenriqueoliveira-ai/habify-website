import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailData {
  customerName: string;
  customerEmail: string;
  planName: string;
  planPrice: string;
  gateway: string;
  creditsGranted: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerName, customerEmail, planName, planPrice, gateway, creditsGranted }: EmailData = await req.json();
    
    // console.log('Sending payment confirmation emails:', { customerEmail, planName });

    // Email para o cliente
    const customerEmailResponse = await resend.emails.send({
      from: "Habify <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Confirmação de sua compra — ${planName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Bem-vindo à Habify! 🎉</h1>
          <p>Olá <strong>${customerName}</strong>,</p>
          <p>Obrigado por adquirir nosso plano <strong>${planName}</strong>!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">Detalhes da sua compra:</h2>
            <p><strong>Plano:</strong> ${planName}</p>
            <p><strong>Valor:</strong> R$ ${planPrice}</p>
            <p><strong>Forma de pagamento:</strong> ${gateway === 'ABACATEPAY' ? 'PIX' : 'Cartão de Crédito'}</p>
            <p><strong>Créditos concedidos:</strong> ${creditsGranted}</p>
          </div>
          
          <h3 style="color: #333;">Como usar seus créditos:</h3>
          <ol style="line-height: 1.8;">
            <li>Acesse sua conta no painel administrativo</li>
            <li>Clique em "Meus Projetos"</li>
            <li>Crie um novo projeto usando seus créditos</li>
            <li>Nossa equipe irá desenvolver seu site personalizado</li>
          </ol>
          
          <p style="margin-top: 30px;">Se tiver alguma dúvida, entre em contato conosco!</p>
          
          <p style="color: #666; margin-top: 40px;">
            Atenciosamente,<br>
            <strong>Equipe Habify</strong>
          </p>
        </div>
      `,
    });

    // console.log('Customer email sent:', customerEmailResponse);

    // Email para o admin
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@habify.com";
    
    const adminEmailResponse = await resend.emails.send({
      from: "Habify Notifications <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `Novo cliente confirmado — ${customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Novo Cliente Confirmado!</h1>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">Informações do Cliente:</h2>
            <p><strong>Nome:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">Detalhes da Compra:</h2>
            <p><strong>Plano:</strong> ${planName}</p>
            <p><strong>Valor:</strong> R$ ${planPrice}</p>
            <p><strong>Gateway:</strong> ${gateway === 'ABACATEPAY' ? 'PIX (AbacatePay)' : 'Cartão (Hubla)'}</p>
            <p><strong>Créditos concedidos:</strong> ${creditsGranted}</p>
          </div>
          
          <p style="margin-top: 30px; color: #666;">
            O cliente já pode acessar o painel e criar projetos.
          </p>
          
          <p style="color: #666; margin-top: 40px;">
            <strong>Sistema Habify</strong>
          </p>
        </div>
      `,
    });

    // console.log('Admin email sent:', adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerEmailId: customerEmailResponse.data?.id,
        adminEmailId: adminEmailResponse.data?.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
