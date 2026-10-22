"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/componentes/autenticacao/ProvedorAuth";
import { CabecalhoInterno } from "@/componentes/comum/CabecalhoInterno";
import { useLarguraJanela } from "@/componentes/comum/ganchos";
import { ErroIdentificacao, identificar } from "@/lib/identificacao";
import { identificacaoVazia, rotuloConfianca, type Identificacao } from "@/tipos/identificacao";

// Porte da aba Fotos do app Flutter (fotos_screen.dart).
//
// Exige login: cada consulta gasta a cota do projeto no Gemini, e a Edge Function
// recusa quem não manda um ID token do Firebase.

const cartao = { background: "var(--branco)", border: "1px solid var(--linha)", borderRadius: "var(--raio)", padding: 24 } as const;

function Resultado({ r }: { r: Identificacao }) {
  if (identificacaoVazia(r)) {
    return (
      <div style={cartao}>
        <p style={{ margin: 0, fontSize: 16, color: "var(--tinta-2)" }}>
          {r.ehAnimal
            ? "Parece haver um animal, mas não deu para dizer qual. Tente uma imagem mais nítida, com o animal em destaque."
            : "Não encontramos nenhum animal nesta foto."}
        </p>
      </div>
    );
  }

  return (
    <div style={cartao}>
      <p style={{ margin: 0, fontSize: 15, color: "var(--tinta-3)" }}>Parece ser</p>
      <h2 style={{ margin: "2px 0 0", fontSize: 32 }}>{r.nomePopular}</h2>
      {r.nomeCientifico && <p style={{ margin: "2px 0 0", fontSize: 17, fontStyle: "italic", color: "var(--tinta-2)" }}>{r.nomeCientifico}</p>}
      <p style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: "var(--mata)" }}>{rotuloConfianca[r.confianca]}</p>
      {r.descricao && (
        <>
          <h3 style={{ margin: "20px 0 4px", fontSize: 18 }}>Por quê</h3>
          <p style={{ margin: 0, fontSize: 16, color: "var(--tinta-2)" }}>{r.descricao}</p>
        </>
      )}
      <p style={{ margin: "20px 0 0", paddingTop: 12, borderTop: "1px solid var(--linha)", fontSize: 14, color: "var(--tinta-3)" }}>Identificação feita por inteligência artificial: pode errar.</p>
    </div>
  );
}

export function Fotos() {
  const ehMobile = useLarguraJanela() < 768;
  const { usuario, abrirLogin } = useAuth();

  const [previa, setPrevia] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Identificacao | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // A prévia é uma URL `blob:` que ocupa memória até ser revogada.
  useEffect(() => {
    if (!previa) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    // Limpa o campo: escolher a mesma foto de novo também dispara o `change`.
    e.target.value = "";
    if (!arquivo || !usuario) return;

    setPrevia(URL.createObjectURL(arquivo));
    setResultado(null);
    setErro("");
    setCarregando(true);
    try {
      setResultado(await identificar(arquivo, usuario));
    } catch (falha) {
      setErro(falha instanceof ErroIdentificacao ? falha.message : "Algo deu errado. Verifique sua internet e tente de novo.");
      if (!(falha instanceof ErroIdentificacao)) console.error("Identificação falhou:", falha);
    } finally {
      setCarregando(false);
    }
  }

  const botao = (primario: boolean) =>
    ({
      position: "relative",
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 48,
      borderRadius: "var(--raio)",
      fontSize: 16,
      fontWeight: 600,
      cursor: carregando ? "not-allowed" : "pointer",
      opacity: carregando ? 0.6 : 1,
      background: primario ? "var(--mata)" : "var(--branco)",
      color: primario ? "var(--branco)" : "var(--mata)",
      border: "1px solid var(--mata)",
    }) as const;

  return (
    <div style={{ background: "var(--papel)", minHeight: "100vh" }}>
      <style>{`
        .campo-foto:focus-within { outline: 2px solid var(--mata); outline-offset: 2px; }
      `}</style>

      <CabecalhoInterno titulo="Identificar por foto" ehMobile={ehMobile} />

      <main>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: ehMobile ? "36px 16px 56px" : "64px 24px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ marginBottom: 8 }}>
            <h1 style={{ fontSize: ehMobile ? 32 : 48, margin: "0 0 12px" }}>Que animal é esse?</h1>
            <p style={{ fontSize: ehMobile ? 17 : 19 }}>Tire uma foto ou escolha uma imagem, e o Gemini, do Google, tenta dizer qual é o animal.</p>
          </div>

          {usuario === undefined ? (
            <p role="status" style={{ color: "var(--tinta-3)", fontSize: 16 }}>
              Carregando...
            </p>
          ) : usuario === null ? (
            <div style={cartao}>
              <p style={{ margin: "0 0 16px", fontSize: 16, color: "var(--tinta-2)" }}>Para identificar animais por foto é preciso entrar na sua conta. Cada consulta tem custo, e o login evita abuso.</p>
              <button type="button" onClick={abrirLogin} className="botao botao-cheio">
                Entrar
              </button>
            </div>
          ) : (
            <>
              {/* O nível gratuito do Gemini permite ao Google usar o que é enviado;
                  quem manda a foto precisa saber disso antes. */}
              <p style={{ margin: 0, fontSize: 15, color: "var(--tinta-3)" }}>
                A foto é enviada ao Gemini, do Google, que pode usá-la para melhorar os serviços dele. Não envie fotos de pessoas.
              </p>

              <div style={{ display: "flex", gap: 12, flexDirection: ehMobile ? "column" : "row" }}>
                {/* `capture` abre a câmera direto no celular; no computador vira um seletor de arquivo comum. */}
                <label className="campo-foto" style={botao(true)}>
                  <i className="fas fa-camera" aria-hidden="true" /> Tirar foto
                  <input type="file" accept="image/*" capture="environment" disabled={carregando} onChange={escolher} style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />
                </label>
                <label className="campo-foto" style={botao(false)}>
                  <i className="fas fa-images" aria-hidden="true" /> Escolher imagem
                  <input type="file" accept="image/*" disabled={carregando} onChange={escolher} style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />
                </label>
              </div>

              {previa && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previa} alt="Foto enviada" style={{ width: "100%", maxHeight: 380, objectFit: "cover", borderRadius: "var(--raio)" }} />
              )}

              <div aria-live="polite" style={{ display: "contents" }}>
                {carregando && (
                  <div role="status" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                    <div style={{ width: 22, height: 22, border: "2px solid var(--linha)", borderTopColor: "var(--mata)", borderRadius: "50%", animation: "girar 0.8s linear infinite", flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 16, color: "var(--tinta-2)" }}>Procurando o animal... pode levar alguns segundos.</p>
                  </div>
                )}

                {erro && (
                  <div role="alert" style={{ padding: "12px 14px", background: "var(--terra-clara)", borderRadius: "var(--raio)", color: "var(--terra)", fontSize: 16 }}>
                    {erro}
                  </div>
                )}

                {resultado && <Resultado r={resultado} />}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
