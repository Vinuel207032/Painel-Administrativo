
import { createClient } from '@supabase/supabase-js';

// NOVAS CREDENCIAIS DO PROJETO
const SUPABASE_URL = 'https://ybmqahybzujfevllcsdq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Z2eXe4rE9DhDCPDmJVfU4w_T1rTuVrw';

// Verifica se as chaves foram configuradas
export const isSupabaseConfigured = () => {
  return SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// TIPAGEM ATUALIZADA (Baseada no CSV do Banco)
export type UserRole = 'MASTER' | 'ADMIN' | 'LOJISTA' | 'CLIENTE';

export interface UserProfile {
  id: number;          // bigint
  uuid: string;        // uuid
  nome: string;        // varchar
  cpf: string;         // varchar
  email: string;       // varchar
  senha_hash: string;  // varchar
  tipo_usuario: UserRole; // enum/user-defined
  status: string;      // enum/user-defined (ATIVO/INATIVO/SUSPENSO)
  telefone?: string;
  avatar_id?: number;
  plano_atual?: string;
}
