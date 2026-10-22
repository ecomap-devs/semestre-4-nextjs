import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 36, margin: 0 }}>Página não encontrada</h1>
      <p>O endereço que você abriu não existe no EcoMapBrasil.</p>
      <Link href="/" className="botao botao-cheio">
        Voltar ao início
      </Link>
    </main>
  );
}
