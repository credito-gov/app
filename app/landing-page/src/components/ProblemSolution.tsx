const ITEMS = [
  {
    problemTitle: 'Crédito que depende do fornecedor',
    problemText:
      'O crédito da compra só pode ser usado quando o imposto do fornecedor é quitado. Hoje ninguém acompanha isso nota a nota.',
    solutionTitle: 'Confirmado e pendente, separados',
    solutionText:
      'Separar o crédito de CBS já confirmado do que ainda depende do fornecedor.',
  },
  {
    problemTitle: 'Planilha manual',
    problemText:
      'Saber de qual compra veio cada crédito exige cruzar notas e pagamentos à mão, todo mês.',
    solutionTitle: 'A origem de cada crédito',
    solutionText: 'Mostrar a compra, a nota e o fornecedor de cada valor.',
  },
  {
    problemTitle: 'Caixa sem previsão',
    problemText:
      'O imposto destacado na nota não aparece como dinheiro a receber, e o caixa das próximas semanas fica no escuro.',
    solutionTitle: 'Projeção do que deve ser confirmado',
    solutionText:
      'Projetar quanto crédito deve ser confirmado nas próximas semanas, com base nas compras já feitas.',
  },
]

export default function ProblemSolution() {
  return (
    <section id="problema" className="w-full scroll-mt-[80px] bg-white px-6 py-16 md:px-[48px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[12px] font-semibold tracking-[0.96px] text-[#9ca3af] uppercase">
            O dia a dia hoje
          </p>
          <h2 className="text-[32px] leading-[1.2] font-semibold tracking-[-0.8px] text-[#111827]">
            O crédito existe. Só não aparece pra ninguém.
          </h2>
        </div>

        <div className="flex w-full flex-col items-stretch gap-5 md:flex-row">
          {ITEMS.map((item, index) => (
            <div
              key={item.problemTitle}
              className="flex w-full flex-1 flex-col overflow-hidden rounded-[8px] border border-[#e5e7eb]"
            >
              <div className="flex shrink-0 flex-col items-start gap-[6px] border-b border-[#fee2e2] bg-[#fef2f2] p-5">
                <p className="text-[11px] font-bold tracking-[0.44px] text-[#b91c1c]">
                  PROBLEMA {String(index + 1).padStart(2, '0')}
                </p>
                <p className="text-[16px] font-semibold text-[#111827]">{item.problemTitle}</p>
                <p className="text-[13.5px] leading-[1.45] text-[#7f1d1d]">{item.problemText}</p>
              </div>
              <div className="flex flex-1 flex-col items-start gap-[6px] bg-white p-5">
                <p className="text-[11px] font-bold tracking-[0.44px] text-[#047857]">
                  O QUE O CREDITOGOV VAI FAZER
                </p>
                <p className="text-[14px] font-semibold text-[#111827]">{item.solutionTitle}</p>
                <p className="text-[13.5px] leading-[1.45] text-[#4b5563]">{item.solutionText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
