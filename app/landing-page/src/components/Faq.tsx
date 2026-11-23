import { useScrollReveal } from '../hooks/useScrollReveal'

const FAQ_COLUMNS = [
  [
    {
      question: 'O CreditoGov já está funcionando?',
      answer:
        'Ainda não. O produto está em desenvolvimento. Entre na lista de espera para saber quando a primeira versão estiver pronta.',
    },
    {
      question: 'De onde virão os dados da minha empresa?',
      answer:
        'Isso ainda está em definição. Antes do lançamento, vamos explicar como os dados chegam ao CreditoGov e o que você precisa autorizar.',
    },
    {
      question: 'Preciso mudar meu ERP?',
      answer:
        'Não. O ERP continua calculando o imposto e emitindo as notas. O CreditoGov vai mostrar o crédito que vem delas.',
    },
    {
      question: 'Vai dar para compensar ou antecipar crédito pelo painel?',
      answer:
        'Não na primeira versão. São possibilidades que dependem de validação jurídica e ainda não têm data.',
    },
  ],
  [
    {
      question: 'Quanto vai custar?',
      answer:
        'O preço será definido antes do lançamento e informado a quem estiver na lista de espera.',
    },
    {
      question: 'O CreditoGov substitui o contador?',
      answer:
        'Não. Ele não calcula imposto nem faz a apuração. Seu contador continua responsável por isso.',
    },
    {
      question: 'Sou contador. Posso participar?',
      answer:
        'Sim. Se você atende empresas no regime regular de CBS/IBS, entre na mesma lista de espera e conte um pouco sobre a sua carteira.',
    },
  ],
]

export default function Faq() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLHeadingElement>()
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section
      id="faq"
      className="w-full scroll-mt-[80px] px-6 py-16 md:px-[64px] md:py-[96px]"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-14">
        <h2
          ref={headerRef}
          className={`reveal-up text-center text-[36px] font-extrabold text-white ${headerVisible ? 'is-visible' : ''}`}
        >
          Perguntas frequentes
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
