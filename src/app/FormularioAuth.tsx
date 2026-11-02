"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Estado } from "./acoes";

type Campo = { nome: string; rotulo: string; tipo?: string; auto?: string };

export function FormularioAuth({
  titulo,
  acao,
  campos,
  botao,
  rodape,
}: {
  titulo: string;
  acao: (e: Estado, f: FormData) => Promise<Estado>;
  campos: Campo[];
  botao: string;
  rodape: { texto: string; link: string; rotulo: string };
}) {
  const [estado, enviar, pendente] = useActionState(acao, undefined);
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={enviar} className="cartao w-full max-w-sm space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Gerador de DDS</p>
          <h1 className="text-xl font-bold">{titulo}</h1>
        </div>
        {campos.map((c) => (
          <div key={c.nome}>
            <label className="rotulo" htmlFor={c.nome}>{c.rotulo}</label>
            <input id={c.nome} name={c.nome} type={c.tipo ?? "text"} autoComplete={c.auto} required className="campo" />
          </div>
        ))}
        {estado?.erro ? <p className="text-sm text-red-700">{estado.erro}</p> : null}
        <button className="botao w-full" disabled={pendente}>{pendente ? "Aguarde..." : botao}</button>
        <p className="text-center text-sm text-slate-600">
          {rodape.texto}{" "}
          <Link href={rodape.link} className="font-medium text-blue-800 underline">{rodape.rotulo}</Link>
        </p>
      </form>
    </main>
  );
}
