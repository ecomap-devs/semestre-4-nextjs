import { FunctionsHttpError } from "@supabase/supabase-js";
import type { User } from "firebase/auth";

import { mensagemDoStatus, paraIdentificacao, type Identificacao } from "@/tipos/identificacao";

import { supabase } from "./supabase";

// Manda a foto para a Edge Function `identificar-animal`, que consulta o Gemini. É a
// mesma função que o app Flutter usa (o código dela mora no semestre-4-flutter).
//
// O site nunca fala com o Gemini direto: a chave só vive no servidor. Daqui vai
// apenas o ID token do Firebase, que a função confere — a publishable key do Supabase
// é pública e sozinha não pode bastar para gastar a cota.

/** Falha com a mensagem já pronta para a tela. */
export class ErroIdentificacao extends Error {}

/** 1024 px basta para reconhecer o animal e mantém o envio pequeno em rede móvel. */
const LADO_MAXIMO = 1024;

/**
 * Reduz a foto e devolve o JPEG em base64.
 *
 * Reencodar no canvas também apaga os metadados EXIF, inclusive a localização GPS
 * que a câmera do celular grava: ela não tem por que sair do aparelho.
 */
async function reduzir(arquivo: File): Promise<string> {
  let imagem: ImageBitmap;
  try {
    imagem = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  } catch {
    // HEIC do iPhone, por exemplo, só abre no Safari.
    throw new ErroIdentificacao("Não foi possível abrir esta imagem. Tente uma foto em JPG ou PNG.");
  }

  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);
  canvas.getContext("2d")?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  imagem.close();

  const jpeg = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.8));
  if (!jpeg) throw new ErroIdentificacao("Não foi possível preparar a foto. Tente outra.");

  const dataUrl = await new Promise<string>((ok, falha) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(String(leitor.result));
    leitor.onerror = () => falha(leitor.error);
    leitor.readAsDataURL(jpeg);
  });
  // "data:image/jpeg;base64,AAAA..." -> só o que vem depois da vírgula.
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

export async function identificar(arquivo: File, usuario: User): Promise<Identificacao> {
  const imagem = await reduzir(arquivo);
  const token = await usuario.getIdToken();

  const { data, error } = await supabase().functions.invoke("identificar-animal", {
    body: { imagem },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    // A tela mostra uma mensagem amigável; o console guarda o erro real, com o
    // status e o corpo, para dar para diagnosticar. Erro de rede chega sem resposta.
    const status = error instanceof FunctionsHttpError ? (error.context as Response).status : 0;
    const corpo = error instanceof FunctionsHttpError ? await (error.context as Response).text().catch(() => "") : "";
    console.error("Identificação falhou:", status, corpo, error);
    throw new ErroIdentificacao(mensagemDoStatus(status));
  }

  const resultado = paraIdentificacao(data);
  if (!resultado) {
    console.error("Identificação: resposta fora do formato", data);
    throw new ErroIdentificacao("Resposta inesperada do servidor. Tente de novo.");
  }
  return resultado;
}
