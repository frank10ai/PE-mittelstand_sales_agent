import { createClient } from "@supabase/supabase-js";

let _supabase;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase URL und Anon Key müssen als Environment Variables gesetzt sein");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}
