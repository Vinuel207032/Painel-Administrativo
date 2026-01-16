import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DO SUPABASE
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://kxufpnxhpdhndaizygqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dWZwbnhocGRobmRhaXp5Z3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjQyNDAsImV4cCI6MjA4MDcwMDI0MH0.9zA1BzHslK_mu7rZj7hq1X_nRyf_BHcg3ATA_98fD9k';

// Verifica se as chaves foram configuradas para evitar erros silenciosos
export const isSupabaseConfigured = () => {
  return SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;
};

// Cria o cliente apenas se houver configuração, senão cria um null para ser tratado na App
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
