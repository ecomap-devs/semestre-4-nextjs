"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";

import { useTemaEscuro } from "@/componentes/comum/ganchos";
import { biomaMaisEspecifico, biomas, COR_ALERTA, type Bioma } from "@/dados/biomas";
import { ARQUIVO_DO_PERIODO, paraAlertasDoPeriodo, type AlertasDoPeriodo, type PeriodoAlertas, type ResumoAlertas } from "@/tipos/alertas";

// O Leaflet toca `window` no import: este arquivo só é carregado no navegador, por
// `dynamic(..., { ssr: false })` em Mapa.tsx.

export type EstadoAlertas = "carregando" | "ok" | "falhou";

/**
 * O fundo do mapa. Começa no "claro", o mapa cinza: biomas e alertas aparecem muito mais
 * sobre ele do que sobre o satélite. No tema escuro, esse mapa cinza é o escuro da Esri.
 */
export type Fundo = "claro" | "satelite";

type Props = {
  /** Pedido de foco vindo do painel; `vez` muda a cada clique, mesmo no mesmo bioma. */
  foco: { chave: string; vez: number } | null;
  /** O bioma ativo, desenhado em destaque. */
  selecionado: string | null;
  fundo: Fundo;
  /** Muda quando o layout em volta muda e o mapa precisa remedir o contêiner. */
  versaoLayout: string;
  periodo: PeriodoAlertas;
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
 *
 * No tema escuro, o mapa cinza é o `World_Dark_Gray` da Esri, o mesmo do app; o satélite
 * não muda. É o mesmo servidor (server.arcgisonline.com), já liberado na CSP.
 */
function camadasDoFundo(fundo: Fundo, escuro: boolean): { base: L.TileLayer; nomes: L.TileLayer } {
  const comum = { maxZoom: 16 } as const;
  const cinza = escuro ? "Dark" : "Light";
  return fundo === "claro"
    ? {
        base: L.tileLayer(`${ESRI}/Canvas/World_${cinza}_Gray_Base/MapServer/tile/{z}/{y}/{x}`, { ...comum, attribution: CREDITO }),
        nomes: L.tileLayer(`${ESRI}/Canvas/World_${cinza}_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { ...comum, pane: "nomes" }),
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
    <div style="font-family:var(--fonte-texto),sans-serif;min-width:200px;padding:4px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:12px;height:12px;border-radius:2px;background:${b.cor};flex-shrink:0"></div>
        <h3 style="margin:0;font-size:19px;font-weight:500;font-family:var(--fonte-titulo),serif;color:var(--tinta)">${b.nome}</h3>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;font-size:14px;color:var(--tinta-2)">
        <div style="display:flex;justify-content:space-between;gap:12px">
          <span style="color:var(--tinta-3)">Área total</span>
          <span>${formatoArea.format(b.areaKm2)} km²</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px">
          <span style="color:var(--tinta-3)">Desmatamento</span>
          <strong style="color:var(--terra)">${b.desmatamento}</strong>
        </div>
        <div style="margin-top:4px;padding-top:8px;border-top:1px solid var(--linha)">${b.descricao}</div>
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

/** Área do anel com sinal, pela fórmula do cadarço: o sinal diz o sentido. */
function areaComSinal(anel: GeoJSON.Position[]): number {
  let soma = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi = 0, yi = 0] = anel[i] ?? [];
    const [xj = 0, yj = 0] = anel[j] ?? [];
    soma += xj * yi - xi * yj;
  }
  return soma;
}

/**
 * Os anéis de todos os alertas, no formato de multipolígono do Leaflet: uma lista de
 * polígonos, cada um com o contorno e os buracos.
 *
 * O contorno sai sempre num sentido e o buraco no outro: com `fillRule: "nonzero"`,
 * é isso que mantém o buraco vazio sem depender de o GeoJSON vir bem orientado.
 */
function partesDosAlertas(poligonos: GeoJSON.Position[][][]): L.LatLngExpression[][][] {
  const paraLatLng = (anel: GeoJSON.Position[], contorno: boolean) => {
    const orientado = (areaComSinal(anel) > 0) === contorno ? anel : [...anel].reverse();
    return orientado.map(([lng, lat]) => [lat, lng] as L.LatLngTuple);
  };
  return poligonos.map((aneis) => aneis.map((anel, i) => paraLatLng(anel, i === 0)));
}

export default function MapaLeaflet({ foco, selecionado, fundo, versaoLayout, periodo, aoSelecionarBioma, aoMudarAlertas, aoResumirAlertas }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camadasBioma = useRef(new Map<string, L.Polygon[]>());
  const [baixados, setBaixados] = useState<Partial<Record<PeriodoAlertas, AlertasDoPeriodo>>>({});
  const exibidos = baixados[periodo];
  const jaBaixado = exibidos !== undefined;
  const escuro = useTemaEscuro();

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

    return () => {
      m.remove();
      mapa.current = null;
      biomasDesenhados.clear();
    };
  }, []);

  useEffect(() => {
    if (jaBaixado) return;
    const arquivo = ARQUIVO_DO_PERIODO[periodo];
    const controlador = new AbortController();
    callbacks.current.aoMudarAlertas("carregando");
    fetch(arquivo, { signal: controlador.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<unknown>;
      })
      .then((json) => {
        const dados = paraAlertasDoPeriodo(json, periodo);
        if (!dados) throw new Error(`${arquivo} fora do formato`);
        setBaixados((b) => ({ ...b, [periodo]: dados }));
      })
      .catch((erro: unknown) => {
        if (erro instanceof DOMException && erro.name === "AbortError") return;
        console.error("Alertas de desmatamento:", erro);
        callbacks.current.aoMudarAlertas("falhou");
      });
    return () => {
      controlador.abort();
    };
  }, [periodo, jaBaixado]);

  // Os alertas do período. Trocar o período troca a camada inteira, como no fundo.
  useEffect(() => {
    const m = mapa.current;
    if (!m || !exibidos) return;
    // Todos os alertas num polígono só: UM elemento SVG em vez de dezenas de milhares.
    // Com o `L.geoJSON`, cada alerta virava um <path>, e mexer no mapa travava — mais
    // ainda no celular. O desenho é o mesmo (SVG, traço de 2 px: o alerta pequeno
    // continua aparecendo como ponto de longe). Polygon e MultiPolygon são lidos
    // os dois: os 25% de área que o parser do Flutter perdia não se perdem aqui.
    const camada = L.polygon(partesDosAlertas(exibidos.poligonos), {
      color: COR_ALERTA,
      weight: 2,
      fillColor: COR_ALERTA,
      fillOpacity: 0.45,
      // Num caminho só, o `evenodd` padrão do Leaflet apagava o preenchimento onde
      // dois alertas se cruzam (542 pares, ~1.254 ha, medidos em 28/10/2026).
      fillRule: "nonzero",
      interactive: false,
      // De longe o detalhe do contorno nem aparece; simplificar mais alivia o zoom.
      smoothFactor: 2,
    }).addTo(m);
    callbacks.current.aoResumirAlertas(exibidos.resumo);
    callbacks.current.aoMudarAlertas("ok");
    return () => {
      camada.remove();
    };
  }, [exibidos]);

  // Troca de fundo (ou de tema): as camadas antigas saem inteiras e as novas entram. No
  // app, trocar só o endereço dentro da mesma camada deixava a imagem velha na tela.
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const { base, nomes } = camadasDoFundo(fundo, escuro);
    base.addTo(m);
    nomes.addTo(m);
    return () => {
      base.remove();
      nomes.remove();
    };
  }, [fundo, escuro]);

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
