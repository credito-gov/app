import { useScrollReveal } from '../hooks/useScrollReveal'

const TRANSACTIONS = [
  {
    supplier: 'Fornecedor A',
    invoice: 'NF-e 10.482',
    tribute: 'CBS',
    amount: 'R$ 4.910,22',
    status: 'Confirmado',
  },
  {
    supplier: 'Fornecedor B',
    invoice: 'NF-e 3.117',
    tribute: 'IBS',
    amount: 'R$ 1.312,18',
    status: 'Pendente',
  },
  {
    supplier: 'Fornecedor C',
    invoice: 'NF-e 88.205',
    tribute: 'CBS',
    amount: 'R$ 2.435,00',
    status: 'Pendente',
  },
  {
    supplier: 'Fornecedor A',
    invoice: 'NF-e 10.517',
    tribute: 'IBS',
    amount: 'R$ 677,78',
    status: 'Confirmado',
  },
]

export default function DashboardShowcase() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>()
  const { ref: cardRef, isVisible: cardVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section
      id="painel"
      className="w-full scroll-mt-[80px] bg-[#060a13] px-6 py-16 md:px-[64px] md:py-[96px]"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-14">
        <div
          ref={headerRef}
          className={`reveal-up flex flex-col items-center gap-4 text-center ${headerVisible ? 'is-visible' : ''}`}
        >
          <div className="rounded-full border border-[rgba(4,120,87,0.5)] bg-[rgba(4,120,87,0.15)] px-3 py-[6px]">
            <p className="text-[11px] font-bold text-[#10b981] uppercase">Prévia do painel</p>
          </div>
          <h2 className="text-[36px] font-extrabold text-white">
            Cada crédito com a compra, a nota e o fornecedor
          </h2>
          <p className="max-w-[540px] text-[16px] text-[#94a3b8]">
            O painel em desenvolvimento vai mostrar de onde vem cada crédito de CBS e IBS e o que
            ainda depende do fornecedor.
          </p>
        </div>

        <div
          ref={cardRef}
          className={`reveal-up w-full overflow-hidden rounded-[16px] border border-[#1e293b] bg-[#0e1524] ${cardVisible ? 'is-visible' : ''}`}
          style={{ transitionDelay: '150ms' }}
        >
          <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0c121e] p-5">
            <p className="text-[14px] font-bold text-white">Créditos por compra</p>
            <span className="rounded-full border border-[#1e293b] bg-[#1e293b] px-[9px] py-[3px] text-[11px] font-semibold text-[#94a3b8]">
              Exemplo ilustrativo
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="flex gap-4 border-b border-[#1e293b] bg-[#0c121e] px-6 py-3 text-[11px] font-bold text-[#64748b]">
                <p className="flex-1">FORNECEDOR</p>
                <p className="w-[120px]">NOTA</p>
                <p className="w-[150px]">TRIBUTO</p>
                <p className="w-[150px]">CRÉDITO</p>
                <p className="w-[120px]">STATUS</p>
              </div>

              {TRANSACTIONS.map((tx) => (
                <div
                  key={tx.invoice}
                  className="flex items-center gap-4 border-b border-[#1e293b] px-6 py-4 last:border-b-0"
                >
                  <p className="flex-1 text-[13px] font-semibold text-white">{tx.supplier}</p>
                  <p className="w-[120px] text-[13px] text-[#94a3b8]">{tx.invoice}</p>
                  <p className="w-[150px] text-[13px] text-[#94a3b8]">{tx.tribute}</p>
                  <p className="w-[150px] text-[13px] font-bold text-white">{tx.amount}</p>
                  <div className="w-[120px]">
                    <span
                      className={
                        tx.status === 'Confirmado'
                          ? 'rounded-full border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.1)] px-[9px] py-[3px] text-[11px] font-semibold text-[#10b981]'
                          : 'rounded-full border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.1)] px-[9px] py-[3px] text-[11px] font-semibold text-[#fbbf24]'
                      }
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
