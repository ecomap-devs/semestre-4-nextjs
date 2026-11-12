"use client";

import { useEffect, useId, useRef, useState } from "react";

import { useTema } from "@/componentes/comum/ganchos";
import { escolherTema, type Tema } from "@/lib/tema";

const OPCOES: { tema: Tema; icone: string; rotulo: string }[] = [
  { tema: "sistema", icone: "fa-circle-half-stroke", rotulo: "Seguir o sistema" },
  { tema: "claro", icone: "fa-sun", rotulo: "Claro" },
  { tema: "escuro", icone: "fa-moon", rotulo: "Escuro" },
];

/**
 * O botão de tema dos cabeçalhos: seguir o sistema, claro ou escuro, como o da barra do
 * app. O ícone mostra a escolha atual, e a lista marca a ativa.
 *
 * Mesmo padrão do menu da conta na Início: um botão que mostra e esconde a lista (não um
 * `role="menu"`, que pediria setas), que fecha com Esc, com clique fora e ao escolher.
 * As cores vêm de `.botao-tema` e `.lista-tema`, no globals.css.
 */
export function BotaoDeTema() {
  const tema = useTema();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (e: PointerEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAberto(false);
      botao.current?.focus();
    };
    document.addEventListener("pointerdown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const atual = OPCOES.find((o) => o.tema === tema) ?? OPCOES[0];
  return (
    <div ref={caixa} style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={botao}
        type="button"
        className="botao-tema"
        aria-expanded={aberto}
        aria-controls={`${id}-tema`}
        aria-label={`Tema: ${atual.rotulo}`}
        title={`Tema: ${atual.rotulo}`}
        onClick={() => setAberto((v) => !v)}
      >
        <i className={`fas ${atual.icone}`} aria-hidden="true" />
      </button>
      {aberto && (
        <div id={`${id}-tema`} className="lista-tema">
          {OPCOES.map((o) => (
            <button
              key={o.tema}
              type="button"
              className="item-tema"
              aria-pressed={o.tema === tema}
              onClick={() => {
                escolherTema(o.tema);
                setAberto(false);
                botao.current?.focus();
              }}
            >
              <i className={`fas ${o.icone}`} aria-hidden="true" style={{ width: 16, textAlign: "center" }} />
              <span style={{ flex: 1 }}>{o.rotulo}</span>
              {o.tema === tema && <i className="fas fa-check" aria-hidden="true" style={{ color: "var(--mata)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
