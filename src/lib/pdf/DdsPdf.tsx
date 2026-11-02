/* eslint-disable jsx-a11y/alt-text -- Image do react-pdf não tem alt */
import { Document, Font, Image, Page, Path, Polygon, Rect, Circle, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { Dds, ImagemDds } from "@/lib/dds/tipos";

// Não quebrar palavras com hífen.
Font.registerHyphenationCallback((palavra) => [palavra]);

const COR = {
  primaria: "#0b5394",
  texto: "#1f2933",
  suave: "#5f6b7a",
  linha: "#d5dbe3",
  certo: "#1e8e3e",
  errado: "#c5221f",
  alerta: "#f2c200",
  fundo: "#f3f6fa",
};

const s = StyleSheet.create({
  pagina: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 34, fontSize: 10.5, color: COR.texto, fontFamily: "Helvetica" },
  cabecalho: { flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: COR.primaria, paddingBottom: 8, marginBottom: 10 },
  logo: { width: 70, height: 40, objectFit: "contain", marginRight: 12 },
  empresa: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  subtitulo: { fontSize: 9, color: COR.suave },
  infos: { flexDirection: "row", flexWrap: "wrap", backgroundColor: COR.fundo, padding: 8, borderRadius: 4, marginBottom: 10 },
  info: { width: "33%", marginBottom: 3 },
  infoRotulo: { fontSize: 7.5, color: COR.suave, textTransform: "uppercase" },
  infoValor: { fontSize: 9.5 },
  titulo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: COR.primaria, marginBottom: 8 },
  secao: { marginBottom: 9 },
  secaoTitulo: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: COR.primaria, marginBottom: 4, textTransform: "uppercase" },
  paragrafo: { marginBottom: 4 },
  item: { flexDirection: "row", marginBottom: 3 },
  marcador: { width: 12, color: COR.primaria, fontFamily: "Helvetica-Bold" },
  itemTexto: { flex: 1 },
  capa: { width: "100%", height: 190, objectFit: "cover", borderRadius: 4, marginBottom: 4 },
  legenda: { fontSize: 8.5, color: COR.suave, textAlign: "center", marginBottom: 8 },
  par: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  parItem: { width: "48.5%" },
  parImagem: { width: "100%", height: 150, objectFit: "cover", borderRadius: 4, borderWidth: 3 },
  selo: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#fff", paddingVertical: 2, paddingHorizontal: 6, alignSelf: "flex-start", marginBottom: 3, borderRadius: 2 },
  semImagem: { height: 120, backgroundColor: COR.fundo, borderRadius: 4, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  placas: { flexDirection: "row", gap: 10, marginBottom: 9 },
  placa: { width: 120, alignItems: "center", padding: 6, borderWidth: 1, borderColor: COR.linha, borderRadius: 4 },
  placaTexto: { fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "center", marginTop: 4 },
  refs: { borderWidth: 1, borderColor: COR.linha, borderRadius: 4, padding: 8, marginTop: 4 },
  ref: { fontSize: 9, marginBottom: 3, lineHeight: 1.35 },
  mensagem: { backgroundColor: COR.primaria, color: "#fff", padding: 10, borderRadius: 4, fontSize: 11.5, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 9 },
  rodape: { position: "absolute", bottom: 18, left: 34, right: 34, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: COR.suave },
  tabela: { borderWidth: 1, borderColor: COR.texto },
  linha: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COR.texto, height: 23 },
  celula: { borderRightWidth: 1, borderRightColor: COR.texto, padding: 4, justifyContent: "center" },
  celulaCab: { fontFamily: "Helvetica-Bold", fontSize: 9, backgroundColor: COR.fundo },
});

function formatarData(iso: string | null) {
  if (!iso) return "____/____/________";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function Cabecalho({ empresa, logo }: { empresa: string; logo: string | null }) {
  return (
    <View style={s.cabecalho} fixed>
      {logo ? <Image src={logo} style={s.logo} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={s.empresa}>{empresa}</Text>
        <Text style={s.subtitulo}>DDS - Diálogo Diário de Segurança</Text>
      </View>
    </View>
  );
}

function Infos({ dds }: { dds: Dds }) {
  const campos: [string, string][] = [
    ["Data", formatarData(dds.data_realizacao)],
    ["Local", dds.local || "-"],
    ["Setor", dds.setor || "-"],
    ["Responsável", dds.responsavel || "-"],
    ["Público", dds.publico || "-"],
    ["Duração", "15 minutos"],
  ];
  return (
    <View style={s.infos}>
      {campos.map(([r, v]) => (
        <View key={r} style={s.info}>
          <Text style={s.infoRotulo}>{r}</Text>
          <Text style={s.infoValor}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function Lista({ itens, marcador }: { itens: string[]; marcador: string }) {
  return (
    <View>
      {itens.map((t, i) => (
        <View key={i} style={s.item} wrap={false}>
          <Text style={s.marcador}>{marcador === "n" ? `${i + 1}.` : marcador}</Text>
          <Text style={s.itemTexto}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={s.secao}>
      <Text style={s.secaoTitulo} minPresenceAhead={40}>{titulo}</Text>
      {children}
    </View>
  );
}

function Paragrafos({ texto }: { texto: string }) {
  return (
    <>
      {texto
        .split(/\n+/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <Text key={i} style={s.paragrafo}>{p.trim()}</Text>
        ))}
    </>
  );
}

function ImagemOuVazio({ imagem, estilo }: { imagem: ImagemDds; estilo: Style | Style[] }) {
  if (imagem.url) return <Image src={imagem.url} style={estilo} />;
  return (
    <View style={s.semImagem}>
      <Text style={{ color: COR.suave, fontSize: 9 }}>Imagem não definida</Text>
    </View>
  );
}

function Placa({ tipo, texto }: { tipo: string; texto: string }) {
  const desenho =
    tipo === "obrigatorio" ? (
      <>
        <Circle cx="20" cy="20" r="18" fill={COR.primaria} />
        <Rect x="18" y="9" width="4" height="15" fill="#fff" />
        <Rect x="18" y="27" width="4" height="4" fill="#fff" />
      </>
    ) : tipo === "proibido" ? (
      <>
        <Circle cx="20" cy="20" r="16" fill="#fff" stroke={COR.errado} strokeWidth={4} />
        <Path d="M9 9 L31 31" stroke={COR.errado} strokeWidth={4} />
      </>
    ) : tipo === "alerta" ? (
      <>
        <Polygon points="20,3 38,36 2,36" fill={COR.alerta} stroke="#000" strokeWidth={2} />
        <Rect x="18.5" y="13" width="3" height="12" fill="#000" />
        <Rect x="18.5" y="28" width="3" height="3" fill="#000" />
      </>
    ) : (
      <>
        <Rect x="2" y="2" width="36" height="36" fill={COR.certo} />
        <Rect x="16" y="8" width="8" height="24" fill="#fff" />
        <Rect x="8" y="16" width="24" height="8" fill="#fff" />
      </>
    );
  return (
    <View style={s.placa} wrap={false}>
      <Svg width={40} height={40} viewBox="0 0 40 40">{desenho}</Svg>
      <Text style={s.placaTexto}>{texto}</Text>
    </View>
  );
}

export function DdsPdf({
  dds,
  empresa,
  logo,
  linhasPresenca = 22,
}: {
  dds: Dds;
  empresa: string;
  logo: string | null;
  linhasPresenca?: number;
}) {
  const c = dds.conteudo;
  const capa = dds.imagens.find((i) => i.tipo === "capa");
  const certo = dds.imagens.find((i) => i.tipo === "certo");
  const errado = dds.imagens.find((i) => i.tipo === "errado");
  const outras = dds.imagens.filter((i) => i !== capa && i !== certo && i !== errado);

  const rodape = (
    <View style={s.rodape} fixed>
      <Text>{c.titulo}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );

  return (
    <Document title={`DDS - ${c.titulo}`} author={empresa}>
      <Page size="A4" style={s.pagina}>
        <Cabecalho empresa={empresa} logo={logo} />
        <Infos dds={dds} />
        <Text style={s.titulo}>{c.titulo}</Text>

        {capa ? (
          <View wrap={false}>
            <ImagemOuVazio imagem={capa} estilo={s.capa} />
            <Text style={s.legenda}>{capa.legenda}</Text>
          </View>
        ) : null}

        <Secao titulo="Objetivo">
          <Paragrafos texto={c.objetivo} />
        </Secao>
        <Secao titulo="Introdução">
          <Paragrafos texto={c.introducao} />
        </Secao>
        <Secao titulo="Riscos">
          <Lista itens={c.riscos} marcador="•" />
        </Secao>

        {outras.map((img, i) => (
          <View key={i} wrap={false}>
            <ImagemOuVazio imagem={img} estilo={s.capa} />
            <Text style={s.legenda}>{img.legenda}</Text>
          </View>
        ))}

        <Secao titulo="Medidas de prevenção">
          <Lista itens={c.medidas} marcador="n" />
        </Secao>

        {certo || errado ? (
          <View style={s.par} wrap={false}>
            {[errado, certo].map((img) =>
              img ? (
                <View key={img.tipo} style={s.parItem}>
                  <Text style={[s.selo, { backgroundColor: img.tipo === "certo" ? COR.certo : COR.errado }]}>
                    {img.tipo === "certo" ? "CERTO" : "ERRADO"}
                  </Text>
                  <ImagemOuVazio
                    imagem={img}
                    estilo={[s.parImagem, { borderColor: img.tipo === "certo" ? COR.certo : COR.errado }]}
                  />
                  <Text style={s.legenda}>{img.legenda}</Text>
                </View>
              ) : null,
            )}
          </View>
        ) : null}

        {c.placas?.length ? (
          <Secao titulo="Sinalização">
            <View style={s.placas}>
              {c.placas.map((p, i) => (
                <Placa key={i} tipo={p.tipo} texto={p.texto} />
              ))}
            </View>
          </Secao>
        ) : null}

        <Secao titulo="Caso real">
          <Paragrafos texto={c.caso_real} />
        </Secao>
        <Secao titulo="Perguntas para o grupo">
          <Lista itens={c.perguntas} marcador="n" />
        </Secao>

        <Text style={s.mensagem} wrap={false}>{c.mensagem_final}</Text>

        {c.citacoes.length ? (
          <View style={s.refs} wrap={false}>
            <Text style={[s.secaoTitulo, { fontSize: 10 }]}>Referências normativas</Text>
            {c.citacoes.map((r, i) => (
              <Text key={i} style={s.ref}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>NR-{r.nr}, item {r.item}: </Text>
                {r.resumo}
              </Text>
            ))}
          </View>
        ) : null}
        {rodape}
      </Page>

      <Page size="A4" style={s.pagina}>
        <Cabecalho empresa={empresa} logo={logo} />
        <Text style={[s.titulo, { fontSize: 15 }]}>Lista de presença</Text>
        <Text style={{ marginBottom: 4 }}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Tema: </Text>
          {c.titulo}
        </Text>
        <Infos dds={dds} />
        <View style={s.tabela}>
          <View style={s.linha} fixed>
            <Text style={[s.celula, s.celulaCab, { width: 30 }]}>Nº</Text>
            <Text style={[s.celula, s.celulaCab, { width: 220 }]}>Nome</Text>
            <Text style={[s.celula, s.celulaCab, { width: 140 }]}>Função / Matrícula</Text>
            <Text style={[s.celula, s.celulaCab, { width: 135, borderRightWidth: 0 }]}>Assinatura</Text>
          </View>
          {Array.from({ length: linhasPresenca }, (_, i) => (
            <View key={i} style={s.linha} wrap={false}>
              <Text style={[s.celula, { width: 30 }]}>{i + 1}</Text>
              <Text style={[s.celula, { width: 220 }]}> </Text>
              <Text style={[s.celula, { width: 140 }]}> </Text>
              <Text style={[s.celula, { width: 135, borderRightWidth: 0 }]}> </Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 30 }}>
          <View style={{ alignItems: "center" }}>
            <Text>______________________________</Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>{dds.responsavel || "Responsável pelo DDS"}</Text>
          </View>
        </View>
        {rodape}
      </Page>
    </Document>
  );
}
