import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Cliente com a sessão do usuário (respeita as regras de acesso do banco). */
export async function supabaseServidor() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(lista) {
          try {
            lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado de um Server Component: o middleware renova a sessão.
          }
        },
      },
    },
  );
}

/** Cliente administrativo. Use só no servidor, depois de checar o usuário. */
export function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export type Perfil = {
  id: string;
  empresa_id: string;
  nome: string;
  cargo: string | null;
  papel: "admin" | "tecnico";
};

/** Usuário logado + perfil, ou null. */
export async function usuarioAtual() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, empresa_id, nome, cargo, papel")
    .eq("id", user.id)
    .single<Perfil>();
  if (!perfil) return null;
  return { supabase, user, perfil };
}
