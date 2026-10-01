// Polígonos simplificados dos seis biomas, portados do `biomesData` da Mapa.jsx.
// No GeoJSON a ordem é [longitude, latitude].

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
  /** Cada polígono é uma lista de anéis; o primeiro é o contorno externo. */
  poligonos: Anel[][];
};

export const biomas: Bioma[] = [
  {
    chave: "amazonia",
    nome: "Amazônia",
    cor: "#0d5016",
    icone: "fa-tree",
    desmatamento: "78%",
    areaKm2: 5500000,
    descricao: "Maior floresta tropical do mundo",
    poligonos: [[[[-73.98, 5.27], [-60.11, 5.27], [-49.95, 2.82], [-44.3, -2.33], [-48.63, -16.34], [-57.3, -18.04], [-67.81, -11.87], [-70.09, -9.19], [-73.98, -7.36], [-73.98, 5.27]]]],
  },
  {
    chave: "cerrado",
    nome: "Cerrado",
    cor: "#d4a017",
    icone: "fa-sun",
    desmatamento: "45%",
    areaKm2: 2036448,
    descricao: "Savana tropical com grande biodiversidade",
    poligonos: [[[[-57.3, -18.04], [-48.63, -16.34], [-44.3, -2.33], [-42.54, -2.33], [-35.24, -14.24], [-35.24, -20.3], [-46.63, -24.53], [-52.43, -24.53], [-57.3, -18.04]]]],
  },
  {
    chave: "caatinga",
    nome: "Caatinga",
    cor: "#ff6b35",
    icone: "fa-water",
    desmatamento: "15%",
    areaKm2: 844453,
    descricao: "Vegetação seca adaptada ao semiárido",
    poligonos: [[[[-42.54, -2.33], [-35.24, -2.33], [-34.8, -17.34], [-42.54, -17.34], [-42.54, -2.33]]]],
  },
  {
    chave: "mata-atlantica",
    nome: "Mata Atlântica",
    cor: "#4169e1",
    icone: "fa-leaf",
    desmatamento: "32%",
    areaKm2: 1110182,
    descricao: "Floresta costeira altamente ameaçada",
    poligonos: [
      [[[-35.0, -5.5], [-34.8, -5.5], [-34.8, -17.5], [-35.0, -17.5], [-35.0, -5.5]]],
      [[[-48.5, -19.0], [-40.0, -19.0], [-40.0, -33.75], [-51.0, -33.75], [-51.0, -23.0], [-48.5, -19.0]]],
      [[[-38.5, -12.5], [-34.8, -12.5], [-34.8, -18.0], [-38.5, -18.0], [-38.5, -12.5]]],
    ],
  },
  {
    chave: "pantanal",
    nome: "Pantanal",
    cor: "#8b4513",
    icone: "fa-frog",
    desmatamento: "12%",
    areaKm2: 150355,
    descricao: "Maior planície alagada do mundo",
    poligonos: [[[[-59.18, -14.24], [-55.67, -14.24], [-55.67, -22.27], [-59.18, -22.27], [-59.18, -14.24]]]],
  },
  {
    chave: "pampa",
    nome: "Pampa",
    cor: "#32cd32",
    icone: "fa-seedling",
    desmatamento: "25%",
    areaKm2: 176496,
    descricao: "Campos nativos do Sul do Brasil",
    poligonos: [[[[-57.65, -28.18], [-49.7, -28.18], [-49.7, -33.75], [-57.65, -33.75], [-57.65, -28.18]]]],
  },
];

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
 * O bioma do ponto clicado. Os polígonos simplificados se sobrepõem — o Cerrado cobre
 * boa parte do Sudeste —, e pegar "o primeiro que contém" escolhia pela ordem do
 * arquivo: São Paulo abria a ficha do Cerrado. Ganha o **menor** anel que contém o
 * ponto, que é o mais específico. Porte do `Bioma.maisEspecificoEm` do Flutter.
 */
export function biomaMaisEspecifico(ponto: Posicao): Bioma | null {
  let melhor: Bioma | null = null;
  let menorArea = Infinity;
  for (const bioma of biomas) {
    for (const poligono of bioma.poligonos) {
      const externo = poligono[0];
      if (!externo || !contem(externo, ponto)) continue;
      const a = area(externo);
      if (a < menorArea) {
        menorArea = a;
        melhor = bioma;
      }
    }
  }
  return melhor;
}
