import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ErroLocal, codigoDoErro } from "./erros.js";
import { isoLocal, type Relogio } from "./relogio.js";

export type TipoChamada = "token" | "abertura" | "situacao" | "download" | "arquivo";

export interface EntradaRegistro {
  servico: string;
  tipo: TipoChamada;
  /** Código HTTP; null se não houve resposta (rede, tempo esgotado). */
  http: number | null;
  /** Tíquete, quando houver; null no token e numa abertura sem tíquete. */
  tiquete: string | null;
}

interface Linha extends EntradaRegistro {
  quando: string;
}

export interface Registro {
  /** Confere que dá para gravar em .local/ (pasta e chamadas.jsonl); lança ErroLocal se não der. Não faz chamada nenhuma. */
  verificarEscrita(): void;
  /** Nunca lança: falha de gravação depois de uma chamada já feita vira aviso. */
  registrar(entrada: EntradaRegistro): void;
  contarAberturas(servico: string, dia: Date): { total: number; aceitas: number };
  pedidosDeTokenDesde(instante: Date): Date[];
  /** Números das linhas ilegíveis (ou com data inválida) que entram na contagem de pedidos de token desde o instante. */
  linhasIlegiveisDesde(instante: Date): number[];
  primeiraAbertura(tiquete: string): Date | undefined;
}

/** Uma linha do arquivo, lida sem lançar. `quando` e `dados` ficam ausentes se a linha não vale. */
interface LinhaLida {
  numero: number;
  dados?: Linha;
  quando?: Date;
  /** Instante usado nas contagens: `quando`, ou, sem data válida, a data de modificação do arquivo. */
  contadaEm: Date;
  ilegivel: boolean;
}

export function criarRegistro(opcoes: { pastaLocal: string; relogio: Relogio; avisar?: (texto: string) => void }): Registro {
  const arquivo = join(opcoes.pastaLocal, "chamadas.jsonl");
  const avisados = new Set<string>();
  const avisarUmaVez = (chave: string, texto: string): void => {
    if (avisados.has(chave)) return;
    avisados.add(chave);
    opcoes.avisar?.(texto);
  };

  const ler = (): LinhaLida[] => {
    if (!existsSync(arquivo)) return [];
    let texto: string;
    try {
      texto = readFileSync(arquivo, "utf8");
    } catch (e) {
      avisarUmaVez(
        "leitura",
        `Aviso: não foi possível ler chamadas.jsonl (${codigoDoErro(e)}); as contagens de aberturas e de pedidos de token podem estar menores que as reais.`,
      );
      return [];
    }
    // Lida uma vez por leitura: a linha sem data válida vale a data de modificação do arquivo (finita; envelhece).
    let modificadoEm: Date;
    try {
      modificadoEm = statSync(arquivo).mtime;
    } catch {
      modificadoEm = opcoes.relogio.agora();
    }
    const saida: LinhaLida[] = [];
    texto.split(/\r?\n/).forEach((bruta, indice) => {
      if (bruta.trim() === "") return;
      const numero = indice + 1;
      let dados: Linha | undefined;
      try {
        const lido: unknown = JSON.parse(bruta);
        if (lido && typeof lido === "object" && !Array.isArray(lido)) dados = lido as Linha;
      } catch {
        // linha ilegível: tratada abaixo
      }
      const quando = dados && typeof dados.quando === "string" ? new Date(dados.quando) : undefined;
      const valida = quando !== undefined && !Number.isNaN(quando.getTime());
      if (!dados || !valida) {
        avisarUmaVez(
          `linha-${numero}`,
          `Aviso: linha ${numero} de chamadas.jsonl ilegível ou com data inválida; foi contada como chamada feita, na data de modificação do arquivo. Para tirá-la da contagem, corrija ou apague a linha ${numero} de .local/chamadas.jsonl.`,
        );
      }
      saida.push({ numero, dados, quando: valida ? quando : undefined, contadaEm: valida ? quando : modificadoEm, ilegivel: !dados || !valida });
    });
    return saida;
  };

  const mesmoDia = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return {
    verificarEscrita() {
      try {
        mkdirSync(opcoes.pastaLocal, { recursive: true });
        appendFileSync(arquivo, "");
        // Em alguns sistemas abrir uma pasta em acréscimo não falha; chamadas.jsonl tem de ser arquivo.
        if (!statSync(arquivo).isFile()) throw Object.assign(new Error("não é arquivo"), { code: "EISDIR" });
      } catch (e) {
        throw new ErroLocal(
          `Não foi possível gravar em ${arquivo} (${codigoDoErro(e)}). Nenhuma chamada foi feita: sem o registro, o limite de aberturas e de tokens não poderia ser controlado. Corrija a pasta e rode de novo.`,
        );
      }
    },

    registrar(entrada) {
      // Só os cinco campos documentados: nada de token, credencial, urlAssinada ou corpo.
      const linha: Linha = {
        quando: isoLocal(opcoes.relogio.agora()),
        servico: entrada.servico,
        tipo: entrada.tipo,
        http: entrada.http,
        tiquete: entrada.tiquete ?? null,
      };
      try {
        mkdirSync(opcoes.pastaLocal, { recursive: true });
        appendFileSync(arquivo, `${JSON.stringify(linha)}\n`);
      } catch (e) {
        avisarUmaVez(
          "gravacao",
          `Aviso: não foi possível gravar o registro de chamadas (${codigoDoErro(e)}). A chamada já foi feita e conta no limite, mas ficou fora de chamadas.jsonl; as contagens deste computador ficarão menores que as reais.`,
        );
      }
    },

    contarAberturas(servico, dia) {
      let total = 0;
      let aceitas = 0;
      for (const l of ler()) {
        // modo conservador: linha ilegível conta como abertura feita, no dia em que o arquivo foi modificado
        if (l.dados && (l.dados.tipo !== "abertura" || l.dados.servico !== servico)) continue;
        if (!mesmoDia(l.contadaEm, dia)) continue;
        total += 1;
        if (l.dados && l.dados.http !== null && l.dados.http >= 200 && l.dados.http < 300) aceitas += 1;
      }
      return { total, aceitas };
    },

    pedidosDeTokenDesde(instante) {
      const instantes: Date[] = [];
      for (const l of ler()) {
        if (l.dados && l.dados.tipo !== "token") continue;
        if (l.contadaEm.getTime() >= instante.getTime()) instantes.push(l.contadaEm);
      }
      return instantes.sort((a, b) => a.getTime() - b.getTime());
    },

    linhasIlegiveisDesde(instante) {
      return ler()
        .filter((l) => l.ilegivel && (!l.dados || l.dados.tipo === "token") && l.contadaEm.getTime() >= instante.getTime())
        .map((l) => l.numero);
    },

    primeiraAbertura(tiquete) {
      const linha = ler().find((l) => l.dados?.tipo === "abertura" && l.dados.tiquete === tiquete && l.quando);
      return linha?.quando;
    },
  };
}
