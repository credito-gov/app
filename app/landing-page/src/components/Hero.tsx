import heroChart from '../assets/hero-chart.svg'

export default function Hero() {
  return (
    <section className="w-full bg-[#f9fafb] px-6 pt-12 pb-16 md:px-[48px] md:pt-[72px] md:pb-[64px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 md:flex-row md:gap-[56px]">
        <div className="flex flex-1 flex-col items-start gap-5">
          <div className="flex items-center gap-[6px] rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-[10px] py-[5px]">
            <span className="size-[6px] rounded-full bg-[#10b981]" />
            <p className="text-[12px] font-semibold whitespace-nowrap text-[#047857]">
              Integrado à Receita Federal
            </p>
          </div>

          <h1 className="text-[46px] leading-[1.1] font-semibold tracking-[-1.38px] text-[#111827]">
            Pare de deixar crédito tributário parado na planilha.
          </h1>

          <p className="max-w-[480px] text-[17px] leading-[1.55] text-[#4b5563]">
            Sincronizamos com a Receita Federal todos os dias, mostramos exatamente quanto sua
            empresa tem de crédito de CBS/IBS e liberamos o caminho para compensar ou antecipar —
            sem depender de planilha.
          </p>

          <div className="flex flex-wrap items-start gap-[14px]">
            <a
              href="#testar-gratis"
              className="rounded-[6px] bg-[#10b981] px-[26px] py-[14px] text-[15px] font-semibold whitespace-nowrap text-white"
            >
              Ver meus créditos em 14 dias grátis
            </a>
            <a
              href="#agendar-demonstracao"
              className="rounded-[6px] border border-[#d1d5db] bg-white px-[26px] py-[14px] text-[15px] font-semibold whitespace-nowrap text-[#374151]"
            >
              Agendar demonstração
            </a>
          </div>

          <p className="text-[12.5px] text-[#6b7280]">
            Sem cartão de crédito. Sem contrato de fidelidade. Conecta pelo seu e-CNPJ.
          </p>
        </div>

        <div className="w-full flex-1 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white shadow-[0px_8px_24px_0px_rgba(0,0,0,0.08)]">
          <div className="flex w-full items-center gap-[6px] bg-[#f9fafb] px-[14px] py-[10px]">
            <span className="size-[9px] rounded-full bg-[#d1d5db]" />
            <span className="size-[9px] rounded-full bg-[#d1d5db]" />
            <span className="size-[9px] rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex w-full flex-col items-start gap-[14px] p-5">
            <div className="flex flex-col items-start gap-1">
              <p className="text-[11px] font-semibold tracking-[0.6px] text-[#9ca3af] uppercase">
                Saldo de créditos
              </p>
              <p className="text-[34px] font-semibold text-[#111827]">R$ 274.335,18</p>
            </div>

            <div className="flex w-full items-start gap-3">
              <div className="flex flex-1 flex-col items-start gap-[2px] rounded-[8px] border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-[10px]">
                <p className="text-[11px] font-semibold text-[#047857]">Validados</p>
                <p className="text-[15px] font-semibold text-[#111827]">R$ 152.430</p>
              </div>
              <div className="flex flex-1 flex-col items-start gap-[2px] rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-3 py-[10px]">
                <p className="text-[11px] font-semibold text-[#b45309]">Pendentes</p>
                <p className="text-[15px] font-semibold text-[#111827]">R$ 121.905</p>
              </div>
            </div>

            <img src={heroChart} alt="" className="h-[90px] w-full max-w-[360px]" />

            <div className="flex w-full items-center justify-between rounded-[8px] bg-[#065f46] px-4 py-3">
              <div className="flex flex-col items-start gap-[2px]">
                <p className="text-[13px] font-semibold whitespace-nowrap text-white">
                  Compensar R$ 50.000 de CBS/IBS
                </p>
                <p className="text-[11px] whitespace-nowrap text-white/70">Vence em 20/01</p>
              </div>
              <span className="rounded-[6px] bg-[#10b981] px-3 py-[6px] text-[12px] font-semibold whitespace-nowrap text-white">
                Compensar
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
