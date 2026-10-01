import type { DocumentData } from "firebase/firestore";

import { fotoConfiavel } from "@/lib/avatar";

/** Avaliação publicada por um usuário logado, na coleção `avaliacoes`. */
export type Avaliacao = {
  id: string;
  uid: string;
  nome: string;
  photoURL: string;
  nota: 1 | 2 | 3 | 4 | 5;
  comentario: string;
  criadoEm: Date;
};

/**
 * Converte um documento do Firestore em `Avaliacao`, ou devolve `null` se ele não
 * tiver o formato esperado.
 *
 * O tipo acima NÃO valida o que chega do banco: ele só vale depois desta função. Até
 * 01/10/2026 as rules não validavam o `update`, e um documento pode ter ficado com
 * `nota: "5"` ou `99`. Um documento ruim é descartado aqui, em vez de derrubar a
 * lista inteira. A foto só vale se vier do bucket de avatares.
 */
export function paraAvaliacao(id: string, d: DocumentData): Avaliacao | null {
  const nota = d.nota;
  if (typeof nota !== "number" || !Number.isInteger(nota) || nota < 1 || nota > 5) return null;
  if (typeof d.uid !== "string" || typeof d.comentario !== "string") return null;

  const criadoEm =
    d.criadoEm && typeof d.criadoEm.toDate === "function" ? (d.criadoEm.toDate() as Date) : new Date();

  return {
    id,
    uid: d.uid,
    nome: typeof d.nome === "string" && d.nome ? d.nome : "Usuário",
    photoURL: fotoConfiavel(d.photoURL),
    nota: nota as Avaliacao["nota"],
    comentario: d.comentario,
    criadoEm,
  };
}
