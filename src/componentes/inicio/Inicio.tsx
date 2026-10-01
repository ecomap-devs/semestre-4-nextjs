"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/componentes/autenticacao/ProvedorAuth";
import { Avaliacoes } from "@/componentes/avaliacoes/Avaliacoes";
import { ImagemComReserva } from "@/componentes/comum/ImagemComReserva";
import { animaisDestaque, comparacaoRegional, equipe, linksNavegacao, numeros, slides, solucoes } from "@/dados/inicio";

import { BarrasAnimadas, GraficoLinha, LinhaDoTempo, Radar, Rosca } from "./Graficos";

// Porte da Home.jsx. Estilos inline como no original; o que precisa de :hover ou de
// media query fica no <style> abaixo, também como no original.

const CSS = `
  .nav-link { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500; padding: 6px 0; transition: color 0.2s; }
  .nav-link:hover, .nav-link:focus-visible { color: #4ade80; }
  .animal-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
  .animal-card:hover { transform: translateY(-8px); box-shadow: 0 24px 40px rgba(0,0,0,0.15); }
  .animal-card img { transition: transform 0.4s ease; }
  .animal-card:hover img { transform: scale(1.05); }
  .solution-card { transition: background 0.2s, transform 0.2s; }
  .solution-card:hover { background: rgba(74,222,128,0.08) !important; transform: translateY(-4px); }
  .team-card { transition: transform 0.2s, box-shadow 0.2s; }
  .team-card:hover { transform: translateY(-6px); box-shadow: 0 16px 32px rgba(0,0,0,0.3); }
  .stat-card { transition: border-color 0.2s, transform 0.2s; }
  .stat-card:hover { border-color: var(--destaque) !important; transform: translateY(-4px); }
  .botao-verde { transition: background 0.2s; background: #16a34a; }
  .botao-verde:hover { background: #15803d; }
  .botao-vidro { transition: background 0.2s; background: rgba(255,255,255,0.1); }
  .botao-vidro:hover { background: rgba(255,255,255,0.2); }
  .botao-contorno { transition: background 0.2s; background: none; }
  .botao-contorno:hover { background: #f0fdf4; }
  .botao-branco { transition: background 0.2s; background: #fff; }
  .botao-branco:hover { background: #f3f4f6; }
  .botao-transparente { transition: background 0.2s; background: none; }
  .botao-transparente:hover { background: rgba(255,255,255,0.08); }
  .link-rodape { transition: color 0.2s; color: #9ca3af; }
  .link-rodape:hover { color: #4ade80; }
  .voltar-topo { transition: background 0.2s, transform 0.2s; background: #16a34a; }
  .voltar-topo:hover { background: #15803d; transform: translateY(-2px); }
  .hidden-mobile { display: flex; }
  .show-mobile { display: none !important; }

  @media (max-width: 768px) {
    .hidden-mobile { display: none !important; }
    .show-mobile { display: block !important; }
    .section-pad { padding: 48px 16px !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .animals-grid { grid-template-columns: 1fr !important; }
    .solutions-grid { grid-template-columns: 1fr !important; }
    .team-grid { grid-template-columns: 1fr 1fr !important; }
    .dados-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .cta-buttons { flex-direction: column !important; align-items: center !important; }
    .footer-bottom { flex-direction: column !important; text-align: center !important; }
    .regional-grid { grid-template-columns: 1fr 1fr !important; }
  }

  @media (max-width: 480px) {
    .section-pad { padding: 36px 12px !important; }
    .stats-grid { grid-template-columns: 1fr !important; }
    .team-grid { grid-template-columns: 1fr 1fr !important; }
    .footer-grid { grid-template-columns: 1fr !important; }
    .regional-grid { grid-template-columns: 1fr !important; }
  }
`;

const rotuloSecao = { fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#16a34a", textTransform: "uppercase", marginBottom: 12 } as const;
const tituloSecao = { fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, color: "#111" } as const;

function Cabecalho() {
  const { usuario, abrirLogin, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  const irPara = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuAberto(false);
  };

  const itemMenuMobile = { display: "block", background: "none", border: "none", fontSize: 15, padding: "10px 0", cursor: "pointer", width: "100%", textAlign: "left" } as const;

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(21,128,61,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" style={{ height: 40, width: "auto" }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>EcoMapBrasil</span>
        </div>
        <nav aria-label="Seções da página" style={{ gap: 32, alignItems: "center" }} className="hidden-mobile">
          {linksNavegacao.map(([id, rotulo]) => (
            <button key={id} type="button" className="nav-link" onClick={() => irPara(id)}>
              {rotulo}
            </button>
          ))}
          {/* Enquanto o Firebase não responde, o espaço fica vazio em vez de piscar "Entrar". */}
          {usuario === undefined ? null : usuario ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {usuario.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={usuario.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "2px solid #4ade80" }} />
              )}
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{usuario.displayName || usuario.email}</span>
              <button type="button" onClick={() => void sair()} className="nav-link" style={{ color: "#fca5a5" }}>
                Sair
              </button>
            </div>
          ) : (
            <button type="button" onClick={abrirLogin} style={{ background: "#4ade80", color: "#14532d", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Entrar
            </button>
          )}
        </nav>
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}
          className="show-mobile"
        >
          <i className={`fas ${menuAberto ? "fa-times" : "fa-bars"}`} />
        </button>
      </div>
      {menuAberto && (
        <div style={{ background: "#166534", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "12px 24px" }}>
          {linksNavegacao.map(([id, rotulo]) => (
            <button key={id} type="button" onClick={() => irPara(id)} style={{ ...itemMenuMobile, color: "#d1d5db" }}>
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
              style={{ ...itemMenuMobile, color: "#fca5a5" }}
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
              style={{ ...itemMenuMobile, color: "#4ade80" }}
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
    const timer = setInterval(() => setAtual((a) => (a + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [pausado, atual]);

  const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const setaEstilo = { position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 3, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%", width: 42, height: 42, color: "#fff", cursor: "pointer", fontSize: 14 } as const;
  const botaoHero = { color: "#fff", borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 } as const;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Espécies ameaçadas"
      // Fundo verde por baixo das fotos: se o Supabase não responder, o texto branco
      // continua legível em vez de ficar sobre fundo branco.
      style={{ position: "relative", height: "calc(100vh - 64px)", background: "#14532d" }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.url}
          role="img"
          aria-label={s.rotulo}
          aria-hidden={atual !== i}
          style={{ position: "absolute", inset: 0, backgroundImage: `url('${s.url}')`, backgroundSize: "cover", backgroundPosition: "center", opacity: atual === i ? 1 : 0, transition: "opacity 1s ease-in-out" }}
        />
      ))}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(5,46,22,0.65) 0%, rgba(0,0,0,0.3) 100%)" }} />
      <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 20, padding: "4px 14px", marginBottom: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
          <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, letterSpacing: 0.5 }}>Monitoramento em tempo real</span>
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#fff", marginBottom: 20, maxWidth: 700, lineHeight: 1.2 }}>O Desmatamento no Brasil é maior do que você imagina</h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 20px)", color: "rgba(255,255,255,0.75)", marginBottom: 36, maxWidth: 560 }}>
          Descubra como a perda de habitat está afetando nossa biodiversidade em todas as regiões do país.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" className="botao-verde" onClick={() => irPara("mapa")} style={{ ...botaoHero, border: "none" }}>
            <i className="fas fa-map-marked-alt" /> Ver Mapa
          </button>
          <button type="button" className="botao-vidro" onClick={() => irPara("animais")} style={{ ...botaoHero, border: "1px solid rgba(255,255,255,0.3)", backdropFilter: "blur(8px)" }}>
            <i className="fas fa-paw" /> Espécies Ameaçadas
          </button>
        </div>
      </div>
      <button type="button" aria-label="Foto anterior" onClick={() => setAtual((a) => (a - 1 + slides.length) % slides.length)} style={{ ...setaEstilo, left: 16 }}>
        <i className="fas fa-chevron-left" />
      </button>
      <button type="button" aria-label="Próxima foto" onClick={() => setAtual((a) => (a + 1) % slides.length)} style={{ ...setaEstilo, right: 16 }}>
        <i className="fas fa-chevron-right" />
      </button>
      <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 3, display: "flex", gap: 8 }}>
        {slides.map((s, i) => (
          <button
            key={s.url}
            type="button"
            aria-label={`Mostrar ${s.rotulo}`}
            aria-current={atual === i}
            onClick={() => setAtual(i)}
            style={{ width: atual === i ? 24 : 8, height: 8, borderRadius: 4, background: atual === i ? "#4ade80" : "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", transition: "all 0.3s" }}
          />
        ))}
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
    <button type="button" className="botao-branco" onClick={compartilhar} style={{ color: "#0f1117", border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
      <i className={`fas ${copiado ? "fa-check" : "fa-share-alt"}`} /> {copiado ? "Link copiado" : "Compartilhar"}
    </button>
  );
}

function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > 300);
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
      style={{ position: "fixed", bottom: 28, right: 28, width: 44, height: 44, borderRadius: "50%", color: "#fff", border: "none", cursor: "pointer", fontSize: 16, boxShadow: "0 4px 16px rgba(22,163,74,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40 }}
    >
      <i className="fas fa-arrow-up" />
    </button>
  );
}

export function Inicio() {
  const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#fff" }}>
      <style>{CSS}</style>

      <Cabecalho />

      <main>
        <Slideshow />

        <div style={{ background: "#14532d", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "10px 24px", textAlign: "center", fontSize: 12, color: "#f1f1f1" }}>
          © 2025 EcoMapBrasil — Dados obtidos de fontes públicas como INPE, IBGE e MapBiomas Alerta.
        </div>

        {/* ── NÚMEROS ── */}
        <section className="section-pad" style={{ background: "#fff", padding: "72px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ ...rotuloSecao, textAlign: "center" }}>Impacto Real</p>
            <h2 style={{ ...tituloSecao, textAlign: "center", marginBottom: 48 }}>O Desmatamento em Números</h2>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
              {numeros.map((n) => (
                <div key={n.valor} className="stat-card" style={{ ["--destaque" as string]: n.destaque, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: `${n.destaque}18`, border: `1px solid ${n.destaque}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <i className={`fas ${n.icone}`} style={{ fontSize: 22, color: n.destaque }} />
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#111", marginBottom: 8 }}>{n.valor}</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{n.rotulo}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MAPA ── */}
        <section id="mapa" className="section-pad" style={{ background: "#fff", padding: "72px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
            <p style={rotuloSecao}>Visualização</p>
            <h2 style={{ ...tituloSecao, marginBottom: 12 }}>Mapa do Desmatamento</h2>
            <p style={{ color: "#6b7280", maxWidth: 560, margin: "0 auto 32px" }}>Explore as áreas mais afetadas pelo desmatamento em todas as regiões do Brasil.</p>
            <Link href="/mapa" className="botao-verde" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
              <i className="fas fa-map-marked-alt" /> Ver mapa do Desmatamento
            </Link>
          </div>
        </section>

        {/* ── ANIMAIS ── */}
        <section id="animais" className="section-pad" style={{ background: "#f8fafc", padding: "72px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ ...rotuloSecao, textAlign: "center" }}>Biodiversidade</p>
            <h2 style={{ ...tituloSecao, textAlign: "center", marginBottom: 12 }}>Espécies Ameaçadas</h2>
            <p style={{ textAlign: "center", color: "#4b5563", maxWidth: 560, margin: "0 auto 48px" }}>Conheça as espécies que estão perdendo seu habitat natural.</p>
            <div className="animals-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              {animaisDestaque.map((a) => (
                <div key={a.nome} className="animal-card" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                    <ImagemComReserva src={a.imagem} alt={a.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: 12, right: 12, background: a.fundoStatus, color: a.corStatus, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{a.status}</div>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 8 }}>{a.nome}</h3>
                    <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14, lineHeight: 1.5 }}>{a.descricao}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <i className="fas fa-map-marker-alt" style={{ color: "#4ade80" }} /> {a.bioma}
                      </span>
                      <span style={{ color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <i className="fas fa-arrow-down" /> {a.populacao} pop.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/animais" className="botao-contorno" style={{ display: "inline-block", border: "1px solid #16a34a", color: "#16a34a", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                <i className="fas fa-book" style={{ marginRight: 8 }} /> Ver Lista Completa
              </Link>
            </div>
          </div>
        </section>

        {/* ── DADOS ── */}
        <section id="dados" className="section-pad" style={{ background: "#f0fdf4", padding: "72px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ ...rotuloSecao, textAlign: "center" }}>Análise</p>
            <h2 style={{ ...tituloSecao, textAlign: "center", marginBottom: 12 }}>Evolução do Desmatamento</h2>
            <p style={{ textAlign: "center", color: "#6b7280", maxWidth: 560, margin: "0 auto 48px" }}>Veja como o desmatamento evoluiu ao longo dos anos nos biomas brasileiros.</p>
            <div className="dados-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              <div style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#ffffff", textTransform: "uppercase", marginBottom: 16 }}>Área Desmatada por Bioma</p>
                <BarrasAnimadas />
                <Rosca />
                <GraficoLinha />
                <Radar />
              </div>
              <div style={{ background: "#14532d", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "28px 24px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#fff", textTransform: "uppercase", marginBottom: 24 }}>Linha do Tempo</p>
                <LinhaDoTempo />
              </div>
            </div>
            <div style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px", marginTop: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#ffffff", textTransform: "uppercase", marginBottom: 20 }}>Comparação Regional</p>
              <div className="regional-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 20 }}>
                {comparacaoRegional.map((r) => (
                  <div key={r.rotulo}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#ffffff" }}>{r.rotulo}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: r.cor }}>{r.pct}%</span>
                    </div>
                    <div style={{ height: 8, background: "#1a1f2e", borderRadius: 4 }}>
                      <div style={{ height: 8, borderRadius: 4, background: r.cor, width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SOLUÇÕES ── */}
        <section id="solucoes" className="section-pad" style={{ background: "#15803d", padding: "72px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ ...rotuloSecao, textAlign: "center", color: "#bbf7d0" }}>Ação</p>
            <h2 style={{ ...tituloSecao, textAlign: "center", color: "#fff", marginBottom: 12 }}>O que podemos fazer?</h2>
            <p style={{ textAlign: "center", color: "#fff", maxWidth: 560, margin: "0 auto 48px" }}>Ações individuais e coletivas para combater o desmatamento.</p>
            <div className="solutions-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: 16 }}>
              {solucoes.map((s) => (
                <div key={s.titulo} className="solution-card" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "24px 20px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <i className={`fas ${s.icone}`} style={{ fontSize: 20, color: "#4ade80" }} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", marginBottom: 8 }}>{s.titulo}</h3>
                  <p style={{ fontSize: 13, color: "#d1fae5", lineHeight: 1.6 }}>{s.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EQUIPE ── */}
        <section id="equipe" className="section-pad" style={{ background: "#fff", padding: "72px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ ...rotuloSecao, textAlign: "center" }}>Pessoas</p>
            <h2 style={{ ...tituloSecao, textAlign: "center", marginBottom: 12 }}>Nossa Equipe</h2>
            <p style={{ textAlign: "center", color: "#6b7280", maxWidth: 560, margin: "0 auto 48px" }}>O time por trás deste projeto de educação ambiental.</p>
            <div className="team-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 20, maxWidth: 1000, margin: "0 auto" }}>
              {equipe.map((m) => (
                <div key={m.nome} className="team-card" style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 20, padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "3px solid #fff", boxShadow: "0 4px 12px rgba(22,163,74,0.2)" }}>
                    <i className="fas fa-user" style={{ fontSize: 28, color: "#16a34a" }} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{m.nome}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AVALIAÇÕES ── */}
        <div id="avaliacoes">
          <Avaliacoes />
        </div>

        {/* ── CHAMADA ── */}
        <section className="section-pad" style={{ background: "#14532d", padding: "72px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>Juntos podemos fazer a Diferença</h2>
            {/* O cinza #6b7280 do React quase sumia no verde-escuro. */}
            <p style={{ color: "#bbf7d0", fontSize: 16, marginBottom: 36 }}>O desmatamento é um problema de todos nós. Compartilhe e ajude a conscientizar.</p>
            <div className="cta-buttons" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <BotaoCompartilhar />
              {/* No React o link apontava para um .zip que não existia no site. */}
              <a
                href="/alertas-desmatamento.json"
                download="alertas-desmatamento-deter-b.json"
                className="botao-transparente"
                style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
              >
                <i className="fas fa-download" /> Baixar Dados
              </a>
            </div>
          </div>
        </section>
      </main>

      <Rodape aoIrPara={irPara} />
      <VoltarAoTopo />
    </div>
  );
}

function Rodape({ aoIrPara }: { aoIrPara: (id: string) => void }) {
  const tituloColuna = { fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 } as const;
  return (
    <footer style={{ background: "#052e16", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "56px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" style={{ height: 32 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>EcoMapBrasil</span>
            </div>
            {/* Os cinzas do rodapé no React (#6b7280, #4b5563, #374151) mal se liam no verde quase preto. */}
            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7 }}>Educando e conscientizando sobre os impactos do desmatamento na biodiversidade brasileira.</p>
          </div>
          <div>
            <h4 style={tituloColuna}>Links</h4>
            {[
              ["mapa", "Mapa Interativo"],
              ["animais", "Espécies Ameaçadas"],
              ["dados", "Dados"],
              ["solucoes", "Como Ajudar"],
            ].map(([id, rotulo]) => (
              <button key={id} type="button" className="link-rodape" onClick={() => aoIrPara(id)} style={{ display: "block", background: "none", border: "none", fontSize: 13, padding: "5px 0", cursor: "pointer", textAlign: "left" }}>
                {rotulo}
              </button>
            ))}
          </div>
          <div>
            <h4 style={tituloColuna}>Recursos</h4>
            {[
              ["https://alerta.mapbiomas.org/relatorio/", "Relatórios"],
              ["https://g1.globo.com/busca/?q=desmatamento", "Artigos"],
              ["https://www.ibflorestas.org.br/conteudo/leis-ambientais", "Legislação"],
            ].map(([href, rotulo]) => (
              <a key={rotulo} href={href} target="_blank" rel="noopener noreferrer" className="link-rodape" style={{ display: "block", fontSize: 13, padding: "5px 0", textDecoration: "none" }}>
                {rotulo}
              </a>
            ))}
          </div>
          <div>
            <h4 style={tituloColuna}>Contato</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: "#9ca3af", fontSize: 13 }}>
              <i className="fas fa-map-marker-alt" style={{ color: "#4ade80", width: 14 }} />
              Matão, São Paulo, Brasil
            </div>
            <a href="https://github.com/ecomap-devs" target="_blank" rel="noopener noreferrer" className="link-rodape" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, textDecoration: "none" }}>
              <i className="fab fa-github" style={{ color: "#4ade80", width: 14 }} />
              github.com/ecomap-devs
            </a>
          </div>
        </div>
        <div className="footer-bottom" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12, color: "#9ca3af" }}>
          <span>© 2025 EcoMapBrasil. Projeto Interdisciplinar da FATEC.</span>
          <span>Desenvolvido com ❤️ pela equipe EcoMapBrasil</span>
        </div>
      </div>
    </footer>
  );
}
