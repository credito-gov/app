import { useScrollReveal } from '../hooks/useScrollReveal'

const TRANSACTIONS = [
  {
    period: 'Novembro/2025',
    origin: 'Nota de Entrada',
    tribute: 'CBS Retida',
    amount: 'R$ 48.910,22',
    status: null,
  },
  {
    period: 'Outubro/2025',
    origin: 'Faturamento',
    tribute: 'IBS Devido',
    amount: 'R$ 104.312,18',
    status: null,
  },
  {
    period: 'Setembro/2025',
    origin: 'Combustível',
    tribute: 'Crédito Presumido',
    amount: 'R$ 12.435,00',
    status: 'Pendente',
  },
  {
    period: 'Agosto/2025',
    origin: 'Exportação',
    tribute: 'Diferimento CBS',
    amount: 'R$ 108.677,78',
    status: null,
  },
]

export default function DashboardShowcase() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>()
  const { ref: cardRef, isVisible: cardVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section className="w-full bg-[#060a13] px-6 py-16 md:px-[64px] md:py-[96px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-14">
        <div
          ref={headerRef}
          className={`reveal-up flex flex-col items-center gap-4 text-center ${headerVisible ? 'is-visible' : ''}`}
        >
          <div className="rounded-full border border-[rgba(4,120,87,0.5)] bg-[rgba(4,120,87,0.15)] px-3 py-[6px]">
            <p className="text-[11px] font-bold text-[#10b981] uppercase">Painel de Controle</p>
          </div>
          <h2 className="text-[36px] font-extrabold text-white">
            Seus créditos estruturados e sob controle
          </h2>
          <p className="max-w-[540px] text-[16px] text-[#94a3b8]">
            Esqueça arquivos soltos no drive. Centralize toda a gestão fiscal de sua operação em
            um dashboard auditável.
          </p>
        </div>

        <div
          ref={cardRef}
          className={`reveal-up w-full overflow-hidden rounded-[16px] border border-[#1e293b] bg-[#0e1524] ${cardVisible ? 'is-visible' : ''}`}
          style={{ transitionDelay: '150ms' }}
        >
          <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0c121e] p-5">
            <p className="text-[14px] font-bold text-white">Transações de Crédito Recentes</p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="flex gap-4 border-b border-[#1e293b] bg-[#0c121e] px-6 py-3 text-[11px] font-bold text-[#64748b]">
                <p className="flex-1">PERÍODO DE APURAÇÃO</p>
                <p className="w-[120px]">ORIGEM</p>
                <p className="w-[150px]">TRIBUTO</p>
                <p className="w-[150px]">VALOR BRUTO</p>
                <p className="w-[120px]">STATUS</p>
              </div>

              {TRANSACTIONS.map((tx) => (
                <div
                  key={tx.period}
                  className="flex items-center gap-4 border-b border-[#1e293b] px-6 py-4 last:border-b-0"
                >
                  <p className="flex-1 text-[13px] font-semibold text-white">{tx.period}</p>
                  <p className="w-[120px] text-[13px] text-[#94a3b8]">{tx.origin}</p>
                  <p className="w-[150px] text-[13px] text-[#94a3b8]">{tx.tribute}</p>
                  <p className="w-[150px] text-[13px] font-bold text-white">{tx.amount}</p>
                  <div className="w-[120px]">
                    {tx.status && (
                      <span className="rounded-full border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.1)] px-[9px] py-[3px] text-[11px] font-semibold text-[#fbbf24]">
                        {tx.status}
                      </span>
                    )}
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
