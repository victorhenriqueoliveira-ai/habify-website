import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error('Order ID é obrigatório');
    }

    // Create Supabase client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Buscar dados do pedido
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .select(`
        *,
        plans:plan_id(name, price, pix_price, stripe_price)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Erro ao buscar pedido:', orderError);
      throw new Error('Pedido não encontrado');
    }

    // Verificar se pagamento está confirmado
    if (order.status !== 'paid') {
      throw new Error('Pagamento ainda não foi confirmado');
    }

    // Extrair dados do cliente
    const customerData = order.payment_data?.customerData;
    if (!customerData?.email || !customerData?.name) {
      throw new Error('Dados do cliente incompletos');
    }

    const planName = order.plans?.name || 'Plano';
    const planPrice = order.amount || order.plans?.price || 0;
    const gateway = order.gateway || 'N/A';
    const paymentMethod = order.payment_method || (gateway === 'ABACATEPAY' ? 'PIX' : 'Cartão de Crédito');

    // console.log('Enviando emails de confirmação:', { customerEmail: customerData.email, planName });

    // Email para o cliente
    const customerEmailResponse = await resend.emails.send({
      from: "Habify <onboarding@resend.dev>",
      to: [customerData.email],
      subject: `Confirmação de sua compra — ${planName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Bem-vindo à Habify! 🎉</h1>
          <p>Olá <strong>${customerData.name}</strong>,</p>
          <p>Obrigado por adquirir nosso plano <strong>${planName}</strong>!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">Detalhes da sua compra:</h2>
            <p><strong>Plano:</strong> ${planName}</p>
            <p><strong>Valor:</strong> R$ ${Number(planPrice).toFixed(2)}</p>
            <p><strong>Forma de pagamento:</strong> ${paymentMethod}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <h3 style="color: #333;">Próximos passos:</h3>
          <ol style="line-height: 1.8;">
            <li>Acesse sua conta no painel administrativo</li>
            <li>Clique em "Novo Projeto"</li>
            <li>Preencha as informações do seu projeto</li>
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

    // console.log('Email do cliente enviado:', customerEmailResponse);

    // Email para o admin
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@habify.com";
    
    const adminEmailResponse = await resend.emails.send({
      from: "Habify Notifications <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `Novo cliente confirmado — ${customerData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Novo Cliente Confirmado!</h1>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">Informações do Cliente:</h2>
            <p><strong>Nome:</strong> ${customerData.name}</p>
            <p><strong>Email:</strong> ${customerData.email}</p>
            ${customerData.phone ? `<p><strong>Telefone:</strong> ${customerData.phone}</p>` : ''}
            ${customerData.cpf ? `<p><strong>CPF:</strong> ${customerData.cpf}</p>` : ''}
          </div>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">Detalhes da Compra:</h2>
            <p><strong>Plano:</strong> ${planName}</p>
            <p><strong>Valor:</strong> R$ ${Number(planPrice).toFixed(2)}</p>
            <p><strong>Gateway:</strong> ${gateway}</p>
            <p><strong>Forma de pagamento:</strong> ${paymentMethod}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>ID do Pedido:</strong> ${orderId}</p>
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

    // console.log('Email do admin enviado:', adminEmailResponse);

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
    console.error("Erro ao enviar emails:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro ao enviar emails de confirmação'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
