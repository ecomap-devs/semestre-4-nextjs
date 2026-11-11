// Quem já declarou ter 18 anos ou mais para usar a identificação por foto, por conta,
// neste navegador (11/11/2026).
//
// Os termos da Gemini API (em vigor desde 23/03/2026) exigem 18 anos e não aceitam
// site de acesso provável por menores. A pergunta não prova a idade: é a trava por
// autodeclaração escolhida pelo grupo, que deixa claro a quem usa que o recurso é só
// para adultos. O app guarda a mesma resposta (`DeclaracaoDeIdade`, no semestre-4-flutter).
//
// Só o "sim" fica guardado, com a data. O "não" vale para a visita: guardá-lo deixaria
// preso para sempre quem clicou errado.

const chave = (uid: string) => `ecomap:maior-de-18:${uid}`;

/** Se a conta já disse ter 18 anos ou mais neste navegador. Sem `localStorage` (aba anônima bloqueada, por exemplo), vale `false`. */
export function declarouMaioridade(uid: string): boolean {
  try {
    return localStorage.getItem(chave(uid)) !== null;
  } catch {
    return false;
  }
}

/** Guarda o "tenho 18 anos ou mais", com a data. Se não der para guardar, a pergunta volta na próxima vez. */
export function registrarMaioridade(uid: string): void {
  try {
    localStorage.setItem(chave(uid), new Date().toISOString());
  } catch {
    // Sem armazenamento: o uso de agora segue, e a pergunta volta depois.
  }
}
