import { useScrollReveal } from '../hooks/useScrollReveal'

const METRICS = [
  {
    number: 'R$ 4.2B',
    title: 'Em créditos identificados',
    description:
      'Auditados com precisão cirúrgica de acordo com a legislação do e-Social e IBS/CBS.',
  },
  {
    number: '1.840+',
    title: 'Empresas parceiras',
    description:
      'Desde startups de tecnologia aceleradas até indústrias tradicionais de embalagens.',
  },
  {
    number: '14 Dias',
    title: 'De teste totalmente grátis',
    description: 'Suba o seu certificado digital em segundos e confira se há crédito parado agora.',
  },
]

function MetricItem({ metric, index }: { metric: (typeof METRICS)[number]; index: number }) {
  const { ref: numberRef, isVisible: numberVisible } = useScrollReveal<HTMLParagraphElement>()
  const { ref: bodyRef, isVisible: bodyVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-2">
      <p
        ref={numberRef}
        className={`reveal-scale-bounce text-[56px] font-extrabold tracking-[-1.12px] text-[#10b981] ${numberVisible ? 'is-visible' : ''}`}
        style={{ transitionDelay: `${index * 150}ms` }}
      >
        {metric.number}
      </p>
      <div
        ref={bodyRef}
        className={`reveal-up flex flex-col items-start gap-2 ${bodyVisible ? 'is-visible' : ''}`}
        style={{ transitionDelay: `${index * 150 + 80}ms` }}
      >
        <p className="text-[18px] font-semibold text-white">{metric.title}</p>
        <p className="text-[14px] leading-[1.5] text-[#94a3b8]">{metric.description}</p>
      </div>
    </div>
  )
}

export default function Metrics() {
  return (
    <section
      className="w-full border-y border-[#1e293b] px-6 py-16 md:px-[64px] md:py-[96px]"
      style={{
        background:
          'radial-gradient(ellipse 900px 400px at 50% 50%, rgba(16,185,129,0.11), transparent 70%), rgb(10,15,29)',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-10 md:flex-row">
        {METRICS.map((metric, index) => (
          <MetricItem key={metric.number} metric={metric} index={index} />
        ))}
      </div>
    </section>
  )
}
