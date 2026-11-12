import Link from "next/link";

import { BotaoDeTema } from "@/componentes/comum/BotaoDeTema";

/** Altura do cabeçalho em CSS (64px, ou 56px no celular); as telas usam para grudar o que fica embaixo dele. */
export const alturaCabecalhoInterno = "var(--altura-cabecalho-interno)";

// Cabeçalho de Animais, Fotos e Mapa. Antes cada tela tinha a própria cópia da faixa
// verde com "Voltar" e um selo com ícone repetindo o nome da página.
// No Mapa o nome no cabeçalho é o <h1> (`tituloDaPagina`) e o conteúdo vai de ponta a
// ponta (`larguraTotal`), como o mapa embaixo dele; nas outras a página já tem o <h1>
// dela, e aqui o nome é só um rótulo.
//
// Celular e desktop se resolvem no CSS (`.cabecalho-interno` no globals.css), não em
// JS: o HTML estático já sai certo para as duas larguras. `tituloCurto`, quando há,
// aparece no lugar de `titulo` abaixo de 1024px.
export function CabecalhoInterno({
  titulo,
  tituloCurto,
  extra,
  tituloDaPagina = false,
  larguraTotal = false,
}: {
  titulo: string;
  tituloCurto?: string;
  extra?: React.ReactNode;
  tituloDaPagina?: boolean;
  larguraTotal?: boolean;
}) {
  const Titulo = tituloDaPagina ? "h1" : "p";
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 1200, background: "var(--papel)", borderBottom: "1px solid var(--linha)", flexShrink: 0 }}>
      <div className="cabecalho-interno" style={{ maxWidth: larguraTotal ? "none" : 1120, margin: "0 auto", display: "flex", alignItems: "center" }}>
        {/* O grupo pediu o "Voltar" de volta: só o logo como link não deixava claro como sair. */}
        <Link href="/" className="botao botao-contorno voltar" aria-label="Voltar ao início" style={{ minHeight: 40, fontSize: 15, flexShrink: 0 }}>
          <i className="fas fa-arrow-left" aria-hidden="true" style={{ fontSize: 13 }} />
          <span className="so-desktop">Voltar</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pino.png" alt="" style={{ height: 28, width: "auto" }} />
          <span className="so-desktop" style={{ fontFamily: "var(--fonte-titulo)", fontSize: 19, color: "var(--tinta)" }}>
            EcoMapBrasil
          </span>
        </div>
        <span aria-hidden="true" style={{ width: 1, height: 20, background: "var(--linha)", flexShrink: 0 }} />
        <Titulo className="titulo-interno" style={{ margin: 0, fontFamily: "var(--fonte-titulo)", fontWeight: 500, color: "var(--tinta)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tituloCurto ? (
            <>
              <span className="titulo-longo">{titulo}</span>
              <span className="titulo-curto">{tituloCurto}</span>
            </>
          ) : (
            titulo
          )}
        </Titulo>
        {extra}
        <BotaoDeTema />
      </div>
    </header>
  );
}
