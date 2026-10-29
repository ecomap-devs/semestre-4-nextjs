import type { Metadata } from "next";

import { Quiz } from "@/componentes/quiz/Quiz";

export const metadata: Metadata = {
  title: "Quiz",
  description: "Perguntas sobre o desmatamento nos biomas, as espécies ameaçadas e como denunciar, com as respostas tiradas dos dados do INPE e do MMA.",
};

export default function Pagina() {
  return <Quiz />;
}
