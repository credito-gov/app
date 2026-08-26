import { useScrollReveal } from '../hooks/useScrollReveal'

const FAQ_COLUMNS = [
  [
    {
      question: 'Meus dados fiscais e contábeis estão seguros?',
      answer:
        'Sim. A integração é feita via procuração eletrônica específica do e-CAC. Não armazenamos senhas de segurança e todo o tráfego é criptografado.',
    },
    {
      question: 'Preciso mudar meu software ERP atual?',
      answer:
        'Não. O CreditoGov roda de forma complementar. Não há necessidade de alteração ou troca de fornecedores contábeis existentes.',
    },
  ],
  [
    {
      question: 'Como funciona a antecipação de caixa?',
      answer:
        'Seus créditos homologados podem ser antecipados com fintechs parceiras a taxas de deságio extremamente competitivas diretamente no painel.',
    },
    {
      question: 'Qual a duração do período de teste gratuito?',
      answer:
        'Você usufrui de todas as vantagens da plataforma por 14 dias. Não solicitamos dados de pagamento para início do teste.',
    },
  ],
]

export default function Faq() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLHeadingElement>()
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section className="w-full px-6 py-16 md:px-[64px] md:py-[96px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-14">
        <h2
          ref={headerRef}
          className={`reveal-up text-center text-[36px] font-extrabold text-white ${headerVisible ? 'is-visible' : ''}`}
        >
          Perguntas Frequentes
        </h2>

        <div
          ref={gridRef}
          className={`reveal-up mx-auto flex w-full max-w-[940px] flex-col items-stretch gap-8 md:flex-row ${gridVisible ? 'is-visible' : ''}`}
        >
          {FAQ_COLUMNS.map((column, columnIndex) => (
            <div key={columnIndex} className="flex w-full flex-1 flex-col items-start gap-5">
              {column.map((item) => (
                <div
                  key={item.question}
                  className="flex w-full flex-col items-start gap-3 rounded-[12px] border border-[#1e293b] bg-[#0e1524] p-7"
                >
                  <p className="text-[16px] font-bold text-white">{item.question}</p>
                  <p className="text-[14px] leading-[1.5] text-[#94a3b8]">{item.answer}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
