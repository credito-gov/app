// Lista de senhas comuns (CA-14, R-5).
//
// Origem: dicionário "passwords-common" do pacote npm @zxcvbn-ts/language-common,
// versão 4.2.0, licença MIT (https://github.com/zxcvbn-ts/zxcvbn).
// Filtro aplicado: só as senhas com 12 caracteres ou mais (a regra mínima da
// senha), comparadas em minúsculas. As menores já são recusadas pelo tamanho.
// Fonte indicada pelo responsável em 2026-11-27.
import { dictionary } from "@zxcvbn-ts/language-common";

const MINIMO = 12;

export const senhasComuns: ReadonlySet<string> = new Set(
  dictionary["passwords-common"]
    .map((s) => String(s).normalize("NFC").toLowerCase())
    .filter((s) => [...s].length >= MINIMO),
);
