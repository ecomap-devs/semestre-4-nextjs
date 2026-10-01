"use client";

import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { auth, db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

type Modo = "login" | "cadastro";

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
 * Sobe o avatar para o Supabase e devolve a URL pública, ou "" se falhar. Falha na
 * foto não derruba o cadastro: a conta já existe neste ponto, e perdê-la por causa da
 * foto seria pior que ficar sem foto.
 */
async function enviarAvatar(uid: string, foto: File): Promise<string> {
  try {
    const extensao = foto.name.includes(".") ? foto.name.split(".").pop() : "png";
    const caminho = `${uid}.${extensao}`;
    const bucket = supabase().storage.from("avatars");
    const { error } = await bucket.upload(caminho, foto, { upsert: true });
    if (error) return "";
    return bucket.getPublicUrl(caminho).data.publicUrl;
  } catch {
    return "";
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
  const inputFoto = useRef<HTMLInputElement>(null);

  // Esc fecha, e a página de trás não rola enquanto o modal está aberto.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aoFechar]);

  // A URL de prévia segura a imagem na memória até ser revogada.
  useEffect(() => {
    if (!previa) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setFoto(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha.trim()) {
      setErro("Preencha email e senha.");
      return;
    }
    if (modo === "cadastro" && !nome.trim()) {
      setErro("Preencha seu nome.");
      return;
    }
    setCarregando(true);
    try {
      if (modo === "cadastro") {
        const cred = await createUserWithEmailAndPassword(auth(), email.trim(), senha);
        const photoURL = foto ? await enviarAvatar(cred.user.uid, foto) : "";
        await updateProfile(cred.user, { displayName: nome.trim(), photoURL: photoURL || null });
        await cred.user.reload();
        // O e-mail NÃO entra aqui: ele já vive no Firebase Auth, e só o dono lê este
        // documento. A versão React gravava o e-mail, e as rules aceitariam.
        await setDoc(doc(db(), "usuarios", cred.user.uid), {
          nome: nome.trim(),
          photoURL,
          criadoEm: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth(), email.trim(), senha);
      }
      aoFechar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-auth"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <form
        onSubmit={enviar}
        style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 420, position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
      >
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}
        >
          ✕
        </button>

        <h2 id="titulo-auth" style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 6 }}>
          {modo === "login" ? "Entrar na conta" : "Criar conta"}
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
          {modo === "login" ? "Acesse para deixar sua avaliação." : "Cadastre-se para participar da comunidade."}
        </p>

        {erro && (
          <div role="alert" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
            {erro}
          </div>
        )}

        {modo === "cadastro" && (
          <>
            <input type="text" placeholder="Nome completo" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} style={estiloCampo} />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => inputFoto.current?.click()}
                aria-label="Escolher foto de perfil"
                style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "2px dashed #16a34a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", marginBottom: 8, padding: 0 }}
              >
                {previa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previa} alt="Prévia da foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="fas fa-camera" style={{ fontSize: 24, color: "#16a34a" }} />
                )}
              </button>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Foto de perfil (opcional)</span>
              <input ref={inputFoto} type="file" accept="image/*" onChange={escolherFoto} style={{ display: "none" }} />
            </div>
          </>
        )}

        <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={estiloCampo} />
        <input
          type="password"
          placeholder="Senha"
          autoComplete={modo === "login" ? "current-password" : "new-password"}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={estiloCampo}
        />

        <button
          type="submit"
          disabled={carregando}
          style={{ width: "100%", padding: "12px", background: carregando ? "#86efac" : "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: carregando ? "not-allowed" : "pointer", marginBottom: 12, transition: "background 0.2s" }}
        >
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
        </button>

        <button
          type="button"
          onClick={() => {
            setModo(modo === "login" ? "cadastro" : "login");
            setErro("");
          }}
          style={{ width: "100%", background: "none", border: "none", color: "#16a34a", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
        >
          {modo === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}

const estiloCampo: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 10,
  fontSize: 14,
  marginBottom: 12,
  outline: "none",
  display: "block",
  boxSizing: "border-box",
  // O React usava #fff aqui: o texto digitado sumia no fundo branco do campo.
  color: "#111",
  background: "#fff",
};
