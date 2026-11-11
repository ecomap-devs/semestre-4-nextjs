"use client";

import { type User } from "firebase/auth";
import { useId, useState } from "react";

import { Dialogo } from "@/componentes/comum/Dialogo";
import { apagarConta, mensagemDoApagamento } from "@/lib/conta";

const ITENS = ["a sua conta, com o e-mail e a senha;", "o seu nome e a sua foto de perfil;", "as suas avaliações;", "a contagem das fotos que você enviou."];

/**
 * Confirmação de apagar a conta, com a senha (11/11/2026). O app tem o mesmo diálogo
 * (`ApagarContaDialog`).
 *
 * A senha confirma que é a dona da conta, e não alguém com o navegador aberto, e faz o
 * login recente que o Firebase exige para apagar.
 */
export default function ModalApagarConta({ usuario, aoFechar }: { usuario: User; aoFechar: () => void }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [apagada, setApagada] = useState(false);
  const id = useId();

  // No meio do apagamento, nem o Esc nem o ✕ fecham: a pessoa ficaria sem saber se a
  // conta saiu.
  const fechar = () => {
    if (!carregando) aoFechar();
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!senha) {
      setErro("Digite sua senha para confirmar.");
      return;
    }
    setErro("");
    setCarregando(true);
    try {
      await apagarConta(usuario, senha);
      setApagada(true);
    } catch (falha) {
      console.error("Apagar a conta falhou:", falha);
      setErro(mensagemDoApagamento(falha));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Dialogo
      aoFechar={fechar}
      idTitulo={`${id}-titulo`}
      estiloFundo={{ position: "fixed", inset: 0, background: "rgba(29,38,32,0.55)", zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      estiloCaixa={{ background: "var(--branco)", borderRadius: "var(--raio)", padding: "36px 32px", width: "100%", maxWidth: 420, position: "relative", boxShadow: "0 12px 40px rgba(29,38,32,0.2)", maxHeight: "calc(100dvh - 32px)", overflowY: "auto" }}
    >
      <button type="button" onClick={fechar} disabled={carregando} aria-label="Fechar" style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--tinta-3)" }}>
        ✕
      </button>

      <h2 id={`${id}-titulo`} style={{ fontSize: 26, marginBottom: 6 }}>
        {apagada ? "Conta apagada" : "Apagar conta"}
      </h2>

      {apagada ? (
        <>
          <p role="status" style={{ fontSize: 15, color: "var(--tinta-2)", marginBottom: 24 }}>
            Sua conta e tudo o que ela guardava foram apagados.
          </p>
          <button type="button" onClick={aoFechar} className="botao botao-cheio" style={{ width: "100%" }} data-foco-inicial>
            Fechar
          </button>
        </>
      ) : (
        <form onSubmit={enviar} noValidate>
          <p style={{ fontSize: 15, color: "var(--tinta-2)", marginBottom: 8 }}>Isto apaga, sem volta:</p>
          <ul style={{ fontSize: 15, color: "var(--tinta-2)", paddingLeft: 20, marginBottom: 20, lineHeight: 1.5 }}>
            {ITENS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {erro && (
            <div role="alert" style={{ background: "var(--terra-clara)", borderRadius: "var(--raio)", padding: "10px 14px", marginBottom: 16, fontSize: 15, color: "var(--terra)" }}>
              {erro}
            </div>
          )}

          <label htmlFor={`${id}-senha`} style={{ display: "block", fontSize: 14, color: "var(--tinta-2)", marginBottom: 4 }}>
            Para confirmar, digite sua senha
          </label>
          <input
            id={`${id}-senha`}
            className="campo-apagar"
            type="password"
            placeholder="Sua senha"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={carregando}
            data-foco-inicial
            style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--linha)", borderRadius: "var(--raio)", fontSize: 14, marginBottom: 20, outline: "none", display: "block", boxSizing: "border-box", color: "var(--tinta)", background: "var(--branco)" }}
          />
          <style>{`.campo-apagar:focus-visible { border-color: var(--terra) !important; box-shadow: 0 0 0 3px var(--terra-clara); }`}</style>

          <button type="submit" disabled={carregando} className="botao" style={{ width: "100%", marginBottom: 12, background: "var(--terra)", color: "var(--branco)", borderColor: "var(--terra)" }}>
            {carregando ? "Apagando..." : "Apagar minha conta"}
          </button>
          <button type="button" onClick={fechar} disabled={carregando} style={{ width: "100%", background: "none", border: "none", color: "var(--mata)", fontSize: 15, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4 }}>
            Cancelar
          </button>
        </form>
      )}
    </Dialogo>
  );
}
