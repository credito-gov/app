// Ponto de entrada da API: único lugar que lê process.env.
import { join } from "node:path";
import { abrirKysely } from "../banco/conexao.js";
import { criarBanco } from "../banco/transacao.js";
import { carregarConfig, ErroConfig } from "../config.js";
import { criarEnvioEmail } from "../email/fabrica.js";
import { criarServidor } from "./servidor.js";

let config;
try {
  config = carregarConfig(process.env);
} catch (e) {
  console.error(e instanceof ErroConfig ? e.message : "Configuração inválida.");
  process.exit(1);
}

const banco = criarBanco(abrirKysely(config.bancoUrl));
const email = criarEnvioEmail(config.email, {
  pastaArquivo: join(process.cwd(), ".local", "emails"),
});
const app = await criarServidor({ config, banco, email });

const encerrar = async () => {
  await app.close();
  await banco.encerrar();
  process.exit(0);
};
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);

await app.listen({ host: "127.0.0.1", port: config.apiPorta });
