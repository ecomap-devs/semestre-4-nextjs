"use client";

import { useEffect, useState } from "react";

import { useApareceu } from "./ganchos";

/**
 * Sobe e aparece quando entra na tela. O movimento é só CSS (`.revelar` no
 * globals.css), então "reduzir movimento" do sistema também vale aqui.
 */
export function Revelar({ children, atraso = 0, style }: { children: React.ReactNode; atraso?: number; style?: React.CSSProperties }) {
  const [ref, apareceu] = useApareceu<HTMLDivElement>(0.15);
  return (
    <div ref={ref} className={apareceu ? "revelar revelado" : "revelar"} style={{ ...style, transitionDelay: `${atraso}ms` }}>
      {children}
    </div>
  );
}

const DURACAO_CONTAGEM = 1600;

/**
 * Conta de zero até o número dentro do texto quando aparece na tela, mantendo o
 * resto: "+30%", "1,5 mi ha", "1.173". O leitor de tela recebe o valor final, num
 * texto fora da vista: `aria-label` num `<span>` sem papel é proibido pela ARIA e
 * os leitores o ignoram (revisão de 28/10/2026, conferida no Chrome e no axe).
 */
export function Contador({ valor }: { valor: string }) {
  const [ref, apareceu] = useApareceu<HTMLSpanElement>(0.5);
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    if (!apareceu) return;
    // Com "reduzir movimento", a duração zero leva direto ao valor final no 1º quadro.
    const duracao = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : DURACAO_CONTAGEM;
    const inicio = performance.now();
    let quadro = 0;
    const passo = (agora: number) => {
      const t = duracao === 0 ? 1 : Math.min(1, (agora - inicio) / duracao);
      setProgresso(1 - (1 - t) ** 3);
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [apareceu]);

  const achado = /\d[\d.,]*/.exec(valor);
  if (!achado) return <span>{valor}</span>;

  // No formato brasileiro: vírgula decimal, ponto de milhar.
  const numero = achado[0];
  const decimais = numero.includes(",") ? (numero.split(",")[1] ?? "").length : 0;
  const alvo = Number(numero.replace(/\./g, "").replace(",", "."));
  const formato = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimais, maximumFractionDigits: decimais, useGrouping: numero.includes(".") });
  const texto = valor.slice(0, achado.index) + formato.format(alvo * progresso) + valor.slice(achado.index + numero.length);

  return (
    <span ref={ref}>
      <span className="sr-only">{valor}</span>
      <span aria-hidden="true">{texto}</span>
    </span>
  );
}
