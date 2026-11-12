"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { assinarTema, escuroAgora, temaAtual, type Tema } from "@/lib/tema";

/** A escolha do botão de tema. No HTML estático é "sistema"; no navegador, a que está em vigor. */
export function useTema(): Tema {
  return useSyncExternalStore(assinarTema, temaAtual, () => "sistema");
}

/** Se a página está escura agora, pela escolha ou pelo sistema: para o que o CSS não pinta, como o fundo do mapa. */
export function useTemaEscuro(): boolean {
  return useSyncExternalStore(assinarTema, escuroAgora, () => false);
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
