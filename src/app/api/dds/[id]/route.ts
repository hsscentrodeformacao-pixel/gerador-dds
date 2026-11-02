import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { usuarioAtual } from "@/lib/supabase/server";
import { ConteudoDdsSchema } from "@/lib/dds/tipos";

const Atualizacao = z.object({
  conteudo: ConteudoDdsSchema.extend({ avisos: z.array(z.string()).optional() }).optional(),
  publico: z.string().max(100).nullable().optional(),
  setor: z.string().max(120).nullable().optional(),
  local: z.string().max(120).nullable().optional(),
  responsavel: z.string().max(120).nullable().optional(),
  data_realizacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  legendas: z.array(z.string().max(300)).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await usuarioAtual();
  if (!sessao) return NextResponse.json({ erro: "Faça login." }, { status: 401 });

  const corpo = Atualizacao.safeParse(await req.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  const { legendas, ...campos } = corpo.data;

  const mudancas: Record<string, unknown> = { ...campos, atualizado_em: new Date().toISOString() };
  if (legendas) {
    const { data: atual } = await sessao.supabase.from("dds").select("imagens").eq("id", id).single();
    if (!atual) return NextResponse.json({ erro: "DDS não encontrado." }, { status: 404 });
    mudancas.imagens = (atual.imagens as { legenda: string }[]).map((img, i) => ({
      ...img,
      legenda: legendas[i] ?? img.legenda,
    }));
  }

  const { error } = await sessao.supabase.from("dds").update(mudancas).eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await usuarioAtual();
  if (!sessao) return NextResponse.json({ erro: "Faça login." }, { status: 401 });
  const { error } = await sessao.supabase.from("dds").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
