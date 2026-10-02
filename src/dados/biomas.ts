// Os seis biomas terrestres. Os contornos são o limite oficial do IBGE
// (`biomasContornos.ts`, gerado por `scripts/biomas/gerar.mjs`); área, percentual e
// descrição continuam sendo os valores de referência herdados do `biomesData` da
// Mapa.jsx. No GeoJSON a ordem é [longitude, latitude].

import { contornos } from "./biomasContornos";

export type Posicao = [number, number];
export type Anel = Posicao[];

export type Bioma = {
  chave: string;
  nome: string;
  cor: string;
  icone: string;
  desmatamento: string;
  areaKm2: number;
  descricao: string;
  /**
   * Cada polígono é uma lista de anéis: o primeiro é o contorno, os demais são
   * buracos (massas d'água que o IBGE tira do bioma).
   */
  poligonos: Anel[][];
};

const referencia: Omit<Bioma, "poligonos">[] = [
  {
    chave: "amazonia",
    nome: "Amazônia",
    cor: "#0d5016",
    icone: "fa-tree",
    desmatamento: "78%",
    areaKm2: 5500000,
    descricao: "Maior floresta tropical do mundo",
  },
  {
    chave: "cerrado",
    nome: "Cerrado",
    cor: "#d4a017",
    icone: "fa-sun",
    desmatamento: "45%",
    areaKm2: 2036448,
    descricao: "Savana tropical com grande biodiversidade",
  },
  {
    chave: "caatinga",
    nome: "Caatinga",
    cor: "#ff6b35",
    icone: "fa-water",
    desmatamento: "15%",
    areaKm2: 844453,
    descricao: "Vegetação seca adaptada ao semiárido",
  },
  {
    chave: "mata-atlantica",
    nome: "Mata Atlântica",
    cor: "#4169e1",
    icone: "fa-leaf",
    desmatamento: "32%",
    areaKm2: 1110182,
    descricao: "Floresta costeira altamente ameaçada",
  },
  {
    chave: "pantanal",
    nome: "Pantanal",
    cor: "#8b4513",
    icone: "fa-frog",
    desmatamento: "12%",
    areaKm2: 150355,
    descricao: "Maior planície alagada do mundo",
  },
  {
    chave: "pampa",
    nome: "Pampa",
    cor: "#32cd32",
    icone: "fa-seedling",
    desmatamento: "25%",
    areaKm2: 176496,
    descricao: "Campos nativos do Sul do Brasil",
  },
];

export const biomas: Bioma[] = referencia.map((b) => ({ ...b, poligonos: contornos[b.chave] ?? [] }));

export const linhaDoTempoMapa = [
  { ano: "2023", texto: "Recorde de desmatamento na Amazônia: 11.568 km²" },
  { ano: "2020", texto: "Cerrado perde 7.340 km² de vegetação nativa" },
  { ano: "2018", texto: "Mata Atlântica tem apenas 12,4% de sua cobertura original" },
  { ano: "2015", texto: "Pantanal perde 12% de sua área para queimadas" },
  { ano: "2010", texto: "Caatinga tem 45% de sua área original desmatada" },
];

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
