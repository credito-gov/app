const ITEMS = [
  {
    problemTitle: 'Planilha manual',
    problemText:
      'Toda apuração depende de alguém consolidar notas fiscais e cruzar débitos à mão, todo mês.',
    solutionTitle: 'O número se atualiza sozinho às 00:05',
    solutionText:
      'Sincronizamos com a Receita Federal todo dia de madrugada — o saldo já está pronto quando você abre o painel.',
  },
  {
    problemTitle: 'Crédito prescreve sem ninguém ver',
    problemText:
      'Créditos com prazo de uso passam despercebidos até vencer, e a empresa simplesmente perde o direito.',
    solutionTitle: 'Cada crédito mostra os dias restantes',
    solutionText:
      'O painel avisa quando um crédito está perto de expirar, com o valor exposto para você agir a tempo.',
  },
  {
    problemTitle: 'Falta caixa com crédito parado no papel',
    problemText:
      'A empresa tem crédito tributário de sobra, mas o caixa aperta porque esse valor não vira dinheiro rápido.',
    solutionTitle: 'Compensar ou antecipar em dois cliques',
    solutionText:
      'Use o crédito para abater um débito de CBS/IBS ou antecipe com uma fintech parceira, direto no painel.',
  },
]

export default function ProblemSolution() {
  return (
    <section className="w-full bg-white px-6 py-16 md:px-[48px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[12px] font-semibold tracking-[0.96px] text-[#9ca3af] uppercase">
            O dia a dia hoje
          </p>
          <h2 className="text-[32px] leading-[1.2] font-semibold tracking-[-0.8px] text-[#111827]">
            O crédito existe. Só não aparece pra ninguém.
          </h2>
        </div>

        <div className="flex w-full flex-col items-start gap-5 md:flex-row">
          {ITEMS.map((item, index) => (
            <div
              key={item.problemTitle}
              className="w-full flex-1 overflow-hidden rounded-[8px] border border-[#e5e7eb]"
            >
              <div className="flex flex-col items-start gap-[6px] border-b border-[#fee2e2] bg-[#fef2f2] p-5">
                <p className="text-[11px] font-bold tracking-[0.44px] text-[#b91c1c]">
                  PROBLEMA {String(index + 1).padStart(2, '0')}
                </p>
                <p className="text-[16px] font-semibold text-[#111827]">{item.problemTitle}</p>
                <p className="text-[13.5px] leading-[1.45] text-[#7f1d1d]">{item.problemText}</p>
              </div>
              <div className="flex flex-col items-start gap-[6px] bg-white p-5">
                <p className="text-[11px] font-bold tracking-[0.44px] text-[#047857]">
                  COM O CREDITOGOV
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
