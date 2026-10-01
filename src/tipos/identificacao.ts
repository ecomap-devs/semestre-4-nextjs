/** Quanta certeza o Gemini declarou ter na identificação. */
export type Confianca = "alta" | "media" | "baixa";

export const rotuloConfianca: Record<Confianca, string> = {
  alta: "Alta confiança",
  media: "Confiança média",
  baixa: "Baixa confiança",
};

/** O que o Gemini concluiu sobre a foto de um animal. */
export type Identificacao = {
  /** `false` quando a foto não tem animal (pessoa, objeto, paisagem). */
  ehAnimal: boolean;
  /** Nome popular no Brasil, ex.: "onça-pintada". */
  nomePopular: string | null;
  nomeCientifico: string | null;
  confianca: Confianca;
  /** Até duas frases sobre o que se vê na foto. */
  descricao: string | null;
};

/** Nada a mostrar como identificação: sem animal ou sem nome. */
export const identificacaoVazia = (i: Identificacao) => !i.ehAnimal || i.nomePopular === null;

/**
 * Texto limpo e com teto de tamanho: a resposta vem de um modelo, e um texto sem fim
 * não pode empurrar o resto da tela para fora.
 */
function texto(valor: unknown, maximo: number): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim();
  if (!t) return null;
  return t.length <= maximo ? t : `${t.slice(0, maximo).trimEnd()}…`;
}

/**
 * Converte a resposta da Edge Function `identificar-animal` em `Identificacao`, ou
 * devolve `null` se o formato geral não for o esperado.
 *
 * Mesmo critério do `Identificacao.daResposta` do app Flutter, que tem os testes:
 * campo de texto ausente ou estranho vira `null` e não derruba o resto (sem nome
 * científico, o nome popular ainda vale), e confiança desconhecida conta como
 * baixa — melhor subestimar que vender certeza que o modelo não declarou.
 */
export function paraIdentificacao(d: unknown): Identificacao | null {
  if (typeof d !== "object" || d === null || Array.isArray(d)) return null;
  const r = d as Record<string, unknown>;
  if (typeof r.ehAnimal !== "boolean") return null;

  const confianca = r.confianca === "alta" || r.confianca === "media" || r.confianca === "baixa" ? r.confianca : "baixa";

  return {
    ehAnimal: r.ehAnimal,
    nomePopular: texto(r.nomePopular, 120),
    nomeCientifico: texto(r.nomeCientifico, 120),
    confianca,
    descricao: texto(r.descricao, 600),
  };
}

/** Traduz o status HTTP da Edge Function para a mensagem que o usuário lê. */
export function mensagemDoStatus(status: number): string {
  switch (status) {
    case 0:
      return "Sem conexão. Verifique sua internet.";
    case 401:
      return "Sua sessão expirou. Saia e entre de novo.";
    case 413:
      return "A foto é grande demais. Tente outra.";
    case 422:
      return "O Google não conseguiu analisar esta foto. Tente outra.";
    case 429:
      return "Muitas consultas seguidas. Aguarde um momento.";
    default:
      return "Não foi possível identificar agora. Tente de novo mais tarde.";
  }
}
