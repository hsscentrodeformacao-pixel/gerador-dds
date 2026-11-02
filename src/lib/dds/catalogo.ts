/** Catálogo básico de temas. Cada tema aponta as NRs usadas para buscar os itens. */
export type TemaCatalogo = { tema: string; nrs: number[] };
export type CategoriaCatalogo = { categoria: string; temas: TemaCatalogo[] };

export const CATALOGO: CategoriaCatalogo[] = [
  {
    categoria: "EPI (NR-6)",
    temas: [
      { tema: "Uso correto do capacete e da jugular", nrs: [6] },
      { tema: "Proteção auditiva: quando e como usar", nrs: [6, 15] },
      { tema: "Luvas: escolha certa para cada risco", nrs: [6] },
      { tema: "Guarda, conservação e troca do EPI", nrs: [6] },
    ],
  },
  {
    categoria: "Eletricidade (NR-10)",
    temas: [
      { tema: "Bloqueio e etiquetagem antes da manutenção elétrica", nrs: [10] },
      { tema: "Riscos do choque elétrico e arco elétrico", nrs: [10] },
      { tema: "Extensões, gambiarras e instalações provisórias", nrs: [10, 18] },
    ],
  },
  {
    categoria: "Máquinas e equipamentos (NR-12)",
    temas: [
      { tema: "Proteções fixas e móveis das máquinas", nrs: [12] },
      { tema: "Parada de emergência e dispositivos de segurança", nrs: [12] },
      { tema: "Manutenção com a máquina desenergizada", nrs: [12, 10] },
    ],
  },
  {
    categoria: "Construção civil (NR-18)",
    temas: [
      { tema: "Andaimes: montagem e inspeção", nrs: [18, 35] },
      { tema: "Escavações e risco de soterramento", nrs: [18] },
      { tema: "Organização e limpeza do canteiro", nrs: [18] },
    ],
  },
  {
    categoria: "Espaço confinado (NR-33)",
    temas: [
      { tema: "Permissão de entrada e trabalho (PET)", nrs: [33] },
      { tema: "Monitoramento da atmosfera antes de entrar", nrs: [33] },
      { tema: "Papel do vigia em espaço confinado", nrs: [33] },
    ],
  },
  {
    categoria: "Trabalho em altura (NR-35)",
    temas: [
      { tema: "Cinto paraquedista e ponto de ancoragem", nrs: [35, 6] },
      { tema: "Análise de risco antes do trabalho em altura", nrs: [35] },
      { tema: "Trabalho em telhados", nrs: [35, 18] },
    ],
  },
  {
    categoria: "Outros temas",
    temas: [
      { tema: "Prevenção e combate a incêndio", nrs: [23] },
      { tema: "Ergonomia e levantamento de peso", nrs: [17] },
      { tema: "Produtos químicos e FISPQ/FDS", nrs: [26, 20, 6] },
      { tema: "Sinalização de segurança", nrs: [26] },
      { tema: "Calor e hidratação no trabalho a céu aberto", nrs: [15, 21] },
      { tema: "Trabalho rural: agrotóxicos", nrs: [31] },
    ],
  },
];

export const PUBLICOS = [
  "Construção civil",
  "Indústria",
  "Área rural",
  "Escritório e administrativo",
  "Logística e transporte",
  "Saúde",
  "Misto / geral",
];
