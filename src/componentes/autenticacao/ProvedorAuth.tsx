"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { firebaseConfigurado } from "@/lib/env";
import { auth } from "@/lib/firebase";

// O modal só é baixado quando alguém pede para entrar, como o LazyAuthModal do React.
const ModalAuth = dynamic(() => import("./ModalAuth"), { ssr: false });

type EstadoAuth = {
  /** `undefined` enquanto o Firebase ainda não respondeu; `null` sem login. */
  usuario: User | null | undefined;
  abrirLogin: () => void;
  sair: () => Promise<void>;
};

const ContextoAuth = createContext<EstadoAuth | null>(null);

export function ProvedorAuth({ children }: { children: React.ReactNode }) {
  // Sem credenciais o site continua de pé, só sem login: começa em `null` em vez de
  // esperar para sempre por uma resposta que não vem.
  const [usuario, setUsuario] = useState<User | null | undefined>(() => (firebaseConfigurado() ? undefined : null));
  const [loginAberto, setLoginAberto] = useState(false);

  useEffect(() => {
    if (!firebaseConfigurado()) {
      console.error("Firebase sem credenciais: confira o .env.local (modelo em .env.example).");
      return;
    }
    return onAuthStateChanged(auth(), (u) => setUsuario(u ?? null));
  }, []);

  const abrirLogin = useCallback(() => setLoginAberto(true), []);
  const sair = useCallback(() => signOut(auth()), []);

  const valor = useMemo(() => ({ usuario, abrirLogin, sair }), [usuario, abrirLogin, sair]);

  return (
    <ContextoAuth.Provider value={valor}>
      {children}
      {loginAberto && <ModalAuth aoFechar={() => setLoginAberto(false)} />}
    </ContextoAuth.Provider>
  );
}

export function useAuth(): EstadoAuth {
  const contexto = useContext(ContextoAuth);
  if (!contexto) throw new Error("useAuth precisa estar dentro de <ProvedorAuth>");
  return contexto;
}
