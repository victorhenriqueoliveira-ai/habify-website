import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log('Admin notification requested:', data);

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Buscar e-mail do admin
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    
    if (!adminEmail) {
      console.error('ADMIN_EMAIL not configured');
      return new Response(
        JSON.stringify({ error: 'Admin email not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Buscar todos os admins e devs
    const { data: admins, error: adminsError } = await supabaseService
      .from('profiles')
      .select('id, name, email')
      .in('role', ['admin', 'dev']);

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
    }

    // Criar notificação no sistema para todos os admins
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_id,
        title: data.assignedBy 
          ? `Plano Atribuído: ${data.planName}`
          : `Novo Cliente: ${data.customerName}`,
        message: data.assignedBy
          ? `${data.assignedBy} atribuiu o plano "${data.planName}" para ${data.customerName} (${data.customerEmail})`
          : `${data.customerName} adquiriu o plano "${data.planName}" via ${data.paymentMethod} (${data.gateway}) por R$ ${data.planPrice}`,
        type: 'info'
      }));

      await supabaseService
        .from('notifications')
        .insert(notifications);

      console.log('System notifications created for admins');
    }

    // TODO: Implementar envio de e-mail real quando o Resend for configurado
    // Por enquanto, apenas logamos
    console.log('Admin notification would be sent to:', adminEmail);
    console.log('Notification details:', {
      subject: data.assignedBy 
        ? `[HABIFY] Plano Atribuído - ${data.planName}`
        : `[HABIFY] Novo Cliente - ${data.customerName}`,
      customer: `${data.customerName} (${data.customerEmail})`,
      plan: data.planName,
      price: `R$ ${data.planPrice}`,
      paymentMethod: data.paymentMethod,
      gateway: data.gateway,
      assignedBy: data.assignedBy || 'Compra direta'
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Admin notification logged successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error sending admin notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
