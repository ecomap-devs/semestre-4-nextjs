// Credenciais públicas de cliente, lidas do .env.local (modelo em .env.example).
//
// Cada `process.env.NEXT_PUBLIC_*` precisa aparecer escrito por extenso: o Next troca
// o texto pelo valor no build, e acesso dinâmico (`process.env[nome]`) chega vazio.
//
// Variável ausente não pode virar `undefined` calado — na versão React o build
// passava e o erro só aparecia no login. Aqui quem pede a configuração recebe um
// erro dizendo exatamente o que falta.

const firebase = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const supabase = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

type Preenchido<T> = { [K in keyof T]: string };

function exigir<T extends Record<string, string | undefined>>(grupo: string, valores: T): Preenchido<T> {
  const faltando = Object.entries(valores)
    .filter(([, valor]) => !valor)
    .map(([nome]) => nome);
  if (faltando.length > 0) {
    throw new Error(
      `Configuração do ${grupo} incompleta: faltam ${faltando.join(", ")}. ` +
        "Confira o .env.local (o modelo está em .env.example).",
    );
  }
  return valores as Preenchido<T>;
}

export const configFirebase = () => exigir("Firebase", firebase);
export const configSupabase = () => exigir("Supabase", supabase);
