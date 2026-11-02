import Link from "next/link";
import { usuarioAtual } from "@/lib/supabase/server";

export default async function Painel() {
  const sessao = (await usuarioAtual())!;
  const { data: lista } = await sessao.supabase
    .from("dds")
    .select("id, tema, conteudo->>titulo, setor, local, data_realizacao, criado_em, responsavel")
    .order("criado_em", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Histórico de DDS</h1>
        <Link href="/novo" className="botao">+ Novo DDS</Link>
      </div>
      {!lista?.length ? (
        <div className="cartao text-center text-slate-600">
          Nenhum DDS ainda. <Link href="/novo" className="font-medium text-blue-800 underline">Gere o primeiro</Link>.
        </div>
      ) : (
        <div className="cartao overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Título</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Setor / local</th>
                <th className="px-4 py-2">Responsável</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <Link href={`/dds/${d.id}`} className="font-medium text-blue-800 hover:underline">
                      {d.titulo || d.tema}
                    </Link>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {d.data_realizacao
                      ? d.data_realizacao.split("-").reverse().join("/")
                      : new Date(d.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">{[d.setor, d.local].filter(Boolean).join(" · ") || "-"}</td>
                  <td className="px-4 py-2">{d.responsavel || "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <a href={`/api/dds/${d.id}/pdf`} target="_blank" className="botao-sec py-1">PDF</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
