// Gera src/dados/biomasContornos.ts a partir do limite oficial dos biomas.
//
// Fonte: IBGE, "Biomas do Brasil", escala 1:5.000.000 (Biomas_5000mil.zip):
// https://geoftp.ibge.gov.br/informacoes_ambientais/estudos_ambientais/biomas/vetores/
//
// Mesma receita do app (tool/biomas/gerar.mjs no semestre-4-flutter), para os
// dois desenharem a mesma fronteira. Até 02/10/2026 os contornos eram retângulos
// herdados da versão React, e por isso o mapa nem os desenhava.
//
// Como refazer (Node 18+):
//
//   1. Baixe e descompacte o Biomas_5000mil.zip. O .prj vem como
//      "Biomas5000.prj.txt": renomeie para "Biomas5000.prj".
//   2. Separe os seis biomas terrestres e simplifique:
//
//      npx mapshaper@0.6 Biomas5000.shp encoding=latin1 \
//        -filter '!/Zona|Mar|Costeir|Continental/i.test(NOM_BIOMA)' \
//        -simplify 3% keep-shapes \
//        -filter-islands min-area=2000km2 \
//        -o biomas.json format=geojson precision=0.001
//
//   3. node scripts/biomas/gerar.mjs biomas.json

import { readFileSync, writeFileSync } from "node:fs";

const entrada = process.argv[2];
if (!entrada) {
  console.error("uso: node scripts/biomas/gerar.mjs <biomas.json>");
  process.exit(1);
}

// Nome no IBGE -> chave usada em src/dados/biomas.ts.
const CHAVES = {
  "Amazônia": "amazonia",
  "Cerrado": "cerrado",
  "Caatinga": "caatinga",
  "Mata Atlântica": "mata-atlantica",
  "Pantanal": "pantanal",
  "Pampa": "pampa",
};

const geo = JSON.parse(readFileSync(entrada, "utf8"));
const porNome = new Map(geo.features.map((f) => [f.properties.NOM_BIOMA, f]));

const faltando = Object.keys(CHAVES).filter((n) => !porNome.has(n));
if (faltando.length) {
  console.error("Biomas ausentes no GeoJSON:", faltando.join(", "));
  process.exit(1);
}

// ~1 km de resolução: mais que suficiente na escala 1:5.000.000.
const coord = (v) => Number(v.toFixed(2));
const anel = (pontos) => `[${pontos.map(([lng, lat]) => `[${coord(lng)}, ${coord(lat)}]`).join(", ")}]`;

let saida = `// GERADO por scripts/biomas/gerar.mjs — não edite à mão.
//
// Limite oficial dos biomas: IBGE, "Biomas do Brasil", 1:5.000.000, simplificado
// para o mapa. Ordem do GeoJSON: [longitude, latitude]. Cada polígono é uma lista
// de anéis: o primeiro é o contorno, os demais são buracos (massas d'água que o
// IBGE tira do bioma, como a represa de Balbina).

import type { Anel } from "./biomas";

export const contornos: Record<string, Anel[][]> = {
`;

for (const [nome, chave] of Object.entries(CHAVES)) {
  const g = porNome.get(nome).geometry;
  const poligonos = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const pontos = poligonos.flat().reduce((s, a) => s + a.length, 0);
  saida += `  // ${nome}: ${poligonos.length} parte(s), ${pontos} pontos.\n`;
  saida += `  "${chave}": [\n${poligonos.map((p) => `    [${p.map(anel).join(", ")}]`).join(",\n")},\n  ],\n`;
}
saida += "};\n";

const destino = new URL("../../src/dados/biomasContornos.ts", import.meta.url);
writeFileSync(destino, saida);
console.log("ok:", destino.pathname);
