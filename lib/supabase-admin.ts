import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://zzqeibxwasikdmdoijfb.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cWVpYnh3YXNpa2RtZG9pamZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTQwMTAsImV4cCI6MjA4NzU3MDAxMH0.guvKAPuNIw8Ln5m-r6i99eGu2tOjuHvNArYfh9Q2Prk";

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
