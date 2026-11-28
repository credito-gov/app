// npm run admin -- <comando> [opções]. Único lugar do admin que lê process.env.
import { join } from "node:path";
import { parseArgs } from "node:util";
import { abrirKysely } from "../banco/conexao.js";
import { criarBanco } from "../banco/transacao.js";
import { carregarConfig, ErroConfig } from "../config.js";
import { criarEnvioEmail } from "../email/fabrica.js";
import { descreverErro } from "../erro.js";
import { ErroPapel, verificarPapelDoBanco } from "../banco/papel.js";
import { criarComandosAdmin, ErroAdmin } from "./comandos.js";

const USO = `Uso: npm run admin -- <comando> [opções]
  criar-empresa --cnpj-raiz <8 dígitos> --nome <nome>
  convidar --empresa <id> --email <e-mail> --papel <titular|contador>
  empresas-do-usuario --email <e-mail>
  remover-vinculo --empresa <id> --email <e-mail>
  carregar-cenario --empresa <id> --cenario <nome>   (só com CREDITOGOV_AMBIENTE=local; dados fictícios)`;

function falhar(mensagem: string): never {
  console.error(mensagem);
  process.exit(1);
}

const { positionals, values } = (() => {
  try {
    return parseArgs({
      allowPositionals: true,
      options: {
        "cnpj-raiz": { type: "string" },
        nome: { type: "string" },
        empresa: { type: "string" },
        email: { type: "string" },
        papel: { type: "string" },
        cenario: { type: "string" },
      },
    });
  } catch (e) {
    return falhar(`${(e as Error).message}\n${USO}`);
  }
})();

const comando = positionals[0];
if (!comando) falhar(USO);

let config;
try {
  config = carregarConfig(process.env);
} catch (e) {
  falhar(e instanceof ErroConfig ? e.message : "Configuração inválida.");
}

const banco = criarBanco(abrirKysely(config.bancoUrl, { max: 2 }));
try {
  await verificarPapelDoBanco(banco);
} catch (e) {
  await banco.encerrar().catch(() => undefined);
  falhar(e instanceof ErroPapel ? e.message : `Não foi possível conferir o papel do banco. ${descreverErro(e)}`);
}
const admin = criarComandosAdmin({
  banco,
  email: criarEnvioEmail(config.email, { pastaArquivo: join(process.cwd(), ".local", "emails") }),
  relogio: () => new Date(),
  config,
  // O terminal do operador vê só o aviso de retorno recusado (identificadores e caminhos, nunca o conteúdo).
  log: { info() {}, warn: (objeto) => console.error(JSON.stringify({ nivel: "aviso", ...objeto })) },
});

const exigir = (nome: keyof typeof values): string => {
  const v = values[nome];
  if (!v) falhar(`Falta a opção --${nome}.\n${USO}`);
  return v;
};

let codigo = 0;
try {
  let saida: string;
  switch (comando) {
    case "criar-empresa":
      saida = (await admin.criarEmpresa({ cnpjRaiz: exigir("cnpj-raiz"), nome: exigir("nome") })).saida;
      break;
    case "convidar":
      saida = (
        await admin.convidar({ empresaId: exigir("empresa"), email: exigir("email"), papel: exigir("papel") })
      ).saida;
      break;
    case "empresas-do-usuario":
      saida = (await admin.empresasDoUsuario({ email: exigir("email") })).saida;
      break;
    case "remover-vinculo":
      saida = (await admin.removerVinculo({ empresaId: exigir("empresa"), email: exigir("email") })).saida;
      break;
    case "carregar-cenario":
      saida = (await admin.carregarCenario({ empresaId: exigir("empresa"), cenario: exigir("cenario") })).saida;
      break;
    default:
      throw new ErroAdmin(`Comando desconhecido: ${comando}\n${USO}`);
  }
  console.log(saida);
} catch (e) {
  // Terminal do operador: mostra name, code e message do erro que não é do comando.
  console.error(e instanceof ErroAdmin ? e.message : `Falha ao executar o comando. ${descreverErro(e)}`);
  codigo = 1;
} finally {
  await banco.encerrar();
}
process.exit(codigo);
