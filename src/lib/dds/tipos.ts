import * as z from "zod/v4";

export const TIPOS_IMAGEM = ["capa", "risco", "certo", "errado"] as const;
export const TIPOS_PLACA = ["obrigatorio", "proibido", "alerta", "emergencia"] as const;

/** Formato que o Claude devolve ao escrever um DDS. */
export const ConteudoDdsSchema = z.object({
  titulo: z.string().describe("Título curto e direto do DDS"),
  objetivo: z.string().describe("Uma ou duas frases com o objetivo do DDS"),
  introducao: z.string().describe("Introdução em 2 a 3 parágrafos, linguagem simples"),
  riscos: z.array(z.string()).describe("4 a 7 riscos principais, cada um em uma ou duas frases"),
  medidas: z
    .array(z.string())
    .describe("5 a 9 medidas de prevenção práticas; cite NR e item entre parênteses quando houver"),
  caso_real: z.string().describe("Um caso ou exemplo realista (sem nomes reais) e o que se aprende com ele"),
  perguntas: z.array(z.string()).describe("3 a 5 perguntas para conversar com o grupo"),
  mensagem_final: z.string().describe("Mensagem final curta e marcante"),
  citacoes: z
    .array(
      z.object({
        nr: z.number().int(),
        item: z.string(),
        resumo: z.string().describe("O que o item exige, em uma frase simples"),
      }),
    )
    .describe("Somente itens presentes na lista de itens das NRs fornecida"),
  imagens: z
    .array(
      z.object({
        tipo: z.enum(TIPOS_IMAGEM),
        legenda: z.string().describe("Legenda curta em português para aparecer no PDF"),
        busca: z.string().describe("3 a 6 palavras-chave em português para buscar no banco de imagens"),
        prompt: z
          .string()
          .describe("Descrição detalhada da cena em inglês para gerar a ilustração, com EPIs corretos"),
      }),
    )
    .describe("3 ou 4 imagens: uma capa, e um par certo/errado sempre que fizer sentido"),
  placas: z
    .array(z.object({ tipo: z.enum(TIPOS_PLACA), texto: z.string().describe("Texto curto da placa, em maiúsculas") }))
    .describe("1 a 3 placas de sinalização (NR-26) ligadas ao tema"),
});

export type ConteudoDds = z.infer<typeof ConteudoDdsSchema> & {
  /** Avisos da conferência automática (ex.: citação sem correspondência na base). */
  avisos?: string[];
};

export type ImagemDds = {
  tipo: (typeof TIPOS_IMAGEM)[number];
  legenda: string;
  busca: string;
  prompt: string;
  url: string | null;
  origem: "banco" | "ia" | "upload" | null;
};

export type Dds = {
  id: string;
  empresa_id: string;
  tema: string;
  publico: string | null;
  setor: string | null;
  local: string | null;
  responsavel: string | null;
  data_realizacao: string | null;
  conteudo: ConteudoDds;
  imagens: ImagemDds[];
  criado_em: string;
};
