"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/componentes/autenticacao/ProvedorAuth";
import { Avaliacoes } from "@/componentes/avaliacoes/Avaliacoes";
import { Contador, Revelar } from "@/componentes/comum/efeitos";
import { ImagemComReserva } from "@/componentes/comum/ImagemComReserva";
import { fotoConfiavel } from "@/lib/avatar";
import { corDoStatus } from "@/dados/animais";
import { animaisDestaque, dadosAtualizadosEm, equipe, linksNavegacao, numeros, slides, solucoes, ultimoPeriodo } from "@/dados/inicio";

import { BarrasAnimadas, LinhaDoTempo, UltimoPeriodo } from "./Graficos";
import { MapaBiomas } from "./MapaBiomas";

// Porte da Home.jsx. Estilos inline como no original; o que precisa de :hover ou de
// media query fica no <style> abaixo. Cores e fontes vêm das variáveis do globals.css.
//
// Ritmo da página: foto em tela cheia, faixa escura com os números, mapa no papel,
// foto com uma frase, espécies, dados, soluções no escuro, avaliações e a chamada
// final sobre foto. Alternar claro e escuro é o que dá impacto sem enfeite.

const DURACAO_SLIDE = 6000;

const CSS = `
  .nav-link { background: none; border: none; cursor: pointer; color: var(--tinta-2); font-size: 15px; padding: 6px 0; transition: color 0.15s; }
  .nav-link:hover { color: var(--mata); }
  .cabecalho-foto .nav-link { color: rgba(255,253,248,0.85); }
  .cabecalho-foto .nav-link:hover { color: var(--branco); }
  .animal-card img { transition: transform 0.6s ease; }
  .animal-card:hover img { transform: scale(1.05); }
  .seta-hero { transition: background 0.15s; background: rgba(0,0,0,0.25); }
  .seta-hero:hover { background: rgba(0,0,0,0.5); }
  .botao-claro { background: var(--branco); color: var(--tinta); }
  .botao-claro:hover { background: var(--papel-2); }
  .botao-vazado { background: transparent; color: var(--branco); border-color: rgba(255,253,248,0.5) !important; }
  .botao-vazado:hover { background: rgba(255,253,248,0.12); }
  .botao-grande { padding: 15px 28px; font-size: 17px; }
  .link-rodape { color: rgba(255,253,248,0.7); transition: color 0.15s; }
  .link-rodape:hover { color: var(--branco); }
  .voltar-topo { transition: background 0.15s; background: var(--branco); }
  .voltar-topo:hover { background: var(--papel-2); }
  .hidden-mobile { display: flex; }
  .show-mobile { display: none !important; }

  @keyframes encher { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes descer { 0%, 100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(6px); opacity: 1; } }

  /* Fundo parado enquanto o texto rola por cima. Só onde há mouse: no iOS o
     background-attachment: fixed não funciona e a foto ficava ampliada demais. */
  .foto-fixa { background-attachment: scroll; }
  @media (hover: hover) and (min-width: 861px) {
    .foto-fixa { background-attachment: fixed; }
  }

  @media (max-width: 860px) {
    .hidden-mobile { display: none !important; }
    .show-mobile { display: block !important; }
    .duas-colunas { grid-template-columns: 1fr !important; gap: 40px !important; }
  }

  @media (max-width: 768px) {
    .seta-hero, .rolar-hero { display: none !important; }
    .section-pad { padding: 64px 20px !important; }
    .numeros-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
    .animals-grid { grid-template-columns: 1fr !important; }
    .solutions-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .footer-bottom { flex-direction: column !important; }
  }

  @media (max-width: 480px) {
    .footer-grid { grid-template-columns: 1fr !important; }
  }
`;

const larguraMaxima = { maxWidth: 1120, margin: "0 auto" } as const;
const tituloSecao = { fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 18, letterSpacing: "-0.02em", lineHeight: 1.05 } as const;
const introSecao = { fontSize: 19, color: "var(--tinta-2)", maxWidth: 580 } as const;
const textoClaro = "rgba(255,253,248,0.78)";

function Cabecalho() {
  const { usuario, abrirLogin, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const [rolou, setRolou] = useState(false);

  // Transparente sobre a foto de abertura; ganha o fundo de papel quando a página rola.
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);
  const sobreFoto = !rolou && !menuAberto;

  const irPara = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuAberto(false);
  };

  const itemMenuMobile = { display: "block", background: "none", border: "none", fontSize: 17, padding: "12px 0", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--tinta)" } as const;

  return (
    <header
      className={sobreFoto ? "cabecalho-foto" : undefined}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: sobreFoto ? "transparent" : "color-mix(in srgb, var(--papel) 94%, transparent)",
        backdropFilter: sobreFoto ? "none" : "blur(8px)",
        borderBottom: `1px solid ${sobreFoto ? "transparent" : "var(--linha)"}`,
        transition: "background 0.3s, border-color 0.3s",
      }}
    >
      <div style={{ ...larguraMaxima, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" style={{ height: 34, width: "auto" }} />
          <span style={{ fontFamily: "var(--fonte-titulo)", fontSize: 20, color: sobreFoto ? "var(--branco)" : "var(--tinta)", transition: "color 0.3s" }}>EcoMapBrasil</span>
        </div>
        <nav aria-label="Seções da página" style={{ gap: 28, alignItems: "center" }} className="hidden-mobile">
          {linksNavegacao.map(([id, rotulo]) => (
            <button key={id} type="button" className="nav-link" onClick={() => irPara(id)}>
              {rotulo}
            </button>
          ))}
          {/* Enquanto o Firebase não responde, o espaço fica vazio em vez de piscar "Entrar". */}
          {usuario === undefined ? null : usuario ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 20, borderLeft: `1px solid ${sobreFoto ? "rgba(255,253,248,0.3)" : "var(--linha)"}` }}>
              {fotoConfiavel(usuario.photoURL) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoConfiavel(usuario.photoURL)} alt="" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
              )}
              <span style={{ fontSize: 14, color: sobreFoto ? "var(--branco)" : "var(--tinta-2)" }}>{usuario.displayName || usuario.email}</span>
              <button type="button" onClick={() => void sair()} className="nav-link" style={{ fontSize: 14 }}>
                Sair
              </button>
            </div>
          ) : (
            <button type="button" onClick={abrirLogin} className={`botao ${sobreFoto ? "botao-vazado" : "botao-contorno"}`} style={{ padding: "6px 16px", fontSize: 14 }}>
              Entrar
            </button>
          )}
        </nav>
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          style={{ background: "none", border: "none", color: sobreFoto ? "var(--branco)" : "var(--tinta)", fontSize: 20, cursor: "pointer", minWidth: 44, minHeight: 44 }}
          className="show-mobile"
        >
          <i className={`fas ${menuAberto ? "fa-times" : "fa-bars"}`} />
        </button>
      </div>
      {menuAberto && (
        <div style={{ background: "var(--papel)", borderTop: "1px solid var(--linha)", padding: "8px 24px 16px" }}>
          {linksNavegacao.map(([id, rotulo]) => (
            <button key={id} type="button" onClick={() => irPara(id)} style={itemMenuMobile}>
              {rotulo}
            </button>
          ))}
          {usuario === undefined ? null : usuario ? (
            <button
              type="button"
              onClick={() => {
                void sair();
                setMenuAberto(false);
              }}
              style={{ ...itemMenuMobile, color: "var(--tinta-3)" }}
            >
              Sair
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                abrirLogin();
                setMenuAberto(false);
              }}
              style={{ ...itemMenuMobile, color: "var(--mata)", fontWeight: 600 }}
            >
              Entrar
            </button>
          )}
        </div>
      )}
    </header>
  );
}

function Slideshow() {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const timer = setInterval(() => setAtual((a) => (a + 1) % slides.length), DURACAO_SLIDE);
    return () => clearInterval(timer);
  }, [pausado, atual]);

  const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const setaEstilo = { position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 3, border: "none", borderRadius: "50%", width: 44, height: 44, color: "#fff", cursor: "pointer", fontSize: 14 } as const;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Espécies ameaçadas"
      // Fundo escuro por baixo das fotos: se o Supabase não responder, o texto claro
      // continua legível em vez de ficar sobre fundo branco.
      style={{ position: "relative", height: "100svh", minHeight: 560, background: "var(--mata-noite)", overflow: "hidden" }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.url}
          role="img"
          aria-label={s.rotulo}
          aria-hidden={atual !== i}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${s.url}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: atual === i ? 1 : 0,
            // Zoom lento na foto da vez. A que sai só volta ao tamanho depois de sumir.
            transform: atual === i ? "scale(1.08)" : "scale(1)",
            transition: atual === i ? `opacity 1.2s ease-in-out, transform ${DURACAO_SLIDE + 1500}ms ease-out` : "opacity 1.2s ease-in-out, transform 0s 1.2s",
          }}
        />
      ))}
      {/* Escurece o topo (para o cabeçalho) e a base (para o texto); o meio aparece inteiro. */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(16,24,18,0.55) 0%, rgba(16,24,18,0) 22%, rgba(16,24,18,0) 40%, rgba(16,24,18,0.88) 100%)" }} />
      <div style={{ position: "relative", zIndex: 2, height: "100%", ...larguraMaxima, padding: "88px 24px 104px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {/* O tamanho acompanha também a altura da tela: em notebook baixo, 8vw empurrava o título para baixo do cabeçalho. */}
        <h1 style={{ fontSize: "clamp(36px, min(8vw, 12.5vh), 108px)", color: "var(--branco)", margin: "0 0 24px", maxWidth: 980, fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 0.98, textShadow: "0 2px 30px rgba(16,24,18,0.35)" }}>
          O desmatamento no Brasil é{" "}
          <em style={{ fontStyle: "italic", textDecoration: "underline", textDecorationColor: "var(--sol)", textDecorationThickness: "0.07em", textUnderlineOffset: "0.12em" }}>maior</em> do que você imagina
        </h1>
        <p style={{ fontSize: "clamp(18px, 2vw, 22px)", color: "rgba(255,253,248,0.88)", marginBottom: 36, maxWidth: 580 }}>
          Veja onde a floresta está sendo perdida e quais espécies estão ficando sem lugar para viver.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/mapa" className="botao botao-claro botao-grande">
            Abrir o mapa <i className="fas fa-arrow-right" aria-hidden="true" style={{ fontSize: 14 }} />
          </Link>
          <button type="button" className="botao botao-vazado botao-grande" onClick={() => irPara("animais")}>
            Espécies ameaçadas
          </button>
        </div>
      </div>

      <button type="button" aria-label="Foto anterior" className="seta-hero" onClick={() => setAtual((a) => (a - 1 + slides.length) % slides.length)} style={{ ...setaEstilo, left: 16 }}>
        <i className="fas fa-chevron-left" />
      </button>
      <button type="button" aria-label="Próxima foto" className="seta-hero" onClick={() => setAtual((a) => (a + 1) % slides.length)} style={{ ...setaEstilo, right: 16 }}>
        <i className="fas fa-chevron-right" />
      </button>

      {/* Indicadores que se enchem até a próxima foto, com o nome do animal da vez. */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 36, zIndex: 3 }}>
        <div style={{ ...larguraMaxima, padding: "0 24px", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {slides.map((s, i) => (
              <button
                key={s.url}
                type="button"
                aria-label={`Mostrar ${s.rotulo}`}
                aria-current={atual === i}
                onClick={() => setAtual(i)}
                style={{ width: 40, height: 20, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
              >
                <span style={{ display: "block", width: "100%", height: 2, background: "rgba(255,253,248,0.3)", position: "relative", overflow: "hidden" }}>
                  {atual === i && (
                    <span
                      key={atual}
                      style={{ position: "absolute", inset: 0, background: "var(--branco)", transformOrigin: "left", animation: `encher ${DURACAO_SLIDE}ms linear both`, animationPlayState: pausado ? "paused" : "running" }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <p aria-hidden="true" style={{ fontSize: 15, color: "rgba(255,253,248,0.85)", fontStyle: "italic" }}>
            {slides[atual]?.rotulo}
          </p>
          <button type="button" className="rolar-hero" onClick={() => irPara("numeros")} aria-label="Rolar para o conteúdo" style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--branco)", fontSize: 18, cursor: "pointer", minWidth: 44, minHeight: 44, animation: "descer 2s ease-in-out infinite" }}>
            <i className="fas fa-arrow-down" />
          </button>
        </div>
      </div>
    </section>
  );
}

function BotaoCompartilhar() {
  const [copiado, setCopiado] = useState(false);
  async function compartilhar() {
    const dados = { title: "EcoMapBrasil", text: "O desmatamento no Brasil é maior do que você imagina.", url: window.location.origin };
    try {
      if (navigator.share) {
        await navigator.share(dados);
      } else {
        await navigator.clipboard.writeText(dados.url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }
    } catch {
      // Compartilhamento cancelado: nada a fazer.
    }
  }
  // No React o botão não fazia nada ao ser clicado.
  return (
    <button type="button" className="botao botao-claro botao-grande" onClick={compartilhar}>
      <i className={`fas ${copiado ? "fa-check" : "fa-share-alt"}`} aria-hidden="true" /> {copiado ? "Link copiado" : "Compartilhar"}
    </button>
  );
}

function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > 600);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);
  if (!visivel) return null;
  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      className="voltar-topo"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{ position: "fixed", bottom: 24, right: 24, width: 44, height: 44, borderRadius: "50%", color: "var(--tinta)", border: "1px solid var(--linha)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40, boxShadow: "0 2px 10px rgba(29,38,32,0.12)" }}
    >
      <i className="fas fa-arrow-up" />
    </button>
  );
}

/** Faixa de foto de ponta a ponta com uma frase só. */
function FaixaDeFoto({ foto, posicao = "center", children }: { foto: string; posicao?: string; children: React.ReactNode }) {
  return (
    <section className="foto-fixa" style={{ position: "relative", minHeight: "min(85vh, 760px)", display: "flex", alignItems: "flex-end", backgroundImage: `url('${foto}')`, backgroundSize: "cover", backgroundPosition: posicao, backgroundColor: "var(--mata-noite)" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,24,18,0.9) 0%, rgba(16,24,18,0.4) 50%, rgba(16,24,18,0.15) 100%)" }} />
      <div className="section-pad" style={{ position: "relative", width: "100%", padding: "96px 24px" }}>
        <div style={larguraMaxima}>{children}</div>
      </div>
    </section>
  );
}

export function Inicio() {
  const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const mico = slides.find((s) => s.rotulo === "Mico-leão-dourado") ?? slides[0]!;
  const lobo = slides.find((s) => s.rotulo === "Lobo-guará") ?? slides[0]!;

  return (
    <div style={{ background: "var(--papel)" }}>
      <style>{CSS}</style>

      <Cabecalho />

      <main>
        <Slideshow />

        {/* ── NÚMEROS ── */}
        <section id="numeros" className="section-pad" style={{ background: "var(--mata-noite)", padding: "112px 24px" }}>
          <div style={larguraMaxima}>
            <Revelar>
              <h2 style={{ ...tituloSecao, color: "var(--branco)", maxWidth: 640, marginBottom: 64 }}>O tamanho do problema, em quatro números</h2>
            </Revelar>
            <dl className="numeros-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "64px 72px" }}>
              {numeros.map((n, i) => (
                // No <dl> o termo vem antes do valor; column-reverse põe o número em cima.
                <Revelar key={n.valor} atraso={i * 120} style={{ borderTop: "2px solid var(--sol)", paddingTop: 20, display: "flex", flexDirection: "column-reverse", justifyContent: "flex-end" }}>
                  <dt style={{ fontSize: 18, color: textoClaro, maxWidth: 320 }}>{n.rotulo}</dt>
                  <dd style={{ fontFamily: "var(--fonte-titulo)", fontSize: "clamp(52px, 8vw, 104px)", color: "var(--branco)", lineHeight: 1, marginBottom: 14, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                    <Contador valor={n.valor} />
                  </dd>
                </Revelar>
              ))}
            </dl>
          </div>
        </section>

        {/* ── MAPA ── */}
        <section id="mapa" className="section-pad" style={{ padding: "120px 24px" }}>
          <div className="duas-colunas" style={{ ...larguraMaxima, display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 72, alignItems: "center" }}>
            <Revelar>
              <h2 style={tituloSecao}>Seis biomas, seis histórias de perda</h2>
              <p style={{ ...introSecao, marginBottom: 16 }}>
                O mapa interativo junta os alertas de desmatamento do DETER-B ao limite oficial de cada bioma, do IBGE.
              </p>
              <p style={{ ...introSecao, marginBottom: 32 }}>Escolha um bioma na lista para ir até ele e ver quanto já foi desmatado.</p>
              <Link href="/mapa" className="botao botao-cheio botao-grande">
                Abrir o mapa interativo <i className="fas fa-arrow-right" aria-hidden="true" style={{ fontSize: 14 }} />
              </Link>
            </Revelar>
            <MapaBiomas />
          </div>
        </section>

        {/* ── FRASE SOBRE FOTO ── */}
        <FaixaDeFoto foto={mico.url} posicao="center 30%">
          <Revelar>
            <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "clamp(34px, 5.5vw, 72px)", lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--branco)", maxWidth: 900 }}>
              Restam cerca de <span style={{ color: "var(--sol)" }}>2.500</span> micos-leões-dourados na natureza.
            </p>
            <p style={{ fontSize: 18, color: textoClaro, marginTop: 20 }}>Mico-leão-dourado, Mata Atlântica</p>
          </Revelar>
        </FaixaDeFoto>

        {/* ── ANIMAIS ── */}
        <section id="animais" className="section-pad" style={{ background: "var(--papel-2)", padding: "120px 24px" }}>
          <div style={larguraMaxima}>
            <Revelar>
              <h2 style={tituloSecao}>Espécies ameaçadas</h2>
              <p style={{ ...introSecao, marginBottom: 56 }}>Seis animais que estão perdendo o lugar onde vivem, e quanto a população de cada um já caiu.</p>
            </Revelar>
            <div className="animals-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "56px 32px" }}>
              {animaisDestaque.map((a, i) => (
                <Revelar key={a.nome} atraso={(i % 3) * 120}>
                  <article className="animal-card">
                    <div style={{ position: "relative", aspectRatio: "4 / 5", overflow: "hidden", borderRadius: "var(--raio)", marginBottom: 18, background: "var(--linha)" }}>
                      <ImagemComReserva src={a.imagem} alt={a.nome} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      {/* A queda da população em destaque, sobre a própria foto. */}
                      <div style={{ position: "absolute", inset: "auto 0 0 0", padding: "48px 18px 16px", background: "linear-gradient(to top, rgba(16,24,18,0.85), rgba(16,24,18,0))", display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontFamily: "var(--fonte-titulo)", fontSize: 44, lineHeight: 1, color: "var(--branco)" }}>{a.populacao.replace("-", "−")}</span>
                        <span style={{ fontSize: 15, color: textoClaro }}>da população</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: corDoStatus[a.status], marginBottom: 4 }}>{a.status}</p>
                    <h3 style={{ fontSize: 26, marginBottom: 8 }}>{a.nome}</h3>
                    <p style={{ fontSize: 16, color: "var(--tinta-2)", marginBottom: 8 }}>{a.descricao}</p>
                    <p style={{ fontSize: 14, color: "var(--tinta-3)" }}>{a.bioma}</p>
                  </article>
                </Revelar>
              ))}
            </div>
            <p style={{ marginTop: 56, display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href="/animais" className="botao botao-cheio botao-grande">
                Ver todas as espécies
              </Link>
              <Link href="/fotos" className="botao botao-contorno botao-grande">
                <i className="fas fa-camera" aria-hidden="true" /> Identificar um animal por foto
              </Link>
            </p>
          </div>
        </section>

        {/* ── DADOS ── */}
        <section id="dados" className="section-pad" style={{ padding: "120px 24px" }}>
          <div style={larguraMaxima}>
            <Revelar>
              <h2 style={tituloSecao}>Como o desmatamento avançou</h2>
              <p style={{ ...introSecao, marginBottom: 56 }}>Área já desmatada em cada bioma e os anos que marcaram essa história.</p>
            </Revelar>
            <div className="duas-colunas" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 72 }}>
              <Revelar>
                <h3 style={{ fontSize: 24, marginBottom: 24 }}>Área desmatada por bioma</h3>
                <BarrasAnimadas />
                <h3 style={{ fontSize: 24, margin: "56px 0 6px" }}>Desmatado no último ano medido</h3>
                <p style={{ fontSize: 15, color: "var(--tinta-3)", marginBottom: 20 }}>De {ultimoPeriodo.rotulo}</p>
                <UltimoPeriodo />
              </Revelar>
              <Revelar atraso={150}>
                <h3 style={{ fontSize: 24, marginBottom: 24 }}>Linha do tempo</h3>
                <LinhaDoTempo />
              </Revelar>
            </div>
            <p style={{ fontSize: 14, color: "var(--tinta-3)", marginTop: 40 }}>
              Desmatamento: PRODES/INPE, pelo{" "}
              <a href="https://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/cerrado/increments" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                TerraBrasilis
              </a>
              , atualizado em {dadosAtualizadosEm}. Área dos biomas: IBGE (2019). Na linha do tempo, as taxas são as oficiais da Amazônia Legal.
            </p>
          </div>
        </section>

        {/* ── SOLUÇÕES ── */}
        <section id="solucoes" className="section-pad" style={{ background: "var(--mata-escura)", padding: "120px 24px" }}>
          <div style={larguraMaxima}>
            <Revelar>
              <h2 style={{ ...tituloSecao, color: "var(--branco)" }}>O que dá para fazer</h2>
              <p style={{ ...introSecao, color: textoClaro, marginBottom: 64 }}>Ninguém resolve isso sozinho, mas cada uma destas atitudes conta.</p>
            </Revelar>
            <ol className="solutions-grid" style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "56px 48px" }}>
              {solucoes.map((s, i) => (
                <li key={s.titulo}>
                  <Revelar atraso={(i % 3) * 120}>
                    <span style={{ display: "block", fontFamily: "var(--fonte-titulo)", fontSize: 56, lineHeight: 1, color: "var(--sol)", marginBottom: 16 }}>{String(i + 1).padStart(2, "0")}</span>
                    <h3 style={{ fontSize: 24, color: "var(--branco)", margin: "0 0 10px" }}>{s.titulo}</h3>
                    <p style={{ fontSize: 16, color: textoClaro }}>{s.texto}</p>
                  </Revelar>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── AVALIAÇÕES ── */}
        <div id="avaliacoes">
          <Avaliacoes />
        </div>

        {/* ── CHAMADA ── */}
        <FaixaDeFoto foto={lobo.url}>
          <Revelar>
            <h2 style={{ ...tituloSecao, fontSize: "clamp(40px, 7vw, 88px)", color: "var(--branco)", maxWidth: 800 }}>Passe adiante.</h2>
            <p style={{ color: "rgba(255,253,248,0.85)", fontSize: 20, maxWidth: 560, marginBottom: 36 }}>Quanto mais gente souber o tamanho do problema, mais difícil fica ignorá-lo.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <BotaoCompartilhar />
              {/* No React o link apontava para um .zip que não existia no site. */}
              <a href="/alertas-desmatamento.json" download="alertas-desmatamento-deter-b.json" className="botao botao-vazado botao-grande">
                <i className="fas fa-download" aria-hidden="true" /> Baixar os dados
              </a>
            </div>
          </Revelar>
        </FaixaDeFoto>
      </main>

      <Rodape aoIrPara={irPara} />
      <VoltarAoTopo />
    </div>
  );
}

function Rodape({ aoIrPara }: { aoIrPara: (id: string) => void }) {
  const tituloColuna = { fontSize: 14, fontWeight: 600, color: "var(--branco)", marginBottom: 12, fontFamily: "var(--fonte-texto)" } as const;
  const nomes = equipe.map((m) => m.nome);
  return (
    <footer id="equipe" style={{ background: "var(--mata-noite)", color: "rgba(255,253,248,0.7)", padding: "64px 24px 32px", fontSize: 15 }}>
      <div style={larguraMaxima}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" style={{ height: 28 }} />
              <span style={{ fontFamily: "var(--fonte-titulo)", fontSize: 19, color: "var(--branco)" }}>EcoMapBrasil</span>
            </div>
            {/* A equipe era uma seção com cartões de ícone genérico; o nome de cada um basta. */}
            <p style={{ lineHeight: 1.6, maxWidth: 320 }}>
              Feito por {nomes.slice(0, -1).join(", ")} e {nomes.at(-1)}, no Projeto Interdisciplinar da FATEC.
            </p>
          </div>
          <div>
            <h3 style={tituloColuna}>No site</h3>
            {[
              ["mapa", "Mapa"],
              ["animais", "Espécies ameaçadas"],
              ["dados", "Dados"],
              ["solucoes", "Como ajudar"],
            ].map(([id, rotulo]) => (
              <button key={id} type="button" className="link-rodape" onClick={() => aoIrPara(id)} style={{ display: "block", background: "none", border: "none", fontSize: 15, padding: "4px 0", cursor: "pointer", textAlign: "left" }}>
                {rotulo}
              </button>
            ))}
          </div>
          <div>
            <h3 style={tituloColuna}>Para ler mais</h3>
            {[
              ["https://alerta.mapbiomas.org/relatorio/", "Relatórios do MapBiomas"],
              ["https://g1.globo.com/busca/?q=desmatamento", "Notícias"],
              ["https://www.ibflorestas.org.br/conteudo/leis-ambientais", "Legislação"],
            ].map(([href, rotulo]) => (
              <a key={rotulo} href={href} target="_blank" rel="noopener noreferrer" className="link-rodape" style={{ display: "block", padding: "4px 0", textDecoration: "none" }}>
                {rotulo}
              </a>
            ))}
          </div>
          <div>
            <h3 style={tituloColuna}>Contato</h3>
            <p style={{ padding: "4px 0" }}>Matão, São Paulo</p>
            <a href="https://github.com/ecomap-devs" target="_blank" rel="noopener noreferrer" className="link-rodape" style={{ display: "block", padding: "4px 0", textDecoration: "none" }}>
              github.com/ecomap-devs
            </a>
          </div>
        </div>
        <div className="footer-bottom" style={{ borderTop: "1px solid rgba(255,253,248,0.12)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 13 }}>
          <span>© 2025 EcoMapBrasil</span>
          <span>Dados de fontes públicas: INPE, IBGE e MapBiomas Alerta.</span>
        </div>
      </div>
    </footer>
  );
}
