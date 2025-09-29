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
    const url = new URL(req.url);
    const logType = url.searchParams.get('type') || 'auth'; // auth, db, edge
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    let query = '';
    
    switch (logType) {
      case 'auth':
        query = `
          select id, auth_logs.timestamp, event_message, metadata.level, metadata.status, metadata.path, metadata.msg as msg, metadata.error 
          from auth_logs
          cross join unnest(metadata) as metadata
          order by timestamp desc
          limit ${limit}
        `;
        break;
      case 'db':
        query = `
          select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity 
          from postgres_logs
          cross join unnest(metadata) as m
          cross join unnest(m.parsed) as parsed
          order by timestamp desc
          limit ${limit}
        `;
        break;
      case 'edge':
        query = `
          select id, function_edge_logs.timestamp, event_message, response.status_code, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version 
          from function_edge_logs
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          order by timestamp desc
          limit ${limit}
        `;
        break;
      default:
        throw new Error('Invalid log type');
    }

    // Note: This is a simplified implementation
    // In a real scenario, you'd use the Supabase Analytics API
    // For now, return mock data structure
    const mockData = {
      data: [
        {
          id: 'mock-1',
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
      ]
    };

    return new Response(JSON.stringify(mockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching analytics logs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});