// O tema do site: seguir o sistema, claro ou escuro (12/11/2026), como o botão da barra
// do app (`PreferenciaDeTema`).
//
// Quem pinta é o CSS: as cores do globals.css são `light-dark(claro, escuro)`, e o
// `color-scheme` decide. Seguindo o sistema, o <html> fica sem `data-tema` e vale o
// `prefers-color-scheme`, mesmo sem JavaScript. Escolhido claro ou escuro, o
// `data-tema` força o lado. O script no <head> do layout (SCRIPT_DO_TEMA) aplica a
// escolha guardada antes da primeira pintura, para a página não abrir clara e piscar.
//
// Fica no `localStorage`, sem conta: é preferência de tela, não de pessoa, e vale antes
// do login. Seguir o sistema não guarda nada.
//
// Sem "use client" de propósito: o layout, que é Server Component, importa o script.
// Os hooks (`useTema`, `useTemaEscuro`) estão em componentes/comum/ganchos.ts.

export type Tema = "sistema" | "claro" | "escuro";

export const CHAVE_DO_TEMA = "ecomap:tema";

/** Roda no <head>, antes da pintura: o mesmo que `aplicarTema(temaGuardado())`. */
export const SCRIPT_DO_TEMA = `(function(){try{var t=localStorage.getItem("${CHAVE_DO_TEMA}");if(t==="claro"||t==="escuro")document.documentElement.setAttribute("data-tema",t)}catch(e){}})()`;

const CONSULTA_ESCURO = "(prefers-color-scheme: dark)";

function temaGuardado(): Tema {
  try {
    const t = localStorage.getItem(CHAVE_DO_TEMA);
    return t === "claro" || t === "escuro" ? t : "sistema";
  } catch {
    return "sistema";
  }
}

function aplicarTema(tema: Tema) {
  const html = document.documentElement;
  if (tema === "sistema") html.removeAttribute("data-tema");
  else html.setAttribute("data-tema", tema);
}

/** O tema em vigor, lido do <html>: vale mesmo quando o armazenamento está bloqueado. */
export function temaAtual(): Tema {
  const t = document.documentElement.getAttribute("data-tema");
  return t === "claro" || t === "escuro" ? t : "sistema";
}

/** Se a página está escura agora, pela escolha ou pelo sistema. */
export function escuroAgora(): boolean {
  const tema = temaAtual();
  return tema === "escuro" || (tema === "sistema" && window.matchMedia(CONSULTA_ESCURO).matches);
}

const ouvintes = new Set<() => void>();

/** Troca o tema na hora e guarda a escolha. Sem acesso ao armazenamento, a troca vale até sair da página. */
export function escolherTema(tema: Tema) {
  try {
    if (tema === "sistema") localStorage.removeItem(CHAVE_DO_TEMA);
    else localStorage.setItem(CHAVE_DO_TEMA, tema);
  } catch {
    // Navegação privada ou armazenamento bloqueado: o tema troca do mesmo jeito.
  }
  aplicarTema(tema);
  ouvintes.forEach((f) => f());
}

/** Para o `useSyncExternalStore`: avisa quando a escolha, outra aba ou o sistema mudam o tema. */
export function assinarTema(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  const aoGuardar = (e: StorageEvent) => {
    if (e.key !== CHAVE_DO_TEMA && e.key !== null) return;
    aplicarTema(temaGuardado());
    aoMudar();
  };
  // Seguindo o sistema, ele pode trocar com a página aberta (ao anoitecer, por exemplo).
  const sistema = window.matchMedia(CONSULTA_ESCURO);
  window.addEventListener("storage", aoGuardar);
  sistema.addEventListener("change", aoMudar);
  return () => {
    ouvintes.delete(aoMudar);
    window.removeEventListener("storage", aoGuardar);
    sistema.removeEventListener("change", aoMudar);
  };
}
