import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface MessageNotificationRequest {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
  projectTitle: string;
  projectId: string;
  isForAdmin?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientName, 
      recipientEmail, 
      senderName, 
      message,
      projectTitle,
      projectId,
      isForAdmin 
    }: MessageNotificationRequest = await req.json();

    console.log('[SEND-MESSAGE-NOTIFICATION] Sending notification to:', recipientEmail);

    const truncatedMessage = message.length > 150 ? message.substring(0, 150) + '...' : message;

    const emailResponse = await resend.emails.send({
      from: "Habify <contato@habify.com.br>",
      to: isForAdmin ? ["habifybr@gmail.com"] : [recipientEmail],
      subject: `💬 Nova mensagem de ${senderName} - ${projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; }
              .message-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #F97316; }
              .project-info { background: #fff7ed; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .button { background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💬 Nova Mensagem Recebida</h1>
              </div>
              <div class="content">
                <p>Olá, <strong>${recipientName}</strong>!</p>
                <p>Você recebeu uma nova mensagem de <strong>${senderName}</strong>:</p>

                <div class="project-info">
                  <strong>📋 Projeto:</strong> ${projectTitle}
                </div>

                <div class="message-box">
                  <p style="margin: 0; white-space: pre-wrap;">${truncatedMessage}</p>
                </div>

                <div style="text-align: center;">
                  <a href="https://habify.com.br/admin/projects/${projectId}?tab=chat" class="button">Ver Mensagem Completa</a>
                </div>

                <p style="background: #fff7ed; padding: 15px; border-radius: 5px; border-left: 4px solid #F97316; margin-top: 20px;">
                  💡 <strong>Dica:</strong> Responda rapidamente para manter uma boa comunicação com ${isForAdmin ? 'seu cliente' : 'nossa equipe'}!
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

    console.log('[SEND-MESSAGE-NOTIFICATION] Email sent:', emailResponse.data?.id);

    return new Response(JSON.stringify({ 
      success: true,
      email_id: emailResponse.data?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('[SEND-MESSAGE-NOTIFICATION] Error:', error);
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
