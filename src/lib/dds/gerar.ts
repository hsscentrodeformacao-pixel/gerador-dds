import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { consultaOu, nrsCitadas } from "./busca";
import { ConteudoDdsSchema, type ConteudoDds } from "./tipos";

const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5-5";

export type PedidoDds = {
  tema: string;
  publico: string;
  setor?: string;
  local?: string;
  nrs?: number[];
  observacoes?: string;
};

type ItemNr = { nr: number; item: string; texto: string };

const SISTEMA = `Você é um técnico de Segurança do Trabalho experiente no Brasil, que escreve DDS (Diálogo Diário de Segurança) para serem lidos em voz alta para trabalhadores.

Regras do texto:
- Português do Brasil, frases curtas, linguagem que um trabalhador de qualquer escolaridade entenda. Explique termos técnicos.
- O DDS completo deve ocupar cerca de 15 minutos: leitura de 8 a 10 minutos (por volta de 1.000 a 1.300 palavras somando todas as seções) e o resto para as perguntas ao grupo.
- Adapte exemplos, riscos e medidas ao público e ao setor informados.
- O caso real deve ser realista e plausível, sem nomes de pessoas ou empresas reais.

Regras das citações de NR (obrigatórias):
- Você recebe uma lista de itens oficiais das NRs. Cite SOMENTE itens dessa lista, com o número exato do item.
- Nunca invente número de item. Se a lista não tiver um item adequado, fale da medida sem citar item.
- Quando citar no texto, use o formato "(NR-35, item 35.4.1)".
- Em "citacoes", liste cada item citado, com um resumo simples do que ele exige.

Regras das imagens:
- Peça 3 ou 4 imagens. A primeira é a capa. Sempre que o tema permitir, inclua um par "certo" e "errado" mostrando a mesma situação.
- O campo "prompt" é em inglês e descreve uma ilustração didática, estilo cartilha de segurança, fundo simples, sem texto escrito na imagem. Descreva com precisão os EPIs (por exemplo: full-body harness with dorsal D-ring attached to an anchor point above the worker; hard hat with chin strap fastened).
- Na imagem "errado", descreva claramente qual é o erro.

Placas: sugira de 1 a 3 placas de sinalização ligadas ao tema, no padrão da NR-26 (obrigatório, proibido, alerta, emergência).`;

/** Busca na base os itens das NRs relacionados ao tema. */
async function buscarItens(supabase: SupabaseClient, pedido: PedidoDds): Promise<ItemNr[]> {
  const consulta = consultaOu(`${pedido.tema} ${pedido.observacoes ?? ""}`);
  if (!consulta) return [];
  const nrs = pedido.nrs?.length ? pedido.nrs : nrsCitadas(pedido.tema);

  const { data: comFiltro } = await supabase.rpc("buscar_itens_nr", {
    consulta,
    nrs: nrs.length ? nrs : null,
    limite: 30,
  });
  let itens = (comFiltro ?? []) as ItemNr[];

  // Completa com itens de outras NRs se a busca filtrada trouxer pouco.
  if (nrs.length && itens.length < 10) {
    const { data: geral } = await supabase.rpc("buscar_itens_nr", { consulta, nrs: null, limite: 15 });
    const vistos = new Set(itens.map((i) => `${i.nr}|${i.item}`));
    for (const i of (geral ?? []) as ItemNr[]) if (!vistos.has(`${i.nr}|${i.item}`)) itens.push(i);
  }
  itens = itens.map((i) => ({ ...i, texto: i.texto.slice(0, 1200) }));
  return itens;
}

/** Remove citações que não vieram da base e avisa sobre menções soltas no texto. */
export function conferirCitacoes(conteudo: ConteudoDds, itens: ItemNr[]): ConteudoDds {
  const validos = new Set(itens.map((i) => `${i.nr}|${i.item}`));
  const avisos: string[] = [];

  const citacoes = conteudo.citacoes.filter((c) => {
    const ok = validos.has(`${c.nr}|${c.item}`);
    if (!ok) avisos.push(`Citação removida por não constar na base: NR-${c.nr}, item ${c.item}.`);
    return ok;
  });

  const textos = [
    conteudo.introducao,
    conteudo.caso_real,
    conteudo.mensagem_final,
    ...conteudo.riscos,
    ...conteudo.medidas,
  ].join("\n");
  for (const m of textos.matchAll(/NR[\s-]?0?(\d{1,2}),?\s*item\s*([\d.]+\d)/gi)) {
    const chave = `${Number(m[1])}|${m[2]}`;
    if (!validos.has(chave)) avisos.push(`Confira no texto: "${m[0]}" não foi encontrado na base de NRs.`);
  }
  if (itens.length === 0) {
    avisos.push("A base de NRs não trouxe itens para este tema. Confira as referências antes de usar.");
  }
  return { ...conteudo, citacoes, avisos: [...new Set(avisos)] };
}

/** Escreve um DDS com o Claude a partir do pedido e dos itens das NRs. */
export async function gerarConteudoDds(supabase: SupabaseClient, pedido: PedidoDds): Promise<ConteudoDds> {
  const itens = await buscarItens(supabase, pedido);
  const listaItens = itens.length
    ? itens.map((i) => `[NR-${i.nr}, item ${i.item}] ${i.texto}`).join("\n\n")
    : "(nenhum item encontrado na base para este tema)";

  const pedidoTexto = [
    `Tema: ${pedido.tema}`,
    `Público: ${pedido.publico}`,
    pedido.setor ? `Setor: ${pedido.setor}` : null,
    pedido.local ? `Local: ${pedido.local}` : null,
    pedido.observacoes ? `Observações do técnico: ${pedido.observacoes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const client = new Anthropic();
  const resposta = await client.beta.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SISTEMA,
    messages: [
      {
        role: "user",
        content: `<itens_das_nrs>\n${listaItens}\n</itens_das_nrs>\n\n<pedido>\n${pedidoTexto}\n</pedido>\n\nEscreva o DDS.`,
      },
    ],
    output_config: { format: betaZodOutputFormat(ConteudoDdsSchema) },
  });

  if (resposta.stop_reason === "refusal") {
    throw new Error("A IA recusou este pedido. Tente reescrever o tema.");
  }
  if (resposta.stop_reason === "max_tokens" || !resposta.parsed_output) {
    throw new Error("A IA não terminou o DDS. Tente de novo.");
  }
  return conferirCitacoes(resposta.parsed_output, itens);
}
