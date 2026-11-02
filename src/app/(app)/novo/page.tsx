import { usuarioAtual } from "@/lib/supabase/server";
import { NovoDds } from "./NovoDds";

export default async function Novo() {
  const sessao = (await usuarioAtual())!;
  return <NovoDds responsavelPadrao={sessao.perfil.nome} />;
}
