"use client";

import { useApareceu } from "@/componentes/comum/ganchos";
import { areaPorBioma, comparacaoRegional, linhaDoTempo } from "@/dados/inicio";

// Gráficos da Home, em HTML e CSS escritos à mão. O React mostrava a mesma série
// (área por bioma) em quatro gráficos: barras, rosca, linha e radar. Ficaram só as
// barras, que são as que se leem melhor; a linha ligava categorias que não têm ordem.

const MAXIMO = Math.max(...areaPorBioma.map((b) => b.valor));

export function BarrasAnimadas() {
  const [ref, apareceu] = useApareceu<HTMLDivElement>(0.3);
  return (
    <div ref={ref} role="list" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {areaPorBioma.map((b, i) => (
        <div key={b.nome} role="listitem" aria-label={`${b.nome}: ${b.valor} mil km²`}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 4 }}>
            <span style={{ color: "var(--tinta)" }}>{b.nome}</span>
            <span style={{ color: "var(--tinta-3)", fontVariantNumeric: "tabular-nums" }}>{b.valor} mil km²</span>
          </div>
          <div style={{ height: 10, background: "var(--papel-2)", borderRadius: 2 }}>
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                // A maior barra em terra; as outras em mata, para o olho ir à que pesa mais.
                background: i === 0 ? "var(--terra)" : "var(--mata)",
                width: apareceu ? `${(b.valor / MAXIMO) * 100}%` : "0%",
                transition: `width 700ms ease ${i * 80}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComparacaoRegional() {
  return (
    <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px 32px" }}>
      {comparacaoRegional.map((r) => (
        <div key={r.rotulo} style={{ borderTop: "1px solid var(--linha)", paddingTop: 12, display: "flex", flexDirection: "column-reverse", justifyContent: "flex-end" }}>
          <dt style={{ fontSize: 14, color: "var(--tinta-3)", marginTop: 4 }}>{r.rotulo}</dt>
          <dd style={{ fontFamily: "var(--fonte-titulo)", fontSize: 32, color: "var(--tinta)", lineHeight: 1.1 }}>{r.pct}%</dd>
        </div>
      ))}
    </dl>
  );
}

export function LinhaDoTempo() {
  return (
    <ol style={{ listStyle: "none", borderLeft: "1px solid var(--linha)", marginLeft: 6 }}>
      {linhaDoTempo.map((item) => (
        <li key={item.ano} style={{ position: "relative", padding: "0 0 22px 24px" }}>
          <span aria-hidden="true" style={{ position: "absolute", left: -5, top: 7, width: 9, height: 9, borderRadius: "50%", background: "var(--papel)", border: "2px solid var(--mata)" }} />
          <div style={{ fontSize: 14, color: "var(--tinta-3)", fontVariantNumeric: "tabular-nums" }}>{item.ano}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--tinta)" }}>{item.titulo}</div>
          <div style={{ fontSize: 15, color: "var(--tinta-2)" }}>{item.texto}</div>
        </li>
      ))}
    </ol>
  );
}
