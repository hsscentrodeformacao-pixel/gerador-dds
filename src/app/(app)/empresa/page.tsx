import { usuarioAtual } from "@/lib/supabase/server";
import { FormEmpresa, FormTecnico } from "./Formularios";

export default async function Empresa() {
  const sessao = (await usuarioAtual())!;
  const { data: empresa } = await sessao.supabase
    .from("empresas")
    .select("nome, cnpj, logo_url")
    .eq("id", sessao.perfil.empresa_id)
    .single();
  const { data: equipe } = await sessao.supabase.from("perfis").select("id, nome, cargo, papel").order("nome");
  const admin = sessao.perfil.papel === "admin";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Empresa</h1>
      {admin ? (
        <FormEmpresa nome={empresa?.nome ?? ""} cnpj={empresa?.cnpj ?? ""} logo={empresa?.logo_url ?? null} />
      ) : (
        <p className="cartao text-sm text-slate-600">Só o administrador da empresa pode alterar estes dados.</p>
      )}
      <section className="cartao space-y-3">
        <h2 className="font-semibold">Equipe</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {equipe?.map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <span>{p.nome}{p.cargo ? ` · ${p.cargo}` : ""}</span>
              <span className="text-slate-500">{p.papel === "admin" ? "Administrador" : "Técnico"}</span>
            </li>
          ))}
        </ul>
        {admin ? <FormTecnico /> : null}
      </section>
    </div>
  );
}
