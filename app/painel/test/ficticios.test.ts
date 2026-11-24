import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { criarCache, identificarArquivo, lerPasta, type ArquivoLido } from "../src/nucleo/arquivos.js";
import { compararInstantes } from "../src/nucleo/datas.js";
import { lerSemPerda } from "../src/nucleo/json.js";
import { MOTIVOS } from "../src/nucleo/emitente.js";
import { montarVisao, type Visao } from "../src/nucleo/visao.js";
import { RAIZ } from "./apoio/construtores.js";
import { cnpjValido, cpfValido } from "./apoio/dv.js";

const PASTA_FICTICIOS = fileURLToPath(new URL("../dados/ficticios/", import.meta.url));
const PASTA_ERROS = fileURLToPath(new URL("./fixtures/erros/", import.meta.url));

const NOMES = {
  forma: "20261118T090000Z_creditos_FICTCRED01.json",
  emitentes: "20261119T090000Z_creditos_FICTCRED02.json",
  origens: "20261120T090000Z_creditos_FICTCRED03.json",
  novaVersao: "20261121T090000Z_creditos_FICTCRED04.json",
  ni8: "20261122T090000Z_creditos_FICTCRED05.json",
  vazio: "20261123T090000Z_creditos_FICTCRED06.json",
  volumeCreditos: "20261118T100000Z_creditos_FICTVOL01.json",
  recolhimentos: "20261120T100000Z_recolhimentos_FICTRECO01.json",
  debitos: "20261120T110000Z_debitos_FICTDEB01.json",
  volumeDebitos: "20261120T120000Z_debitos_FICTVOL02.json",
};
const GERADOS = [NOMES.volumeCreditos, NOMES.volumeDebitos];

interface Objeto {
  [k: string]: unknown;
}

const texto = (pasta: string, nome: string) => readFile(join(pasta, nome), "utf8");
const bruto = async (nome: string) => lerSemPerda(await texto(PASTA_FICTICIOS, nome)) as Objeto;
const itensDe = (dados: Objeto, campo: string) => ((dados.apuracao as Objeto[]) ?? []).flatMap((b) => (b[campo] as Objeto[]) ?? []);

let visao: Visao;
let arquivos: ArquivoLido[];

beforeAll(async () => {
  const r = await lerPasta(PASTA_FICTICIOS, { cache: criarCache() });
  arquivos = r.arquivos;
  visao = montarVisao(r);
});

describe("a pasta padrão: todos os arquivos são aceitos, com a divergência conhecida do ni (CA-17, CA-A2)", () => {
  it("tem os arquivos esperados, todos no padrão de nome", async () => {
    const nomes = (await readdir(PASTA_FICTICIOS)).filter((n) => n.endsWith(".json")).sort();
    expect(nomes).toEqual(Object.values(NOMES).sort());
    for (const n of nomes) expect(identificarArquivo(n), n).not.toBeNull();
  });

  it("todos passam na validação, com a tolerância do ni", () => {
    for (const a of arquivos) expect(["aceito", "aceito-com-divergencia"], `${a.nome}: ${a.motivos.join("; ")}`).toContain(a.situacao);
  });

  it("não há conflito de empresa, e a raiz é a da empresa fictícia", () => {
    expect(visao.empresa.conflito).toBe(false);
    expect(visao.empresa.raiz).toBe(RAIZ);
  });

  it("nenhum arquivo é recusado ou ignorado", () => {
    expect(arquivos.filter((a) => a.situacao === "recusado" || a.situacao === "ignorado")).toEqual([]);
  });
});

describe("como no real (CA-17, O-8 a O-15)", () => {
  it("ni e niConsumidor iguais, com 14 dígitos", async () => {
    const d = await bruto(NOMES.forma);
    expect(d.ni).toMatch(/^\d{14}$/);
    expect(d.niConsumidor).toBe(d.ni);
  });

  it("campos zerados ausentes e saldoCredor presente", async () => {
    const itens = itensDe(await bruto(NOMES.forma), "creditos");
    const apropriacao = (i: Objeto) => (i.cbs as Objeto).apropriacao as Objeto;
    expect(itens.some((i) => apropriacao(i).aApropriar === undefined)).toBe(true);
    expect(itens.some((i) => apropriacao(i).apropriado === undefined)).toBe(true);
    expect(itens.some((i) => (apropriacao(i).utilizacao as Objeto).utilizado === undefined)).toBe(true);
    expect(itens.every((i) => ((apropriacao(i).utilizacao as Objeto).naoUtilizado as Objeto).saldoCredor !== undefined)).toBe(true);
  });

  it("números com 0, 1 e 2 casas decimais", async () => {
    const t = await texto(PASTA_FICTICIOS, NOMES.forma);
    expect(t).toMatch(/"aApropriar": \d+,?\r?\n/);
    expect(t).toMatch(/"aApropriar": \d+\.\d,?\r?\n/);
    expect(t).toMatch(/"aApropriar": \d+\.\d\d,?\r?\n/);
  });

  it("datas com fuso e frações de 0, 3 e 6 casas", async () => {
    const t = await texto(PASTA_FICTICIOS, NOMES.forma);
    expect(t).toMatch(/T\d\d:\d\d:\d\d-03:00"/);
    expect(t).toMatch(/T\d\d:\d\d:\d\d\.\d{3}-03:00"/);
    expect(t).toMatch(/T\d\d:\d\d:\d\d\.\d{6}-03:00"/);
  });

  it("documentos 55, 57, 62 e 65 com chave de 44 posições, e 91 com 50", () => {
    for (const doc of [55, 57, 62, 65]) {
      expect(visao.notas.some((n) => n.documento === doc && n.chave.length === 44), `documento ${doc}`).toBe(true);
    }
    expect(visao.notas.some((n) => n.documento === 91 && n.chave.length === 50)).toBe(true);
  });

  it("um período concentra centenas de notas", () => {
    const porPeriodo = new Map<string, number>();
    for (const n of visao.notas) porPeriodo.set(n.pa, (porPeriodo.get(n.pa) ?? 0) + 1);
    expect(porPeriodo.get("11/2026") ?? 0).toBeGreaterThanOrEqual(800);
    expect(visao.notas.length).toBeGreaterThanOrEqual(880);
    expect(visao.notas.length).toBeLessThanOrEqual(1000);
  });

  it("quase todo o crédito está a apropriar", () => {
    const comValor = visao.notas.filter((n) => n.valores["cbs.apropriacao.aApropriar"]?.gt(0)).length;
    expect(comValor / visao.notas.length).toBeGreaterThan(0.9);
  });

  it("apropriação parcial: a apropriar e apropriado na mesma nota", () => {
    expect(visao.notas.some((n) => n.valores["cbs.apropriacao.aApropriar"]?.gt(0) && n.valores["cbs.apropriacao.apropriado"]?.gt(0))).toBe(true);
  });

  it("apropriado igual ao utilizado", () => {
    expect(
      visao.notas.some((n) => {
        const ap = n.valores["cbs.apropriacao.apropriado"];
        const ut = n.valores["cbs.apropriacao.utilizacao.utilizado"];
        return ap?.gt(0) && ut?.eq(ap) && n.valores["cbs.apropriacao.utilizacao.naoUtilizado.saldoCredor"]?.eq(0);
      }),
    ).toBe(true);
  });

  it("apropriado ainda não utilizado: saldoCredor maior que zero", () => {
    expect(visao.notas.some((n) => n.valores["cbs.apropriacao.utilizacao.naoUtilizado.saldoCredor"]?.gt(0))).toBe(true);
  });

  it("nota com emitente igual à própria empresa", () => {
    expect(visao.notas.some((n) => n.emitente.emitente.tipo === "propria-empresa")).toBe(true);
  });

  it("emissões fora do mês do período", () => {
    const fora = (n: { pa: string; emissao: string }) => n.emissao.slice(5, 7) !== n.pa.slice(0, 2) || n.emissao.slice(0, 4) !== n.pa.slice(3);
    expect(visao.notas.filter(fora).length).toBeGreaterThanOrEqual(2);
  });
});

describe("o que o real não trouxe (CA-17)", () => {
  it("origens diferentes de normal", () => {
    const origens = new Set(visao.notas.map((n) => n.origem));
    origens.delete(0);
    expect(origens.size).toBeGreaterThanOrEqual(2);
  });

  it("o mesmo crédito em dois arquivos com valores diferentes", async () => {
    const a = itensDe(await bruto(NOMES.forma), "creditos");
    const b = itensDe(await bruto(NOMES.novaVersao), "creditos");
    const comum = a.filter((x) => b.some((y) => y.chave === x.chave && y.documento === x.documento && y.origem === x.origem));
    expect(comum.length).toBeGreaterThanOrEqual(1);
    const x = comum[0];
    const y = b.find((i) => i.chave === x.chave)!;
    expect(JSON.stringify(x.cbs)).not.toBe(JSON.stringify(y.cbs));
    expect(visao.substituidas.creditos).toBeGreaterThanOrEqual(1);
  });

  it("recolhimentos com e sem chaveDFE, ligados a notas de crédito", () => {
    expect(visao.recolhimentos.some((r) => r.chaveDFE !== undefined)).toBe(true);
    expect(visao.recolhimentos.some((r) => r.chaveDFE === undefined)).toBe(true);
    const chaves = new Set(visao.notas.map((n) => n.chave));
    expect(visao.recolhimentos.some((r) => r.chaveDFE !== undefined && chaves.has(r.chaveDFE))).toBe(true);
  });

  it("um arquivo com ni de 8 dígitos", async () => {
    expect((await bruto(NOMES.ni8)).ni).toMatch(/^\d{8}$/);
  });

  it("um arquivo vazio", async () => {
    expect((await bruto(NOMES.vazio)).apuracao).toEqual([]);
  });
});

describe("datas coerentes nos arquivos de volume (rodada 1, G2)", () => {
  for (const nome of GERADOS) {
    it(`${nome}: emissão, registro, atualização e geradoEm em ordem`, async () => {
      const dados = await bruto(nome);
      const geradoEm = dados.geradoEm as string;
      const itens = ["creditos", "debitos"].flatMap((campo) => itensDe(dados, campo));
      expect(itens.length).toBeGreaterThan(800);
      let fora = 0;
      for (const i of itens) {
        const ordem =
          compararInstantes(i.emissao as string, i.registro as string) <= 0 &&
          compararInstantes(i.registro as string, i.atualizacao as string) <= 0 &&
          compararInstantes(i.atualizacao as string, geradoEm) <= 0;
        if (!ordem) fora++;
      }
      expect(fora).toBe(0);
    });
  }
});

describe("débitos (CA-D3, O-18 a O-25)", () => {
  it("extinto ausente quando zero e saldoDevedor presente", async () => {
    const itens = itensDe(await bruto(NOMES.debitos), "debitos");
    expect(itens.some((i) => (i.cbs as Objeto).extinto === undefined)).toBe(true);
    expect(itens.some((i) => (i.cbs as Objeto).extinto !== undefined)).toBe(true);
    expect(itens.every((i) => (i.cbs as Objeto).saldoDevedor !== undefined)).toBe(true);
  });

  it("documentos 55 e 91", () => {
    expect(visao.debitos.some((d) => d.documento === 55)).toBe(true);
    expect(visao.debitos.some((d) => d.documento === 91)).toBe(true);
  });

  it("volume: cerca de 2.800 débitos em 3 períodos", () => {
    expect(visao.debitos.length).toBeGreaterThanOrEqual(2700);
    expect(visao.debitos.length).toBeLessThanOrEqual(2900);
    expect(new Set(visao.debitos.map((d) => d.pa)).size).toBeGreaterThanOrEqual(3);
  });

  it("mistura de estabelecimentos: o da própria chave, outro da mesma raiz e outra raiz", () => {
    const emitentes = visao.debitos.filter((d) => d.documento === 55 && d.chave.length === 44).map((d) => d.chave.slice(6, 20));
    const iguais = emitentes.filter((e) => e === `${RAIZ}0001${e.slice(12)}`).length;
    const mesmaRaiz = emitentes.filter((e) => e.startsWith(RAIZ) && !e.startsWith(`${RAIZ}0001`)).length;
    const outra = emitentes.filter((e) => !e.startsWith(RAIZ)).length;
    expect(iguais).toBeGreaterThan(emitentes.length * 0.6);
    expect(mesmaRaiz).toBeGreaterThan(emitentes.length * 0.1);
    expect(outra).toBeGreaterThanOrEqual(1);
  });

  it("a nota que aparece nos dois lados (O-25)", () => {
    expect(visao.notas.some((n) => visao.chavesEmDebitos.has(n.chave))).toBe(true);
  });
});

describe("casos de emitente (CA-12, Spec)", () => {
  const motivos = () => new Set(visao.notas.map((n) => n.emitente.chave.motivo));

  it("dígito verificador errado, modelo divergente, série 890–899, série de CPF sem CPF, CT-e com 000, NFC-e série 890, chave fora do leiaute e documento 91", () => {
    for (const m of [MOTIVOS.digito, MOTIVOS.modelo, MOTIVOS.avulsa, MOTIVOS.serieCpf, MOTIVOS.cte, MOTIVOS.serieNfce, MOTIVOS.formato, MOTIVOS.semLeiaute]) {
      expect(motivos().has(m), m).toBe(true);
    }
  });

  it("emitente CPF lido da chave (série 910 ou mais)", () => {
    expect(visao.notas.some((n) => n.emitente.chave.documento === "cpf" && n.emitente.chave.tipo === "identificado")).toBe(true);
  });

  it("emitente CNPJ com letras", () => {
    expect(visao.notas.some((n) => /[A-Z]/.test(n.emitente.chave.numero ?? "") && n.emitente.chave.tipo === "identificado")).toBe(true);
  });

  it("emitente identificado pelo recolhimento", () => {
    expect(visao.notas.some((n) => n.emitente.emitente.fonte === "recolhimento")).toBe(true);
  });
});

describe("fixtures de erro (CA-17, fora da pasta padrão)", () => {
  it("outra empresa, outro motivo de recusa, JSON ilegível, nome fora do padrão e pagamentos", async () => {
    const r = await lerPasta(PASTA_ERROS, { cache: criarCache() });
    const por = (parte: string) => r.arquivos.find((a) => a.nome.includes(parte))!;
    expect(por("FICTOUTRA").situacao).toMatch(/^aceito/);
    expect(por("FICTOUTRA").raiz).not.toBe(RAIZ);
    expect(por("FICTINVAL").situacao).toBe("recusado");
    expect(por("FICTINVAL").motivos.join(" ")).not.toContain("ni com 14");
    expect(por("FICTILEG").situacao).toBe("recusado");
    expect(por("FICTILEG").motivos[0]).toContain("JSON inválido");
    expect(por("sem-padrao").situacao).toBe("ignorado");
    expect(por("FICTPAG").situacao).toBe("ignorado");
    expect(por("FICTPAG").servico).toBe("pagamentos");
  });
});

describe("não é dado real (CA-18)", () => {
  async function coletar(pasta: string) {
    const nomes = (await readdir(pasta)).filter((n) => n.endsWith(".json"));
    const achados: Array<{ onde: string; campo: string; valor: string }> = [];
    for (const nome of nomes) {
      let dados: Objeto;
      try {
        dados = lerSemPerda(await texto(pasta, nome)) as Objeto;
      } catch {
        continue;
      }
      const add = (campo: string, valor: unknown) => typeof valor === "string" && achados.push({ onde: nome, campo, valor });
      add("tiqueteSolicitacao", dados.tiqueteSolicitacao);
      add("ni", dados.ni);
      add("niConsumidor", dados.niConsumidor);
      for (const bloco of (dados.apuracao as Objeto[] | undefined) ?? []) {
        for (const c of [...((bloco.creditos as Objeto[]) ?? []), ...((bloco.debitos as Objeto[]) ?? [])]) add("chave", c.chave);
        for (const p of (bloco.pagamentos as Objeto[]) ?? []) {
          add("numeroDARF", p.numeroDARF);
          for (const i of (p.composicao as Objeto[]) ?? []) {
            add("niFornecedor", i.niFornecedor);
            add("chaveDFE", i.chaveDFE);
          }
        }
      }
    }
    return achados;
  }

  async function conferir(pasta: string) {
    const achados = await coletar(pasta);
    expect(achados.length).toBeGreaterThan(0);
    for (const { onde, campo, valor } of achados) {
      const id = `${onde} ${campo}`;
      if (campo === "tiqueteSolicitacao") expect(valor.startsWith("FICT"), id).toBe(true);
      if (campo === "numeroDARF") expect(valor.startsWith("99999"), id).toBe(true);
      if (["ni", "niConsumidor", "niFornecedor"].includes(campo)) {
        if (/^\d{14}$/.test(valor)) expect(cnpjValido(valor), `${id} ${valor}`).toBe(false);
        if (/^\d{11}$/.test(valor)) expect(cpfValido(valor), id).toBe(false);
      }
      if ((campo === "chave" || campo === "chaveDFE") && valor.length === 44) {
        expect(valor.startsWith("99"), id).toBe(true);
        const emitente = valor.slice(6, 20);
        if (/^\d{14}$/.test(emitente)) {
          expect(cnpjValido(emitente), `${id} emitente`).toBe(false);
          if (emitente.startsWith("000")) expect(cpfValido(emitente.slice(3)), `${id} cpf`).toBe(false);
        } else {
          expect(emitente.startsWith("FICT"), `${id} cnpj com letras`).toBe(true);
        }
      }
    }
  }

  it("os fictícios: DV de todo ni, niConsumidor, niFornecedor, emitente e CPF é inválido; prefixos 99, FICT e 99999", async () => {
    await conferir(PASTA_FICTICIOS);
  });

  it("as fixtures de erro, idem", async () => {
    await conferir(PASTA_ERROS);
  });
});

describe("gerar-ficticios (CA-17)", () => {
  it("reproduz byte a byte os arquivos gerados versionados", async () => {
    const { gerar } = await import("../scripts/gerarFicticios.js");
    const destino = await mkdtemp(join(tmpdir(), "painel-gerar-"));
    try {
      const escritos = await gerar(destino);
      expect([...escritos].sort()).toEqual([...GERADOS].sort());
      for (const nome of GERADOS) {
        const novo = await readFile(join(destino, nome));
        const versionado = await readFile(join(PASTA_FICTICIOS, nome));
        expect(novo.equals(versionado), nome).toBe(true);
      }
    } finally {
      await rm(destino, { recursive: true, force: true });
    }
  });
});
