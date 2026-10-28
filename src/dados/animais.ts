// Catálogo de espécies, portado do `allAnimals` da Animais.jsx. O status vem da lista
// nacional do MMA e da Lista Vermelha da IUCN (`especies.ts`, gerado). A população só
// aparece onde há estimativa publicada, com a fonte (ver README, "Sobre os dados").
//
// Até 28/10/2026 cada espécie trazia população e uma série de 2000 a 2024 sem fonte, e
// o catálogo tinha o tucano-de-bico-preto (não ameaçado), uma "perereca-verde-da-mata"
// que não corresponde a espécie conhecida, e a "arara-azul" com foto da arara-azul-de-lear.

import { statusEspecies, type CategoriaIUCN, type CategoriaNacional } from "./especies";

const SUPABASE_ANIMAIS = "https://wqvxjttidoxcblkfjoaf.supabase.co/storage/v1/object/public/animals";

/** Status na lista nacional, pelo nome usado no site. */
export type StatusConservacao = "Extinta" | "Extinta na natureza" | "Regionalmente extinta" | "Criticamente em perigo" | "Em perigo" | "Vulnerável";

const NOME_NACIONAL: Record<CategoriaNacional, StatusConservacao> = {
  EX: "Extinta",
  EW: "Extinta na natureza",
  RE: "Regionalmente extinta",
  CR: "Criticamente em perigo",
  EN: "Em perigo",
  VU: "Vulnerável",
};

/** Nome das categorias da IUCN em português, como o ICMBio as traduz. */
export const NOME_IUCN: Record<CategoriaIUCN, string> = {
  EX: "Extinta",
  EW: "Extinta na natureza",
  CR: "Criticamente em perigo",
  EN: "Em perigo",
  VU: "Vulnerável",
  NT: "Quase ameaçada",
  LC: "Menos preocupante",
  DD: "Dados insuficientes",
};

/**
 * Cor do texto do status, do mais grave ao menos grave. Antes cada espécie trazia o
 * próprio par de cores (fundo e texto do selo), copiado à mão em cada uma.
 */
export const corDoStatus: Record<StatusConservacao, string> = {
  Extinta: "var(--tinta)",
  "Extinta na natureza": "var(--tinta)",
  "Regionalmente extinta": "var(--tinta)",
  "Criticamente em perigo": "var(--terra)",
  "Em perigo": "var(--ocre)",
  Vulnerável: "var(--tinta-3)",
};

/** Estimativa publicada, sempre com quem a fez. */
export type Populacao = { texto: string; fonte: string; link: string };

type Especie = {
  nome: string;
  /** Chave em `statusEspecies` e em `ESPECIES` de scripts/especies/gerar.mjs. */
  cientifico: string;
  bioma: string;
  regiao: string;
  descricao: string;
  ameacas: string[];
  imagem: string;
  populacao?: Populacao;
};

export type Animal = Especie & {
  status: StatusConservacao;
  /** Categoria global; `null` quando a IUCN não avaliou. */
  iucn: string | null;
};

const catalogo: Especie[] = [
  {
    nome: "Onça-pintada",
    cientifico: "Panthera onca",
    bioma: "Mata Atlântica",
    regiao: "Sudeste",
    descricao:
      "O maior felino das Américas. Na Mata Atlântica, que já perdeu cerca de 85% do habitat da espécie, restam provavelmente menos de 300 onças, em grupos pequenos e isolados entre si.",
    ameacas: ["Perda de habitat", "Fragmentação florestal", "Morte causada por pessoas"],
    imagem: `${SUPABASE_ANIMAIS}/onca-pintada.png`,
    populacao: {
      texto: "menos de 300 na Mata Atlântica",
      fonte: "Paviolo et al., Scientific Reports (2016)",
      link: "https://doi.org/10.1038/srep37147",
    },
  },
  {
    nome: "Arara-azul-de-lear",
    cientifico: "Anodorhynchus leari",
    bioma: "Caatinga",
    regiao: "Nordeste",
    descricao:
      "Só existe no norte da Bahia, onde faz ninho em paredões de arenito e se alimenta sobretudo do coquinho do licuri. A população cresce com a proteção dos dormitórios e do licurizal, mas o tráfico continua.",
    ameacas: ["Tráfico de animais", "Perda do licuri", "Perda de habitat"],
    imagem: `${SUPABASE_ANIMAIS}/arara-azul-de-lear_01_0.png`,
    populacao: {
      texto: "2.548 aves (censo de 2024)",
      fonte: "Censo do CEMAVE/ICMBio, via Fundação Biodiversitas",
      link: "https://biodiversitas.org.br/wp-content/uploads/2024/10/Araras_23102024.pdf",
    },
  },
  {
    nome: "Mico-leão-dourado",
    cientifico: "Leontopithecus rosalia",
    bioma: "Mata Atlântica",
    regiao: "Sudeste",
    descricao:
      "Só existe na Mata Atlântica do Rio de Janeiro. Reintroduções e corredores florestais tiraram a espécie da beira da extinção; o surto de febre amarela de 2016 a 2018 derrubou a população de cerca de 3.700 para 2.500, que voltou a crescer.",
    ameacas: ["Fragmentação florestal", "Febre amarela", "Baixa diversidade genética"],
    imagem: `${SUPABASE_ANIMAIS}/micoleao-cke.png`,
    populacao: {
      texto: "cerca de 4.800 (censo de 2023)",
      fonte: "Associação Mico-Leão-Dourado",
      link: "https://micoleao.org.br/wp-content/uploads/2023/08/Texto-tecnico-censo-2023-MLD.pdf",
    },
  },
  {
    nome: "Lobo-guará",
    cientifico: "Chrysocyon brachyurus",
    bioma: "Cerrado",
    regiao: "Centro-Oeste",
    descricao:
      "O maior canídeo da América do Sul vive nos campos e savanas do Cerrado. A expansão agrícola toma o seu habitat, e os atropelamentos estão entre as principais causas de morte da espécie.",
    ameacas: ["Expansão agrícola", "Atropelamentos", "Perda de habitat"],
    imagem: `${SUPABASE_ANIMAIS}/lobo-guara.png`,
  },
  {
    nome: "Tamanduá-bandeira",
    cientifico: "Myrmecophaga tridactyla",
    bioma: "Cerrado",
    regiao: "Centro-Oeste",
    descricao:
      "Come formigas e cupins e tem um filhote por vez, depois de cerca de seis meses de gestação, por isso a população demora a se recuperar. Queimadas, atropelamentos e a perda de habitat no Cerrado são as maiores ameaças.",
    ameacas: ["Queimadas", "Atropelamentos", "Perda de habitat"],
    imagem: `${SUPABASE_ANIMAIS}/tamandua-bandeira-2.png`,
  },
  {
    nome: "Boto-cor-de-rosa",
    cientifico: "Inia geoffrensis",
    bioma: "Amazônia",
    regiao: "Norte",
    descricao:
      "O maior golfinho de rio do mundo vive nos rios da Amazônia. É morto para servir de isca na pesca da piracatinga, se enrosca em redes de pesca e perde rios livres para as hidrelétricas, que isolam as populações.",
    ameacas: ["Captura para isca de pesca", "Pesca acidental", "Hidrelétricas"],
    imagem: `${SUPABASE_ANIMAIS}/banner_blog_novo_24.png`,
  },
  {
    nome: "Ararinha-azul",
    cientifico: "Cyanopsitta spixii",
    bioma: "Caatinga",
    regiao: "Nordeste",
    descricao:
      "Desapareceu da natureza em 2000 e sobreviveu só em cativeiro. Em 2022, as primeiras aves criadas em cativeiro foram soltas em Curaçá, na Caatinga da Bahia; a lista nacional a classifica como criticamente em perigo, e a IUCN ainda como extinta na natureza.",
    ameacas: ["Captura para o tráfico", "Perda das matas de caraibeira", "População muito pequena"],
    imagem: `${SUPABASE_ANIMAIS}/ARARINHA_AZUL-795.jpg`,
  },
];

// Espécie sem status gerado, ou fora da lista nacional, para o build: o catálogo é de
// espécies ameaçadas no Brasil, e o status não pode virar um valor escrito à mão.
export const animais: Animal[] = catalogo.map((e) => {
  const status = statusEspecies[e.cientifico];
  if (!status) throw new Error(`${e.cientifico} não está em especies.ts: inclua em scripts/especies/gerar.mjs`);
  if (!status.nacional) throw new Error(`${e.cientifico} saiu da lista nacional de espécies ameaçadas`);
  return { ...e, status: NOME_NACIONAL[status.nacional], iucn: status.iucn ? NOME_IUCN[status.iucn] : null };
});

const ORDEM_STATUS = Object.keys(corDoStatus) as StatusConservacao[];
const ORDEM_BIOMAS = ["Amazônia", "Cerrado", "Mata Atlântica", "Caatinga", "Pantanal", "Pampa"];

// Só os filtros que têm espécie: um botão "Pantanal" que sempre dá lista vazia não ajuda.
export const filtrosBioma = ["Todos", ...ORDEM_BIOMAS.filter((b) => animais.some((a) => a.bioma === b))];
export const filtrosStatus = ["Todos", ...ORDEM_STATUS.filter((s) => animais.some((a) => a.status === s))];
