// Dados da página inicial, portados da Home.jsx. Os de desmatamento vêm do PRODES
// (INPE), e a linha do tempo mora em `linhaDoTempo.ts`. As espécies e o número de
// espécies ameaçadas ainda são valores de referência herdados do React.

import type { StatusConservacao } from "./animais";
import { biomas } from "./biomas";
import { prodes, prodesAtualizadoEm } from "./prodes";

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
  status: StatusConservacao;
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

// ── Desmatamento, calculado do PRODES (prodes.ts) ──
//
// Até 28/10/2026 estes números eram de referência, herdados do React ("+30% na última
// década", Amazônia com 780 mil km² desmatados). Agora saem do que o INPE mediu.

const milhar = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** "2024–2025" -> "ago/2024 a jul/2025": o ano do PRODES vai de agosto a julho. */
const periodoPorExtenso = (fim: number) => `ago/${fim - 1} a jul/${fim}`;

/** O desmatamento do bioma no período que termina em `fim`, se já consolidado. */
function noPeriodo(chave: string, fim: number): number | undefined {
  return prodes[chave]?.anos.find((p) => p.fim === fim && !p.preliminar)?.km2;
}

/**
 * O período mais recente que os seis biomas já têm consolidado. Cada bioma é mapeado
 * no seu ritmo, e somar anos diferentes daria um total que não existe.
 */
const fimComum = Math.max(...(prodes.amazonia?.anos ?? []).map((p) => p.fim).filter((fim) => biomas.every((b) => noPeriodo(b.chave, fim) !== undefined)));
if (!Number.isFinite(fimComum)) throw new Error("PRODES sem um período comum aos seis biomas: rode scripts/prodes/gerar.mjs");

const totalNoPeriodo = (fim: number) => biomas.reduce((s, b) => s + (noPeriodo(b.chave, fim) ?? 0), 0);
const totalAtual = totalNoPeriodo(fimComum);
const temAnterior = biomas.every((b) => noPeriodo(b.chave, fimComum - 1) !== undefined);
const variacao = temAnterior ? Math.round((totalAtual / totalNoPeriodo(fimComum - 1) - 1) * 100) : null;

export const numeros = [
  { valor: milhar.format(totalAtual), rotulo: `km² de vegetação nativa desmatados nos seis biomas de ${periodoPorExtenso(fimComum)}` },
  ...(variacao === null
    ? []
    : [{ valor: `${variacao > 0 ? "+" : variacao < 0 ? "−" : ""}${Math.abs(variacao)}%`, rotulo: `no desmatamento dos seis biomas em relação a ${periodoPorExtenso(fimComum - 1)}` }]),
  { valor: "1.173", rotulo: "Espécies animais ameaçadas de extinção" },
  { valor: "6 biomas", rotulo: "Biomas brasileiros afetados pelo desmatamento" },
];

/** Área já desmatada em cada bioma, em mil km², da maior para a menor. */
export const areaPorBioma = biomas
  .map((b) => ({ nome: b.nome, valor: Math.round((prodes[b.chave]?.acumuladoKm2 ?? 0) / 1000) }))
  .sort((a, b) => b.valor - a.valor);

/** Quanto cada bioma perdeu no período comum mais recente. */
export const ultimoPeriodo = {
  rotulo: periodoPorExtenso(fimComum),
  biomas: biomas.map((b) => ({ nome: b.nome, km2: noPeriodo(b.chave, fimComum) ?? 0 })).sort((a, b) => b.km2 - a.km2),
};

/** "16 de outubro de 2026", para a nota de fonte. */
export const dadosAtualizadosEm = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${prodesAtualizadoEm}T00:00:00Z`));

export const linksNavegacao: [string, string][] = [
  ["mapa", "Mapa"],
  ["animais", "Animais"],
  ["dados", "Dados"],
  ["solucoes", "Soluções"],
  ["equipe", "Equipe"],
  ["avaliacoes", "Avaliações"],
];
