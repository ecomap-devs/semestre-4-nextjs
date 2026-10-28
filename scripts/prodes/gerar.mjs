// Gera src/dados/prodes.ts com o desmatamento medido pelo PRODES, do INPE.
//
// Fonte: os mesmos arquivos que o painel do TerraBrasilis carrega
// (https://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/cerrado/increments).
// O endereço vem do código do painel (terrabrasilis/deforestation_dashboard,
// src/app/util/constants.ts). Não é uma API documentada: se o INPE mudar o formato,
// este script para com erro em vez de gravar número errado.
//
// Até 28/10/2026 os números da Home e das fichas dos biomas eram valores de referência
// herdados do React, alguns muito longe do real (a Amazônia aparecia 78% desmatada).
//
// Como refazer (Node 18+, sem dependências):
//
//   node scripts/prodes/gerar.mjs
//
// O workflow `dados-prodes.yml` roda isto todo mês e abre um PR quando algo muda.

import { writeFileSync } from "node:fs";

const BASE = "https://terrabrasilis.dpi.inpe.br/app/prodes/dashboard/deforestation/files";

// Chave de src/dados/biomas.ts -> produtos do PRODES que somam o bioma. Na Amazônia
// o PRODES mede a floresta e a vegetação não florestal em produtos separados.
const PRODUTOS = {
  amazonia: ["amazon", "amazon_nf"],
  cerrado: ["cerrado"],
  caatinga: ["caatinga"],
  "mata-atlantica": ["mata_atlantica"],
  pantanal: ["pantanal"],
  pampa: ["pampa"],
};

// Área de cada bioma em km²: IBGE, "Biomas e sistema costeiro-marinho do Brasil"
// (2019), 1:250.000. É a base do percentual desmatado.
const AREA_IBGE = {
  amazonia: 4212742,
  cerrado: 1983017,
  caatinga: 862818,
  "mata-atlantica": 1107419,
  pantanal: 150988,
  pampa: 193836,
};

// Nos arquivos do painel, `loi` é o recorte (1 = estados, 2 = municípios, 3 e 4 =
// unidades de conservação e terras indígenas). Os estados cobrem o bioma inteiro sem
// sobreposição, então somar o recorte 1 dá o total do bioma.
const RECORTE_ESTADOS = 1;

async function baixar(arquivo) {
  const resposta = await fetch(`${BASE}/${arquivo}`);
  if (!resposta.ok) throw new Error(`${arquivo}: HTTP ${resposta.status}`);
  return resposta.json();
}

/** Período do PRODES -> km² somados nos estados. */
function lerProduto(produto, dados) {
  if (!Array.isArray(dados?.periods)) throw new Error(`${produto}: sem "periods"`);
  const periodos = new Map();
  for (const p of dados.periods) {
    const inicio = p?.startDate?.year;
    const fim = p?.endDate?.year;
    if (!Number.isInteger(inicio) || !Number.isInteger(fim) || !Array.isArray(p.features)) {
      throw new Error(`${produto}: período fora do formato`);
    }
    let km2 = 0;
    for (const f of p.features) {
      if (f.loi !== RECORTE_ESTADOS) continue;
      for (const a of f.areas ?? []) {
        if (!Number.isFinite(a.area)) throw new Error(`${produto}: área inválida em ${inicio}-${fim}`);
        km2 += a.area;
      }
    }
    periodos.set(`${inicio}-${fim}`, { inicio, fim, km2 });
  }
  return periodos;
}

const { last_date: atualizadoEm } = await baixar("last_update_date.json");
if (!/^\d{4}-\d{2}-\d{2}$/.test(atualizadoEm ?? "")) throw new Error("last_update_date.json fora do formato");

// O INPE publica o ano corrente como estimativa e consolida no ano seguinte; o painel
// marca como preliminar o período que termina no ano da última atualização.
const anoPreliminar = Number(atualizadoEm.slice(0, 4));

const biomas = {};
for (const [chave, produtos] of Object.entries(PRODUTOS)) {
  const lidos = [];
  for (const produto of produtos) lidos.push(lerProduto(produto, await baixar(`data/prodes_${produto}.json`)));

  // O primeiro período de cada produto é o acumulado até o início da série
  // ("1500-2000", ou "1500-2007" na floresta amazônica).
  let acumuladoKm2 = 0;
  for (const periodos of lidos) for (const p of periodos.values()) acumuladoKm2 += p.km2;

  // Série anual: só períodos de um ano (até 2013 alguns biomas eram medidos a cada
  // dois ou quatro anos) e que TODOS os produtos do bioma têm, para um ano não
  // aparecer com só metade da Amazônia.
  const anos = [...lidos[0].values()]
    .filter((p) => p.fim - p.inicio === 1 && lidos.every((periodos) => periodos.has(`${p.inicio}-${p.fim}`)))
    .map((p) => ({
      inicio: p.inicio,
      fim: p.fim,
      km2: lidos.reduce((s, periodos) => s + periodos.get(`${p.inicio}-${p.fim}`).km2, 0),
    }))
    .sort((a, b) => a.inicio - b.inicio);

  // Acumulado ao fim de cada período: tudo o que terminou até aquele ano, somando os
  // produtos. Aqui entram também os períodos de dois ou quatro anos.
  const fins = [...new Set(lidos.flatMap((periodos) => [...periodos.values()].map((p) => p.fim)))].sort((a, b) => a - b);
  const acumulado = fins.map((fim) => ({
    fim,
    km2: lidos.reduce((s, periodos) => s + [...periodos.values()].filter((p) => p.fim <= fim).reduce((t, p) => t + p.km2, 0), 0),
  }));

  if (anos.length === 0) throw new Error(`${chave}: nenhum período anual`);
  biomas[chave] = { areaKm2: AREA_IBGE[chave], acumuladoKm2, anos, acumulado };
  console.log(`${chave}: ${Math.round(acumuladoKm2)} km² acumulados, ${anos.length} períodos`);
}

// A taxa oficial da Amazônia Legal, a que o INPE anuncia todo ano. É outra conta: uma
// estimativa para a região inteira (não o bioma), e só da floresta. Vai à parte, para
// a linha do tempo, e não se mistura com os incrementos acima.
const dadosTaxas = await baixar("rates2026.json");
if (dadosTaxas?.clazz !== "deforestation_rates" || !Array.isArray(dadosTaxas.periods)) throw new Error("rates2026.json fora do formato");
const taxas = dadosTaxas.periods
  .map((p) => {
    const ano = p?.endDate?.year;
    if (!Number.isInteger(ano) || !Array.isArray(p.features)) throw new Error("rates2026.json: período fora do formato");
    // Aqui cada feature é um estado da Amazônia Legal: a soma é a taxa da região.
    const total = p.features.reduce((s, f) => s + (f.areas ?? []).reduce((t, a) => t + a.area, 0), 0);
    if (!Number.isFinite(total)) throw new Error(`rates2026.json: taxa inválida em ${ano}`);
    return { ano, km2: total };
  })
  .sort((a, b) => a.ano - b.ano);
console.log(`taxas da Amazônia Legal: ${taxas[0]?.ano}–${taxas.at(-1)?.ano}`);

const km2 = (v) => Math.round(v * 10) / 10;

let saida = `// GERADO por scripts/prodes/gerar.mjs — não edite à mão.
//
// Desmatamento medido pelo PRODES (INPE), somado por bioma a partir dos arquivos do
// painel do TerraBrasilis. Área dos biomas: IBGE (2019). Na Amazônia, floresta e
// vegetação não florestal somadas. Períodos de agosto a julho: "2024–2025" vai de
// 01/08/2024 a 31/07/2025.

export type PeriodoPRODES = {
  inicio: number;
  fim: number;
  km2: number;
  /** Estimativa do INPE, ainda não consolidada. */
  preliminar: boolean;
};

export type DesmatamentoBioma = {
  /** Área do bioma segundo o IBGE. */
  areaKm2: number;
  /** Tudo o que o PRODES já mapeou como desmatado, do início da série até hoje. */
  acumuladoKm2: number;
  /** Desmatamento a cada período de um ano, do mais antigo ao mais recente. */
  anos: PeriodoPRODES[];
  /** Total já desmatado ao fim de cada período (\`fim\`), desde o início da série. */
  acumulado: { fim: number; km2: number }[];
};

/** Data da última atualização dos dados no TerraBrasilis. */
export const prodesAtualizadoEm = "${atualizadoEm}";

export const prodes: Record<string, DesmatamentoBioma> = {
`;
for (const [chave, b] of Object.entries(biomas)) {
  saida += `  "${chave}": {\n    areaKm2: ${b.areaKm2},\n    acumuladoKm2: ${km2(b.acumuladoKm2)},\n    anos: [\n`;
  for (const p of b.anos) {
    saida += `      { inicio: ${p.inicio}, fim: ${p.fim}, km2: ${km2(p.km2)}, preliminar: ${p.fim >= anoPreliminar} },\n`;
  }
  saida += "    ],\n    acumulado: [\n";
  for (const a of b.acumulado) saida += `      { fim: ${a.fim}, km2: ${km2(a.km2)} },\n`;
  saida += "    ],\n  },\n";
}
saida += "};\n";

saida += `
/**
 * Taxa anual oficial de desmatamento da Amazônia Legal (só floresta), a que o INPE
 * anuncia. \`ano\` é o fim do período: 2004 = ago/2003 a jul/2004.
 */
export const taxasAmazoniaLegal: { ano: number; km2: number; preliminar: boolean }[] = [
${taxas.map((t) => `  { ano: ${t.ano}, km2: ${km2(t.km2)}, preliminar: ${t.ano >= anoPreliminar} },`).join("\n")}
];
`;

const destino = new URL("../../src/dados/prodes.ts", import.meta.url);
writeFileSync(destino, saida);
console.log("ok:", destino.pathname);
