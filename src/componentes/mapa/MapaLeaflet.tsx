"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

import { biomaMaisEspecifico, biomas, type Bioma } from "@/dados/biomas";

// O Leaflet toca `window` no import: este arquivo só é carregado no navegador, por
// `dynamic(..., { ssr: false })` em Mapa.tsx.

export type EstadoAlertas = "carregando" | "ok" | "falhou";

type Props = {
  /** Pedido de foco vindo do painel; `vez` muda a cada clique, mesmo no mesmo bioma. */
  foco: { chave: string; vez: number } | null;
  /** Muda quando o layout em volta muda e o mapa precisa remedir o contêiner. */
  versaoLayout: string;
  aoSelecionarBioma: (chave: string) => void;
  aoMudarAlertas: (estado: EstadoAlertas) => void;
};

const formatoArea = new Intl.NumberFormat("pt-BR");

function htmlDoBioma(b: Bioma): string {
  return `
    <div style="font-family:'Segoe UI',sans-serif;min-width:200px;padding:4px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:12px;height:12px;border-radius:3px;background:${b.cor};flex-shrink:0"></div>
        <h3 style="margin:0;font-size:15px;color:#1a1a1a">${b.nome}</h3>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;font-size:12px;color:#444">
        <div style="display:flex;justify-content:space-between;gap:12px">
          <span style="color:#888">Área total</span>
          <strong>${formatoArea.format(b.areaKm2)} km²</strong>
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px">
          <span style="color:#888">Desmatamento</span>
          <strong style="color:#dc2626">${b.desmatamento}</strong>
        </div>
        <div style="margin-top:4px;padding-top:8px;border-top:1px solid #eee;color:#555;font-style:italic">${b.descricao}</div>
      </div>
    </div>`;
}

/** Retângulo que envolve todos os polígonos do bioma. */
function limitesDo(b: Bioma): L.LatLngBounds {
  return L.latLngBounds(b.poligonos.flatMap((p) => p[0] ?? []).map(([lng, lat]) => L.latLng(lat, lng)));
}

function focar(m: L.Map, bioma: Bioma, onde?: L.LatLng) {
  const limites = limitesDo(bioma);
  m.fitBounds(limites, { padding: [40, 40] });
  L.popup().setLatLng(onde ?? limites.getCenter()).setContent(htmlDoBioma(bioma)).openOn(m);
}

export default function MapaLeaflet({ foco, versaoLayout, aoSelecionarBioma, aoMudarAlertas }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);

  // Os callbacks vivem num ref: o efeito que monta o mapa roda uma vez só.
  const callbacks = useRef({ aoSelecionarBioma, aoMudarAlertas });
  useEffect(() => {
    callbacks.current = { aoSelecionarBioma, aoMudarAlertas };
  });

  useEffect(() => {
    if (!container.current || mapa.current) return;
    // SVG, como no React. O renderizador em canvas foi testado e desenhava os alertas
    // pequenos bem mais finos: o mapa parecia ter muito menos desmatamento do que tem.
    const m = L.map(container.current, { center: [-14, -52], zoom: 4, zoomControl: false });
    mapa.current = m;

    L.control.zoom({ position: "bottomright", zoomInTitle: "Aproximar", zoomOutTitle: "Afastar" }).addTo(m);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles © Esri", maxZoom: 18 }).addTo(m);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { attribution: "© Esri", maxZoom: 18 }).addTo(m);
    L.control.scale({ position: "bottomleft", metric: true, imperial: false }).addTo(m);

    // Os biomas não são desenhados (no React eram invisíveis mas clicáveis). O clique é
    // tratado no mapa inteiro para escolher o bioma mais específico: por conta própria,
    // o Leaflet entregaria o polígono que estivesse por cima.
    m.on("click", (e: L.LeafletMouseEvent) => {
      const bioma = biomaMaisEspecifico([e.latlng.lng, e.latlng.lat]);
      if (!bioma) return;
      callbacks.current.aoSelecionarBioma(bioma.chave);
      focar(m, bioma, e.latlng);
    });

    const controlador = new AbortController();
    callbacks.current.aoMudarAlertas("carregando");
    fetch("/alertas-desmatamento.json", { signal: controlador.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GeoJSON.FeatureCollection>;
      })
      .then((dados) => {
        // L.geoJSON lê Polygon e MultiPolygon: os 25% de área que o parser do Flutter
        // perdia não se perdem aqui.
        L.geoJSON(dados, {
          style: { color: "#ef4444", weight: 2, fillColor: "#ef4444", fillOpacity: 0.45 },
          interactive: false,
        }).addTo(m);
        callbacks.current.aoMudarAlertas("ok");
      })
      .catch((erro: unknown) => {
        if (erro instanceof DOMException && erro.name === "AbortError") return;
        console.error("Alertas de desmatamento:", erro);
        callbacks.current.aoMudarAlertas("falhou");
      });

    return () => {
      controlador.abort();
      m.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    const m = mapa.current;
    const bioma = foco && biomas.find((b) => b.chave === foco.chave);
    if (m && bioma) focar(m, bioma);
  }, [foco]);

  useEffect(() => {
    const t = setTimeout(() => mapa.current?.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [versaoLayout]);

  return <div ref={container} role="region" aria-label="Mapa do desmatamento" style={{ flex: 1, height: "100%" }} />;
}
