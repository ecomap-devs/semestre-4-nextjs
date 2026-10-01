import type { Metadata } from "next";

import { Mapa } from "@/componentes/mapa/Mapa";

export const metadata: Metadata = {
  title: "Mapa",
  description: "Mapa interativo dos seis biomas brasileiros com os alertas de desmatamento do DETER-B (INPE).",
};

export default function Pagina() {
  return <Mapa />;
}
