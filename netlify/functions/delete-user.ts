import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase environment variables' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { userId } = JSON.parse(event.body || '{}');

  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'User ID is required' }) };
  }

  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ message: 'User deleted successfully' }) };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };
