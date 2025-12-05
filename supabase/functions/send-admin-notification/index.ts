import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@3.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface NotificationData {
  customerName: string;
  customerEmail: string;
  planName: string;
  planPrice: string;
  paymentMethod: string;
  gateway: string;
  assignedBy?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationData = await req.json();
    console.log('[SEND-ADMIN-NOTIFICATION] Request received:', data);

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Buscar todos os admins e devs para criar notificações no sistema
    const { data: admins, error: adminsError } = await supabaseService
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'dev']);

    if (adminsError) {
      console.error('[SEND-ADMIN-NOTIFICATION] Error fetching admin roles:', adminsError);
    }

    // Criar notificação no sistema para todos os admins
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_id,
        title: data.assignedBy 
          ? `Plano Atribuído: ${data.planName}`
          : `🎉 Novo Cliente: ${data.customerName}`,
        message: data.assignedBy
          ? `${data.assignedBy} atribuiu o plano "${data.planName}" para ${data.customerName} (${data.customerEmail})`
          : `${data.customerName} adquiriu o plano "${data.planName}" via ${data.paymentMethod} (${data.gateway}) por R$ ${data.planPrice}`,
        type: 'success'
      }));

      const { error: notifyError } = await supabaseService
        .from('notifications')
        .insert(notifications);

      if (notifyError) {
        console.error('[SEND-ADMIN-NOTIFICATION] Error creating notifications:', notifyError);
      } else {
        console.log('[SEND-ADMIN-NOTIFICATION] System notifications created for', admins.length, 'admins');
      }
    }

    // Enviar email para administração
    const isAssignment = !!data.assignedBy;
    const subject = isAssignment 
      ? `📋 Plano Atribuído - ${data.planName}`
      : `🎉 Nova Compra - ${data.customerName}`;

    const emailResponse = await resend.emails.send({
      from: "Habify <contato@habify.com.br>",
      to: ["habifybr@gmail.com"],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F97316; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .info-item { margin: 12px 0; display: flex; }
              .label { font-weight: bold; color: #F97316; min-width: 120px; }
              .value { color: #333; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
              .highlight { background: #fff7ed; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${isAssignment ? '📋 Plano Atribuído' : '🎉 Nova Compra!'}</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                  ${new Date().toLocaleDateString('pt-BR', { 
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div class="content">
                <div class="highlight">
                  <strong>${isAssignment ? '✅ Plano atribuído manualmente' : '💰 Novo cliente adquiriu um plano!'}</strong>
                </div>

                <div class="info-box">
                  <div class="info-item">
                    <span class="label">👤 Cliente:</span>
                    <span class="value">${data.customerName}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">📧 Email:</span>
                    <span class="value">${data.customerEmail}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">📦 Plano:</span>
                    <span class="value">${data.planName}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">💵 Valor:</span>
                    <span class="value">R$ ${data.planPrice}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">💳 Pagamento:</span>
                    <span class="value">${data.paymentMethod} (${data.gateway})</span>
                  </div>
                  ${isAssignment ? `
                  <div class="info-item">
                    <span class="label">👨‍💼 Atribuído por:</span>
                    <span class="value">${data.assignedBy}</span>
                  </div>
                  ` : ''}
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://habify.com.br/admin/users" style="background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Ver no Painel Admin
                  </a>
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

    console.log('[SEND-ADMIN-NOTIFICATION] Email sent:', emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        email_id: emailResponse.data?.id,
        message: 'Admin notification sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[SEND-ADMIN-NOTIFICATION] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
