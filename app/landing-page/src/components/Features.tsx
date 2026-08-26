import checkCircle from '../assets/icon-check-circle.svg'
import { useScrollReveal } from '../hooks/useScrollReveal'

const FEATURES = [
  {
    title: 'Sincronização diária',
    description:
      'Varremos notas fiscais emitidas contra o seu CNPJ na virada do dia para garantir que nenhum centavo de crédito seja esquecido.',
    tag: 'Previsão sem esforço',
  },
  {
    title: 'Projeção de 90 dias',
    description:
      'Antecipe o que está programado para entrar no seu caixa e otimize o planejamento orçamentário da empresa de forma visual.',
    tag: 'Fluxo sob controle',
  },
  {
    title: 'Dois cliques para liquidar',
    description:
      'Abata débitos tributários diretamente com os saldos validados ou solicite a antecipação imediata com taxas reduzidas.',
    tag: 'Crédito vira dinheiro',
  },
]

function FeatureCard({ feature, index }: { feature: (typeof FEATURES)[number]; index: number }) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal-up flex w-full flex-1 flex-col items-start gap-5 rounded-[16px] border border-[#e2e8f0] bg-[#f8fafc] p-8 ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex size-10 items-center justify-center rounded-[8px] bg-[#10b981]">
        <img src={checkCircle} alt="" className="size-5" />
      </div>
      <div className="flex flex-col items-start gap-3">
        <p className="text-[20px] font-extrabold text-[#060a13]">{feature.title}</p>
        <p className="text-[14px] leading-[1.6] text-[#64748b]">{feature.description}</p>
      </div>
      <hr className="w-full border-t border-[#e2e8f0]" />
      <p className="text-[13px] font-bold text-[#059669]">{feature.tag}</p>
    </div>
  )
}

export default function Features() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section className="w-full bg-white px-6 py-16 md:px-[64px] md:py-[96px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-14">
        <div
          ref={headerRef}
          className={`reveal-up flex flex-col items-center gap-4 text-center ${headerVisible ? 'is-visible' : ''}`}
        >
          <div className="rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-[6px]">
            <p className="text-[11px] font-bold text-[#047857] uppercase">Vantagens Exclusivas</p>
          </div>
          <h2 className="text-[36px] font-extrabold text-[#060a13]">
            Três pilares de previsibilidade de caixa
          </h2>
        </div>

        <div className="flex w-full flex-col items-stretch gap-6 md:flex-row">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
