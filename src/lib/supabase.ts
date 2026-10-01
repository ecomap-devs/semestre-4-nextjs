import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { configSupabase } from "./env";

// Usado só para o Storage: fotos das espécies e avatares. Criado no primeiro uso,
// pelo mesmo motivo do firebase.ts.

let cliente: SupabaseClient | undefined;

export function supabase(): SupabaseClient {
  if (!cliente) {
    const { url, publishableKey } = configSupabase();
    cliente = createClient(url, publishableKey);
  }
  return cliente;
}
