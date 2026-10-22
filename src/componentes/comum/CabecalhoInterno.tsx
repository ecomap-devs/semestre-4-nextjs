import Link from "next/link";

/** Altura do cabeçalho; as telas usam para posicionar o que fica grudado embaixo dele. */
export const alturaCabecalhoInterno = (ehMobile: boolean) => (ehMobile ? 56 : 64);

// Cabeçalho de Animais, Fotos e Mapa. Antes cada tela tinha a própria cópia da faixa
// verde com "Voltar" e um selo com ícone repetindo o nome da página.
// No Mapa o nome no cabeçalho é o <h1> (`tituloDaPagina`) e o conteúdo vai de ponta a
// ponta (`larguraTotal`), como o mapa embaixo dele; nas outras a página já tem o <h1>
// dela, e aqui o nome é só um rótulo.
export function CabecalhoInterno({
  titulo,
  ehMobile,
  extra,
  tituloDaPagina = false,
  larguraTotal = false,
}: {
  titulo: string;
  ehMobile: boolean;
  extra?: React.ReactNode;
  tituloDaPagina?: boolean;
  larguraTotal?: boolean;
}) {
  const Titulo = tituloDaPagina ? "h1" : "p";
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 1200, background: "var(--papel)", borderBottom: "1px solid var(--linha)", flexShrink: 0 }}>
      <div style={{ maxWidth: larguraTotal ? "none" : 1120, margin: "0 auto", padding: ehMobile ? "0 16px" : "0 24px", height: alturaCabecalhoInterno(ehMobile), display: "flex", alignItems: "center", gap: ehMobile ? 12 : 16 }}>
        {/* O grupo pediu o "Voltar" de volta: só o logo como link não deixava claro como sair. */}
        <Link href="/" className="botao botao-contorno" aria-label="Voltar ao início" style={{ padding: ehMobile ? "0 12px" : "0 14px", minHeight: 40, fontSize: 15, flexShrink: 0 }}>
          <i className="fas fa-arrow-left" aria-hidden="true" style={{ fontSize: 13 }} />
          {!ehMobile && "Voltar"}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" style={{ height: 30, width: "auto" }} />
          {!ehMobile && <span style={{ fontFamily: "var(--fonte-titulo)", fontSize: 19, color: "var(--tinta)" }}>EcoMapBrasil</span>}
        </div>
        <span aria-hidden="true" style={{ width: 1, height: 20, background: "var(--linha)", flexShrink: 0 }} />
        <Titulo style={{ margin: 0, fontFamily: "var(--fonte-titulo)", fontWeight: 500, color: "var(--tinta)", fontSize: ehMobile ? 17 : 19, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titulo}</Titulo>
        {extra}
      </div>
    </header>
  );
}
