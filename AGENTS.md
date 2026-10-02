<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — regras do EcoMapBrasil (site)

Regras para quem mexe neste repositório: os cinco do grupo e qualquer assistente de IA.
O bloco acima é do Next e é regravado pelo `next dev`; as regras do projeto começam aqui.

---

## O projeto em três linhas

O site do EcoMapBrasil, em **Next.js com TypeScript**, exportado como site estático e
publicado no **Firebase Hosting**. É o porte da versão React do 3º semestre
([semestre-3-react](https://github.com/ecomap-devs/semestre-3-react)). O app Android
mora em [semestre-4-flutter](https://github.com/ecomap-devs/semestre-4-flutter), e os
dois usam o mesmo backend: Firebase (Auth, Firestore) e Supabase (Storage).

---

## 🔴 Credenciais

**Nenhuma chave entra no código.** As credenciais vivem em `.env.local` (fora do git),
com os nomes em `.env.example`, e são lidas só em `src/lib/env.ts`.

- Tudo é `NEXT_PUBLIC_*`, então **vai para o navegador**: são chaves públicas de cliente
  por design. Quem protege o dado são as **Firestore Rules** e o **RLS do Supabase**.
- Use a chave **web** do Firebase (restrita por referenciador), nunca a do Android.
- Do Supabase, a `sb_publishable_...`. As `anon` keys legadas estão **desativadas**.
- Variável ausente não pode virar `undefined` calado: `env.ts` lança um erro dizendo o
  que falta. Não contorne com valor padrão.

## 📜 As regras do Firestore não moram aqui

O banco é um só para o site e o app, então as regras são uma só, em
[`firestore.rules` do semestre-4-flutter](https://github.com/ecomap-devs/semestre-4-flutter/blob/main/firestore.rules).
Mudou como o site lê ou grava um dado? A regra muda **lá**, num PR daquele repositório,
com caso novo nos testes de `firestore-testes/`.

O que as regras exigem hoje (01/10/2026), e o site precisa respeitar:
- **avaliação nova** tem id = uid de quem avalia, `criadoEm: serverTimestamp()` e só os
  campos `uid`, `nome`, `photoURL`, `nota`, `comentario`, `criadoEm`;
- **edição** muda só `nome`, `photoURL`, `nota`, `comentario`, com `atualizadoEm:
  serverTimestamp()`;
- **`photoURL`** vazio ou do bucket `avatars` do projeto (`fotoConfiavel()` em
  `src/lib/avatar.ts`).

---

## Antes de abrir PR

O mesmo que a CI roda:

```bash
npm run lint
npm run typecheck
npm run build      # gera out/, sem precisar de credencial
```

---

## Como escrever código aqui

### Idioma
- **Código em português**: componentes, funções, variáveis, tipos (`Avaliacao`,
  `paraAvaliacao`, `percentualDesmatado`), como no app Flutter.
- **Exceção**: o que vem de fora mantém o nome de lá (`uid`, `photoURL`, `Timestamp`,
  as chaves do GeoJSON como `AREAHA`).
- Comentários e documentação em português.

### Estrutura
```
src/
├── app/          rotas: uma pasta por página (page.tsx), layout.tsx e template.tsx na raiz
├── componentes/  uma pasta por tela (inicio, mapa, animais) + autenticacao, avaliacoes, comum
├── dados/        dados de referência herdados do React (biomas, espécies, números da Home)
├── lib/          env, firebase, supabase: a ponte com o mundo de fora
└── tipos/        tipos de domínio + a função que valida o dado que chega

public/alertas-desmatamento.json   GeoJSON do DETER-B, o mesmo arquivo do app Flutter
```

As páginas em `app/` são finas: só metadados e o componente da tela. A tela mora em
`componentes/` e é `'use client'`.

### O que a exportação estática proíbe
Não há servidor. Não use route handlers, `proxy.ts`, server actions, `cookies()`, ISR,
nem rota dinâmica sem `generateStaticParams`. Redirects e headers vão no
`firebase.json`, não no `next.config.ts`.

### Firebase e Supabase só no navegador
`src/lib/firebase.ts` e `src/lib/supabase.ts` são preguiçosos de propósito: Server
Components rodam no **build**, e inicializar ali exigiria credencial para compilar.
Importe-os só em componentes `'use client'`.

### Tipo não valida dado do banco
O TypeScript confere o código, não o que chega do Firestore. Até 01/10/2026 as rules não
validavam o `update`, e documentos antigos podem ter `nota: "5"`. Todo documento
passa por uma função como `paraAvaliacao()` (`src/tipos/avaliacao.ts`), que devolve
`null` para o que não tem o formato certo. **Um documento ruim é pulado, não derruba a
lista.** Nada de `as Avaliacao` direto no `doc.data()`.

### Leaflet
O Leaflet toca `window` no import. O mapa entra como Client Component carregado com
`dynamic(() => import(...), { ssr: false })` a partir de um componente `'use client'`,
senão o build quebra com `window is not defined`.

---

## Checklist do porte

O porte foi feito em 01/10/2026, e cada item abaixo está cumprido. Ficam aqui como regra
para o código que vier depois. O README tem a lista completa do que mudou.

O React do 3º semestre tem defeitos que o Flutter já corrigiu. **Não porte o defeito:**

- **E-mail fora do Firestore.** O `AuthModal.jsx` gravava `email` em `usuarios/{uid}`.
  Desde 09/09/2026 o e-mail vive só no Firebase Auth, e `usuarios/{uid}` só o dono lê.
- **`MultiPolygon` no GeoJSON.** O parser do Flutter descartava 25% da área desmatada
  por ler só `Polygon`. O `L.geoJSON` do Leaflet lê os dois, mas qualquer código que
  percorra as features à mão precisa tratar `MultiPolygon`.
- **Bioma desenhado com fronteira inventada.** Os contornos do React eram retângulos (um
  avançava pelo oceano). Desde 02/10/2026 vêm do **IBGE** (`src/dados/biomasContornos.ts`,
  gerado por `scripts/biomas/gerar.mjs`, que diz como refazer) — a mesma receita do app.
  Não edite os contornos à mão. Ao tocar no mapa, `biomaMaisEspecifico()` ainda escolhe o
  menor anel que contém o ponto (a simplificação deixa encostos na fronteira) e ignora os
  buracos, que são massas d'água que o IBGE tira do bioma.
- **Trocar o fundo é trocar a camada.** Fundo claro ↔ satélite remove as camadas antigas e
  adiciona as novas (`MapaLeaflet.tsx`). No app, trocar só o endereço dentro da mesma
  camada deixava a imagem velha na tela.
- **Avaliações sem limite.** O Flutter baixa a coleção inteira para mostrar 6. Use
  `limit()` e `orderBy()`; média e total vêm de `getAggregateFromServer`.
- **Alertas em SVG, não canvas.** Com `preferCanvas` o Leaflet desenhava os alertas
  pequenos bem mais finos, e o mapa parecia ter muito menos desmatamento.
- **Cache.** Já resolvido no `firebase.json`: HTML com `no-cache`, `_next/static/` com
  `immutable` (lá o nome do arquivo tem hash). Não marque outra coisa como `immutable`.

### Modal é `Dialogo`
Todo modal usa `src/componentes/comum/Dialogo.tsx`: foco preso, fundo inerte, Esc e
foco devolvido. Nada de `div` com `position: fixed` fazendo papel de diálogo.

### CSP
Os cabeçalhos estão no `firebase.json`. Domínio externo novo (imagem, API) **entra na
CSP no mesmo PR**, senão o navegador bloqueia em produção. O preview usa o
`firebase.json` da `main`, então só a produção mostra o efeito da mudança.

### Login em preview e em `npm run dev`
A **Web key** do Firebase é restrita por referenciador (Google Cloud → Credenciais).
Endereço fora da lista dá "Algo deu errado" no login, com
`auth/requests-from-referer-...-are-blocked` no console. `http://localhost:3000/*` está
liberado (use a porta 3000). Cada **preview de PR** tem um endereço próprio, e o Google
não aceita curinga no meio do nome (`ecomapbrasil-17756--*.web.app` é recusado): para
testar login num preview, adicione o endereço exato dele à chave. Não mexa na Android key.

---

## Git

- Branch a partir da `main`: `feat/…`, `fix/…`, `docs/…`.
- Commit em português, no imperativo, com o porquê quando não for óbvio.
- PR com CI verde e a revisão de alguém do grupo.
- Actions dos workflows fixadas por SHA, com a versão no comentário. Para atualizar,
  troque o SHA pelo da tag nova (`gh api repos/<dono>/<action>/commits/<tag> --jq .sha`).

## Deploy

**Não rode `firebase deploy` da sua máquina.** O deploy sai da `main`, pela CI, a cada
merge: é o que garante que o site no ar é código revisado. Deploy de árvore local não é
reproduzível.
