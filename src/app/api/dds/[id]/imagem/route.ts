import { NextResponse } from "next/server";
import { supabaseAdmin, usuarioAtual } from "@/lib/supabase/server";
import { buscarNoBanco, gerarComIa, registrarNoBanco, salvarArquivo } from "@/lib/dds/imagens";
import type { ImagemDds } from "@/lib/dds/tipos";

export const maxDuration = 120;

const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];

/**
 * Define a imagem de uma posição do DDS.
 * JSON { indice, acao: "auto" | "gerar" }: "auto" tenta o banco e depois a IA; "gerar" vai direto à IA.
 * multipart { indice, arquivo }: envia uma foto própria.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await usuarioAtual();
  if (!sessao) return NextResponse.json({ erro: "Faça login." }, { status: 401 });

  const { data: dds } = await sessao.supabase.from("dds").select("id, empresa_id, imagens").eq("id", id).single();
  if (!dds) return NextResponse.json({ erro: "DDS não encontrado." }, { status: 404 });
  const imagens = dds.imagens as ImagemDds[];
  const admin = supabaseAdmin();
  const pasta = `${dds.empresa_id}/dds/${dds.id}`;

  let indice: number;
  let url: string | null = null;
  let origem: ImagemDds["origem"] = null;

  try {
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      indice = Number(form.get("indice"));
      const arquivo = form.get("arquivo");
      if (!(arquivo instanceof File) || !TIPOS_ACEITOS.includes(arquivo.type)) {
        return NextResponse.json({ erro: "Envie uma imagem PNG, JPG ou WEBP." }, { status: 400 });
      }
      if (arquivo.size > 5 * 1024 * 1024) {
        return NextResponse.json({ erro: "A imagem deve ter até 5 MB." }, { status: 400 });
      }
      const ext = arquivo.type.split("/")[1];
      url = await salvarArquivo(admin, `${pasta}/${indice}-${Date.now()}.${ext}`, arquivo, arquivo.type);
      origem = "upload";
    } else {
      const corpo = (await req.json().catch(() => ({}))) as { indice?: number; acao?: string };
      indice = Number(corpo.indice);
      const imagem = imagens[indice];
      if (!imagem) return NextResponse.json({ erro: "Posição de imagem inválida." }, { status: 400 });

      if (corpo.acao !== "gerar") {
        url = await buscarNoBanco(sessao.supabase, imagem);
        if (url) origem = "banco";
      }
      if (!url) {
        const png = await gerarComIa(imagem);
        if (png) {
          url = await salvarArquivo(admin, `${pasta}/${indice}-${Date.now()}.png`, png, "image/png");
          origem = "ia";
          await registrarNoBanco(admin, imagem, url);
        }
      }
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: e instanceof Error ? e.message : "Erro na imagem." }, { status: 500 });
  }

  if (!imagens[indice]) return NextResponse.json({ erro: "Posição de imagem inválida." }, { status: 400 });
  if (!url) {
    return NextResponse.json({ url: null, aviso: "Nenhuma imagem no banco e a IA de imagem está desligada." });
  }
  imagens[indice] = { ...imagens[indice], url, origem };
  const { error } = await sessao.supabase.from("dds").update({ imagens }).eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ url, origem });
}
