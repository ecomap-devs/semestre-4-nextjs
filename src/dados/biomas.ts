// Os seis biomas terrestres. Os contornos são o limite oficial do IBGE
// (`biomasContornos.ts`, gerado por `scripts/biomas/gerar.mjs`); área e percentual
// desmatado vêm do PRODES (`prodes.ts`, gerado por `scripts/prodes/gerar.mjs`). Até
// 28/10/2026 eram valores de referência herdados do React, e a Amazônia aparecia 78%
// desmatada. A descrição ainda é a do `biomesData` da Mapa.jsx. No GeoJSON a ordem é [longitude, latitude]. As cores eram as do React
// (azul royal, laranja e verde-limão); viraram tons de terra e de mata, mais perto da
// paisagem de cada bioma, e o Pantanal ficou azulado por ser a planície alagada.

import { contornos } from "./biomasContornos";
import { prodes } from "./prodes";

export type Posicao = [number, number];
export type Anel = Posicao[];

export type Bioma = {
  chave: string;
  nome: string;
  cor: string;
  /** Parte do bioma que o PRODES já mapeou como desmatada, ex.: "20%". */
  desmatamento: string;
  /** Área do bioma segundo o IBGE (2019). */
  areaKm2: number;
  descricao: string;
  /**
   * Cada polígono é uma lista de anéis: o primeiro é o contorno, os demais são
   * buracos (massas d'água que o IBGE tira do bioma).
   */
  poligonos: Anel[][];
};

const referencia: Omit<Bioma, "poligonos" | "desmatamento" | "areaKm2">[] = [
  {
    chave: "amazonia",
    nome: "Amazônia",
    cor: "#2f5a32",
    descricao: "Maior floresta tropical do mundo",
  },
  {
    chave: "cerrado",
    nome: "Cerrado",
    cor: "#c49a3a",
    descricao: "Savana tropical com grande biodiversidade",
  },
  {
    chave: "caatinga",
    nome: "Caatinga",
    cor: "#b8653a",
    descricao: "Vegetação seca adaptada ao semiárido",
  },
  {
    chave: "mata-atlantica",
    nome: "Mata Atlântica",
    cor: "#6f9a5c",
    descricao: "Floresta costeira altamente ameaçada",
  },
  {
    chave: "pantanal",
    nome: "Pantanal",
    cor: "#4f8299",
    descricao: "Maior planície alagada do mundo",
  },
  {
    chave: "pampa",
    nome: "Pampa",
    cor: "#a7a35a",
    descricao: "Campos nativos do Sul do Brasil",
  },
];

/**
 * Vermelho dos alertas do DETER-B, no mapa e na legenda. Mais fechado que os tons dos
 * biomas, para não se confundir com a Caatinga. Mora aqui, e não no MapaLeaflet, para
 * a legenda não puxar o Leaflet para fora do carregamento preguiçoso.
 */
export const COR_ALERTA = "#b4232a";

export const biomas: Bioma[] = referencia.map((b) => {
  const medido = prodes[b.chave];
  // Bioma sem dado é erro de geração, não algo para mostrar como "0%".
  if (!medido) throw new Error(`Sem dados do PRODES para "${b.chave}": rode scripts/prodes/gerar.mjs`);
  return {
    ...b,
    desmatamento: `${Math.round((medido.acumuladoKm2 / medido.areaKm2) * 100)}%`,
    areaKm2: medido.areaKm2,
    poligonos: contornos[b.chave] ?? [],
  };
});

function contem(anel: Anel, [x, y]: Posicao): boolean {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i]!;
    const [xj, yj] = anel[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Área do anel pela fórmula do cadarço, em graus². Só serve para comparar tamanhos. */
function area(anel: Anel): number {
  let soma = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    soma += (anel[j]![0] + anel[i]![0]) * (anel[j]![1] - anel[i]![1]);
  }
  return Math.abs(soma / 2);
}

/**
 * O bioma do ponto clicado. Até 02/10/2026 os polígonos eram retângulos que se
 * sobrepunham muito (São Paulo caía no Cerrado E na Mata Atlântica). Com o limite do
 * IBGE quase não há sobreposição, mas a simplificação ainda deixa encostos de alguns
 * quilômetros na fronteira; então continua ganhando o **menor** anel que contém o
 * ponto, e não o primeiro da lista. Ponto num buraco (represa, rio) não é do bioma.
 * Porte do `Bioma.maisEspecificoEm` do Flutter.
 */
export function biomaMaisEspecifico(ponto: Posicao): Bioma | null {
  let melhor: Bioma | null = null;
  let menorArea = Infinity;
  for (const bioma of biomas) {
    for (const [externo, ...buracos] of bioma.poligonos) {
      if (!externo || !contem(externo, ponto)) continue;
      if (buracos.some((b) => contem(b, ponto))) continue;
      const a = area(externo);
      if (a < menorArea) {
        menorArea = a;
        melhor = bioma;
      }
    }
  }
  return melhor;
}
