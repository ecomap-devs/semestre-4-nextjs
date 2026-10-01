"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Largura da janela. No build não há janela, então começa em `inicial` (desktop) e
 * se ajusta assim que a página monta no navegador.
 */
export function useLarguraJanela(inicial = 1280): number {
  const [largura, setLargura] = useState(inicial);
  useEffect(() => {
    const atualizar = () => setLargura(window.innerWidth);
    atualizar();
    window.addEventListener("resize", atualizar);
    return () => window.removeEventListener("resize", atualizar);
  }, []);
  return largura;
}

/** `true` a partir da primeira vez que o elemento entra na tela. Não volta a `false`. */
export function useApareceu<T extends Element>(limiar = 0.2) {
  const ref = useRef<T>(null);
  const [apareceu, setApareceu] = useState(false);
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setApareceu(true);
          observador.disconnect();
        }
      },
      { threshold: limiar },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [limiar]);
  return [ref, apareceu] as const;
}

/** Largura do elemento, medida por ResizeObserver; `null` até a primeira medida. */
export function useLarguraElemento<T extends Element>() {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState<number | null>(null);
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const observador = new ResizeObserver(([entrada]) => {
      const w = entrada?.contentRect.width ?? 0;
      if (w > 0) setLargura(w);
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);
  return [ref, largura] as const;
}
