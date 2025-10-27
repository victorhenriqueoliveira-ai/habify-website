import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Health Check Endpoint
 * Verifica o status do sistema e dependências
 * Fase 2 - Item 11: Monitoramento e Health Checks
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const checks: Record<string, any> = {};

    // 1. Check Database Connection
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      checks.database = {
        status: dbError ? 'unhealthy' : 'healthy',
        error: dbError?.message,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error.message,
      };
    }

    // 2. Check Environment Variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
    ];

    checks.environment = {
      status: requiredEnvVars.every(v => Deno.env.get(v)) ? 'healthy' : 'unhealthy',
      missing: requiredEnvVars.filter(v => !Deno.env.get(v)),
    };

    // 3. Overall System Status
    const allHealthy = Object.values(checks).every(
      check => check.status === 'healthy'
    );

    const response = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      checks,
      version: '1.0.0',
    };

    console.log('Health check completed:', response);

    return new Response(
      JSON.stringify(response),
      {
        status: allHealthy ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
