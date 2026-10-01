import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mapa" };

// Placeholder até o porte da Mapa.jsx. O Leaflet toca `window` no import, então o
// mapa entra como Client Component carregado com `dynamic(() => import(...), { ssr: false })`
// a partir de um componente 'use client' — senão o build quebra com `window is not defined`.
export default function Mapa() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="opacity-80">O mapa entra aqui.</p>
    </main>
  );
}
