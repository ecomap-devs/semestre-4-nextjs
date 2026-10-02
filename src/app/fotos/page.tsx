import type { Metadata } from "next";

import { Fotos } from "@/componentes/fotos/Fotos";

export const metadata: Metadata = {
  title: "Identificar por foto",
  description: "Tire uma foto de um animal e a inteligência artificial do Google diz que espécie é.",
};

export default function Pagina() {
  return <Fotos />;
}
