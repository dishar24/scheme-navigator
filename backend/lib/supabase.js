const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. ' +
    'Copy .env.example to .env and fill in your project credentials.'
  );
}

// Fall back to a placeholder URL so the server can still boot (and other
// routes/tests run) before real Supabase credentials are added — actual
// calls will fail with a clear network error until .env is filled in.
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

module.exports = supabase;
