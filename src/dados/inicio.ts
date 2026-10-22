// Dados da página inicial, portados da Home.jsx. São valores de referência herdados
// do React, não números oficiais (ver README, "Sobre os dados").

const SUPABASE_ANIMAIS = "https://wqvxjttidoxcblkfjoaf.supabase.co/storage/v1/object/public/animals";

export type Membro = { nome: string };

// O React listava quatro; o grupo é de cinco.
export const equipe: Membro[] = [
  { nome: "Vinicius" },
  { nome: "Bruno" },
  { nome: "Cesar" },
  { nome: "João Flávio" },
  { nome: "João Gabriel" },
];

export type AnimalResumo = {
  nome: string;
  status: "Criticamente ameaçada" | "Em perigo" | "Vulnerável";
  descricao: string;
  bioma: string;
  populacao: string;
  imagem: string;
};

// Links diretos para sites de terceiros, como no React. Se algum sair do ar, o card
// mostra a imagem reserva em vez do ícone de imagem quebrada.
export const animaisDestaque: AnimalResumo[] = [
  { nome: "Onça-pintada", status: "Criticamente ameaçada", descricao: "Perdeu 50% de seu habitat na Mata Atlântica nos últimos 15 anos.", bioma: "Mata Atlântica", populacao: "-60%", imagem: "https://static.biologianet.com/2020/05/onca-pintada.jpg" },
  { nome: "Arara-azul", status: "Em perigo", descricao: "Apenas 6.500 indivíduos restantes devido à perda de habitat no Pantanal.", bioma: "Pantanal", populacao: "-40%", imagem: "https://imagens.ebc.com.br/7mrmO9tFuEk0CPiJHKLEqTCk9R4=/1170x700/smart/https://agenciabrasil.ebc.com.br/sites/default/files/thumbnails/image/2024/09/18/arara-azul-de-lear_01_0.jpg?itok=wDa3CBCI" },
  { nome: "Mico-leão-dourado", status: "Criticamente ameaçada", descricao: "Restam apenas 2.500 indivíduos na natureza devido ao desmatamento.", bioma: "Mata Atlântica", populacao: "-70%", imagem: "https://static.todamateria.com.br/upload/mi/co/micoleao-cke.jpg" },
  { nome: "Lobo-guará", status: "Vulnerável", descricao: "Perdeu 30% de seu habitat no Cerrado nos últimos 20 anos.", bioma: "Cerrado", populacao: "-35%", imagem: "https://s3.static.brasilescola.uol.com.br/be/2020/08/lobo-guara.jpg" },
  { nome: "Tucano-de-bico-preto", status: "Em perigo", descricao: "População em declínio devido à fragmentação florestal.", bioma: "Amazônia", populacao: "-25%", imagem: "https://www.parquedasaves.com.br/wp-content/uploads/2019/08/large-6.jpg" },
  { nome: "Perereca-verde-da-mata", status: "Criticamente ameaçada", descricao: "Endêmica de pequenas áreas ameaçadas pelo desmatamento.", bioma: "Mata Atlântica", populacao: "-80%", imagem: "https://portal.pcs.ifsuldeminas.edu.br/images/campus_pocos_caldas/noticias/2020/junho/20200630/perereca-folhagem/figura_1.jpg" },
];

export const slides = [
  { url: `${SUPABASE_ANIMAIS}/onca-pintada.png`, rotulo: "Onça-pintada" },
  { url: `${SUPABASE_ANIMAIS}/arara-azul-de-lear_01_0.png`, rotulo: "Arara-azul" },
  { url: `${SUPABASE_ANIMAIS}/lobo-guara.png`, rotulo: "Lobo-guará" },
  { url: `${SUPABASE_ANIMAIS}/micoleao-cke.png`, rotulo: "Mico-leão-dourado" },
];

export const solucoes = [
  { titulo: "Consumo consciente", texto: "Evite produtos que contribuem para o desmatamento, como carne de origem duvidosa, madeira ilegal e óleo de palma não sustentável." },
  { titulo: "Apoie organizações", texto: "Contribua com instituições que trabalham para preservar os biomas brasileiros e combater o desmatamento ilegal." },
  { titulo: "Engajamento político", texto: "Apoie políticas públicas e candidatos comprometidos com a preservação ambiental e o desenvolvimento sustentável." },
  { titulo: "Reflorestamento", texto: "Participe de iniciativas de plantio de árvores nativas e recuperação de áreas degradadas em sua região." },
  { titulo: "Educação ambiental", texto: "Divulgue informações sobre a importância da preservação e os impactos do desmatamento em sua comunidade." },
  { titulo: "Denuncie", texto: 'Use aplicativos como "Denúncia Ambiente" para reportar atividades ilegais de desmatamento que você identificar.' },
];

export const numeros = [
  { valor: "+30%", rotulo: "Aumento no desmatamento na última década" },
  { valor: "1,5 mi ha", rotulo: "Área queimada anualmente no Brasil" },
  { valor: "1.173", rotulo: "Espécies animais ameaçadas de extinção" },
  { valor: "6 biomas", rotulo: "Biomas brasileiros afetados pelo desmatamento" },
];

/** Área desmatada por bioma, em mil km². */
export const areaPorBioma = [
  { nome: "Amazônia", valor: 780 },
  { nome: "Cerrado", valor: 520 },
  { nome: "Mata Atlântica", valor: 320 },
  { nome: "Caatinga", valor: 150 },
  { nome: "Pantanal", valor: 90 },
  { nome: "Pampa", valor: 60 },
];

export const linhaDoTempo = [
  { ano: "2005", titulo: "Pampa sofre impactos crescentes", texto: "Expansão agropecuária avança sobre os campos nativos" },
  { ano: "2010", titulo: "Caatinga afetada", texto: "Caatinga tem 45% de sua área original desmatada" },
  { ano: "2013", titulo: "Novo Código Florestal", texto: "Brasil aprova novo Código Florestal com impacto nos biomas" },
  { ano: "2015", titulo: "Queimadas no Pantanal", texto: "Pantanal perde 12% de sua área para queimadas" },
  { ano: "2018", titulo: "Mata Atlântica reduzida", texto: "Mata Atlântica tem apenas 12,4% de sua cobertura original" },
  { ano: "2020", titulo: "Perdas no Cerrado", texto: "Cerrado perde 7.340 km² de vegetação nativa" },
  { ano: "2022", titulo: "Seca no Pantanal", texto: "Pantanal enfrenta pior seca em décadas" },
  { ano: "2023", titulo: "Recorde de desmatamento", texto: "Recorde de desmatamento na Amazônia: 11.568 km²" },
];

export const comparacaoRegional = [
  { rotulo: "Norte (Amazônia)", pct: 78 },
  { rotulo: "Centro-Oeste (Cerrado/Pantanal)", pct: 45 },
  { rotulo: "Nordeste (Caatinga)", pct: 15 },
  { rotulo: "Sudeste/Sul (Mata Atlântica/Pampa)", pct: 32 },
];

export const linksNavegacao: [string, string][] = [
  ["mapa", "Mapa"],
  ["animais", "Animais"],
  ["dados", "Dados"],
  ["solucoes", "Soluções"],
  ["equipe", "Equipe"],
  ["avaliacoes", "Avaliações"],
];
