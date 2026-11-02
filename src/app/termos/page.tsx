import type { Metadata } from "next";

import { PaginaLegal } from "@/componentes/legal/PaginaLegal";
import { termos } from "@/dados/legal";

export const metadata: Metadata = {
  title: termos.titulo,
  description: termos.descricao,
};

export default function Pagina() {
  return <PaginaLegal documento={termos} outro={{ href: "/privacidade", rotulo: "Política de privacidade" }} />;
}
