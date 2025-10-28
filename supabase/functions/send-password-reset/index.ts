import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ResetPasswordRequest {
  email: string;
  redirectUrl: string;
}

const createEmailTemplate = (userName: string, resetLink: string): string => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - Habify</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header com gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <img src="https://jsttoajuszshrivmgnmc.supabase.co/storage/v1/object/public/project-photos/logotipo_habify.png" alt="Habify" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🔐 Redefinir Senha
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 10px 0 0 0;">
                Solicitação de nova senha
              </p>
            </td>
          </tr>
          
          <!-- Corpo principal -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Saudação -->
              <p style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                Olá, ${userName}! 👋
              </p>
              <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                Recebemos uma solicitação para redefinir a senha da sua conta Habify.
              </p>
              
              <!-- Alerta de segurança -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                      <strong>⚠️ Importante:</strong><br>
                      Este link é válido por <strong>1 hora</strong> e pode ser usado apenas uma vez.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Botão de ação -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Redefinir Minha Senha →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Link alternativo -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
                      Se o botão não funcionar, copie e cole este link no seu navegador:
                    </p>
                    <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 0; font-family: monospace;">
                      ${resetLink}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Aviso de segurança -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <p style="color: #991b1b; font-size: 14px; line-height: 1.6; margin: 0;">
                      <strong>🛡️ Não solicitou esta alteração?</strong><br>
                      Se você não pediu para redefinir sua senha, ignore este email. Sua senha permanecerá inalterada.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Suporte -->
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                Em caso de dúvidas, entre em contato conosco através do email 
                <a href="mailto:suporte@habify.com" style="color: #667eea; text-decoration: underline;">suporte@habify.com</a>
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SEND-PASSWORD-RESET] Function invoked');
    
    const { email, redirectUrl }: ResetPasswordRequest = await req.json();
    console.log('[SEND-PASSWORD-RESET] Email:', email);

    if (!email || !redirectUrl) {
      throw new Error("Email e redirectUrl são obrigatórios");
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Email inválido");
    }
    console.log('[SEND-PASSWORD-RESET] Email válido');

    // Verificar se RESEND_API_KEY está configurada
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error('[SEND-PASSWORD-RESET] RESEND_API_KEY não configurada');
      throw new Error('RESEND_API_KEY não está configurada');
    }
    console.log('[SEND-PASSWORD-RESET] RESEND_API_KEY verificada');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verificar se o usuário existe
    console.log('[SEND-PASSWORD-RESET] Verificando se usuário existe...');
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("name, user_id")
      .eq("email", email)
      .single();

    if (profileError || !profileData) {
      console.log('[SEND-PASSWORD-RESET] Usuário não encontrado');
      // Por segurança, não informar que o usuário não existe
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Se o email existir, você receberá instruções para redefinir sua senha"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log('[SEND-PASSWORD-RESET] Usuário encontrado:', profileData.name);

    // Gerar link de recuperação de senha
    console.log('[SEND-PASSWORD-RESET] Gerando link de recuperação...');
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (resetError || !resetData) {
      console.error('[SEND-PASSWORD-RESET] Erro ao gerar link:', resetError);
      throw new Error("Erro ao gerar link de recuperação");
    }
    console.log('[SEND-PASSWORD-RESET] Link gerado com sucesso');

    const resetLink = resetData.properties?.action_link || '';
    if (!resetLink) {
      throw new Error("Link de recuperação não foi gerado");
    }

    // Enviar email
    console.log('[SEND-PASSWORD-RESET] Enviando email...');
    const emailResponse = await resend.emails.send({
      from: "Habify Segurança <onboarding@resend.dev>",
      to: [email],
      subject: "🔐 Redefinir Senha - Habify",
      html: createEmailTemplate(profileData.name, resetLink),
    });

    if (emailResponse.error) {
      console.error('[SEND-PASSWORD-RESET] Erro ao enviar email:', emailResponse.error);
      throw new Error(`Falha ao enviar email: ${emailResponse.error.message}`);
    }

    console.log('[SEND-PASSWORD-RESET] Email enviado com sucesso:', emailResponse.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de redefinição enviado com sucesso",
        emailId: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[SEND-PASSWORD-RESET] ERRO:", error);
    console.error("[SEND-PASSWORD-RESET] Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao processar solicitação",
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  redirectUrl: string;
}

const createEmailTemplate = (resetLink: string, userName: string) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - Habify</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, hsl(24, 95%, 53%) 0%, hsl(24, 95%, 63%) 100%); padding: 40px 30px; text-align: center; }
    .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
    .header-title { color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
    .text { font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 20px; }
    .button-container { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, hsl(24, 95%, 53%) 0%, hsl(24, 95%, 48%) 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3); transition: all 0.3s ease; }
    .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4); }
    .divider { height: 1px; background-color: #e5e7eb; margin: 30px 0; }
    .alternative-text { font-size: 13px; color: #6b7280; margin-top: 25px; line-height: 1.5; }
    .link { color: hsl(24, 95%, 53%); word-break: break-all; text-decoration: none; }
    .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px; }
    .security-title { font-weight: 600; color: #92400e; margin-bottom: 8px; font-size: 14px; }
    .security-text { font-size: 13px; color: #78350f; line-height: 1.5; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer-text { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 15px; }
    .footer-links { margin-top: 15px; }
    .footer-link { color: hsl(24, 95%, 53%); text-decoration: none; margin: 0 10px; font-size: 13px; }
    @media only screen and (max-width: 600px) {
      .content { padding: 30px 20px; }
      .header { padding: 30px 20px; }
      .header-title { font-size: 24px; }
      .button { padding: 14px 30px; font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://jsttoajuszshrivmgnmc.supabase.co/storage/v1/object/public/project-photos/logotipo_habify.png" alt="Habify" class="logo">
      <h1 class="header-title">Redefinir Senha</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Olá${userName ? ', ' + userName : ''}!</p>
      
      <p class="text">
        Recebemos uma solicitação para redefinir a senha da sua conta Habify. 
        Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:
      </p>
      
      <div class="button-container">
        <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
      </div>
      
      <div class="security-notice">
        <div class="security-title">⏱️ Atenção</div>
        <div class="security-text">
          Este link é válido por <strong>1 hora</strong> e só pode ser usado uma vez. 
          Após redefinir sua senha, este link será invalidado automaticamente.
        </div>
      </div>
      
      <div class="divider"></div>
      
      <p class="alternative-text">
        Se o botão não funcionar, copie e cole este link no seu navegador:<br>
        <a href="${resetLink}" class="link">${resetLink}</a>
      </p>
      
      <div class="divider"></div>
      
      <p class="text" style="font-size: 14px; color: #6b7280;">
        <strong>Não solicitou esta alteração?</strong><br>
        Se você não solicitou a redefinição de senha, ignore este email. 
        Sua senha permanecerá inalterada e sua conta está segura.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        <strong>Habify</strong><br>
        Transformando visões em realidade digital
      </p>
      <div class="footer-links">
        <a href="#" class="footer-link">Suporte</a>
        <span style="color: #d1d5db;">|</span>
        <a href="#" class="footer-link">Central de Ajuda</a>
        <span style="color: #d1d5db;">|</span>
        <a href="#" class="footer-link">Política de Privacidade</a>
      </div>
      <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
        © ${new Date().getFullYear()} Habify. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: ResetPasswordRequest = await req.json();

    console.log("Password reset requested for:", email);

    // Validate email
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("name, user_id")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      console.log("User not found:", email);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Se o email existir, você receberá as instruções" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (resetError || !resetData) {
      console.error("Error generating reset link:", resetError);
      throw new Error("Erro ao gerar link de recuperação");
    }

    const resetLink = resetData.properties?.action_link;
    
    if (!resetLink) {
      throw new Error("Link de recuperação não gerado");
    }

    console.log("Reset link generated for:", email);

    // Send email with Resend
    const emailHtml = createEmailTemplate(resetLink, userData.name);

    const emailResponse = await resend.emails.send({
      from: "Habify <onboarding@resend.dev>",
      to: [email],
      subject: "🔐 Redefinir Senha - Habify",
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de recuperação enviado com sucesso" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar email de recuperação" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
