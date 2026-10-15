import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fzobhmgfmqrfqvoxzalx.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6b2JobWdmbXFyZnF2b3h6YWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODA2NjIsImV4cCI6MjEwNzY1NjY2Mn0.4pAtaRBjAB1Xre5yEaeAE7FY6GD02zzBZTj_u_3nF3w";

export const supabase = createClient(url, key);
