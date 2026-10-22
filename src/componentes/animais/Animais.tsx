"use client";

import { useState } from "react";

import { CabecalhoInterno, alturaCabecalhoInterno } from "@/componentes/comum/CabecalhoInterno";
import { useApareceu, useLarguraElemento, useLarguraJanela } from "@/componentes/comum/ganchos";
import { Dialogo } from "@/componentes/comum/Dialogo";
import { ImagemComReserva } from "@/componentes/comum/ImagemComReserva";
import { animais, ANOS_TENDENCIA, corDoStatus, filtrosBioma, filtrosStatus, type Animal } from "@/dados/animais";

// Porte da Animais.jsx. Cores e fontes vêm das variáveis do globals.css.

const numero = new Intl.NumberFormat("pt-BR");

/** Busca sem acento e sem caixa: "onca" acha "Onça-pintada". */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function corDaTendencia(tendencia: number[]): string {
  const primeiro = tendencia[0] ?? 0;
  const delta = (tendencia.at(-1) ?? 0) - primeiro;
  if (delta > 0) return "var(--mata)";
  if (delta < -primeiro * 0.5) return "var(--terra)";
  return "var(--ocre)";
}

function variacao(tendencia: number[]): string {
  const primeiro = tendencia[0] ?? 0;
  const ultimo = tendencia.at(-1) ?? 0;
  if (primeiro === 0) return "N/A";
  const pct = Math.round(((ultimo - primeiro) / primeiro) * 100);
  // Sinal de menos tipográfico (−), não o hífen.
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

function MiniGrafico({ tendencia, cor, altura = 56 }: { tendencia: number[]; cor: string; altura?: number }) {
  const [refLargura, largura] = useLarguraElemento<HTMLDivElement>();
  const [refVisivel, apareceu] = useApareceu<HTMLDivElement>(0.3);

  const w = largura ?? 200;
  const h = altura;
  const margem = { e: 4, d: 4, t: 6, b: 18 };
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
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h, display: "block" }} role="img" aria-label={`População de ${ANOS_TENDENCIA[0]} a ${ANOS_TENDENCIA.at(-1)}: ${tendencia.map((v) => numero.format(v)).join(", ")}`}>
            <line x1={margem.e} x2={margem.e + plotW} y1={margem.t + plotH} y2={margem.t + plotH} strokeWidth="1" style={{ stroke: "var(--linha)" }} />
            <path d={areaD} style={{ fill: cor, fillOpacity: 0.1, opacity: apareceu ? 1 : 0, transition: "opacity 600ms ease" }} />
            <path d={linha} fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: cor, opacity: apareceu ? 1 : 0, transition: "opacity 600ms ease" }} />
            {ultimo && <circle cx={ultimo.x} cy={ultimo.y} r={3} style={{ fill: cor, opacity: apareceu ? 1 : 0 }} />}
            {[primeiro, ultimo].map(
              (p, i) =>
                p && (
                  <text key={i} x={p.x} y={h - 3} textAnchor={i === 0 ? "start" : "end"} fontSize="11" style={{ fill: "var(--tinta-3)" }}>
                    {p.rotulo}
                  </text>
                ),
            )}
          </svg>
        )}
      </div>
    </div>
  );
}

function Ficha({ animal, ehMobile, aoFechar }: { animal: Animal; ehMobile: boolean; aoFechar: () => void }) {
  const cor = corDaTendencia(animal.tendencia);
  const periodo = `${ANOS_TENDENCIA[0]}–${ANOS_TENDENCIA.at(-1)}`;

  return (
    // Foco preso na ficha, fundo inerte, Esc fecha e o foco volta ao card (Dialogo).
    <Dialogo aoFechar={aoFechar} idTitulo="titulo-ficha" classeFundo="modal-overlay" classeCaixa="modal-content" fechaNoFundo>
      <div style={{ height: ehMobile ? 200 : 300, position: "relative", background: "var(--linha)" }}>
        <ImagemComReserva src={animal.imagem} alt={animal.nome} loading="eager" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          data-foco-inicial
          style={{ position: "absolute", top: 12, right: 12, background: "var(--branco)", border: "none", color: "var(--tinta)", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <i className="fas fa-times" />
        </button>
      </div>

      <div style={{ padding: ehMobile ? "20px 18px 28px" : "28px 32px 36px" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: corDoStatus[animal.status], marginBottom: 4 }}>{animal.status}</p>
        <h2 id="titulo-ficha" style={{ fontSize: ehMobile ? 26 : 32, margin: "0 0 4px" }}>
          {animal.nome}
        </h2>
        <p style={{ fontSize: 15, color: "var(--tinta-3)", marginBottom: 16 }}>
          {animal.bioma} · {animal.regiao}
        </p>

        <p style={{ fontSize: 16, color: "var(--tinta-2)", marginBottom: 24 }}>{animal.descricao}</p>

        <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {[
            { rotulo: "População estimada", valor: animal.populacao === 0 ? "Extinta" : numero.format(animal.populacao), cor: animal.populacao === 0 ? "var(--terra)" : "var(--tinta)" },
            { rotulo: `Variação (${periodo})`, valor: variacao(animal.tendencia), cor },
          ].map((d) => (
            // No <dl> o termo vem antes do valor; column-reverse põe o número em cima.
            <div key={d.rotulo} style={{ borderTop: "1px solid var(--linha)", paddingTop: 10, display: "flex", flexDirection: "column-reverse", justifyContent: "flex-end" }}>
              <dt style={{ fontSize: 14, color: "var(--tinta-3)" }}>{d.rotulo}</dt>
              <dd style={{ fontFamily: "var(--fonte-titulo)", fontSize: ehMobile ? 26 : 30, color: d.cor, lineHeight: 1.15 }}>{d.valor}</dd>
            </div>
          ))}
        </dl>

        <h3 style={{ fontSize: 18, marginBottom: 10 }}>População de {periodo}</h3>
        <div style={{ marginBottom: 24 }}>
          <MiniGrafico tendencia={animal.tendencia} cor={cor} altura={90} />
        </div>

        <h3 style={{ fontSize: 18, marginBottom: 8 }}>Principais ameaças</h3>
        <ul style={{ listStyle: "disc", paddingLeft: 20, color: "var(--tinta-2)", fontSize: 16 }}>
          {animal.ameacas.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
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

  const colunas = ehMobile ? "1fr" : ehTablet ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(300px, 1fr))";
  const temFiltroAtivo = filtroBioma !== "Todos" || filtroStatus !== "Todos";
  const contador = `${filtrados.length} espécie${filtrados.length !== 1 ? "s" : ""}`;
  const resumo = [
    { valor: animais.length, rotulo: "espécies listadas" },
    { valor: animais.filter((a) => a.status === "Criticamente ameaçada").length, rotulo: "criticamente ameaçadas" },
    { valor: animais.filter((a) => a.status === "Extinta na natureza").length, rotulo: "extinta na natureza" },
  ];

  return (
    <div style={{ background: "var(--papel)", minHeight: "100vh" }}>
      <style>{`
        .animal-card img { transition: transform 0.5s ease; }
        .animal-card:hover img { transform: scale(1.03); }
        .animal-card:hover .nome-animal { color: var(--mata); }
        .campo-busca:focus { border-color: var(--mata) !important; outline: none; }
        .filtro-btn { transition: background 0.15s, color 0.15s, border-color 0.15s; cursor: pointer; }
        .filtro-btn[aria-pressed="false"]:hover { border-color: var(--tinta-3) !important; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(29,38,32,0.55); z-index: 1300; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal-content { background: var(--branco); border-radius: var(--raio); max-width: 680px; width: 100%; max-height: 92vh; overflow-y: auto; box-shadow: 0 12px 40px rgba(29,38,32,0.25); }
        .biome-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <CabecalhoInterno titulo="Espécies ameaçadas" ehMobile={ehMobile} />

      <main>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: ehMobile ? "36px 16px 28px" : "64px 24px 40px" }}>
          <h1 style={{ fontSize: ehMobile ? 32 : 48, margin: "0 0 14px", maxWidth: 720 }}>Espécies que o desmatamento está levando embora</h1>
          <p style={{ fontSize: ehMobile ? 17 : 19, maxWidth: 600, marginBottom: 28 }}>
            Cada uma depende de um pedaço de mata que está sumindo. Toque numa espécie para ver como a população dela mudou desde {ANOS_TENDENCIA[0]}.
          </p>
          <p style={{ display: "flex", flexWrap: "wrap", gap: "8px 28px", fontSize: 16, color: "var(--tinta-2)" }}>
            {resumo.map((s) => (
              <span key={s.rotulo}>
                <strong style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 500, fontSize: 24, color: "var(--tinta)", marginRight: 6 }}>{s.valor}</strong>
                {s.rotulo}
              </span>
            ))}
          </p>
        </div>

        <div style={{ background: "var(--papel)", borderTop: "1px solid var(--linha)", borderBottom: "1px solid var(--linha)", padding: ehMobile ? "12px 16px" : "16px 24px", position: "sticky", top: alturaCabecalhoInterno(ehMobile), zIndex: 40 }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: ehMobile ? 0 : 12 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <i className="fas fa-search" aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tinta-3)", fontSize: 13 }} />
                <input
                  type="search"
                  aria-label="Buscar espécie ou bioma"
                  placeholder="Buscar espécie ou bioma"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="campo-busca"
                  style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid var(--linha)", borderRadius: "var(--raio)", fontSize: 16, boxSizing: "border-box", transition: "border-color 0.15s", color: "var(--tinta)", background: "var(--branco)", minHeight: 44 }}
                />
              </div>

              {ehMobile ? (
                <button
                  type="button"
                  onClick={() => setFiltrosAbertos((v) => !v)}
                  aria-expanded={filtrosAbertos}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: "var(--raio)", border: `1px solid ${temFiltroAtivo ? "var(--mata)" : "var(--linha)"}`, background: filtrosAbertos ? "var(--papel-2)" : "var(--branco)", color: temFiltroAtivo ? "var(--mata)" : "var(--tinta-2)", fontSize: 15, cursor: "pointer", whiteSpace: "nowrap", minHeight: 44, flexShrink: 0 }}
                >
                  <i className="fas fa-sliders-h" aria-hidden="true" style={{ fontSize: 13 }} />
                  Filtros
                  {temFiltroAtivo && <span className="sr-only">(com filtro ativo)</span>}
                </button>
              ) : (
                <span role="status" style={{ fontSize: 15, color: "var(--tinta-3)", whiteSpace: "nowrap" }}>
                  {contador}
                </span>
              )}
            </div>

            {(!ehMobile || filtrosAbertos) && (
              <div style={{ display: "flex", gap: ehMobile ? 10 : 16, flexDirection: ehMobile ? "column" : "row", flexWrap: ehMobile ? "nowrap" : "wrap", alignItems: ehMobile ? "stretch" : "center", paddingTop: ehMobile ? 12 : 0 }}>
                <div className="biome-scroll" role="group" aria-label="Filtrar por bioma" style={{ display: "flex", gap: 6, flexWrap: ehMobile ? "nowrap" : "wrap", overflowX: ehMobile ? "auto" : "visible", scrollbarWidth: "none" }}>
                  {filtrosBioma.map((b) => {
                    const ativo = filtroBioma === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        className="filtro-btn"
                        aria-pressed={ativo}
                        onClick={() => setFiltroBioma(b)}
                        style={{ padding: "6px 14px", borderRadius: 999, fontSize: 15, background: ativo ? "var(--mata)" : "transparent", color: ativo ? "var(--branco)" : "var(--tinta-2)", border: `1px solid ${ativo ? "var(--mata)" : "var(--linha)"}`, whiteSpace: "nowrap", minHeight: 36 }}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select
                    aria-label="Filtrar por status de conservação"
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: "var(--raio)", border: "1px solid var(--linha)", fontSize: 15, color: "var(--tinta-2)", cursor: "pointer", background: "var(--branco)", flex: ehMobile ? 1 : "unset", minHeight: 36 }}
                  >
                    {filtrosStatus.map((s) => (
                      <option key={s} value={s}>
                        {s === "Todos" ? "Qualquer status" : s}
                      </option>
                    ))}
                  </select>
                  {ehMobile && <span style={{ fontSize: 15, color: "var(--tinta-3)", whiteSpace: "nowrap" }}>{contador}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1120, margin: "0 auto", padding: ehMobile ? "28px 16px 56px" : "48px 24px 80px" }}>
          {filtrados.length === 0 ? (
            <div style={{ padding: "64px 0", maxWidth: 420 }}>
              <p style={{ fontSize: 18, color: "var(--tinta)", marginBottom: 12 }}>Nenhuma espécie encontrada com esses filtros.</p>
              <button
                type="button"
                className="link"
                style={{ padding: 0 }}
                onClick={() => {
                  setBusca("");
                  setFiltroBioma("Todos");
                  setFiltroStatus("Todos");
                }}
              >
                Limpar a busca e os filtros
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: colunas, gap: ehMobile ? "40px 16px" : "56px 32px" }}>
              {filtrados.map((animal) => {
                const cor = corDaTendencia(animal.tendencia);
                const atual = animal.tendencia.at(-1) ?? 0;
                return (
                  <article key={animal.nome} className="animal-card" onClick={() => setSelecionado(animal)} style={{ cursor: "pointer" }}>
                    <div style={{ aspectRatio: "4 / 3", overflow: "hidden", borderRadius: "var(--raio)", marginBottom: 14, background: "var(--linha)" }}>
                      <ImagemComReserva src={animal.imagem} alt={animal.nome} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>

                    <p style={{ fontSize: 14, fontWeight: 600, color: corDoStatus[animal.status], marginBottom: 2 }}>{animal.status}</p>
                    <h2 className="nome-animal" style={{ fontSize: 22, margin: "0 0 2px", transition: "color 0.15s" }}>
                      {animal.nome}
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--tinta-3)", marginBottom: 8 }}>{animal.bioma}</p>
                    <p style={{ fontSize: 16, color: "var(--tinta-2)", marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{animal.descricao}</p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 14, marginBottom: 2 }}>
                      <span style={{ color: "var(--tinta-3)" }}>População</span>
                      <span style={{ color: "var(--tinta-2)" }}>
                        {atual === 0 ? "extinta" : `${numero.format(atual)} indivíduos`} · <span style={{ color: cor, fontWeight: 600 }}>{variacao(animal.tendencia)}</span>
                      </span>
                    </div>
                    <MiniGrafico tendencia={animal.tendencia} cor={cor} />

                    {/* O clique sobe até o card; o botão existe para quem navega pelo teclado. */}
                    <button type="button" className="link" aria-label={`Ver ficha de ${animal.nome}`} style={{ padding: 0, marginTop: 10, fontSize: 15 }}>
                      Ver ficha →
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selecionado && <Ficha animal={selecionado} ehMobile={ehMobile} aoFechar={() => setSelecionado(null)} />}

      <footer style={{ borderTop: "1px solid var(--linha)", padding: ehMobile ? "20px 16px" : "24px", fontSize: 14, color: "var(--tinta-3)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>© 2025 EcoMapBrasil · Dados de conservação baseados em IUCN, ICMBio e WWF Brasil.</div>
      </footer>
    </div>
  );
}
