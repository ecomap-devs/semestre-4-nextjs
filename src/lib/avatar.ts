// Avatares: de onde podem vir e como são preparados antes de subir.

/** Prefixo das fotos aceitas: o bucket `avatars` do projeto no Supabase. */
export const PREFIXO_AVATARES = "https://wqvxjttidoxcblkfjoaf.supabase.co/storage/v1/object/public/avatars/";

/** O mesmo limite do bucket no Supabase. */
export const MAX_AVATAR_BYTES = 1024 * 1024;

/**
 * A foto, se vier do bucket de avatares; senão, "".
 *
 * Revisão de 01/10/2026: com URL livre, uma avaliação podia apontar a foto para um
 * servidor de terceiros, e quem abrisse a página tinha o IP registrado por lá. As
 * Firestore Rules recusam a gravação; este filtro cobre o que já estava gravado.
 */
export function fotoConfiavel(url: unknown): string {
  return typeof url === "string" && url.startsWith(PREFIXO_AVATARES) && url.length <= 300 ? url : "";
}

/**
 * Redesenha a imagem num canvas e devolve um WebP de até 512 px.
 *
 * Reencodar garante que o que sobe é imagem de verdade (um arquivo que não decodifica
 * como imagem falha aqui), deixa o arquivo pequeno e tira os metadados EXIF — que, numa
 * foto de celular, podem incluir a localização.
 */
export async function prepararAvatar(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  try {
    const lado = 512;
    const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * escala));
    canvas.height = Math.max(1, Math.round(bitmap.height * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", 0.85));
    if (!blob || blob.size > MAX_AVATAR_BYTES) throw new Error("Foto grande demais depois de reduzida");
    return blob;
  } finally {
    bitmap.close();
  }
}

/** `<uid>/<uuid>.webp`: imprevisível, e o bucket não deixa sobrescrever. */
export function caminhoDoAvatar(uid: string): string {
  return `${uid}/${crypto.randomUUID()}.webp`;
}
