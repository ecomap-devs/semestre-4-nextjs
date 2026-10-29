// Como denunciar um crime ambiental, pelos canais oficiais. Conferido em 29/10/2026 na
// página de serviço do gov.br, "Apresentar denúncia ambiental" (última modificação lá:
// 03/09/2026). Telefone, horário ou endereço mudou? Confira na página e troque a data.
//
// Até 29/10/2026 o site mandava usar um aplicativo "Denúncia Ambiente", que não aparece
// em nenhum canal oficial.

export const fonteDenuncia = {
  rotulo: "gov.br, Apresentar denúncia ambiental",
  link: "https://www.gov.br/pt-br/servicos/apresentar-denuncia-ambiental",
  conferidoEm: "29 de outubro de 2026",
};

export type Canal = {
  titulo: string;
  /** O que mostrar em destaque: o número ou o nome do site. */
  contato: string;
  /** `tel:` ou `https:`. */
  link: string;
  texto: string;
};

export const canaisDenuncia: Canal[] = [
  {
    titulo: "Pela internet",
    contato: "Fala.BR",
    link: "https://falabr.cgu.gov.br/v2/",
    texto: "A plataforma de ouvidoria do governo federal, que encaminha ao Ibama. Pede login gov.br, e a denúncia identificada pode ser acompanhada até a resposta.",
  },
  {
    titulo: "Por telefone",
    contato: "0800 061 8080",
    link: "tel:08000618080",
    texto: "Central de Atendimento do Ibama, ligação gratuita. De segunda a sexta, exceto feriados, das 7h às 19h.",
  },
  {
    titulo: "Está acontecendo agora",
    contato: "190",
    link: "tel:190",
    texto: "Desmatamento, caça ou queimada em andamento é caso de polícia: a Polícia Militar aciona o policiamento ambiental do estado. Para fogo, os bombeiros atendem no 193.",
  },
];

/** O que a página do gov.br pede para a denúncia não ser arquivada. */
export const oQueInformar = [
  "Município, estado e o endereço exato, com pontos de referência ou coordenadas",
  "Nome da propriedade, da estrada e o quilômetro, se houver",
  "O que está sendo destruído: mata, rio, animais",
  "Quem está fazendo, se souber, e veículos ou máquinas usados",
  "Fotos, vídeos ou áudios",
  "O protocolo, se já denunciou em outro órgão",
];

export const sobreAnonimato =
  "Dá para denunciar sem se identificar. Nesse caso não há como acompanhar o andamento, e o Ibama não consegue pedir mais detalhes: sem as informações acima, a denúncia é arquivada.";
