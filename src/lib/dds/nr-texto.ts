/** Divide o texto de uma NR em itens numerados (ex.: "35.4.5 Todo trabalho..."). */
export function dividirItens(nr: number, texto: string): { nr: number; item: string; texto: string }[] {
  const prefixo = `${nr}.`;
  const regex = new RegExp(`^\\s*(${nr}(?:\\.\\d+)+)\\.?\\s+(.*)$`);
  const itens: { nr: number; item: string; texto: string }[] = [];
  let atual: { item: string; partes: string[] } | null = null;

  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.replace(/\s+/g, " ").trim();
    if (!linha) continue;
    // Ignora rodapés e cabeçalhos comuns dos PDFs.
    if (/^(--\s*\d+\s*of\s*\d+\s*--|página \d+|NR[- ]?\d+\s*-\s*[A-ZÇÃÕÉÊ ]+$)/i.test(linha)) continue;

    const m = linha.match(regex);
    if (m && m[1].startsWith(prefixo) && m[2] && /[A-Za-zÀ-ú]/.test(m[2][0])) {
      if (atual) itens.push({ nr, item: atual.item, texto: atual.partes.join(" ") });
      atual = { item: m[1], partes: [m[2]] };
    } else if (atual) {
      atual.partes.push(linha);
    }
  }
  if (atual) itens.push({ nr, item: atual.item, texto: atual.partes.join(" ") });

  // Mantém a primeira ocorrência de cada item e descarta textos muito curtos (títulos soltos).
  const vistos = new Set<string>();
  return itens.filter((i) => {
    if (vistos.has(i.item) || i.texto.length < 15) return false;
    vistos.add(i.item);
    return true;
  });
}
