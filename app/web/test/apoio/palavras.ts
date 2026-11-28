// Palavras que nenhum texto do dashboard pode usar (CA-2, CA-4) e a busca sem diferenciar acento nem caixa.

/** Sem acento: "disponivel" também pega "indisponivel". */
export const PROIBIDAS = ["disponivel", "pode usar", "confirmado", "a receber", "garantido"];
export const PROIBIDAS_RECOLHIMENTO = ["nao recolheu", "deixou de recolher", "inadimplente"];

/** Minúsculas e sem acento, para a busca de palavras proibidas. */
export const simples = (t: string): string =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
