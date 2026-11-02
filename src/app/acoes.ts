"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin, supabaseServidor, usuarioAtual } from "@/lib/supabase/server";
import { salvarArquivo } from "@/lib/dds/imagens";

export type Estado = { erro?: string; ok?: string } | undefined;

export async function entrar(_: Estado, form: FormData): Promise<Estado> {
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("senha") ?? ""),
  });
  if (error) return { erro: "E-mail ou senha incorretos." };
  redirect("/painel");
}

export async function cadastrar(_: Estado, form: FormData): Promise<Estado> {
  const nome = String(form.get("nome") ?? "").trim();
  const empresa = String(form.get("empresa") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const senha = String(form.get("senha") ?? "");
  if (!nome || !empresa || !email || senha.length < 8) {
    return { erro: "Preencha todos os campos. A senha precisa de pelo menos 8 caracteres." };
  }

  const admin = supabaseAdmin();
  const { data: criado, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error || !criado.user) return { erro: error?.message.includes("already") ? "Este e-mail já tem conta." : "Não foi possível criar a conta." };

  const { data: emp, error: e1 } = await admin.from("empresas").insert({ nome: empresa }).select("id").single();
  if (e1 || !emp) {
    await admin.auth.admin.deleteUser(criado.user.id);
    return { erro: "Não foi possível criar a empresa." };
  }
  await admin.from("perfis").insert({ id: criado.user.id, empresa_id: emp.id, nome, papel: "admin" });

  const supabase = await supabaseServidor();
  await supabase.auth.signInWithPassword({ email, password: senha });
  redirect("/painel");
}

export async function sair() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect("/login");
}

async function exigirAdmin() {
  const sessao = await usuarioAtual();
  if (!sessao) redirect("/login");
  if (sessao.perfil.papel !== "admin") throw new Error("Apenas o administrador da empresa pode fazer isso.");
  return sessao;
}

export async function salvarEmpresa(_: Estado, form: FormData): Promise<Estado> {
  try {
    const { perfil } = await exigirAdmin();
    const admin = supabaseAdmin();
    const mudancas: Record<string, string | null> = {
      nome: String(form.get("nome") ?? "").trim(),
      cnpj: String(form.get("cnpj") ?? "").trim() || null,
    };
    const logo = form.get("logo");
    if (logo instanceof File && logo.size > 0) {
      if (!["image/png", "image/jpeg"].includes(logo.type)) return { erro: "O logo deve ser PNG ou JPG." };
      if (logo.size > 2 * 1024 * 1024) return { erro: "O logo deve ter até 2 MB." };
      const ext = logo.type === "image/png" ? "png" : "jpg";
      mudancas.logo_url = await salvarArquivo(admin, `${perfil.empresa_id}/logo-${Date.now()}.${ext}`, logo, logo.type);
    }
    const { error } = await admin.from("empresas").update(mudancas).eq("id", perfil.empresa_id);
    if (error) return { erro: error.message };
    return { ok: "Dados da empresa salvos." };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Erro ao salvar." };
  }
}

export async function adicionarTecnico(_: Estado, form: FormData): Promise<Estado> {
  try {
    const { perfil } = await exigirAdmin();
    const nome = String(form.get("nome") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const senha = String(form.get("senha") ?? "");
    if (!nome || !email || senha.length < 8) return { erro: "Preencha nome, e-mail e uma senha de 8+ caracteres." };

    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });
    if (error || !data.user) return { erro: "Não foi possível criar o usuário (o e-mail pode já estar em uso)." };
    await admin.from("perfis").insert({
      id: data.user.id,
      empresa_id: perfil.empresa_id,
      nome,
      cargo: String(form.get("cargo") ?? "").trim() || null,
      papel: "tecnico",
    });
    return { ok: `${nome} foi adicionado. Envie a senha inicial para a pessoa.` };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Erro ao adicionar." };
  }
}
