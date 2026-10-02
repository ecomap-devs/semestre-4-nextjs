"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

import { biomaMaisEspecifico, biomas, type Bioma } from "@/dados/biomas";

// O Leaflet toca `window` no import: este arquivo só é carregado no navegador, por
// `dynamic(..., { ssr: false })` em Mapa.tsx.

export type EstadoAlertas = "carregando" | "ok" | "falhou";

/** O fundo do mapa. Começa no claro: biomas e alertas aparecem muito mais sobre ele. */
export type Fundo = "claro" | "satelite";

/** O que a legenda conta dos alertas, calculado do próprio GeoJSON do DETER-B. */
export type ResumoAlertas = { total: number; areaHa: number; anoMin: number | null; anoMax: number | null };

type Props = {
  /** Pedido de foco vindo do painel; `vez` muda a cada clique, mesmo no mesmo bioma. */
  foco: { chave: string; vez: number } | null;
  /** O bioma ativo, desenhado em destaque. */
  selecionado: string | null;
  fundo: Fundo;
  /** Muda quando o layout em volta muda e o mapa precisa remedir o contêiner. */
  versaoLayout: string;
  aoSelecionarBioma: (chave: string) => void;
  aoMudarAlertas: (estado: EstadoAlertas) => void;
  aoResumirAlertas: (resumo: ResumoAlertas) => void;
};

const formatoArea = new Intl.NumberFormat("pt-BR");

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const CREDITO = 'Mapa: <a href="https://www.esri.com">Esri</a> · Biomas: IBGE · Alertas: INPE';

/**
 * As camadas de cada fundo: a base e os nomes de cidades e fronteiras. Os nomes vão
 * num painel acima dos biomas e dos alertas, senão o preenchimento os apagaria.
 */
function camadasDoFundo(fundo: Fundo): { base: L.TileLayer; nomes: L.TileLayer } {
  const comum = { maxZoom: 16 } as const;
  return fundo === "claro"
    ? {
        base: L.tileLayer(`${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, { ...comum, attribution: CREDITO }),
        nomes: L.tileLayer(`${ESRI}/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { ...comum, pane: "nomes" }),
      }
    : {
        base: L.tileLayer(`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, { ...comum, attribution: CREDITO }),
        nomes: L.tileLayer(`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`, { ...comum, pane: "nomes" }),
      };
}

/**
 * Os biomas pelo limite do IBGE. Até 02/10/2026 não eram desenhados: os contornos eram
 * retângulos herdados do React, e mostrá-los seria apresentar fronteira inventada.
 * O preenchimento é fraco de propósito, para não abafar o vermelho dos alertas.
 */
function estiloDoBioma(b: Bioma, ativo: boolean): L.PathOptions {
  return { color: b.cor, weight: ativo ? 3 : 1.2, fillColor: b.cor, fillOpacity: ativo ? 0.3 : 0.12 };
}

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

/** Retângulo que envolve todas as partes do bioma. */
function limitesDo(b: Bioma): L.LatLngBounds {
  return L.latLngBounds(b.poligonos.flatMap((p) => p[0] ?? []).map(([lng, lat]) => L.latLng(lat, lng)));
}

function focar(m: L.Map, bioma: Bioma, onde?: L.LatLng) {
  const limites = limitesDo(bioma);
  m.fitBounds(limites, { padding: [40, 40] });
  L.popup().setLatLng(onde ?? limites.getCenter()).setContent(htmlDoBioma(bioma)).openOn(m);
}

function resumir(dados: GeoJSON.FeatureCollection): ResumoAlertas {
  let areaHa = 0;
  let anoMin: number | null = null;
  let anoMax: number | null = null;
  for (const f of dados.features) {
    const p = f.properties ?? {};
    const area = Number(p.AREAHA);
    if (Number.isFinite(area)) areaHa += area;
    // Ano 0 ou ausente é alerta sem data no arquivo: fica fora do período.
    const ano = Number(p.ANODETEC);
    if (Number.isInteger(ano) && ano > 0) {
      anoMin = anoMin === null || ano < anoMin ? ano : anoMin;
      anoMax = anoMax === null || ano > anoMax ? ano : anoMax;
    }
  }
  return { total: dados.features.length, areaHa, anoMin, anoMax };
}

export default function MapaLeaflet({ foco, selecionado, fundo, versaoLayout, aoSelecionarBioma, aoMudarAlertas, aoResumirAlertas }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camadasBioma = useRef(new Map<string, L.Polygon[]>());

  // Os callbacks vivem num ref: o efeito que monta o mapa roda uma vez só.
  const callbacks = useRef({ aoSelecionarBioma, aoMudarAlertas, aoResumirAlertas });
  useEffect(() => {
    callbacks.current = { aoSelecionarBioma, aoMudarAlertas, aoResumirAlertas };
  });

  useEffect(() => {
    if (!container.current || mapa.current) return;
    // SVG, como no React. O renderizador em canvas foi testado e desenhava os alertas
    // pequenos bem mais finos: o mapa parecia ter muito menos desmatamento do que tem.
    const m = L.map(container.current, { center: [-14, -52], zoom: 4, zoomControl: false });
    mapa.current = m;

    // Painel dos nomes: acima dos biomas e dos alertas (overlayPane é 400), abaixo dos
    // popups, e sem roubar o clique do mapa.
    const painelNomes = m.createPane("nomes");
    painelNomes.style.zIndex = "450";
    painelNomes.style.pointerEvents = "none";

    L.control.zoom({ position: "bottomright", zoomInTitle: "Aproximar", zoomOutTitle: "Afastar" }).addTo(m);
    L.control.scale({ position: "bottomleft", metric: true, imperial: false }).addTo(m);

    // Os biomas entram antes dos alertas, para os alertas ficarem por cima. Não são
    // interativos: o clique é tratado no mapa inteiro, para escolher o bioma mais
    // específico — por conta própria, o Leaflet entregaria o polígono de cima.
    const biomasDesenhados = camadasBioma.current;
    for (const b of biomas) {
      const partes = b.poligonos.map((p) =>
        L.polygon(
          p.map((anel) => anel.map(([lng, lat]) => L.latLng(lat, lng))),
          { ...estiloDoBioma(b, false), interactive: false },
        ).addTo(m),
      );
      biomasDesenhados.set(b.chave, partes);
    }

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
        // perdia não se perdem aqui. O traço de 2 px faz até o alerta pequeno aparecer
        // como ponto com o Brasil inteiro na tela.
        L.geoJSON(dados, {
          style: { color: "#ef4444", weight: 2, fillColor: "#ef4444", fillOpacity: 0.45 },
          interactive: false,
        }).addTo(m);
        callbacks.current.aoResumirAlertas(resumir(dados));
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
      biomasDesenhados.clear();
    };
  }, []);

  // Troca de fundo: as camadas antigas saem inteiras e as novas entram. No app, trocar
  // só o endereço dentro da mesma camada deixava a imagem velha na tela.
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const { base, nomes } = camadasDoFundo(fundo);
    base.addTo(m);
    nomes.addTo(m);
    return () => {
      base.remove();
      nomes.remove();
    };
  }, [fundo]);

  // O destaque é só estilo, sem `bringToFront`: trazer o bioma para a frente o poria
  // por cima dos alertas, e o preenchimento esconderia o vermelho justo nele.
  useEffect(() => {
    for (const b of biomas) {
      for (const parte of camadasBioma.current.get(b.chave) ?? []) {
        parte.setStyle(estiloDoBioma(b, b.chave === selecionado));
      }
    }
  }, [selecionado]);

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
