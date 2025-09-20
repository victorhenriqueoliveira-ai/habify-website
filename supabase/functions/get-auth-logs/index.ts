import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Mock auth logs data structure
    const mockData = [
      {
        id: 'auth-log-1',
        timestamp: Date.now() * 1000, // microseconds
        event_message: JSON.stringify({
          action: 'login',
          level: 'info',
          msg: 'User login successful',
          user_id: 'sample-user-id'
        }),
        level: 'info',
        msg: 'Login successful'
      }
    ];

    return new Response(JSON.stringify(mockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});