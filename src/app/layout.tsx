import type { Metadata, Viewport } from "next";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

import { ProvedorAuth } from "@/componentes/autenticacao/ProvedorAuth";

export const metadata: Metadata = {
  title: {
    default: "EcoMapBrasil",
    template: "%s · EcoMapBrasil",
  },
  description: "Desmatamento e fauna ameaçada nos biomas brasileiros, em mapa, gráfico e ficha de espécie.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#15803d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>
        <ProvedorAuth>{children}</ProvedorAuth>
      </body>
    </html>
  );
}
