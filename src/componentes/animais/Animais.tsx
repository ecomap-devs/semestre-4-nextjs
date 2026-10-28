"use client";

import { useState } from "react";

import { CabecalhoInterno, alturaCabecalhoInterno } from "@/componentes/comum/CabecalhoInterno";
import { useLarguraJanela } from "@/componentes/comum/ganchos";
import { Dialogo } from "@/componentes/comum/Dialogo";
import { ImagemComReserva } from "@/componentes/comum/ImagemComReserva";
import { animais, corDoStatus, filtrosBioma, filtrosStatus, type Animal } from "@/dados/animais";
import { listaNacional } from "@/dados/especies";

// Porte da Animais.jsx. Cores e fontes vêm das variáveis do globals.css.

const numero = new Intl.NumberFormat("pt-BR");

/** Busca sem acento e sem caixa: "onca" acha "Onça-pintada". */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

// Até 28/10/2026 o card e a ficha mostravam um gráfico da população de 2000 a 2024 e a
// variação no período. Nenhuma fonte tem essa série para estas espécies: os números
// eram inventados. No lugar, os dois status e a estimativa publicada, quando há.

/** Os dois status lado a lado: o do Brasil e o do mundo. */
function Status({ animal, tamanho }: { animal: Animal; tamanho: number }) {
  return (
    <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {[
        { rotulo: "No Brasil (MMA)", valor: animal.status, cor: corDoStatus[animal.status] },
        { rotulo: "No mundo (IUCN)", valor: animal.iucn ?? "Não avaliada", cor: "var(--tinta)" },
      ].map((d) => (
        // No <dl> o termo vem antes do valor; column-reverse põe o valor em cima.
        <div key={d.rotulo} style={{ borderTop: "1px solid var(--linha)", paddingTop: 10, display: "flex", flexDirection: "column-reverse", justifyContent: "flex-end" }}>
          <dt style={{ fontSize: 14, color: "var(--tinta-3)" }}>{d.rotulo}</dt>
          <dd style={{ fontFamily: "var(--fonte-titulo)", fontSize: tamanho, color: d.cor, lineHeight: 1.15 }}>{d.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function Ficha({ animal, ehMobile, aoFechar }: { animal: Animal; ehMobile: boolean; aoFechar: () => void }) {
  return (
    // Foco preso na ficha, fundo inerte, Esc fecha e o foco volta ao card (Dialogo).
    <Dialogo aoFechar={aoFechar} idTitulo="titulo-ficha" classeFundo="modal-overlay" classeCaixa="modal-content" fechaNoFundo>
      <div style={{ height: ehMobile ? 200 : 300, position: "relative", background: "var(--linha)" }}>
        <ImagemComReserva src={animal.imagem} alt={animal.nome} loading="eager" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
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
        <h2 id="titulo-ficha" style={{ fontSize: ehMobile ? 26 : 32, margin: "0 0 2px" }}>
          {animal.nome}
        </h2>
        <p style={{ fontSize: 15, color: "var(--tinta-3)", marginBottom: 16 }}>
          <i>{animal.cientifico}</i> · {animal.bioma} · {animal.regiao}
        </p>

        <p style={{ fontSize: 16, color: "var(--tinta-2)", marginBottom: 24 }}>{animal.descricao}</p>

        <div style={{ marginBottom: 24 }}>
          <Status animal={animal} tamanho={ehMobile ? 22 : 26} />
        </div>

        {animal.populacao && (
          <>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>População estimada</h3>
            <p style={{ fontSize: 16, color: "var(--tinta-2)", marginBottom: 24 }}>
              {animal.populacao.texto}.{" "}
              <a href={animal.populacao.link} target="_blank" rel="noopener noreferrer" className="link">
                {animal.populacao.fonte}
              </a>
            </p>
          </>
        )}

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
    { valor: numero.format(listaNacional.ameacadas), rotulo: "espécies da fauna ameaçadas no Brasil" },
    { valor: numero.format(animais.length), rotulo: "delas neste catálogo" },
  ];

  return (
    <div style={{ background: "var(--papel)", minHeight: "100vh" }}>
      <style>{`
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
        {/* Abertura sobre a foto da primeira espécie, como a faixa de foto da Home. */}
        <div style={{ position: "relative", minHeight: ehMobile ? 420 : 520, display: "flex", alignItems: "flex-end", backgroundImage: `url('${animais[0]?.imagem}')`, backgroundSize: "cover", backgroundPosition: "center 35%", backgroundColor: "var(--mata-noite)" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,24,18,0.92) 0%, rgba(16,24,18,0.45) 55%, rgba(16,24,18,0.2) 100%)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 1120, margin: "0 auto", padding: ehMobile ? "48px 16px 32px" : "80px 24px 48px" }}>
            <h1 style={{ fontSize: ehMobile ? 38 : "clamp(48px, 6vw, 80px)", margin: "0 0 16px", maxWidth: 820, color: "var(--branco)", letterSpacing: "-0.02em", lineHeight: 1.02 }}>Espécies que o desmatamento está levando embora</h1>
            <p style={{ fontSize: ehMobile ? 17 : 20, maxWidth: 600, marginBottom: 28, color: "rgba(255,253,248,0.85)" }}>
              Cada uma depende de um pedaço de mata que está sumindo. Toque numa espécie para ver o status dela no Brasil e no mundo, e quantas restam, onde alguém contou.
            </p>
            <p style={{ display: "flex", flexWrap: "wrap", gap: "8px 32px", fontSize: 16, color: "rgba(255,253,248,0.78)" }}>
              {resumo.map((s) => (
                <span key={s.rotulo}>
                  <strong style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 500, fontSize: ehMobile ? 30 : 40, color: "var(--sol)", marginRight: 8 }}>{s.valor}</strong>
                  {s.rotulo}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div style={{ background: "var(--papel)", borderBottom: "1px solid var(--linha)", padding: ehMobile ? "12px 16px" : "16px 24px", position: "sticky", top: alturaCabecalhoInterno(ehMobile), zIndex: 40 }}>
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
                return (
                  <article key={animal.nome} className="animal-card" onClick={() => setSelecionado(animal)} style={{ cursor: "pointer" }}>
                    <div style={{ aspectRatio: "4 / 3", overflow: "hidden", borderRadius: "var(--raio)", marginBottom: 14, background: "var(--linha)" }}>
                      <ImagemComReserva src={animal.imagem} alt={animal.nome} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                    </div>

                    <p style={{ fontSize: 14, fontWeight: 600, color: corDoStatus[animal.status], marginBottom: 2 }}>{animal.status}</p>
                    <h2 className="nome-animal" style={{ fontSize: 22, margin: "0 0 2px", transition: "color 0.15s" }}>
                      {animal.nome}
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--tinta-3)", marginBottom: 8 }}>
                      <i>{animal.cientifico}</i> · {animal.bioma}
                    </p>
                    <p style={{ fontSize: 16, color: "var(--tinta-2)", marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{animal.descricao}</p>

                    <p style={{ fontSize: 14, color: "var(--tinta-3)" }}>
                      No mundo (IUCN): <span style={{ color: "var(--tinta-2)" }}>{animal.iucn ?? "não avaliada"}</span>
                    </p>

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
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>© 2025 EcoMapBrasil · Status no Brasil: lista nacional de fauna ameaçada do{" "}
          <a href={listaNacional.fonte} target="_blank" rel="noopener noreferrer" className="link">
            MMA
          </a>{" "}
          (avaliação de {listaNacional.ano}). No mundo: Lista Vermelha da IUCN, pelo GBIF. População: a fonte de cada estimativa está na ficha.</div>
      </footer>
    </div>
  );
}
