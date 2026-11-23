// Endereço real antes de publicar; enquanto estiver com o marcador, a busca do CA-20 reprova.
// (Não repetir o marcador em comentário: a busca acusaria mesmo com o valor preenchido.)
export const EMAIL_CONTATO = 'PREENCHER-EMAIL'

// Só dígitos, com DDI e DDD (ex.: 55 + DDD + número). Vazio: nenhum botão de WhatsApp aparece.
export const WHATSAPP_NUMERO = ''

export const MENSAGEM_LISTA = {
  assunto: 'Lista de espera do CreditoGov',
  corpo:
    'Olá! Quero entrar na lista de espera do CreditoGov.\n\nNome:\nEmpresa ou escritório:\nSou empresa ou escritório de contabilidade:\n',
}

export const MENSAGEM_CONVERSA = {
  assunto: 'Conversa sobre o CreditoGov',
  corpo: 'Olá! Quero conversar sobre o CreditoGov.\n',
}

export function linkEmail(mensagem: { assunto: string; corpo: string }): string {
  return `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(mensagem.assunto)}&body=${encodeURIComponent(mensagem.corpo)}`
}

export function linkWhatsApp(texto: string): string | null {
  if (!WHATSAPP_NUMERO) return null
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`
}
