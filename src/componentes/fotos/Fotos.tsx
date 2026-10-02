"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/componentes/autenticacao/ProvedorAuth";
import { useLarguraJanela } from "@/componentes/comum/ganchos";
import { ErroIdentificacao, identificar } from "@/lib/identificacao";
import { identificacaoVazia, rotuloConfianca, type Identificacao } from "@/tipos/identificacao";

// Porte da aba Fotos do app Flutter (fotos_screen.dart).
//
// Exige login: cada consulta gasta a cota do projeto no Gemini, e a Edge Function
// recusa quem não manda um ID token do Firebase.

const cartao = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" } as const;

function Resultado({ r }: { r: Identificacao }) {
  if (identificacaoVazia(r)) {
    return (
      <div style={cartao}>
        <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
          {r.ehAnimal
            ? "Parece haver um animal, mas não deu para dizer qual. Tente uma imagem mais nítida, com o animal em destaque."
            : "Não encontramos nenhum animal nesta foto."}
        </p>
      </div>
    );
  }

  return (
    <div style={cartao}>
      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Parece ser</p>
      <h2 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, color: "#16a34a" }}>{r.nomePopular}</h2>
      {r.nomeCientifico && <p style={{ margin: "2px 0 0", fontSize: 15, fontStyle: "italic", color: "#374151" }}>{r.nomeCientifico}</p>}
      <span style={{ display: "inline-block", marginTop: 12, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999 }}>
        {rotuloConfianca[r.confianca]}
      </span>
      {r.descricao && (
        <>
          <h3 style={{ margin: "18px 0 4px", fontSize: 15, fontWeight: 700, color: "#111" }}>Por quê</h3>
          <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{r.descricao}</p>
        </>
      )}
      <p style={{ margin: "18px 0 0", fontSize: 12, color: "#6b7280" }}>Identificação feita por inteligência artificial: pode errar.</p>
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
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: carregando ? "not-allowed" : "pointer",
      opacity: carregando ? 0.6 : 1,
      background: primario ? "#16a34a" : "#fff",
      color: primario ? "#fff" : "#16a34a",
      border: "1px solid #16a34a",
    }) as const;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        .botao-voltar { background: rgba(255,255,255,0.15); transition: background 0.2s; }
        .botao-voltar:hover { background: rgba(255,255,255,0.25); }
        .campo-foto:focus-within { outline: 2px solid #15803d; outline-offset: 2px; }
      `}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(21,128,61,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: ehMobile ? "0 16px" : "0 24px", height: ehMobile ? 56 : 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ehMobile ? 10 : 16 }}>
            <Link
              href="/"
              aria-label="Voltar"
              className="botao-voltar"
              style={{ border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: ehMobile ? "6px 10px" : "6px 14px", color: "#fff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, minHeight: 44, textDecoration: "none" }}
            >
              <i className="fas fa-arrow-left" style={{ fontSize: 12 }} />
              {!ehMobile && <span>Voltar</span>}
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" style={{ height: ehMobile ? 28 : 36 }} />
              {!ehMobile && <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>EcoMapBrasil</span>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: ehMobile ? "6px 10px" : "6px 14px" }}>
            <i className="fas fa-camera" style={{ color: "#bbf7d0", fontSize: 13 }} />
            {!ehMobile && <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Identificar por foto</span>}
          </div>
        </div>
      </header>

      <main>
        <div style={{ background: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)", padding: ehMobile ? "36px 20px" : "56px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#86efac", textTransform: "uppercase", marginBottom: 10 }}>Inteligência artificial</p>
          <h1 style={{ fontSize: ehMobile ? "clamp(22px, 6vw, 30px)" : "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#fff", maxWidth: 700, margin: "0 auto 14px", lineHeight: 1.2 }}>Que animal é esse?</h1>
          <p style={{ fontSize: ehMobile ? 14 : 16, color: "#bbf7d0", maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>Tire uma foto e a inteligência artificial do Google diz que animal é.</p>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: ehMobile ? "24px 16px 48px" : "40px 24px 64px", display: "flex", flexDirection: "column", gap: 18 }}>
          {usuario === undefined ? (
            <p role="status" style={{ textAlign: "center", color: "#6b7280", fontSize: 14 }}>
              Carregando...
            </p>
          ) : usuario === null ? (
            <div style={{ ...cartao, textAlign: "center" }}>
              <i className="fas fa-lock" style={{ color: "#16a34a", fontSize: 28 }} />
              <p style={{ margin: "12px 0 16px", fontSize: 15, color: "#374151" }}>Entre na sua conta para identificar animais por foto.</p>
              <button type="button" onClick={abrirLogin} style={{ ...botao(true), flex: "none", display: "inline-flex", padding: "0 28px" }}>
                <i className="fas fa-sign-in-alt" /> Entrar
              </button>
            </div>
          ) : (
            <>
              {/* O nível gratuito do Gemini permite ao Google usar o que é enviado;
                  quem manda a foto precisa saber disso antes. */}
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                A foto é enviada ao Gemini, do Google, que pode usá-la para melhorar os serviços dele. Não envie fotos de pessoas.
              </p>

              <div style={{ display: "flex", gap: 12, flexDirection: ehMobile ? "column" : "row" }}>
                {/* `capture` abre a câmera direto no celular; no computador vira um seletor de arquivo comum. */}
                <label className="campo-foto" style={botao(true)}>
                  <i className="fas fa-camera" /> Tirar foto
                  <input type="file" accept="image/*" capture="environment" disabled={carregando} onChange={escolher} style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />
                </label>
                <label className="campo-foto" style={botao(false)}>
                  <i className="fas fa-images" /> Escolher imagem
                  <input type="file" accept="image/*" disabled={carregando} onChange={escolher} style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />
                </label>
              </div>

              {previa && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previa} alt="Foto enviada" style={{ width: "100%", maxHeight: 380, objectFit: "cover", borderRadius: 16 }} />
              )}

              <div aria-live="polite" style={{ display: "contents" }}>
                {carregando && (
                  <div role="status" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "8px 0" }}>
                    <div style={{ width: 36, height: 36, border: "4px solid rgba(22,163,74,0.2)", borderTop: "4px solid #16a34a", borderRadius: "50%", animation: "girar 0.8s linear infinite" }} />
                    <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Procurando o animal... pode levar alguns segundos.</p>
                  </div>
                )}

                {erro && (
                  <div role="alert" style={{ padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, color: "#dc2626", fontSize: 14 }}>
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
