import type { DocumentData } from "firebase/firestore";

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
 * O tipo acima NÃO valida o que chega do banco: ele só vale depois desta função. As
 * rules validam a nota no `create`, mas não no `update`, então um documento pode ter
 * `nota: "5"` ou `99`. Um documento ruim é descartado aqui, em vez de derrubar a
 * lista inteira, como acontecia no `Avaliacao.doFirestore` do Flutter.
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
    photoURL: typeof d.photoURL === "string" ? d.photoURL : "",
    nota: nota as Avaliacao["nota"],
    comentario: d.comentario,
    criadoEm,
  };
}
