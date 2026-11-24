// Gera, de forma determinística, os dois arquivos fictícios de volume de dados/ficticios/ (CA-10, CA-17, CA-D3).
// Sem Math.random e sem data do sistema: um gerador congruencial com semente fixa. Nada aqui é dado real:
// CNPJ com dígito verificador errado de propósito, chaves de 44 posições com UF 99 e DV correto.
//
// Uso: npm run gerar-ficticios            (escreve em dados/ficticios/)
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ARQUIVO_CREDITOS = "20261118T100000Z_creditos_FICTVOL01.json";
export const ARQUIVO_DEBITOS = "20261120T120000Z_debitos_FICTVOL02.json";

const RAIZ = "90817263";

// ---------- serialização com número JSON escrito como texto (0, 1 ou 2 casas) ----------

class Num {
  texto: string;
  constructor(texto: string) {
    this.texto = texto;
  }
}

function serializar(valor: unknown, nivel = 0): string {
  const recuo = "  ".repeat(nivel + 1);
  const fecha = "  ".repeat(nivel);
  if (valor instanceof Num) return valor.texto;
  if (Array.isArray(valor)) {
    return valor.length === 0 ? "[]" : `[\n${valor.map((v) => recuo + serializar(v, nivel + 1)).join(",\n")}\n${fecha}]`;
  }
  if (valor !== null && typeof valor === "object") {
    const entradas = Object.entries(valor).filter(([, v]) => v !== undefined);
    if (entradas.length === 0) return "{}";
    return `{\n${entradas.map(([k, v]) => `${recuo}${JSON.stringify(k)}: ${serializar(v, nivel + 1)}`).join(",\n")}\n${fecha}}`;
  }
  return JSON.stringify(valor);
}

/** Centavos como número JSON, com os zeros à direita cortados (O-13). */
function dinheiro(centavos: number): Num {
  const sinal = centavos < 0 ? "-" : "";
  const c = Math.abs(centavos);
  const inteiro = Math.floor(c / 100);
  const resto = c % 100;
  if (resto === 0) return new Num(`${sinal}${inteiro}`);
  if (resto % 10 === 0) return new Num(`${sinal}${inteiro}.${resto / 10}`);
  return new Num(`${sinal}${inteiro}.${String(resto).padStart(2, "0")}`);
}

// ---------- gerador pseudoaleatório com semente fixa ----------

function criarSorteio(semente: number) {
  let estado = semente >>> 0;
  const proximo = () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado;
  };
  return {
    /** Inteiro de 0 a limite - 1. */
    inteiro: (limite: number) => Math.floor((proximo() / 4294967296) * limite),
  };
}

// ---------- identificadores fictícios ----------

function digitos(texto: string): number[] {
  return [...texto].map((c) => c.charCodeAt(0) - 48);
}

function dvCnpj(base: number[]): number {
  const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const resto = base.reduce((acc, d, i) => acc + d * pesos[i], 0) % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** CNPJ com o último dígito verificador errado de propósito: nunca é um CNPJ válido. */
function cnpjFicticio(base12: string): string {
  const d = digitos(base12);
  const d1 = dvCnpj(d);
  const d2 = dvCnpj([...d, d1]);
  return `${base12}${d1}${(d2 + 1) % 10}`;
}

function dvChave(base43: string): string {
  let soma = 0;
  let peso = 2;
  for (let i = base43.length - 1; i >= 0; i--) {
    soma += (base43.charCodeAt(i) - 48) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return String(resto < 2 ? 0 : 11 - resto);
}

function chave44(aamm: string, emitente: string, modelo: string, serie: string, sequencia: number): string {
  const numero = String(sequencia % 1000000000).padStart(9, "0");
  const codigo = String(50000000 + sequencia).slice(-8);
  const base = `99${aamm}${emitente}${modelo}${serie}${numero}1${codigo}`;
  return base + dvChave(base);
}

function chave50(sequencia: number): string {
  return `99${String(500000000000 + sequencia).padStart(12, "0")}${"5".repeat(18)}${String(100000000000000000 + sequencia)}`.slice(0, 50);
}

const NI14 = cnpjFicticio(`${RAIZ}0001`);

// ---------- datas ----------

const pad = (n: number, t = 2) => String(n).padStart(t, "0");
const fracao = (sorteio: number, casas: number) => (casas === 0 ? "" : `.${pad(sorteio % 10 ** casas, casas)}`);

function dataHora(ano: number, mes: number, dia: number, hora: number, minuto: number, segundo: number, casas: number, sorteio: number): string {
  return `${ano}-${pad(mes)}-${pad(dia)}T${pad(hora)}:${pad(minuto)}:${pad(segundo)}${fracao(sorteio, casas)}-03:00`;
}

// ---------- créditos ----------

const DOCUMENTOS_CREDITO: Array<[number, number]> = [
  [55, 207],
  [57, 551],
  [62, 3],
  [65, 3],
  [91, 132],
];

// 896 créditos: 878 em 11/2026 e os demais, de 1 a 5 cada, em outros oito períodos.
const OUTROS_PERIODOS: Array<[number, number]> = [
  [1, 2],
  [2, 1],
  [3, 3],
  [4, 2],
  [5, 1],
  [7, 4],
  [9, 3],
  [12, 2],
];

interface PlanoCredito {
  mes: number;
  documento: number;
}

function planejarCreditos(sorteio: ReturnType<typeof criarSorteio>): PlanoCredito[] {
  const documentos: number[] = [];
  for (const [documento, quantidade] of DOCUMENTOS_CREDITO) for (let i = 0; i < quantidade; i++) documentos.push(documento);
  // Embaralhamento determinístico (Fisher-Yates com a semente fixa).
  for (let i = documentos.length - 1; i > 0; i--) {
    const j = sorteio.inteiro(i + 1);
    [documentos[i], documentos[j]] = [documentos[j], documentos[i]];
  }
  const meses: number[] = [];
  for (const [mes, quantidade] of OUTROS_PERIODOS) for (let i = 0; i < quantidade; i++) meses.push(mes);
  while (meses.length < documentos.length) meses.push(11);
  for (let i = meses.length - 1; i > 0; i--) {
    const j = sorteio.inteiro(i + 1);
    [meses[i], meses[j]] = [meses[j], meses[i]];
  }
  return documentos.map((documento, i) => ({ documento, mes: meses[i] }));
}

function gerarCreditos(): string {
  const sorteio = criarSorteio(2026);
  const plano = planejarCreditos(sorteio);
  const emitentes = Array.from({ length: 125 }, (_, i) => cnpjFicticio(`${20000000 + i * 137}0001`));
  const porPeriodo = new Map<number, Array<Record<string, unknown>>>();

  plano.forEach(({ documento, mes }, i) => {
    // Perfil do valor: 9 só apropriados (apropriado = utilizado), 3 com os dois, o resto só a apropriar (O-10, O-12).
    const perfil = i % 100 === 7 ? "so-apropriado" : i === 11 || i === 333 || i === 600 ? "parcial" : "a-apropriar";
    const base = 500 + sorteio.inteiro(500000);
    // Emissão no mês do período, exceto em seis notas (3 antes e 3 depois, O-14). Nada passa de novembro de 2026:
    // a emissão depois do mês do período só existe até 10/2026, e o período 12/2026 tem emissão antes dele.
    let mesEmissao = mes;
    let anoEmissao = 2026;
    if (i % 150 === 3 && i < 450) {
      mesEmissao = mes === 1 ? 12 : mes - 1;
      anoEmissao = mes === 1 ? 2025 : 2026;
    } else if (i % 150 === 4 && i < 450 && mes <= 10) {
      mesEmissao = mes + 1;
    } else if (mes === 12) {
      mesEmissao = 11;
    }
    // Em novembro (mês da geração) os dias vão só até o 3, para o registro caber antes das atualizações.
    const dia = 1 + sorteio.inteiro(mesEmissao === 11 && anoEmissao === 2026 ? 3 : 28);
    // Datas em ordem: emissão de manhã, registro à tarde do mesmo dia, atualização nos dias 4 a 17 de novembro e geradoEm no dia 18.
    const emissao = dataHora(anoEmissao, mesEmissao, dia, sorteio.inteiro(12), sorteio.inteiro(60), sorteio.inteiro(60), 0, 0);
    const registro = dataHora(anoEmissao, mesEmissao, dia, 12 + sorteio.inteiro(12), sorteio.inteiro(60), sorteio.inteiro(60), 3 + (i % 4), sorteio.inteiro(1000000));
    const atualizacao = dataHora(2026, 11, 4 + sorteio.inteiro(14), sorteio.inteiro(24), sorteio.inteiro(60), sorteio.inteiro(60), i % 4, sorteio.inteiro(1000));

    const modelo = String(documento);
    let chave: string;
    if (documento === 91) chave = chave50(i);
    else {
      // Uma nota (a de índice 100) tem como emitente a própria empresa (O-16).
      const emitente = i === 100 ? NI14 : emitentes[sorteio.inteiro(emitentes.length)];
      const serie = pad(1 + sorteio.inteiro(3), 3);
      chave = chave44(`26${pad(mesEmissao)}`, emitente, modelo, serie, i);
    }

    let aApropriar: number | undefined;
    let apropriado: number | undefined;
    let utilizado: number | undefined;
    if (perfil === "so-apropriado") {
      apropriado = base;
      utilizado = base;
    } else if (perfil === "parcial") {
      apropriado = Math.floor(base / 2);
      aApropriar = base - apropriado;
      utilizado = apropriado;
    } else {
      aApropriar = base;
    }
    const apurado = (aApropriar ?? 0) + (apropriado ?? 0);

    const credito = {
      origem: 0,
      documento,
      chave,
      emissao,
      registro,
      atualizacao,
      cbs: {
        apurado: dinheiro(apurado),
        apropriacao: {
          aApropriar: aApropriar === undefined ? undefined : dinheiro(aApropriar),
          apropriado: apropriado === undefined ? undefined : dinheiro(apropriado),
          utilizacao: {
            utilizado: utilizado === undefined ? undefined : dinheiro(utilizado),
            naoUtilizado: { saldoCredor: dinheiro(0) },
          },
        },
      },
    };
    const lista = porPeriodo.get(mes) ?? [];
    lista.push(credito);
    porPeriodo.set(mes, lista);
  });

  const apuracao = [...porPeriodo.entries()].sort(([a], [b]) => a - b).map(([mes, creditos]) => ({ pa: `${pad(mes)}/2026`, creditos }));
  return serializar({
    tiqueteSolicitacao: "FICTVOL01",
    ni: NI14,
    niConsumidor: NI14,
    geradoEm: "2026-11-18T10:00:00.000-03:00",
    apuracao,
  });
}

// ---------- débitos ----------

const PERIODOS_DEBITO: Array<[number, number]> = [
  [1, 103],
  [10, 1515],
  [11, 1168],
];

function gerarDebitos(): string {
  const sorteio = criarSorteio(2027);
  const mesmaRaiz = [2, 3, 4, 5].map((sufixo) => cnpjFicticio(`${RAIZ}${pad(sufixo, 4)}`));
  const outraRaiz = cnpjFicticio("554433220001");
  const apuracao = [];
  let sequencia = 0;
  for (const [mes, quantidade] of PERIODOS_DEBITO) {
    const debitos = [];
    for (let k = 0; k < quantidade; k++, sequencia++) {
      const documento = sequencia % 28 === 5 ? 91 : 55;
      const dia = 1 + sorteio.inteiro(17);
      const emissao = dataHora(2026, mes, dia, sorteio.inteiro(12), sorteio.inteiro(60), sorteio.inteiro(60), 0, 0);
      const registro = dataHora(2026, mes, dia, 12 + sorteio.inteiro(12), sorteio.inteiro(60), sorteio.inteiro(60), 3 + (sequencia % 4), sorteio.inteiro(1000000));
      const atualizacao = dataHora(2026, 11, 18 + sorteio.inteiro(2), sorteio.inteiro(24), sorteio.inteiro(60), sorteio.inteiro(60), sequencia % 4, sorteio.inteiro(1000));

      let chave: string;
      if (documento === 91) chave = chave50(1000 + sequencia);
      else {
        // Mistura de estabelecimentos (O-23): a maioria com o CNPJ da empresa, um quarto de outro estabelecimento da raiz, um de outra raiz.
        const sorte = sorteio.inteiro(100);
        const emitente = sequencia === 777 ? outraRaiz : sorte < 77 ? NI14 : mesmaRaiz[sorteio.inteiro(mesmaRaiz.length)];
        chave = chave44(`26${pad(mes)}`, emitente, "55", pad(1 + sorteio.inteiro(3), 3), 100000 + sequencia);
      }

      const apurado = 1000 + sorteio.inteiro(900000);
      // 99,9% com saldo devedor integral: quatro com extinto, três deles quitados (extinto = apurado).
      let extinto: number | undefined;
      if (sequencia === 10 || sequencia === 500 || sequencia === 1200) extinto = apurado;
      else if (sequencia === 2000) extinto = Math.floor(apurado / 3);
      const saldoDevedor = apurado - (extinto ?? 0);
      debitos.push({
        origem: 0,
        documento,
        chave,
        emissao,
        registro,
        atualizacao,
        cbs: {
          apurado: dinheiro(apurado),
          extinto: extinto === undefined ? undefined : dinheiro(extinto),
          saldoDevedor: dinheiro(saldoDevedor),
        },
      });
    }
    apuracao.push({ pa: `${pad(mes)}/2026`, debitos });
  }
  return serializar({
    tiqueteSolicitacao: "FICTVOL02",
    ni: NI14,
    niConsumidor: NI14,
    geradoEm: "2026-11-20T12:00:00.000-03:00",
    apuracao,
  });
}

/** Escreve os dois arquivos de volume em `destino` e devolve os nomes. */
export async function gerar(destino: string): Promise<string[]> {
  await mkdir(destino, { recursive: true });
  await writeFile(join(destino, ARQUIVO_CREDITOS), gerarCreditos());
  await writeFile(join(destino, ARQUIVO_DEBITOS), gerarDebitos());
  return [ARQUIVO_CREDITOS, ARQUIVO_DEBITOS];
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const destino = join(dirname(fileURLToPath(import.meta.url)), "..", "dados", "ficticios");
  const escritos = await gerar(destino);
  console.log(`Gerados em ${destino}: ${escritos.join(", ")}`);
}
