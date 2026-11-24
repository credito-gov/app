import { existsSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as esperar } from "node:timers/promises";
import { executar } from "./cli.js";
import { relogioReal } from "./relogio.js";

// Ponto de entrada: carrega o .env, lê os argumentos e define o código de saída.
const raiz = join(import.meta.dirname, "..");
const argv = process.argv.slice(2);

if (argv[0] === "consulta") {
  const arquivoEnv = join(raiz, ".env");
  if (!existsSync(arquivoEnv)) {
    console.log("Arquivo .env não encontrado: crie o .env a partir do .env.example (preencha no editor) e rode de novo.");
    process.exitCode = 2;
  } else {
    process.loadEnvFile(arquivoEnv);
  }
}

if (process.exitCode === undefined) {
  process.exitCode = await executar(argv, {
    env: process.env,
    fetch: globalThis.fetch,
    relogio: relogioReal,
    dormir: (ms) => esperar(ms),
    saida: { escrever: (linha) => console.log(linha) },
    pastaLocal: join(raiz, ".local"),
  });
}
