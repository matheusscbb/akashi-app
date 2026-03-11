import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the current user's `public.users.id` (different from `auth.uid()`).
 * Must be used in all INSERT mutations so the RLS `WITH CHECK` policy passes.
 */
export async function getMyUserId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .single();

  if (error || !data) throw new Error("Perfil de usuário não encontrado. Tente fazer login novamente.");
  return data.id as string;
}
