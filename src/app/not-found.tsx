import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center", background: "#f0fdf4" }}>
      <i className="fas fa-map-signs" style={{ fontSize: 40, color: "#16a34a" }} />
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111" }}>Página não encontrada</h1>
      <p style={{ color: "#4b5563" }}>O endereço que você abriu não existe no EcoMapBrasil.</p>
      <Link href="/" style={{ background: "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 28px", fontWeight: 700, textDecoration: "none" }}>
        Voltar ao início
      </Link>
    </main>
  );
}
