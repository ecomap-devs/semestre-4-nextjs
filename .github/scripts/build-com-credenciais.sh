#!/usr/bin/env bash
# Build com as credenciais de cliente, para preview e produção.
#
# Secret ausente chega como string vazia e o `next build` compila liso, porque o
# Firebase só é inicializado no navegador. Por isso a checagem de vazio vem antes de
# tudo, e no fim o script confere que o valor entrou no JavaScript gerado.
set -euo pipefail

faltando=""
for v in FIREBASE_API_KEY_WEB FIREBASE_APP_ID_WEB FIREBASE_MESSAGING_SENDER_ID \
         FIREBASE_PROJECT_ID FIREBASE_AUTH_DOMAIN FIREBASE_STORAGE_BUCKET \
         SUPABASE_URL SUPABASE_PUBLISHABLE_KEY; do
  if [ -z "${!v:-}" ]; then faltando="$faltando $v"; fi
done
if [ -n "$faltando" ]; then
  echo "::error::Secrets vazios ou ausentes no repositório:$faltando"
  exit 1
fi

export NEXT_PUBLIC_FIREBASE_API_KEY="$FIREBASE_API_KEY_WEB"
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$FIREBASE_AUTH_DOMAIN"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$FIREBASE_STORAGE_BUCKET"
export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$FIREBASE_MESSAGING_SENDER_ID"
export NEXT_PUBLIC_FIREBASE_APP_ID="$FIREBASE_APP_ID_WEB"
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY"

npm run build

# Só vale conferir depois que algum código importar o firebase.ts: enquanto as páginas
# forem placeholders, nada inclui as credenciais no bundle, e a ausência é esperada.
if grep -rlq "from \"@/lib/firebase\"\|from '@/lib/firebase'" src; then
  if ! grep -rqF "$FIREBASE_PROJECT_ID" out/_next/static; then
    echo "::error::O projectId do Firebase não está no JavaScript gerado: a credencial não chegou ao build"
    exit 1
  fi
fi
