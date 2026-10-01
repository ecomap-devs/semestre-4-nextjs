import type { NextConfig } from "next";

// Exportação estática: `next build` gera HTML/CSS/JS em `out/`, servido pelo Firebase
// Hosting no plano gratuito. Não há servidor, então ficam de fora route handlers,
// proxy, server actions, ISR e o otimizador do `next/image`.
//
// Redirects, rewrites e headers NÃO funcionam aqui: vão para o `firebase.json`.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
