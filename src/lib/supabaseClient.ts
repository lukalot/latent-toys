import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://udjwletvgizdyocnpwhb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkandsZXR2Z2l6ZHlvY25wd2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2OTkyNDUsImV4cCI6MjA0NjI3NTI0NX0.v749nLs-x9P_gMLzkshUPyxdN_SxpSiihmMAXRCVPMk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Since we're using anonymous sessions
  }
});

// Add a health check function
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('rooms').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
};

// After creating the supabase client
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Generate new anonymous ID when signed out
    const anonymousId = crypto.randomUUID();
    supabase.rpc('set_claim', { claim: 'app.current_user', value: anonymousId });
  }
});

// Before making any requests that need the sender_id
export const setCurrentUser = async (anonymousId: string) => {
  await supabase.rpc('set_claim', { claim: 'app.current_user', value: anonymousId });
}; 