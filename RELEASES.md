# Como lançar uma versão do site

Guia para qualquer pessoa do grupo, mesmo quem nunca fez uma release. Basta ter permissão de
escrita no repositório, que hoje os cinco têm. O trabalho manual é pequeno, e o GitHub publica em
menos de um minuto.

## O que é uma release

Uma release é um **marco com número**, na
[página de Releases](https://github.com/ecomap-devs/semestre-4-nextjs/releases). Ela registra o
estado do site naquele momento, com as notas do que mudou desde a anterior.

**A release não publica o site.** Quem faz isso é o merge:

| | Quando acontece | O que faz |
|---|---|---|
| **Merge na `main`** | A cada PR | Publica o site em [ecomapbrasil.web.app](https://ecomapbrasil.web.app) |
| **Release** | Quando alguém cria uma tag | Só registra a versão, sem mudar nada no ar |

Por isso, criar uma tag não coloca nada no ar, e apagar uma release não tira nada do ar.

## Quando lançar

**Lance** para marcar um momento que valha a pena reencontrar:

- uma entrega ou apresentação;
- um conjunto de mudanças que forma uma etapa, como um visual novo ou uma funcionalidade grande.

**Não precisa lançar** a cada merge, nem por causa de documentação, CI ou atualização mensal de
dados. Essas mudanças já estão no ar, e a lista de versões ficaria cheia de marcos quase iguais.

## Como escolher o número

A versão fica no `package.json`, no formato `X.Y.Z`:

| Parte | Quando muda | Exemplo a partir de `1.0.0` |
|---|---|---|
| `Z` | Só consertos ou dados atualizados | `1.0.1` |
| `Y` | Funcionalidade nova (`Z` volta a 0) | `1.1.0` |
| `X` | Mudança grande, como uma nova fase do projeto (`Y` e `Z` voltam a 0) | `2.0.0` |

A tag é a versão com um `v` na frente: `1.1.0` vira `v1.1.0`. Os números do site e do app são
independentes.

## Passo a passo

Os comandos abaixo valem no PowerShell e no Git Bash. No exemplo, a versão é `1.1.0`.

**1. Suba a versão num PR.**

```bash
git switch main
git pull
git switch -c feat/versao-1.1.0
npm version 1.1.0 --no-git-tag-version
```

O comando muda o `package.json` e o `package-lock.json`. Faça o commit, abra o PR e siga o
caminho normal: CI verde, aprovação e merge.

**2. Crie a tag na `main`, depois do merge.**

```bash
git switch main
git pull
git tag v1.1.0
git push origin v1.1.0
```

> [!WARNING]
> Crie a tag pelo `git`, **não** pelo botão "Draft a new release" do GitHub. O botão já cria
> uma release, e o workflow para ao tentar criar a dele.

**3. Acompanhe** em [Actions → Release](https://github.com/ecomap-devs/semestre-4-nextjs/actions/workflows/release.yml).
As notas saem sozinhas, a partir dos títulos dos PRs, e podem ser editadas depois para explicar
melhor o que mudou.

## O que o workflow confere

O `.github/workflows/release.yml` para, sem publicar nada, se a versão do `package.json` não for
a da tag ou se a tag não estiver na `main`. Ele não instala dependências, porque tem permissão de
escrita no repositório, e não usa nenhum secret.

## Ensaio

Para testar sem publicar, por exemplo depois de mudar o workflow, use uma tag com hífen. A parte
antes do hífen precisa ser a versão do `package.json`, e a tag pode estar em qualquer branch. O
workflow que roda é o do commit da tag.

```bash
git tag v1.1.0-rc.1
git push origin v1.1.0-rc.1
```

O resultado é um **rascunho**, visível só para quem tem escrita no repositório. Depois, apague
tudo:

```bash
gh release delete v1.1.0-rc.1 --cleanup-tag -y
git tag -d v1.1.0-rc.1
```

Sem o `gh`, apague o rascunho na página de Releases e a tag com
`git push origin --delete v1.1.0-rc.1`. Se o ensaio falhou antes de criar o rascunho, só a tag
precisa sair.

O resultado do ensaio aparece no commit: se a tag estiver num commit de PR, um ensaio que falhar
deixa um check vermelho nele. Avise quem for revisar.

## Se der errado

| O que aparece | O que significa | O que fazer |
|---|---|---|
| Nada roda em Actions | A tag não tem o formato `vX.Y.Z` | Apague a tag e crie de novo |
| `A tag é v1.1.0, e o package.json diz ...` | A versão não foi subida, ou o PR não entrou | Apague a tag, faça o merge da versão certa e crie de novo |
| `A tag precisa apontar para um commit da main` | A tag foi criada em outra branch | Apague a tag, vá para a `main` atualizada e crie de novo |
| Erro de rede | Falha passageira do GitHub | Em Actions, use **Re-run failed jobs** |
| Falha em **Criar a release**, dizendo que ela já existe | Já há uma release com esse número | Se alguém acabou de criá-la pelo botão, apague-a e use **Re-run failed jobs**. Se ela é uma versão já publicada, deixe como está e use outro número |

**Para apagar uma tag que não virou release:**

```bash
git push origin --delete v1.1.0
git tag -d v1.1.0
```

**Se o site publicado tiver defeito,** o conserto é um PR normal, que vai ao ar no merge. A release
não precisa mudar. Não mova uma tag já publicada: se o conserto merecer um marco, lance outra
versão, como `1.1.1`.
