import type { Metadata } from "next";

import { Animais } from "@/componentes/animais/Animais";

export const metadata: Metadata = {
  title: "Animais",
  description: "Fauna dos seis biomas brasileiros, ameaçada ou não: status de conservação no Brasil e no mundo e principais ameaças.",
};

export default function Pagina() {
  return <Animais />;
}
