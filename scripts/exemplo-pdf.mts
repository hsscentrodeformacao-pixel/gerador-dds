// Gera um PDF de exemplo sem banco nem IA: npx tsx scripts/exemplo-pdf.mts saida.pdf
import { createElement } from "react";
import { renderToFile } from "@react-pdf/renderer";
import { DdsPdf } from "../src/lib/pdf/DdsPdf.tsx";
import type { Dds } from "../src/lib/dds/tipos.ts";

const dds: Dds = {
  id: "exemplo",
  empresa_id: "exemplo",
  tema: "Trabalho em telhados",
  publico: "Construção civil",
  setor: "Manutenção predial",
  local: "Galpão 2",
  responsavel: "Helton (Técnico de Segurança)",
  data_realizacao: "2026-11-03",
  criado_em: new Date().toISOString(),
  imagens: [
    { tipo: "capa", legenda: "Equipe preparando o acesso ao telhado com linha de vida instalada", busca: "", prompt: "", url: null, origem: null },
    { tipo: "errado", legenda: "Trabalhador sobre telhas sem cinto e sem linha de vida", busca: "", prompt: "", url: null, origem: null },
    { tipo: "certo", legenda: "Cinto paraquedista conectado à linha de vida e uso de tábuas sobre as telhas", busca: "", prompt: "", url: null, origem: null },
  ],
  conteudo: {
    titulo: "Telhado não é chão: trabalhe preso e apoiado",
    objetivo: "Mostrar os riscos de queda em telhados e as medidas que evitam acidentes graves.",
    introducao:
      "Todo ano, muitos trabalhadores morrem ou ficam com sequelas por quedas de telhados.\nTelhas de fibrocimento e translúcidas parecem firmes, mas quebram com o peso de uma pessoa.",
    riscos: ["Queda por quebra de telha frágil.", "Escorregamento em telha molhada ou com limo.", "Queda pela borda do telhado.", "Choque elétrico em redes próximas."],
    medidas: [
      "Fazer a análise de risco e emitir a permissão de trabalho antes de subir (NR-35, item 35.4.5).",
      "Usar cinto paraquedista conectado a linha de vida ou ponto de ancoragem.",
      "Nunca pisar direto sobre a telha: usar tábuas ou passarelas apoiadas na estrutura.",
      "Não trabalhar com chuva ou vento forte.",
      "Isolar e sinalizar a área de baixo.",
    ],
    caso_real:
      "Um ajudante subiu para trocar uma telha quebrada e pisou numa telha translúcida. Caiu 6 metros. A tarefa parecia rápida e ninguém fez a análise de risco.",
    perguntas: ["Que tipos de telha temos aqui?", "Onde estão os pontos de ancoragem?", "O que fazer se começar a chover?"],
    mensagem_final: "Se não dá para se prender, não dá para subir.",
    citacoes: [{ nr: 35, item: "35.4.5", resumo: "Todo trabalho em altura deve ser precedido de análise de risco." }],
    imagens: [],
    placas: [
      { tipo: "obrigatorio", texto: "USO OBRIGATÓRIO DE CINTO" },
      { tipo: "alerta", texto: "CUIDADO: TELHADO FRÁGIL" },
      { tipo: "proibido", texto: "PROIBIDO PISAR NAS TELHAS" },
    ],
  },
};

renderToFile(createElement(DdsPdf, { dds, empresa: "Empresa Exemplo Ltda.", logo: null }) as never, process.argv[2] || "exemplo.pdf").then(() =>
  console.log("PDF gerado"),
);
