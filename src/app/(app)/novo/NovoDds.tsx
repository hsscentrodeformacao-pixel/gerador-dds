"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATALOGO, PUBLICOS } from "@/lib/dds/catalogo";

const hoje = () => new Date().toLocaleDateString("sv-SE");

export function NovoDds({ responsavelPadrao }: { responsavelPadrao: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<"livre" | "catalogo">("catalogo");
  const [tema, setTema] = useState("");
  const [nrs, setNrs] = useState<number[]>([]);
  const [publico, setPublico] = useState(PUBLICOS[0]);
  const [setor, setSetor] = useState("");
  const [local, setLocal] = useState("");
  const [responsavel, setResponsavel] = useState(responsavelPadrao);
  const [data, setData] = useState(hoje());
  const [observacoes, setObservacoes] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar(e: React.FormEvent) {
    e.preventDefault();
    setGerando(true);
    setErro(null);
    try {
      const r = await fetch("/api/dds/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tema,
          publico,
          setor: setor || undefined,
          local: local || undefined,
          responsavel: responsavel || undefined,
          data_realizacao: data || undefined,
          nrs: nrs.length ? nrs : undefined,
          observacoes: observacoes || undefined,
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.erro || "Erro ao gerar.");
      router.push(`/dds/${json.id}?novo=1`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar.");
      setGerando(false);
    }
  }

  return (
    <form onSubmit={gerar} className="space-y-5">
      <h1 className="text-2xl font-bold">Novo DDS</h1>

      <section className="cartao space-y-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setModo("catalogo")} className={modo === "catalogo" ? "botao" : "botao-sec"}>
            Escolher no catálogo
          </button>
          <button type="button" onClick={() => setModo("livre")} className={modo === "livre" ? "botao" : "botao-sec"}>
            Digitar o tema
          </button>
        </div>

        {modo === "catalogo" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {CATALOGO.map((cat) => (
              <div key={cat.categoria}>
                <p className="mb-1 text-sm font-semibold text-slate-700">{cat.categoria}</p>
                <ul className="space-y-1">
                  {cat.temas.map((t) => (
                    <li key={t.tema}>
                      <button
                        type="button"
                        onClick={() => {
                          setTema(t.tema);
                          setNrs(t.nrs);
                        }}
                        className={`w-full rounded px-2 py-1 text-left text-sm ${
                          tema === t.tema ? "bg-blue-800 text-white" : "hover:bg-slate-100"
                        }`}
                      >
                        {t.tema}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        <div>
          <label className="rotulo" htmlFor="tema">Tema do DDS</label>
          <input
            id="tema"
            className="campo"
            required
            minLength={3}
            value={tema}
            onChange={(e) => {
              setTema(e.target.value);
              if (modo === "livre") setNrs([]);
            }}
            placeholder="Ex.: trabalho em altura na troca de telhas do galpão"
          />
          {nrs.length ? <p className="mt-1 text-xs text-slate-500">NRs de referência: {nrs.map((n) => `NR-${n}`).join(", ")}</p> : null}
        </div>
      </section>

      <section className="cartao grid gap-4 sm:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="publico">Público</label>
          <select id="publico" className="campo" value={publico} onChange={(e) => setPublico(e.target.value)}>
            {PUBLICOS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="data">Data</label>
          <input id="data" type="date" className="campo" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div>
          <label className="rotulo" htmlFor="setor">Setor</label>
          <input id="setor" className="campo" value={setor} onChange={(e) => setSetor(e.target.value)} placeholder="Ex.: Manutenção" />
        </div>
        <div>
          <label className="rotulo" htmlFor="local">Local</label>
          <input id="local" className="campo" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Galpão 2" />
        </div>
        <div>
          <label className="rotulo" htmlFor="responsavel">Responsável</label>
          <input id="responsavel" className="campo" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="rotulo" htmlFor="obs">Observações para a IA (opcional)</label>
          <textarea
            id="obs"
            className="campo"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex.: houve um quase acidente semana passada com escada; equipe nova"
          />
        </div>
      </section>

      {erro ? <p className="text-sm text-red-700">{erro}</p> : null}
      <button className="botao" disabled={gerando || tema.trim().length < 3}>
        {gerando ? "Escrevendo o DDS... (cerca de 1 minuto)" : "Gerar DDS"}
      </button>
    </form>
  );
}
