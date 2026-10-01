import type { Metadata } from "next";

export const metadata: Metadata = { title: "Animais" };

// Placeholder até o porte da Animais.jsx.
export default function Animais() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="opacity-80">O catálogo de espécies entra aqui.</p>
    </main>
  );
}
