// Gera src/dados/especies.ts com o status de conservação das espécies do catálogo.
//
// Fontes, as duas abertas e sem chave:
// - Lista nacional: o CSV de fauna ameaçada do Portal de Dados Abertos do MMA
//   (https://dados.mma.gov.br/dataset/especies-ameacadas), achado pela API do CKAN. É a
//   avaliação que virou a Portaria MMA nº 148/2022.
// - Lista Vermelha da IUCN (global), pela API do GBIF, que a republica. A API da própria
//   IUCN exige chave, e chave não entra no código.
//
// Até 28/10/2026 o status, a população e a série de 2000 a 2024 de cada espécie eram
// valores herdados do React sem fonte: a onça aparecia "criticamente ameaçada" (é
// vulnerável na lista nacional) e o tucano-de-bico-preto nem está ameaçado.
//
// Como refazer (Node 18+, sem dependências):
//
//   node scripts/especies/gerar.mjs
//
// O workflow `dados-especies.yml` roda isto todo mês e abre um PR quando algo muda.

import { writeFileSync } from "node:fs";

// Nome científico de cada espécie de src/dados/animais.ts. Espécie nova no catálogo
// entra aqui também; animais.ts para o build se faltar alguma.
const ESPECIES = [
  "Panthera onca",
  "Anodorhynchus leari",
  "Leontopithecus rosalia",
  "Chrysocyon brachyurus",
  "Myrmecophaga tridactyla",
  "Inia geoffrensis",
  "Cyanopsitta spixii",
  "Saguinus bicolor",
  "Ateles marginatus",
  "Guaruba guarouba",
  "Trichechus inunguis",
  "Harpia harpyja",
  "Bradypus variegatus",
  "Ara chloropterus",
  "Eunectes murinus",
  "Mergus octosetaceus",
  "Priodontes maximus",
  "Tapirus terrestris",
  "Speothos venaticus",
  "Ramphastos toco",
  "Cariama cristata",
  "Ara ararauna",
  "Brachyteles hypoxanthus",
  "Aburria jacutinga",
  "Leopardus guttulus",
  "Ramphastos dicolorus",
  "Cyanocorax caeruleus",
  "Nasua nasua",
  "Antilophia bokermanni",
  "Tolypeutes tricinctus",
  "Kerodon rupestris",
  "Callithrix jacchus",
  "Patagioenas picazuro",
  "Caracara plancus",
  "Blastocerus dichotomus",
  "Pteronura brasiliensis",
  "Jabiru mycteria",
  "Caiman yacare",
  "Hydrochoerus hydrochaeris",
  "Xanthopsar flavus",
  "Gubernatrix cristata",
  "Ctenomys flamarioni",
  "Rhea americana",
  "Vanellus chilensis",
  "Lycalopex gymnocercus",
];

const CKAN = "https://dados.mma.gov.br/api/3/action/package_show?id=especies-ameacadas";
const GBIF = "https://api.gbif.org/v1";

async function baixar(url, comoTexto = false) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`${url}: HTTP ${resposta.status}`);
  return comoTexto ? resposta.text() : resposta.json();
}

// ── Lista nacional (MMA) ──

const pacote = await baixar(CKAN);
if (!pacote?.success || !Array.isArray(pacote.result?.resources)) throw new Error("CKAN do MMA fora do formato");

// O conjunto guarda uma lista por ano (2018, 2019, 2020, "FAUNA ... 2021"...). A de
// fauna mais recente é a que vale.
const recursos = pacote.result.resources
  .filter((r) => /^fauna\b/i.test(r.name ?? "") && /csv/i.test(r.format ?? ""))
  .sort((a, b) => String(b.last_modified).localeCompare(String(a.last_modified)));
const recurso = recursos[0];
if (!recurso) throw new Error("CKAN do MMA: nenhum CSV de fauna");

const linhas = (await baixar(recurso.url, true))
  .replace(/^﻿/, "")
  .split(/\r?\n/)
  .filter((l) => l.trim() !== "")
  .map((l) => l.split(";").map((c) => c.trim()));

// A coluna da categoria muda de nome a cada avaliação ("Sugestão de Categoria 2021"):
// vale a do ano mais recente.
const cabecalho = linhas[0] ?? [];
const colunaEspecie = cabecalho.findIndex((c) => /^esp[ée]cie ou subesp[ée]cie$/i.test(c));
const colunasCategoria = cabecalho
  .map((c, i) => ({ i, ano: Number(/^(?:sugest[ãa]o de )?categoria (?:em )?(\d{4})$/i.exec(c)?.[1]) }))
  .filter((c) => c.ano > 0)
  .sort((a, b) => b.ano - a.ano);
const categoria = colunasCategoria[0];
if (colunaEspecie < 0 || !categoria) throw new Error(`CSV do MMA fora do formato: ${cabecalho.join(";")}`);

/** "Criticamente em Perigo (CR)(PEX)" -> "CR". Fora de ameaça (NT, LC, DD) -> null. */
function siglaNacional(texto) {
  const sigla = /\((EX|EW|RE|CR|EN|VU|NT|LC|DD)\)/i.exec(texto ?? "")?.[1]?.toUpperCase();
  return ["EX", "EW", "RE", "CR", "EN", "VU"].includes(sigla) ? sigla : null;
}

const nacional = new Map();
const porCategoria = { CR: 0, EN: 0, VU: 0 };
for (const linha of linhas.slice(1)) {
  const nome = linha[colunaEspecie];
  const sigla = siglaNacional(linha[categoria.i]);
  if (!nome || !sigla) continue;
  nacional.set(nome, sigla);
  if (sigla in porCategoria) porCategoria[sigla] += 1;
}
const ameacadas = porCategoria.CR + porCategoria.EN + porCategoria.VU;
// A lista tem mais de mil espécies; um número muito menor é sinal de CSV quebrado.
if (ameacadas < 500) throw new Error(`CSV do MMA: só ${ameacadas} espécies ameaçadas`);
const publicadaEm = String(recurso.last_modified).slice(0, 10);
console.log(`lista nacional (${categoria.ano}, publicada em ${publicadaEm}): ${ameacadas} ameaçadas`, porCategoria);

// ── Lista Vermelha da IUCN, pelo GBIF ──

const SIGLAS_IUCN = ["EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD"];

const status = {};
for (const especie of ESPECIES) {
  const casamento = await baixar(`${GBIF}/species/match?strict=true&kingdom=Animalia&name=${encodeURIComponent(especie)}`);
  if (casamento?.matchType !== "EXACT" || !casamento.usageKey) throw new Error(`GBIF não achou "${especie}" (${casamento?.matchType})`);
  // Sem avaliação, o GBIF responde 204 sem corpo.
  const resposta = await fetch(`${GBIF}/species/${casamento.usageKey}/iucnRedListCategory`);
  if (!resposta.ok) throw new Error(`${especie}: HTTP ${resposta.status} no GBIF`);
  const corpo = resposta.status === 204 ? null : await resposta.json();
  const iucn = SIGLAS_IUCN.includes(corpo?.code) ? corpo.code : null;

  status[especie] = { nacional: nacional.get(especie) ?? null, iucn };
  console.log(`${especie}: nacional ${status[especie].nacional ?? "fora da lista"}, IUCN ${iucn ?? "sem avaliação"}`);
}

const texto = (v) => (v === null ? "null" : `"${v}"`);

const saida = `// GERADO por scripts/especies/gerar.mjs — não edite à mão.
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
  ano: ${categoria.ano},
  /** Quando o MMA publicou o CSV no portal. */
  publicadaEm: "${publicadaEm}",
  /** Espécies e subespécies da fauna em CR, EN ou VU. */
  ameacadas: ${ameacadas},
  porCategoria: { CR: ${porCategoria.CR}, EN: ${porCategoria.EN}, VU: ${porCategoria.VU} },
  fonte: "https://dados.mma.gov.br/dataset/especies-ameacadas",
};

export const statusEspecies: Record<string, { nacional: CategoriaNacional | null; iucn: CategoriaIUCN | null }> = {
${ESPECIES.map((e) => `  "${e}": { nacional: ${texto(status[e].nacional)}, iucn: ${texto(status[e].iucn)} },`).join("\n")}
};
`;

const destino = new URL("../../src/dados/especies.ts", import.meta.url);
writeFileSync(destino, saida);
console.log("ok:", destino.pathname);
