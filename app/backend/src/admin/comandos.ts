// Comandos do `npm run admin` (CA-5, CA-6, CA-34, DT-7). Usam o papel de trabalho:
// cada comando fixa a empresa na transação, como a API. A saída não leva token, link nem hash.
import { randomUUID } from "node:crypto";
import { emailValido, normalizarEmail } from "../autenticacao/email.js";
import type { Papel } from "../banco/esquema.js";
import { ehUuid, type Banco } from "../banco/transacao.js";
import type { Config } from "../config.js";
import { criarConvite, linkConvite } from "../convites/criar.js";
import { modeloConvite } from "../email/modelos.js";
import type { EnvioEmail } from "../email/tipos.js";
import { CENARIOS, montarCenario } from "../ficticios/cenarios.js";
import { registrarLeitura } from "../leitura/registrar.js";
import { listarEmpresas, type EmpresaDto } from "../empresas/empresas.js";
import { removerVinculo } from "../empresas/vinculos.js";

/** Erro com mensagem para o operador. */
export class ErroAdmin extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroAdmin";
  }
}

export interface ComandosAdmin {
  criarEmpresa(d: { cnpjRaiz: string; nome: string }): Promise<{ id: string; saida: string }>;
  convidar(d: { empresaId: string; email: string; papel: string }): Promise<{ saida: string }>;
  empresasDoUsuario(d: { email: string }): Promise<{ empresas: EmpresaDto[]; saida: string }>;
  removerVinculo(d: { empresaId: string; email: string }): Promise<{ saida: string }>;
  /** Grava um cenário fictício (033): só no ambiente local, só em empresa sem consulta, nunca a partir de arquivo. */
  carregarCenario(d: { empresaId: string; cenario: string }): Promise<{ saida: string }>;
}

/** Semente fixa: o mesmo cenário dá sempre os mesmos retornos. */
const SEMENTE_DOS_CENARIOS = 1;

function exigirEmpresaId(id: string): void {
  if (!ehUuid(id)) throw new ErroAdmin("O id da empresa deve ser um uuid.");
}

export function criarComandosAdmin(deps: {
  banco: Banco;
  email: EnvioEmail;
  relogio: () => Date;
  config: Config;
}): ComandosAdmin {
  const { banco, email, relogio, config } = deps;

  const usuarioPorEmail = async (emailInformado: string): Promise<string> => {
    const normalizado = normalizarEmail(emailInformado);
    const u = await banco.semUsuario((trx) =>
      trx.selectFrom("usuario").select("id").where("email_normalizado", "=", normalizado).executeTakeFirst(),
    );
    if (!u) throw new ErroAdmin("Usuário não encontrado.");
    return u.id;
  };

  return {
    async criarEmpresa({ cnpjRaiz, nome }) {
      const raiz = cnpjRaiz.replace(/[.\s]/g, "");
      if (!/^\d{8}$/.test(raiz)) {
        throw new ErroAdmin("A raiz do CNPJ deve ter 8 dígitos, só números (com ou sem pontos).");
      }
      const nomeLimpo = nome.trim();
      if (nomeLimpo.length < 1 || nomeLimpo.length > 200) {
        throw new ErroAdmin("O nome da empresa deve ter de 1 a 200 caracteres.");
      }
      const id = randomUUID();
      try {
        await banco.naEmpresaFixada(id, (trx) =>
          trx
            .insertInto("empresa")
            .values({ id, cnpj_raiz: raiz, nome: nomeLimpo, criada_em: relogio() })
            .execute(),
        );
      } catch (e) {
        if ((e as { code?: string }).code === "23505") {
          throw new ErroAdmin("Já existe uma empresa com esta raiz de CNPJ.");
        }
        throw e;
      }
      return { id, saida: `Empresa criada. id: ${id}` };
    },

    async convidar({ empresaId, email: emailInformado, papel }) {
      if (papel !== "titular" && papel !== "contador") {
        throw new ErroAdmin("A equipe só convida titular ou contador.");
      }
      exigirEmpresaId(empresaId);
      const para = normalizarEmail(emailInformado);
      if (!emailValido(para)) throw new ErroAdmin("E-mail inválido.");
      const agora = relogio();
      const r = await banco.naEmpresaFixada(empresaId, (trx) =>
        criarConvite(trx, {
          empresaId,
          email: para,
          papel: papel as Papel,
          criadoPor: null,
          origem: "equipe",
          agora,
          segredo: config.sessaoSegredo,
        }),
      );
      if (r.tipo === "empresa_inexistente") throw new ErroAdmin("Empresa não encontrada.");
      if (r.tipo === "ja_vinculado") throw new ErroAdmin("Este e-mail já tem acesso a esta empresa.");
      try {
        await email.enviar(
          modeloConvite({
            para,
            quemConvidou: null,
            empresaNome: r.empresaNome,
            papel: papel as Papel,
            link: linkConvite(config.webUrl, empresaId, r.token),
            expiraEm: r.expiraEm,
          }),
        );
      } catch {
        throw new ErroAdmin(
          "Convite criado, mas o e-mail não foi enviado. Confira o adaptador de e-mail e peça o reenvio (convide de novo).",
        );
      }
      return { saida: `Convite enviado para ${para}, com o papel de ${papel}.` };
    },

    async empresasDoUsuario({ email: emailInformado }) {
      const usuarioId = await usuarioPorEmail(emailInformado);
      const empresas = await banco.naCarteira(usuarioId, (trx) => listarEmpresas(trx, usuarioId));
      const saida = empresas.length
        ? empresas.map((e) => `${e.id}  ${e.nome}  ${e.papel}`).join("\n")
        : "Nenhuma empresa com vínculo ativo.";
      return { empresas, saida };
    },

    async removerVinculo({ empresaId, email: emailInformado }) {
      exigirEmpresaId(empresaId);
      const usuarioId = await usuarioPorEmail(emailInformado);
      const agora = relogio();
      const r = await banco.naEmpresaFixada(empresaId, (trx) =>
        removerVinculo(trx, { empresaId, usuarioId, removidoPor: null, agora }),
      );
      if (r === "nao_encontrado") throw new ErroAdmin("Vínculo ativo não encontrado.");
      if (r === "ultimo_titular") throw new ErroAdmin("Não é possível remover o último titular da empresa.");
      return { saida: "Vínculo removido." };
    },

    async carregarCenario({ empresaId, cenario }) {
      if (config.ambiente !== "local") {
        throw new ErroAdmin("O carregamento de cenários só roda com CREDITOGOV_AMBIENTE=local.");
      }
      exigirEmpresaId(empresaId);
      if (!(CENARIOS as readonly string[]).includes(cenario)) {
        throw new ErroAdmin(`Cenário desconhecido: ${cenario}. Os válidos são: ${CENARIOS.join(", ")}.`);
      }
      const agora = relogio();
      const r = await banco.naEmpresaFixada(empresaId, async (trx) => {
        const empresa = await trx.selectFrom("empresa").select("cnpj_raiz").where("id", "=", empresaId).executeTakeFirst();
        if (!empresa) return { tipo: "empresa_inexistente" as const };
        const existente = await trx.selectFrom("consulta").select("id").limit(1).executeTakeFirst();
        if (existente) return { tipo: "ja_tem_consulta" as const };
        const consultas = montarCenario(cenario, { raiz: empresa.cnpj_raiz, agora, semente: SEMENTE_DOS_CENARIOS });
        let arquivos = 0;
        let notasDeCredito = 0;
        let notasDeDebito = 0;
        for (const c of consultas) {
          const { id } = await trx
            .insertInto("consulta")
            .values({
              empresa_id: empresaId,
              servico: c.servico,
              estado: c.estado,
              criada_em: c.criadaEm,
              concluida_em: c.concluidaEm,
              finalizada_em: c.finalizadaEm,
            })
            .returning("id")
            .executeTakeFirstOrThrow();
          if (c.estado !== "lida" || c.retorno === null) continue;
          const lido = await registrarLeitura(trx, {
            consultaId: id,
            servico: c.servico,
            conteudo: c.retorno,
            recebidoEm: c.finalizadaEm ?? c.criadaEm,
          });
          arquivos++;
          if (c.servico === "creditos") notasDeCredito += lido.notas;
          else notasDeDebito += lido.notas;
        }
        return { tipo: "ok" as const, consultas: consultas.length, arquivos, notasDeCredito, notasDeDebito };
      });
      if (r.tipo === "empresa_inexistente") throw new ErroAdmin("Empresa não encontrada.");
      if (r.tipo === "ja_tem_consulta") throw new ErroAdmin("Esta empresa já tem consulta gravada; o cenário só vai para empresa sem consulta.");
      return {
        saida: `Cenário ${cenario} carregado na empresa ${empresaId}: ${r.consultas} consultas, ${r.arquivos} arquivos lidos, ${r.notasDeCredito} notas de crédito e ${r.notasDeDebito} notas de débito.`,
      };
    },
  };
}
