const { createClient } = require('@supabase/supabase-js');
let WebSocketImpl;
try {
  // Use ws in Node for Realtime websockets
  WebSocketImpl = require('ws');
} catch (_) {
  WebSocketImpl = undefined;
}
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLIC_ANON_KEY ||
  process.env.SUPABASE_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    'Missing SUPABASE_URL (or SUPABASE_PROJECT) environment variable. Set it to your project URL e.g. https://xyzcompany.supabase.co'
  );
}
if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing SUPABASE_ANON_KEY environment variable. Set it to your anon/public key from Supabase settings.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: WebSocketImpl ? { WebSocket: WebSocketImpl } : undefined,
});

module.exports = supabase;
