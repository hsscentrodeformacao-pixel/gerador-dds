-- Gerador de DDS: esquema do banco (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase uma única vez.

-- ============ Empresas e usuários ============
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  logo_url text,
  criado_em timestamptz not null default now()
);

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  cargo text,
  papel text not null default 'tecnico' check (papel in ('admin', 'tecnico')),
  criado_em timestamptz not null default now()
);

-- Empresa do usuário logado (usada nas regras de acesso)
create or replace function public.minha_empresa()
returns uuid
language sql stable security definer set search_path = public
as $$ select empresa_id from public.perfis where id = auth.uid() $$;

-- ============ DDS ============
create table if not exists public.dds (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  criado_por uuid references auth.users(id) on delete set null,
  tema text not null,
  publico text,
  setor text,
  local text,
  responsavel text,
  data_realizacao date,
  conteudo jsonb not null,
  imagens jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists dds_empresa_idx on public.dds (empresa_id, criado_em desc);

-- ============ Base das NRs ============
create table if not exists public.nr_itens (
  id bigint generated always as identity primary key,
  nr int not null,
  item text not null,
  texto text not null,
  busca tsvector generated always as (to_tsvector('portuguese', texto)) stored,
  unique (nr, item)
);
create index if not exists nr_itens_busca_idx on public.nr_itens using gin (busca);

create or replace function public.buscar_itens_nr(consulta text, nrs int[] default null, limite int default 30)
returns table (nr int, item text, texto text, rank real)
language sql stable
as $$
  select n.nr, n.item, n.texto, ts_rank(n.busca, to_tsquery('portuguese', consulta)) as rank
  from public.nr_itens n
  where n.busca @@ to_tsquery('portuguese', consulta)
    and (nrs is null or n.nr = any(nrs))
  order by rank desc
  limit limite
$$;

-- ============ Banco de imagens ============
create table if not exists public.imagens_banco (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  tags text not null default '',
  tipo text not null default 'risco' check (tipo in ('capa', 'risco', 'certo', 'errado')),
  url text not null,
  origem text not null default 'ia' check (origem in ('ia', 'propria')),
  aprovada boolean not null default false,
  busca tsvector generated always as (to_tsvector('portuguese', descricao || ' ' || tags)) stored,
  criado_em timestamptz not null default now()
);
create index if not exists imagens_banco_busca_idx on public.imagens_banco using gin (busca);

create or replace function public.buscar_imagem(consulta text, tipo_imagem text)
returns table (id uuid, url text, descricao text, rank real)
language sql stable
as $$
  select i.id, i.url, i.descricao, ts_rank(i.busca, to_tsquery('portuguese', consulta)) as rank
  from public.imagens_banco i
  where i.aprovada
    and i.tipo = tipo_imagem
    and i.busca @@ to_tsquery('portuguese', consulta)
  order by rank desc
  limit 1
$$;

-- ============ Regras de acesso (RLS) ============
alter table public.empresas enable row level security;
alter table public.perfis enable row level security;
alter table public.dds enable row level security;
alter table public.nr_itens enable row level security;
alter table public.imagens_banco enable row level security;

drop policy if exists "empresa: ver a minha" on public.empresas;
create policy "empresa: ver a minha" on public.empresas
  for select using (id = public.minha_empresa());
drop policy if exists "empresa: admin edita" on public.empresas;
create policy "empresa: admin edita" on public.empresas
  for update using (
    id = public.minha_empresa()
    and exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
  );

drop policy if exists "perfis: mesma empresa" on public.perfis;
create policy "perfis: mesma empresa" on public.perfis
  for select using (empresa_id = public.minha_empresa());

drop policy if exists "dds: mesma empresa" on public.dds;
create policy "dds: mesma empresa" on public.dds
  for all using (empresa_id = public.minha_empresa())
  with check (empresa_id = public.minha_empresa());

drop policy if exists "nr: leitura logado" on public.nr_itens;
create policy "nr: leitura logado" on public.nr_itens
  for select to authenticated using (true);

drop policy if exists "imagens: leitura aprovadas" on public.imagens_banco;
create policy "imagens: leitura aprovadas" on public.imagens_banco
  for select to authenticated using (aprovada);

-- ============ Armazenamento de arquivos ============
-- Bucket público para logos e imagens (os caminhos começam pelo id da empresa).
insert into storage.buckets (id, name, public)
values ('arquivos', 'arquivos', true)
on conflict (id) do nothing;
