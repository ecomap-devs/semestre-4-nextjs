"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { CabecalhoInterno } from "@/componentes/comum/CabecalhoInterno";
import { biomas, COR_ALERTA, type Bioma } from "@/dados/biomas";
import { linhaDoTempoMapa } from "@/dados/linhaDoTempo";
import type { PeriodoAlertas, ResumoAlertas } from "@/tipos/alertas";

import type { EstadoAlertas, Fundo } from "./MapaLeaflet";

const milhar = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

const PERIODOS: { meses: PeriodoAlertas; rotulo: string }[] = [
  { meses: 1, rotulo: "1 mês" },
  { meses: 3, rotulo: "3 meses" },
  { meses: 12, rotulo: "12 meses" },
];

/** "2026-10-16" -> "16/10/2026". */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
const umaCasa = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** "1,2 mi ha" ou "845.320 ha". */
function hectares(ha: number): string {
  return ha >= 1_000_000 ? `${umaCasa.format(ha / 1_000_000)} mi ha` : `${milhar.format(ha)} ha`;
}

// Porte da Mapa.jsx. O Leaflet era baixado do unpkg sem versão fixa; agora vem do npm
// e só carrega no navegador. O painel e a legenda eram escuros, de dashboard; agora
// seguem o papel e a tinta do resto do site.

function Carregando() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--papel)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, gap: 12 }}>
      <div style={{ width: 22, height: 22, border: "2px solid var(--linha)", borderTopColor: "var(--mata)", borderRadius: "50%", animation: "girar 0.8s linear infinite" }} />
      <p style={{ color: "var(--tinta-2)", fontSize: 16, margin: 0 }}>Carregando o mapa...</p>
    </div>
  );
}

const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), { ssr: false, loading: Carregando });

function LinhaDoTempoLista() {
  return (
    <ol style={{ listStyle: "none", borderLeft: "1px solid var(--linha)", marginLeft: 5 }}>
      {linhaDoTempoMapa.map((item) => (
        <li key={`${item.ano}-${item.titulo}`} style={{ position: "relative", padding: "0 0 16px 18px" }}>
          <span aria-hidden="true" style={{ position: "absolute", left: -5, top: 6, width: 9, height: 9, borderRadius: "50%", background: "var(--papel)", border: "2px solid var(--mata)" }} />
          <div style={{ fontSize: 14, color: "var(--tinta-3)", fontVariantNumeric: "tabular-nums" }}>{item.ano}</div>
          <p style={{ margin: 0, fontSize: 15, color: "var(--tinta-2)", lineHeight: 1.45 }}>{item.texto}</p>
        </li>
      ))}
    </ol>
  );
}

const tituloPainel = { margin: "0 0 10px", fontSize: 18 } as const;

/**
 * Um bioma na lista do painel: amostra de cor, nome e quanto foi desmatado. O nome
 * nunca é cortado: no painel de 260px "Mata Atlântica" virava "Mata Atlân…"; se não
 * couber ao lado, o percentual desce para a linha de baixo. `compacto` é o painel do
 * celular; o do tablet fica compacto pelo CSS (`.mapa-painel .bioma-item`).
 */
function ItemBioma({ b, ativo, compacto = false, aoEscolher }: { b: Bioma; ativo: boolean; compacto?: boolean; aoEscolher: () => void }) {
  return (
    <button
      type="button"
      className={`bioma-item${compacto ? " bioma-compacto" : ""}`}
      aria-pressed={ativo}
      onClick={aoEscolher}
      style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: "var(--raio)", cursor: "pointer", border: `1px solid ${ativo ? "var(--tinta-3)" : "transparent"}`, background: ativo ? "var(--branco)" : "transparent", textAlign: "left", width: "100%", minHeight: 44 }}
    >
      <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 2, background: b.cor, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", columnGap: 8 }}>
        <span className="bioma-nome" style={{ color: "var(--tinta)" }}>{b.nome}</span>
        <span style={{ fontSize: 14, color: "var(--tinta-3)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{b.desmatamento} desmatado</span>
      </span>
    </button>
  );
}

/** Celular pela mesma largura do CSS; só para eventos, nunca para desenhar. */
function ehCelular(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

export function Mapa() {
  const [biomaAtivo, setBiomaAtivo] = useState<string | null>(null);
  const [foco, setFoco] = useState<{ chave: string; vez: number } | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const [aba, setAba] = useState<"biomas" | "timeline">("biomas");
  const [alertas, setAlertas] = useState<EstadoAlertas>("carregando");
  const [resumo, setResumo] = useState<ResumoAlertas | null>(null);
  const [fundo, setFundo] = useState<Fundo>("claro");
  const [periodo, setPeriodo] = useState<PeriodoAlertas>(12);
  // Só vale no celular, onde a legenda cobria um terço do mapa: começa recolhida, com
  // o título e o botão para abrir. No tablet e no desktop ela aparece inteira sempre.
  const [legendaAberta, setLegendaAberta] = useState(false);

  const focarBioma = (b: Bioma) => {
    setBiomaAtivo(b.chave);
    setFoco((f) => ({ chave: b.chave, vez: (f?.vez ?? 0) + 1 }));
    if (ehCelular()) setPainelAberto(false);
  };

  // A troca entre celular, tablet e desktop é no CSS e vem com o resize da janela, que
  // o Leaflet já acompanha; só o painel do celular precisa avisar o mapa.
  const versaoLayout = String(painelAberto);
  const cartaoFlutuante = { background: "var(--branco)", border: "1px solid var(--linha)", borderRadius: "var(--raio)", boxShadow: "0 2px 12px rgba(29,38,32,0.12)" } as const;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--papel)", overflow: "hidden" }}>
      <style>{`
        .bioma-item { transition: background 0.15s, border-color 0.15s; }
        .bioma-item[aria-pressed="false"]:hover { background: var(--papel-2) !important; }
        .botao-fundo:hover { background: var(--papel-2) !important; }
        .botao-periodo[aria-pressed="false"]:hover { border-color: var(--tinta-3) !important; }
        .leaflet-container { font-family: var(--fonte-texto), system-ui, sans-serif; background: var(--papel-2); }
        .leaflet-popup-content-wrapper { border-radius: var(--raio); }
        /* No celular o zoom é por pinça, e o +/− ficava escondido atrás do botão Biomas. */
        @media (max-width: 767px) { .leaflet-control-zoom { display: none; } }

        /* Celular, tablet e desktop no CSS, não em JS (useLarguraJanela até 11/11/2026):
           o HTML estático saía como desktop, e a legenda deslizava de 32 para 84px
           depois que a página abria. */
        .mapa-painel { width: 320px; display: flex; }
        .botao-fundo { right: 336px; }
        .bioma-item { padding: 9px 12px; }
        .bioma-nome { font-size: 16px; }
        .bioma-compacto { padding: 8px 10px; }
        .bioma-compacto .bioma-nome { font-size: 15px; }
        .mapa-legenda { bottom: 32px; max-width: 320px; }
        .legenda-alternar { display: none; }
        @media (min-width: 768px) and (max-width: 1023px) {
          .mapa-painel { width: 260px; }
          .botao-fundo { right: 276px; }
          .mapa-painel .bioma-item { padding: 8px 10px; }
          .mapa-painel .bioma-nome { font-size: 15px; }
        }
        @media (max-width: 767px) {
          .mapa-painel { display: none; }
          .botao-fundo { right: 16px; }
          .mapa-legenda { bottom: 84px; max-width: calc(100% - 32px); }
          .mapa-legenda[data-painel="true"] { bottom: 210px; }
          .legenda-alternar { display: flex; }
          .mapa-legenda[data-aberta="false"] .legenda-detalhe { display: none; }
        }
      `}</style>

      {/* O seletor de fontes do celular (um botão "i" com menu) virou a linha de fontes
          da legenda, que já aparecia lá. */}
      {/* O título longo cortava "por pouco" no tablet: até 1023px vai o curto. */}
      <CabecalhoInterno
        titulo="Mapa do desmatamento nos biomas"
        tituloCurto="Mapa do desmatamento"
        tituloDaPagina
        larguraTotal
        extra={
          <span className="so-desktop" style={{ fontSize: 14, color: "var(--tinta-3)", flexShrink: 0 }}>
            Dados: INPE e IBGE
          </span>
        }
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        <MapaLeaflet
          foco={foco}
          selecionado={biomaAtivo}
          fundo={fundo}
          versaoLayout={versaoLayout}
          periodo={periodo}
          aoSelecionarBioma={setBiomaAtivo}
          aoMudarAlertas={setAlertas}
          aoResumirAlertas={setResumo}
        />

        {/* No desktop o painel lateral ocupa a direita: o botão fica à esquerda dele. */}
        <button
          type="button"
          onClick={() => setFundo((f) => (f === "claro" ? "satelite" : "claro"))}
          aria-label={fundo === "claro" ? "Mostrar imagem de satélite" : "Mostrar mapa"}
          className="botao-fundo"
          style={{ ...cartaoFlutuante, position: "absolute", top: 12, zIndex: 1000, display: "flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 14px", color: "var(--tinta)", fontSize: 15, cursor: "pointer", transition: "background 0.15s" }}
        >
          <i className={`fas ${fundo === "claro" ? "fa-satellite" : "fa-map"}`} aria-hidden="true" style={{ color: "var(--mata)" }} />
          {fundo === "claro" ? "Satélite" : "Mapa"}
        </button>

        {alertas !== "ok" && (
          <div role="status" style={{ ...cartaoFlutuante, position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, color: alertas === "falhou" ? "var(--terra)" : "var(--tinta-2)", fontSize: 14, padding: "6px 14px", pointerEvents: "none", whiteSpace: "nowrap" }}>
            {alertas === "falhou" ? "Não foi possível carregar os alertas" : "Carregando alertas..."}
          </div>
        )}

        <aside className="mapa-painel" aria-label="Biomas e linha do tempo" style={{ background: "var(--papel)", borderLeft: "1px solid var(--linha)", overflowY: "auto", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "20px 16px", flex: 1 }}>
              <h2 style={{ ...tituloPainel, padding: "0 4px" }}>Biomas</h2>
              <p style={{ fontSize: 14, color: "var(--tinta-3)", margin: "0 4px 10px" }}>Escolha um para centralizar o mapa nele.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 28 }}>
                {biomas.map((b) => (
                  <ItemBioma key={b.chave} b={b} ativo={biomaAtivo === b.chave} aoEscolher={() => focarBioma(b)} />
                ))}
              </div>
              <div style={{ padding: "0 4px" }}>
                <h2 style={{ ...tituloPainel, marginBottom: 14 }}>Linha do tempo</h2>
                <LinhaDoTempoLista />
              </div>
            </div>
          </aside>

        {/* No React a legenda tinha "Limites Estaduais" em azul, mas nenhuma camada azul é
            desenhada. Fonte, período e totais saem do próprio GeoJSON, não de texto fixo. */}
        {/* No celular a legenda começa recolhida: com o seletor de período ela tinha
            259px e cobria um terço do mapa em 375px. */}
        <div className="mapa-legenda" data-painel={painelAberto} data-aberta={legendaAberta} style={{ ...cartaoFlutuante, position: "absolute", left: 16, padding: "12px 14px", zIndex: 1000, transition: "bottom 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 2, background: COR_ALERTA, flexShrink: 0, marginTop: 4 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, color: "var(--tinta)" }}>Alertas de desmatamento</span>
              <div className="legenda-detalhe" style={{ fontSize: 13, color: "var(--tinta-3)" }}>
                DETER / INPE · Amazônia Legal e Cerrado
                {alertas === "ok" && resumo && resumo.fim && (
                  <>
                    <br />
                    {dataCurta(resumo.inicio)} a {dataCurta(resumo.fim)} · {milhar.format(resumo.total)} alertas · {hectares(resumo.areaHa)}
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              className="legenda-alternar"
              onClick={() => setLegendaAberta((v) => !v)}
              aria-expanded={legendaAberta}
              aria-controls="legenda-detalhe"
              aria-label={legendaAberta ? "Recolher a legenda" : "Abrir a legenda"}
              style={{ alignItems: "center", justifyContent: "center", width: 44, height: 44, margin: "-12px -10px -12px 0", background: "none", border: "none", color: "var(--tinta-2)", cursor: "pointer", flexShrink: 0 }}
            >
              <i className={`fas ${legendaAberta ? "fa-chevron-down" : "fa-chevron-up"}`} aria-hidden="true" style={{ fontSize: 13 }} />
            </button>
          </div>
          <div id="legenda-detalhe" className="legenda-detalhe">
          {/* O fim é o alerta mais recente publicado pelo INPE, não o dia de hoje. */}
          <div role="group" aria-label="Período dos alertas" style={{ display: "flex", gap: 6, margin: "10px 0 0" }}>
            {PERIODOS.map((p) => {
              const ativo = periodo === p.meses;
              return (
                <button
                  key={p.meses}
                  type="button"
                  className="botao-periodo"
                  aria-pressed={ativo}
                  onClick={() => setPeriodo(p.meses)}
                  style={{ padding: "4px 10px", borderRadius: 999, fontSize: 14, cursor: "pointer", background: ativo ? "var(--mata)" : "transparent", color: ativo ? "var(--branco)" : "var(--tinta-2)", border: `1px solid ${ativo ? "var(--mata)" : "var(--linha)"}`, minHeight: 32 }}
                >
                  {p.rotulo}
                </button>
              );
            })}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--tinta-3)" }}>Mata Atlântica, Caatinga, Pantanal e Pampa não têm alerta do DETER.</p>
          <p style={{ margin: "10px 0 4px", fontSize: 13, color: "var(--tinta-3)" }}>Biomas, pelo limite do IBGE</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
            {biomas.map((b) => (
              <span key={b.chave} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, color: "var(--tinta-2)" }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: b.cor, flexShrink: 0 }} />
                {b.nome}
              </span>
            ))}
          </div>
          </div>
        </div>

        <div className="so-celular">
            {!painelAberto && (
              <button
                type="button"
                onClick={() => setPainelAberto(true)}
                aria-label="Ver biomas e linha do tempo"
                className="botao botao-cheio"
                style={{ position: "absolute", bottom: 20, right: 16, zIndex: 1000, boxShadow: "0 2px 12px rgba(29,38,32,0.25)", minHeight: 44 }}
              >
                <i className="fas fa-layer-group" aria-hidden="true" style={{ fontSize: 13 }} />
                Biomas
              </button>
            )}

            <div
              aria-hidden={!painelAberto}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1100, background: "var(--papel)", borderTop: "1px solid var(--linha)", borderRadius: "12px 12px 0 0", boxShadow: "0 -4px 20px rgba(29,38,32,0.15)", transform: painelAberto ? "translateY(0)" : "translateY(100%)", visibility: painelAberto ? "visible" : "hidden", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), visibility 0.3s", maxHeight: "60vh", display: "flex", flexDirection: "column" }}
            >
              <button type="button" onClick={() => setPainelAberto(false)} aria-label="Fechar painel" style={{ padding: "10px 0 4px", cursor: "pointer", flexShrink: 0, background: "none", border: "none", width: "100%" }}>
                <div style={{ width: 36, height: 4, background: "var(--linha)", borderRadius: 2, margin: "0 auto" }} />
              </button>

              <div role="tablist" style={{ display: "flex", borderBottom: "1px solid var(--linha)", flexShrink: 0, padding: "0 16px", gap: 20 }}>
                {([
                  ["biomas", "Biomas"],
                  ["timeline", "Linha do tempo"],
                ] as const).map(([chave, rotulo]) => (
                  <button
                    key={chave}
                    type="button"
                    role="tab"
                    aria-selected={aba === chave}
                    onClick={() => setAba(chave)}
                    style={{ background: "transparent", border: "none", borderBottom: `2px solid ${aba === chave ? "var(--mata)" : "transparent"}`, color: aba === chave ? "var(--tinta)" : "var(--tinta-3)", fontSize: 16, fontWeight: aba === chave ? 600 : 400, padding: "10px 0", cursor: "pointer", minHeight: 44 }}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>

              <div style={{ overflowY: "auto", flex: 1, padding: "12px 12px 20px" }}>
                {aba === "biomas" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {biomas.map((b) => (
                      <ItemBioma key={b.chave} b={b} ativo={biomaAtivo === b.chave} compacto aoEscolher={() => focarBioma(b)} />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "4px 4px 0" }}>
                    <LinhaDoTempoLista />
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
