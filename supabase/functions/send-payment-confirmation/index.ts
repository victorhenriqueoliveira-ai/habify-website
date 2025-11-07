import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const createEmailTemplate = (data: {
  customerName: string;
  planName: string;
  planPrice: number;
  paymentMethod: string;
  orderDate: string;
  orderId: string;
  planFeatures: string[];
}) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Compra - Habify</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header com gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <img src="https://jsttoajuszshrivmgnmc.supabase.co/storage/v1/object/public/project-photos/logotipo_habify.png" alt="Habify" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                🎉 Pagamento Confirmado!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 10px 0 0 0;">
                Bem-vindo à Habify
              </p>
            </td>
          </tr>
          
          <!-- Corpo principal -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Saudação -->
              <p style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                Olá, ${data.customerName}! 👋
              </p>
              <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                Recebemos a confirmação do seu pagamento e estamos muito felizes em ter você conosco!
              </p>
              
              <!-- Card de detalhes da compra -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h2 style="color: #334155; font-size: 18px; font-weight: 700; margin: 0 0 20px 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px;">
                      📋 Detalhes da Compra
                    </h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500;">Plano:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${data.planName}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500;">Valor pago:</td>
                        <td style="color: #16a34a; font-size: 16px; font-weight: 700; text-align: right;">R$ ${data.planPrice.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500;">Forma de pagamento:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${data.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500;">Data:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${data.orderDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500;">ID do pedido:</td>
                        <td style="color: #64748b; font-size: 12px; font-family: monospace; text-align: right;">${data.orderId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Benefícios do plano -->
              ${data.planFeatures && data.planFeatures.length > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="color: #334155; font-size: 16px; font-weight: 700; margin: 0 0 15px 0;">
                      ✨ O que está incluído no seu plano:
                    </h3>
                    ${data.planFeatures.map(feature => `
                      <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span style="color: #16a34a; font-size: 18px; margin-right: 10px;">✓</span>
                        <span style="color: #475569; font-size: 14px; line-height: 1.5;">${feature}</span>
                      </div>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Próximos passos -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="color: #1e40af; font-size: 16px; font-weight: 700; margin: 0 0 15px 0;">
                      🚀 Próximos Passos
                    </h3>
                    <ol style="color: #1e40af; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;"><strong>Acesse o Painel:</strong> Faça login na plataforma com seu email cadastrado</li>
                      <li style="margin-bottom: 8px;"><strong>Crie seu Projeto:</strong> Clique em "Novo Projeto" no menu</li>
                      <li style="margin-bottom: 8px;"><strong>Preencha as Informações:</strong> Adicione os detalhes do seu empreendimento</li>
                      <li style="margin-bottom: 8px;"><strong>Aguarde o Desenvolvimento:</strong> Nossa equipe começará a trabalhar imediatamente</li>
                      <li><strong>Acompanhe o Progresso:</strong> Você receberá atualizações por email</li>
                    </ol>
                  </td>
                </tr>
              </table>
              
              <!-- Botão de ação -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://habify.app/admin/login" style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.4); transition: all 0.3s;">
                      Acessar Minha Conta →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Suporte -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <p style="color: #7c2d12; font-size: 14px; line-height: 1.6; margin: 0;">
                      <strong>💬 Precisa de Ajuda?</strong><br>
                      Nossa equipe está disponível para te ajudar! Entre em contato através do email 
                      <a href="mailto:contato@habify.com.br" style="color: #7c2d12; text-decoration: underline;">contato@habify.com.br</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Agradecimento -->
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                Obrigado por escolher a Habify! Estamos empolgados em ajudar você a criar um site incrível para o seu negócio.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} Habify - Todos os direitos reservados<br>
                Desenvolvimento profissional de sites e plataformas web
              </p>
              <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                Este é um email automático, por favor não responda.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const createAdminEmailTemplate = (data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCpf?: string;
  planName: string;
  planPrice: number;
  gateway: string;
  paymentMethod: string;
  orderDate: string;
  orderId: string;
}) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Venda - Habify Admin</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">
                💰 Nova Venda Confirmada!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 10px 0 0 0;">
                Pagamento aprovado e cliente ativado
              </p>
            </td>
          </tr>
          
          <!-- Corpo -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Informações do cliente -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <tr>
                  <td>
                    <h2 style="color: #334155; font-size: 18px; font-weight: 700; margin: 0 0 20px 0;">
                      👤 Dados do Cliente
                    </h2>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500;">Nome:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${data.customerName}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500;">Email:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${data.customerEmail}</td>
                      </tr>
                      ${data.customerPhone ? `
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500;">Telefone:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${data.customerPhone}</td>
                      </tr>
                      ` : ''}
                      ${data.customerCpf ? `
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500;">CPF:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${data.customerCpf}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Detalhes da venda -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <tr>
                  <td>
                    <h2 style="color: #166534; font-size: 18px; font-weight: 700; margin: 0 0 20px 0;">
                      💳 Detalhes da Venda
                    </h2>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #166534; font-size: 14px; font-weight: 500;">Plano:</td>
                        <td style="color: #14532d; font-size: 14px; font-weight: 600; text-align: right;">${data.planName}</td>
                      </tr>
                      <tr>
                        <td style="color: #166534; font-size: 14px; font-weight: 500;">Valor:</td>
                        <td style="color: #16a34a; font-size: 18px; font-weight: 700; text-align: right;">R$ ${data.planPrice.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="color: #166534; font-size: 14px; font-weight: 500;">Gateway:</td>
                        <td style="color: #14532d; font-size: 14px; font-weight: 600; text-align: right;">${data.gateway}</td>
                      </tr>
                      <tr>
                        <td style="color: #166534; font-size: 14px; font-weight: 500;">Método:</td>
                        <td style="color: #14532d; font-size: 14px; font-weight: 600; text-align: right;">${data.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="color: #166534; font-size: 14px; font-weight: 500;">Data:</td>
                        <td style="color: #14532d; font-size: 14px; font-weight: 600; text-align: right;">${data.orderDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #166534; font-size: 14px; font-weight: 500;">ID:</td>
                        <td style="color: #166534; font-size: 12px; font-family: monospace; text-align: right;">${data.orderId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Status -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                      <strong>✅ Status do Cliente:</strong><br>
                      • Conta criada e ativada automaticamente<br>
                      • Email de boas-vindas enviado<br>
                      • Plano ativado e pronto para uso<br>
                      • Cliente pode criar projetos imediatamente
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Sistema de Notificações Habify Admin
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SEND-PAYMENT-CONFIRMATION] Function invoked');
    
    const { orderId } = await req.json();
    console.log('[SEND-PAYMENT-CONFIRMATION] Order ID:', orderId);
    
    if (!orderId) {
      throw new Error('Order ID é obrigatório');
    }

    // Verificar se RESEND_API_KEY está configurada
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error('[SEND-PAYMENT-CONFIRMATION] RESEND_API_KEY não configurada');
      throw new Error('RESEND_API_KEY não está configurada');
    }
    console.log('[SEND-PAYMENT-CONFIRMATION] RESEND_API_KEY verificada');

    // Create Supabase client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Buscar dados do pedido
    console.log('[SEND-PAYMENT-CONFIRMATION] Buscando pedido...');
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .select(`
        *,
        plans:plan_id(name, price, pix_price, stripe_price, description, features)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[SEND-PAYMENT-CONFIRMATION] Erro ao buscar pedido:', orderError);
      throw new Error('Pedido não encontrado');
    }
    console.log('[SEND-PAYMENT-CONFIRMATION] Pedido encontrado:', order.id);

    // Verificar se pagamento está confirmado
    if (order.status !== 'paid') {
      console.error('[SEND-PAYMENT-CONFIRMATION] Pagamento não confirmado, status:', order.status);
      throw new Error('Pagamento ainda não foi confirmado');
    }
    console.log('[SEND-PAYMENT-CONFIRMATION] Status do pagamento: PAID');

    // Extrair dados do cliente
    const customerData = order.payment_data?.customerData;
    if (!customerData?.email || !customerData?.name) {
      console.error('[SEND-PAYMENT-CONFIRMATION] Dados do cliente incompletos:', customerData);
      throw new Error('Dados do cliente incompletos');
    }
    console.log('[SEND-PAYMENT-CONFIRMATION] Dados do cliente OK:', customerData.email);

    const planName = order.plans?.name || 'Plano';
    const planPrice = order.amount || order.plans?.price || 0;
    const gateway = order.gateway || 'N/A';
    const paymentMethod = order.payment_method || (gateway === 'ABACATEPAY' ? 'PIX' : 'Cartão de Crédito');
    const planFeatures = order.plans?.features || [];
    const orderDate = new Date(order.paid_at || order.created_at).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    console.log('[SEND-PAYMENT-CONFIRMATION] Enviando email para cliente:', customerData.email);

    // Email para o cliente com template profissional
    const customerEmailResponse = await resend.emails.send({
      from: "Habify <contato@habify.com.br>",
      to: [customerData.email],
      subject: `✅ Pagamento Confirmado - ${planName} | Habify`,
      html: createEmailTemplate({
        customerName: customerData.name,
        planName,
        planPrice,
        paymentMethod,
        orderDate,
        orderId: order.id,
        planFeatures
      }),
    });

    if (customerEmailResponse.error) {
      console.error('[SEND-PAYMENT-CONFIRMATION] Erro ao enviar email do cliente:', customerEmailResponse.error);
      throw new Error(`Falha ao enviar email do cliente: ${customerEmailResponse.error.message}`);
    }
    
    console.log('[SEND-PAYMENT-CONFIRMATION] Email do cliente enviado com sucesso:', customerEmailResponse.data?.id);

    // Email para o admin
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@habify.com";
    console.log('[SEND-PAYMENT-CONFIRMATION] Enviando email para admin:', adminEmail);
    
    const adminEmailResponse = await resend.emails.send({
      from: "Habify Sistema <contato@habify.com.br>",
      to: [adminEmail],
      subject: `💰 Nova Venda - ${planName} - ${customerData.name}`,
      html: createAdminEmailTemplate({
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        customerCpf: customerData.cpf,
        planName,
        planPrice,
        gateway,
        paymentMethod,
        orderDate,
        orderId: order.id
      }),
    });

    if (adminEmailResponse.error) {
      console.error('[SEND-PAYMENT-CONFIRMATION] Erro ao enviar email do admin:', adminEmailResponse.error);
      // Não falha aqui, pois o email do cliente já foi enviado
    } else {
      console.log('[SEND-PAYMENT-CONFIRMATION] Email do admin enviado com sucesso:', adminEmailResponse.data?.id);
    }

    console.log('[SEND-PAYMENT-CONFIRMATION] Emails enviados com sucesso!');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        customerEmailId: customerEmailResponse.data?.id,
        adminEmailId: adminEmailResponse.data?.id,
        message: 'Emails enviados com sucesso'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[SEND-PAYMENT-CONFIRMATION] ERRO:", error);
    console.error("[SEND-PAYMENT-CONFIRMATION] Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro ao enviar emails de confirmação',
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
