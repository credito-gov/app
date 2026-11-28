// Textos dos e-mails (CA-28). Sem promessa, número ou funcionalidade que não existe.
import type { Mensagem } from "./tipos.js";

export type Papel = "titular" | "contador" | "colaborador";

/** DD/MM/AAAA HH:MM no fuso America/Sao_Paulo. */
export function formatarValidade(data: Date): string {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const p = (tipo: string) => partes.find((x) => x.type === tipo)?.value ?? "";
  return `${p("day")}/${p("month")}/${p("year")} ${p("hour")}:${p("minute")}`;
}

const APRESENTACAO =
  "O CreditoGov é a plataforma para acompanhar o crédito de CBS das compras da empresa.";

export function modeloConvite(d: {
  para: string;
  quemConvidou: string | null;
  empresaNome: string;
  papel: Papel;
  link: string;
  expiraEm: Date;
}): Mensagem {
  const quem = d.quemConvidou ?? "a equipe CreditoGov";
  const texto = [
    APRESENTACAO,
    "",
    `${quem} convidou você para acessar a empresa ${d.empresaNome} no CreditoGov, com o papel de ${d.papel}.`,
    "",
    "Para aceitar o convite, abra o link:",
    d.link,
    "",
    `O link é de uso único e válido até ${formatarValidade(d.expiraEm)}.`,
    "",
    "Se você não esperava este convite, ignore esta mensagem.",
  ].join("\n");
  return {
    para: d.para,
    assunto: `Convite para acessar ${d.empresaNome} no CreditoGov`,
    texto,
  };
}

export function modeloRecuperacao(d: {
  para: string;
  link: string;
  expiraEm: Date;
}): Mensagem {
  const texto = [
    "Recebemos um pedido para criar uma nova senha no CreditoGov.",
    "",
    "Para escolher a nova senha, abra o link:",
    d.link,
    "",
    `O link é de uso único, válido por 1 hora, até ${formatarValidade(d.expiraEm)}.`,
    "",
    "Se você não pediu, ignore esta mensagem; sua senha não muda.",
  ].join("\n");
  return {
    para: d.para,
    assunto: "Nova senha no CreditoGov",
    texto,
  };
}
