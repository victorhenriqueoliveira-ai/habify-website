import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@3.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Type for status change notifications
interface StatusNotificationData {
  requestId: string;
  action: 'created' | 'updated' | 'completed';
}

// Type for chat message notifications
interface MessageNotificationData {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
  requestTitle: string;
  requestId: string;
  isForAdmin: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Check if this is a chat message notification or status change notification
    if (body.recipientEmail !== undefined) {
      // Chat message notification
      return await handleMessageNotification(body as MessageNotificationData);
    } else {
      // Status change notification
      return await handleStatusNotification(body as StatusNotificationData);
    }

  } catch (error) {
    console.error("[MAINTENANCE-NOTIFICATION] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Handle chat message notifications
async function handleMessageNotification(data: MessageNotificationData): Promise<Response> {
  const { recipientName, recipientEmail, senderName, message, requestTitle, requestId, isForAdmin } = data;

  console.log('[MAINTENANCE-NOTIFICATION] Sending message notification:', {
    to: isForAdmin ? 'habifybr@gmail.com' : recipientEmail,
    from: senderName,
    requestTitle,
    requestId
  });

  const truncatedMessage = message.length > 150 ? message.substring(0, 150) + '...' : message;
  const targetEmail = isForAdmin ? 'habifybr@gmail.com' : recipientEmail;

  const emailResponse = await resend.emails.send({
    from: "Habify <contato@habify.com.br>",
    to: [targetEmail],
    subject: `💬 Nova mensagem - ${requestTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; }
            .message-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #667eea; }
            .request-info { background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 Nova Mensagem de Manutenção</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${recipientName}</strong>!</p>
              <p>Você recebeu uma nova mensagem de <strong>${senderName}</strong>:</p>

              <div class="request-info">
                <strong>📋 Solicitação:</strong> ${requestTitle}
              </div>

              <div class="message-box">
                <p style="margin: 0; white-space: pre-wrap;">${truncatedMessage}</p>
              </div>

              <div style="text-align: center;">
                <a href="https://habify.com.br/admin/maintenance-requests?request=${requestId}" class="button">Ver Conversa Completa</a>
              </div>

              <p style="background: #f3f4f6; padding: 15px; border-radius: 5px; border-left: 4px solid #667eea; margin-top: 20px;">
                💡 <strong>Dica:</strong> Responda rapidamente para manter uma boa comunicação!
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Habify. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  console.log('[MAINTENANCE-NOTIFICATION] Email sent:', emailResponse.data?.id);

  return new Response(
    JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

// Handle status change notifications
async function handleStatusNotification(data: StatusNotificationData): Promise<Response> {
  const { requestId, action } = data;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Buscar dados da solicitação
  const { data: request, error: requestError } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      project:projects(title, landing_page_url),
      profile:profiles!maintenance_requests_user_id_fkey(name, email)
    `)
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    throw new Error('Solicitação não encontrada');
  }

  const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'habifybr@gmail.com';
  const customerEmail = request.profile?.email;
  const customerName = request.profile?.name;
  const projectTitle = request.project?.title;
  const projectUrl = request.project?.landing_page_url;

  const createdDate = new Date(request.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const statusLabels: Record<string, string> = {
    pending: '⏳ Pendente',
    in_progress: '🔄 Em Andamento',
    completed: '✅ Concluída',
    rejected: '❌ Rejeitada'
  };

  // Enviar email para cliente
  if (customerEmail) {
    let clientSubject = '';
    let clientTitle = '';
    let clientMessage = '';

    if (action === 'created') {
      clientSubject = `📝 Solicitação Criada - ${request.title}`;
      clientTitle = '📝 Solicitação Criada com Sucesso!';
      clientMessage = 'Sua solicitação de customização foi criada e está sendo analisada pela nossa equipe.';
    } else if (action === 'updated') {
      clientSubject = `🔄 Atualização na Solicitação - ${request.title}`;
      clientTitle = '🔄 Solicitação Atualizada';
      clientMessage = 'Sua solicitação de customização foi atualizada pela nossa equipe.';
    } else if (action === 'completed') {
      clientSubject = `✅ Solicitação Concluída - ${request.title}`;
      clientTitle = '✅ Solicitação Concluída!';
      clientMessage = 'Sua solicitação de customização foi concluída com sucesso!';
    }

    await resend.emails.send({
      from: "Habify <contato@habify.com.br>",
      to: [customerEmail],
      subject: clientSubject,
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
              border-radius: 4px;
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
            <h1>${clientTitle}</h1>
          </div>
          
          <div class="content">
            <p>Olá <strong>${customerName}</strong>,</p>
            
            <p>${clientMessage}</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">📋 Detalhes da Solicitação</h3>
              <p><strong>Título:</strong> ${request.title}</p>
              <p><strong>Projeto:</strong> ${projectTitle}</p>
              <p><strong>Status:</strong> ${statusLabels[request.status]}</p>
              <p><strong>Criada em:</strong> ${createdDate}</p>
              ${request.admin_notes ? `<p><strong>Observações:</strong> ${request.admin_notes}</p>` : ''}
            </div>
            
            <p style="text-align: center;">
              <a href="https://habify.com.br/admin/user-maintenances/${request.project_id}" class="button">
                Ver Detalhes da Solicitação
              </a>
            </p>
            
            <p>Se tiver alguma dúvida, responda este email ou entre em contato conosco.</p>
          </div>
          
          <div class="footer">
            <p>Habify - Soluções em Sites Imobiliários</p>
            <p>Este é um email automático, mas você pode responder se precisar de ajuda.</p>
          </div>
        </body>
        </html>
      `,
    });
  }

  // Enviar email para admin apenas quando criado
  if (action === 'created') {
    await resend.emails.send({
      from: "Habify Notificações <contato@habify.com.br>",
      to: [adminEmail],
      subject: `🔔 Nova Solicitação de Customização - ${request.title}`,
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
            <h1>🔔 Nova Solicitação de Customização</h1>
          </div>
          
          <div class="content">
            <div class="alert">
              <strong>⚠️ Ação Necessária:</strong> Nova solicitação de customização recebida.
            </div>
            
            <div class="info-section">
              <h3 style="margin-top: 0;">👤 Cliente</h3>
              <p><strong>Nome:</strong> ${customerName}</p>
              <p><strong>Email:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
            </div>
            
            <div class="info-section">
              <h3 style="margin-top: 0;">📋 Solicitação</h3>
              <p><strong>Título:</strong> ${request.title}</p>
              <p><strong>Projeto:</strong> ${projectTitle}</p>
              ${projectUrl ? `<p><strong>URL:</strong> <a href="${projectUrl}" target="_blank">${projectUrl}</a></p>` : ''}
              <p><strong>Descrição:</strong></p>
              <p style="white-space: pre-wrap;">${request.description}</p>
              <p><strong>Criada em:</strong> ${createdDate}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="https://habify.com.br/admin/maintenance-requests" class="button">
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
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}