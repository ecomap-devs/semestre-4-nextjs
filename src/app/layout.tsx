import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

import { ProvedorAuth } from "@/componentes/autenticacao/ProvedorAuth";
import { SCRIPT_DO_TEMA } from "@/lib/tema";

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
  // Ícones e imagem de compartilhamento são arquivos em src/app/ (scripts/identidade/gerar.py).
  metadataBase: new URL("https://ecomapbrasil.web.app"),
  openGraph: { type: "website", siteName: "EcoMapBrasil", locale: "pt_BR" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#2f5233",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o script do tema põe `data-tema` no <html> antes de o React
    // hidratar, e o HTML estático não tem o atributo.
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteTexto.variable}`} suppressHydrationWarning>
      <head>
        {/* O tema escolhido no botão, aplicado antes da primeira pintura (src/lib/tema.ts). */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body>
        <ProvedorAuth>{children}</ProvedorAuth>
      </body>
    </html>
  );
}
