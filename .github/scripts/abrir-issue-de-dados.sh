#!/usr/bin/env bash
# Último passo dos workflows de dados (dados-prodes, dados-deter, dados-especies): sobe
# a branch com o arquivo regerado e abre uma issue com o link do PR já preenchido.
#
# Uso: abrir-issue-de-dados.sh <arquivo regerado>...
# Ambiente: GH_TOKEN, BRANCH, TITULO, TEXTO_DO_PR (e os GITHUB_* do Actions).
#
# Por que não abrir o PR daqui: PR aberto pelo GITHUB_TOKEN não dispara a CI nem o
# preview, e a `main` exige o check da CI. Aberto por uma pessoa pelo link, o PR roda tudo.
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "::error::nenhum arquivo para subir"
  exit 1
fi
for v in GH_TOKEN BRANCH TITULO TEXTO_DO_PR GITHUB_REPOSITORY; do
  if [ -z "${!v:-}" ]; then
    echo "::error::$v vazio"
    exit 1
  fi
done

# O checkout roda com persist-credentials: false; o token só entra aqui. O Actions
# mascara o valor dele no log.
remoto="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

# Mesma data de antes: a branch (e a issue) já existem, nada a fazer.
if git ls-remote --exit-code --heads "$remoto" "$BRANCH" > /dev/null; then
  echo "A branch $BRANCH já existe."
  exit 0
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git switch -c "$BRANCH"
git add -- "$@"
git commit -m "$TITULO"
git push "$remoto" "$BRANCH"

execucao="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID:-}"
url_issue=$(gh issue create -R "$GITHUB_REPOSITORY" --title "$TITULO" \
  --body "Dado novo na branch \`$BRANCH\`. O link do PR entra aqui em seguida. Execução: $execucao")
numero="${url_issue##*/}"

# O link do PR já leva título e texto, e o "Closes" fecha a issue no merge.
corpo_do_pr=$(printf '%s\n\nCloses #%s' "$TEXTO_DO_PR" "$numero")
link="https://github.com/${GITHUB_REPOSITORY}/compare/main...$(jq -rn --arg v "$BRANCH" '$v|@uri')?expand=1&title=$(jq -rn --arg v "$TITULO" '$v|@uri')&body=$(jq -rn --arg v "$corpo_do_pr" '$v|@uri')"

gh issue edit "$numero" -R "$GITHUB_REPOSITORY" --body "$(cat <<EOF
O workflow subiu dado novo na branch \`$BRANCH\`, e lint, tipos e build já passaram nela.

**[Abrir o PR]($link)**: o título e o texto já vêm preenchidos. Aberto por alguém do grupo, o PR roda a CI e o preview como qualquer outro, e o merge fecha esta issue.

O workflow não abre o PR sozinho porque PR aberto pelo \`GITHUB_TOKEN\` não dispara a CI, e a \`main\` exige o check dela.

Execução: $execucao
EOF
)"
echo "Issue: $url_issue"
