"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/componentes/autenticacao/ProvedorAuth";
import { CabecalhoInterno } from "@/componentes/comum/CabecalhoInterno";
import { useLarguraJanela } from "@/componentes/comum/ganchos";
import { declarouMaioridade, registrarMaioridade } from "@/lib/idade";
import { ErroIdentificacao, identificar } from "@/lib/identificacao";
import { identificacaoVazia, rotuloConfianca, type Identificacao } from "@/tipos/identificacao";

// Porte da aba Fotos do app Flutter (fotos_screen.dart).
//
// Exige login: cada consulta gasta a cota do projeto no Gemini, e a Edge Function
// recusa quem não manda um ID token do Firebase.
//
// Exige também a autodeclaração de 18 anos ou mais (11/11/2026), pedida na primeira
// vez que a pessoa clica em "Tirar foto" ou "Escolher imagem": os termos da Gemini API
// não aceitam uso por menores (src/lib/idade.ts).

const cartao = { background: "var(--branco)", border: "1px solid var(--linha)", borderRadius: "var(--raio)", padding: 24 } as const;

type Origem = "camera" | "galeria";

// Os campos de arquivo ficam sempre na página, fora da vista: o "Tenho 18 anos ou mais"
// abre o seletor no mesmo clique, e o navegador só abre o seletor com um gesto da pessoa.
const campoEscondido = { position: "absolute", top: 0, left: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" } as const;

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
  // O botão clicado antes de a pessoa dizer a idade: com valor, a pergunta aparece no
  // lugar dos botões, e o "sim" abre essa origem.
  const [perguntando, setPerguntando] = useState<Origem | null>(null);
  // Respondeu que tem menos de 18 nesta visita: os botões ficam desligados.
  const [menor, setMenor] = useState(false);
  const campoCamera = useRef<HTMLInputElement>(null);
  const campoGaleria = useRef<HTMLInputElement>(null);
  const tituloPergunta = useRef<HTMLHeadingElement>(null);

  // A página continua montada quando a conta muda (sair e entrar com outra), então o
  // estado da conta anterior sai: o "não" dela, a pergunta pela metade, e a foto e o
  // resultado, que num computador compartilhado ficariam à vista de outra pessoa
  // (revisão do Codex de 11/11/2026). É o ajuste de estado durante a renderização,
  // sem efeito: a tela da conta nova nunca aparece com o estado da anterior.
  const uid = usuario?.uid ?? null;
  const [uidDoEstado, setUidDoEstado] = useState(uid);
  if (uid !== uidDoEstado) {
    setUidDoEstado(uid);
    setPrevia(null);
    setResultado(null);
    setErro("");
    setCarregando(false);
    setPerguntando(null);
    setMenor(false);
  }
  // A conta da tela agora, para a resposta que chega depois da troca ser descartada.
  const uidAtual = useRef(uid);
  useEffect(() => {
    uidAtual.current = uid;
  }, [uid]);

  // A prévia é uma URL `blob:` que ocupa memória até ser revogada.
  useEffect(() => {
    if (!previa) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  // A pergunta aparece no lugar do botão que estava com o foco: o foco vai para ela.
  useEffect(() => {
    if (perguntando) tituloPergunta.current?.focus();
  }, [perguntando]);

  function abrir(origem: Origem) {
    (origem === "camera" ? campoCamera : campoGaleria).current?.click();
  }

  function tentar(origem: Origem) {
    if (!usuario) return;
    if (declarouMaioridade(usuario.uid)) abrir(origem);
    else setPerguntando(origem);
  }

  function responder(maior: boolean) {
    const origem = perguntando;
    if (!origem || !usuario) return;
    setPerguntando(null);
    setMenor(!maior);
    if (!maior) return;
    registrarMaioridade(usuario.uid);
    abrir(origem);
  }

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    // Limpa o campo: escolher a mesma foto de novo também dispara o `change`.
    e.target.value = "";
    if (!arquivo || !usuario) return;

    const dono = usuario.uid;
    setPrevia(URL.createObjectURL(arquivo));
    setResultado(null);
    setErro("");
    setCarregando(true);
    try {
      const r = await identificar(arquivo, usuario);
      if (uidAtual.current === dono) setResultado(r);
    } catch (falha) {
      if (uidAtual.current === dono) setErro(falha instanceof ErroIdentificacao ? falha.message : "Algo deu errado. Verifique sua internet e tente de novo.");
      if (!(falha instanceof ErroIdentificacao)) console.error("Identificação falhou:", falha);
    } finally {
      if (uidAtual.current === dono) setCarregando(false);
    }
  }

  const desligado = carregando || menor;
  const botao = (primario: boolean) =>
    ({
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 48,
      borderRadius: "var(--raio)",
      fontSize: 16,
      fontWeight: 600,
      cursor: desligado ? "not-allowed" : "pointer",
      opacity: desligado ? 0.6 : 1,
      background: primario ? "var(--mata)" : "var(--branco)",
      color: primario ? "var(--branco)" : "var(--mata)",
      border: "1px solid var(--mata)",
    }) as const;

  return (
    <div style={{ background: "var(--papel)", minHeight: "100vh" }}>
      <style>{`
        .botao-foto:focus-visible { outline: 2px solid var(--mata); outline-offset: 2px; }
        .titulo-pergunta:focus { outline: none; }
      `}</style>

      <CabecalhoInterno titulo="Identificar por foto" ehMobile={ehMobile} />

      <main>
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto", padding: ehMobile ? "36px 16px 56px" : "64px 24px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
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
                  quem manda a foto precisa saber disso antes. E os termos do Gemini
                  exigem 18 anos (vistos em 02/11/2026). */}
              <p style={{ margin: 0, fontSize: 15, color: "var(--tinta-3)" }}>
                Só para maiores de 18 anos. A foto é enviada ao Gemini, do Google, que pode usá-la para melhorar os serviços dele. Não envie fotos de pessoas.{" "}
                <Link href="/privacidade#compartilhamento" className="link">
                  Como tratamos a foto
                </Link>
              </p>

              {/* `capture` abre a câmera direto no celular; no computador vira um seletor de arquivo comum. */}
              <input ref={campoCamera} type="file" accept="image/*" capture="environment" onChange={escolher} tabIndex={-1} aria-hidden="true" style={campoEscondido} />
              <input ref={campoGaleria} type="file" accept="image/*" onChange={escolher} tabIndex={-1} aria-hidden="true" style={campoEscondido} />

              {perguntando ? (
                <div style={cartao}>
                  <h2 ref={tituloPergunta} tabIndex={-1} className="titulo-pergunta" style={{ margin: "0 0 8px", fontSize: 22 }}>
                    Você tem 18 anos ou mais?
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: 16, color: "var(--tinta-2)" }}>A identificação por foto usa o Gemini, do Google, e os termos dele só permitem o uso por quem tem 18 anos ou mais.</p>
                  <div style={{ display: "flex", gap: 12, flexDirection: ehMobile ? "column" : "row" }}>
                    <button type="button" onClick={() => responder(true)} className="botao botao-cheio">
                      Tenho 18 anos ou mais
                    </button>
                    <button type="button" onClick={() => responder(false)} className="botao botao-contorno">
                      Tenho menos de 18
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {menor && (
                    <div role="status" style={cartao}>
                      <p style={{ margin: 0, fontSize: 16, color: "var(--tinta-2)" }}>A identificação por foto é só para quem tem 18 anos ou mais, por exigência do Google. O mapa, as espécies e o resto do EcoMapBrasil continuam abertos para você.</p>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12, flexDirection: ehMobile ? "column" : "row" }}>
                    <button type="button" className="botao-foto" disabled={desligado} onClick={() => tentar("camera")} style={botao(true)}>
                      <i className="fas fa-camera" aria-hidden="true" /> Tirar foto
                    </button>
                    <button type="button" className="botao-foto" disabled={desligado} onClick={() => tentar("galeria")} style={botao(false)}>
                      <i className="fas fa-images" aria-hidden="true" /> Escolher imagem
                    </button>
                  </div>
                </>
              )}

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
