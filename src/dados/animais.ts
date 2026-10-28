// Catálogo de espécies, portado do `allAnimals` da Animais.jsx. O status vem da lista
// nacional do MMA e da Lista Vermelha da IUCN (`especies.ts`, gerado). A população só
// aparece onde há estimativa publicada, com a fonte (ver README, "Sobre os dados").
//
// Até 28/10/2026 cada espécie trazia população e uma série de 2000 a 2024 sem fonte, e
// o catálogo tinha uma "perereca-verde-da-mata" que não corresponde a espécie conhecida
// e a "arara-azul" com foto da arara-azul-de-lear.
//
// Desde 28/10/2026 o catálogo tem também espécies fora da lista nacional, com o status
// "Não ameaçada", para mostrar a fauna de cada bioma e não só a que está sumindo. As
// fotos das espécies novas vêm do Wikimedia Commons, com autor e licença em `credito`.

import { statusEspecies, type CategoriaIUCN, type CategoriaNacional } from "./especies";

const SUPABASE_ANIMAIS = "https://wqvxjttidoxcblkfjoaf.supabase.co/storage/v1/object/public/animals";

/** Status na lista nacional, pelo nome usado no site. Fora da lista: "Não ameaçada". */
export type StatusConservacao = "Extinta" | "Extinta na natureza" | "Regionalmente extinta" | "Criticamente em perigo" | "Em perigo" | "Vulnerável" | "Não ameaçada";

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
  "Não ameaçada": "var(--mata)",
};

/** Estimativa publicada, sempre com quem a fez. */
export type Populacao = { texto: string; fonte: string; link: string };

/** Autor e licença da foto, que as licenças Creative Commons exigem mostrar. */
export type Credito = { autor: string; licenca: string; link: string };

type Especie = {
  nome: string;
  /** Chave em `statusEspecies` e em `ESPECIES` de scripts/especies/gerar.mjs. */
  cientifico: string;
  bioma: string;
  regiao: string;
  descricao: string;
  ameacas: string[];
  imagem: string;
  /** Só nas fotos de terceiros; as do bucket `animals` são do projeto. */
  credito?: Credito;
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
  {
    nome: "Sauim-de-coleira",
    cientifico: "Saguinus bicolor",
    bioma: "Amazônia",
    regiao: "Norte",
    descricao:
      "Um dos primatas mais ameaçados do Brasil, vive só em Manaus e arredores. A cidade cresceu sobre a floresta onde ele vive, e os grupos que restam ficam isolados em fragmentos de mata dentro da área urbana.",
    ameacas: ["Expansão urbana", "Fragmentação florestal", "Atropelamentos e choques em fios elétricos"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Pied_Tamarin.JPG/960px-Pied_Tamarin.JPG",
    credito: { autor: "Brocken Inaglory", licenca: "CC BY-SA 3.0", link: "https://commons.wikimedia.org/wiki/File:Pied_Tamarin.JPG" },
  },
  {
    nome: "Macaco-aranha-de-cara-branca",
    cientifico: "Ateles marginatus",
    bioma: "Amazônia",
    regiao: "Norte",
    descricao:
      "Vive no sul da Amazônia, entre os rios Tapajós e Xingu, justamente onde o desmatamento avança. Precisa de floresta alta e contínua para se deslocar pelas copas, e a caça reduz ainda mais os grupos que restam.",
    ameacas: ["Desmatamento", "Caça", "Fragmentação florestal"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Macaco-aranha-de-cara-branca-RPPN_Cristalino_I-Rafael_Mitsuo%28001%29.jpg/960px-Macaco-aranha-de-cara-branca-RPPN_Cristalino_I-Rafael_Mitsuo%28001%29.jpg",
    credito: { autor: "Rafael Mitsuo", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Macaco-aranha-de-cara-branca-RPPN_Cristalino_I-Rafael_Mitsuo(001).jpg" },
  },
  {
    nome: "Ararajuba",
    cientifico: "Guaruba guarouba",
    bioma: "Amazônia",
    regiao: "Norte",
    descricao:
      "Quase toda amarela, com as pontas das asas verdes, só existe no Brasil, no leste da Amazônia. Sofre com o desmatamento no Pará e no Maranhão e com a captura para o comércio ilegal de aves.",
    ameacas: ["Desmatamento", "Tráfico de animais"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Guaruba_guarouba_-Gramado_Zoo%2C_Brazil-8a.jpg/960px-Guaruba_guarouba_-Gramado_Zoo%2C_Brazil-8a.jpg",
    credito: { autor: "Ironman br", licenca: "CC BY-SA 3.0", link: "https://commons.wikimedia.org/wiki/File:Guaruba_guarouba_-Gramado_Zoo,_Brazil-8a.jpg" },
  },
  {
    nome: "Peixe-boi-da-amazônia",
    cientifico: "Trichechus inunguis",
    bioma: "Amazônia",
    regiao: "Norte",
    descricao:
      "O menor peixe-boi do mundo e o único que vive só em água doce, nos rios e lagos da bacia amazônica, onde come plantas aquáticas. A caça pela carne reduziu muito as populações, e a fêmea tem um filhote por vez, com anos de intervalo.",
    ameacas: ["Caça", "Captura acidental em redes de pesca", "Secas extremas nos rios"],
    imagem: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Trichechus_inunguis_%28Peixe-boi_amaz%C3%B4nico%29_por_F%C3%A1bia_Luna_ICMBioCMA.png",
    credito: { autor: "Fábia Luna/ICMBioCMA", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Trichechus_inunguis_(Peixe-boi_amaz%C3%B4nico)_por_F%C3%A1bia_Luna_ICMBioCMA.png" },
  },
  {
    nome: "Gavião-real",
    cientifico: "Harpia harpyja",
    bioma: "Amazônia",
    regiao: "Norte",
    descricao:
      "Também chamado de harpia, é uma das maiores águias do mundo e caça preguiças e macacos na copa das árvores. Faz o ninho nas árvores mais altas da floresta e desaparece de onde ela é derrubada.",
    ameacas: ["Desmatamento", "Caça", "Corte das árvores de ninho"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Harpia-harpyja-001.jpg/960px-Harpia-harpyja-001.jpg",
    credito: { autor: "Mdf", licenca: "CC BY-SA 3.0", link: "https://commons.wikimedia.org/wiki/File:Harpia-harpyja-001.jpg" },
  },
  {
    nome: "Preguiça-de-três-dedos",
    cientifico: "Bradypus variegatus",
    bioma: "Amazônia",
    regiao: "Norte",
    descricao:
      "Passa quase a vida inteira nas árvores e se move devagar para gastar pouca energia, já que come folhas, um alimento pobre. Desce ao chão mais ou menos uma vez por semana, e é aí que fica mais exposta.",
    ameacas: ["Perda de habitat", "Atropelamentos", "Choques em fios elétricos"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Bradypus.jpg/960px-Bradypus.jpg",
    credito: { autor: "Stefan Laube (Tauchgurke)", licenca: "Public domain", link: "https://commons.wikimedia.org/wiki/File:Bradypus.jpg" },
  },
  {
    nome: "Arara-vermelha",
    cientifico: "Ara chloropterus",
    bioma: "Amazônia",
    regiao: "Norte",
    descricao:
      "Uma das maiores araras, vermelha com as asas verdes e azuis. Vive em casais que ficam juntos por anos, quebra sementes duras com o bico e se reúne em bandos nos barreiros, paredões de argila onde as araras comem terra.",
    ameacas: ["Perda de habitat", "Tráfico de animais"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/189_Red-and-green_macaw_couple_flying_in_Chapada_dos_Guimar%C3%A3es_National_Park_Photo_by_Giles_Laurent.jpg/960px-189_Red-and-green_macaw_couple_flying_in_Chapada_dos_Guimar%C3%A3es_National_Park_Photo_by_Giles_Laurent.jpg",
    credito: { autor: "Giles Laurent", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:189_Red-and-green_macaw_couple_flying_in_Chapada_dos_Guimar%C3%A3es_National_Park_Photo_by_Giles_Laurent.jpg" },
  },
  {
    nome: "Sucuri-verde",
    cientifico: "Eunectes murinus",
    bioma: "Amazônia",
    regiao: "Norte",
    descricao:
      "A serpente mais pesada do mundo não tem veneno: mata a presa por constrição. Vive quase sempre na água, em rios, lagos e igapós, e passa horas parada esperando a presa chegar perto.",
    ameacas: ["Perda de habitat", "Morte causada por pessoas"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Eunectes_murinus_%281%29.jpg/960px-Eunectes_murinus_%281%29.jpg",
    credito: { autor: "TimVickers", licenca: "Public domain", link: "https://commons.wikimedia.org/wiki/File:Eunectes_murinus_(1).jpg" },
  },
  {
    nome: "Pato-mergulhão",
    cientifico: "Mergus octosetaceus",
    bioma: "Cerrado",
    regiao: "Centro-Oeste",
    descricao:
      "Uma das aves aquáticas mais raras do mundo, vive em rios limpos e encachoeirados do Cerrado, como os da Serra da Canastra e da Chapada dos Veadeiros. Mergulha para pegar peixes e depende de água transparente para enxergá-los.",
    ameacas: ["Assoreamento e poluição dos rios", "Hidrelétricas", "Perda da mata ciliar"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Mergus_octosetaceus%2C_por_S%C3%A1vio_Freire_Bruno.jpg/960px-Mergus_octosetaceus%2C_por_S%C3%A1vio_Freire_Bruno.jpg",
    credito: { autor: "Sávio Freire Bruno", licenca: "CC BY-SA 3.0", link: "https://commons.wikimedia.org/wiki/File:Mergus_octosetaceus,_por_S%C3%A1vio_Freire_Bruno.jpg" },
  },
  {
    nome: "Tatu-canastra",
    cientifico: "Priodontes maximus",
    bioma: "Cerrado",
    regiao: "Centro-Oeste",
    descricao:
      "O maior tatu do mundo tem garras enormes para cavar tocas, que depois servem de abrigo para muitos outros animais. Quase nunca é visto, tem poucos filhotes e sofre com a perda de habitat e a caça.",
    ameacas: ["Perda de habitat", "Caça", "Queimadas"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Priodontes_maximus_at_R%C3%A9gina.jpg/960px-Priodontes_maximus_at_R%C3%A9gina.jpg",
    credito: { autor: "Guillaume Delaitre", licenca: "CC BY 4.0", link: "https://commons.wikimedia.org/wiki/File:Priodontes_maximus_at_R%C3%A9gina.jpg" },
  },
  {
    nome: "Anta",
    cientifico: "Tapirus terrestris",
    bioma: "Cerrado",
    regiao: "Centro-Oeste",
    descricao:
      "O maior mamífero terrestre do Brasil. Come muitos frutos e espalha as sementes pelas fezes, por isso é chamada de jardineira da floresta. Já desapareceu de muitas regiões onde vivia.",
    ameacas: ["Perda de habitat", "Caça", "Atropelamentos"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/036_South_American_tapir_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg/960px-036_South_American_tapir_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg",
    credito: { autor: "Giles Laurent", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:036_South_American_tapir_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg" },
  },
  {
    nome: "Cachorro-vinagre",
    cientifico: "Speothos venaticus",
    bioma: "Cerrado",
    regiao: "Centro-Oeste",
    descricao:
      "Um canídeo de pernas curtas e corpo comprido que vive e caça em grupo, perto de rios e matas. É raro e difícil de ver, e sofre com a perda de habitat e com doenças passadas por cães domésticos.",
    ameacas: ["Perda de habitat", "Doenças de cães domésticos", "Atropelamentos"],
    imagem: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Bush_dog.JPG",
    credito: { autor: "Bonne1978", licenca: "CC BY-SA 3.0", link: "https://commons.wikimedia.org/wiki/File:Bush_dog.JPG" },
  },
  {
    nome: "Tucano-toco",
    cientifico: "Ramphastos toco",
    bioma: "Cerrado",
    regiao: "Centro-Oeste",
    descricao:
      "O maior dos tucanos tem um bico laranja que também serve para perder calor nos dias quentes. Come sobretudo frutos, mas também ovos e filhotes de outras aves, e é comum no Cerrado e no Pantanal.",
    ameacas: ["Tráfico de animais", "Perda de habitat"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/006_Toco_toucan_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg/960px-006_Toco_toucan_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg",
    credito: { autor: "Giles Laurent", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:006_Toco_toucan_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg" },
  },
  {
    nome: "Seriema",
    cientifico: "Cariama cristata",
    bioma: "Cerrado",
    regiao: "Centro-Oeste",
    descricao:
      "Ave de pernas longas que prefere correr a voar. O canto alto é um dos sons mais conhecidos do Cerrado, e ela come insetos, lagartos e pequenas cobras, que bate contra o chão antes de engolir.",
    ameacas: ["Perda de habitat", "Atropelamentos"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Red-legged_seriema_%28Cariama_cristata%29_head.JPG/960px-Red-legged_seriema_%28Cariama_cristata%29_head.JPG",
    credito: { autor: "Charles J. Sharp", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Red-legged_seriema_(Cariama_cristata)_head.JPG" },
  },
  {
    nome: "Arara-canindé",
    cientifico: "Ara ararauna",
    bioma: "Cerrado",
    regiao: "Centro-Oeste",
    descricao:
      "Azul nas costas e amarela no peito, vive em casais ou em bandos e faz ninho em ocos de palmeiras mortas, como o buriti. Ainda é comum, mas continua entre as aves capturadas pelo tráfico.",
    ameacas: ["Tráfico de animais", "Perda dos buritizais"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Ara_ararauna_Luc_Viatour.jpg/960px-Ara_ararauna_Luc_Viatour.jpg",
    credito: { autor: "Luc Viatour", licenca: "CC BY 2.0", link: "https://commons.wikimedia.org/wiki/File:Ara_ararauna_Luc_Viatour.jpg" },
  },
  {
    nome: "Muriqui-do-norte",
    cientifico: "Brachyteles hypoxanthus",
    bioma: "Mata Atlântica",
    regiao: "Sudeste",
    descricao:
      "O maior macaco das Américas vive em fragmentos de Mata Atlântica de Minas Gerais, do Espírito Santo e da Bahia. É conhecido por viver em grupos pacíficos e é um dos primatas mais ameaçados do mundo.",
    ameacas: ["Fragmentação florestal", "Caça", "Febre amarela"],
    imagem: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Brachyteles_hypoxanthus2.jpg",
    credito: { autor: "Paulo B. Chaves", licenca: "CC BY 2.0", link: "https://commons.wikimedia.org/wiki/File:Brachyteles_hypoxanthus2.jpg" },
  },
  {
    nome: "Jacutinga",
    cientifico: "Aburria jacutinga",
    bioma: "Mata Atlântica",
    regiao: "Sul",
    descricao:
      "Ave grande, preta, com a garganta vermelha, que come os frutos do palmito-juçara e espalha as sementes. A caça e o corte ilegal do palmito a fizeram sumir de boa parte da Mata Atlântica.",
    ameacas: ["Caça", "Extração ilegal de palmito", "Perda de habitat"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Aburria_jacutinga_-Parque_das_Aves-8.jpg/960px-Aburria_jacutinga_-Parque_das_Aves-8.jpg",
    credito: { autor: "Bruno Girin", licenca: "CC BY-SA 2.0", link: "https://commons.wikimedia.org/wiki/File:Aburria_jacutinga_-Parque_das_Aves-8.jpg" },
  },
  {
    nome: "Gato-do-mato-pequeno",
    cientifico: "Leopardus guttulus",
    bioma: "Mata Atlântica",
    regiao: "Sul",
    descricao:
      "Um dos menores felinos das Américas, do tamanho de um gato doméstico. Vive nas matas do Sul e do Sudeste e perde espaço para a agricultura, os atropelamentos e as doenças de gatos e cães domésticos.",
    ameacas: ["Perda de habitat", "Atropelamentos", "Doenças de animais domésticos"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Gato-do-mato-pequeno-REBIO_Municipal_da_Serra_do_Japi-Marcelo_Figueiroa%28001%29.jpg/960px-Gato-do-mato-pequeno-REBIO_Municipal_da_Serra_do_Japi-Marcelo_Figueiroa%28001%29.jpg",
    credito: { autor: "Marcelo Figueiroa", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Gato-do-mato-pequeno-REBIO_Municipal_da_Serra_do_Japi-Marcelo_Figueiroa(001).jpg" },
  },
  {
    nome: "Tucano-de-bico-verde",
    cientifico: "Ramphastos dicolorus",
    bioma: "Mata Atlântica",
    regiao: "Sul",
    descricao:
      "O tucano da Mata Atlântica, com o bico verde-claro e o peito alaranjado. Come frutos e espalha as sementes de muitas árvores da mata, e é comum nas florestas do Sul e do Sudeste.",
    ameacas: ["Perda de habitat", "Tráfico de animais"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Tucano_de_bico_verde_%28Ramphastos_dicolorus%29.jpg/960px-Tucano_de_bico_verde_%28Ramphastos_dicolorus%29.jpg",
    credito: { autor: "Jairmoreirafotografia", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Tucano_de_bico_verde_(Ramphastos_dicolorus).jpg" },
  },
  {
    nome: "Gralha-azul",
    cientifico: "Cyanocorax caeruleus",
    bioma: "Mata Atlântica",
    regiao: "Sul",
    descricao:
      "Ave símbolo do Paraná, vive nas matas de araucária. Enterra pinhões para comer depois e esquece parte deles, que germinam: por isso é lembrada como plantadora de araucárias.",
    ameacas: ["Perda das matas de araucária"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Gralha-azul-PARNA_de_S%C3%A3o_Joaquim-RicFotos%28001%29.jpg/960px-Gralha-azul-PARNA_de_S%C3%A3o_Joaquim-RicFotos%28001%29.jpg",
    credito: { autor: "RicFotos", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Gralha-azul-PARNA_de_S%C3%A3o_Joaquim-RicFotos(001).jpg" },
  },
  {
    nome: "Quati",
    cientifico: "Nasua nasua",
    bioma: "Mata Atlântica",
    regiao: "Sul",
    descricao:
      "Parente do guaxinim, anda em bandos de fêmeas e filhotes com a cauda listrada em pé. Come frutos, insetos e pequenos animais; em parques, aprendeu a pedir comida a turistas, o que faz mal à sua saúde.",
    ameacas: ["Alimentação por turistas", "Atropelamentos", "Perda de habitat"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/N._nasua%2C_Duisburg_%28DE%29_--_2023_--_0219.jpg/960px-N._nasua%2C_Duisburg_%28DE%29_--_2023_--_0219.jpg",
    credito: { autor: "Anil Öztas", licenca: "FAL", link: "https://commons.wikimedia.org/wiki/File:N._nasua,_Duisburg_(DE)_--_2023_--_0219.jpg" },
  },
  {
    nome: "Soldadinho-do-araripe",
    cientifico: "Antilophia bokermanni",
    bioma: "Caatinga",
    regiao: "Nordeste",
    descricao:
      "Descoberto em 1996, só existe na encosta da Chapada do Araripe, no Ceará, junto às nascentes e matas úmidas. O macho é branco, com as asas e a cauda pretas e um topete vermelho.",
    ameacas: ["Captação de água das nascentes", "Expansão urbana", "Perda de habitat"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Araripe_Manakin_%281%29.jpg/960px-Araripe_Manakin_%281%29.jpg",
    credito: { autor: "Rick elis.simpson", licenca: "CC BY-SA 3.0", link: "https://commons.wikimedia.org/wiki/File:Araripe_Manakin_(1).jpg" },
  },
  {
    nome: "Tatu-bola",
    cientifico: "Tolypeutes tricinctus",
    bioma: "Caatinga",
    regiao: "Nordeste",
    descricao:
      "Só existe no Brasil e é o único tatu do país que se fecha numa bola completa para se defender. Foi o mascote da Copa do Mundo de 2014 e sofre com a caça e a perda da Caatinga.",
    ameacas: ["Caça", "Perda de habitat"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Tolypeutes_tricinctus_466118804.jpg/960px-Tolypeutes_tricinctus_466118804.jpg",
    credito: { autor: "Reuber Brandão", licenca: "CC BY 4.0", link: "https://commons.wikimedia.org/wiki/File:Tolypeutes_tricinctus_466118804.jpg" },
  },
  {
    nome: "Mocó",
    cientifico: "Kerodon rupestris",
    bioma: "Caatinga",
    regiao: "Nordeste",
    descricao:
      "Roedor parente do preá que vive nos lajedos e afloramentos de pedra da Caatinga, onde se esconde nas frestas. É caçado para alimentação em boa parte do Nordeste.",
    ameacas: ["Caça", "Perda de habitat"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Moc%C3%B3-PARNA_da_Serra_da_Capivara-Motorolaz1201%28001%29.jpg/960px-Moc%C3%B3-PARNA_da_Serra_da_Capivara-Motorolaz1201%28001%29.jpg",
    credito: { autor: "Motorolaz1201", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Moc%C3%B3-PARNA_da_Serra_da_Capivara-Motorolaz1201(001).jpg" },
  },
  {
    nome: "Sagui-de-tufo-branco",
    cientifico: "Callithrix jacchus",
    bioma: "Caatinga",
    regiao: "Nordeste",
    descricao:
      "Pequeno macaco de tufos brancos nas orelhas, nativo do Nordeste. Adapta-se bem a parques e cidades; levado pelo tráfico para o Sudeste, virou espécie invasora lá e compete com os saguis nativos.",
    ameacas: ["Tráfico de animais", "Perda de habitat"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Wei%C3%9Fb%C3%BCschelaffe_%28Callithrix_jacchus%29.jpg/960px-Wei%C3%9Fb%C3%BCschelaffe_%28Callithrix_jacchus%29.jpg",
    credito: { autor: "Raimond Spekking", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Wei%C3%9Fb%C3%BCschelaffe_(Callithrix_jacchus).jpg" },
  },
  {
    nome: "Asa-branca",
    cientifico: "Patagioenas picazuro",
    bioma: "Caatinga",
    regiao: "Nordeste",
    descricao:
      "A pomba que dá nome à canção de Luiz Gonzaga, com uma faixa branca nas asas que aparece em voo. Vive em áreas abertas de grande parte do país, do sertão às cidades.",
    ameacas: ["Caça"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Patagioenas_picazuro_-Buenos_Aires%2C_Argentina-8-4c.jpg/960px-Patagioenas_picazuro_-Buenos_Aires%2C_Argentina-8-4c.jpg",
    credito: { autor: "dfaulder (obra derivada: Snowmanradio)", licenca: "CC BY 2.0", link: "https://commons.wikimedia.org/wiki/File:Patagioenas_picazuro_-Buenos_Aires,_Argentina-8-4c.jpg" },
  },
  {
    nome: "Carcará",
    cientifico: "Caracara plancus",
    bioma: "Caatinga",
    regiao: "Nordeste",
    descricao:
      "Ave de rapina que come quase tudo: insetos, pequenos animais e carniça. É comum em áreas abertas de todo o Brasil e aparece muito à beira das estradas, atrás de animais atropelados.",
    ameacas: ["Atropelamentos", "Perseguição por pessoas"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Schopfkarakara.jpg/960px-Schopfkarakara.jpg",
    credito: { autor: "Andreas Trepte", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Schopfkarakara.jpg" },
  },
  {
    nome: "Cervo-do-pantanal",
    cientifico: "Blastocerus dichotomus",
    bioma: "Pantanal",
    regiao: "Centro-Oeste",
    descricao:
      "O maior cervo da América do Sul vive em brejos e várzeas, com cascos que se abrem para andar no solo encharcado. Perdeu área com a drenagem das áreas úmidas e com as hidrelétricas que alagaram várzeas.",
    ameacas: ["Drenagem de áreas úmidas", "Hidrelétricas", "Doenças transmitidas pelo gado"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Marsh_Deer%2C_Esteros_Del_Ibera%2C_Corrientes%2C_Argentina%2C_3rd._Jan._2011_-_Flickr_-_PhillipC.jpg/960px-Marsh_Deer%2C_Esteros_Del_Ibera%2C_Corrientes%2C_Argentina%2C_3rd._Jan._2011_-_Flickr_-_PhillipC.jpg",
    credito: { autor: "Phillip Capper from Wellington, New Zealand", licenca: "CC BY 2.0", link: "https://commons.wikimedia.org/wiki/File:Marsh_Deer,_Esteros_Del_Ibera,_Corrientes,_Argentina,_3rd._Jan._2011_-_Flickr_-_PhillipC.jpg" },
  },
  {
    nome: "Ariranha",
    cientifico: "Pteronura brasiliensis",
    bioma: "Pantanal",
    regiao: "Centro-Oeste",
    descricao:
      "A maior lontra do mundo vive em grupos familiares nos rios do Pantanal e da Amazônia e come peixes. Quase desapareceu no século 20, caçada pela pele; hoje sofre com a poluição dos rios e o conflito com pescadores.",
    ameacas: ["Poluição dos rios", "Conflito com pescadores", "Hidrelétricas"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/139_Giant_otter_swimming_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg/960px-139_Giant_otter_swimming_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg",
    credito: { autor: "Giles Laurent", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:139_Giant_otter_swimming_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg" },
  },
  {
    nome: "Tuiuiú",
    cientifico: "Jabiru mycteria",
    bioma: "Pantanal",
    regiao: "Centro-Oeste",
    descricao:
      "Ave símbolo do Pantanal, uma cegonha de pescoço preto e vermelho e uma das maiores aves voadoras do Brasil. Faz ninhos enormes no alto das árvores e pesca na beira das lagoas.",
    ameacas: ["Queimadas", "Secas extremas"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Jabiru_Mato_Grosso_Pantanal_Brazil-2.jpg/960px-Jabiru_Mato_Grosso_Pantanal_Brazil-2.jpg",
    credito: { autor: "Andreas Trepte", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Jabiru_Mato_Grosso_Pantanal_Brazil-2.jpg" },
  },
  {
    nome: "Jacaré-do-pantanal",
    cientifico: "Caiman yacare",
    bioma: "Pantanal",
    regiao: "Centro-Oeste",
    descricao:
      "Foi muito caçado pelo couro até os anos 1980; com a fiscalização, a população se recuperou e hoje é comum. É fácil de ver nas lagoas e na beira das estradas do Pantanal.",
    ameacas: ["Queimadas", "Secas extremas", "Caça ilegal"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Brillenkaiman_Caiman_yacare.jpg/960px-Brillenkaiman_Caiman_yacare.jpg",
    credito: { autor: "Andreas Trepte", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Brillenkaiman_Caiman_yacare.jpg" },
  },
  {
    nome: "Capivara",
    cientifico: "Hydrochoerus hydrochaeris",
    bioma: "Pantanal",
    regiao: "Centro-Oeste",
    descricao:
      "O maior roedor do mundo vive em grupos perto da água e é ótima nadadora. É comum em todo o Brasil, inclusive em parques e na beira de rios dentro das cidades.",
    ameacas: ["Caça", "Atropelamentos"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/Capybara_%28Hydrochoerus_hydrochaeris%29_alpha_male.JPG/960px-Capybara_%28Hydrochoerus_hydrochaeris%29_alpha_male.JPG",
    credito: { autor: "Charles J. Sharp", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Capybara_(Hydrochoerus_hydrochaeris)_alpha_male.JPG" },
  },
  {
    nome: "Veste-amarela",
    cientifico: "Xanthopsar flavus",
    bioma: "Pampa",
    regiao: "Sul",
    descricao:
      "Pássaro amarelo e preto que vive em bandos nos banhados e campos úmidos do Pampa. Perde espaço para a drenagem dos banhados, as lavouras e o plantio de árvores exóticas, e é capturado como ave de gaiola.",
    ameacas: ["Drenagem de banhados", "Expansão agrícola", "Captura para gaiola"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Xanthopsar_flavus_en_Ba%C3%B1ado_Los_Indios%2C_Rocha%2C_Uruguay.jpg/960px-Xanthopsar_flavus_en_Ba%C3%B1ado_Los_Indios%2C_Rocha%2C_Uruguay.jpg",
    credito: { autor: "Gmmv1980", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Xanthopsar_flavus_en_Ba%C3%B1ado_Los_Indios,_Rocha,_Uruguay.jpg" },
  },
  {
    nome: "Cardeal-amarelo",
    cientifico: "Gubernatrix cristata",
    bioma: "Pampa",
    regiao: "Sul",
    descricao:
      "Pássaro amarelo com um topete preto, muito procurado como ave de canto. A captura para o comércio ilegal o fez quase desaparecer do Rio Grande do Sul.",
    ameacas: ["Tráfico de animais", "Perda de habitat"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Gubernatrix_cristata_-_Yellow_cardinal_%28female%29%3B_Iber%C3%A1_marshes%2C_Corrientes%2C_Argentina.jpg/960px-Gubernatrix_cristata_-_Yellow_cardinal_%28female%29%3B_Iber%C3%A1_marshes%2C_Corrientes%2C_Argentina.jpg",
    credito: { autor: "Hector Bottai", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Gubernatrix_cristata_-_Yellow_cardinal_(female);_Iber%C3%A1_marshes,_Corrientes,_Argentina.jpg" },
  },
  {
    nome: "Tuco-tuco-das-dunas",
    cientifico: "Ctenomys flamarioni",
    bioma: "Pampa",
    regiao: "Sul",
    descricao:
      "Roedor que vive em túneis nas dunas do litoral do Rio Grande do Sul e não existe em nenhum outro lugar. A ocupação da orla, as estradas e o plantio de pinus sobre as dunas destroem o seu habitat.",
    ameacas: ["Ocupação do litoral", "Plantio de pinus", "Perda de habitat"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Ctenomys_flamarioni.jpg/960px-Ctenomys_flamarioni.jpg",
    credito: { autor: "Cláudio Dias Timm from Rio Grande do Sul", licenca: "CC BY-SA 2.0", link: "https://commons.wikimedia.org/wiki/File:Ctenomys_flamarioni.jpg" },
  },
  {
    nome: "Ema",
    cientifico: "Rhea americana",
    bioma: "Pampa",
    regiao: "Sul",
    descricao:
      "A maior ave do Brasil não voa, mas corre rápido pelos campos. Quem choca os ovos e cuida dos filhotes é o macho, que reúne no mesmo ninho ovos de várias fêmeas.",
    ameacas: ["Expansão agrícola", "Caça"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/Greater_Rhea_%28Rhea_americana%29_%2828234029614%29.jpg/960px-Greater_Rhea_%28Rhea_americana%29_%2828234029614%29.jpg",
    credito: { autor: "Bernard DUPONT from FRANCE", licenca: "CC BY-SA 2.0", link: "https://commons.wikimedia.org/wiki/File:Greater_Rhea_(Rhea_americana)_(28234029614).jpg" },
  },
  {
    nome: "Quero-quero",
    cientifico: "Vanellus chilensis",
    bioma: "Pampa",
    regiao: "Sul",
    descricao:
      "Símbolo do Rio Grande do Sul, grita alto e dá voos rasantes para defender o ninho, que faz no chão. Tem um esporão em cada asa e é comum em campos e até em gramados das cidades.",
    ameacas: ["Perda dos campos nativos"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Southern_lapwing_%28Vanellus_chilensis_chilensis%29_Chiloe.jpg/960px-Southern_lapwing_%28Vanellus_chilensis_chilensis%29_Chiloe.jpg",
    credito: { autor: "Charles J. Sharp", licenca: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Southern_lapwing_(Vanellus_chilensis_chilensis)_Chiloe.jpg" },
  },
  {
    nome: "Graxaim-do-campo",
    cientifico: "Lycalopex gymnocercus",
    bioma: "Pampa",
    regiao: "Sul",
    descricao:
      "Canídeo dos campos do Sul, parecido com uma raposa. Come de tudo, de frutos a pequenos roedores, e é perseguido por criadores que o culpam pela morte de cordeiros.",
    ameacas: ["Perseguição por criadores", "Atropelamentos"],
    imagem: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Lycalopex_gymnocerca_-_Frank_Thomas_Sautter_-_579274769.jpeg/960px-Lycalopex_gymnocerca_-_Frank_Thomas_Sautter_-_579274769.jpeg",
    credito: { autor: "Frank Thomas Sautter", licenca: "CC0", link: "https://commons.wikimedia.org/wiki/File:Lycalopex_gymnocerca_-_Frank_Thomas_Sautter_-_579274769.jpeg" },
  },
];

// Espécie sem status gerado para o build: o status não pode virar um valor escrito à mão.
// Fora da lista nacional não para mais o build: a espécie aparece como "Não ameaçada".
export const animais: Animal[] = catalogo.map((e) => {
  const status = statusEspecies[e.cientifico];
  if (!status) throw new Error(`${e.cientifico} não está em especies.ts: inclua em scripts/especies/gerar.mjs`);
  return { ...e, status: status.nacional ? NOME_NACIONAL[status.nacional] : "Não ameaçada", iucn: status.iucn ? NOME_IUCN[status.iucn] : null };
});

/** Na lista nacional, em qualquer categoria. */
export const ehAmeacada = (a: Animal) => a.status !== "Não ameaçada";

const ORDEM_STATUS = Object.keys(corDoStatus) as StatusConservacao[];
const ORDEM_BIOMAS = ["Amazônia", "Cerrado", "Mata Atlântica", "Caatinga", "Pantanal", "Pampa"];

/** Valor do filtro de status que junta todas as categorias da lista nacional. */
export const SO_AMEACADAS = "Só ameaçadas";

// Só os filtros que têm espécie: um botão "Pantanal" que sempre dá lista vazia não ajuda.
export const filtrosBioma = ["Todos", ...ORDEM_BIOMAS.filter((b) => animais.some((a) => a.bioma === b))];
export const filtrosStatus = ["Todos", SO_AMEACADAS, ...ORDEM_STATUS.filter((s) => animais.some((a) => a.status === s))];

/** Se o animal passa no filtro de status (`filtrosStatus`). */
export function passaNoFiltroStatus(a: Animal, filtro: string): boolean {
  if (filtro === "Todos") return true;
  if (filtro === SO_AMEACADAS) return ehAmeacada(a);
  return a.status === filtro;
}
