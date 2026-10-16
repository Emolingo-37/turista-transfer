
import { createClient } from "@supabase/supabase-js";

const url = "https://ewrmphldbgvatcnfcxiw.supabase.co";

const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cm1waGxkYmd2YXRjbmZjeGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODMwNjksImV4cCI6MjEwNzY1OTA2OX0.wSO5t_aUtfk2_fDHGgsLJiEzHLkaKnrf0e1CB8_ud5U";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "sb-ewrmphldbgvatcnfcxiw-auth-token",
  },
});
