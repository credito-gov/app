import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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
  registrar(entrada: EntradaRegistro): void;
  contarAberturas(servico: string, dia: Date): { total: number; aceitas: number };
  pedidosDeTokenDesde(instante: Date): Date[];
  primeiraAbertura(tiquete: string): Date | undefined;
}

export function criarRegistro(opcoes: { pastaLocal: string; relogio: Relogio }): Registro {
  const arquivo = join(opcoes.pastaLocal, "chamadas.jsonl");

  const ler = (): Linha[] => {
    if (!existsSync(arquivo)) return [];
    return readFileSync(arquivo, "utf8")
      .split("\n")
      .filter((l) => l.trim() !== "")
      .map((l) => JSON.parse(l) as Linha);
  };

  const mesmoDia = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return {
    registrar(entrada) {
      // Só os cinco campos documentados: nada de token, credencial, urlAssinada ou corpo.
      const linha: Linha = {
        quando: isoLocal(opcoes.relogio.agora()),
        servico: entrada.servico,
        tipo: entrada.tipo,
        http: entrada.http,
        tiquete: entrada.tiquete ?? null,
      };
      mkdirSync(opcoes.pastaLocal, { recursive: true });
      appendFileSync(arquivo, `${JSON.stringify(linha)}\n`);
    },

    contarAberturas(servico, dia) {
      let total = 0;
      let aceitas = 0;
      for (const l of ler()) {
        if (l.tipo !== "abertura" || l.servico !== servico) continue;
        if (!mesmoDia(new Date(l.quando), dia)) continue;
        total += 1;
        if (l.http !== null && l.http >= 200 && l.http < 300) aceitas += 1;
      }
      return { total, aceitas };
    },

    pedidosDeTokenDesde(instante) {
      return ler()
        .filter((l) => l.tipo === "token")
        .map((l) => new Date(l.quando))
        .filter((d) => d.getTime() >= instante.getTime())
        .sort((a, b) => a.getTime() - b.getTime());
    },

    primeiraAbertura(tiquete) {
      const linha = ler().find((l) => l.tipo === "abertura" && l.tiquete === tiquete);
      return linha ? new Date(linha.quando) : undefined;
    },
  };
}
