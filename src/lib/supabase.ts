import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!(url && key);

// null when env vars not set — app runs in demo/localStorage mode
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, key)
  : null;

export type UserPlan = "free" | "estudante" | "pesquisador";

export interface UserProfile {
  id: string;
  email: string;
  plan: UserPlan;
  searches_today: number;
  searches_reset_at: string;
}

/** Daily search limits per plan */
export const PLAN_LIMITS: Record<UserPlan, number> = {
  free: 3,
  estudante: 30,
  pesquisador: 999,
};
