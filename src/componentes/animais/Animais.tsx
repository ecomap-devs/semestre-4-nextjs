"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { useApareceu, useLarguraElemento, useLarguraJanela } from "@/componentes/comum/ganchos";
import { Dialogo } from "@/componentes/comum/Dialogo";
import { ImagemComReserva } from "@/componentes/comum/ImagemComReserva";
import { animais, ANOS_TENDENCIA, filtrosBioma, filtrosStatus, type Animal } from "@/dados/animais";

// Porte da Animais.jsx.

const numero = new Intl.NumberFormat("pt-BR");

/** Busca sem acento e sem caixa: "onca" acha "Onça-pintada". */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function corDaTendencia(tendencia: number[]): string {
  const primeiro = tendencia[0] ?? 0;
  const delta = (tendencia.at(-1) ?? 0) - primeiro;
  if (delta > 0) return "#16a34a";
  if (delta < -primeiro * 0.5) return "#ef4444";
  return "#f59e0b";
}

function MiniGrafico({ tendencia, cor }: { tendencia: number[]; cor: string }) {
  const [refLargura, largura] = useLarguraElemento<HTMLDivElement>();
  const [refVisivel, apareceu] = useApareceu<HTMLDivElement>(0.3);
  // Um id por gráfico: no React o id do gradiente vinha da cor, e cards da mesma cor
  // repetiam o mesmo id na página.
  const idGradiente = useId();

  const w = largura ?? 200;
  const h = 80;
  const margem = { e: 8, d: 8, t: 8, b: 20 };
  const plotW = w - margem.e - margem.d;
  const plotH = h - margem.t - margem.b;
  const max = Math.max(...tendencia, 1);
  const min = Math.min(...tendencia, 0);
  const faixa = max - min || 1;
  const pontos = tendencia.map((v, i) => ({
    x: margem.e + (i / (tendencia.length - 1)) * plotW,
    y: margem.t + (1 - (v - min) / faixa) * plotH,
    rotulo: ANOS_TENDENCIA[i],
  }));
  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const ultimo = pontos.at(-1);
  const primeiro = pontos[0];
  const areaD = ultimo && primeiro ? `${linha} L ${ultimo.x} ${margem.t + plotH} L ${primeiro.x} ${margem.t + plotH} Z` : "";

  return (
    <div ref={refVisivel} style={{ width: "100%" }}>
      <div ref={refLargura}>
        {largura !== null && (
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }} role="img" aria-label={`População de ${ANOS_TENDENCIA[0]} a ${ANOS_TENDENCIA.at(-1)}: ${tendencia.map((v) => numero.format(v)).join(", ")}`}>
            <defs>
              <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={cor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${idGradiente})`} style={{ opacity: apareceu ? 1 : 0, transition: "opacity 600ms ease" }} />
            <path d={linha} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: apareceu ? 1 : 0, transition: "opacity 600ms ease" }} />
            {pontos.map((p, i) => (
              <g key={i} style={{ opacity: apareceu ? 1 : 0, transition: `opacity 0.3s ease ${i * 0.05}s` }}>
                <circle cx={p.x} cy={p.y} r={3} fill={cor} stroke="#fff" strokeWidth="1.5" />
                {(i === 0 || i === pontos.length - 1) && (
                  <text x={p.x} y={h - 4} textAnchor="middle" fontSize="9" fill="#6b7280">
                    {p.rotulo}
                  </text>
                )}
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}

function Ficha({ animal, ehMobile, aoFechar }: { animal: Animal; ehMobile: boolean; aoFechar: () => void }) {
  const primeiro = animal.tendencia[0] ?? 0;
  const ultimo = animal.tendencia.at(-1) ?? 0;
  const cor = corDaTendencia(animal.tendencia);

  return (
    // Foco preso na ficha, fundo inerte, Esc fecha e o foco volta ao card (Dialogo).
    <Dialogo aoFechar={aoFechar} idTitulo="titulo-ficha" classeFundo="modal-overlay" classeCaixa="modal-content" fechaNoFundo>
      <div style={{ height: ehMobile ? 200 : 280, overflow: "hidden", borderRadius: ehMobile ? "16px 16px 0 0" : "20px 20px 0 0", position: "relative" }}>
        <ImagemComReserva src={animal.imagem} alt={animal.nome} loading="eager" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          data-foco-inicial
          style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: 16, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <i className="fas fa-times" />
        </button>
        <div style={{ position: "absolute", bottom: 14, left: 18 }}>
          <span style={{ background: animal.fundoStatus, color: animal.corStatus, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6 }}>{animal.status}</span>
        </div>
      </div>

      <div style={{ padding: ehMobile ? "18px 16px 24px" : "28px 28px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
          <h2 id="titulo-ficha" style={{ fontSize: ehMobile ? 20 : 26, fontWeight: 800, color: "#111", margin: 0 }}>
            {animal.nome}
          </h2>
          <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0 }}>{animal.bioma}</span>
        </div>

        <p style={{ fontSize: ehMobile ? 13 : 14, color: "#4b5563", lineHeight: 1.7, marginBottom: 20 }}>{animal.descricao}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ehMobile ? 10 : 12, marginBottom: 20 }}>
          {[
            { rotulo: "População estimada", valor: animal.populacao === 0 ? "Extinta" : numero.format(animal.populacao), cor: animal.populacao === 0 ? "#ef4444" : "#111" },
            {
              rotulo: `Variação (${ANOS_TENDENCIA[0]}–${ANOS_TENDENCIA.at(-1)})`,
              valor: primeiro === 0 ? "N/A" : `${ultimo >= primeiro ? "+" : ""}${Math.round(((ultimo - primeiro) / primeiro) * 100)}%`,
              cor,
            },
          ].map((d) => (
            <div key={d.rotulo} style={{ background: "#f8fafc", borderRadius: 12, padding: ehMobile ? "12px 14px" : "14px 16px", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{d.rotulo}</div>
              <div style={{ fontSize: ehMobile ? 18 : 22, fontWeight: 800, color: d.cor }}>{d.valor}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
            Evolução Populacional ({ANOS_TENDENCIA[0]}–{ANOS_TENDENCIA.at(-1)})
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 12px" }}>
            <MiniGrafico tendencia={animal.tendencia} cor={cor} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Principais Ameaças</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {animal.ameacas.map((t) => (
              <span key={t} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontSize: ehMobile ? 11 : 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8 }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: 5, fontSize: 10 }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Dialogo>
  );
}

export function Animais() {
  const largura = useLarguraJanela();
  const ehMobile = largura < 768;
  const ehTablet = largura >= 768 && largura < 1024;

  const [filtroBioma, setFiltroBioma] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Animal | null>(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const termo = normalizar(busca.trim());
  const filtrados = animais.filter(
    (a) =>
      (filtroBioma === "Todos" || a.bioma === filtroBioma) &&
      (filtroStatus === "Todos" || a.status === filtroStatus) &&
      (normalizar(a.nome).includes(termo) || normalizar(a.bioma).includes(termo)),
  );

  const colunas = ehMobile ? "1fr" : ehTablet ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(320px, 1fr))";
  const temFiltroAtivo = filtroBioma !== "Todos" || filtroStatus !== "Todos";
  const contador = `${filtrados.length} espécie${filtrados.length !== 1 ? "s" : ""}`;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @keyframes surgir { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        /* both: com o atraso escalonado, o card já começa invisível — no React ele
           aparecia, sumia no início da animação e reaparecia. */
        .animal-card { animation: surgir 400ms ease both; transition: transform 0.25s, box-shadow 0.25s; }
        .animal-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(0,0,0,0.1); }
        .animal-card img { transition: transform 0.4s; }
        .animal-card:hover img { transform: scale(1.06); }
        .ver-mais { background: none; color: #16a34a; transition: all 0.2s; }
        .animal-card:hover .ver-mais, .ver-mais:focus-visible { background: #16a34a; color: #fff; }
        .botao-voltar { background: rgba(255,255,255,0.15); transition: background 0.2s; }
        .botao-voltar:hover { background: rgba(255,255,255,0.25); }
        .campo-busca:focus { border-color: #16a34a !important; }
        .filtro-btn { transition: all 0.2s; cursor: pointer; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px); }
        .modal-content { background: #fff; border-radius: 20px; max-width: 700px; width: 100%; max-height: 92vh; overflow-y: auto; box-shadow: 0 32px 64px rgba(0,0,0,0.2); animation: surgir 300ms ease; }
        .biome-scroll::-webkit-scrollbar { display: none; }
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
            <i className="fas fa-paw" style={{ color: "#bbf7d0", fontSize: 13 }} />
            {!ehMobile && <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Espécies Ameaçadas</span>}
          </div>
        </div>
      </header>

      <main>
        <div style={{ background: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)", padding: ehMobile ? "36px 20px" : "56px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#86efac", textTransform: "uppercase", marginBottom: 10 }}>Biodiversidade Brasileira</p>
          <h1 style={{ fontSize: ehMobile ? "clamp(22px, 6vw, 30px)" : "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#fff", maxWidth: 700, margin: "0 auto 14px", lineHeight: 1.2 }}>Espécies Ameaçadas pelo Desmatamento</h1>
          <p style={{ fontSize: ehMobile ? 14 : 16, color: "#bbf7d0", maxWidth: 580, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Conheça as espécies que estão perdendo seu habitat. Cada uma conta a história de um ecossistema em colapso.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: ehMobile ? 20 : 32, flexWrap: "wrap" }}>
            {[
              { valor: animais.length, rotulo: "Espécies listadas" },
              { valor: animais.filter((a) => a.status === "Criticamente ameaçada").length, rotulo: "Criticamente ameaçadas" },
              { valor: animais.filter((a) => a.status === "Extinta na natureza").length, rotulo: "Extintas na natureza" },
            ].map((s) => (
              <div key={s.rotulo} style={{ textAlign: "center" }}>
                <div style={{ fontSize: ehMobile ? 28 : 36, fontWeight: 800, color: "#fff" }}>{s.valor}</div>
                <div style={{ fontSize: ehMobile ? 11 : 13, color: "#86efac" }}>{s.rotulo}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: ehMobile ? "12px 16px" : "20px 24px", position: "sticky", top: ehMobile ? 56 : 64, zIndex: 40 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: ehMobile ? 0 : 12 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <i className="fas fa-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }} />
                <input
                  type="search"
                  aria-label="Buscar espécie ou bioma"
                  placeholder="Buscar espécie ou bioma..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="campo-busca"
                  style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", color: "#111" }}
                />
              </div>

              {ehMobile ? (
                <button
                  type="button"
                  onClick={() => setFiltrosAbertos((v) => !v)}
                  aria-expanded={filtrosAbertos}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: filtrosAbertos ? "#16a34a" : temFiltroAtivo ? "#f0fdf4" : "#f9fafb", color: filtrosAbertos ? "#fff" : temFiltroAtivo ? "#16a34a" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", minHeight: 44, flexShrink: 0, transition: "all 0.2s" }}
                >
                  <i className="fas fa-sliders-h" style={{ fontSize: 13 }} />
                  Filtros
                  {temFiltroAtivo && !filtrosAbertos && (
                    <span aria-label="com filtro ativo" style={{ background: "#16a34a", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ✓
                    </span>
                  )}
                </button>
              ) : (
                <span role="status" style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                  {contador}
                </span>
              )}
            </div>

            {(!ehMobile || filtrosAbertos) && (
              <div style={{ display: "flex", gap: ehMobile ? 8 : 16, flexDirection: ehMobile ? "column" : "row", flexWrap: ehMobile ? "nowrap" : "wrap", alignItems: ehMobile ? "stretch" : "center", paddingTop: ehMobile ? 12 : 0, borderTop: ehMobile ? "1px solid #f3f4f6" : "none", animation: "surgir 200ms ease" }}>
                <div className="biome-scroll" role="group" aria-label="Filtrar por bioma" style={{ display: "flex", gap: 6, flexWrap: ehMobile ? "nowrap" : "wrap", overflowX: ehMobile ? "auto" : "visible", paddingBottom: ehMobile ? 2 : 0, scrollbarWidth: "none" }}>
                  {filtrosBioma.map((b) => (
                    <button
                      key={b}
                      type="button"
                      className="filtro-btn"
                      aria-pressed={filtroBioma === b}
                      onClick={() => setFiltroBioma(b)}
                      style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: filtroBioma === b ? "#16a34a" : "#f3f4f6", color: filtroBioma === b ? "#fff" : "#374151", border: filtroBioma === b ? "1px solid #16a34a" : "1px solid #e5e7eb", whiteSpace: "nowrap", minHeight: 36 }}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select
                    aria-label="Filtrar por status de conservação"
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13, color: "#374151", outline: "none", cursor: "pointer", background: "#fff", flex: ehMobile ? 1 : "unset", minHeight: 36 }}
                  >
                    {filtrosStatus.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {ehMobile && <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{contador}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: ehMobile ? "20px 16px" : "40px 24px" }}>
          {filtrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#6b7280" }}>
              <i className="fas fa-search" style={{ fontSize: 40, marginBottom: 16, display: "block" }} />
              <p style={{ fontSize: 16 }}>Nenhuma espécie encontrada com esses filtros.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: colunas, gap: ehMobile ? 16 : 24 }}>
              {filtrados.map((animal, i) => {
                const cor = corDaTendencia(animal.tendencia);
                const atual = animal.tendencia.at(-1) ?? 0;
                return (
                  <div
                    key={animal.nome}
                    className="animal-card"
                    onClick={() => setSelecionado(animal)}
                    style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: ehMobile ? 16 : 20, overflow: "hidden", cursor: "pointer", animationDelay: `${i * 60}ms` }}
                  >
                    <div style={{ height: ehMobile ? 160 : 200, overflow: "hidden", position: "relative" }}>
                      <ImagemComReserva src={animal.imagem} alt={animal.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: 10, left: 10, background: animal.fundoStatus, color: animal.corStatus, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>{animal.status}</div>
                      <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6, backdropFilter: "blur(4px)" }}>{animal.bioma}</div>
                    </div>

                    <div style={{ padding: ehMobile ? "14px 16px" : "20px" }}>
                      <h3 style={{ fontSize: ehMobile ? 15 : 17, fontWeight: 700, color: "#111", marginBottom: 6 }}>{animal.nome}</h3>
                      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, marginBottom: ehMobile ? 12 : 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{animal.descricao}</p>

                      <div style={{ marginBottom: ehMobile ? 10 : 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Tendência populacional</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: cor }}>{atual === 0 ? "Extinta" : `${numero.format(atual)} ind.`}</span>
                        </div>
                        <MiniGrafico tendencia={animal.tendencia} cor={cor} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                          {animal.ameacas.slice(0, ehMobile ? 1 : 2).map((t) => (
                            <span key={t} style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", padding: "2px 8px", borderRadius: 4, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                        {/* O clique sobe até o card; o botão existe para quem navega pelo teclado. */}
                        <button
                          type="button"
                          className="ver-mais"
                          aria-label={`Ver ficha de ${animal.nome}`}
                          style={{ border: "1px solid #16a34a", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, minHeight: 36 }}
                        >
                          Ver mais <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selecionado && <Ficha animal={selecionado} ehMobile={ehMobile} aoFechar={() => setSelecionado(null)} />}

      <footer style={{ background: "#052e16", borderTop: "1px solid rgba(255,255,255,0.08)", padding: ehMobile ? "20px 16px" : "24px", textAlign: "center", fontSize: ehMobile ? 12 : 13, color: "#9ca3af" }}>
        © 2025 EcoMapBrasil — Dados de conservação baseados em IUCN, ICMBio e WWF Brasil.
      </footer>
    </div>
  );
}
