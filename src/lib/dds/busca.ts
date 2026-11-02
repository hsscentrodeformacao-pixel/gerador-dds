/** Transforma um texto livre numa consulta "OU" do Postgres (to_tsquery). */
export function consultaOu(texto: string): string | null {
  const palavras = texto
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s-]+/)
    .filter((p) => p.length >= 4);
  const unicas = [...new Set(palavras)].slice(0, 20);
  return unicas.length ? unicas.join(" | ") : null;
}

/** Acha NRs citadas no texto, como "NR-35" ou "NR 6". */
export function nrsCitadas(texto: string): number[] {
  const achados = [...texto.matchAll(/\bNR[\s-]?0?(\d{1,2})\b/gi)].map((m) => Number(m[1]));
  return [...new Set(achados)];
}
