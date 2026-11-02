import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { usuarioAtual } from "@/lib/supabase/server";
import { DdsPdf } from "@/lib/pdf/DdsPdf";
import type { Dds } from "@/lib/dds/tipos";

export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await usuarioAtual();
  if (!sessao) return NextResponse.json({ erro: "Faça login." }, { status: 401 });

  const { data: dds } = await sessao.supabase.from("dds").select("*").eq("id", id).single<Dds>();
  if (!dds) return NextResponse.json({ erro: "DDS não encontrado." }, { status: 404 });
  const { data: empresa } = await sessao.supabase
    .from("empresas")
    .select("nome, logo_url")
    .eq("id", dds.empresa_id)
    .single();

  const pdf = await renderToBuffer(
    <DdsPdf dds={dds} empresa={empresa?.nome ?? ""} logo={empresa?.logo_url ?? null} />,
  );
  const nome = `DDS-${dds.conteudo.titulo}`.replace(/[^\p{L}\p{N}-]+/gu, "-").slice(0, 80);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nome}.pdf"`,
    },
  });
}
