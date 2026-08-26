import { useScrollReveal } from '../hooks/useScrollReveal'

const PLAN_BENEFITS = [
  'Sincronização diária estruturada com e-CAC',
  'Projeções completas para até 90 dias',
  'Gestão ilimitada de e-CNPJs',
  'Auditorias retroativas inclusas',
]

export default function Pricing() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>()
  const { ref: cardRef, isVisible: cardVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section className="w-full bg-[#f8fafc] px-6 py-16 md:px-[64px] md:py-[96px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-14">
        <div
          ref={headerRef}
          className={`reveal-up flex flex-col items-center gap-4 text-center ${headerVisible ? 'is-visible' : ''}`}
        >
          <div className="rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-[6px]">
            <p className="text-[11px] font-bold text-[#047857] uppercase">Preço Transparente</p>
          </div>
          <h2 className="text-[36px] font-extrabold text-[#060a13]">
            Um único plano que cresce com a sua empresa
          </h2>
        </div>

        <div
          ref={cardRef}
          className={`reveal-scale w-full max-w-[560px] overflow-hidden rounded-[16px] border-2 border-[#10b981] bg-white shadow-[0px_4px_12px_0px_rgba(16,185,129,0.12)] ${cardVisible ? 'is-visible' : ''}`}
        >
          <div className="bg-[#ecfdf5] px-6 py-3">
            <p className="text-[12px] font-bold text-[#059669]">CREDITOGOV PRO</p>
          </div>

          <div className="flex flex-col items-start gap-7 p-10">
            <div className="flex items-baseline gap-1">
              <p className="text-[48px] font-extrabold text-[#060a13]">Sob Consulta</p>
              <p className="text-[16px] text-[#64748b]">/mês</p>
            </div>

            <p className="text-[14px] text-[#64748b]">
              + taxa de sucesso regressiva sobre o crédito compensado ou antecipado no mês de
              apuração.
            </p>

            <hr className="w-full border-t border-[#e5e7eb]" />

            <div className="flex w-full flex-col items-start gap-4">
              {PLAN_BENEFITS.map((benefit) => (
                <p key={benefit} className="text-[14px] font-semibold text-[#060a13]">
                  {benefit}
                </p>
              ))}
            </div>

            <a
              href="#testar-gratis"
              className="w-full rounded-[8px] bg-[#10b981] p-4 text-center text-[15px] font-bold text-[#060a13]"
            >
              Começar agora 14 dias grátis
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
