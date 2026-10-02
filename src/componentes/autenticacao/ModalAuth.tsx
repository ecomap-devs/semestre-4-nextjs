"use client";

import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

import { Dialogo } from "@/componentes/comum/Dialogo";
import { caminhoDoAvatar, fotoConfiavel, prepararAvatar } from "@/lib/avatar";
import { auth, db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

type Modo = "login" | "cadastro";

const MAX_NOME = 200; // o mesmo limite das Firestore Rules

// Porte do mapa `msgs` do AuthModal.jsx, com os códigos que o Flutter também traduz.
const MENSAGENS: Record<string, string> = {
  "auth/email-already-in-use": "Este email já está em uso.",
  "auth/invalid-email": "Email inválido.",
  "auth/weak-password": "Senha deve ter ao menos 6 caracteres.",
  "auth/invalid-credential": "Email ou senha incorretos.",
  "auth/wrong-password": "Email ou senha incorretos.",
  "auth/user-not-found": "Email ou senha incorretos.",
  "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um momento.",
};

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof FirebaseError) return MENSAGENS[erro.code] ?? "Algo deu errado. Tente de novo.";
  if (erro instanceof Error && erro.message.startsWith("Configuração")) return erro.message;
  return "Algo deu errado. Tente de novo.";
}

/**
 * Sobe o avatar e devolve a URL pública, ou "" se falhar. Falha na foto não derruba
 * o cadastro: perder a conta por causa da foto seria pior que ficar sem foto.
 *
 * O arquivo é reencodado para WebP antes de subir, e o caminho é `<uid>/<uuid>.webp`:
 * imprevisível, e o bucket não deixa sobrescrever (revisão de 01/10/2026 — antes o
 * caminho era `<uid>.<extensão do arquivo>`, com qualquer tipo e tamanho).
 */
async function enviarAvatar(uid: string, foto: File): Promise<string> {
  try {
    const imagem = await prepararAvatar(foto);
    const caminho = caminhoDoAvatar(uid);
    const bucket = supabase().storage.from("avatars");
    const { error } = await bucket.upload(caminho, imagem, { contentType: "image/webp", upsert: false });
    if (error) return "";
    return fotoConfiavel(bucket.getPublicUrl(caminho).data.publicUrl);
  } catch {
    return "";
  }
}

/**
 * O que vem depois de criar a conta: avatar, nome e perfil. Pode ser chamada de novo
 * se falhar no meio — cada passo confere o que já foi feito.
 */
async function concluirPerfil(usuario: User, nome: string, foto: File | null) {
  let photoURL = fotoConfiavel(usuario.photoURL);
  if (foto && !photoURL) photoURL = await enviarAvatar(usuario.uid, foto);
  const nomeFinal = nome.trim().slice(0, MAX_NOME);
  await updateProfile(usuario, { displayName: nomeFinal, photoURL: photoURL || null });
  await usuario.reload();
  // O e-mail NÃO entra aqui: ele já vive no Firebase Auth, e só o dono lê este
  // documento. A versão React gravava o e-mail.
  const perfil = doc(db(), "usuarios", usuario.uid);
  if ((await getDoc(perfil)).exists()) {
    await updateDoc(perfil, { nome: nomeFinal, photoURL });
  } else {
    await setDoc(perfil, { nome: nomeFinal, photoURL, criadoEm: serverTimestamp() });
  }
}

export default function ModalAuth({ aoFechar }: { aoFechar: () => void }) {
  const [modo, setModo] = useState<Modo>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  // Conta criada cujo perfil não terminou de salvar. Antes, a falha aparecia como
  // falha do cadastro inteiro, e tentar de novo dava "email já está em uso".
  const [pendente, setPendente] = useState<User | null>(null);
  const inputFoto = useRef<HTMLInputElement>(null);
  const id = useId();

  // A URL de prévia segura a imagem na memória até ser revogada.
  useEffect(() => {
    if (!previa) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }
    if (arquivo.size > 15 * 1024 * 1024) {
      setErro("Foto grande demais (máximo de 15 MB).");
      return;
    }
    setErro("");
    setFoto(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!pendente && (!email.trim() || !senha.trim())) {
      setErro("Preencha email e senha.");
      return;
    }
    if (modo === "cadastro" && !nome.trim()) {
      setErro("Preencha seu nome.");
      return;
    }
    setCarregando(true);
    try {
      if (pendente) {
        await concluirPerfil(pendente, nome, foto);
      } else if (modo === "cadastro") {
        const cred = await createUserWithEmailAndPassword(auth(), email.trim(), senha);
        try {
          await concluirPerfil(cred.user, nome, foto);
        } catch (falha) {
          console.error(falha);
          setPendente(cred.user);
          setErro('Sua conta foi criada, mas o perfil não terminou de salvar. Clique em "Concluir cadastro" para tentar de novo.');
          return;
        }
      } else {
        await signInWithEmailAndPassword(auth(), email.trim(), senha);
      }
      aoFechar();
    } catch (falha) {
      // A tela mostra a mensagem amigável; o console guarda o erro real. Sem isto,
      // todo código fora de MENSAGENS virava "Algo deu errado" sem deixar pista.
      console.error("Login/cadastro falhou:", falha);
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }

  const textoBotao = carregando ? "Aguarde..." : pendente ? "Concluir cadastro" : modo === "login" ? "Entrar" : "Criar conta";

  return (
    <Dialogo
      aoFechar={aoFechar}
      idTitulo={`${id}-titulo`}
      estiloFundo={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      estiloCaixa={{ background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 420, position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.25)", maxHeight: "calc(100dvh - 32px)", overflowY: "auto" }}
    >
      <style>{`
        .campo-auth:focus-visible { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.25); }
        .rotulo-auth { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; }
      `}</style>
      <form onSubmit={enviar} noValidate>
        <button type="button" onClick={aoFechar} aria-label="Fechar" style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>
          ✕
        </button>

        <h2 id={`${id}-titulo`} style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 6 }}>
          {modo === "login" ? "Entrar na conta" : "Criar conta"}
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>{modo === "login" ? "Acesse para deixar sua avaliação." : "Cadastre-se para participar da comunidade."}</p>

        {erro && (
          <div role="alert" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
            {erro}
          </div>
        )}

        {modo === "cadastro" && (
          <>
            <label className="rotulo-auth" htmlFor={`${id}-nome`}>
              Nome
            </label>
            <input
              id={`${id}-nome`}
              className="campo-auth"
              type="text"
              placeholder="Nome completo"
              autoComplete="name"
              maxLength={MAX_NOME}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={estiloCampo}
              data-foco-inicial
            />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => inputFoto.current?.click()}
                aria-label={previa ? "Trocar foto de perfil" : "Escolher foto de perfil"}
                disabled={Boolean(pendente && fotoConfiavel(pendente.photoURL))}
                style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "2px dashed #16a34a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", marginBottom: 8, padding: 0 }}
              >
                {previa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previa} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="fas fa-camera" aria-hidden="true" style={{ fontSize: 24, color: "#16a34a" }} />
                )}
              </button>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Foto de perfil (opcional)</span>
              <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" onChange={escolherFoto} style={{ display: "none" }} />
            </div>
          </>
        )}

        {!pendente && (
          <>
            <label className="rotulo-auth" htmlFor={`${id}-email`}>
              Email
            </label>
            <input
              id={`${id}-email`}
              className="campo-auth"
              type="email"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={estiloCampo}
              {...(modo === "login" ? { "data-foco-inicial": true } : {})}
            />
            <label className="rotulo-auth" htmlFor={`${id}-senha`}>
              Senha
            </label>
            <input
              id={`${id}-senha`}
              className="campo-auth"
              type="password"
              placeholder={modo === "cadastro" ? "Ao menos 6 caracteres" : "Sua senha"}
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={estiloCampo}
            />
          </>
        )}

        <button
          type="submit"
          disabled={carregando}
          style={{ width: "100%", padding: "12px", background: carregando ? "#86efac" : "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: carregando ? "not-allowed" : "pointer", marginBottom: 12, transition: "background 0.2s" }}
        >
          {textoBotao}
        </button>

        {!pendente && (
          <button
            type="button"
            onClick={() => {
              setModo(modo === "login" ? "cadastro" : "login");
              setErro("");
            }}
            style={{ width: "100%", background: "none", border: "none", color: "#15803d", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
          >
            {modo === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </button>
        )}
      </form>
    </Dialogo>
  );
}

const estiloCampo: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #d1d5db",
  borderRadius: 10,
  fontSize: 14,
  marginBottom: 12,
  // O contorno padrão sai, mas o foco ganha borda verde e halo (.campo-auth).
  outline: "none",
  display: "block",
  boxSizing: "border-box",
  // O React usava #fff aqui: o texto digitado sumia no fundo branco do campo.
  color: "#111",
  background: "#fff",
};
