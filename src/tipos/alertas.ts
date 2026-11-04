/** Quantos meses de alerta mostrar, contados do alerta mais recente do arquivo. */
export type PeriodoAlertas = 1 | 3 | 12;

/** O que a legenda conta dos alertas no período escolhido: vem pronto no arquivo, somado pelo gerador antes da dissolução. */
export type ResumoAlertas = { total: number; areaHa: number; areaSemSobreposicaoHa: number | null; inicio: string; fim: string };

export type AlertasDoPeriodo = { resumo: ResumoAlertas; poligonos: GeoJSON.Position[][][] };

export const ARQUIVO_DO_PERIODO: Record<PeriodoAlertas, string> = {
  1: "/alertas/1-mes.json",
  3: "/alertas/3-meses.json",
  12: "/alertas/12-meses.json",
};

function objeto(valor: unknown): Record<string, unknown> | null {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null;
}

function numeroNaoNegativo(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0 ? valor : null;
}

function data(valor: unknown): string | null {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null;
}

function anel(valor: unknown): GeoJSON.Position[] | null {
  if (!Array.isArray(valor) || valor.length < 4) return null;
  const pontos: GeoJSON.Position[] = [];
  for (const p of valor) {
    if (!Array.isArray(p) || p.length < 2) return null;
    const [lng, lat] = p;
    if (typeof lng !== "number" || typeof lat !== "number" || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    pontos.push([lng, lat]);
  }
  return pontos;
}

function poligono(valor: unknown): GeoJSON.Position[][] | null {
  if (!Array.isArray(valor)) return null;
  const contorno = anel(valor[0]);
  if (!contorno) return null;
  const buracos = valor.slice(1).map(anel).filter((a): a is GeoJSON.Position[] => a !== null);
  return [contorno, ...buracos];
}

function poligonosDaGeometria(valor: unknown): GeoJSON.Position[][][] {
  const g = objeto(valor);
  if (!g || !Array.isArray(g.coordinates)) return [];
  const lista = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  return lista.map(poligono).filter((p): p is GeoJSON.Position[][] => p !== null);
}

export function paraAlertasDoPeriodo(d: unknown, periodo: PeriodoAlertas): AlertasDoPeriodo | null {
  const arquivo = objeto(d);
  if (!arquivo || arquivo.meses !== periodo || !Array.isArray(arquivo.features)) return null;
  const r = objeto(arquivo.resumo);
  const inicio = data(arquivo.inicio);
  const fim = data(arquivo.fim);
  const total = numeroNaoNegativo(r?.total);
  const areaHa = numeroNaoNegativo(r?.areaHa);
  if (!r || !inicio || !fim || inicio > fim || total === null || !Number.isInteger(total) || areaHa === null) return null;

  const poligonos = arquivo.features.flatMap((f) => poligonosDaGeometria(objeto(f)?.geometry));
  return {
    resumo: { total, areaHa, areaSemSobreposicaoHa: numeroNaoNegativo(r.areaSemSobreposicaoHa), inicio, fim },
    poligonos,
  };
}
