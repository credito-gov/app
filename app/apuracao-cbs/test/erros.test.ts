import { describe, expect, it } from "vitest";
import { ErroApi, codigoDaCausa, comandoRetomada, extrairErroDoCorpo } from "../src/erros.js";
import { criarRedator } from "../src/redacao.js";
import { erroDeRede } from "./apoio/apiSimulada.js";
import { SEGREDO, TOKEN, URL_ASSINADA } from "./apoio/ficticios.js";

const redator = criarRedator();
redator.registrar(TOKEN);
redator.registrar(SEGREDO);
redator.registrar(URL_ASSINADA);

describe("extrairErroDoCorpo", () => {
  it("lê codigoErro e mensagemErro de corpo JSON", () => {
    expect(extrairErroDoCorpo('{"codigoErro":"NAO_AUTORIZADO","mensagemErro":"Consumidor não autorizado"}')).toEqual({
      codigoErro: "NAO_AUTORIZADO",
      mensagemErro: "Consumidor não autorizado",
    });
  });

  it("ignora qualquer outro campo e qualquer corpo que não seja esse JSON", () => {
    expect(extrairErroDoCorpo('{"apuracao":[{"chave":"X"}],"urlAssinada":"u"}')).toEqual({});
    expect(extrairErroDoCorpo("<html>erro do gateway com dado qualquer</html>")).toEqual({});
    expect(extrairErroDoCorpo("")).toEqual({});
    expect(extrairErroDoCorpo("[1,2]")).toEqual({});
    expect(extrairErroDoCorpo('{"codigoErro":5,"mensagemErro":{"a":1}}')).toEqual({});
  });
});

describe("comandoRetomada", () => {
  it("monta o comando de retomada", () => {
    expect(comandoRetomada("creditos", "T-1")).toBe("npm run consulta -- creditos --tiquete T-1");
  });
});

describe("ErroApi", () => {
  it("é um Error com o código de saída 1", () => {
    const e = new ErroApi({ tipoChamada: "abertura", servico: "creditos", http: 500 }, redator);
    expect(e).toBeInstanceOf(Error);
    expect(e.codigoSaida).toBe(1);
    expect(e.http).toBe(500);
    expect(e.tipoChamada).toBe("abertura");
  });

  it("não guarda cabeçalhos, corpo enviado, token nem urlAssinada", () => {
    const dados = {
      tipoChamada: "download",
      servico: "creditos",
      http: 401,
      tiquete: "T-1",
      cabecalhos: { authorization: `Bearer ${TOKEN}` },
      corpoEnviado: '{"urlRetorno":""}',
      token: TOKEN,
      urlAssinada: URL_ASSINADA,
    };
    const e = new ErroApi(dados as never, redator);
    const serializado = JSON.stringify({ ...e, mensagem: e.message });
    for (const proibido of [TOKEN, URL_ASSINADA, "Bearer", "urlRetorno"]) {
      expect(serializado).not.toContain(proibido);
    }
    const permitidas = ["tipoChamada", "servico", "http", "codigoErro", "mensagemErro", "tiquete", "motivo", "codigoSaida"];
    for (const chave of Object.keys(e)) expect(permitidas, chave).toContain(chave);
  });

  it("mostra codigoErro e mensagemErro e passa tudo pelo redator", () => {
    const e = new ErroApi(
      { tipoChamada: "situacao", servico: "creditos", http: 400, codigoErro: "X", mensagemErro: `falha com ${TOKEN}` },
      redator,
    );
    expect(e.message).toContain("codigoErro=X");
    expect(e.message).toContain("falha com ***");
    expect(e.message).not.toContain(TOKEN);
    expect(e.mensagemErro).not.toContain(TOKEN);
  });

  it("com tíquete, a mensagem termina com o comando de retomada", () => {
    const e = new ErroApi({ tipoChamada: "situacao", servico: "debitos", http: 500, tiquete: "T-9" }, redator);
    expect(e.message.endsWith("npm run consulta -- debitos --tiquete T-9")).toBe(true);
  });

  it("sem tíquete, não há comando de retomada", () => {
    const e = new ErroApi({ tipoChamada: "abertura", servico: "debitos", http: 500 }, redator);
    expect(e.message).not.toContain("--tiquete");
  });

  it("token 400/401: credencial recusada, sem nova tentativa, com os pedidos que restam", () => {
    for (const http of [400, 401]) {
      const e = new ErroApi({ tipoChamada: "token", servico: "creditos", http, tokensRestantes: 1 }, redator);
      expect(e.message).toContain("Credencial recusada");
      expect(e.message).toContain("APURACAO_TOKEN_CREDENCIAIS");
      expect(e.message).toContain("nova tentativa");
      expect(e.message).toContain("Restam 1 pedido(s) de token nesta hora pelo controle local");
    }
  });

  it("API 401: token recusado ou consumidor não autorizado, cache descartado", () => {
    const e = new ErroApi({ tipoChamada: "abertura", servico: "creditos", http: 401, mensagemErro: "NI não autorizado" }, redator);
    expect(e.message).toContain("Token recusado");
    expect(e.message).toContain("Cache do token descartado");
    expect(e.message).toContain("matriz");
    expect(e.message).toContain("NI não autorizado");
  });

  it("403: sem permissão ou escopo", () => {
    const e = new ErroApi({ tipoChamada: "abertura", servico: "pagamentos", http: 403 }, redator);
    expect(e.message).toContain("Sem permissão");
    expect(e.message).toContain("APURACAO_TOKEN_SCOPE");
  });

  it("404 na abertura e na situação: endereço não encontrado", () => {
    for (const tipoChamada of ["abertura", "situacao"] as const) {
      const e = new ErroApi({ tipoChamada, servico: "creditos", http: 404 }, redator);
      expect(e.message).toContain("Endereço não encontrado");
      expect(e.message).toContain("APURACAO_URL_BASE");
    }
  });

  it("404 no download: arquivo indisponível", () => {
    const e = new ErroApi({ tipoChamada: "download", servico: "creditos", http: 404, codigoErro: "ARQUIVO_INDISPONIVEL" }, redator);
    expect(e.message).toContain("Arquivo indisponível");
    expect(e.message).toContain("ARQUIVO_INDISPONIVEL");
  });

  it("429: limite excedido, com as aberturas do dia e a meia-noite", () => {
    const e = new ErroApi(
      { tipoChamada: "abertura", servico: "creditos", http: 429, aberturasHoje: { total: 3, aceitas: 2 } },
      redator,
    );
    expect(e.message).toContain("Limite excedido");
    expect(e.message).toContain("Aberturas de creditos registradas hoje: 3 (2 aceitas)");
    expect(e.message).toContain("meia-noite");
  });

  it("500: mostra o código e orienta a tentar mais tarde", () => {
    const e = new ErroApi({ tipoChamada: "download", servico: "creditos", http: 500, codigoErro: "ERRO_INTERNO", mensagemErro: "falha" }, redator);
    expect(e.message).toContain("HTTP 500");
    expect(e.message).toContain("codigoErro=ERRO_INTERNO");
    expect(e.message).toContain("mais tarde");
  });

  it("400 e outros códigos: mostram o código HTTP", () => {
    expect(new ErroApi({ tipoChamada: "abertura", servico: "creditos", http: 400 }, redator).message).toContain("HTTP 400");
    expect(new ErroApi({ tipoChamada: "abertura", servico: "creditos", http: 418 }, redator).message).toContain("HTTP 418");
  });

  it("situação ERRO e EXPIRADA: mostram codigoErro e mensagemErro e avisam do custo de nova solicitação", () => {
    for (const motivo of ["situacao-erro", "situacao-expirada"] as const) {
      const e = new ErroApi(
        { tipoChamada: "situacao", servico: "creditos", tiquete: "T-1", motivo, codigoErro: "EXPIRADA", mensagemErro: "prazo" },
        redator,
      );
      expect(e.message).toContain(motivo === "situacao-erro" ? "ERRO" : "EXPIRADA");
      expect(e.message).toContain("codigoErro=EXPIRADA");
      expect(e.message).toContain("mensagemErro=prazo");
      expect(e.message).toContain("consome uma chamada");
    }
  });

  it("urlAssinada vencida: pede outra com --tiquete", () => {
    const e = new ErroApi({ tipoChamada: "arquivo", servico: "creditos", tiquete: "T-1", motivo: "url-vencida" }, redator);
    expect(e.message).toContain("urlAssinada vencida");
    expect(e.message).toContain("48 h");
    expect(e.message.endsWith("--tiquete T-1")).toBe(true);
  });

  it("rede e tempo esgotado: sem resposta, nada foi repetido", () => {
    const rede = new ErroApi({ tipoChamada: "situacao", servico: "creditos", motivo: "rede" }, redator);
    expect(rede.message).toContain("Sem resposta");
    expect(rede.message).toContain("Nada foi repetido");
    const tempo = new ErroApi({ tipoChamada: "situacao", servico: "creditos", motivo: "tempo-esgotado" }, redator);
    expect(tempo.message).toContain("tempo esgotado");
  });

  it("espera máxima: explica e dá o comando de retomada", () => {
    const e = new ErroApi({ tipoChamada: "situacao", servico: "creditos", tiquete: "T-1", motivo: "espera-maxima" }, redator);
    expect(e.message).toContain("Espera máxima");
    expect(e.message.endsWith("npm run consulta -- creditos --tiquete T-1")).toBe(true);
  });

  it("detalhe livre também passa pelo redator", () => {
    const e = new ErroApi({ tipoChamada: "token", servico: "creditos", motivo: "outro", detalhe: `resposta com ${SEGREDO}` }, redator);
    expect(e.message).toContain("resposta com ***");
  });
});

describe("mensagens da rodada de correção (G)", () => {
  it("rede: mostra só o código da causa", () => {
    const e = new ErroApi({ tipoChamada: "situacao", servico: "creditos", motivo: "rede", codigoRede: "ENOTFOUND" }, redator);
    expect(e.message).toContain("erro de rede: ENOTFOUND");
    const sem = new ErroApi({ tipoChamada: "situacao", servico: "creditos", motivo: "rede" }, redator);
    expect(sem.message).toContain("erro de rede)");
  });

  it("codigoDaCausa lê cause.code e nunca a mensagem", () => {
    expect(codigoDaCausa(erroDeRede("fetch failed https://x/?s=SEGREDO", "CERT_HAS_EXPIRED"))).toBe("CERT_HAS_EXPIRED");
    expect(codigoDaCausa(erroDeRede("fetch failed https://x/?s=SEGREDO"))).toBeUndefined();
    expect(codigoDaCausa("texto")).toBeUndefined();
  });

  it("tempo esgotado na abertura avisa que a solicitação pode ter sido aceita e contada", () => {
    const e = new ErroApi({ tipoChamada: "abertura", servico: "creditos", motivo: "tempo-esgotado" }, redator);
    expect(e.message).toContain("pode ter sido aceita");
    expect(e.message).toContain("tíquete é desconhecido");
    const outra = new ErroApi({ tipoChamada: "situacao", servico: "creditos", tiquete: "T-1", motivo: "tempo-esgotado" }, redator);
    expect(outra.message).not.toContain("pode ter sido aceita");
  });

  it("download pela urlAssinada tem texto próprio, sem falar de APURACAO_URL_BASE nem de cache do token", () => {
    for (const http of [401, 404, 429, 500]) {
      const e = new ErroApi({ tipoChamada: "arquivo", servico: "creditos", tiquete: "T-1", http }, redator);
      expect(e.message, String(http)).not.toContain("APURACAO_URL_BASE");
      expect(e.message, String(http)).not.toContain("Cache do token");
      expect(e.message, String(http)).toContain("--tiquete");
      expect(e.message, String(http)).toContain(`HTTP ${http}`);
    }
  });

  it("pedido de token: 403, 429 e 500 dizem o que fazer", () => {
    const e403 = new ErroApi({ tipoChamada: "token", servico: "creditos", http: 403 }, redator);
    expect(e403.message).toContain("Credencial sem permissão");
    expect(e403.message).toContain("APURACAO_TOKEN_SCOPE");
    const e429 = new ErroApi({ tipoChamada: "token", servico: "creditos", http: 429 }, redator);
    expect(e429.message).toContain("2 por hora");
    expect(e429.message).toContain("Espere");
    const e500 = new ErroApi({ tipoChamada: "token", servico: "creditos", http: 500 }, redator);
    expect(e500.message).toContain("Tente mais tarde");
    expect(e500.message).toContain("controle local");
    expect(e500.message).not.toContain("contou no limite");
  });
});
