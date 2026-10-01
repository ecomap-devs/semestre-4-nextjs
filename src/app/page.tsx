import Image from "next/image";
import Link from "next/link";

// Placeholder até o porte da Home.jsx do 3º semestre.
export default function Inicio() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <Image src="/logo.png" alt="EcoMapBrasil" width={96} height={96} priority />
      <h1 className="text-4xl font-bold">EcoMapBrasil</h1>
      <p className="max-w-md opacity-80">
        Desmatamento e fauna ameaçada nos biomas brasileiros. O site está sendo portado para Next.js.
      </p>
      <nav className="flex gap-4">
        <Link className="underline" href="/mapa">
          Mapa
        </Link>
        <Link className="underline" href="/animais">
          Animais
        </Link>
      </nav>
    </main>
  );
}
