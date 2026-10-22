import { biomas, type Anel } from "@/dados/biomas";

// Os seis biomas desenhados em SVG com o mesmo contorno do IBGE do mapa interativo.
// É só ilustração: não carrega o Leaflet nem o GeoJSON dos alertas na Home.

// Projeção equirretangular com a longitude encolhida pelo cosseno da latitude média
// do Brasil (~15° S), para o país não sair achatado.
const ESCALA_X = Math.cos((15 * Math.PI) / 180);

const pontos = biomas.flatMap((b) => b.poligonos.flat(2));
const minX = Math.min(...pontos.map(([lon]) => lon * ESCALA_X));
const maxX = Math.max(...pontos.map(([lon]) => lon * ESCALA_X));
const minY = Math.min(...pontos.map(([, lat]) => -lat));
const maxY = Math.max(...pontos.map(([, lat]) => -lat));

const anelParaCaminho = (anel: Anel) =>
  anel.map(([lon, lat], i) => `${i === 0 ? "M" : "L"}${(lon * ESCALA_X - minX).toFixed(2)},${(-lat - minY).toFixed(2)}`).join("") + "Z";

const desenhos = biomas.map((b) => ({ ...b, d: b.poligonos.flatMap((p) => p.map(anelParaCaminho)).join("") }));

export function MapaBiomas() {
  return (
    <figure style={{ margin: "0 auto", width: "100%", maxWidth: 440 }}>
      <svg viewBox={`-0.5 -0.5 ${maxX - minX + 1} ${maxY - minY + 1}`} role="img" aria-label="Mapa dos seis biomas brasileiros" style={{ width: "100%", height: "auto", display: "block" }}>
        {desenhos.map((b) => (
          // evenodd deixa os buracos (massas d'água) vazados.
          <path key={b.chave} d={b.d} fill={b.cor} fillRule="evenodd" strokeWidth={0.12} strokeLinejoin="round" style={{ stroke: "var(--papel)" }}>
            <title>{b.nome}</title>
          </path>
        ))}
      </svg>
      <figcaption style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 16, fontSize: 14, color: "var(--tinta-2)" }}>
        {biomas.map((b) => (
          <span key={b.chave} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: b.cor }} />
            {b.nome}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
