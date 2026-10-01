import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

import { configFirebase } from "./env";

// Inicialização preguiçosa: nada roda no import. Na exportação estática os Server
// Components executam no build, e um `initializeApp` no topo do módulo exigiria as
// credenciais para compilar. Use só em Client Components ('use client').

export function appFirebase(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(configFirebase());
}

export const auth = (): Auth => getAuth(appFirebase());
export const db = (): Firestore => getFirestore(appFirebase());
