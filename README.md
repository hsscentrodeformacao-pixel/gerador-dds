# Gerador de DDS

Site para profissionais de Segurança do Trabalho gerarem DDS (Diálogo Diário de Segurança) de 15 minutos com IA: texto citando as NRs, ilustrações, placas de sinalização (NR-26) e lista de presença, pronto para imprimir em PDF.

## Como funciona

1. O técnico escolhe um tema no catálogo ou digita um tema livre, e informa público, setor, local e data.
2. O sistema busca na base os itens oficiais das NRs ligados ao tema.
3. O Claude escreve o DDS nas seções fixas (objetivo, introdução, riscos, medidas, caso real, perguntas, mensagem final) citando só itens da base.
4. Cada citação é conferida. O que não existe na base é removido e aparece um aviso para revisão.
5. As 3 ou 4 imagens vêm primeiro do banco próprio (imagens aprovadas). Se não houver, a IA de imagem gera uma.
6. O técnico revisa, edita, troca imagens ou envia fotos e baixa o PDF.
7. O DDS fica no histórico da empresa, visível para todos os técnicos dela.

## Tecnologias

- **Next.js** (site), publicado na **Vercel**
- **Supabase** (login, banco Postgres, arquivos)
- **Claude** (Anthropic) para o texto
- IA de imagem configurável (hoje: OpenAI, ou desligada)
- **@react-pdf/renderer** para o PDF

## Publicar pela primeira vez

### 1. Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um projeto novo (região São Paulo).
2. Abra **SQL Editor**, cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Em **Project Settings > API**, copie a *Project URL*, a chave *anon* e a chave *service_role*.

### 2. Chaves de IA

- Claude: crie uma chave em [console.anthropic.com](https://console.anthropic.com) e coloque créditos.
- Imagens (opcional): crie uma chave na OpenAI e use `IMAGE_PROVIDER=openai`. Sem ela, deixe `IMAGE_PROVIDER=nenhum`: o sistema usa só o banco próprio e as fotos enviadas.

### 3. Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) entrando com o GitHub.
2. **Add New > Project**, escolha este repositório e clique em **Deploy**.
3. Em **Settings > Environment Variables**, cadastre as variáveis de [`.env.example`](.env.example) e faça um novo deploy.

Depois disso, cada alteração enviada ao GitHub publica o site sozinha.

### 4. Base das NRs

O sistema só cita itens que estão na base. Para importar:

1. Baixe os PDFs das NRs no site do Ministério do Trabalho (gov.br) para uma pasta, com o número no nome: `nr-06.pdf`, `nr-35.pdf`...
2. No seu computador, com o projeto baixado e `.env.local` preenchido:

```bash
npm install
npm run importar-nrs -- caminho/da/pasta
```

Comece pelas mais usadas (NR-6, 10, 12, 17, 18, 23, 26, 33, 35). Quando uma NR for atualizada, rode de novo com o PDF novo.

### 5. Primeiro acesso

Abra o site, clique em **Cadastre sua empresa** e crie a conta. Quem cria é o administrador: em **Empresa** ele envia o logo e adiciona os técnicos.

## Banco de imagens

Toda imagem gerada por IA entra na tabela `imagens_banco` com `aprovada = false`. Revise no Supabase (**Table Editor > imagens_banco**, abrindo a URL) e marque `aprovada = true` nas que estão tecnicamente corretas. A partir daí ela é reutilizada em outros DDS do mesmo assunto, sem custo de IA.

Para cadastrar ilustrações próprias, envie o arquivo para o bucket `arquivos` e crie a linha com `origem = 'propria'`, `aprovada = true`, a descrição, as palavras-chave e o tipo (`capa`, `risco`, `certo` ou `errado`).

## Rodar no computador

```bash
cp .env.example .env.local   # e preencha
npm install
npm run dev                  # http://localhost:3000
npm run exemplo-pdf -- exemplo.pdf   # gera um PDF de exemplo sem banco nem IA
```

## Custos

- Texto: o modelo é escolhido em `CLAUDE_MODEL`. O padrão `claude-opus-5-5` dá a melhor qualidade; `claude-sonnet-5-5` ou `claude-haiku-5-5` custam menos.
- Imagens por IA são cobradas por imagem; o custo cai conforme o banco próprio cresce.
