"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useApareceu, useLarguraElemento } from "@/componentes/comum/ganchos";
import { areaPorBioma, linhaDoTempo } from "@/dados/inicio";

// Os quatro gráficos da Home.jsx, em SVG e CSS escritos à mão, como no original.

const MAXIMO = Math.max(...areaPorBioma.map((b) => b.valor));
const estiloTitulo = { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#ffffff", textTransform: "uppercase" } as const;

export function BarrasAnimadas() {
  const [ref, apareceu] = useApareceu<HTMLDivElement>(0.3);
  return (
    <div ref={ref} style={{ background: "#1a1f2e", borderRadius: 12, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      {areaPorBioma.map((b, i) => {
        const pct = Math.round((b.valor / MAXIMO) * 100);
        const rotuloDentro = pct > 20;
        return (
          <div key={b.nome} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 110, fontSize: 12, fontWeight: 600, color: "#ffffff", flexShrink: 0 }}>{b.nome}</div>
            <div style={{ flex: 1, height: 36, background: "#0f1117", borderRadius: 6, overflow: "visible", display: "flex", alignItems: "center" }}>
              <div
                style={{
                  height: 36,
                  borderRadius: 6,
                  backgroundColor: b.cor,
                  width: apareceu ? `${pct}%` : "0%",
                  transition: `width 900ms cubic-bezier(.2,.8,.2,1) ${i * 140}ms`,
                  flexShrink: 0,
                }}
              />
              {apareceu && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: rotuloDentro ? "#fff" : b.cor,
                    marginLeft: rotuloDentro ? -(String(b.valor).length * 7 + 28) : 6,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {b.valor} mil
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
        <div style={{ width: 110, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#ffffff", fontWeight: 600 }}>
          {[0, 0.25, 0.5, 0.75].map((f) => (
            <span key={f}>{Math.round(MAXIMO * f)}</span>
          ))}
          <span>{MAXIMO} mil km²</span>
        </div>
      </div>
    </div>
  );
}

export function Rosca() {
  const [ref, apareceu] = useApareceu<HTMLDivElement>(0.2);
  const total = areaPorBioma.reduce((s, b) => s + b.valor, 0);
  let inicio = 0;
  const fatias = areaPorBioma.map((b) => {
    const pct = (b.valor / total) * 100;
    const fatia = `${b.cor} ${inicio}% ${inicio + pct}%`;
    inicio += pct;
    return fatia;
  });
  return (
    <div ref={ref} style={{ marginTop: 24 }}>
      <p style={{ ...estiloTitulo, marginBottom: 16 }}>Distribuição por Bioma</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <div
          role="img"
          aria-label={`Distribuição por bioma: ${areaPorBioma.map((b) => `${b.nome} ${Math.round((b.valor / total) * 100)}%`).join(", ")}`}
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: apareceu ? `conic-gradient(${fatias.join(",")})` : "#1a1f2e",
            transition: "background 1s ease",
            mask: "radial-gradient(circle, transparent 55px, black 56px)",
            WebkitMask: "radial-gradient(circle, transparent 55px, black 56px)",
            flexShrink: 0,
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", width: "100%" }}>
          {areaPorBioma.map((b) => (
            <div key={b.nome} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: b.cor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#ffffff" }}>{b.nome}</span>
              <span style={{ fontSize: 11, color: "#ffffff", fontWeight: 600, marginLeft: "auto" }}>{Math.round((b.valor / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GraficoLinha() {
  const [refLargura, largura] = useLarguraElemento<HTMLDivElement>();
  const [refVisivel, apareceu] = useApareceu<HTMLDivElement>(0.2);
  const margem = { esquerda: 36, direita: 8, topo: 16, base: 52 };
  const altura = 240;
  const w = largura ?? 600;
  const plotW = Math.max(100, w - margem.esquerda - margem.direita);
  const plotH = altura - margem.topo - margem.base;
  const pontos = areaPorBioma.map((b, i) => ({
    ...b,
    x: margem.esquerda + (i / (areaPorBioma.length - 1)) * plotW,
    y: margem.topo + (1 - b.valor / MAXIMO) * plotH,
  }));
  const caminho = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <div ref={refVisivel} style={{ marginTop: 24 }}>
      <p style={{ ...estiloTitulo, marginBottom: 12 }}>Comparativo (mil km²)</p>
      <div ref={refLargura}>
        {largura !== null && (
          <svg viewBox={`0 0 ${w} ${altura}`} style={{ width: "100%", height: altura }} preserveAspectRatio="xMinYMin meet" role="img" aria-label="Comparativo de área desmatada por bioma">
            {[0, 1, 2, 3, 4].map((i) => {
              const y = margem.topo + (i / 4) * plotH;
              return (
                <g key={i}>
                  <line x1={margem.esquerda} x2={margem.esquerda + plotW} y1={y} y2={y} stroke="rgba(211, 205, 205, 0.23)" strokeWidth="1" />
                  <text x={margem.esquerda - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#ffffff">
                    {Math.round(MAXIMO * (1 - i / 4))}
                  </text>
                </g>
              );
            })}
            <path d={caminho} fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: apareceu ? 1 : 0, transition: "opacity 600ms ease" }} />
            {pontos.map((p, i) => (
              <g key={p.nome} style={{ opacity: apareceu ? 1 : 0, transition: `opacity 0.4s ease ${i * 0.08}s` }}>
                <circle cx={p.x} cy={p.y} r={5} fill={p.cor} stroke="#0f1117" strokeWidth="2" />
                <text x={p.x} y={margem.topo + plotH + 28} textAnchor="middle" fontSize="10" fill="#ffffff">
                  {p.nome.split(" ")[0]}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}

export function Radar() {
  const [refLargura, largura] = useLarguraElemento<HTMLDivElement>();
  const [refVisivel, apareceu] = useApareceu<HTMLDivElement>(0.2);
  const tamanho = Math.min(largura ?? 300, 300);
  const n = areaPorBioma.length;
  const niveis = 4;
  const c = tamanho / 2;
  const raio = tamanho / 2 - 40;
  const angulo = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const ponto = (i: number, r: number) => ({ x: c + Math.cos(angulo(i)) * r, y: c + Math.sin(angulo(i)) * r });
  const grades = Array.from({ length: niveis }, (_, l) =>
    Array.from({ length: n }, (_, i) => ponto(i, raio * ((l + 1) / niveis)))
      .map((p) => `${p.x},${p.y}`)
      .join(" "),
  );
  const area = areaPorBioma.map((b, i) => ponto(i, raio * (b.valor / MAXIMO)));
  const caminho = area.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  return (
    <div ref={refVisivel} style={{ marginTop: 24 }}>
      <p style={{ ...estiloTitulo, marginBottom: 12 }}>Radar Comparativo</p>
      <div ref={refLargura} style={{ display: "flex", justifyContent: "center" }}>
        {largura !== null && (
          <svg viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ width: tamanho, height: tamanho }} role="img" aria-label="Radar comparativo de área desmatada por bioma">
            {grades.map((pts, i) => (
              <polygon key={i} points={pts} fill={i % 2 === 0 ? "rgba(74,222,128,0.04)" : "rgba(74,222,128,0.02)"} stroke="rgba(74,222,128,0.15)" strokeWidth="1" />
            ))}
            {areaPorBioma.map((b, i) => {
              const externo = ponto(i, raio);
              const rotulo = ponto(i, raio + 16);
              const dx = Math.cos(angulo(i));
              const ancora = Math.abs(dx) < 0.2 ? "middle" : dx > 0 ? "start" : "end";
              return (
                <g key={b.nome}>
                  <line x1={c} y1={c} x2={externo.x} y2={externo.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  <text x={rotulo.x} y={rotulo.y + 4} textAnchor={ancora} fontSize="10" fill="#ffffff">
                    {b.nome.split(" ")[0]}
                  </text>
                </g>
              );
            })}
            <path d={caminho} fill="rgba(74,222,128,0.15)" stroke="#4ade80" strokeWidth="2" style={{ opacity: apareceu ? 1 : 0, transition: "opacity 900ms ease" }} />
            {area.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill={areaPorBioma[i]?.cor} stroke="#0f1117" strokeWidth="2" style={{ opacity: apareceu ? 1 : 0, transition: `opacity 0.4s ease ${i * 0.1}s` }} />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}

export function LinhaDoTempo() {
  const [visiveis, setVisiveis] = useState(0);
  const [conector, setConector] = useState({ d: "", largura: 0, altura: 0 });
  const [linhaVisivel, setLinhaVisivel] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const pontos = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const elemento = container.current;
    if (!elemento) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          linhaDoTempo.forEach((_, i) => timers.push(setTimeout(() => setVisiveis((v) => Math.max(v, i + 1)), i * 80)));
          observador.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    observador.observe(elemento);
    return () => {
      observador.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  // A curva liga o centro de cada ponto; recalculada quando o tamanho muda.
  const montarConector = useCallback(() => {
    const elemento = container.current;
    if (!elemento) return;
    const marcadores = pontos.current.filter((p): p is HTMLDivElement => p !== null);
    if (marcadores.length < 2) return;
    const caixa = elemento.getBoundingClientRect();
    const centros = marcadores.map((m) => {
      const r = m.getBoundingClientRect();
      return { x: r.left + r.width / 2 - caixa.left, y: r.top + r.height / 2 - caixa.top };
    });
    let d = "";
    centros.forEach((p, i) => {
      if (i === 0) d += `M ${p.x} ${p.y}`;
      else {
        const anterior = centros[i - 1]!;
        const meioY = (anterior.y + p.y) / 2;
        d += ` C ${anterior.x} ${meioY} ${p.x} ${meioY} ${p.x} ${p.y}`;
      }
    });
    setConector({ d, largura: elemento.scrollWidth, altura: elemento.scrollHeight });
    setTimeout(() => setLinhaVisivel(true), 100);
  }, []);

  useEffect(() => {
    if (visiveis < linhaDoTempo.length) return;
    const t = setTimeout(montarConector, 200);
    return () => clearTimeout(t);
  }, [visiveis, montarConector]);

  useEffect(() => {
    const elemento = container.current;
    if (!elemento) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const observador = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(montarConector, 120);
    });
    observador.observe(elemento);
    return () => {
      observador.disconnect();
      clearTimeout(t);
    };
  }, [montarConector]);

  return (
    <div ref={container} style={{ position: "relative" }}>
      {conector.d && (
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${conector.largura} ${conector.altura}`}
          preserveAspectRatio="none"
          style={{ position: "absolute", left: 0, top: 0, width: "100%", height: conector.altura, pointerEvents: "none", zIndex: 1 }}
        >
          <path d={conector.d} fill="none" stroke="rgba(74,222,128,0.12)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "blur(6px)", opacity: linhaVisivel ? 0.9 : 0, transition: "opacity 700ms ease" }} />
          <path d={conector.d} fill="none" stroke="rgba(74,222,128,0.35)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: linhaVisivel ? 1 : 0, transition: "opacity 600ms ease 80ms" }} />
        </svg>
      )}
      {linhaDoTempo.map((item, i) => {
        const aEsquerda = i % 2 === 0;
        const mostrar = visiveis > i;
        const texto = (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", marginBottom: 2 }}>{item.ano}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6" }}>{item.titulo}</div>
            <div style={{ fontSize: 11, color: "#ffffff", marginTop: 2 }}>{item.texto}</div>
          </>
        );
        return (
          <div key={item.ano} style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: 20, minHeight: 70, zIndex: 2 }}>
            <div style={{ flex: 1, paddingRight: 20, textAlign: "right", opacity: mostrar ? 1 : 0, transform: mostrar ? "translateX(0)" : "translateX(-20px)", transition: `opacity 400ms ease ${i * 80}ms, transform 400ms ease ${i * 80}ms` }}>
              {aEsquerda && texto}
            </div>
            <div
              ref={(el) => {
                pontos.current[i] = el;
              }}
              style={{ width: 16, height: 16, borderRadius: "50%", background: "#16a34a", border: "2px solid #0f1117", boxShadow: "0 0 0 2px #4ade80", flexShrink: 0, zIndex: 3, opacity: mostrar ? 1 : 0, transform: mostrar ? "scale(1)" : "scale(0)", transition: `opacity 300ms ease ${i * 80}ms, transform 300ms ease ${i * 80}ms` }}
            />
            <div style={{ flex: 1, paddingLeft: 20, textAlign: "left", opacity: mostrar ? 1 : 0, transform: mostrar ? "translateX(0)" : "translateX(20px)", transition: `opacity 400ms ease ${i * 80}ms, transform 400ms ease ${i * 80}ms` }}>
              {!aEsquerda && texto}
            </div>
          </div>
        );
      })}
    </div>
  );
}
