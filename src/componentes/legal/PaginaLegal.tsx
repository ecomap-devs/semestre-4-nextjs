"use client";

import Link from "next/link";
import { Fragment } from "react";

import { CabecalhoInterno } from "@/componentes/comum/CabecalhoInterno";
import { ATUALIZADO_EM, type Bloco, type Documento } from "@/dados/legal";

// A política de privacidade e os termos de uso. O texto vem de `dados/legal.ts`, o
// mesmo que o app copia; aqui só se desenha.

/** **negrito**, `código` e [texto](endereço), a marcação dos textos de `legal.ts`. */
const MARCACAO = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function Texto({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(MARCACAO).map((parte, i) => {
        if (parte.startsWith("**") && parte.endsWith("**")) return <strong key={i}>{parte.slice(2, -2)}</strong>;
        if (parte.startsWith("`") && parte.endsWith("`")) {
          return (
            <code key={i} style={{ fontSize: "0.92em", background: "var(--papel-2)", padding: "1px 5px", borderRadius: 4, overflowWrap: "anywhere" }}>
              {parte.slice(1, -1)}
            </code>
          );
        }
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(parte);
        if (link) {
          const [, rotulo, destino = ""] = link;
          if (destino.startsWith("#")) {
            return (
              <a key={i} href={destino} className="link">
                {rotulo}
              </a>
            );
          }
          if (destino.startsWith("/")) {
            return (
              <Link key={i} href={destino} className="link">
                {rotulo}
              </Link>
            );
          }
          return (
            <a key={i} href={destino} target="_blank" rel="noopener noreferrer" className="link">
              {rotulo}
            </a>
          );
        }
        return <Fragment key={i}>{parte}</Fragment>;
      })}
    </>
  );
}

const corpo = { fontSize: 17, lineHeight: 1.6, color: "var(--tinta-2)" } as const;

function Blocos({ blocos }: { blocos: Bloco[] }) {
  return blocos.map((b, i) => {
    if (b.tipo === "paragrafo") {
      return (
        <p key={i} style={{ ...corpo, marginBottom: 16 }}>
          <Texto texto={b.texto} />
        </p>
      );
    }
    if (b.tipo === "lista") {
      return (
        <ul key={i} style={{ ...corpo, listStyle: "disc", paddingLeft: 22, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {b.itens.map((item) => (
            <li key={item}>
              <Texto texto={item} />
            </li>
          ))}
        </ul>
      );
    }
    // A tabela rola na horizontal dentro do próprio quadro; a página não.
    return (
      <div key={i} role="region" aria-label="Tabela" tabIndex={0} style={{ overflowX: "auto", marginBottom: 20, border: "1px solid var(--linha)", borderRadius: "var(--raio)" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: b.colunas.length * 170, fontSize: 15, lineHeight: 1.5 }}>
          <thead>
            <tr>
              {b.colunas.map((c) => (
                <th key={c} scope="col" style={{ textAlign: "left", padding: "10px 12px", background: "var(--papel-2)", color: "var(--tinta)", fontWeight: 600, verticalAlign: "bottom" }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.linhas.map((linha) => (
              <tr key={linha[0]} style={{ borderTop: "1px solid var(--linha)" }}>
                {linha.map((celula, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" style={{ textAlign: "left", padding: "10px 12px", color: "var(--tinta)", fontWeight: 600, verticalAlign: "top" }}>
                      <Texto texto={celula} />
                    </th>
                  ) : (
                    <td key={j} style={{ padding: "10px 12px", color: "var(--tinta-2)", verticalAlign: "top" }}>
                      <Texto texto={celula} />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  });
}

export function PaginaLegal({ documento, outro }: { documento: Documento; outro: { href: string; rotulo: string } }) {
  return (
    <div style={{ background: "var(--papel)", minHeight: "100vh" }}>
      <CabecalhoInterno titulo={documento.titulo} />

      <main className="pagina-estreita" style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 className="titulo-pagina" style={{ ["--tamanho-titulo" as string]: "52px", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 12 }}>{documento.titulo}</h1>
        <p style={{ fontSize: 15, color: "var(--tinta-3)", marginBottom: 20 }}>Versão de {ATUALIZADO_EM}</p>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--tinta-2)", marginBottom: 32 }}>
          <Texto texto={documento.abertura} />
        </p>

        <nav aria-label="Nesta página" style={{ borderTop: "1px solid var(--linha)", borderBottom: "1px solid var(--linha)", padding: "16px 0", marginBottom: 40 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--tinta-3)", marginBottom: 8 }}>Nesta página</p>
          <ol style={{ listStyle: "decimal", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 4, fontSize: 16 }}>
            {documento.secoes.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="link">
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {documento.secoes.map((s) => (
          // A margem de rolagem desconta o cabeçalho fixo ao seguir um link #secao.
          <section key={s.id} id={s.id} aria-labelledby={`titulo-${s.id}`} style={{ marginBottom: 40, scrollMarginTop: 88 }}>
            <h2 id={`titulo-${s.id}`} className="titulo-secao" style={{ ["--tamanho-titulo" as string]: "30px", marginBottom: 14 }}>
              {s.titulo}
            </h2>
            <Blocos blocos={s.blocos} />
          </section>
        ))}

        <p style={{ display: "flex", flexWrap: "wrap", gap: 12, borderTop: "1px solid var(--linha)", paddingTop: 24 }}>
          <Link href={outro.href} className="botao botao-contorno">
            {outro.rotulo}
          </Link>
          <Link href="/" className="botao botao-contorno">
            Voltar ao início
          </Link>
        </p>
      </main>
    </div>
  );
}
