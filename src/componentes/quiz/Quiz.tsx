"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CabecalhoInterno } from "@/componentes/comum/CabecalhoInterno";
import { useLarguraJanela } from "@/componentes/comum/ganchos";
import { perguntas, TAMANHO_RODADA, type Pergunta } from "@/dados/quiz";

// O quiz. As perguntas e as respostas saem dos dados do site (`dados/quiz.ts`); aqui
// só se sorteia a rodada e se conta o placar. Nada é gravado: o placar some ao sair.

type Rodada = { pergunta: Pergunta; opcoes: string[] }[];

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

/**
 * Uma pergunta de cada grupo, em ordem sorteada, antes de repetir grupo: só há uma
 * pergunta de denúncia e dezenas de espécies, e sem isso a rodada sairia quase toda
 * de espécies.
 */
function sortearRodada(): Rodada {
  const grupos = new Map<string, Pergunta[]>();
  for (const p of embaralhar(perguntas)) grupos.set(p.grupo, [...(grupos.get(p.grupo) ?? []), p]);
  const filas = embaralhar([...grupos.values()]);
  const escolhidas: Pergunta[] = [];
  while (escolhidas.length < TAMANHO_RODADA && filas.some((f) => f.length > 0)) {
    for (const fila of filas) {
      const p = fila.shift();
      if (p && escolhidas.length < TAMANHO_RODADA) escolhidas.push(p);
    }
  }
  return escolhidas.map((pergunta) => ({ pergunta, opcoes: embaralhar(pergunta.opcoes) }));
}

function mensagemFinal(acertos: number, total: number): string {
  if (acertos === total) return "Acertou tudo. Que tal mostrar o mapa para mais alguém?";
  if (acertos >= total * 0.75) return "Muito bem. Os dados por trás de cada resposta estão no site.";
  if (acertos >= total * 0.5) return "Nada mal. Vale dar uma olhada no mapa e nas espécies.";
  return "O desmatamento é maior do que parece. O mapa e o catálogo contam o resto.";
}

export function Quiz() {
  const largura = useLarguraJanela();
  const ehMobile = largura < 768;

  // A rodada só é sorteada no clique: sortear na renderização daria um HTML no build
  // e outro no navegador.
  const [rodada, setRodada] = useState<Rodada | null>(null);
  const [atual, setAtual] = useState(0);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [acertos, setAcertos] = useState(0);
  const proxima = useRef<HTMLButtonElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  const item = rodada?.[atual];
  const total = rodada?.length ?? 0;
  const acabou = rodada !== null && atual >= total;

  // Respondeu: o foco vai para "Próxima", que é o que se faz em seguida. Pergunta nova:
  // o foco volta ao enunciado, para o leitor de tela ler a pergunta.
  useEffect(() => {
    if (escolha !== null) proxima.current?.focus();
  }, [escolha]);
  useEffect(() => {
    if (rodada) titulo.current?.focus();
  }, [atual, rodada]);

  function comecar() {
    setRodada(sortearRodada());
    setAtual(0);
    setEscolha(null);
    setAcertos(0);
  }

  function responder(opcao: string) {
    if (!item || escolha !== null) return;
    setEscolha(opcao);
    if (opcao === item.pergunta.opcoes[0]) setAcertos((a) => a + 1);
  }

  function avancar() {
    setEscolha(null);
    setAtual((a) => a + 1);
  }

  const caixa = { maxWidth: 720, margin: "0 auto", padding: ehMobile ? "32px 16px 64px" : "56px 24px 96px" } as const;

  return (
    <div style={{ background: "var(--papel)", minHeight: "100vh" }}>
      <style>{`
        .opcao-quiz { transition: border-color 0.15s, background 0.15s; }
        .opcao-quiz:not(:disabled):hover { border-color: var(--tinta-3) !important; background: var(--branco) !important; }
      `}</style>

      <CabecalhoInterno titulo="Quiz" ehMobile={ehMobile} />

      <main style={caixa}>
        {rodada === null && (
          <>
            <h1 style={{ fontSize: ehMobile ? 36 : 56, letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 16 }}>Quanto você sabe sobre o desmatamento no Brasil?</h1>
            <p style={{ fontSize: 19, color: "var(--tinta-2)", marginBottom: 12 }}>
              {TAMANHO_RODADA} perguntas sobre os biomas, as espécies ameaçadas e como denunciar. Cada resposta vem dos mesmos dados do site: PRODES e DETER do INPE, lista nacional do MMA e IUCN.
            </p>
            <p style={{ fontSize: 16, color: "var(--tinta-3)", marginBottom: 32 }}>Cada rodada sorteia perguntas diferentes.</p>
            <button type="button" className="botao botao-cheio botao-grande" onClick={comecar}>
              Começar
            </button>
          </>
        )}

        {item && (
          <>
            <p style={{ fontSize: 15, color: "var(--tinta-3)", marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
              Pergunta {atual + 1} de {total} · {acertos} {acertos === 1 ? "acerto" : "acertos"}
            </p>
            <div aria-hidden="true" style={{ height: 4, background: "var(--papel-2)", borderRadius: 2, marginBottom: 28 }}>
              <div style={{ height: "100%", width: `${(atual / total) * 100}%`, background: "var(--mata)", borderRadius: 2, transition: "width 300ms ease" }} />
            </div>

            <h1 ref={titulo} tabIndex={-1} style={{ fontSize: ehMobile ? 26 : 34, lineHeight: 1.2, marginBottom: 24, outline: "none" }}>
              {item.pergunta.enunciado}
            </h1>

            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {item.opcoes.map((opcao) => {
                const certa = opcao === item.pergunta.opcoes[0];
                const escolhida = opcao === escolha;
                const respondeu = escolha !== null;
                // Depois de responder: a certa em verde, a errada escolhida em terra. O
                // texto ao lado diz o mesmo, para não depender só da cor.
                const borda = respondeu && certa ? "var(--mata)" : respondeu && escolhida ? "var(--terra)" : "var(--linha)";
                return (
                  <li key={opcao}>
                    <button
                      type="button"
                      className="opcao-quiz"
                      onClick={() => responder(opcao)}
                      disabled={respondeu}
                      aria-pressed={escolhida}
                      style={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 16px", minHeight: 52, borderRadius: "var(--raio)", border: `2px solid ${borda}`, background: respondeu && certa ? "var(--papel-2)" : "transparent", color: "var(--tinta)", fontSize: 17, cursor: respondeu ? "default" : "pointer", opacity: respondeu && !certa && !escolhida ? 0.6 : 1 }}
                    >
                      <span>{opcao}</span>
                      {respondeu && certa && <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mata)", whiteSpace: "nowrap" }}>✓ Resposta certa</span>}
                      {respondeu && escolhida && !certa && <span style={{ fontSize: 14, fontWeight: 600, color: "var(--terra)", whiteSpace: "nowrap" }}>Sua resposta</span>}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div aria-live="polite">
              {escolha !== null && (
                <div style={{ borderTop: "1px solid var(--linha)", paddingTop: 20 }}>
                  <p style={{ fontSize: 18, fontWeight: 600, color: escolha === item.pergunta.opcoes[0] ? "var(--mata)" : "var(--terra)", marginBottom: 6 }}>
                    {escolha === item.pergunta.opcoes[0] ? "Acertou." : `Não. A resposta é ${item.pergunta.opcoes[0]}.`}
                  </p>
                  <p style={{ fontSize: 16, color: "var(--tinta-2)", marginBottom: 6 }}>{item.pergunta.explicacao}</p>
                  <p style={{ fontSize: 14, color: "var(--tinta-3)", marginBottom: 24 }}>
                    Fonte:{" "}
                    <a href={item.pergunta.fonte.link} target="_blank" rel="noopener noreferrer" className="link">
                      {item.pergunta.fonte.rotulo}
                    </a>
                  </p>
                  <button ref={proxima} type="button" className="botao botao-cheio botao-grande" onClick={avancar}>
                    {atual + 1 < total ? "Próxima pergunta" : "Ver o resultado"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {acabou && (
          <>
            <h1 ref={titulo} tabIndex={-1} style={{ fontSize: ehMobile ? 36 : 56, letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 12, outline: "none" }}>
              {acertos} de {total}
            </h1>
            <p style={{ fontSize: 19, color: "var(--tinta-2)", marginBottom: 32 }}>{mensagemFinal(acertos, total)}</p>
            <p style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button type="button" className="botao botao-cheio botao-grande" onClick={comecar}>
                Jogar de novo
              </button>
              <Link href="/mapa" className="botao botao-contorno botao-grande">
                Abrir o mapa
              </Link>
              <Link href="/animais" className="botao botao-contorno botao-grande">
                Ver as espécies
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
