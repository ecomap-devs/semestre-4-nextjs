import type { Metadata } from "next";

import { PaginaLegal } from "@/componentes/legal/PaginaLegal";
import { privacidade } from "@/dados/legal";

export const metadata: Metadata = {
  title: privacidade.titulo,
  description: privacidade.descricao,
};

export default function Pagina() {
  return <PaginaLegal documento={privacidade} outro={{ href: "/termos", rotulo: "Termos de uso" }} />;
}
