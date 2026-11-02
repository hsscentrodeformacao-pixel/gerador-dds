import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { usuarioAtual } from "@/lib/supabase/server";
import { gerarConteudoDds } from "@/lib/dds/gerar";
import type { ImagemDds } from "@/lib/dds/tipos";

export const maxDuration = 300;

const Pedido = z.object({
  tema: z.string().min(3).max(300),
  publico: z.string().min(2).max(100),
  setor: z.string().max(120).optional(),
  local: z.string().max(120).optional(),
  responsavel: z.string().max(120).optional(),
  data_realizacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nrs: z.array(z.number().int().min(1).max(40)).max(10).optional(),
  observacoes: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const sessao = await usuarioAtual();
  if (!sessao) return NextResponse.json({ erro: "Faça login." }, { status: 401 });

  const corpo = Pedido.safeParse(await req.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  const p = corpo.data;

  try {
    const conteudo = await gerarConteudoDds(sessao.supabase, p);
    const imagens: ImagemDds[] = conteudo.imagens.slice(0, 4).map((i) => ({ ...i, url: null, origem: null }));

    const { data, error } = await sessao.supabase
      .from("dds")
      .insert({
        empresa_id: sessao.perfil.empresa_id,
        criado_por: sessao.user.id,
        tema: p.tema,
        publico: p.publico,
        setor: p.setor || null,
        local: p.local || null,
        responsavel: p.responsavel || sessao.perfil.nome,
        data_realizacao: p.data_realizacao || null,
        conteudo,
        imagens,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Erro ao gerar o DDS.";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
