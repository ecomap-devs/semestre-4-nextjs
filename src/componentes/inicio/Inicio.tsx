"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/componentes/autenticacao/ProvedorAuth";
import { Avaliacoes } from "@/componentes/avaliacoes/Avaliacoes";
import { ImagemComReserva } from "@/componentes/comum/ImagemComReserva";
import { fotoConfiavel } from "@/lib/avatar";
import { animaisDestaque, equipe, linksNavegacao, numeros, slides, solucoes, type AnimalResumo } from "@/dados/inicio";

import { BarrasAnimadas, ComparacaoRegional, LinhaDoTempo } from "./Graficos";
import { MapaBiomas } from "./MapaBiomas";

// Porte da Home.jsx. Estilos inline como no original; o que precisa de :hover ou de
// media query fica no <style> abaixo. Cores e fontes vêm das variáveis do globals.css.

const CSS = `
  .nav-link { background: none; border: none; cursor: pointer; color: var(--tinta-2); font-size: 15px; padding: 6px 0; transition: color 0.15s; }
  .nav-link:hover { color: var(--mata); }
  .animal-card img { transition: transform 0.5s ease; }
  .animal-card:hover img { transform: scale(1.03); }
  .seta-hero { transition: background 0.15s; background: rgba(0,0,0,0.25); }
  .seta-hero:hover { background: rgba(0,0,0,0.5); }
  .botao-claro { background: var(--branco); color: var(--tinta); }
  .botao-claro:hover { background: var(--papel-2); }
  .botao-vazado { background: transparent; color: var(--branco); border-color: rgba(255,253,248,0.5) !important; }
  .botao-vazado:hover { background: rgba(255,253,248,0.1); }
  .link-rodape { color: rgba(255,253,248,0.7); transition: color 0.15s; }
  .link-rodape:hover { color: var(--branco); }
  .voltar-topo { transition: background 0.15s; background: var(--branco); }
  .voltar-topo:hover { background: var(--papel-2); }
  .hidden-mobile { display: flex; }
  .show-mobile { display: none !important; }

  @media (max-width: 860px) {
    .hidden-mobile { display: none !important; }
    .show-mobile { display: block !important; }
    .duas-colunas { grid-template-columns: 1fr !important; gap: 40px !important; }
  }

  @media (max-width: 768px) {
    .seta-hero { display: none; }
    .section-pad { padding: 56px 20px !important; }
    .numeros-grid { grid-template-columns: 1fr 1fr !important; }
    .animals-grid { grid-template-columns: 1fr !important; }
    .solutions-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .footer-bottom { flex-direction: column !important; }
  }

  @media (max-width: 480px) {
    .numeros-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr !important; }
  }
`;

const larguraMaxima = { maxWidth: 1120, margin: "0 auto" } as const;
const tituloSecao = { fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 16 } as const;
const introSecao = { fontSize: 18, color: "var(--tinta-2)", maxWidth: 560 } as const;

// O grau de ameaça vira cor de texto, sem selo: terra no mais grave, ocre no meio.
const corDoStatus: Record<AnimalResumo["status"], string> = {
  "Criticamente ameaçada": "var(--terra)",
  "Em perigo": "var(--ocre)",
  Vulnerável: "var(--tinta-3)",
};

function Cabecalho() {
  const { usuario, abrirLogin, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  const irPara = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuAberto(false);
  };

  const itemMenuMobile = { display: "block", background: "none", border: "none", fontSize: 16, padding: "10px 0", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--tinta)" } as const;

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "color-mix(in srgb, var(--papel) 94%, transparent)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--linha)" }}>
      <div style={{ ...larguraMaxima, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" style={{ height: 34, width: "auto" }} />
          <span style={{ fontFamily: "var(--fonte-titulo)", fontSize: 20, color: "var(--tinta)" }}>EcoMapBrasil</span>
        </div>
        <nav aria-label="Seções da página" style={{ gap: 28, alignItems: "center" }} className="hidden-mobile">
          {linksNavegacao.map(([id, rotulo]) => (
            <button key={id} type="button" className="nav-link" onClick={() => irPara(id)}>
              {rotulo}
            </button>
          ))}
          {/* Enquanto o Firebase não responde, o espaço fica vazio em vez de piscar "Entrar". */}
          {usuario === undefined ? null : usuario ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 20, borderLeft: "1px solid var(--linha)" }}>
              {fotoConfiavel(usuario.photoURL) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoConfiavel(usuario.photoURL)} alt="" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
              )}
              <span style={{ fontSize: 14, color: "var(--tinta-2)" }}>{usuario.displayName || usuario.email}</span>
              <button type="button" onClick={() => void sair()} className="nav-link" style={{ fontSize: 14, color: "var(--tinta-3)" }}>
                Sair
              </button>
            </div>
          ) : (
            <button type="button" onClick={abrirLogin} className="botao botao-contorno" style={{ padding: "6px 16px", fontSize: 14 }}>
              Entrar
            </button>
          )}
        </nav>
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          style={{ background: "none", border: "none", color: "var(--tinta)", fontSize: 20, cursor: "pointer" }}
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
    const timer = setInterval(() => setAtual((a) => (a + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [pausado, atual]);

  const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const setaEstilo = { position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 3, border: "none", borderRadius: "50%", width: 38, height: 38, color: "#fff", cursor: "pointer", fontSize: 13 } as const;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Espécies ameaçadas"
      // Fundo escuro por baixo das fotos: se o Supabase não responder, o texto claro
      // continua legível em vez de ficar sobre fundo branco.
      style={{ position: "relative", height: "min(calc(100vh - 64px), 760px)", minHeight: 480, background: "var(--mata-escura)", overflow: "hidden" }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.url}
          role="img"
          aria-label={s.rotulo}
          aria-hidden={atual !== i}
          style={{ position: "absolute", inset: 0, backgroundImage: `url('${s.url}')`, backgroundSize: "cover", backgroundPosition: "center", opacity: atual === i ? 1 : 0, transition: "opacity 1.2s ease-in-out" }}
        />
      ))}
      {/* Escurece só a base, onde fica o texto; o resto da foto aparece inteiro. */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,24,18,0.85) 0%, rgba(16,24,18,0.35) 45%, rgba(16,24,18,0) 70%)" }} />
      <div style={{ position: "relative", zIndex: 2, height: "100%", ...larguraMaxima, padding: "0 24px 72px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <h1 style={{ fontSize: "clamp(34px, 5.5vw, 64px)", color: "#fffdf8", margin: "0 0 16px", maxWidth: 760, fontWeight: 400 }}>O desmatamento no Brasil é maior do que você imagina</h1>
        <p style={{ fontSize: "clamp(17px, 2vw, 20px)", color: "rgba(255,253,248,0.85)", marginBottom: 32, maxWidth: 560 }}>
          Veja onde a floresta está sendo perdida e quais espécies estão ficando sem lugar para viver.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/mapa" className="botao botao-claro">
            Abrir o mapa
          </Link>
          <button type="button" className="botao botao-vazado" onClick={() => irPara("animais")}>
            Espécies ameaçadas
          </button>
        </div>
      </div>
      <p aria-hidden="true" style={{ position: "absolute", right: 24, bottom: 28, zIndex: 3, fontSize: 13, color: "rgba(255,253,248,0.75)", fontStyle: "italic" }}>
        {slides[atual]?.rotulo}
      </p>
      <button type="button" aria-label="Foto anterior" className="seta-hero" onClick={() => setAtual((a) => (a - 1 + slides.length) % slides.length)} style={{ ...setaEstilo, left: 16 }}>
        <i className="fas fa-chevron-left" />
      </button>
      <button type="button" aria-label="Próxima foto" className="seta-hero" onClick={() => setAtual((a) => (a + 1) % slides.length)} style={{ ...setaEstilo, right: 16 }}>
        <i className="fas fa-chevron-right" />
      </button>
      <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 3, display: "flex", gap: 6 }}>
        {slides.map((s, i) => (
          <button
            key={s.url}
            type="button"
            aria-label={`Mostrar ${s.rotulo}`}
            aria-current={atual === i}
            onClick={() => setAtual(i)}
            // A área de toque é o botão inteiro (24×16); o traço visível é o span de dentro.
            style={{ width: 24, height: 16, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
          >
            <span style={{ display: "block", width: "100%", height: 2, background: atual === i ? "#fffdf8" : "rgba(255,253,248,0.4)", transition: "background 0.3s" }} />
          </button>
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
    <button type="button" className="botao botao-claro" onClick={compartilhar}>
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
      style={{ position: "fixed", bottom: 24, right: 24, width: 40, height: 40, borderRadius: "50%", color: "var(--tinta)", border: "1px solid var(--linha)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40 }}
    >
      <i className="fas fa-arrow-up" />
    </button>
  );
}

export function Inicio() {
  const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ background: "var(--papel)" }}>
      <style>{CSS}</style>

      <Cabecalho />

      <main>
        <Slideshow />

        {/* ── NÚMEROS ── */}
        <section className="section-pad" style={{ padding: "72px 24px 40px" }}>
          <div style={larguraMaxima}>
            <h2 className="sr-only">O desmatamento em números</h2>
            <dl className="numeros-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px 40px" }}>
              {numeros.map((n) => (
                // No <dl> o termo vem antes do valor; column-reverse põe o número em cima.
                <div key={n.valor} style={{ borderTop: "2px solid var(--tinta)", paddingTop: 16, display: "flex", flexDirection: "column-reverse", justifyContent: "flex-end" }}>
                  <dt style={{ fontSize: 15, color: "var(--tinta-2)" }}>{n.rotulo}</dt>
                  <dd style={{ fontFamily: "var(--fonte-titulo)", fontSize: "clamp(32px, 4vw, 44px)", color: "var(--tinta)", lineHeight: 1.1, marginBottom: 8 }}>{n.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── MAPA ── */}
        <section id="mapa" className="section-pad" style={{ padding: "72px 24px" }}>
          <div className="duas-colunas" style={{ ...larguraMaxima, display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 64, alignItems: "center" }}>
            <div>
              <h2 style={tituloSecao}>Seis biomas, seis histórias de perda</h2>
              <p style={{ ...introSecao, marginBottom: 16 }}>
                O mapa interativo junta os alertas de desmatamento do DETER-B ao limite oficial de cada bioma, do IBGE.
              </p>
              <p style={{ ...introSecao, marginBottom: 28 }}>Escolha um bioma na lista para ir até ele e ver quanto já foi desmatado.</p>
              <Link href="/mapa" className="botao botao-cheio">
                Abrir o mapa interativo
              </Link>
            </div>
            <MapaBiomas />
          </div>
        </section>

        {/* ── ANIMAIS ── */}
        <section id="animais" className="section-pad" style={{ background: "var(--papel-2)", padding: "80px 24px" }}>
          <div style={larguraMaxima}>
            <h2 style={tituloSecao}>Espécies ameaçadas</h2>
            <p style={{ ...introSecao, marginBottom: 48 }}>Seis animais que estão perdendo o lugar onde vivem, e quanto a população de cada um já caiu.</p>
            <div className="animals-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px 32px" }}>
              {animaisDestaque.map((a) => (
                <article key={a.nome} className="animal-card">
                  <div style={{ aspectRatio: "4 / 3", overflow: "hidden", borderRadius: "var(--raio)", marginBottom: 16, background: "var(--linha)" }}>
                    <ImagemComReserva src={a.imagem} alt={a.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: corDoStatus[a.status], marginBottom: 4 }}>{a.status}</p>
                  <h3 style={{ fontSize: 22, marginBottom: 8 }}>{a.nome}</h3>
                  <p style={{ fontSize: 16, color: "var(--tinta-2)", marginBottom: 10 }}>{a.descricao}</p>
                  <p style={{ fontSize: 14, color: "var(--tinta-3)" }}>
                    {a.bioma} · população <span style={{ color: "var(--terra)", fontWeight: 600 }}>{a.populacao.replace("-", "−")}</span>
                  </p>
                </article>
              ))}
            </div>
            <p style={{ marginTop: 48, display: "flex", flexWrap: "wrap", gap: "12px 28px" }}>
              <Link href="/animais" className="link">
                Ver a lista completa de espécies →
              </Link>
              <Link href="/fotos" className="link">
                Identificar um animal por foto →
              </Link>
            </p>
          </div>
        </section>

        {/* ── DADOS ── */}
        <section id="dados" className="section-pad" style={{ padding: "80px 24px" }}>
          <div style={larguraMaxima}>
            <h2 style={tituloSecao}>Como o desmatamento avançou</h2>
            <p style={{ ...introSecao, marginBottom: 48 }}>Área já desmatada em cada bioma e os anos que marcaram essa história.</p>
            <div className="duas-colunas" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 64 }}>
              <div>
                <h3 style={{ fontSize: 20, marginBottom: 20 }}>Área desmatada por bioma</h3>
                <BarrasAnimadas />
                <h3 style={{ fontSize: 20, margin: "48px 0 20px" }}>Desmatamento por região</h3>
                <ComparacaoRegional />
              </div>
              <div>
                <h3 style={{ fontSize: 20, marginBottom: 20 }}>Linha do tempo</h3>
                <LinhaDoTempo />
              </div>
            </div>
            <p style={{ fontSize: 14, color: "var(--tinta-3)", marginTop: 32 }}>Fontes: INPE, IBGE e MapBiomas Alerta. Valores aproximados, para fins educativos.</p>
          </div>
        </section>

        {/* ── SOLUÇÕES ── */}
        <section id="solucoes" className="section-pad" style={{ background: "var(--papel-2)", padding: "80px 24px" }}>
          <div style={larguraMaxima}>
            <h2 style={tituloSecao}>O que dá para fazer</h2>
            <p style={{ ...introSecao, marginBottom: 48 }}>Ninguém resolve isso sozinho, mas cada uma destas atitudes conta.</p>
            <ol className="solutions-grid" style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px 40px" }}>
              {solucoes.map((s, i) => (
                <li key={s.titulo} style={{ borderTop: "1px solid var(--linha)", paddingTop: 16 }}>
                  <span style={{ fontFamily: "var(--fonte-titulo)", fontSize: 15, color: "var(--mata)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 style={{ fontSize: 20, margin: "6px 0 8px" }}>{s.titulo}</h3>
                  <p style={{ fontSize: 16, color: "var(--tinta-2)" }}>{s.texto}</p>
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
        <section className="section-pad" style={{ background: "var(--mata-escura)", padding: "80px 24px" }}>
          <div style={{ ...larguraMaxima, display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ ...tituloSecao, color: "#fffdf8" }}>Passe adiante</h2>
              <p style={{ color: "rgba(255,253,248,0.8)", fontSize: 18 }}>Quanto mais gente souber o tamanho do problema, mais difícil fica ignorá-lo.</p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <BotaoCompartilhar />
              {/* No React o link apontava para um .zip que não existia no site. */}
              <a href="/alertas-desmatamento.json" download="alertas-desmatamento-deter-b.json" className="botao botao-vazado">
                <i className="fas fa-download" aria-hidden="true" /> Baixar os dados
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
  const tituloColuna = { fontSize: 14, fontWeight: 600, color: "#fffdf8", marginBottom: 12 } as const;
  const nomes = equipe.map((m) => m.nome);
  return (
    <footer id="equipe" style={{ background: "#16291a", color: "rgba(255,253,248,0.7)", padding: "56px 24px 32px", fontSize: 15 }}>
      <div style={larguraMaxima}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" style={{ height: 28 }} />
              <span style={{ fontFamily: "var(--fonte-titulo)", fontSize: 19, color: "#fffdf8" }}>EcoMapBrasil</span>
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
