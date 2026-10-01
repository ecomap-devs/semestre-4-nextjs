import type { Metadata } from "next";

import { Animais } from "@/componentes/animais/Animais";

export const metadata: Metadata = {
  title: "Animais",
  description: "Espécies brasileiras ameaçadas pelo desmatamento: status de conservação, tendência populacional e principais ameaças.",
};

export default function Pagina() {
  return <Animais />;
}
