// As perguntas do quiz, montadas a partir dos próprios dados do site: PRODES, lista
// nacional de espécies, catálogo e canais de denúncia. Nenhuma resposta é escrita à mão:
// quando o INPE ou o MMA publicam dado novo, a pergunta muda junto. As opções erradas
// também saem dos dados (outros biomas, outros anos, outras espécies) ou, nos números,
// de múltiplos do certo, para nunca coincidir com ele.

import { animais, ehAmeacada, type StatusConservacao } from "./animais";
import { biomas } from "./biomas";
import { canaisDenuncia, fonteDenuncia } from "./denuncia";
import { listaNacional } from "./especies";
import { ultimoPeriodo } from "./inicio";
import { prodes, taxasAmazoniaLegal } from "./prodes";

export type Pergunta = {
  /** Estável entre builds: serve de chave na tela. */
  id: string;
  /** O quiz sorteia no máximo uma pergunta de cada grupo antes de repetir grupo. */
  grupo: "biomas" | "historia" | "especies" | "lista" | "deter" | "denuncia";
  enunciado: string;
  /** A primeira é a certa; a tela embaralha antes de mostrar. */
  opcoes: [string, ...string[]];
  explicacao: string;
  fonte: { rotulo: string; link: string };
};

const milhar = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const PRODES = { rotulo: "PRODES/INPE, pelo TerraBrasilis", link: "https://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/cerrado/increments" };
const MMA = { rotulo: "Lista nacional de fauna ameaçada, MMA", link: listaNacional.fonte };

const percentual = (b: (typeof biomas)[number]) => Number.parseInt(b.desmatamento, 10);

/** `n` itens de `lista` a partir de `inicio`, dando a volta: distratores variam entre perguntas. */
function rodando<T>(lista: T[], inicio: number, n: number): T[] {
  return Array.from({ length: Math.min(n, lista.length) }, (_, i) => lista[(inicio + i) % lista.length]!);
}

const perguntas: Pergunta[] = [];

// ── Biomas ──

const porPercentual = [...biomas].sort((a, b) => percentual(b) - percentual(a));
const maisDesmatado = porPercentual[0]!;
perguntas.push({
  id: "bioma-mais-desmatado",
  grupo: "biomas",
  enunciado: "Qual bioma já perdeu a maior parte da sua vegetação nativa?",
  opcoes: [maisDesmatado.nome, ...porPercentual.slice(1, 4).map((b) => b.nome)],
  explicacao: `${maisDesmatado.nome}: ${maisDesmatado.desmatamento} da área do bioma já foi desmatada, pelo que o PRODES mapeou desde o início da série.`,
  fonte: PRODES,
});

const [lider, ...outrosNoAno] = ultimoPeriodo.biomas;
if (lider) {
  perguntas.push({
    id: "bioma-mais-perdeu-no-ano",
    grupo: "biomas",
    enunciado: `De ${ultimoPeriodo.rotulo}, qual bioma perdeu mais vegetação nativa em área?`,
    opcoes: [lider.nome, ...outrosNoAno.slice(0, 3).map((b) => b.nome)],
    explicacao: `${lider.nome}, com ${milhar.format(lider.km2)} km² desmatados no período.${lider.nome === "Amazônia" ? "" : " A Amazônia é o maior bioma, mas não foi a que mais perdeu."}`,
    fonte: PRODES,
  });
}

const amazonia = biomas.find((b) => b.chave === "amazonia");
if (amazonia) {
  const p = percentual(amazonia);
  // Múltiplos do valor certo, arredondados para 5, só os que ficam entre 1% e 95%.
  const errados = [...new Set([0.5, 2, 3, 4].map((f) => Math.round((p * f) / 5) * 5))].filter((v) => v !== p && v > 0 && v <= 95).slice(0, 3);
  perguntas.push({
    id: "quanto-da-amazonia",
    grupo: "biomas",
    enunciado: "Quanto da Amazônia já foi desmatado?",
    opcoes: [`${p}%`, ...errados.map((v) => `${v}%`)],
    explicacao: `Cerca de ${p}% da área do bioma, segundo o PRODES. Parece pouco perto de outros biomas, mas a Amazônia é tão grande que isso dá ${milhar.format(Math.round((prodes.amazonia?.acumuladoKm2 ?? 0) / 1000))} mil km².`,
    fonte: PRODES,
  });
}

// ── História ──

const consolidadas = taxasAmazoniaLegal.filter((t) => !t.preliminar);
const pior = consolidadas.reduce((a, b) => (b.km2 > a.km2 ? b : a), consolidadas[0]!);
const melhor = consolidadas.reduce((a, b) => (b.km2 < a.km2 ? b : a), consolidadas[0]!);
const decadas = (ano: number) => consolidadas.filter((t) => Math.abs(t.ano - ano) >= 5).map((t) => t.ano);
if (pior && melhor) {
  perguntas.push({
    id: "pior-ano-amazonia",
    grupo: "historia",
    enunciado: "Em que ano a Amazônia Legal teve a maior taxa de desmatamento já medida pelo INPE?",
    opcoes: [String(pior.ano), ...rodando(decadas(pior.ano), 7, 3).map(String)],
    explicacao: `Em ${pior.ano}, com ${milhar.format(pior.km2)} km² de floresta derrubados em um ano.`,
    fonte: PRODES,
  });
  perguntas.push({
    id: "melhor-ano-amazonia",
    grupo: "historia",
    enunciado: "Em que ano a Amazônia Legal teve a menor taxa de desmatamento da série do INPE?",
    opcoes: [String(melhor.ano), ...rodando(decadas(melhor.ano), 3, 3).map(String)],
    explicacao: `Em ${melhor.ano}, com ${milhar.format(melhor.km2)} km². Depois disso a taxa voltou a subir.`,
    fonte: PRODES,
  });
}

// ── Lista nacional ──

const n = listaNacional.ameacadas;
perguntas.push({
  id: "quantas-ameacadas",
  grupo: "lista",
  enunciado: "Quantas espécies e subespécies da fauna brasileira estão ameaçadas de extinção, segundo a lista nacional?",
  opcoes: [milhar.format(n), ...[0.1, 0.3, 4].map((f) => milhar.format(Math.round((n * f) / 10) * 10))],
  explicacao: `${milhar.format(n)}: ${listaNacional.porCategoria.CR} criticamente em perigo, ${listaNacional.porCategoria.EN} em perigo e ${listaNacional.porCategoria.VU} vulneráveis, na avaliação de ${listaNacional.ano}.`,
  fonte: MMA,
});

// ── Espécies do catálogo ──

const ORDEM_AMEACA: StatusConservacao[] = ["Criticamente em perigo", "Em perigo", "Vulnerável"];

// "Qual destas está ameaçada?": uma pergunta por espécie ameaçada, com três não
// ameaçadas do mesmo bioma, para a resposta não sair só do nome do bioma.
for (const b of biomas) {
  const doBioma = animais.filter((a) => a.bioma === b.nome).sort((x, y) => x.nome.localeCompare(y.nome));
  const ameacadas = doBioma.filter(ehAmeacada);
  const comuns = doBioma.filter((a) => !ehAmeacada(a));
  if (comuns.length < 3) continue;
  ameacadas.forEach((a, i) => {
    perguntas.push({
      id: `ameacada-${a.cientifico}`,
      grupo: "especies",
      enunciado: `Qual destas espécies do bioma ${b.nome} está ameaçada de extinção no Brasil?`,
      opcoes: [a.nome, ...rodando(comuns, i, 3).map((c) => c.nome)],
      explicacao: `${a.nome} está como "${a.status.toLowerCase()}" na lista nacional. As outras três não estão na lista.`,
      fonte: MMA,
    });
  });
}

// "Qual é o status?": as quatro categorias de sempre, a certa e as outras.
for (const a of animais.filter((x) => ORDEM_AMEACA.includes(x.status))) {
  perguntas.push({
    id: `status-${a.cientifico}`,
    grupo: "especies",
    enunciado: `Na lista nacional de espécies ameaçadas, qual é a classificação de ${a.nome.toLowerCase()}?`,
    opcoes: [a.status, ...[...ORDEM_AMEACA, "Não ameaçada" as const].filter((s) => s !== a.status).slice(0, 3)],
    explicacao: `"${a.status}"${a.iucn ? `; no mundo, a IUCN a classifica como "${a.iucn.toLowerCase()}"` : ""}. As duas listas podem discordar: a nacional olha só a população no Brasil.`,
    fonte: MMA,
  });
}

// ── DETER e denúncia ──

perguntas.push({
  id: "deter-cobertura",
  grupo: "deter",
  enunciado: "O DETER, do INPE, emite alertas de desmatamento quase em tempo real. Quais biomas ele cobre?",
  opcoes: ["Amazônia e Cerrado", "Os seis biomas", "Só a Amazônia", "Amazônia, Cerrado e Mata Atlântica"],
  explicacao: "Só a Amazônia Legal e o Cerrado. Por isso o mapa não tem alerta na Mata Atlântica, na Caatinga, no Pantanal e no Pampa — o que não quer dizer que lá não haja desmatamento.",
  fonte: { rotulo: "DETER/INPE, pelo TerraBrasilis", link: "https://terrabrasilis.dpi.inpe.br/app/dashboard/alerts/legal/amazon/aggregated/" },
});

const telefone = canaisDenuncia.find((c) => c.link.startsWith("tel:0800"));
if (telefone) {
  perguntas.push({
    id: "telefone-ibama",
    grupo: "denuncia",
    enunciado: "Qual é o telefone gratuito da Central de Atendimento do Ibama, para denunciar um crime ambiental?",
    // As erradas são outros números de serviço público, não um 0800 inventado, que
    // poderia ser o telefone de alguém.
    opcoes: [telefone.contato, "190", "193", "199"],
    explicacao: `${telefone.contato}: ${telefone.texto} O 190 (polícia) é para o crime que está acontecendo agora; o 193 é dos bombeiros e o 199, da Defesa Civil.`,
    fonte: { rotulo: fonteDenuncia.rotulo, link: fonteDenuncia.link },
  });
}

// Uma opção repetida tornaria a pergunta ambígua: melhor o build parar.
for (const p of perguntas) {
  if (new Set(p.opcoes).size !== p.opcoes.length || p.opcoes.length < 2) throw new Error(`Quiz: opções repetidas ou faltando em "${p.id}": ${p.opcoes.join(" | ")}`);
}

export { perguntas };

/** Perguntas por rodada. */
export const TAMANHO_RODADA = 8;
