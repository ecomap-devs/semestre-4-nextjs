// Apagar a conta (11/11/2026), na mesma ordem do app Flutter
// (`AuthService.apagarConta`, com os testes da ordem e das mensagens).
//
// Até aqui não havia botão: a política de privacidade mandava pedir à equipe por
// uma issue.

import { FirebaseError } from "firebase/app";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, type User } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore";

import { db } from "./firebase";
import { supabase } from "./supabase";

/**
 * As etapas, na ordem em que rodam. A senha vem primeiro porque o Firebase só apaga o
 * usuário com login recente, e a função `apagar-conta` exige o mesmo. O servidor (foto
 * de perfil e linhas de limite, no Supabase) vem antes do Firebase porque precisa do ID
 * token, que some com a conta. A conta no Auth sai por último: enquanto ela existe, dá
 * para entrar e tentar de novo.
 */
export type EtapaDoApagamento = "senha" | "servidor" | "avaliacoes" | "perfil" | "conta";

/** Apagar a conta parou em `etapa`. O que veio antes já foi apagado. */
export class ApagamentoIncompleto extends Error {
  constructor(
    readonly etapa: EtapaDoApagamento,
    readonly causa: unknown,
  ) {
    super(`Apagar a conta parou na etapa ${etapa}`);
    this.name = "ApagamentoIncompleto";
  }
}

const SENHA_ERRADA = ["auth/invalid-credential", "auth/wrong-password", "auth/user-mismatch"];

/** O que a pessoa lê. Diz se algo já saiu, para ela saber que tentar de novo é seguro. */
export function mensagemDoApagamento(erro: unknown): string {
  if (!(erro instanceof ApagamentoIncompleto)) return "Algo deu errado. Tente de novo.";
  switch (erro.etapa) {
    case "senha": {
      const codigo = erro.causa instanceof FirebaseError ? erro.causa.code : "";
      if (SENHA_ERRADA.includes(codigo)) return "Senha incorreta.";
      if (codigo === "auth/too-many-requests") return "Muitas tentativas. Aguarde um momento.";
      if (codigo === "auth/network-request-failed") return "Sem conexão. Verifique sua internet.";
      return "Algo deu errado. Tente de novo.";
    }
    case "servidor":
      return "Não deu para apagar sua foto de perfil agora, e nada foi apagado. Tente de novo em alguns minutos.";
    default:
      return "A conta não terminou de ser apagada: parte dos seus dados já saiu. Tente de novo.";
  }
}

/** Roda as etapas na ordem e para na primeira que falhar. */
async function apagarEmOrdem(etapas: [EtapaDoApagamento, () => Promise<unknown>][]) {
  for (const [etapa, executar] of etapas) {
    try {
      await executar();
    } catch (causa) {
      throw new ApagamentoIncompleto(etapa, causa);
    }
  }
}

/**
 * A função `apagar-conta` (o código mora no semestre-4-flutter) apaga as fotos de
 * perfil e as linhas de `uso_avatar` e `uso_identificacao`. Ela exige login recente,
 * que a etapa da senha acabou de fazer; o token é renovado para levar a hora desse login.
 */
async function apagarNoServidor(usuario: User) {
  const token = await usuario.getIdToken(true);
  const { error } = await supabase().functions.invoke("apagar-conta", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw error;
}

/** Todas as avaliações da conta, inclusive as antigas, de antes de o id ser o uid. */
async function apagarAvaliacoes(uid: string) {
  const minhas = await getDocs(query(collection(db(), "avaliacoes"), where("uid", "==", uid)));
  if (minhas.empty) return;
  const lote = writeBatch(db());
  minhas.forEach((d) => lote.delete(d.ref));
  await lote.commit();
}

/**
 * Apaga a conta e tudo o que ela deixou: a foto de perfil e as linhas de limite no
 * Supabase, as avaliações, o perfil em `usuarios/{uid}` e, por último, o usuário no
 * Firebase Auth. Erro sai como `ApagamentoIncompleto`.
 */
export async function apagarConta(usuario: User, senha: string): Promise<void> {
  const email = usuario.email;
  if (!email) throw new ApagamentoIncompleto("senha", new Error("Conta sem e-mail"));
  await apagarEmOrdem([
    ["senha", () => reauthenticateWithCredential(usuario, EmailAuthProvider.credential(email, senha))],
    ["servidor", () => apagarNoServidor(usuario)],
    ["avaliacoes", () => apagarAvaliacoes(usuario.uid)],
    ["perfil", () => deleteDoc(doc(db(), "usuarios", usuario.uid))],
    ["conta", () => deleteUser(usuario)],
  ]);
}
