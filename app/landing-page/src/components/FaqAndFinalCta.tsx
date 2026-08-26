const FAQ_COLUMNS = [
  [
    {
      question: 'Meus dados fiscais ficam seguros?',
      answer:
        'Sim. O acesso à Receita Federal é feito por procuração eletrônica registrada no e-CAC — não armazenamos suas credenciais, e todo o tráfego é criptografado.',
    },
    {
      question: 'Como funciona o cancelamento? Tem multa?',
      answer:
        'Você pode cancelar quando quiser direto no painel, sem multa e sem precisar falar com ninguém. O acesso continua até o fim do período já pago.',
    },
  ],
  [
    {
      question: 'Preciso trocar de ERP ou de contador?',
      answer:
        'Não. O CreditoGov roda em paralelo ao que você já usa hoje. Não substituímos seu contador nem seu sistema de gestão — só automatizamos a apuração de crédito.',
    },
    {
      question: 'Vocês dão suporte no fechamento do mês?',
      answer:
        'Sim, suporte prioritário por chat e e-mail nos dias de fechamento, incluindo ajuda para entender qualquer crédito marcado como erro.',
    },
  ],
]

export default function FaqAndFinalCta() {
  return (
    <section className="w-full bg-[#f9fafb] px-6 py-16 md:px-[48px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10">
        <h2 className="text-[32px] font-semibold tracking-[-0.8px] text-[#111827]">
          Perguntas frequentes
        </h2>

        <div className="mx-auto flex w-full max-w-[940px] flex-col items-stretch gap-4 md:flex-row">
          {FAQ_COLUMNS.map((column, columnIndex) => (
            <div key={columnIndex} className="flex w-full flex-1 flex-col items-start gap-4">
              {column.map((item) => (
                <div
                  key={item.question}
                  className="flex w-full flex-col items-start gap-2 rounded-[8px] border border-[#e5e7eb] bg-white p-[22px]"
                >
                  <p className="text-[15px] font-semibold text-[#111827]">{item.question}</p>
                  <p className="text-[13.5px] leading-[1.55] text-[#4b5563]">{item.answer}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-5">
          <p className="text-center text-[20px] font-semibold text-[#111827]">
            Descubra quanto crédito você tem parado hoje.
          </p>
          <div className="flex flex-wrap items-start justify-center gap-[14px]">
            <a
              href="#testar-gratis"
              className="rounded-[6px] bg-[#10b981] px-6 py-[13px] text-[14px] font-semibold whitespace-nowrap text-white"
            >
              Testar grátis por 14 dias
            </a>
            <a
              href="#falar-com-especialista"
              className="rounded-[6px] border border-[#d1d5db] bg-white px-6 py-[13px] text-[14px] font-semibold whitespace-nowrap text-[#374151]"
            >
              Falar com um especialista
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
