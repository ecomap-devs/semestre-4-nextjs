"use client";

import { useState } from "react";

import { useApareceu } from "@/componentes/comum/ganchos";
import { biomas, type Anel } from "@/dados/biomas";

// Os seis biomas desenhados em SVG com o mesmo contorno do IBGE do mapa interativo.
// Não carrega o Leaflet nem o GeoJSON dos alertas na Home. Passar o mouse (ou tocar,
// ou focar pelo teclado) num bioma destaca ele e mostra quanto já foi desmatado.

// Projeção equirretangular com a longitude encolhida pelo cosseno da latitude média
// do Brasil (~15° S), para o país não sair achatado.
const ESCALA_X = Math.cos((15 * Math.PI) / 180);

const pontos = biomas.flatMap((b) => b.poligonos.flat(2));
const minX = Math.min(...pontos.map(([lon]) => lon * ESCALA_X));
const maxX = Math.max(...pontos.map(([lon]) => lon * ESCALA_X));
const minY = Math.min(...pontos.map(([, lat]) => -lat));
const maxY = Math.max(...pontos.map(([, lat]) => -lat));

const anelParaCaminho = (anel: Anel) =>
  anel.map(([lon, lat], i) => `${i === 0 ? "M" : "L"}${(lon * ESCALA_X - minX).toFixed(2)},${(-lat - minY).toFixed(2)}`).join("") + "Z";

// "78% da Amazônia", "45% do Cerrado".
const masculinos = new Set(["cerrado", "pantanal", "pampa"]);

const desenhos = biomas.map((b) => ({ ...b, d: b.poligonos.flatMap((p) => p.map(anelParaCaminho)).join("") }));

export function MapaBiomas() {
  const [ref, apareceu] = useApareceu<HTMLElement>(0.3);
  const [ativo, setAtivo] = useState<string | null>(null);
  const bioma = biomas.find((b) => b.chave === ativo);

  return (
    <figure ref={ref} style={{ margin: "0 auto", width: "100%", maxWidth: 480 }} onMouseLeave={() => setAtivo(null)}>
      <svg viewBox={`-0.5 -0.5 ${maxX - minX + 1} ${maxY - minY + 1}`} role="img" aria-label="Mapa dos seis biomas brasileiros" style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
        {desenhos.map((b, i) => (
          // evenodd deixa os buracos (massas d'água) vazados.
          <path
            key={b.chave}
            d={b.d}
            fill={b.cor}
            fillRule="evenodd"
            strokeWidth={0.12}
            strokeLinejoin="round"
            onMouseEnter={() => setAtivo(b.chave)}
            onClick={() => setAtivo(b.chave)}
            style={{
              stroke: "var(--papel)",
              cursor: "pointer",
              opacity: !apareceu ? 0 : ativo && ativo !== b.chave ? 0.3 : 1,
              transition: `opacity 0.5s ease ${apareceu && !ativo ? i * 120 : 0}ms`,
            }}
          >
            <title>{b.nome}</title>
          </path>
        ))}
      </svg>

      {/* Altura fixa: o texto trocar não pode empurrar a legenda. */}
      <div aria-live="polite" style={{ minHeight: 64, marginTop: 20, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        {bioma ? (
          <>
            <span style={{ fontFamily: "var(--fonte-titulo)", fontSize: 44, lineHeight: 1, color: "var(--terra)" }}>{bioma.desmatamento}</span>
            <span style={{ fontSize: 17, color: "var(--tinta-2)" }}>
              {masculinos.has(bioma.chave) ? "do" : "da"} <strong style={{ color: "var(--tinta)", fontWeight: 600 }}>{bioma.nome}</strong> já foi desmatado
            </span>
          </>
        ) : (
          <span style={{ fontSize: 16, color: "var(--tinta-3)" }}>Passe o mouse ou toque num bioma.</span>
        )}
      </div>

      <figcaption style={{ display: "flex", flexWrap: "wrap", gap: "4px 6px", marginTop: 8 }}>
        {biomas.map((b) => (
          <button
            key={b.chave}
            type="button"
            aria-pressed={ativo === b.chave}
            onMouseEnter={() => setAtivo(b.chave)}
            onFocus={() => setAtivo(b.chave)}
            onClick={() => setAtivo(b.chave)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: ativo === b.chave ? "var(--tinta)" : "var(--tinta-2)", background: ativo === b.chave ? "var(--branco)" : "transparent", border: `1px solid ${ativo === b.chave ? "var(--linha)" : "transparent"}`, borderRadius: 999, padding: "4px 10px", cursor: "pointer", minHeight: 32 }}
          >
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: b.cor }} />
            {b.nome}
          </button>
        ))}
      </figcaption>
    </figure>
  );
}
