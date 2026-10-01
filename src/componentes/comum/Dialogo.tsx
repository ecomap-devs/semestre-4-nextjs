"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  aoFechar: () => void;
  /** id do título, para o leitor de tela anunciar o diálogo pelo nome. */
  idTitulo: string;
  children: ReactNode;
  /** A camada escura por trás. */
  estiloFundo?: CSSProperties;
  classeFundo?: string;
  /** A caixa do diálogo em si. */
  estiloCaixa?: CSSProperties;
  classeCaixa?: string;
  /** Clicar fora fecha. */
  fechaNoFundo?: boolean;
};

/**
 * Diálogo modal acessível. Só é montado no navegador (depois de um clique), nunca no
 * build.
 *
 * Revisão de 01/10/2026: os modais tratavam Esc e rolagem, mas o Tab saía do
 * diálogo para os botões encobertos da página, e o leitor de tela continuava
 * enxergando o fundo. Aqui:
 * - o diálogo vai para o fim do `<body>` (portal), e o resto da página fica
 *   `inert` enquanto ele está aberto — nem foco nem leitor de tela chegam lá;
 * - o foco entra no diálogo ao abrir (no elemento com `data-foco-inicial`, ou no
 *   primeiro focável) e volta para o elemento de origem ao fechar;
 * - Tab e Shift+Tab circulam dentro dele; Esc fecha; a página de trás não rola.
 */
export function Dialogo({ aoFechar, idTitulo, children, estiloFundo, classeFundo, estiloCaixa, classeCaixa, fechaNoFundo = false }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const [destino] = useState(() => document.createElement("div"));
  const fechar = useRef(aoFechar);
  useEffect(() => {
    fechar.current = aoFechar;
  });

  useEffect(() => {
    document.body.appendChild(destino);
    const origem = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const irmaos = [...document.body.children].filter((c): c is HTMLElement => c !== destino && c instanceof HTMLElement && !c.inert);
    irmaos.forEach((c) => (c.inert = true));
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const atual = caixa.current;
    (atual?.querySelector<HTMLElement>("[data-foco-inicial]") ?? atual?.querySelector<HTMLElement>(FOCAVEIS))?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        fechar.current();
        return;
      }
      if (e.key !== "Tab" || !atual) return;
      const focaveis = [...atual.querySelectorAll<HTMLElement>(FOCAVEIS)].filter((el) => el.getClientRects().length > 0);
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0]!;
      const ultimo = focaveis[focaveis.length - 1]!;
      if (e.shiftKey && (document.activeElement === primeiro || !atual.contains(document.activeElement))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (document.activeElement === ultimo || !atual.contains(document.activeElement))) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      irmaos.forEach((c) => (c.inert = false));
      document.body.style.overflow = overflow;
      destino.remove();
      origem?.focus();
    };
  }, [destino]);

  return createPortal(
    <div className={classeFundo} style={estiloFundo} onClick={fechaNoFundo ? () => fechar.current() : undefined}>
      <div ref={caixa} role="dialog" aria-modal="true" aria-labelledby={idTitulo} className={classeCaixa} style={estiloCaixa} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    destino,
  );
}
