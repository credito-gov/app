import { useScrollReveal } from '../hooks/useScrollReveal'

const STEPS = [
  {
    number: '01',
    title: 'Conexão e-CNPJ imediata',
    description:
      'Com apenas uma autorização via e-CAC, nosso software sincroniza diretamente com a base da Receita Federal.',
  },
  {
    number: '02',
    title: 'Auditoria contínua',
    description:
      'Nosso motor de regras tributárias atualiza seus saldos de IBS/CBS diariamente, identificando desvios automaticamente.',
  },
  {
    number: '03',
    title: 'Compensação rápida',
    description:
      'Com os saldos validados, você abate guias de impostos ou solicita antecipação de caixa sem burocracia.',
  },
]

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal-scale flex w-full flex-1 flex-col items-start gap-6 rounded-[16px] border border-[#e2e8f0] bg-white p-8 ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <p className="text-[32px] font-extrabold text-[#10b981]">{step.number}</p>
      <div className="flex flex-col items-start gap-2">
        <p className="text-[18px] font-bold text-[#060a13]">{step.title}</p>
        <p className="text-[14px] leading-[1.5] text-[#64748b]">{step.description}</p>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section className="w-full bg-[#f8fafc] px-6 py-16 md:px-[64px] md:py-[96px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16">
        <div
          ref={headerRef}
          className={`reveal-up flex flex-col items-center gap-4 text-center ${headerVisible ? 'is-visible' : ''}`}
        >
          <div className="rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-[6px]">
            <p className="text-[11px] font-bold text-[#047857] uppercase">Fluxo Automático</p>
          </div>
          <h2 className="text-[36px] font-extrabold text-[#060a13]">
            Como funciona a auditoria diária
          </h2>
          <p className="max-w-[520px] text-[16px] text-[#64748b]">
            Uma apuração contínua e integrada que substitui processos retroativos demorados por
            dados em tempo real.
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-8 md:flex-row">
          {STEPS.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
