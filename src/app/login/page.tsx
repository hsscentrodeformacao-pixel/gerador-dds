import { entrar } from "../acoes";
import { FormularioAuth } from "../FormularioAuth";

export default function Login() {
  return (
    <FormularioAuth
      titulo="Entrar"
      acao={entrar}
      botao="Entrar"
      campos={[
        { nome: "email", rotulo: "E-mail", tipo: "email", auto: "email" },
        { nome: "senha", rotulo: "Senha", tipo: "password", auto: "current-password" },
      ]}
      rodape={{ texto: "Ainda não tem conta?", link: "/cadastro", rotulo: "Cadastre sua empresa" }}
    />
  );
}
