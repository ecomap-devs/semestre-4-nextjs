<p align="center">
  <img src=".github/arte/banner.svg" alt="EcoMapBrasil — os alertas de desmatamento do DETER-B desenhados como mapa, ao lado do título" width="100%">
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white">
  <img alt="Firebase Hosting" src="https://img.shields.io/badge/Firebase-Hosting_est%C3%A1tico-ffca28?logo=firebase&logoColor=black">
  <img alt="Estado" src="https://img.shields.io/badge/estado-porte_conclu%C3%ADdo-199e70">
  <img alt="Licença MIT" src="https://img.shields.io/badge/licen%C3%A7a-MIT-5b6270">
</p>

O **EcoMapBrasil** mostra num lugar só **onde** o desmatamento acontece nos biomas
brasileiros, **quais espécies** estão ameaçadas e o que dá para fazer a respeito. Este
repositório é **o site**, no 4º semestre: o porte da
[versão React do 3º semestre](https://github.com/ecomap-devs/semestre-3-react) para
**Next.js com TypeScript**, exportado como site estático e publicado no Firebase Hosting.

O app Android é o [semestre-4-flutter](https://github.com/ecomap-devs/semestre-4-flutter).
Os dois usam o mesmo backend, então a conta é a mesma e uma avaliação feita no celular
aparece no site.

> [!NOTE]
> **As três telas do React estão portadas** (Início, Mapa e Animais, com login e
> avaliações), com os defeitos conhecidos corrigidos, e o site está no endereço principal
> desde 01/10/2026: **[ecomapbrasil-17756.web.app](https://ecomapbrasil-17756.web.app)**.
> Depois do porte vieram a página **Fotos** (identificação de animal por foto, 02/10), os
> **biomas pelo limite do IBGE** (02/10), um **visual próprio** (22/10), que substituiu o
> do React, e os **dados reais** (28/10) no lugar dos valores de referência herdados do
> React: desmatamento do **PRODES/INPE** e status das espécies na **lista nacional do MMA**
> e na **Lista Vermelha da IUCN**.

## 🧭 Onde este repositório entra

```mermaid
flowchart LR
    subgraph faces[Duas faces, um backend]
        direction TB
        web["🌐 Site · Next.js + TypeScript<br/>este repositório"]
        app["📱 App Android · Flutter<br/>semestre-4-flutter"]
    end
    subgraph backend[Backend]
        direction TB
        auth[🔐 Firebase Auth]
        fs[(🗄️ Firestore)]
        sb[(🖼️ Supabase Storage)]
        fn["⚡ Edge Function<br/>identificar-animal"]
    end
    web --> auth & fs & sb & fn
    app --> auth & fs & sb & fn
    fn --> gemini["✨ Gemini"]
    regras["📜 firestore.rules<br/>no semestre-4-flutter"] -. protege .-> fs
    inpe["📡 PRODES · INPE<br/>TerraBrasilis"] -. todo mês, por PR .-> web
    mma["🐆 Lista nacional · MMA<br/>IUCN · GBIF"] -. todo mês, por PR .-> web
```

## 🛠️ Stack

| Camada | Escolha | Por quê |
|---|---|---|
| **Framework** | Next.js 16 (App Router) · React 19 | Cada página sai como HTML pronto no build, e não como uma `div` vazia montada por JS |
| **Linguagem** | TypeScript `strict` | Decidido em 30/09/2026, no início do porte, que é quando trocar custa menos |
| **Estilo** | Estilo inline, como no React, com as cores em variáveis CSS (`globals.css`) · Tailwind 4 só como base | Um ajuste de cor no `globals.css` vale no site todo; o Tailwind entra pelo reset de estilos |
| **Fontes** | Fraunces nos títulos e Source Sans 3 no texto, pelo `next/font` | Baixadas no build e servidas do próprio site, então a CSP não muda. O app usa as mesmas |
| **Ícones** | Font Awesome 6, pelo npm | O React carregava de um CDN |
| **Mapa** | `leaflet` | O mesmo Leaflet do React, agora pelo npm e com versão fixa (o React baixava do unpkg sem versão) |
| **Conta e dados** | `firebase` (Auth, Firestore) | Login e avaliações em tempo real |
| **Imagens** | `@supabase/supabase-js` | Fotos das espécies e avatares |
| **Dados de desmatamento** | PRODES (INPE), gerado em `src/dados/prodes.ts` por `scripts/prodes/gerar.mjs` | Baixado antes do build e revisado por PR: o site não depende do INPE estar no ar, e a CSP não muda |
| **Status das espécies** | Lista nacional do MMA (dados abertos, CKAN) e IUCN pela API do GBIF, gerado em `src/dados/especies.ts` por `scripts/especies/gerar.mjs` | Mesmo esquema do PRODES. As duas fontes são abertas: a API da própria IUCN exige chave, e chave não entra no código |
| **Identificação por foto** | Edge Function do Supabase + Gemini | A mesma função do app (o código mora no semestre-4-flutter); a chave do Gemini fica no servidor, e daqui só vai o ID token do Firebase |
| **Hospedagem** | Firebase Hosting, exportação estática | Plano gratuito, e é o único que serve o endereço `web.app` |

## 🚀 Como rodar

> Pré-requisito: Node.js 24.

```bash
git clone https://github.com/ecomap-devs/semestre-4-nextjs.git
cd semestre-4-nextjs
npm install

cp .env.example .env.local     # e preencha os valores
npm run dev                    # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera os tipos das rotas e roda o `tsc` |
| `npm run build` | Exportação estática em `out/`, **sem precisar de credencial** |

> [!IMPORTANT]
> Tudo no `.env.local` é `NEXT_PUBLIC_*` e vai para o navegador: são chaves públicas de
> cliente. Quem protege o dado são as Firestore Rules e o RLS do Supabase. Sem o
> `.env.local`, o site compila, e o primeiro uso do Firebase lança um erro dizendo
> exatamente qual variável falta.

## 🏗️ Exportação estática

`next build` gera um HTML por rota em `out/`, e o Firebase Hosting serve esses arquivos.
Não há servidor, então ficam de fora route handlers, `proxy.ts`, server actions, ISR e o
otimizador do `next/image`. Para este site não custa nada: login, avaliações e mapa já
rodavam no navegador no React.

<details>
<summary>Como o Hosting está configurado (<code>firebase.json</code>)</summary>

| Regra | Por quê |
|---|---|
| `cleanUrls: true` | `/mapa` serve `mapa.html` |
| `trailingSlash: false` | `/mapa/` redireciona para `/mapa` |
| `**` com `no-cache` | O HTML é revalidado a cada visita: deploy novo aparece na hora |
| `/_next/static/**` com `immutable` por um ano | O nome desses arquivos tem hash e muda a cada build |

A ordem importa: **a última regra que casa vence**. E `immutable` só vale em arquivo com
hash no nome. O app Flutter marcou `main.dart.js` assim, e os visitantes ficaram presos
na interface antiga.

Rotas, `cleanUrls`, `trailingSlash` e o 404 foram conferidos no emulador do Hosting. Os
cabeçalhos de cache **não**: o emulador ignora a seção `headers`. Confira no primeiro
deploy:

```bash
for u in / /mapa /_next/static/; do
  echo -n "$u  "; curl -sI "https://ecomapbrasil-17756.web.app$u" | grep -i '^cache-control'
done
```

</details>

## 📊 Sobre os dados

| No site | De onde vem |
|---|---|
| Percentual desmatado de cada bioma (Home e mapa) | PRODES: tudo o que o INPE já mapeou como desmatado ÷ área do bioma no IBGE (2019) |
| "Área desmatada por bioma" e "Desmatado no último ano medido" | PRODES, por bioma. Na Amazônia, floresta e vegetação não florestal somadas |
| Os dois primeiros números da Home | PRODES: total dos seis biomas no período mais recente que todos já têm consolidado, e a variação sobre o anterior |
| Linha do tempo (Home e mapa) | Calculada em `src/dados/linhaDoTempo.ts` a partir da taxa oficial da Amazônia Legal e do acumulado por bioma. Só PPCDAm (2004), Moratória da Soja (2006) e Código Florestal (2012) são escritos à mão, sem número |
| Alertas no mapa | DETER-B (INPE), em `public/alertas-desmatamento.json` |
| Contorno dos biomas | IBGE, gerado por `scripts/biomas/gerar.mjs` |
| "Espécies ameaçadas no Brasil" (Home e Animais) | Lista nacional do MMA: espécies e subespécies da fauna em CR, EN ou VU no CSV mais recente do [portal de dados abertos](https://dados.mma.gov.br/dataset/especies-ameacadas) (a avaliação de 2021, que virou a Portaria MMA nº 148/2022) |
| Status de cada espécie | "No Brasil": a mesma lista do MMA. "No mundo": a Lista Vermelha da IUCN, pela API do GBIF |
| População de uma espécie | Só onde há estimativa publicada, com a fonte na ficha (hoje: onça na Mata Atlântica, mico-leão-dourado e arara-azul-de-lear). Escrita à mão em `src/dados/animais.ts` |
| Descrição e ameaças de cada espécie | Escritas à mão em `src/dados/animais.ts`, sem número que não tenha fonte |

Para atualizar na mão:

```bash
node scripts/prodes/gerar.mjs     # desmatamento
node scripts/especies/gerar.mjs   # status das espécies
```

<details>
<summary>Detalhes que mudam a leitura dos números</summary>

- **Não é uma API documentada.** O script baixa os mesmos JSON que o
  [painel do TerraBrasilis](https://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/cerrado/increments)
  carrega (o endereço vem do código dele, em `terrabrasilis/deforestation_dashboard`).
  Se o formato mudar, o script para com erro em vez de gravar número errado.
- **O ano do PRODES vai de agosto a julho**: "2025" é ago/2024 a jul/2025.
- **Taxa e incremento são contas diferentes.** A taxa da Amazônia Legal (linha do tempo) é a
  estimativa oficial para a região, só de floresta. O incremento por bioma (gráficos) é o
  que foi mapeado dentro do bioma. Por isso os dois números da Amazônia não batem.
- **Dado preliminar** (o período que termina no ano da última atualização do INPE) fica
  fora dos totais da Home. Na linha do tempo, aparece como "Estimativa do INPE".
- **Nem todo bioma é medido todo ano.** Até 2013 alguns eram medidos a cada dois ou quatro
  anos. Esses períodos entram no acumulado, mas não na série anual.
- **O status no Brasil e no mundo podem ser diferentes.** A lista nacional avalia a espécie
  só no Brasil; a IUCN, no mundo todo. A onça é vulnerável aqui e quase ameaçada no mundo, e a
  ararinha-azul, reintroduzida em 2022, já é "criticamente em perigo" na lista nacional e
  ainda "extinta na natureza" na IUCN.
- **Não há série de população.** Até 28/10/2026 cada espécie tinha um gráfico de 2000 a 2024
  sem fonte, que saiu. Espécie nova no catálogo entra também em `ESPECIES` de
  `scripts/especies/gerar.mjs`, e o build para se ela não estiver na lista nacional.

</details>

## 🔄 CI e deploy

| Workflow | Quando | O que faz |
|---|---|---|
| **CI** | Push ou PR na `main` | Lint, tipos, build e confere que cada rota virou HTML. Não usa secret |
| **Preview do PR** | PR aberto | Dois jobs: o build roda o código do PR **sem** a conta de serviço; um job separado, que não executa código do PR, publica o `out/` num canal de preview que expira em 7 dias |
| **Deploy para produção** | Merge na `main` (ou na mão) | Publica no endereço principal |
| **Dados do PRODES** | Dia 1º de cada mês (ou na mão) | Regera `src/dados/prodes.ts`; se mudou, roda lint, tipos e build e abre um PR. Não usa secret |
| **Dados das espécies** | Dia 1º de cada mês (ou na mão) | O mesmo para `src/dados/especies.ts`. Se uma espécie do catálogo sair da lista nacional, o build falha e o job fica vermelho, sem PR: decidir se ela fica é com o grupo |

> [!IMPORTANT]
> O **Dados do PRODES** e o **Dados das espécies** só conseguem abrir o PR com *Settings → Actions → General →
> "Allow GitHub Actions to create and approve pull requests"* ativado. E PR aberto pelo
> `GITHUB_TOKEN` não dispara a **CI** (regra do GitHub), por isso cada workflow roda
> a verificação antes de abrir.

O build com credenciais (`.github/scripts/build-com-credenciais.sh`) recusa secret vazio
e, depois do build, confere que o `projectId` do Firebase entrou no JavaScript gerado.
As duas guardas foram testadas nos dois sentidos.

Os workflows têm token só de leitura (menos os dois de dados, que precisam criar a
branch e o PR) e as actions são fixadas por SHA. O preview usa o
`firebase.json` da `main`: mudança de cabeçalho feita num PR só vale depois do merge.

## 🛡️ Segurança

Revisão de 01/10/2026 (Codex), corrigida no mesmo dia:

| O quê | Como ficou |
|---|---|
| Avaliações | Uma por pessoa (o id é o uid); esquema completo também na edição; hora do servidor; sem campo extra. Testado em `firestore-testes/` do semestre-4-flutter |
| Foto do avatar | Só do bucket `avatars` do projeto (nas rules, no código e na CSP), com `referrerPolicy="no-referrer"`. Antes, uma URL livre podia registrar o IP de quem abrisse as avaliações |
| Upload do avatar | Reencodado para WebP de até 512 px no navegador (só imagem de verdade, sem EXIF), em `<uid>/<uuid>.webp`, sem sobrescrever |
| Preview do PR | A conta de serviço não fica mais no job que roda o código do PR |
| Cabeçalhos | CSP com os domínios usados, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| Modais | Foco preso no diálogo, fundo inerte, Esc fecha, o foco volta à origem (`src/componentes/comum/Dialogo.tsx`) |

<details>
<summary>O que ficou de fora, e por quê</summary>

- **Domínio da foto não amarrado ao dono.** O Supabase não sabe quem envia: os apps
  entram pelo Firebase Auth. Amarrar exige a integração de terceiros do Supabase com o
  Firebase, que pede uma claim `role` em todos os usuários (Admin SDK ou funções de
  bloqueio). As políticas do bucket estão em `supabase/avatars.sql` do semestre-4-flutter.
- **Mesma conta de serviço no preview e na produção.** Separar exige criar outra conta no
  Google Cloud com permissão só de canais de preview.
- **`'unsafe-inline'` em `script-src`.** A exportação estática do Next põe scripts inline
  diferentes em cada página; a CSP restringe a origem dos scripts externos, não os inline.

</details>

<details>
<summary>Secrets do repositório</summary>

Os mesmos nomes do semestre-4-flutter, para quem já configurou um configurar o outro:

| Secret | De onde vem |
|---|---|
| `FIREBASE_API_KEY_WEB` · `FIREBASE_APP_ID_WEB` | O app **web** no console do Firebase |
| `FIREBASE_MESSAGING_SENDER_ID` · `FIREBASE_PROJECT_ID` · `FIREBASE_AUTH_DOMAIN` · `FIREBASE_STORAGE_BUCKET` | Configuração do SDK no console do Firebase |
| `SUPABASE_URL` · `SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys no Supabase |
| `FIREBASE_SERVICE_ACCOUNT_ECOMAPBRASIL_17756` | Conta de serviço com permissão de deploy no Hosting. Sem ela, o preview avisa e pula |

</details>

## 🔁 O que o porte corrigiu

No porte (01/10/2026) a interface ficou a mesma do React, conferida lado a lado em
capturas de tela no desktop e no celular; o visual próprio veio depois, no PR #6. O que o
porte mudou foi de propósito:

<details>
<summary>Defeitos do React corrigidos</summary>

| Onde | No React | Agora |
|---|---|---|
| Login | O texto digitado nos campos era branco sobre fundo branco | Legível |
| Cadastro | Gravava o e-mail em `usuarios/{uid}` (LGPD) | Não grava, como o Flutter |
| Avatar | Usava a `anon` key do Supabase, desativada em 08/09/2026 | `sb_publishable_` |
| Avaliações | Baixava a coleção inteira; falha no envio deixava o botão em "Enviando..." | `limit()`, média e total agregados no servidor, erro tratado, hora do servidor |
| Avaliações | Entre 28 e 29 dias aparecia "há 0 mês" | "há 4 semanas" |
| Mapa | Clicar em São Paulo abria a ficha do Cerrado | Escolhe o bioma mais específico, como o Flutter |
| Mapa | Legenda com "Limites Estaduais", sem camada correspondente | Só o que está desenhado |
| Mapa | Leaflet do unpkg sem versão | Do npm, com versão fixa |
| Início | Carregava a MapLibre do unpkg para um mapa que não existia na página | Removido |
| Início | "Compartilhar" não fazia nada; "Baixar Dados" apontava para um `.zip` inexistente | Compartilha (ou copia o link); baixa o GeoJSON dos alertas |
| Início | A âncora de cada seção parava debaixo do cabeçalho fixo | Desconta o cabeçalho |
| Início | Equipe com quatro pessoas | As cinco |
| Início e rodapé | Cinza sobre verde-escuro quase ilegível; contato e redes com texto de exemplo e links `#` | Contraste corrigido; só o que é real |
| Animais | Busca exigia acento ("onca" não achava a onça) | Sem acento e sem caixa |
| Animais | Cards piscavam ao entrar; ficha sem Esc e com o fundo rolando | Corrigido |
| Imagens | Foto que não carregava virava ícone quebrado | Imagem reserva |
| Geral | A página ficava em branco até o Firebase responder | A página aparece na hora; só o botão de login espera |

</details>

## 🔀 A troca de endereço (feita em 01/10/2026)

Decidido em 30/09/2026: o site fica com o endereço principal
(`ecomapbrasil-17756.web.app`) e o Flutter vira só o app Android. A troca foi feita em
01/10/2026:

1. ✅ **Deploy para produção** rodado na mão, ainda com confirmação.
2. ✅ Site conferido: as três rotas com `no-cache`, `_next/static/` imutável, os
   arquivos do Flutter (`main.dart.js`, `flutter_bootstrap.js`) respondendo 404, e as
   avaliações reais carregando no navegador.
3. ✅ O `deploy.yml` passou a rodar a cada merge na `main`.
4. ✅ No semestre-4-flutter saíram o deploy no Hosting, o preview por PR, o build web da
   CI e o check `Build web` da proteção da `main`.

Quem ficou preso na interface antiga do Flutter se solta sozinho: o `/` tinha cache de
uma hora, e o HTML novo não pede mais o `main.dart.js`. O service worker do Flutter já
se desregistrava sozinho.

Se precisar voltar uma versão, o Firebase Hosting guarda o histórico: Console →
Hosting → histórico de lançamentos → Reverter.

## 🤝 Contribuindo

As regras estão no **[AGENTS.md](AGENTS.md)**: credenciais, o que a exportação estática
proíbe, como validar dado do Firestore e o **checklist do porte**, com os defeitos do
React que o Flutter já corrigiu e que não devem voltar. Valem para os cinco do grupo e
para qualquer assistente de IA.

## 👥 Equipe

**Vinicius** · **Bruno** · **Cesar** · **João Flávio** · **João Gabriel**

## 📄 Licença

[MIT](LICENSE). Projeto acadêmico, sem fins lucrativos.
