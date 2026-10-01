"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

const RESERVA = "/sem-foto.svg";

/**
 * `<img>` que cai num desenho neutro se a imagem não carregar. As fotos vêm de fora
 * (Supabase e sites de terceiros), e um ícone de imagem quebrada no meio do card era
 * o que aparecia quando a fonte saía do ar.
 *
 * `<img>` e não `next/image`: na exportação estática não há otimizador de imagem.
 */
export function ImagemComReserva({ src, alt, ...resto }: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [falhou, setFalhou] = useState(false);

  // O HTML vem pronto do build, então a imagem pode falhar antes de o React se ligar
  // à página — e aí o onError nunca dispara. Confere na montagem.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFalhou(true);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...resto}
      ref={ref}
      src={falhou ? RESERVA : src}
      alt={alt}
      loading={resto.loading ?? "lazy"}
      onError={() => setFalhou(true)}
    />
  );
}
