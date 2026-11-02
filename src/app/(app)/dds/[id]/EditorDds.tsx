"use client";

/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TIPOS_PLACA, type Dds, type ImagemDds } from "@/lib/dds/tipos";

const linhas = (t: string) => t.split("\n").map((l) => l.trim()).filter(Boolean);
const NOME_TIPO: Record<ImagemDds["tipo"], string> = { capa: "Capa", risco: "Risco", certo: "Certo", errado: "Errado" };
const NOME_PLACA: Record<(typeof TIPOS_PLACA)[number], string> = {
  obrigatorio: "Obrigatório (azul)",
  proibido: "Proibido (vermelho)",
  alerta: "Alerta (amarelo)",
  emergencia: "Emergência (verde)",
};

function Texto({ rotulo, valor, onChange, linhasVisiveis = 3, ajuda }: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  linhasVisiveis?: number;
  ajuda?: string;
}) {
  return (
    <div>
      <label className="rotulo">{rotulo}</label>
      {linhasVisiveis === 1 ? (
        <input className="campo" value={valor} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <textarea className="campo" rows={linhasVisiveis} value={valor} onChange={(e) => onChange(e.target.value)} />
      )}
      {ajuda ? <p className="mt-1 text-xs text-slate-500">{ajuda}</p> : null}
    </div>
  );
}

export function EditorDds({ inicial }: { inicial: Dds }) {
  const router = useRouter();
  const [dds, setDds] = useState(inicial);
  const c = dds.conteudo;
  const [listas, setListas] = useState({
    riscos: c.riscos.join("\n"),
    medidas: c.medidas.join("\n"),
    perguntas: c.perguntas.join("\n"),
  });
  const [ocupadas, setOcupadas] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const preencheu = useRef(false);

  const setConteudo = (campo: keyof Dds["conteudo"], valor: unknown) =>
    setDds((d) => ({ ...d, conteudo: { ...d.conteudo, [campo]: valor } }));
  const setCampo = (campo: keyof Dds, valor: string) => setDds((d) => ({ ...d, [campo]: valor || null }));

  async function definirImagem(indice: number, corpo: { acao: "auto" | "gerar" } | File) {
    setOcupadas((o) => ({ ...o, [indice]: corpo instanceof File ? "Enviando..." : "Buscando imagem..." }));
    try {
      let r: Response;
      if (corpo instanceof File) {
        const form = new FormData();
        form.set("indice", String(indice));
        form.set("arquivo", corpo);
        r = await fetch(`/api/dds/${dds.id}/imagem`, { method: "POST", body: form });
      } else {
        r = await fetch(`/api/dds/${dds.id}/imagem`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ indice, ...corpo }),
        });
      }
      const json = await r.json();
      if (!r.ok) throw new Error(json.erro);
      if (json.url) {
        setDds((d) => ({
          ...d,
          imagens: d.imagens.map((img, i) => (i === indice ? { ...img, url: json.url, origem: json.origem } : img)),
        }));
      } else if (json.aviso) {
        setMsg(json.aviso);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro na imagem.");
    } finally {
      setOcupadas((o) => {
        const n = { ...o };
        delete n[indice];
        return n;
      });
    }
  }

  // Preenche automaticamente as imagens que ainda estão vazias, uma por vez.
  useEffect(() => {
    if (preencheu.current) return;
    preencheu.current = true;
    (async () => {
      for (let i = 0; i < inicial.imagens.length; i++) {
        if (!inicial.imagens[i].url) await definirImagem(i, { acao: "auto" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvar(abrirPdf = false) {
    setSalvando(true);
    setMsg(null);
    const conteudo = {
      ...dds.conteudo,
      riscos: linhas(listas.riscos),
      medidas: linhas(listas.medidas),
      perguntas: linhas(listas.perguntas),
    };
    const r = await fetch(`/api/dds/${dds.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conteudo,
        publico: dds.publico,
        setor: dds.setor,
        local: dds.local,
        responsavel: dds.responsavel,
        data_realizacao: dds.data_realizacao,
        legendas: dds.imagens.map((i) => i.legenda),
      }),
    });
    setSalvando(false);
    if (!r.ok) {
      setMsg((await r.json()).erro || "Erro ao salvar.");
      return;
    }
    setMsg("Salvo.");
    if (abrirPdf) window.open(`/api/dds/${dds.id}/pdf`, "_blank");
  }

  async function excluir() {
    if (!confirm("Excluir este DDS? Não dá para desfazer.")) return;
    const r = await fetch(`/api/dds/${dds.id}`, { method: "DELETE" });
    if (r.ok) router.push("/painel");
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Revisar DDS</h1>
        <button className="botao-sec" onClick={excluir}>Excluir</button>
      </div>

      {c.avisos?.length ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="mb-1 font-semibold">Confira antes de usar:</p>
          <ul className="list-disc pl-5">{c.avisos.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      ) : null}

      <section className="cartao grid gap-4 sm:grid-cols-3">
        <Texto rotulo="Data" valor={dds.data_realizacao ?? ""} onChange={(v) => setCampo("data_realizacao", v)} linhasVisiveis={1} ajuda="Formato AAAA-MM-DD" />
        <Texto rotulo="Setor" valor={dds.setor ?? ""} onChange={(v) => setCampo("setor", v)} linhasVisiveis={1} />
        <Texto rotulo="Local" valor={dds.local ?? ""} onChange={(v) => setCampo("local", v)} linhasVisiveis={1} />
        <Texto rotulo="Responsável" valor={dds.responsavel ?? ""} onChange={(v) => setCampo("responsavel", v)} linhasVisiveis={1} />
        <Texto rotulo="Público" valor={dds.publico ?? ""} onChange={(v) => setCampo("publico", v)} linhasVisiveis={1} />
      </section>

      <section className="cartao space-y-4">
        <Texto rotulo="Título" valor={c.titulo} onChange={(v) => setConteudo("titulo", v)} linhasVisiveis={1} />
        <Texto rotulo="Objetivo" valor={c.objetivo} onChange={(v) => setConteudo("objetivo", v)} linhasVisiveis={2} />
        <Texto rotulo="Introdução" valor={c.introducao} onChange={(v) => setConteudo("introducao", v)} linhasVisiveis={6} />
        <Texto rotulo="Riscos" valor={listas.riscos} onChange={(v) => setListas((l) => ({ ...l, riscos: v }))} linhasVisiveis={6} ajuda="Um risco por linha." />
        <Texto rotulo="Medidas de prevenção" valor={listas.medidas} onChange={(v) => setListas((l) => ({ ...l, medidas: v }))} linhasVisiveis={8} ajuda="Uma medida por linha." />
        <Texto rotulo="Caso real" valor={c.caso_real} onChange={(v) => setConteudo("caso_real", v)} linhasVisiveis={5} />
        <Texto rotulo="Perguntas para o grupo" valor={listas.perguntas} onChange={(v) => setListas((l) => ({ ...l, perguntas: v }))} linhasVisiveis={4} ajuda="Uma pergunta por linha." />
        <Texto rotulo="Mensagem final" valor={c.mensagem_final} onChange={(v) => setConteudo("mensagem_final", v)} linhasVisiveis={2} />
      </section>

      <section className="cartao space-y-3">
        <h2 className="font-semibold">Imagens</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {dds.imagens.map((img, i) => (
            <div key={i} className="space-y-2 rounded-md border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                {NOME_TIPO[img.tipo]}
                {img.origem ? ` · ${img.origem === "banco" ? "banco próprio" : img.origem === "ia" ? "gerada por IA" : "enviada"}` : ""}
              </p>
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded bg-slate-100">
                {ocupadas[i] ? (
                  <span className="text-sm text-slate-500">{ocupadas[i]}</span>
                ) : img.url ? (
                  <img src={img.url} alt={img.legenda} className="h-full w-full object-cover" />
                ) : (
                  <span className="px-4 text-center text-sm text-slate-500">Sem imagem</span>
                )}
              </div>
              <input
                className="campo"
                value={img.legenda}
                onChange={(e) =>
                  setDds((d) => ({ ...d, imagens: d.imagens.map((x, j) => (j === i ? { ...x, legenda: e.target.value } : x)) }))
                }
              />
              <div className="flex flex-wrap gap-2">
                <button className="botao-sec py-1" disabled={!!ocupadas[i]} onClick={() => definirImagem(i, { acao: "gerar" })}>
                  Gerar outra com IA
                </button>
                <label className="botao-sec cursor-pointer py-1">
                  Enviar foto
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) definirImagem(i, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cartao space-y-3">
        <h2 className="font-semibold">Placas de sinalização (NR-26)</h2>
        {c.placas.map((p, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <select
              className="campo w-auto"
              value={p.tipo}
              onChange={(e) => setConteudo("placas", c.placas.map((x, j) => (j === i ? { ...x, tipo: e.target.value } : x)))}
            >
              {TIPOS_PLACA.map((t) => <option key={t} value={t}>{NOME_PLACA[t]}</option>)}
            </select>
            <input
              className="campo flex-1"
              value={p.texto}
              onChange={(e) => setConteudo("placas", c.placas.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
            />
            <button className="botao-sec" onClick={() => setConteudo("placas", c.placas.filter((_, j) => j !== i))}>Remover</button>
          </div>
        ))}
        {c.placas.length < 4 ? (
          <button className="botao-sec" onClick={() => setConteudo("placas", [...c.placas, { tipo: "alerta", texto: "ATENÇÃO" }])}>
            + Adicionar placa
          </button>
        ) : null}
      </section>

      <section className="cartao space-y-2">
        <h2 className="font-semibold">Referências normativas</h2>
        {c.citacoes.length ? (
          c.citacoes.map((r, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <p className="flex-1"><strong>NR-{r.nr}, item {r.item}:</strong> {r.resumo}</p>
              <button className="text-red-700 underline" onClick={() => setConteudo("citacoes", c.citacoes.filter((_, j) => j !== i))}>
                remover
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Nenhuma citação.</p>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4">
          {msg ? <p className="mr-auto text-sm text-slate-600">{msg}</p> : <span className="mr-auto" />}
          <button className="botao-sec" disabled={salvando} onClick={() => salvar(false)}>Salvar</button>
          <button className="botao" disabled={salvando} onClick={() => salvar(true)}>Salvar e abrir PDF</button>
        </div>
      </div>
    </div>
  );
}
