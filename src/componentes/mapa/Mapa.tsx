"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

import { useLarguraJanela } from "@/componentes/comum/ganchos";
import { biomas, linhaDoTempoMapa, type Bioma } from "@/dados/biomas";

import type { EstadoAlertas, Fundo, ResumoAlertas } from "./MapaLeaflet";

const milhar = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const umaCasa = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** "1,2 mi ha" ou "845.320 ha". */
function hectares(ha: number): string {
  return ha >= 1_000_000 ? `${umaCasa.format(ha / 1_000_000)} mi ha` : `${milhar.format(ha)} ha`;
}

// Porte da Mapa.jsx. O Leaflet era baixado do unpkg sem versão fixa; agora vem do npm
// e só carrega no navegador.

function Carregando() {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,17,23,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 9999, gap: 16 }}>
      <div style={{ width: 44, height: 44, border: "4px solid rgba(74,222,128,0.2)", borderTop: "4px solid #4ade80", borderRadius: "50%", animation: "girar 0.8s linear infinite" }} />
      <p style={{ color: "#4ade80", fontSize: 15, margin: 0, fontWeight: 500 }}>Carregando mapa...</p>
    </div>
  );
}

const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), { ssr: false, loading: Carregando });

function LinhaDoTempoLista() {
  return (
    <div style={{ position: "relative" }}>
      {linhaDoTempoMapa.map((item, i) => (
        <div key={item.ano} style={{ display: "flex", gap: 12, marginBottom: 16, position: "relative" }}>
          {i < linhaDoTempoMapa.length - 1 && <div style={{ position: "absolute", left: 11, top: 22, width: 2, bottom: -16, background: "linear-gradient(to bottom, #16a34a44, transparent)" }} />}
          <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "#16a34a22", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
          </div>
          <div>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#4ade80", background: "#16a34a22", borderRadius: 4, padding: "1px 6px", marginBottom: 3 }}>{item.ano}</div>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{item.texto}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const rotuloPainel = { margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#9ca3af", textTransform: "uppercase" } as const;

export function Mapa() {
  const largura = useLarguraJanela();
  const ehMobile = largura < 768;
  const ehTablet = largura >= 768 && largura < 1024;

  const [biomaAtivo, setBiomaAtivo] = useState<string | null>(null);
  const [foco, setFoco] = useState<{ chave: string; vez: number } | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const [aba, setAba] = useState<"biomas" | "timeline">("biomas");
  const [menuAberto, setMenuAberto] = useState(false);
  const [alertas, setAlertas] = useState<EstadoAlertas>("carregando");
  const [resumo, setResumo] = useState<ResumoAlertas | null>(null);
  const [fundo, setFundo] = useState<Fundo>("claro");

  const focarBioma = (b: Bioma) => {
    setBiomaAtivo(b.chave);
    setFoco((f) => ({ chave: b.chave, vez: (f?.vez ?? 0) + 1 }));
    if (ehMobile) setPainelAberto(false);
  };

  const alturaCabecalho = ehMobile ? 52 : 60;
  const larguraPainel = ehTablet ? 240 : 320;
  const versaoLayout = `${ehMobile}-${ehTablet}-${painelAberto}`;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', sans-serif", background: "#0f1117", overflow: "hidden" }}>
      <style>{`
        .botao-cabecalho { background: rgba(255,255,255,0.12); transition: background 0.2s; }
        .botao-cabecalho:hover { background: rgba(255,255,255,0.22); }
        .bioma-item { transition: all 0.2s; }
        .bioma-item[aria-pressed="false"]:hover { background: rgba(255,255,255,0.07) !important; }
        .leaflet-container { font-family: 'Segoe UI', sans-serif; }
      `}</style>

      <header style={{ background: "linear-gradient(135deg, #1a3a1a 0%, #2d5a27 60%, #3d7a3d 100%)", color: "white", padding: "0 16px", height: alturaCabecalho, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 16px rgba(0,0,0,0.4)", flexShrink: 0, zIndex: 1200, gap: 12 }}>
        <Link
          href="/"
          aria-label="Voltar"
          className="botao-cabecalho"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ehMobile ? 0 : 8, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: ehMobile ? "6px 10px" : "6px 14px", color: "white", fontSize: 13, fontWeight: 600, minWidth: 44, minHeight: 44, textDecoration: "none" }}
        >
          <i className="fas fa-arrow-left" style={{ fontSize: 12 }} />
          {!ehMobile && <span style={{ marginLeft: 6 }}>Voltar</span>}
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", flexShrink: 0 }} />
          <h1 style={{ margin: 0, color: "white", fontSize: ehMobile ? 14 : ehTablet ? 15 : 17, fontWeight: 600, letterSpacing: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ehMobile ? "EcoMapBrasil" : "EcoMapBrasil — Monitoramento de Biomas"}
          </h1>
        </div>

        {ehMobile ? (
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Fontes de dados"
            aria-expanded={menuAberto}
            className="botao-cabecalho"
            style={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 10px", color: "white", cursor: "pointer", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <i className="fas fa-info-circle" style={{ fontSize: 14 }} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>
            <i className="fas fa-satellite" />
            <span>{ehTablet ? "INPE · IBGE" : "Dados: INPE · IBGE · MapBiomas"}</span>
          </div>
        )}
      </header>

      {ehMobile && menuAberto && (
        <div onClick={() => setMenuAberto(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1300, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingTop: alturaCabecalho }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0 0 0 12px", padding: "16px 20px", minWidth: 200 }}>
            <p style={rotuloPainel}>Fontes de dados</p>
            {["INPE", "IBGE", "MapBiomas"].map((fonte) => (
              <div key={fonte} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <i className="fas fa-satellite" style={{ color: "#4ade80", fontSize: 12 }} />
                <span style={{ fontSize: 13, color: "#d1d5db" }}>{fonte}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        <MapaLeaflet
          foco={foco}
          selecionado={biomaAtivo}
          fundo={fundo}
          versaoLayout={versaoLayout}
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
          style={{ position: "absolute", top: 12, right: ehMobile ? 16 : larguraPainel + 16, zIndex: 1000, display: "flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#111827", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
        >
          <i className={`fas ${fundo === "claro" ? "fa-satellite" : "fa-map"}`} style={{ color: "#16a34a" }} />
          {fundo === "claro" ? "Satélite" : "Mapa"}
        </button>

        {alertas !== "ok" && (
          <div role="status" style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "rgba(17,24,39,0.92)", border: "1px solid rgba(255,255,255,0.1)", color: alertas === "falhou" ? "#fca5a5" : "#d1d5db", fontSize: 12, padding: "6px 14px", borderRadius: 20, pointerEvents: "none" }}>
            {alertas === "falhou" ? "Não foi possível carregar os alertas" : "Carregando alertas..."}
          </div>
        )}

        {!ehMobile && (
          <aside style={{ width: larguraPainel, background: "#111827", borderLeft: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ ...rotuloPainel, margin: 0, letterSpacing: 1.2 }}>Painel de Informações</p>
            </div>
            <div style={{ padding: "14px 16px", flex: 1 }}>
              <p style={rotuloPainel}>🌿 Biomas — clique para focar</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 24 }}>
                {biomas.map((b) => {
                  const ativo = biomaAtivo === b.chave;
                  return (
                    <button
                      key={b.chave}
                      type="button"
                      className="bioma-item"
                      aria-pressed={ativo}
                      onClick={() => focarBioma(b)}
                      style={{ display: "flex", alignItems: "center", gap: ehTablet ? 8 : 12, padding: ehTablet ? "8px 10px" : "10px 12px", borderRadius: 10, cursor: "pointer", border: ativo ? `1px solid ${b.cor}` : "1px solid rgba(255,255,255,0.06)", background: ativo ? `${b.cor}22` : "rgba(255,255,255,0.03)", textAlign: "left", width: "100%", minHeight: 44 }}
                    >
                      <div style={{ width: ehTablet ? 30 : 36, height: ehTablet ? 30 : 36, borderRadius: 8, flexShrink: 0, background: `${b.cor}33`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${b.cor}55` }}>
                        <i className={`fas ${b.icone}`} style={{ color: b.cor, fontSize: ehTablet ? 12 : 14 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: ehTablet ? 12 : 13, fontWeight: 600, color: "#f3f4f6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.nome}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{b.desmatamento} desmatado</div>
                      </div>
                      <div style={{ width: ehTablet ? 24 : 32, height: 6, borderRadius: 3, background: `linear-gradient(to right, ${b.cor}, ${b.cor}44)`, opacity: 0.7, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
              <p style={{ ...rotuloPainel, marginBottom: 12 }}>📊 Linha do Tempo</p>
              <LinhaDoTempoLista />
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="fas fa-info-circle" />
              <span>Clique em um bioma no mapa para mais detalhes</span>
            </div>
          </aside>
        )}

        {/* No React a legenda tinha "Limites Estaduais" em azul, mas nenhuma camada azul é
            desenhada. Fonte, período e totais saem do próprio GeoJSON, não de texto fixo. */}
        <div style={{ position: "absolute", bottom: ehMobile ? (painelAberto ? 210 : 90) : 40, left: 16, maxWidth: ehMobile ? "calc(100% - 32px)" : 320, background: "rgba(17,24,39,0.92)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 14px", borderRadius: 10, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", zIndex: 1000, transition: "bottom 0.3s ease" }}>
          <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Legenda</p>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#ef4444", flexShrink: 0, marginTop: 2 }} />
            <div>
              <span style={{ fontSize: 11, color: "#d1d5db" }}>Áreas afetadas (alertas DETER-B / INPE)</span>
              {resumo && (
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                  {resumo.anoMin !== null && (resumo.anoMin === resumo.anoMax ? `${resumo.anoMin} · ` : `${resumo.anoMin}–${resumo.anoMax} · `)}
                  {milhar.format(resumo.total)} alertas · {hectares(resumo.areaHa)}
                </div>
              )}
            </div>
          </div>
          <p style={{ margin: "8px 0 4px", fontSize: 10, color: "#9ca3af" }}>Biomas (limites do IBGE)</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
            {biomas.map((b) => (
              <span key={b.chave} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#d1d5db" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: `${b.cor}55`, border: `1.5px solid ${b.cor}`, flexShrink: 0 }} />
                {b.nome}
              </span>
            ))}
          </div>
        </div>

        {ehMobile && (
          <>
            {!painelAberto && (
              <button
                type="button"
                onClick={() => setPainelAberto(true)}
                aria-label="Ver biomas"
                style={{ position: "absolute", bottom: 20, right: 16, zIndex: 1000, background: "#16a34a", border: "none", borderRadius: 28, padding: "10px 18px", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(22,163,74,0.5)", minHeight: 44 }}
              >
                <i className="fas fa-layer-group" style={{ fontSize: 13 }} />
                Biomas
              </button>
            )}

            <div
              aria-hidden={!painelAberto}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1100, background: "#111827", borderTop: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px 16px 0 0", transform: painelAberto ? "translateY(0)" : "translateY(100%)", visibility: painelAberto ? "visible" : "hidden", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), visibility 0.3s", maxHeight: "60vh", display: "flex", flexDirection: "column" }}
            >
              <button type="button" onClick={() => setPainelAberto(false)} aria-label="Fechar painel" style={{ padding: "10px 0 4px", cursor: "pointer", flexShrink: 0, background: "none", border: "none", width: "100%" }}>
                <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto" }} />
              </button>

              <div role="tablist" style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
                {([
                  ["biomas", "🌿 Biomas"],
                  ["timeline", "📊 Timeline"],
                ] as const).map(([chave, rotulo]) => (
                  <button
                    key={chave}
                    type="button"
                    role="tab"
                    aria-selected={aba === chave}
                    onClick={() => setAba(chave)}
                    style={{ flex: 1, background: "transparent", border: "none", borderBottom: aba === chave ? "2px solid #4ade80" : "2px solid transparent", color: aba === chave ? "#4ade80" : "#9ca3af", fontSize: 13, fontWeight: aba === chave ? 600 : 400, padding: "10px 0", cursor: "pointer", transition: "all 0.15s", minHeight: 44 }}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>

              <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}>
                {aba === "biomas" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {biomas.map((b) => {
                      const ativo = biomaAtivo === b.chave;
                      return (
                        <button
                          key={b.chave}
                          type="button"
                          aria-pressed={ativo}
                          onClick={() => focarBioma(b)}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 10px", borderRadius: 10, cursor: "pointer", border: ativo ? `1px solid ${b.cor}` : "1px solid rgba(255,255,255,0.08)", background: ativo ? `${b.cor}22` : "rgba(255,255,255,0.04)", textAlign: "left", minHeight: 52 }}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: `${b.cor}33`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${b.cor}55` }}>
                            <i className={`fas ${b.icone}`} style={{ color: b.cor, fontSize: 12 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#f3f4f6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.nome}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.desmatamento} desmatado</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <LinhaDoTempoLista />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
