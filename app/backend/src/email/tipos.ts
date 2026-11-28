// Interface de envio de e-mail (CA-27). Sem provedor amarrado.

export interface Mensagem {
  para: string;
  assunto: string;
  texto: string;
}

export interface EnvioEmail {
  enviar(mensagem: Mensagem): Promise<void>;
}
