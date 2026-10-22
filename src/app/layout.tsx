import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

import { ProvedorAuth } from "@/componentes/autenticacao/ProvedorAuth";

// O next/font baixa as fontes no build e as serve do próprio site: nenhum pedido vai
// ao Google, e a CSP (font-src 'self') não muda.
const fonteTitulo = Fraunces({ subsets: ["latin"], variable: "--fonte-titulo", display: "swap" });
const fonteTexto = Source_Sans_3({ subsets: ["latin"], variable: "--fonte-texto", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "EcoMapBrasil",
    template: "%s · EcoMapBrasil",
  },
  description: "Desmatamento e fauna ameaçada nos biomas brasileiros, em mapa, gráfico e ficha de espécie.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#2f5233",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteTexto.variable}`}>
      <body>
        <ProvedorAuth>{children}</ProvedorAuth>
      </body>
    </html>
  );
}
