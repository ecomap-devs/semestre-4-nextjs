# Gera os ícones do site e a imagem que aparece quando alguém compartilha o link:
#
# - src/app/favicon.ico, icon.png e apple-icon.png: o pino de public/logo.png, sem o nome,
#   que ficaria ilegível nesses tamanhos;
# - public/pino.png: só o pino, para os cabeçalhos e o rodapé. O nome já está em texto ao
#   lado, e o da logo, preto, sumia no tema escuro e no rodapé verde-escuro;
# - src/app/opengraph-image.png: os alertas do DETER de public/alertas/12-meses.json sobre
#   os biomas do IBGE (src/dados/biomasContornos.ts). Não traz número, para não envelhecer.
#
# As fontes são as do site. O site as recebe do next/font, então os arquivos vêm do app:
#
#   pip install pillow
#   python scripts/identidade/gerar.py <pasta assets/fonts do semestre-4-flutter>

import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
APP = RAIZ / "src" / "app"

PAPEL = "#f6f3ec"
MATA_NOITE = "#16291a"
BIOMA = "#21392a"
CONTORNO = "#4d6655"
ALERTA = "#ff7a35"
BRANCO = "#fffdf8"
SUAVE = "#c4ccc0"

LARGURA, ALTURA = 1200, 630

# O pino dos cabeçalhos tem até 32 px de altura; 4x cobre as telas de densidade alta.
# É o mesmo arquivo que o tool/icone/gerar.py do app grava em assets/img/pino.png.
ALTURA_PINO = 120
AMPLIACAO = 3


def pino():
    logo = Image.open(RAIZ / "public" / "logo.png").convert("RGBA")
    # O nome começa depois da primeira linha sem nada visível abaixo do pino. A sombra da
    # logo deixa pixels quase transparentes entre os dois, que não contam como visíveis.
    alfa = logo.getchannel("A").point(lambda a: 255 if a > 16 else 0)
    corte = next(y for y in range(1, logo.height) if alfa.crop((0, y, logo.width, y + 1)).getbbox() is None)
    recorte = logo.crop((0, 0, logo.width, corte))
    return recorte.crop(alfa.crop((0, 0, logo.width, corte)).getbbox())


def no_quadrado(figura, lado, fracao, fundo=(0, 0, 0, 0)):
    altura = round(lado * fracao)
    largura = round(figura.width * altura / figura.height)
    menor = figura.resize((largura, altura), Image.LANCZOS)
    quadro = Image.new("RGBA", (lado, lado), fundo)
    quadro.alpha_composite(menor, ((lado - largura) // 2, (lado - altura) // 2))
    return quadro


def biomas():
    texto = (RAIZ / "src" / "dados" / "biomasContornos.ts").read_text(encoding="utf-8")
    corpo = texto[texto.index("= {") + 2 : texto.rindex("}") + 1]
    corpo = re.sub(r"^\s*//.*$", "", corpo, flags=re.M)
    corpo = re.sub(r",(\s*[\]}])", r"\1", corpo)
    return [poligono for partes in json.loads(corpo).values() for poligono in partes]


def alertas():
    arquivo = json.loads((RAIZ / "public" / "alertas" / "12-meses.json").read_text(encoding="utf-8"))
    return [poligono for f in arquivo["features"] for poligono in f["geometry"]["coordinates"]]


def desenhar_mapa(tela, fontes_de_poligonos, caixa):
    x0, y0, lado = caixa
    oeste, norte, escala = -74.2, 5.5, lado / 39.5

    def ponto(par):
        return ((x0 + (par[0] - oeste) * escala) * AMPLIACAO, (y0 + (norte - par[1]) * escala) * AMPLIACAO)

    lapis = ImageDraw.Draw(tela)
    contornos, pontos = fontes_de_poligonos
    for poligono in contornos:
        lapis.polygon([ponto(p) for p in poligono[0]], fill=BIOMA, outline=CONTORNO, width=AMPLIACAO)
    for poligono in pontos:
        anel = [ponto(p) for p in poligono[0]]
        # O traço engrossa o alerta pequeno: a imagem costuma aparecer em miniatura.
        lapis.polygon(anel, fill=ALERTA, outline=ALERTA, width=2)


def compartilhamento(fontes, marca):
    tela = Image.new("RGBA", (LARGURA * AMPLIACAO, ALTURA * AMPLIACAO), MATA_NOITE)
    desenhar_mapa(tela, (biomas(), alertas()), (596, 22, 586))
    tela = tela.resize((LARGURA, ALTURA), Image.LANCZOS)

    lapis = ImageDraw.Draw(tela)
    titulo = ImageFont.truetype(fontes / "Fraunces-Medium.ttf", 76)
    texto = ImageFont.truetype(fontes / "SourceSans3-Regular.ttf", 34)
    apoio = ImageFont.truetype(fontes / "SourceSans3-Regular.ttf", 25)

    icone = marca.resize((round(marca.width * 92 / marca.height), 92), Image.LANCZOS)
    tela.alpha_composite(icone, (64, 150))
    lapis.text((64, 262), "EcoMapBrasil", font=titulo, fill=BRANCO)
    lapis.text((64, 362), "Desmatamento e fauna ameaçada", font=texto, fill=BRANCO)
    lapis.text((64, 404), "nos biomas brasileiros", font=texto, fill=BRANCO)
    lapis.text((64, 476), "Dados do INPE, IBGE, MMA e IUCN", font=apoio, fill=SUAVE)
    return tela.convert("RGB")


def main():
    if len(sys.argv) != 2:
        sys.exit("uso: python scripts/identidade/gerar.py <pasta assets/fonts do semestre-4-flutter>")
    fontes = Path(sys.argv[1])
    marca = pino()

    no_quadrado(marca, 256, 0.96).save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    no_quadrado(marca, 192, 0.94).save(APP / "icon.png", optimize=True)
    no_quadrado(marca, 180, 0.76, PAPEL).convert("RGB").save(APP / "apple-icon.png", optimize=True)
    compartilhamento(fontes, marca).save(APP / "opengraph-image.png", optimize=True)
    salvar_pino(marca)
    print("ok: favicon.ico, icon.png, apple-icon.png e opengraph-image.png em src/app/, e public/pino.png")


def salvar_pino(marca):
    largura = round(marca.width * ALTURA_PINO / marca.height)
    marca.resize((largura, ALTURA_PINO), Image.LANCZOS).save(RAIZ / "public" / "pino.png", optimize=True)


if __name__ == "__main__":
    main()
