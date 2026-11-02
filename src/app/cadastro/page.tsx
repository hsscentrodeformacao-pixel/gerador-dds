import { cadastrar } from "../acoes";
import { FormularioAuth } from "../FormularioAuth";

export default function Cadastro() {
  return (
    <FormularioAuth
      titulo="Cadastrar empresa"
      acao={cadastrar}
      botao="Criar conta"
      campos={[
        { nome: "nome", rotulo: "Seu nome", auto: "name" },
        { nome: "empresa", rotulo: "Nome da empresa", auto: "organization" },
        { nome: "email", rotulo: "E-mail", tipo: "email", auto: "email" },
        { nome: "senha", rotulo: "Senha (mínimo 8 caracteres)", tipo: "password", auto: "new-password" },
      ]}
      rodape={{ texto: "Já tem conta?", link: "/login", rotulo: "Entrar" }}
    />
  );
}
