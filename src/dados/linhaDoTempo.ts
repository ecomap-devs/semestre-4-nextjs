// A linha do tempo da Home e do mapa.
//
// Até 28/10/2026 era texto herdado do React, com erros: "Novo Código Florestal" em 2013
// (é de 2012) e um "recorde de 11.568 km² na Amazônia em 2023", ano em que a taxa caiu.
// Agora os marcos com número são calculados do PRODES (`prodes.ts`), então acompanham
// cada atualização do INPE. Os poucos marcos escritos à mão são leis e acordos com data
// conhecida, e não trazem número.

import { biomas } from "./biomas";
import { prodes, taxasAmazoniaLegal } from "./prodes";

export type Marco = { ano: number; titulo: string; texto: string };

/** "do Cerrado", mas "da Caatinga". */
const MASCULINOS = new Set(["cerrado", "pantanal", "pampa"]);

const milhar = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const km2 = (v: number) => `${milhar.format(v)} km²`;

const consolidadas = taxasAmazoniaLegal.filter((t) => !t.preliminar);
if (consolidadas.length < 3) throw new Error("Taxas da Amazônia Legal incompletas: rode scripts/prodes/gerar.mjs");

const maior = (lista: typeof consolidadas) => lista.reduce((a, b) => (b.km2 > a.km2 ? b : a));
const menor = (lista: typeof consolidadas) => lista.reduce((a, b) => (b.km2 < a.km2 ? b : a));
const taxaEm = (ano: number) => consolidadas.find((t) => t.ano === ano);

const pior = maior(consolidadas);
const minima = menor(consolidadas);
const depoisDaMinima = consolidadas.filter((t) => t.ano > minima.ano);
const picoRecente = depoisDaMinima.length > 0 ? maior(depoisDaMinima) : null;
const ultima = consolidadas[consolidadas.length - 1]!;
const anterior = consolidadas[consolidadas.length - 2]!;
const estimativa = taxasAmazoniaLegal.find((t) => t.preliminar);

/** O último ano antes de `ano` com taxa igual ou maior: "o maior desde 2006". */
function maiorDesde(ano: number, valor: number): number | null {
  const antes = consolidadas.filter((t) => t.ano < ano && t.km2 >= valor);
  return antes.length > 0 ? antes[antes.length - 1]!.ano : null;
}

const marcos: Marco[] = [];

marcos.push({
  ano: pior.ano,
  titulo: "Pior ano da série",
  texto: `A Amazônia Legal perde ${km2(pior.km2)} de floresta, a maior taxa já medida pelo INPE.`,
});

// Marcos de política pública: datas de lei e de acordo, sem número a conferir.
const taxa2004 = taxaEm(2004);
marcos.push({
  ano: 2004,
  titulo: "Começa o PPCDAm",
  texto: `O governo federal lança o plano de combate ao desmatamento na Amazônia${taxa2004 ? `, num ano de ${km2(taxa2004.km2)} desmatados` : ""}.`,
});
marcos.push({
  ano: 2006,
  titulo: "Moratória da Soja",
  texto: "Empresas se comprometem a não comprar soja plantada em áreas desmatadas da Amazônia.",
});
marcos.push({
  ano: 2012,
  titulo: "Novo Código Florestal",
  texto: "A Lei 12.651 substitui o Código Florestal de 1965 e redefine as áreas que precisam ser preservadas.",
});

marcos.push({
  ano: minima.ano,
  titulo: "Menor taxa da série",
  texto: `O desmatamento na Amazônia Legal cai para ${km2(minima.km2)}.`,
});

if (picoRecente && picoRecente.km2 > minima.km2 * 1.5) {
  const desde = maiorDesde(picoRecente.ano, picoRecente.km2);
  marcos.push({
    ano: picoRecente.ano,
    titulo: "O desmatamento volta a subir",
    texto: `A Amazônia Legal perde ${km2(picoRecente.km2)}${desde ? `, o maior valor desde ${desde}` : ""}.`,
  });
}

// O ano em que o PRODES passou a contar mais da metade de um bioma como desmatada. Só
// vale se a série começa abaixo da metade: a Mata Atlântica já estava acima em 2000.
for (const b of biomas) {
  const medido = prodes[b.chave];
  if (!medido) continue;
  const metade = medido.areaKm2 / 2;
  const primeiro = medido.acumulado[0];
  const cruzou = medido.acumulado.find((a) => a.km2 >= metade);
  if (!primeiro || !cruzou || primeiro.km2 >= metade) continue;
  marcos.push({
    ano: cruzou.fim,
    titulo: `${b.nome} passa da metade`,
    texto: `Mais da metade da vegetação nativa ${MASCULINOS.has(b.chave) ? "do" : "da"} ${b.nome} já foi desmatada, segundo o PRODES.`,
  });
}

const variacao = Math.round((ultima.km2 / anterior.km2 - 1) * 100);
marcos.push({
  ano: ultima.ano,
  titulo: "Último dado consolidado",
  texto: `A Amazônia Legal perde ${km2(ultima.km2)}, ${Math.abs(variacao)}% ${variacao <= 0 ? "a menos" : "a mais"} que no ano anterior.`,
});

if (estimativa) {
  marcos.push({
    ano: estimativa.ano,
    titulo: "Estimativa do INPE",
    texto: `A taxa preliminar para a Amazônia Legal é de ${km2(estimativa.km2)}; o número final sai no ano seguinte.`,
  });
}

// Mesmo ano: a ordem em que foram escritos acima (lei antes do número).
const emOrdem = [...marcos].sort((a, b) => a.ano - b.ano);

/** Do mais antigo ao mais recente, para a Home. */
export const linhaDoTempo = emOrdem;

/** Os cinco mais recentes, do mais novo ao mais velho, para o painel do mapa. */
export const linhaDoTempoMapa = emOrdem.slice(-5).reverse();
