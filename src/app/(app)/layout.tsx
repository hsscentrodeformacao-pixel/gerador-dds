import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/supabase/server";
import { sair } from "../acoes";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sessao = await usuarioAtual();
  if (!sessao) redirect("/login");
  const { data: empresa } = await sessao.supabase.from("empresas").select("nome").eq("id", sessao.perfil.empresa_id).single();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/painel" className="font-bold text-blue-800">Gerador de DDS</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/novo" className="hover:underline">Novo DDS</Link>
            <Link href="/painel" className="hover:underline">Histórico</Link>
            <Link href="/empresa" className="hover:underline">Empresa</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
            <span>{sessao.perfil.nome} · {empresa?.nome}</span>
            <form action={sair}><button className="underline">Sair</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
