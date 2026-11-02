import type { SupabaseClient } from "@supabase/supabase-js";
import { consultaOu } from "./busca";
import type { ImagemDds } from "./tipos";

const BUCKET = "arquivos";

/** Procura uma imagem aprovada no banco próprio. */
export async function buscarNoBanco(supabase: SupabaseClient, imagem: ImagemDds) {
  const consulta = consultaOu(`${imagem.busca} ${imagem.legenda}`);
  if (!consulta) return null;
  const { data } = await supabase.rpc("buscar_imagem", { consulta, tipo_imagem: imagem.tipo });
  const achada = (data as { url: string; rank: number }[] | null)?.[0];
  // Exige uma semelhança mínima para não trazer imagem de outro assunto.
  return achada && achada.rank >= 0.05 ? achada.url : null;
}

/** Gera a ilustração com o provedor configurado. Devolve PNG ou null se não houver provedor. */
export async function gerarComIa(imagem: ImagemDds): Promise<Buffer | null> {
  const provedor = process.env.IMAGE_PROVIDER || "nenhum";
  if (provedor === "nenhum") return null;

  const estilo =
    "Educational workplace safety illustration in a clean Brazilian safety-booklet style, flat colors, " +
    "clear outlines, plain light background, no text, no letters, no logos. Personal protective equipment must be drawn accurately.";
  const marcador =
    imagem.tipo === "errado"
      ? " This scene shows the WRONG, unsafe way."
      : imagem.tipo === "certo"
        ? " This scene shows the CORRECT, safe way."
        : "";
  const prompt = `${estilo}${marcador} ${imagem.prompt}`;

  if (provedor === "openai") {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.IMAGE_MODEL || "gpt-image-1",
        prompt,
        size: "1024x1024",
        n: 1,
      }),
    });
    if (!r.ok) throw new Error(`Falha ao gerar imagem (${r.status}): ${await r.text()}`);
    const json = (await r.json()) as { data: { b64_json?: string; url?: string }[] };
    const item = json.data[0];
    if (item.b64_json) return Buffer.from(item.b64_json, "base64");
    if (item.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer());
    return null;
  }
  throw new Error(`IMAGE_PROVIDER desconhecido: ${provedor}`);
}

/** Salva um arquivo no armazenamento e devolve a URL pública. */
export async function salvarArquivo(
  admin: SupabaseClient,
  caminho: string,
  dados: Buffer | Blob,
  tipo: string,
): Promise<string> {
  const { error } = await admin.storage.from(BUCKET).upload(caminho, dados, { contentType: tipo, upsert: true });
  if (error) throw new Error(`Falha ao salvar arquivo: ${error.message}`);
  return admin.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}

/** Registra no banco uma imagem gerada por IA, aguardando revisão antes de ser reutilizada. */
export async function registrarNoBanco(admin: SupabaseClient, imagem: ImagemDds, url: string) {
  await admin.from("imagens_banco").insert({
    descricao: imagem.legenda,
    tags: imagem.busca,
    tipo: imagem.tipo,
    url,
    origem: "ia",
    aprovada: false,
  });
}
