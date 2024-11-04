import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://udjwletvgizdyocnpwhb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkandsZXR2Z2l6ZHlvY25wd2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2OTkyNDUsImV4cCI6MjA0NjI3NTI0NX0.v749nLs-x9P_gMLzkshUPyxdN_SxpSiihmMAXRCVPMk'
); 