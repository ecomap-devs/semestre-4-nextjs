# Gera os alertas de desmatamento do DETER (INPE) dos últimos 12 meses:
#
# - public/alertas-desmatamento.json: um alerta por feature, para o botão de download da
#   Home e para o app;
# - public/alertas/{1-mes,3-meses,12-meses}.json: o que o mapa desenha, dissolvido, com o
#   resumo da legenda pronto.
#
# Fonte: o GeoServer público do TerraBrasilis (WFS), o mesmo que alimenta o painel do DETER
# (https://terrabrasilis.dpi.inpe.br/app/dashboard/alerts/legal/amazon/aggregated/). O DETER
# só cobre a Amazônia Legal e o Cerrado: Mata Atlântica, Caatinga, Pantanal e Pampa não têm
# alerta do INPE.
#
# Como refazer (Python 3.14, com o scripts/deter/requirements.txt num .venv; veja o README):
#
#   python scripts/deter/gerar.py            # lê as respostas de .cache/deter/
#   python scripts/deter/gerar.py --baixar   # baixa tudo de novo do INPE
#   python scripts/deter/gerar.py --forcar   # regrava mesmo sem alerta novo
#
# Sem alerta novo, nada é gravado (`sem_novidade`). O workflow dados-deter.yml roda isto
# todo mês e abre uma issue com o link do PR quando os alertas mudam.

import argparse
import calendar
import gzip
import hashlib
import json
import math
import os
import re
import sys
from collections import Counter
from datetime import date, datetime, timedelta
from itertools import count
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import requests
import shapely
from pyproj import CRS
from pyproj.crs import ProjectedCRS
from pyproj.crs.coordinate_operation import AlbersEqualAreaConversion
from shapely.geometry import shape

GEOSERVER = "https://terrabrasilis.dpi.inpe.br/geoserver"

# A camada da Amazônia é a da Amazônia Legal, que também pega um pedaço do Cerrado; o rótulo
# segue o nome da camada, como no painel do INPE.
CAMADAS = [
    {"bioma": "Amazônia Legal", "camada": "deter-amz:deter_amz", "geometria": "geom"},
    {"bioma": "Cerrado", "camada": "deter-cerrado-nb:deter_cerrado", "geometria": "st_multi"},
]

# Só as classes de desmatamento. Degradação, corte seletivo e cicatriz de queimada são
# alertas de outra coisa: a floresta danificada ainda está de pé.
CLASSES = {
    "DESMATAMENTO_CR": "desmatamento",
    "DESMATAMENTO_VEG": "desmatamento",
    "MINERACAO": "mineração",
}

POR_PAGINA = 10000
MESES = 12
PERIODOS = {1: "1-mes", 3: "3-meses", 12: "12-meses"}

# Um ano tem dezenas de milhares de alertas em cada camada. Um número muito menor, em
# qualquer uma delas, é filtro quebrado ou camada fora do ar, não um ano bom. O piso é por
# camada porque a da Amazônia sozinha já passaria de um piso geral sem o Cerrado.
MINIMO_DE_ALERTAS = 5000

# O INPE publica alguns alertas sem polígono de verdade (29 de 40.420 até 23/10/2026). Muito
# mais que isso é geometria quebrada na fonte, e o mapa sairia vazio com a legenda cheia.
TETO_SEM_POLIGONO = 0.01

# Tolerância da simplificação, em graus (0,0005° ≈ 55 m, perto de um pixel do sensor AWFI). O
# contorno do DETER vem em "escada", pixel a pixel; simplificar tira a escada sem mudar o que
# se vê no mapa, e o arquivo cai a uma fração.
TOLERANCIA = 0.0005
PRECISAO = 0.0001
PRECISAO_FINA = 0.000001
CASAS = 6

FONTE = "DETER/INPE, TerraBrasilis"

SIRGAS_2000 = CRS.from_epsg(4674)
ALBERS_SIRGAS_2000 = ProjectedCRS(
    name="Albers de área igual sobre SIRGAS 2000",
    conversion=AlbersEqualAreaConversion(
        latitude_first_parallel=-2,
        latitude_second_parallel=-22,
        latitude_false_origin=-12,
        longitude_false_origin=-54,
    ),
    geodetic_crs=SIRGAS_2000,
)

RAIZ = Path(__file__).resolve().parents[2]
DESTINO = RAIZ / "public" / "alertas-desmatamento.json"
PASTA_DOS_PERIODOS = RAIZ / "public" / "alertas"
PASTA_DO_CACHE = RAIZ / ".cache" / "deter"

DATA = re.compile(r"\d{4}-\d{2}-\d{2}")

LIMITES_DO_BRASIL = {"longitude": (-75.0, -28.0), "latitude": (-35.0, 6.0)}


class ErroDoDeter(Exception):
    pass


class Wfs:
    def __init__(self, cache):
        self.cache = cache
        self.lidas_do_cache = []

    def consultar(self, camada, parametros):
        consulta = {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typeNames": camada,
            "outputFormat": "application/json",
            **parametros,
        }
        if self.cache is None:
            return json.loads(baixar(camada, consulta))
        chave = hashlib.sha256(json.dumps(consulta, sort_keys=True).encode("utf-8")).hexdigest()[:16]
        arquivo = self.cache / f"{camada.replace(':', '_')}-{chave}.json"
        if arquivo.exists():
            self.lidas_do_cache.append(arquivo)
            return json.loads(arquivo.read_text(encoding="utf-8"))
        texto = baixar(camada, consulta)
        self.cache.mkdir(parents=True, exist_ok=True)
        temporario = arquivo.with_name(arquivo.name + ".tmp")
        temporario.write_text(texto, encoding="utf-8")
        os.replace(temporario, arquivo)
        return json.loads(texto)


def baixar(camada, consulta):
    espaco = camada.split(":")[0]
    try:
        resposta = requests.get(f"{GEOSERVER}/{espaco}/ows", params=consulta, timeout=300)
    except requests.RequestException as erro:
        raise ErroDoDeter(f"{camada}: o GeoServer não respondeu ({erro})") from erro
    if resposta.status_code != 200:
        raise ErroDoDeter(f"{camada}: HTTP {resposta.status_code} em {resposta.url}")
    try:
        texto = resposta.content.decode("utf-8").lstrip()
    except UnicodeDecodeError as erro:
        raise ErroDoDeter(f"{camada}: resposta fora de UTF-8 ({erro})") from erro
    if texto.startswith("<") or "xml" in resposta.headers.get("Content-Type", "").lower():
        motivo = re.search(r"<(?:\w+:)?ExceptionText>(.*?)</", texto, re.S)
        detalhe = (motivo.group(1) if motivo else texto[:300]).strip()
        raise ErroDoDeter(f"{camada}: o GeoServer devolveu um erro em XML com HTTP 200: {detalhe}")
    try:
        json.loads(texto)
    except json.JSONDecodeError as erro:
        raise ErroDoDeter(f"{camada}: a resposta não é JSON ({erro})") from erro
    return texto


def data_valida(valor):
    return isinstance(valor, str) and DATA.fullmatch(valor) is not None


def numero_finito(valor):
    return isinstance(valor, (int, float)) and not isinstance(valor, bool) and math.isfinite(valor)


def inicio_do_periodo(fim, meses):
    ano, mes, dia = (int(parte) for parte in fim.split("-"))
    ano_destino, indice_do_mes = divmod(ano * 12 + (mes - 1) - meses, 12)
    mes_destino = indice_do_mes + 1
    ultimo_dia = calendar.monthrange(ano_destino, mes_destino)[1]
    return (date(ano_destino, mes_destino, min(dia, ultimo_dia)) + timedelta(days=1)).isoformat()


# O fim do período é o alerta mais recente das duas camadas, não o dia de hoje: se o INPE
# atrasar a publicação, o mapa continua com 12 meses de dado.
def ultimo_alerta(wfs):
    fim = ""
    for camada in CAMADAS:
        dados = wfs.consultar(camada["camada"], {"count": "1", "sortBy": "view_date D", "propertyName": "view_date"})
        features = dados.get("features") if isinstance(dados, dict) else None
        data = ((features or [{}])[0].get("properties") or {}).get("view_date")
        if not data_valida(data):
            raise ErroDoDeter(f"{camada['camada']}: sem view_date")
        fim = max(fim, data)
    return fim


def area_em_hectares(areamunkm):
    return math.floor(areamunkm * 100 * 10 + 0.5) / 10


def baixar_alertas(wfs, inicio, fim):
    classes = ",".join(f"'{classe}'" for classe in CLASSES)
    filtro = f"view_date >= '{inicio}' AND view_date <= '{fim}' AND classname IN ({classes})"
    linhas = []
    geometrias = []
    for camada in CAMADAS:
        lidos = 0
        esperados = None
        for pagina in count():
            dados = wfs.consultar(
                camada["camada"],
                {
                    "CQL_FILTER": filtro,
                    "propertyName": f"classname,view_date,areamunkm,municipality,uf,{camada['geometria']}",
                    # O gid se repete quando o INPE divide um alerta entre municípios (425 casos
                    # em 12 meses), e o servidor devolve os empatados em qualquer ordem. Sem o
                    # município, um alerta na virada da página pode vir duas vezes e outro, nenhuma.
                    "sortBy": "gid,municipality",
                    "count": str(POR_PAGINA),
                    "startIndex": str(pagina * POR_PAGINA),
                },
            )
            features = dados.get("features") if isinstance(dados, dict) else None
            if not isinstance(features, list):
                raise ErroDoDeter(f'{camada["camada"]}: resposta sem "features"')
            esperados = dados.get("numberMatched")
            for feature in features:
                p = feature.get("properties") or {}
                if p.get("classname") not in CLASSES or not data_valida(p.get("view_date")) or not numero_finito(p.get("areamunkm")):
                    raise ErroDoDeter(f"{camada['camada']}: alerta fora do formato ({feature.get('id')})")
                linhas.append(
                    {
                        "classname": CLASSES[p["classname"]],
                        "view_date": p["view_date"],
                        "areaha": area_em_hectares(p["areamunkm"]),
                        "municipality": p.get("municipality") or "",
                        "uf": p.get("uf") or "",
                        "bioma": camada["bioma"],
                    }
                )
                geometria = feature.get("geometry")
                geometrias.append(shape(geometria) if geometria else None)
            lidos += len(features)
            if len(features) < POR_PAGINA:
                break
        if isinstance(esperados, int) and lidos != esperados:
            raise ErroDoDeter(f"{camada['camada']}: li {lidos} alertas, e o WFS diz que são {esperados}")
        if lidos < MINIMO_DE_ALERTAS:
            raise ErroDoDeter(f"{camada['camada']}: só {lidos} alertas em {MESES} meses")
        print(f"{camada['bioma']}: {lidos} alertas")
    return gpd.GeoDataFrame(pd.DataFrame(linhas), geometry=geometrias, crs=SIRGAS_2000)


def ordenar(alertas):
    # Pelo conteúdo, não pelo gid: ele se repete, e cada download traz os empatados numa ordem.
    # A dissolução do mapa também depende da ordem de entrada, então o arquivo mudaria sem o
    # dado mudar. Alerta igual em tudo, com a mesma geometria, só pode ser erro de leitura.
    chave = ["view_date", "bioma", "classname", "uf", "municipality", "areaha", "_wkb"]
    wkb = pd.Series(shapely.to_wkb(alertas.geometry.to_numpy(), hex=True), index=alertas.index, dtype=object).fillna("")
    com_wkb = alertas.assign(_wkb=wkb)
    repetidos = int(com_wkb[com_wkb["_wkb"] != ""].duplicated(subset=chave).sum())
    if repetidos:
        raise ErroDoDeter(f"{repetidos} alertas repetidos na leitura: a paginação do WFS escorregou; rode de novo")
    return com_wkb.sort_values(chave, kind="stable").drop(columns="_wkb").reset_index(drop=True)


def conferir_eixos(geometrias):
    oeste, sul, leste, norte = shapely.total_bounds(geometrias)
    (lon_min, lon_max), (lat_min, lat_max) = LIMITES_DO_BRASIL["longitude"], LIMITES_DO_BRASIL["latitude"]
    if not (lon_min <= oeste and leste <= lon_max and lat_min <= sul and norte <= lat_max):
        raise ErroDoDeter(f"coordenadas fora do Brasil ({oeste:.2f}, {sul:.2f}, {leste:.2f}, {norte:.2f}): o WFS pode ter trocado a ordem dos eixos para lat/lon")


def multipoligono(geometria):
    if geometria is None or geometria.is_empty:
        return None
    partes = [parte for parte in shapely.get_parts(shapely.get_parts(geometria)) if parte.geom_type == "Polygon" and not parte.is_empty]
    return shapely.MultiPolygon(partes) if partes else None


def corrigir_topologia(geometrias):
    validas = shapely.make_valid(np.asarray(geometrias, dtype=object), method="structure", keep_collapsed=False)
    return np.array([multipoligono(g) for g in validas], dtype=object)


def orientar(geometria):
    return None if geometria is None else shapely.orient_polygons(geometria)


def para_desenho(geometrias):
    simplificadas = shapely.simplify(geometrias, TOLERANCIA, preserve_topology=True)
    simplificadas = shapely.make_valid(simplificadas, method="structure", keep_collapsed=False)
    desenho = np.array([multipoligono(g) for g in shapely.set_precision(simplificadas, PRECISAO)], dtype=object)
    sumiram = pd.isna(desenho) & ~pd.isna(geometrias)
    desenho[sumiram] = [multipoligono(g) for g in shapely.set_precision(geometrias[sumiram], PRECISAO)]
    precisao_fina = pd.isna(desenho) & ~pd.isna(geometrias)
    desenho[precisao_fina] = [multipoligono(g) for g in shapely.set_precision(geometrias[precisao_fina], PRECISAO_FINA)]
    return np.array([orientar(g) for g in desenho], dtype=object), precisao_fina


def uniao_para_desenho(uniao):
    if uniao is None:
        return None
    partes = shapely.simplify(shapely.get_parts(uniao), TOLERANCIA, preserve_topology=True)
    juntas = shapely.make_valid(shapely.MultiPolygon(list(partes)), method="structure", keep_collapsed=False)
    return orientar(multipoligono(shapely.set_precision(juntas, PRECISAO)))


def area_ha(geometrias):
    return gpd.GeoSeries(geometrias, crs=SIRGAS_2000).to_crs(ALBERS_SIRGAS_2000).area.fillna(0).to_numpy() / 1e4


def numero(valor):
    return int(valor) if float(valor).is_integer() else valor


def coordenadas(geometria):
    return [
        [[[numero(round(x, CASAS)), numero(round(y, CASAS))] for x, y in anel.coords] for anel in (poligono.exterior, *poligono.interiors)]
        for poligono in geometria.geoms
    ]


def vertices(geometrias):
    return int(shapely.get_num_coordinates(np.asarray(geometrias, dtype=object)).sum())


def comparar_areas(alertas, calculada):
    oficial = alertas["areaha"].to_numpy()
    print(f"área: areaha do INPE {oficial.sum():,.1f} ha; calculada na Albers SIRGAS 2000 {calculada.sum():,.1f} ha ({(calculada.sum() / oficial.sum() - 1) * 100:+.3f}%)")
    com_area = oficial > 0
    relativa = np.abs(calculada[com_area] - oficial[com_area]) / oficial[com_area]
    print(f"  por alerta: |diferença| mediana {np.median(relativa):.2%}, p95 {np.percentile(relativa, 95):.2%}, acima de 10% em {int((relativa > 0.10).sum())} alertas")
    diferenca = pd.Series(calculada - oficial, index=alertas.index)
    for indice in diferenca.abs().nlargest(3).index:
        a = alertas.loc[indice]
        print(f"  maior diferença: {a['municipality']}/{a['uf']} {a['view_date']}: areaha {a['areaha']:,.1f} ha, calculada {calculada[indice]:,.1f} ha")


def texto_json(dados):
    return json.dumps(dados, ensure_ascii=False, separators=(",", ":"))


def arquivo_principal(alertas, desenho, inicio, fim):
    features = [
        {
            "type": "Feature",
            "geometry": None if geometria is None else {"type": "MultiPolygon", "coordinates": coordenadas(geometria)},
            "properties": {
                "classname": a.classname,
                "view_date": a.view_date,
                "areaha": numero(a.areaha),
                "municipality": a.municipality,
                "uf": a.uf,
                "bioma": a.bioma,
            },
        }
        for a, geometria in zip(alertas.itertuples(index=False), desenho)
    ]
    return texto_json({"type": "FeatureCollection", "fonte": FONTE, "inicio": inicio, "fim": fim, "features": features})


def no_periodo(tabela, inicio, fim):
    return ((tabela["view_date"] >= inicio) & (tabela["view_date"] <= fim)).to_numpy()


def arquivo_do_periodo(alertas, validas, calculada, fim, meses):
    inicio = inicio_do_periodo(fim, meses)
    dentro = no_periodo(alertas, inicio, fim)
    com_poligono = dentro & ~pd.isna(validas)
    uniao = multipoligono(shapely.union_all(validas[com_poligono]))
    sem_sobreposicao = float(area_ha(np.array([uniao], dtype=object))[0])
    desenho = uniao_para_desenho(uniao)
    resumo = {
        "total": int(dentro.sum()),
        "areaHa": numero(round(float(alertas.loc[dentro, "areaha"].sum()), 1)),
        "areaSemSobreposicaoHa": numero(round(sem_sobreposicao, 1)),
    }
    print(
        f"{meses} {'mês' if meses == 1 else 'meses'} ({inicio} a {fim}): {resumo['total']} alertas, {resumo['areaHa']:,.1f} ha; "
        f"sem sobreposição {resumo['areaSemSobreposicaoHa']:,.1f} ha (contado em dobro: {calculada[dentro].sum() - sem_sobreposicao:,.1f} ha); "
        f"{com_poligono.sum()} alertas com polígono viram {0 if desenho is None else len(desenho.geoms)} polígonos e {vertices([desenho])} vértices"
    )
    features = [] if desenho is None else [{"type": "Feature", "geometry": {"type": "MultiPolygon", "coordinates": coordenadas(desenho)}, "properties": {}}]
    return texto_json({"type": "FeatureCollection", "fonte": FONTE, "meses": meses, "inicio": inicio, "fim": fim, "resumo": resumo, "features": features})


def conteudo(texto):
    arquivo = json.loads(texto)
    return arquivo.get("inicio"), arquivo.get("fim"), Counter(json.dumps(f, sort_keys=True, ensure_ascii=False) for f in arquivo.get("features", []))


def sem_novidade(principal):
    # Compara os alertas, não os bytes. O download sai igual em qualquer sistema, mas a união
    # dos arquivos do mapa não: em 04/11/2026 Linux e Windows deram 1 polígono de diferença nos
    # 12 meses, com o mesmo dado. Comparando bytes, o workflow anunciaria dado novo sem haver.
    arquivos = [DESTINO, *(PASTA_DOS_PERIODOS / f"{nome}.json" for nome in PERIODOS.values())]
    if not all(arquivo.exists() for arquivo in arquivos):
        return False
    try:
        return conteudo(DESTINO.read_text(encoding="utf-8")) == conteudo(principal)
    except json.JSONDecodeError:
        return False


def gravar(caminho, texto):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    temporario = caminho.with_name(caminho.name + ".tmp")
    temporario.write_text(texto, encoding="utf-8", newline="\n")
    os.replace(temporario, caminho)
    dados = texto.encode("utf-8")
    print(f"ok: {caminho.relative_to(RAIZ).as_posix()}, {len(dados) / 1e6:.2f} MB, {len(gzip.compress(dados, 9)) / 1e6:.2f} MB com gzip")


def argumentos():
    leitor = argparse.ArgumentParser(description="Gera os alertas do DETER usados pelo mapa.")
    leitor.add_argument("--baixar", action="store_true", help=f"baixa tudo de novo do INPE e atualiza o cache em {PASTA_DO_CACHE.relative_to(RAIZ).as_posix()}/")
    leitor.add_argument("--forcar", action="store_true", help="regrava os arquivos mesmo sem alerta novo (depois de mudar este script)")
    return leitor.parse_args()


def preparar_wfs(baixar_de_novo):
    if os.environ.get("CI") == "true":
        print("CI: baixando do INPE, sem cache")
        return Wfs(None)
    if baixar_de_novo and PASTA_DO_CACHE.exists():
        for arquivo in PASTA_DO_CACHE.iterdir():
            arquivo.unlink()
    return Wfs(PASTA_DO_CACHE)


def avisar_cache(wfs):
    if not wfs.lidas_do_cache:
        return
    baixadas_em = min(arquivo.stat().st_mtime for arquivo in wfs.lidas_do_cache)
    print(
        f"cache: {len(wfs.lidas_do_cache)} respostas lidas de {PASTA_DO_CACHE.relative_to(RAIZ).as_posix()}/, "
        f"baixadas em {datetime.fromtimestamp(baixadas_em):%d/%m/%Y %H:%M}; para dado novo do INPE, rode com --baixar"
    )


def main():
    args = argumentos()
    wfs = preparar_wfs(args.baixar)
    fim = ultimo_alerta(wfs)
    inicio = inicio_do_periodo(fim, MESES)
    print(f"período: {inicio} a {fim}")

    alertas = baixar_alertas(wfs, inicio, fim)
    avisar_cache(wfs)
    conferir_eixos(alertas.geometry.to_numpy())

    alertas = ordenar(alertas)

    invalidas = int((~alertas.geometry.is_valid & alertas.geometry.notna()).sum())
    validas = corrigir_topologia(alertas.geometry.to_numpy())
    sem_poligono = pd.isna(validas)
    print(f"topologia: {invalidas} geometrias inválidas corrigidas; {int(sem_poligono.sum())} alertas sem polígono saem com geometry null e contam no resumo")
    if sem_poligono.mean() > TETO_SEM_POLIGONO:
        raise ErroDoDeter(f"{int(sem_poligono.sum())} de {len(alertas)} alertas sem polígono: a geometria deve ter quebrado na fonte")

    desenho, precisao_fina = para_desenho(validas)
    if precisao_fina.any():
        print(f"precisão: {int(precisao_fina.sum())} alertas que o arredondamento de {PRECISAO}° anulava saem com {PRECISAO_FINA}°")
    sem_desenho = pd.isna(desenho) & ~sem_poligono
    if sem_desenho.any():
        print(f"precisão: {int(sem_desenho.sum())} alertas menores que {PRECISAO_FINA}° saem com geometry null e contam no resumo")

    calculada = area_ha(validas)
    comparar_areas(alertas, calculada)
    print(f"simplificação: {vertices(validas)} vértices viram {vertices(desenho)}")

    principal = arquivo_principal(alertas, desenho, inicio, fim)
    if not args.forcar and sem_novidade(principal):
        print(f"nada novo: os {len(alertas)} alertas são os mesmos de {DESTINO.relative_to(RAIZ).as_posix()}; nada foi gravado (--forcar regrava)")
        return

    textos = {DESTINO: principal}
    for meses, nome in PERIODOS.items():
        textos[PASTA_DOS_PERIODOS / f"{nome}.json"] = arquivo_do_periodo(alertas, validas, calculada, fim, meses)
    for caminho, texto in textos.items():
        gravar(caminho, texto)
    print(f"ok: {len(alertas)} alertas, {int((~pd.isna(desenho)).sum())} com geometria")


if __name__ == "__main__":
    try:
        main()
    except ErroDoDeter as erro:
        sys.exit(f"erro: {erro}")
