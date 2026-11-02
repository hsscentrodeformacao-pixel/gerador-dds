import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/supabase/server";
import type { Dds } from "@/lib/dds/tipos";
import { EditorDds } from "./EditorDds";

export default async function PaginaDds({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = (await usuarioAtual())!;
  const { data: dds } = await sessao.supabase.from("dds").select("*").eq("id", id).single<Dds>();
  if (!dds) notFound();
  return <EditorDds inicial={dds} />;
}
