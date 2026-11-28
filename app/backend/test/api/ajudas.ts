// Auxiliares dos testes da API: servidor com relógio falso, e-mail em memória e
// verificador espião, sobre o banco de teste. Nenhum dado real.
import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import { sql } from "kysely";
import { vi } from "vitest";
import type { Writable } from "node:stream";
import { criarServidor, type Servidor } from "../../src/api/servidor.js";
import { gerarHash, verificar, type Verificador } from "../../src/autenticacao/senha.js";
import { abrirKysely } from "../../src/banco/conexao.js";
import type { Esquema, Papel } from "../../src/banco/esquema.js";
import { criarBanco, type Banco } from "../../src/banco/transacao.js";
import { carregarConfig, type Config } from "../../src/config.js";
import { criarEmailMemoria, type EnvioEmailMemoria } from "../../src/email/memoria.js";
import { abrirComoMigracao, limparTabelas, semear } from "../banco/limpar.js";
import { URL_APP } from "../banco/urls.js";


export const SEGREDO = "segredo-ficticio-da-api-com-mais-de-32-bytes";
export const WEB_URL = "http://localhost:5173";
export const CUSTO_BAIXO = { memoryCost: 1024, timeCost: 1, parallelism: 1 };
export const SENHA_BOA = "senha ficticia boa 2026";
export const COOKIE = "cg_sessao";
export const MIN = 60_000;
export const HORA = 60 * MIN;

export interface Relogio {
  agora(): Date;
  avancar(ms: number): void;
  fixar(data: Date): void;
}

export interface Resposta {
  status: number;
  corpo: any;
  texto: string;
  headers: Record<string, string | string[] | number | undefined>;
  /** Valor do cookie de sessão enviado em Set-Cookie (vazio se expirou). */
  cookie: string | null;
  setCookie: string[];
}

export interface Opcoes {
  corpo?: unknown;
  cookie?: string | null;
  headers?: Record<string, string>;
  semCabecalho?: boolean;
  ip?: string;
}

export interface Contexto {
  app: Servidor;
  config: Config;
  banco: Banco;
  email: EnvioEmailMemoria;
  relogio: Relogio;
  verificador: ReturnType<typeof vi.fn<Verificador>>;
  migracao: Kysely<Esquema>;
  req(metodo: string, url: string, opcoes?: Opcoes): Promise<Resposta>;
  login(email: string, senha?: string, opcoes?: Opcoes): Promise<Resposta>;
  criarUsuario(email: string, nome?: string, senha?: string): Promise<string>;
  criarEmpresa(nome: string, raiz: string): Promise<string>;
  vincular(empresaId: string, usuarioId: string, papel: Papel): Promise<void>;
  /** Cria usuário, entra e devolve o cookie. */
  sessaoDe(email: string, senha?: string): Promise<string>;
  encerrar(): Promise<void>;
}

export async function criarContexto(opcoes: { log?: { stream: Writable } } = {}): Promise<Contexto> {
  const migracao = abrirComoMigracao();
  await limparTabelas(migracao);
  const db = abrirKysely(URL_APP);
  const banco = criarBanco(db);
  const config = carregarConfig({
    CREDITOGOV_AMBIENTE: "local",
    CREDITOGOV_BANCO_URL: URL_APP,
    CREDITOGOV_SESSAO_SEGREDO: SEGREDO,
    CREDITOGOV_WEB_URL: WEB_URL,
    CREDITOGOV_EMAIL: "memoria",
  });
  const email = criarEmailMemoria();
  let agora = new Date("2026-12-01T12:00:00Z");
  const relogio: Relogio = {
    agora: () => agora,
    avancar: (ms) => {
      agora = new Date(agora.getTime() + ms);
    },
    fixar: (d) => {
      agora = d;
    },
  };
  const verificador = vi.fn<Verificador>(verificar);
  const app = await criarServidor({
    config,
    banco,
    email,
    relogio: () => relogio.agora(),
    verificador,
    custoHash: CUSTO_BAIXO,
    log: opcoes.log ?? false,
  });

  const req: Contexto["req"] = async (metodo, url, o = {}) => {
    const headers: Record<string, string> = { ...(o.headers ?? {}) };
    if (!o.semCabecalho && !["GET", "HEAD", "OPTIONS"].includes(metodo)) {
      headers["x-creditogov-requisicao"] = "1";
    }
    if (o.cookie) headers["cookie"] = `${COOKIE}=${o.cookie}`;
    const payload = o.corpo === undefined ? undefined : JSON.stringify(o.corpo);
    if (payload !== undefined) headers["content-type"] = "application/json";
    const r = await app.inject({
      method: metodo as "GET",
      url,
      headers,
      payload,
      remoteAddress: o.ip,
    });
    let corpo: unknown = undefined;
    try {
      corpo = r.body ? JSON.parse(r.body) : undefined;
    } catch {
      corpo = undefined;
    }
    const bruto = r.headers["set-cookie"];
    const setCookie = bruto === undefined ? [] : Array.isArray(bruto) ? bruto : [bruto];
    const linha = setCookie.find((c) => c.startsWith(`${COOKIE}=`));
    const cookie = linha ? (linha.split(";")[0] ?? "").slice(COOKIE.length + 1) : null;
    return { status: r.statusCode, corpo, texto: r.body, headers: r.headers, cookie, setCookie };
  };

  const ctx: Contexto = {
    app,
    config,
    banco,
    email,
    relogio,
    verificador,
    migracao,
    req,
    login: (e, senha = SENHA_BOA, o = {}) => req("POST", "/api/sessao", { ...o, corpo: { email: e, senha } }),
    async criarUsuario(emailNormalizado, nome = "Pessoa Exemplo", senha = SENHA_BOA) {
      const id = randomUUID();
      const hash = await gerarHash(senha, CUSTO_BAIXO);
      await sql`insert into usuario (id, nome, email_normalizado) values (${id}, ${nome}, ${emailNormalizado})`.execute(migracao);
      await sql`insert into identidade (usuario_id, provedor, sujeito, hash_senha)
                values (${id}, 'senha', ${emailNormalizado}, ${hash})`.execute(migracao);
      return id;
    },
    async criarEmpresa(nome, raiz) {
      const id = randomUUID();
      await semear(migracao, [id], (trx) =>
        sql`insert into empresa (id, cnpj_raiz, nome) values (${id}, ${raiz}, ${nome})`.execute(trx),
      );
      return id;
    },
    async vincular(empresaId, usuarioId, papel) {
      await semear(migracao, [empresaId], (trx) =>
        sql`insert into vinculo_empresa (empresa_id, usuario_id, papel) values (${empresaId}, ${usuarioId}, ${papel})`.execute(trx),
      );
    },
    async sessaoDe(emailNormalizado, senha = SENHA_BOA) {
      await ctx.criarUsuario(emailNormalizado, "Pessoa Exemplo", senha);
      const r = await ctx.login(emailNormalizado, senha);
      if (!r.cookie) throw new Error("login de teste falhou");
      return r.cookie;
    },
    async encerrar() {
      await app.close();
      await db.destroy();
      await migracao.destroy();
    },
  };
  return ctx;
}
