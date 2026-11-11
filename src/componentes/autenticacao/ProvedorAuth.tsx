"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { firebaseConfigurado } from "@/lib/env";
import { auth } from "@/lib/firebase";

// Os modais só são baixados quando alguém pede, como o LazyAuthModal do React.
const ModalAuth = dynamic(() => import("./ModalAuth"), { ssr: false });
const ModalApagarConta = dynamic(() => import("./ModalApagarConta"), { ssr: false });

type EstadoAuth = {
  /** `undefined` enquanto o Firebase ainda não respondeu; `null` sem login. */
  usuario: User | null | undefined;
  abrirLogin: () => void;
  sair: () => Promise<void>;
  /** Abre a confirmação de apagar a conta de quem está logado. */
  abrirApagarConta: () => void;
};

const ContextoAuth = createContext<EstadoAuth | null>(null);

export function ProvedorAuth({ children }: { children: React.ReactNode }) {
  // Sem credenciais o site continua de pé, só sem login: começa em `null` em vez de
  // esperar para sempre por uma resposta que não vem.
  const [usuario, setUsuario] = useState<User | null | undefined>(() => (firebaseConfigurado() ? undefined : null));
  const [loginAberto, setLoginAberto] = useState(false);
  // A conta é guardada ao abrir: quando ela é apagada, `usuario` vira `null`, e o
  // modal continua na tela para dizer que deu certo.
  const [contaParaApagar, setContaParaApagar] = useState<User | null>(null);

  useEffect(() => {
    if (!firebaseConfigurado()) {
      console.error("Firebase sem credenciais: confira o .env.local (modelo em .env.example).");
      return;
    }
    return onAuthStateChanged(auth(), (u) => setUsuario(u ?? null));
  }, []);

  const abrirLogin = useCallback(() => setLoginAberto(true), []);
  const sair = useCallback(() => signOut(auth()), []);
  const abrirApagarConta = useCallback(() => setContaParaApagar(auth().currentUser), []);

  const valor = useMemo(() => ({ usuario, abrirLogin, sair, abrirApagarConta }), [usuario, abrirLogin, sair, abrirApagarConta]);

  return (
    <ContextoAuth.Provider value={valor}>
      {children}
      {loginAberto && <ModalAuth aoFechar={() => setLoginAberto(false)} />}
      {contaParaApagar && <ModalApagarConta usuario={contaParaApagar} aoFechar={() => setContaParaApagar(null)} />}
    </ContextoAuth.Provider>
  );
}

export function useAuth(): EstadoAuth {
  const contexto = useContext(ContextoAuth);
  if (!contexto) throw new Error("useAuth precisa estar dentro de <ProvedorAuth>");
  return contexto;
}
