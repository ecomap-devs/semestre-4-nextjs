// GERADO por scripts/especies/gerar.mjs — não edite à mão.
//
// Status de conservação das espécies do catálogo. Lista nacional: CSV de fauna ameaçada
// do Portal de Dados Abertos do MMA (a avaliação da Portaria MMA nº 148/2022). Lista
// Vermelha da IUCN: pela API do GBIF.

/** Categorias de ameaça da lista nacional (EX, EW e RE são extinções). */
export type CategoriaNacional = "EX" | "EW" | "RE" | "CR" | "EN" | "VU";
/** Categorias da Lista Vermelha da IUCN. */
export type CategoriaIUCN = "EX" | "EW" | "CR" | "EN" | "VU" | "NT" | "LC" | "DD";

export const listaNacional = {
  /** Ano da avaliação no CSV do MMA. */
  ano: 2021,
  /** Quando o MMA publicou o CSV no portal. */
  publicadaEm: "2023-06-16",
  /** Espécies e subespécies da fauna em CR, EN ou VU. */
  ameacadas: 1259,
  porCategoria: { CR: 362, EN: 425, VU: 472 },
  fonte: "https://dados.mma.gov.br/dataset/especies-ameacadas",
};

export const statusEspecies: Record<string, { nacional: CategoriaNacional | null; iucn: CategoriaIUCN | null }> = {
  "Panthera onca": { nacional: "VU", iucn: "NT" },
  "Anodorhynchus leari": { nacional: "EN", iucn: "EN" },
  "Leontopithecus rosalia": { nacional: "EN", iucn: "EN" },
  "Chrysocyon brachyurus": { nacional: "VU", iucn: "NT" },
  "Myrmecophaga tridactyla": { nacional: "VU", iucn: "VU" },
  "Inia geoffrensis": { nacional: "EN", iucn: "EN" },
  "Cyanopsitta spixii": { nacional: "CR", iucn: "EW" },
};
