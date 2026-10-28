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
  "Saguinus bicolor": { nacional: "CR", iucn: "CR" },
  "Ateles marginatus": { nacional: "EN", iucn: "EN" },
  "Guaruba guarouba": { nacional: "VU", iucn: "VU" },
  "Trichechus inunguis": { nacional: "VU", iucn: "VU" },
  "Harpia harpyja": { nacional: "VU", iucn: "VU" },
  "Bradypus variegatus": { nacional: null, iucn: "LC" },
  "Ara chloropterus": { nacional: null, iucn: "LC" },
  "Eunectes murinus": { nacional: null, iucn: "LC" },
  "Mergus octosetaceus": { nacional: "CR", iucn: "CR" },
  "Priodontes maximus": { nacional: "VU", iucn: "VU" },
  "Tapirus terrestris": { nacional: "VU", iucn: "VU" },
  "Speothos venaticus": { nacional: "VU", iucn: "NT" },
  "Ramphastos toco": { nacional: null, iucn: "LC" },
  "Cariama cristata": { nacional: null, iucn: "LC" },
  "Ara ararauna": { nacional: null, iucn: "LC" },
  "Brachyteles hypoxanthus": { nacional: "CR", iucn: "CR" },
  "Aburria jacutinga": { nacional: "EN", iucn: null },
  "Leopardus guttulus": { nacional: "VU", iucn: "VU" },
  "Ramphastos dicolorus": { nacional: null, iucn: "LC" },
  "Cyanocorax caeruleus": { nacional: null, iucn: "NT" },
  "Nasua nasua": { nacional: null, iucn: "LC" },
  "Antilophia bokermanni": { nacional: "CR", iucn: "CR" },
  "Tolypeutes tricinctus": { nacional: "EN", iucn: "VU" },
  "Kerodon rupestris": { nacional: "VU", iucn: "LC" },
  "Callithrix jacchus": { nacional: null, iucn: "LC" },
  "Patagioenas picazuro": { nacional: null, iucn: "LC" },
  "Caracara plancus": { nacional: null, iucn: "LC" },
  "Blastocerus dichotomus": { nacional: "VU", iucn: "VU" },
  "Pteronura brasiliensis": { nacional: "VU", iucn: null },
  "Jabiru mycteria": { nacional: null, iucn: "LC" },
  "Caiman yacare": { nacional: null, iucn: "LC" },
  "Hydrochoerus hydrochaeris": { nacional: null, iucn: "LC" },
  "Xanthopsar flavus": { nacional: "VU", iucn: "EN" },
  "Gubernatrix cristata": { nacional: "CR", iucn: "EN" },
  "Ctenomys flamarioni": { nacional: "EN", iucn: "EN" },
  "Rhea americana": { nacional: null, iucn: "NT" },
  "Vanellus chilensis": { nacional: null, iucn: "LC" },
  "Lycalopex gymnocercus": { nacional: null, iucn: "LC" },
};
