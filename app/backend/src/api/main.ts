// Ponto de entrada da API: único lugar que lê process.env.
import { join } from "node:path";
import { abrirKysely } from "../banco/conexao.js";
import { ErroPapel, verificarPapelDoBanco } from "../banco/papel.js";
import { criarBanco } from "../banco/transacao.js";
import { carregarConfig, ErroConfig } from "../config.js";
import { criarEnvioEmail } from "../email/fabrica.js";
import { descreverErro } from "../erro.js";
import { criarServidor } from "./servidor.js";

let config;
try {
  config = carregarConfig(process.env);
} catch (e) {
  console.error(e instanceof ErroConfig ? e.message : `Configuração inválida. ${descreverErro(e)}`);
  process.exit(1);
}

const banco = criarBanco(abrirKysely(config.bancoUrl));
try {
  await verificarPapelDoBanco(banco);
} catch (e) {
  console.error(e instanceof ErroPapel ? e.message : `Não foi possível conferir o papel do banco. ${descreverErro(e)}`);
  await banco.encerrar().catch(() => undefined);
  process.exit(1);
}
const email = criarEnvioEmail(config.email, {
  pastaArquivo: join(process.cwd(), ".local", "emails"),
});
const app = await criarServidor({ config, banco, email });

const encerrar = async () => {
  let codigo = 0;
  try {
    await app.close();
    await banco.encerrar();
  } catch (e) {
    console.error(`Falha ao encerrar. ${descreverErro(e)}`);
    codigo = 1;
  }
  process.exit(codigo);
};
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);

await app.listen({ host: "127.0.0.1", port: config.apiPorta });
