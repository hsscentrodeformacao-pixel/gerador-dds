"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState } from "react";
import { adicionarTecnico, salvarEmpresa } from "../../acoes";

function Mensagem({ estado }: { estado: { erro?: string; ok?: string } | undefined }) {
  if (estado?.erro) return <p className="text-sm text-red-700">{estado.erro}</p>;
  if (estado?.ok) return <p className="text-sm text-green-700">{estado.ok}</p>;
  return null;
}

export function FormEmpresa({ nome, cnpj, logo }: { nome: string; cnpj: string; logo: string | null }) {
  const [estado, enviar, pendente] = useActionState(salvarEmpresa, undefined);
  return (
    <form action={enviar} className="cartao grid gap-4 sm:grid-cols-2">
      <div>
        <label className="rotulo" htmlFor="nome">Nome da empresa</label>
        <input id="nome" name="nome" defaultValue={nome} required className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="cnpj">CNPJ (opcional)</label>
        <input id="cnpj" name="cnpj" defaultValue={cnpj} className="campo" />
      </div>
      <div className="sm:col-span-2">
        <label className="rotulo" htmlFor="logo">Logo (PNG ou JPG, até 2 MB). Aparece no cabeçalho do PDF.</label>
        <div className="flex items-center gap-4">
          {logo ? <img src={logo} alt="Logo atual" className="h-12 w-auto rounded border border-slate-200 bg-white p-1" /> : null}
          <input id="logo" name="logo" type="file" accept="image/png,image/jpeg" className="text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="botao" disabled={pendente}>{pendente ? "Salvando..." : "Salvar"}</button>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}

export function FormTecnico() {
  const [estado, enviar, pendente] = useActionState(adicionarTecnico, undefined);
  return (
    <form action={enviar} className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
      <p className="text-sm font-medium sm:col-span-4">Adicionar técnico</p>
      <input name="nome" placeholder="Nome" required className="campo" />
      <input name="cargo" placeholder="Cargo (opcional)" className="campo" />
      <input name="email" type="email" placeholder="E-mail" required className="campo" />
      <input name="senha" type="text" placeholder="Senha inicial (8+)" required minLength={8} className="campo" />
      <div className="flex items-center gap-3 sm:col-span-4">
        <button className="botao" disabled={pendente}>{pendente ? "Adicionando..." : "Adicionar"}</button>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}
