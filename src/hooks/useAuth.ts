import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured, type UserProfile, type UserPlan, PLAN_LIMITS } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  plan: UserPlan;
  searchesLeft: number;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  decrementSearch: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ── localStorage fallback (demo mode — no Supabase configured) ────────────────
const LS_KEY = "sl_searches_left";
const LS_RESET_KEY = "sl_searches_reset";

function getLocalSearchesLeft(): number {
  try {
    const resetAt = localStorage.getItem(LS_RESET_KEY);
    const now = new Date().toDateString();
    if (resetAt !== now) {
      localStorage.setItem(LS_SEARCHES_LEFT_VALUE, "3");
      localStorage.setItem(LS_RESET_KEY, now);
      return 3;
    }
    const v = localStorage.getItem(LS_KEY);
    return v !== null ? Math.max(0, parseInt(v, 10)) : 3;
  } catch {
    return 3;
  }
}

// Exported so Index.tsx can use it without Supabase
export function getLocalSearchesLeftPublic(): number {
  try {
    const resetAt = localStorage.getItem(LS_RESET_KEY);
    const now = new Date().toDateString();
    if (resetAt !== now) {
      localStorage.setItem(LS_KEY, "3");
      localStorage.setItem(LS_RESET_KEY, now);
      return 3;
    }
    const v = localStorage.getItem(LS_KEY);
    return v !== null ? Math.max(0, parseInt(v, 10)) : 3;
  } catch {
    return 3;
  }
}

// Ugly but needed — LS_SEARCHES_LEFT_VALUE is the same as LS_KEY
const LS_SEARCHES_LEFT_VALUE = LS_KEY;

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, email, plan, searches_today, searches_reset_at")
    .eq("id", userId)
    .single();
  return data as UserProfile | null;
}

function profileToAuthUser(profile: UserProfile): AuthUser {
  const limit = PLAN_LIMITS[profile.plan] ?? 3;
  const resetDate = new Date(profile.searches_reset_at).toDateString();
  const today = new Date().toDateString();
  const searchesUsed = resetDate === today ? profile.searches_today : 0;
  return {
    id: profile.id,
    email: profile.email,
    plan: profile.plan,
    searchesLeft: Math.max(0, limit - searchesUsed),
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadUser = useCallback(async (userId: string, email: string) => {
    if (!supabase) return;
    const profile = await fetchProfile(userId);
    if (profile) {
      setUser(profileToAuthUser(profile));
    } else {
      // Create profile row on first login
      await supabase.from("profiles").upsert({
        id: userId,
        email,
        plan: "free",
        searches_today: 0,
        searches_reset_at: new Date().toISOString(),
      });
      setUser({ id: userId, email, plan: "free", searchesLeft: 3 });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!supabase) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) await loadUser(authUser.id, authUser.email ?? "");
  }, [loadUser]);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email ?? "").finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email ?? "");
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Supabase não configurado";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Supabase não configurado";
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const decrementSearch = useCallback(async () => {
    if (!supabase || !user) {
      // localStorage fallback
      try {
        const next = Math.max(0, getLocalSearchesLeft() - 1);
        localStorage.setItem(LS_KEY, String(next));
        localStorage.setItem(LS_RESET_KEY, new Date().toDateString());
      } catch {}
      return;
    }
    // Server-side decrement
    const today = new Date().toDateString();
    const resetDate = new Date(
      (await fetchProfile(user.id))?.searches_reset_at ?? new Date()
    ).toDateString();

    const newCount = resetDate === today
      ? ((await fetchProfile(user.id))?.searches_today ?? 0) + 1
      : 1;

    await supabase.from("profiles").update({
      searches_today: newCount,
      searches_reset_at: resetDate === today
        ? undefined
        : new Date().toISOString(),
    }).eq("id", user.id);

    setUser((prev) =>
      prev ? { ...prev, searchesLeft: Math.max(0, prev.searchesLeft - 1) } : prev
    );
  }, [user]);

  return { user, loading, signIn, signUp, signOut, decrementSearch, refreshUser };
}
