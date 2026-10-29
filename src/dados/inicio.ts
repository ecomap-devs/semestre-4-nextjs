// Dados da página inicial, portados da Home.jsx. Os de desmatamento vêm do PRODES
// (INPE), e a linha do tempo mora em `linhaDoTempo.ts`. As espécies e o número de
// espécies ameaçadas vêm da lista nacional do MMA (`especies.ts`).

import { animais, ehAmeacada } from "./animais";
import { biomas } from "./biomas";
import { listaNacional } from "./especies";
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

// As seis primeiras ameaçadas do catálogo (a seção é "Espécies ameaçadas"). Até
// 28/10/2026 a Home tinha a própria lista, com fotos de sites de terceiros e uma
// "queda da população" sem fonte em cada card.
export const animaisDestaque = animais.filter(ehAmeacada).slice(0, 6);

export const slides = [
  { url: `${SUPABASE_ANIMAIS}/onca-pintada.png`, rotulo: "Onça-pintada" },
  { url: `${SUPABASE_ANIMAIS}/arara-azul-de-lear_01_0.png`, rotulo: "Arara-azul-de-lear" },
  { url: `${SUPABASE_ANIMAIS}/lobo-guara.png`, rotulo: "Lobo-guará" },
  { url: `${SUPABASE_ANIMAIS}/micoleao-cke.png`, rotulo: "Mico-leão-dourado" },
];

export const solucoes = [
  { titulo: "Consumo consciente", texto: "Evite produtos que contribuem para o desmatamento, como carne de origem duvidosa, madeira ilegal e óleo de palma não sustentável." },
  { titulo: "Apoie organizações", texto: "Contribua com instituições que trabalham para preservar os biomas brasileiros e combater o desmatamento ilegal." },
  { titulo: "Engajamento político", texto: "Apoie políticas públicas e candidatos comprometidos com a preservação ambiental e o desenvolvimento sustentável." },
  { titulo: "Reflorestamento", texto: "Participe de iniciativas de plantio de árvores nativas e recuperação de áreas degradadas em sua região." },
  { titulo: "Educação ambiental", texto: "Divulgue informações sobre a importância da preservação e os impactos do desmatamento em sua comunidade." },
  { titulo: "Denuncie", texto: "Viu desmatamento, caça ou queimada ilegal? O Ibama recebe a denúncia pela internet ou por telefone, e dá para não se identificar. Os canais estão logo abaixo." },
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
  { valor: milhar.format(listaNacional.ameacadas), rotulo: "Espécies da fauna ameaçadas de extinção no Brasil, segundo a lista nacional do MMA" },
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
