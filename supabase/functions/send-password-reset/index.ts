import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
