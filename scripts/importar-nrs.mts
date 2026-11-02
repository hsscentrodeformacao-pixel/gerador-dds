/**
 * Importa o texto oficial das NRs para a base do sistema.
 *
 * 1. Baixe os PDFs das NRs no site do Ministério do Trabalho (gov.br) para uma pasta,
 *    com nomes que tenham o número da NR, por exemplo: nr-06.pdf, nr-35.pdf.
 * 2. Rode: npm run importar-nrs -- caminho/da/pasta
 *
 * Também aceita arquivos .txt. Itens já existentes são atualizados.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";
import { dividirItens } from "../src/lib/dds/nr-texto.ts";

const pasta = process.argv[2];
if (!pasta) {
  console.error("Uso: npm run importar-nrs -- caminho/da/pasta");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function lerTexto(caminho: string): Promise<string> {
  if (caminho.toLowerCase().endsWith(".txt")) return readFile(caminho, "utf8");
  const parser = new PDFParse({ data: await readFile(caminho) });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

const arquivos = (await readdir(pasta)).filter((a) => /\.(pdf|txt)$/i.test(a));
if (!arquivos.length) console.log("Nenhum PDF ou TXT encontrado na pasta.");

for (const arquivo of arquivos) {
  const m = arquivo.match(/nr[\s_-]?0?(\d{1,2})/i);
  if (!m) {
    console.log(`Pulando ${arquivo}: o nome precisa ter o número da NR (ex.: nr-35.pdf).`);
    continue;
  }
  const nr = Number(m[1]);
  const itens = dividirItens(nr, await lerTexto(join(pasta, arquivo)));
  for (let i = 0; i < itens.length; i += 500) {
    const { error } = await supabase.from("nr_itens").upsert(itens.slice(i, i + 500), { onConflict: "nr,item" });
    if (error) throw new Error(`NR-${nr}: ${error.message}`);
  }
  console.log(`NR-${nr}: ${itens.length} itens importados de ${arquivo}`);
}
