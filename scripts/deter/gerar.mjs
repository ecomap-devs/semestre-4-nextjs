// Gera public/alertas-desmatamento.json com os alertas de desmatamento do DETER (INPE)
// dos últimos 12 meses.
//
// Fonte: o GeoServer público do TerraBrasilis (WFS), o mesmo que alimenta o painel do
// DETER (https://terrabrasilis.dpi.inpe.br/app/dashboard/alerts/legal/amazon/aggregated/).
// O DETER só cobre a Amazônia Legal e o Cerrado: Mata Atlântica, Caatinga, Pantanal e
// Pampa não têm alerta do INPE.
//
// Até 29/10/2026 o arquivo era fixo, de jan/2019 a mar/2023, e pelos campos (CODEALERTA,
// VPRESSAO) parecia vir do MapBiomas Alerta, não do DETER que o site citava.
//
// Como refazer (Node 18+, sem dependências):
//
//   node scripts/deter/gerar.mjs
//
// O workflow `dados-deter.yml` roda isto todo mês e abre um PR quando algo muda.

import { writeFileSync } from "node:fs";

const GEOSERVER = "https://terrabrasilis.dpi.inpe.br/geoserver";

// Camada de cada bioma no GeoServer. A da Amazônia é da Amazônia Legal, que também pega
// um pedaço do Cerrado; o rótulo segue o nome da camada, como no painel do INPE.
const CAMADAS = [
  { bioma: "Amazônia Legal", camada: "deter-amz:deter_amz" },
  { bioma: "Cerrado", camada: "deter-cerrado-nb:deter_cerrado" },
];

// Só as classes de desmatamento. Degradação, corte seletivo e cicatriz de queimada são
// alertas de outra coisa: a floresta danificada ainda está de pé.
const CLASSES = {
  DESMATAMENTO_CR: "desmatamento",
  DESMATAMENTO_VEG: "desmatamento",
  MINERACAO: "mineração",
};

const POR_PAGINA = 10000;
const MESES = 12;

// Tolerância da simplificação, em graus (~0,0005° ≈ 55 m, perto de um pixel do sensor
// AWFI). O contorno do DETER vem em "escada", pixel a pixel; simplificar tira a escada
// sem mudar o que se vê no mapa, e o arquivo cai a uma fração.
const TOLERANCIA = 0.0005;

async function baixar(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`${url}: HTTP ${resposta.status}`);
  const texto = await resposta.text();
  // O GeoServer devolve erro de consulta como XML com HTTP 200.
  if (texto.startsWith("<")) throw new Error(`${url}: ${texto.slice(0, 300)}`);
  return JSON.parse(texto);
}

function urlWfs(camada, parametros) {
  const area = camada.split(":")[0];
  const q = new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: camada, outputFormat: "application/json", ...parametros });
  return `${GEOSERVER}/${area}/ows?${q}`;
}

/** Distância do ponto p à reta a–b, em graus. */
function distancia(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / Math.hypot(dx, dy);
}

/** Douglas–Peucker num anel fechado. Devolve null se sobrar menos que um triângulo. */
function simplificarAnel(anel) {
  const manter = new Uint8Array(anel.length);
  manter[0] = manter[anel.length - 1] = 1;
  const pilha = [[0, anel.length - 1]];
  // O primeiro e o último ponto do anel são o mesmo: começa pelo ponto mais distante
  // dele, senão o anel colapsa numa reta.
  let longe = 0;
  for (let i = 1; i < anel.length - 1; i++) if (Math.hypot(anel[i][0] - anel[0][0], anel[i][1] - anel[0][1]) > Math.hypot(anel[longe][0] - anel[0][0], anel[longe][1] - anel[0][1])) longe = i;
  if (longe > 0) {
    manter[longe] = 1;
    pilha.splice(0, 1, [0, longe], [longe, anel.length - 1]);
  }
  while (pilha.length) {
    const [ini, fim] = pilha.pop();
    let maior = 0;
    let indice = -1;
    for (let i = ini + 1; i < fim; i++) {
      const d = distancia(anel[i], anel[ini], anel[fim]);
      if (d > maior) [maior, indice] = [d, i];
    }
    if (maior > TOLERANCIA) {
      manter[indice] = 1;
      pilha.push([ini, indice], [indice, fim]);
    }
  }
  const saida = anel.filter((_, i) => manter[i]).map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]);
  return saida.length >= 4 ? saida : null;
}

/** Polygon ou MultiPolygon do WFS -> MultiPolygon simplificado (ou null). */
function simplificar(geometria) {
  const poligonos = geometria?.type === "Polygon" ? [geometria.coordinates] : geometria?.type === "MultiPolygon" ? geometria.coordinates : null;
  if (!poligonos) return null;
  const saida = [];
  for (const aneis of poligonos) {
    const contorno = simplificarAnel(aneis[0]);
    // Alerta menor que a tolerância: fica como o contorno original, para não sumir.
    if (!contorno) {
      saida.push([aneis[0].map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4])]);
      continue;
    }
    saida.push([contorno, ...aneis.slice(1).map(simplificarAnel).filter(Boolean)]);
  }
  return saida.length ? { type: "MultiPolygon", coordinates: saida } : null;
}

// O fim do período é o alerta mais recente das duas camadas, não o dia de hoje: se o INPE
// atrasar a publicação, o mapa continua com 12 meses de dado.
let fim = "";
for (const { camada } of CAMADAS) {
  const ultimo = await baixar(urlWfs(camada, { count: "1", sortBy: "view_date D", propertyName: "view_date" }));
  const data = ultimo?.features?.[0]?.properties?.view_date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data ?? "")) throw new Error(`${camada}: sem view_date`);
  if (data > fim) fim = data;
}
const inicioData = new Date(`${fim}T00:00:00Z`);
inicioData.setUTCMonth(inicioData.getUTCMonth() - MESES);
inicioData.setUTCDate(inicioData.getUTCDate() + 1);
const inicio = inicioData.toISOString().slice(0, 10);
console.log(`período: ${inicio} a ${fim}`);

const filtro = `view_date >= '${inicio}' AND view_date <= '${fim}' AND classname IN (${Object.keys(CLASSES).map((c) => `'${c}'`).join(",")})`;

const features = [];
for (const { bioma, camada } of CAMADAS) {
  let lidos = 0;
  for (let pagina = 0; ; pagina++) {
    const dados = await baixar(
      urlWfs(camada, {
        CQL_FILTER: filtro,
        propertyName: "classname,view_date,areamunkm,municipality,uf,geom".replace("geom", camada.startsWith("deter-amz") ? "geom" : "st_multi"),
        sortBy: "gid",
        count: String(POR_PAGINA),
        startIndex: String(pagina * POR_PAGINA),
      }),
    );
    if (!Array.isArray(dados?.features)) throw new Error(`${camada}: resposta sem "features"`);
    for (const f of dados.features) {
      const p = f.properties ?? {};
      const classe = CLASSES[p.classname];
      const geometria = simplificar(f.geometry);
      if (!classe || !geometria || !/^\d{4}-\d{2}-\d{2}$/.test(p.view_date ?? "") || !Number.isFinite(p.areamunkm)) {
        throw new Error(`${camada}: alerta fora do formato (${f.id})`);
      }
      features.push({
        type: "Feature",
        geometry: geometria,
        // Nomes de campo do INPE, mais o bioma (da camada) e a área em hectares.
        properties: {
          classname: classe,
          view_date: p.view_date,
          areaha: Math.round(p.areamunkm * 100 * 10) / 10,
          municipality: p.municipality ?? "",
          uf: p.uf ?? "",
          bioma,
        },
      });
    }
    lidos += dados.features.length;
    if (dados.features.length < POR_PAGINA) break;
  }
  console.log(`${bioma}: ${lidos} alertas`);
}

// Um ano tem dezenas de milhares de alertas; um número muito menor é sinal de filtro
// quebrado, não de um ano bom.
if (features.length < 5000) throw new Error(`só ${features.length} alertas em 12 meses`);

// Do mais antigo ao mais recente: o mapa filtra por período sem precisar ordenar.
features.sort((a, b) => a.properties.view_date.localeCompare(b.properties.view_date));

const saida = { type: "FeatureCollection", fonte: "DETER/INPE, TerraBrasilis", inicio, fim, features };
const destino = new URL("../../public/alertas-desmatamento.json", import.meta.url);
const texto = JSON.stringify(saida);
writeFileSync(destino, texto);
console.log(`ok: ${features.length} alertas, ${(texto.length / 1e6).toFixed(1)} MB em ${destino.pathname}`);
